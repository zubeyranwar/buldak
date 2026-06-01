/**
 * lib/timezone.ts
 *
 * Single source of truth for timezone handling.
 * All dates in this app are treated as Africa/Addis_Ababa (UTC+3).
 *
 * Rule:
 *   - User picks "June 1, 7:00 PM"
 *   - We treat that as 19:00 UTC+3 = 16:00 UTC
 *   - Stored in DB as "2026-06-01T16:00:00.000Z"
 *   - Queried the same way so overlap checks are consistent
 */

export const APP_TZ_OFFSET_HOURS = 3 // UTC+3

/**
 * Converts a local date string + 12h/24h time string into a UTC ISO string
 * treating the input as UTC+3 (Addis Ababa).
 *
 * Examples:
 *   toUTCIso("2026-06-01", "7:00 PM")  → "2026-06-01T16:00:00.000Z"
 *   toUTCIso("2026-06-01", "19:00")    → "2026-06-01T16:00:00.000Z"
 *   toUTCIso("Today",      "7:00 PM")  → "2026-06-01T16:00:00.000Z" (if today is June 1)
 *   toUTCIso("Tomorrow",   "08:00 AM") → "2026-06-02T05:00:00.000Z"
 */
export function toUTCIso(rawDate: string, rawTime: string): string | null {
    const date = resolveDate(rawDate)
    const time = resolveTime(rawTime)
    if (!date || !time) return null

    // Build as UTC+3: subtract 3 hours to get UTC
    const [h, m] = time.split(':').map(Number)
    if (isNaN(h) || isNaN(m)) return null

    const local = new Date(`${date}T${time}:00`)
    if (isNaN(local.getTime())) return null

    // Shift: local UTC+3 → UTC
    const utcMs = local.getTime() - APP_TZ_OFFSET_HOURS * 60 * 60 * 1000
    return new Date(utcMs).toISOString()
}

/**
 * Resolves "Today" / "Tomorrow" labels to "YYYY-MM-DD" in UTC+3.
 * Already-formatted dates ("2026-06-01") pass through unchanged.
 */
export function resolveDate(raw: string): string {
    const lower = raw.trim().toLowerCase()

    if (lower === 'today') {
        return localDateString(new Date())
    }
    if (lower === 'tomorrow') {
        const d = new Date()
        d.setDate(d.getDate() + 1)
        return localDateString(d)
    }

    // Already a date string
    return raw.trim()
}

/**
 * Normalises "7:00 PM" → "19:00", passes "19:00" unchanged.
 */
export function resolveTime(raw: string): string {
    const trimmed = raw.trim()
    const ampm = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
    if (ampm) {
        let h = parseInt(ampm[1], 10)
        const m = ampm[2]
        const meridiem = ampm[3].toUpperCase()
        if (meridiem === 'AM' && h === 12) h = 0
        if (meridiem === 'PM' && h !== 12) h += 12
        return `${String(h).padStart(2, '0')}:${m}`
    }
    return trimmed
}

/**
 * Returns "YYYY-MM-DD" for a Date object using UTC+3 local time.
 */
function localDateString(d: Date): string {
    const utcMs = d.getTime()
    const localMs = utcMs + APP_TZ_OFFSET_HOURS * 60 * 60 * 1000
    const local = new Date(localMs)
    const yyyy = local.getUTCFullYear()
    const mm = String(local.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(local.getUTCDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
}

/**
 * Formats a UTC ISO string back to a human-readable UTC+3 time.
 * e.g. "2026-06-01T16:00:00.000Z" → "7:00 PM"
 */
export function formatLocalTime(isoUtc: string): string {
    const utcMs = new Date(isoUtc).getTime()
    const localMs = utcMs + APP_TZ_OFFSET_HOURS * 60 * 60 * 1000
    const local = new Date(localMs)
    const h = local.getUTCHours()
    const m = String(local.getUTCMinutes()).padStart(2, '0')
    const meridiem = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 === 0 ? 12 : h % 12
    return `${h12}:${m} ${meridiem}`
}