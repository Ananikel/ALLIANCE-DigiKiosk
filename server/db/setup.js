import fs from "fs"
import path from "path"
import pg from "pg"
import { fileURLToPath } from "url"
import { seedDb } from "./seed.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error("DATABASE_URL manquant")
    process.exit(1)
  }

  const pool = new pg.Pool({ connectionString: url, ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false })

  const schemaPath = path.join(__dirname, "schema.sql")
  const schemaSql = fs.readFileSync(schemaPath, "utf-8")

  await pool.query(schemaSql)
  await seedDb(pool)

  await pool.end()
  console.log("DB setup OK")
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
