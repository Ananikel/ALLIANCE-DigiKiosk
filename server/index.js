import express from "express"
import cors from "cors"
import pg from "pg"
import crypto from "crypto"
import path from "path"
import { fileURLToPath } from "url"
import jwt from "jsonwebtoken"

const app = express()
const port = process.env.PORT || 3000

const DATABASE_URL = process.env.DATABASE_URL
const JWT_SECRET = process.env.JWT_SECRET

if (!DATABASE_URL) {
  console.error("DATABASE_URL manquant")
  process.exit(1)
}
if (!JWT_SECRET) {
  console.error("JWT_SECRET manquant")
  process.exit(1)
}

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
})

app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map(s => s.trim()) : true,
  credentials: true
}))
app.use(express.json({ limit: "1mb" }))

function uuid() {
  return crypto.randomUUID()
}

function scryptHash(pin, salt) {
  const buf = crypto.scryptSync(pin, salt, 32)
  return buf.toString("hex")
}

async function writeAudit({ actorId, actorName, action, entityType, entityId, metadata }) {
  await pool.query(
    `insert into audit_logs (id, actor_id, actor_name, action, entity_type, entity_id, metadata)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [uuid(), actorId || null, actorName || "SYSTEM", action, entityType, entityId || null, metadata || null]
  )
}

async function getUserPerms(roleId) {
  const { rows } = await pool.query(
    `select p.code
     from role_permissions rp
     join permissions p on p.id = rp.permission_id
     where rp.role_id = $1`,
    [roleId]
  )
  return rows.map(r => r.code)
}

function requireAuth(req, res, next) {
  const h = req.headers.authorization || ""
  const token = h.startsWith("Bearer ") ? h.slice(7) : ""
  if (!token) return res.status(401).json({ error: "UNAUTHORIZED" })
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ error: "UNAUTHORIZED" })
  }
}

function requirePerm(code) {
  return (req, res, next) => {
    const perms = req.user?.perms || []
    if (!perms.includes(code)) return res.status(403).json({ error: "FORBIDDEN" })
    next()
  }
}

function assertPinFormat(pin) {
  return /^[a-z]{2}-\d{6}$/i.test(pin || "")
}

function moneyInt(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return null
  if (!Number.isInteger(v)) return null
  return v
}

app.get("/api/health", async (req, res) => {
  const r = await pool.query("select 1 as ok")
  res.json({ ok: true, db: r.rows[0].ok === 1 })
})

app.post("/api/auth/login", async (req, res) => {
  const pin = String(req.body?.pin || "").trim()
  if (!assertPinFormat(pin)) return res.status(400).json({ error: "INVALID_PIN_FORMAT" })

  const { rows } = await pool.query(
    `select id, full_name, pin_salt, pin_hash, role_id, is_active, is_root, ui_language, ui_theme
     from staff_users
     where lower(full_name) is not null and is_active = true`,
    []
  )

  const found = []
  for (const u of rows) {
    const h = scryptHash(pin, u.pin_salt)
    if (h === u.pin_hash) found.push(u)
  }
  if (found.length !== 1) {
    await writeAudit({ actorName: "UNKNOWN", action: "LOGIN_FAIL", entityType: "AUTH", metadata: { reason: "BAD_PIN" } })
    return res.status(401).json({ error: "BAD_CREDENTIALS" })
  }

  const user = found[0]
  const perms = await getUserPerms(user.role_id)
  const token = jwt.sign(
    {
      sub: user.id,
      name: user.full_name,
      role_id: user.role_id,
      is_root: user.is_root,
      perms,
      ui_language: user.ui_language,
      ui_theme: user.ui_theme
    },
    JWT_SECRET,
    { expiresIn: "12h" }
  )

  await writeAudit({ actorId: user.id, actorName: user.full_name, action: "LOGIN_OK", entityType: "AUTH" })

  res.json({
    token,
    user: {
      id: user.id,
      full_name: user.full_name,
      role_id: user.role_id,
      is_root: user.is_root,
      ui_language: user.ui_language,
      ui_theme: user.ui_theme,
      perms
    }
  })
})

app.get("/api/auth/me", requireAuth, async (req, res) => {
  res.json({ user: req.user })
})

app.patch("/api/staff/me/preferences", requireAuth, async (req, res) => {
  const ui_language = req.body?.ui_language === "en" ? "en" : "fr"
  const ui_theme = req.body?.ui_theme === "blue-dark" ? "blue-dark" : "light"

  await pool.query(
    `update staff_users
     set ui_language = $1, ui_theme = $2, updated_at = now()
     where id = $3`,
    [ui_language, ui_theme, req.user.sub]
  )

  await writeAudit({
    actorId: req.user.sub,
    actorName: req.user.name,
    action: "UPDATE_PREFERENCES",
    entityType: "STAFF",
    entityId: req.user.sub,
    metadata: { ui_language, ui_theme }
  })

  res.json({ ok: true, ui_language, ui_theme })
})

app.get("/api/staff", requireAuth, requirePerm("STAFF_MANAGE"), async (req, res) => {
  const { rows } = await pool.query(
    `select id, full_name, role_id, is_active, is_root, ui_language, ui_theme, created_at, updated_at
     from staff_users
     order by created_at desc`
  )
  res.json(rows)
})

app.post("/api/staff", requireAuth, requirePerm("STAFF_MANAGE"), async (req, res) => {
  const full_name = String(req.body?.full_name || "").trim()
  const pin = String(req.body?.pin || "").trim()
  const role_id = String(req.body?.role_id || "").trim()

  if (!full_name) return res.status(400).json({ error: "FULL_NAME_REQUIRED" })
  if (!assertPinFormat(pin)) return res.status(400).json({ error: "INVALID_PIN_FORMAT" })
  if (!role_id) return res.status(400).json({ error: "ROLE_REQUIRED" })

  const salt = crypto.randomBytes(16).toString("hex")
  const hash = scryptHash(pin, salt)
  const id = uuid()

  await pool.query(
    `insert into staff_users (id, full_name, pin_salt, pin_hash, role_id, is_active, is_root)
     values ($1, $2, $3, $4, $5, true, false)`,
    [id, full_name, salt, hash, role_id]
  )

  await writeAudit({
    actorId: req.user.sub,
    actorName: req.user.name,
    action: "CREATE_STAFF",
    entityType: "STAFF",
    entityId: id,
    metadata: { full_name, role_id }
  })

  res.json({ id })
})

app.patch("/api/staff/:id", requireAuth, requirePerm("STAFF_MANAGE"), async (req, res) => {
  const id = req.params.id
  const { rows: existingRows } = await pool.query(`select id, is_root from staff_users where id = $1`, [id])
  if (existingRows.length === 0) return res.status(404).json({ error: "NOT_FOUND" })
  if (existingRows[0].is_root) return res.status(403).json({ error: "ROOT_PROTECTED" })

  const full_name = req.body?.full_name ? String(req.body.full_name).trim() : null
  const role_id = req.body?.role_id ? String(req.body.role_id).trim() : null
  const is_active = typeof req.body?.is_active === "boolean" ? req.body.is_active : null

  await pool.query(
    `update staff_users
     set full_name = coalesce($1, full_name),
         role_id = coalesce($2, role_id),
         is_active = coalesce($3, is_active),
         updated_at = now()
     where id = $4`,
    [full_name, role_id, is_active, id]
  )

  await writeAudit({
    actorId: req.user.sub,
    actorName: req.user.name,
    action: "UPDATE_STAFF",
    entityType: "STAFF",
    entityId: id,
    metadata: { full_name, role_id, is_active }
  })

  res.json({ ok: true })
})

app.post("/api/staff/:id/reset-pin", requireAuth, requirePerm("STAFF_MANAGE"), async (req, res) => {
  const id = req.params.id
  const pin = String(req.body?.pin || "").trim()

  const { rows } = await pool.query(`select id, is_root from staff_users where id = $1`, [id])
  if (rows.length === 0) return res.status(404).json({ error: "NOT_FOUND" })
  if (rows[0].is_root) return res.status(403).json({ error: "ROOT_PROTECTED" })
  if (!assertPinFormat(pin)) return res.status(400).json({ error: "INVALID_PIN_FORMAT" })

  const salt = crypto.randomBytes(16).toString("hex")
  const hash = scryptHash(pin, salt)

  await pool.query(
    `update staff_users set pin_salt = $1, pin_hash = $2, updated_at = now() where id = $3`,
    [salt, hash, id]
  )

  await writeAudit({
    actorId: req.user.sub,
    actorName: req.user.name,
    action: "RESET_PIN",
    entityType: "STAFF",
    entityId: id
  })

  res.json({ ok: true })
})

app.get("/api/roles", requireAuth, requirePerm("ROLES_MANAGE"), async (req, res) => {
  const { rows } = await pool.query(`select id, name, description from roles order by name asc`)
  res.json(rows)
})

app.get("/api/catalog/items", requireAuth, requirePerm("CATALOG_VIEW"), async (req, res) => {
  const { rows } = await pool.query(
    `select *
     from catalog_items
     order by updated_at desc`
  )
  res.json(rows)
})

app.post("/api/catalog/items", requireAuth, requirePerm("CATALOG_EDIT"), async (req, res) => {
  const item_type = req.body?.item_type === "SERVICE" ? "SERVICE" : "PRODUCT"
  const name = String(req.body?.name || "").trim()
  const category = String(req.body?.category || "").trim()
  const description = req.body?.description ? String(req.body.description).trim() : null
  const price_amount = moneyInt(req.body?.price_amount)
  const cost_amount = req.body?.cost_amount === null || req.body?.cost_amount === undefined ? null : moneyInt(req.body.cost_amount)
  const sku = req.body?.sku ? String(req.body.sku).trim() : null

  if (!name) return res.status(400).json({ error: "NAME_REQUIRED" })
  if (!category) return res.status(400).json({ error: "CATEGORY_REQUIRED" })
  if (price_amount === null) return res.status(400).json({ error: "PRICE_INVALID" })

  const track_stock = item_type === "PRODUCT" ? Boolean(req.body?.track_stock) : false
  const stock_qty = item_type === "PRODUCT" && track_stock ? moneyInt(req.body?.stock_qty ?? 0) : 0
  if (stock_qty === null || stock_qty < 0) return res.status(400).json({ error: "STOCK_INVALID" })

  const id = uuid()
  await pool.query(
    `insert into catalog_items
     (id, sku, item_type, name, category, description, price_amount, cost_amount, track_stock, stock_qty, is_active)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)`,
    [id, sku, item_type, name, category, description, price_amount, cost_amount, track_stock, stock_qty]
  )

  await writeAudit({
    actorId: req.user.sub,
    actorName: req.user.name,
    action: "CREATE_ITEM",
    entityType: "ITEM",
    entityId: id,
    metadata: { item_type, name, category, price_amount, track_stock, stock_qty }
  })

  res.json({ id })
})

app.patch("/api/catalog/items/:id", requireAuth, requirePerm("CATALOG_EDIT"), async (req, res) => {
  const id = req.params.id
  const { rows: ex } = await pool.query(`select * from catalog_items where id = $1`, [id])
  if (ex.length === 0) return res.status(404).json({ error: "NOT_FOUND" })

  const before = ex[0]

  const name = req.body?.name ? String(req.body.name).trim() : null
  const description = req.body?.description === undefined ? null : String(req.body.description || "").trim()
  const price_amount = req.body?.price_amount === undefined ? null : moneyInt(req.body.price_amount)
  const is_active = typeof req.body?.is_active === "boolean" ? req.body.is_active : null

  let track_stock = req.body?.track_stock === undefined ? null : Boolean(req.body.track_stock)
  let stock_qty = req.body?.stock_qty === undefined ? null : moneyInt(req.body.stock_qty)

  if (before.item_type === "SERVICE") {
    track_stock = false
    stock_qty = 0
  } else {
    if (track_stock === null) track_stock = before.track_stock
    if (track_stock && (stock_qty === null || stock_qty < 0)) return res.status(400).json({ error: "STOCK_INVALID" })
    if (!track_stock) stock_qty = 0
  }

  if (price_amount !== null && price_amount === null) return res.status(400).json({ error: "PRICE_INVALID" })

  await pool.query(
    `update catalog_items
     set name = coalesce($1, name),
         description = $2,
         price_amount = coalesce($3, price_amount),
         is_active = coalesce($4, is_active),
         track_stock = $5,
         stock_qty = $6,
         updated_at = now()
     where id = $7`,
    [name, description, price_amount, is_active, track_stock, stock_qty, id]
  )

  const { rows: afterRows } = await pool.query(`select * from catalog_items where id = $1`, [id])

  await writeAudit({
    actorId: req.user.sub,
    actorName: req.user.name,
    action: "UPDATE_ITEM",
    entityType: "ITEM",
    entityId: id,
    metadata: { before, after: afterRows[0] }
  })

  res.json({ ok: true })
})

app.post("/api/catalog/items/:id/adjust-stock", requireAuth, requirePerm("INVENTORY_ADJUST"), async (req, res) => {
  const id = req.params.id
  const delta = moneyInt(req.body?.delta)
  const reason = String(req.body?.reason || "ADJUSTMENT").trim()

  if (delta === null || delta === 0) return res.status(400).json({ error: "DELTA_INVALID" })

  const { rows } = await pool.query(`select id, track_stock, item_type from catalog_items where id = $1`, [id])
  if (rows.length === 0) return res.status(404).json({ error: "NOT_FOUND" })
  if (rows[0].item_type !== "PRODUCT" || !rows[0].track_stock) return res.status(400).json({ error: "STOCK_NOT_TRACKED" })

  await pool.query(`update catalog_items set stock_qty = stock_qty + $1, updated_at = now() where id = $2`, [delta, id])
  await pool.query(
    `insert into inventory_movements (id, item_id, delta, reason, ref_type, created_by)
     values ($1, $2, $3, $4, 'MANUAL', $5)`,
    [uuid(), id, delta, reason, req.user.sub]
  )

  await writeAudit({
    actorId: req.user.sub,
    actorName: req.user.name,
    action: "ADJUST_STOCK",
    entityType: "ITEM",
    entityId: id,
    metadata: { delta, reason }
  })

  res.json({ ok: true })
})

app.post("/api/pos/checkout", requireAuth, requirePerm("POS_CHECKOUT"), async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : []
  const payments = Array.isArray(req.body?.payments) ? req.body.payments : []
  const customer_name = req.body?.customer_name ? String(req.body.customer_name).trim() : null
  const notes = req.body?.notes ? String(req.body.notes).trim() : null
  const language = req.body?.language === "en" ? "en" : "fr"

  if (items.length === 0) return res.status(400).json({ error: "EMPTY_CART" })

  const client = await pool.connect()
  try {
    await client.query("begin")

    const itemIds = items.map(i => i.item_id)
    const dbItems = (await client.query(`select * from catalog_items where id = any($1::uuid[])`, [itemIds])).rows
    const byId = new Map(dbItems.map(r => [r.id, r]))

    let subtotal = 0
    const saleItems = []

    for (const it of items) {
      const row = byId.get(it.item_id)
      if (!row) throw new Error("ITEM_NOT_FOUND")
      if (!row.is_active) throw new Error("ITEM_INACTIVE")

      const qty = moneyInt(it.qty)
      if (qty === null || qty <= 0) throw new Error("QTY_INVALID")

      if (row.item_type === "PRODUCT" && row.track_stock) {
        if (row.stock_qty < qty) throw new Error("OUT_OF_STOCK")
      }

      const unit = row.price_amount
      const line = unit * qty
      subtotal += line

      saleItems.push({
        item_id: row.id,
        item_name_snapshot: row.name,
        unit_price_amount: unit,
        qty,
        line_total_amount: line,
        track_stock_snapshot: row.item_type === "PRODUCT" && row.track_stock
      })
    }

    const discount_amount = 0
    const tax_amount = 0
    const total = subtotal - discount_amount + tax_amount

    let paid = 0
    const salePayments = []
    for (const p of payments) {
      const amount = moneyInt(p.amount)
      if (amount === null || amount <= 0) continue
      const method = String(p.method || "").trim()
      if (!["CASH", "MOBILE_MONEY", "CARD"].includes(method)) continue
      const provider = p.provider ? String(p.provider).trim() : null
      const reference = p.reference ? String(p.reference).trim() : null
      paid += amount
      salePayments.push({ method, provider, reference, amount })
    }

    const status = paid >= total ? "PAID" : paid > 0 ? "PARTIAL" : "DRAFT"
    const change_amount = paid > total && salePayments.some(x => x.method === "CASH") ? (paid - total) : 0

    const saleId = uuid()
    const saleNo = `ADK-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999999)).padStart(6, "0")}`

    await client.query(
      `insert into sales
       (id, sale_no, status, subtotal_amount, discount_amount, tax_amount, total_amount, paid_amount, change_amount, customer_name, notes, language, created_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [saleId, saleNo, status, subtotal, discount_amount, tax_amount, total, paid, change_amount, customer_name, notes, language, req.user.sub]
    )

    for (const si of saleItems) {
      await client.query(
        `insert into sale_items
         (id, sale_id, item_id, item_name_snapshot, unit_price_amount, qty, line_total_amount, track_stock_snapshot)
         values ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [uuid(), saleId, si.item_id, si.item_name_snapshot, si.unit_price_amount, si.qty, si.line_total_amount, si.track_stock_snapshot]
      )

      if (si.track_stock_snapshot) {
        await client.query(`update catalog_items set stock_qty = stock_qty - $1, updated_at = now() where id = $2`, [si.qty, si.item_id])
        await client.query(
          `insert into inventory_movements (id, item_id, delta, reason, ref_type, ref_id, created_by)
           values ($1,$2,$3,'SALE','SALE',$4,$5)`,
          [uuid(), si.item_id, -si.qty, saleId, req.user.sub]
        )
      }
    }

    for (const sp of salePayments) {
      await client.query(
        `insert into sale_payments (id, sale_id, method, provider, reference, amount, received_by)
         values ($1,$2,$3,$4,$5,$6,$7)`,
        [uuid(), saleId, sp.method, sp.provider, sp.reference, sp.amount, req.user.sub]
      )
    }

    const receiptNo = `R-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999999)).padStart(6, "0")}`
    const payload = {
      brand: "ALLIANCE DigiKiosk",
      sale_no: saleNo,
      receipt_no: receiptNo,
      language,
      created_at: new Date().toISOString(),
      cashier: req.user.name,
      items: saleItems,
      totals: { subtotal, discount_amount, tax_amount, total, paid, change_amount },
      payments: salePayments,
      customer_name,
      notes
    }

    await client.query(
      `insert into receipts (id, sale_id, receipt_no, payload_json)
       values ($1,$2,$3,$4)`,
      [uuid(), saleId, receiptNo, payload]
    )

    await client.query("commit")

    await writeAudit({
      actorId: req.user.sub,
      actorName: req.user.name,
      action: "CHECKOUT_SALE",
      entityType: "SALE",
      entityId: saleId,
      metadata: { sale_no: saleNo, total_amount: total, paid_amount: paid, status }
    })

    res.json({ ok: true, sale_id: saleId, sale_no: saleNo, receipt: payload })
  } catch (e) {
    await client.query("rollback")
    const msg = String(e?.message || "FAIL")
    res.status(400).json({ error: msg })
  } finally {
    client.release()
  }
})

app.get("/api/pos/sales/today", requireAuth, requirePerm("SALES_VIEW"), async (req, res) => {
  const { rows } = await pool.query(
    `select id, sale_no, status, total_amount, paid_amount, created_at
     from sales
     where created_at >= date_trunc('day', now())
     order by created_at desc
     limit 200`
  )
  res.json(rows)
})

app.get("/api/audit", requireAuth, requirePerm("AUDIT_VIEW"), async (req, res) => {
  const { rows } = await pool.query(
    `select *
     from audit_logs
     order by created_at desc
     limit 200`
  )
  res.json(rows)
})

app.get("/api/dashboard/today", requireAuth, requirePerm("SALES_VIEW"), async (req, res) => {
  const sales = await pool.query(
    `select
       coalesce(sum(total_amount), 0) as total_sales,
       coalesce(count(*), 0) as sales_count
     from sales
     where created_at >= date_trunc('day', now()) and status in ('PAID','PARTIAL')`
  )

  const low = await pool.query(
    `select id, name, stock_qty
     from catalog_items
     where item_type = 'PRODUCT' and track_stock = true and is_active = true and stock_qty <= 3
     order by stock_qty asc
     limit 50`
  )

  res.json({
    total_sales: Number(sales.rows[0].total_sales || 0),
    sales_count: Number(sales.rows[0].sales_count || 0),
    low_stock: low.rows
  })
})

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

if (process.env.NODE_ENV === "production") {
  const dist = path.join(__dirname, "..", "dist")
  app.use(express.static(dist))

  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(dist, "index.html"))
  })
}

app.listen(port, () => {
  console.log(`ALLIANCE DigiKiosk API on ${port}`)
})
