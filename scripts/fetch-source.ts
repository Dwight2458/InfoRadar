import { FetchTrigger } from "../src/generated/prisma/client"
import { getDb } from "../src/lib/db"
import { fetchSource } from "../src/services/fetch-service"
import { getSourceBySlug } from "../src/services/source-service"

async function main() {
  const slug = process.argv[2]
  if (!slug) throw new Error("Usage: npm run fetch:source -- <source-slug>")

  const source = await getSourceBySlug(slug)
  if (!source) throw new Error(`Source not found: ${slug}`)

  const result = await fetchSource(source, { trigger: FetchTrigger.CLI })
  console.log(JSON.stringify(result, null, 2))
  if (result.status === "FAILED") process.exitCode = 1
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => getDb().$disconnect())
