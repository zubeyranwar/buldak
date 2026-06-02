/**
 * lib/timezone.ts
 *
 * UTC+3 (Africa/Addis_Ababa) date handling.
 *
 * KEY INSIGHT from the working FloorPlanPicker:
 *   new Date(`${date}T${time24}:00`) — no Z suffix, no explicit timezone
 *   → browser parses as LOCAL time → in UTC+3 browser → 19:00 local = 16:00 UTC ✅
 *
 * toSlotMs mirrors this exactly, but works on both server and client
 * by being explicit about the UTC+3 offset instead of relying on browser locale.
 *
 * The date string from DateTimePicker may be "Today", "Tomorrow", 
 * "YYYY-MM-DD", or other formats — we handle all of them.
 */

export const TZ_OFFSET_MS = 3 * 60 * 60 * 1000 // UTC+3 = 3h in ms

/**
 * Normalises "7:00 PM" → "19:00", passes "19:00" through unchanged.
 * Identical to the inline logic in the old FloorPlanPicker.
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
 * Resolves "Today" / "Tomorrow" → "YYYY-MM-DD" using UTC+3 local date.
 * Already-formatted dates pass through unchanged.
 */
export function resolveDate(raw: string): string {
    const lower = raw.trim().toLowerCase()
    if (lower === 'today') {
        // Get current date in UTC+3
        const localMs = Date.now() + TZ_OFFSET_MS
        const d = new Date(localMs)
        const yyyy = d.getUTCFullYear()
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
        const dd = String(d.getUTCDate()).padStart(2, '0')
        return `${yyyy}-${mm}-${dd}`
    }
    if (lower === 'tomorrow') {
        const localMs = Date.now() + TZ_OFFSET_MS + 24 * 60 * 60 * 1000
        const d = new Date(localMs)
        const yyyy = d.getUTCFullYear()
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
        const dd = String(d.getUTCDate()).padStart(2, '0')
        return `${yyyy}-${mm}-${dd}`
    }
    return raw.trim()
}

/**
 * Converts local date + 12h/24h time into UTC milliseconds.
 *
 * This exactly mirrors what the working FloorPlanPicker did:
 *   new Date(`${forDate}T${time24}:00`).getTime()
 * but is timezone-safe (doesn't depend on browser locale).
 *
 * "2026-06-01" + "7:00 PM" (UTC+3) → 2026-06-01T16:00:00.000Z ms
 * "Today"      + "7:00 PM" (UTC+3) → same if today is June 1 in UTC+3
 */
export function toSlotMs(rawDate: string, rawTime: string): number | null {
    const dateStr = resolveDate(rawDate)    // "YYYY-MM-DD"
    const time24 = resolveTime(rawTime)    // "HH:MM"

    if (!dateStr || !time24) return null

    // Use the same trick as the old FloorPlanPicker:
    // parse as a no-timezone datetime string (interpreted as local by browsers)
    // then compensate for UTC+3 by subtracting the offset.
    //
    // new Date("2026-06-01T19:00:00") in a UTC+3 browser = 16:00 UTC
    // We replicate this without depending on browser locale:
    //   1. Parse as if UTC: Date.parse("2026-06-01T19:00:00Z") = 19:00 UTC
    //   2. Subtract 3h = 16:00 UTC ✅
    const isoAsIfUtc = `${dateStr}T${time24}:00Z`
    const ms = Date.parse(isoAsIfUtc)

    if (isNaN(ms)) return null

    // Subtract UTC+3 offset: treats the input time as UTC+3 local
    return ms - TZ_OFFSET_MS
}

/**
 * Full UTC ISO string for DB writes and API calls.
 * toUTCIso("2026-06-01", "7:00 PM") → "2026-06-01T16:00:00.000Z"
 */
export function toUTCIso(rawDate: string, rawTime: string): string | null {
    const ms = toSlotMs(rawDate, rawTime)
    if (ms === null) return null
    return new Date(ms).toISOString()
}