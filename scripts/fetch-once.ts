import { FetchTrigger } from "../src/generated/prisma/client"
import { getDb } from "../src/lib/db"
import { fetchAllEnabled } from "../src/services/fetch-service"

async function main() {
  const results = await fetchAllEnabled(FetchTrigger.CLI)
  console.table(
    results.map((result) => ({
      source: result.sourceSlug,
      status: result.status,
      fetched: result.fetched,
      inserted: result.inserted,
      updated: result.updated,
      duplicates: result.duplicates,
      error: result.error ?? "",
    }))
  )

  if (results.every((result) => result.status === "FAILED")) process.exitCode = 1
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => getDb().$disconnect())
