//@ts-nocheck
import type { CollectionConfig } from 'payload'

export const Reservation: CollectionConfig = {
    slug: 'reservation',
    admin: {
        useAsTitle: 'id',
        defaultColumns: ['customer__name', 'reservationDate', 'status', 'duration'],
        group: 'Restaurant',
    },
    access: {
        read: () => true,
    },
    hooks: {
        // ── Prevent double-booking the same chairId at the same time ───────────
        beforeValidate: [
            async ({ data, req, operation, id }) => {
                if (!data?.reservationDate || !Array.isArray(data?.bookedChairs)) return data
                if (data.bookedChairs.length === 0) return data

                const payload = req.payload
                const incomingStart = new Date(data.reservationDate).getTime()
                const durationMs = (data.duration ?? 90) * 60 * 1000
                const incomingEnd = incomingStart + durationMs

                // Find all confirmed/pending reservations in an overlapping window
                // We fetch a broad window and filter in JS to avoid complex date queries
                const windowStart = new Date(incomingStart - 12 * 60 * 60 * 1000).toISOString()
                const windowEnd = new Date(incomingEnd + 12 * 60 * 60 * 1000).toISOString()

                const existing = await payload.find({
                    collection: 'reservation',
                    where: {
                        and: [
                            { reservationDate: { greater_than_equal: windowStart } },
                            { reservationDate: { less_than_equal: windowEnd } },
                            { status: { not_in: ['cancelled'] } },
                        ],
                    },
                    limit: 500,
                    depth: 0,
                })

                // Exclude the current doc when updating
                const others = existing.docs.filter((doc: any) =>
                    operation === 'update' ? String(doc.id) !== String(id) : true
                )

                // Build a set of occupied (tableId:chairId) strings for the overlapping period
                const occupied = new Set<string>()

                for (const res of others) {
                    const resStart = new Date(res.reservationDate as string).getTime()
                    const resDuration = (res.duration ?? 90) * 60 * 1000
                    const resEnd = resStart + resDuration

                    // Check time overlap
                    if (incomingStart < resEnd && incomingEnd > resStart) {
                        // This reservation overlaps — collect its chairs
                        if (Array.isArray(res.bookedChairs)) {
                            for (const bc of res.bookedChairs) {
                                const tableId =
                                    typeof bc.table === 'object' ? bc.table?.id : bc.table
                                if (tableId && bc.chairId) {
                                    occupied.add(`${tableId}:${bc.chairId}`)
                                }
                            }
                        }
                    }
                }

                // Check incoming chairs against occupied set
                const conflicts: string[] = []
                for (const bc of data.bookedChairs) {
                    const tableId =
                        typeof bc.table === 'object' ? bc.table?.id : bc.table
                    if (tableId && bc.chairId) {
                        const key = `${tableId}:${bc.chairId}`
                        if (occupied.has(key)) {
                            conflicts.push(`Chair ${bc.chairId} at table ${tableId}`)
                        }
                    }
                }

                if (conflicts.length > 0) {
                    throw new Error(
                        `Double-booking conflict: the following seats are already reserved for this time: ${conflicts.join(', ')}`
                    )
                }

                return data
            },
        ],
    },
    fields: [
        // ── Customer ──────────────────────────────────────────────────────────
        {
            name: 'customer',
            type: 'group',
            label: 'Customer Details',
            fields: [
                {
                    name: 'name',
                    type: 'text',
                    required: true,
                },
                {
                    name: 'phone',
                    type: 'text',
                    required: true,
                },
                {
                    name: 'email',
                    type: 'email',
                    required: false,
                },
            ],
        },

        // ── Booking time ──────────────────────────────────────────────────────
        {
            name: 'reservationDate',
            type: 'date',
            required: true,
            admin: {
                date: {
                    pickerAppearance: 'dayAndTime',
                    displayFormat: 'MMM d, yyyy h:mm aa',
                },
                description: 'Date and start time of the reservation',
            },
        },
        {
            name: 'duration',
            type: 'number',
            required: false,
            defaultValue: 90,
            min: 15,
            admin: {
                description: 'Expected duration in minutes (default: 90)',
            },
        },

        // ── Booked chairs ─────────────────────────────────────────────────────
        {
            name: 'bookedChairs',
            type: 'array',
            label: 'Booked Chairs',
            required: false,
            admin: {
                description: 'The specific chairs reserved for this booking',
            },
            fields: [
                {
                    name: 'table',
                    type: 'relationship',
                    relationTo: 'table-layout',
                    required: true,
                    admin: { description: 'The table this chair belongs to' },
                },
                {
                    name: 'chairId',
                    type: 'text',
                    required: true,
                    admin: { description: 'The chair ID within the table (e.g. C1, C2)' },
                },
            ],
        },

        // ── Status ────────────────────────────────────────────────────────────
        {
            name: 'status',
            type: 'select',
            defaultValue: 'confirmed',
            options: [
                { label: 'Pending', value: 'pending' },
                { label: 'Confirmed', value: 'confirmed' },
                { label: 'Cancelled', value: 'cancelled' },
            ],
        },

        // ── Legacy / convenience ──────────────────────────────────────────────
        {
            name: 'notes',
            type: 'textarea',
            required: false,
            admin: { description: 'Internal notes for staff' },
        },
    ],
}