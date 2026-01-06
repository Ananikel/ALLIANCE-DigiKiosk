import crypto from "crypto"
import { randomUUID } from "crypto"

function scryptHash(pin, salt) {
  const buf = crypto.scryptSync(pin, salt, 32)
  return buf.toString("hex")
}

function makePinHash(pin) {
  const salt = crypto.randomBytes(16).toString("hex")
  const hash = scryptHash(pin, salt)
  return { salt, hash }
}

export async function seedDb(pool) {
  const roles = [
    { id: "00000000-0000-0000-0000-000000000010", name: "ROOT", description: "Full access" },
    { id: "00000000-0000-0000-0000-000000000020", name: "MANAGER", description: "Manage inventory, staff, analytics" },
    { id: "00000000-0000-0000-0000-000000000030", name: "CASHIER", description: "POS and transfers" },
    { id: "00000000-0000-0000-0000-000000000040", name: "IT_AGENT", description: "Tickets and IT services" },
    { id: "00000000-0000-0000-0000-000000000050", name: "VIEWER", description: "Read only" }
  ]

  for (const r of roles) {
    await pool.query(
      `insert into roles (id, name, description)
       values ($1, $2, $3)
       on conflict (name) do update set description = excluded.description`,
      [r.id, r.name, r.description]
    )
  }

  const perms = [
    ["POS_VIEW", "Access POS"],
    ["POS_CHECKOUT", "Checkout sales"],
    ["POS_VOID", "Void sales"],
    ["SALES_VIEW", "View sales"],
    ["SALES_EXPORT", "Export sales"],
    ["CATALOG_VIEW", "View catalog"],
    ["CATALOG_EDIT", "Create or edit items"],
    ["INVENTORY_ADJUST", "Adjust stock"],
    ["EXPENSES_VIEW", "View expenses"],
    ["EXPENSES_CREATE", "Create expenses"],
    ["EXPENSES_EXPORT", "Export expenses"],
    ["TRANSFERS_VIEW", "View transfers"],
    ["TRANSFERS_CREATE", "Create transfers"],
    ["TRANSFERS_CANCEL", "Cancel transfers"],
    ["TRANSFERS_EXPORT", "Export transfers"],
    ["TICKETS_VIEW", "View tickets"],
    ["TICKETS_CREATE", "Create tickets"],
    ["TICKETS_ASSIGN", "Assign tickets"],
    ["TICKETS_CLOSE", "Close tickets"],
    ["TICKETS_EXPORT", "Export tickets"],
    ["STAFF_MANAGE", "Manage staff"],
    ["ROLES_MANAGE", "Manage roles and permissions"],
    ["AUDIT_VIEW", "View audit logs"],
    ["RESET_PARTIAL", "Partial reset"]
  ].map(([code, label]) => ({ id: randomUUID(), code, label }))

  for (const p of perms) {
    await pool.query(
      `insert into permissions (id, code, label)
       values ($1, $2, $3)
       on conflict (code) do update set label = excluded.label`,
      [p.id, p.code, p.label]
    )
  }

  const permIds = (await pool.query(`select id, code from permissions`)).rows
  const byCode = new Map(permIds.map(r => [r.code, r.id]))

  async function grant(roleName, codes) {
    const roleRow = (await pool.query(`select id from roles where name = $1`, [roleName])).rows[0]
    if (!roleRow) return
    const roleId = roleRow.id
    for (const c of codes) {
      const pid = byCode.get(c)
      if (!pid) continue
      await pool.query(
        `insert into role_permissions (role_id, permission_id)
         values ($1, $2)
         on conflict do nothing`,
        [roleId, pid]
      )
    }
  }

  const all = Array.from(byCode.keys())
  await grant("ROOT", all)

  await grant("MANAGER", [
    "POS_VIEW","POS_CHECKOUT","POS_VOID","SALES_VIEW","SALES_EXPORT",
    "CATALOG_VIEW","CATALOG_EDIT","INVENTORY_ADJUST",
    "EXPENSES_VIEW","EXPENSES_CREATE","EXPENSES_EXPORT",
    "TRANSFERS_VIEW","TRANSFERS_CREATE","TRANSFERS_CANCEL","TRANSFERS_EXPORT",
    "TICKETS_VIEW","TICKETS_CREATE","TICKETS_ASSIGN","TICKETS_CLOSE","TICKETS_EXPORT",
    "STAFF_MANAGE","AUDIT_VIEW"
  ])

  await grant("CASHIER", [
    "POS_VIEW","POS_CHECKOUT","SALES_VIEW",
    "CATALOG_VIEW",
    "TRANSFERS_VIEW","TRANSFERS_CREATE",
    "TICKETS_VIEW","TICKETS_CREATE"
  ])

  await grant("IT_AGENT", [
    "CATALOG_VIEW",
    "TICKETS_VIEW","TICKETS_CREATE","TICKETS_ASSIGN","TICKETS_CLOSE",
    "TRANSFERS_VIEW"
  ])

  await grant("VIEWER", [
    "SALES_VIEW","CATALOG_VIEW","EXPENSES_VIEW","TRANSFERS_VIEW","TICKETS_VIEW","AUDIT_VIEW"
  ])

  const catIds = [
    { id: "00000000-0000-0000-0000-000000001001", name: "Loyer" },
    { id: "00000000-0000-0000-0000-000000001002", name: "Internet" },
    { id: "00000000-0000-0000-0000-000000001003", name: "Transport" },
    { id: "00000000-0000-0000-0000-000000001004", name: "Fournitures" }
  ]
  for (const c of catIds) {
    await pool.query(
      `insert into expense_categories (id, name)
       values ($1, $2)
       on conflict (name) do nothing`,
      [c.id, c.name]
    )
  }

  const defaultServices = [
    "Photocopie",
    "Saisie de documents",
    "Impression noir et couleur",
    "Scanner",
    "Mise à jour WhatsApp sur téléphone",
    "Demande passeport en ligne",
    "Demande casier judiciaire en ligne",
    "Demande duplicata de nationalité en ligne",
    "Demande de prêt en ligne"
  ]

  for (const name of defaultServices) {
    await pool.query(
      `insert into catalog_items
       (id, item_type, name, category, price_amount, track_stock, stock_qty, is_active)
       values ($1, 'SERVICE', $2, 'IT_SERVICE', 0, false, 0, true)
       on conflict do nothing`,
      [randomUUID(), name]
    )
  }

  const rootId = process.env.ROOT_ADMIN_ID || "00000000-0000-0000-0000-000000000001"
  const rootName = process.env.ROOT_ADMIN_NAME || "ROOT"
  const rootPin = process.env.ROOT_ADMIN_PIN || "ra-000001"

  const rootRole = (await pool.query(`select id from roles where name = 'ROOT'`)).rows[0]
  const { salt, hash } = makePinHash(rootPin)

  await pool.query(
    `insert into staff_users
     (id, full_name, pin_salt, pin_hash, role_id, is_active, is_root, ui_language, ui_theme)
     values ($1, $2, $3, $4, $5, true, true, 'fr', 'light')
     on conflict (id) do update
     set full_name = excluded.full_name,
         role_id = excluded.role_id,
         is_active = true,
         is_root = true`,
    [rootId, rootName, salt, hash, rootRole.id]
  )
}
