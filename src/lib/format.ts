import dayjs from "dayjs"

export function formatDate(value?: Date | string | null, includeTime = true) {
  if (!value) return "—"
  return dayjs(value).format(includeTime ? "YYYY-MM-DD HH:mm" : "YYYY-MM-DD")
}

export function formatTime(value?: Date | string | null) {
  if (!value) return "—"
  return dayjs(value).format("HH:mm")
}

export function formatDuration(milliseconds?: number | null) {
  if (milliseconds === null || milliseconds === undefined) return "—"
  if (milliseconds < 1_000) return `${milliseconds}ms`
  const seconds = Math.round(milliseconds / 1_000)
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

export function score(value?: number | null) {
  return value === null || value === undefined ? "—" : Math.round(value).toString()
}
