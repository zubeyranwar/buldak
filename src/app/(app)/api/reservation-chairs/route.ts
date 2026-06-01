import { NextResponse } from 'next/server'

/**
 * GET /api/reservation-chairs
 *
 * Mirrors exactly what FloorPlanPicker does client-side — calls /api/reservation
 * directly (no Payload auth context needed, collection is read: () => true)
 * then filters overlapping reservations and returns booked chairIds per table.
 */

export async function GET(req: Request) {
    try {
        const { searchParams, origin } = new URL(req.url)
        const dateParam = searchParams.get('date')
        const durationMin = parseInt(searchParams.get('duration') ?? '90', 10)

        if (!dateParam) return NextResponse.json({ chairs: {} })

        const slotStart = new Date(dateParam).getTime()
        const slotEnd = slotStart + durationMin * 60 * 1000

        if (isNaN(slotStart)) return NextResponse.json({ chairs: {} })

        // ── Call /api/reservation directly — same as FloorPlanPicker ─────────
        const res = await fetch(
            `${origin}/api/reservation?where[status][not_equals]=cancelled&limit=500&depth=1`,
            { headers: { 'Content-Type': 'application/json' } }
        )

        if (!res.ok) {
            console.error('[reservation-chairs] /api/reservation returned', res.status)
            return NextResponse.json({ chairs: {} })
        }

        const data = await res.json()

        // ── Same overlap logic as FloorPlanPicker ─────────────────────────────
        const chairs: Record<string, string[]> = {}

        for (const reservation of data.docs ?? []) {
            const resStart = new Date(reservation.reservationDate).getTime()
            const resDuration = (reservation.duration ?? 90) * 60 * 1000
            const resEnd = resStart + resDuration

            // Skip non-overlapping — identical condition to FloorPlanPicker
            if (slotStart >= resEnd || slotEnd <= resStart) continue

            for (const bc of reservation.bookedChairs ?? []) {
                const tableId = typeof bc.table === 'object'
                    ? String(bc.table?.id ?? '')
                    : String(bc.table ?? '')

                if (!tableId || !bc.chairId) continue

                if (!chairs[tableId]) chairs[tableId] = []
                if (!chairs[tableId].includes(bc.chairId)) {
                    chairs[tableId].push(bc.chairId)
                }
            }
        }

        return NextResponse.json({ chairs })

    } catch (err) {
        console.error('[reservation-chairs]', err)
        return NextResponse.json({ chairs: {} }, { status: 500 })
    }
}