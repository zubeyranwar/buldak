import { NextResponse } from 'next/server'

/**
 * GET /api/panorama-availability
 *
 * Same fix as reservation-chairs — calls /api/reservation directly
 * instead of payload.find() so auth context is not needed.
 *
 * Query params:
 *   date     — ISO string for window start (default: now)
 *   window   — minutes to look ahead (default: 120)
 *   floorId  — optional, filter tables by floor plan
 *
 * Returns:
 * {
 *   asOf: string
 *   windowEnd: string
 *   tables: {
 *     [tableId: string]: {
 *       status: 'available' | 'partial' | 'booked' | 'inactive'
 *       bookedChairs: number
 *       totalChairs: number
 *       tableNumber: string
 *       nextFreeSlot: string | null
 *     }
 *   }
 * }
 */

export async function GET(req: Request) {
    try {
        const { searchParams, origin } = new URL(req.url)

        const dateParam = searchParams.get('date')
        const windowMin = parseInt(searchParams.get('window') ?? '120', 10)
        const floorId = searchParams.get('floorId')

        const windowStart = dateParam ? new Date(dateParam) : new Date()
        const windowEnd = new Date(windowStart.getTime() + windowMin * 60 * 1000)

        if (isNaN(windowStart.getTime())) {
            return NextResponse.json({ error: 'invalid date' }, { status: 400 })
        }

        // ── 1. Fetch all active tables via REST ───────────────────────────────
        const tableParams = new URLSearchParams({
            'where[isActive][equals]': 'true',
            limit: '500',
            depth: '1',
        })
        if (floorId) tableParams.set('where[floor][equals]', floorId)

        const tablesRes = await fetch(`${origin}/api/table-layout?${tableParams}`)
        const tablesData = await tablesRes.json()

        // tableId → { tableNumber, totalChairs }
        const tableMap: Record<string, { tableNumber: string; totalChairs: number }> = {}
        for (const t of tablesData.docs ?? []) {
            tableMap[String(t.id)] = {
                tableNumber: String(t.tableNumber ?? ''),
                totalChairs: Array.isArray(t.chairs) ? t.chairs.length : (t.capacity ?? 0),
            }
        }

        // ── 2. Fetch reservations via REST (same pattern as FloorPlanPicker) ──
        const res = await fetch(
            `${origin}/api/reservation?where[status][not_equals]=cancelled&limit=1000&depth=1`
        )
        const data = await res.json()

        const wsMs = windowStart.getTime()
        const weMs = windowEnd.getTime()

        // tableId → Set of booked chairIds in this window
        const bookedChairsByTable: Record<string, Set<string>> = {}
        // tableId → earliest reservation end time (for nextFreeSlot)
        const nextFreeByTable: Record<string, number> = {}

        for (const reservation of data.docs ?? []) {
            const resStart = new Date(reservation.reservationDate).getTime()
            const resDuration = (reservation.duration ?? 90) * 60 * 1000
            const resEnd = resStart + resDuration

            // Skip non-overlapping — identical to FloorPlanPicker
            if (wsMs >= resEnd || weMs <= resStart) continue

            for (const bc of reservation.bookedChairs ?? []) {
                const tableId = typeof bc.table === 'object'
                    ? String(bc.table?.id ?? '')
                    : String(bc.table ?? '')

                if (!tableId || !bc.chairId) continue

                if (!bookedChairsByTable[tableId]) {
                    bookedChairsByTable[tableId] = new Set()
                }
                bookedChairsByTable[tableId].add(String(bc.chairId))

                if (!nextFreeByTable[tableId] || resEnd < nextFreeByTable[tableId]) {
                    nextFreeByTable[tableId] = resEnd
                }
            }
        }

        // ── 3. Build response ─────────────────────────────────────────────────
        const tables: Record<string, {
            status: 'available' | 'partial' | 'booked' | 'inactive'
            bookedChairs: number
            totalChairs: number
            tableNumber: string
            nextFreeSlot: string | null
        }> = {}

        for (const [tableId, info] of Object.entries(tableMap)) {
            const booked = bookedChairsByTable[tableId]?.size ?? 0
            const total = info.totalChairs

            const status =
                total === 0 ? 'inactive'
                    : booked === 0 ? 'available'
                        : booked >= total ? 'booked'
                            : 'partial'

            const nextFreeMs = nextFreeByTable[tableId]
            tables[tableId] = {
                status,
                bookedChairs: booked,
                totalChairs: total,
                tableNumber: info.tableNumber,
                nextFreeSlot: nextFreeMs ? new Date(nextFreeMs).toISOString() : null,
            }
        }

        return NextResponse.json({
            asOf: windowStart.toISOString(),
            windowEnd: windowEnd.toISOString(),
            tables,
        })

    } catch (err) {
        console.error('[panorama-availability]', err)
        return NextResponse.json({ error: 'Failed to compute availability' }, { status: 500 })
    }
}