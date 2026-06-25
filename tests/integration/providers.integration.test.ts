import { describe, expect, it } from "vitest"

import { http } from "@/lib/http"

const run = process.env.RUN_INTEGRATION_TESTS === "true" ? describe : describe.skip

run("public provider connectivity", () => {
  it("can access the official Hacker News API", async () => {
    const ids = await http<number[]>("https://hacker-news.firebaseio.com/v0/topstories.json")
    expect(ids.length).toBeGreaterThan(0)
  })
})
