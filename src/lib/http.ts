import { ofetch } from "ofetch"

export const http = ofetch.create({
  timeout: 15_000,
  retry: 2,
  retryDelay: 750,
  retryStatusCodes: [408, 409, 425, 429, 500, 502, 503, 504],
  headers: {
    "user-agent": "InfoRadar/0.1 (+local research aggregator)",
  },
})

export async function fetchText(url: string, headers?: HeadersInit) {
  return http<string, "text">(url, { headers, responseType: "text" })
}
