import { createHash } from "node:crypto"

const trackingParams = new Set([
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "ref",
  "source",
])

export function canonicalizeUrl(value: string) {
  try {
    const url = new URL(value.trim())
    url.hash = ""
    url.hostname = url.hostname.toLowerCase()
    if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, "")
    for (const key of [...url.searchParams.keys()]) {
      if (key.toLowerCase().startsWith("utm_") || trackingParams.has(key.toLowerCase())) {
        url.searchParams.delete(key)
      }
    }
    url.searchParams.sort()
    return url.toString().replace(/\/$/, "")
  } catch {
    return value.trim()
  }
}

export function normalizeTitle(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\p{P}\p{S}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex")
}

export function buildDedupeKeys(title: string, url: string) {
  const canonicalUrl = canonicalizeUrl(url)
  const normalizedTitle = normalizeTitle(title)
  return {
    canonicalUrl,
    normalizedTitle,
    urlHash: sha256(canonicalUrl),
    titleHash: sha256(normalizedTitle),
  }
}
