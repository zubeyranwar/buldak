import type { CollectionConfig } from 'payload'

type RelationshipValue = string | number | { id?: string | number | null } | null | undefined
type BookedChairValue = { table?: RelationshipValue }
type ReservationDoc = {
    id?: string | number
    reservationDate?: string
    duration?: number | null
    reservedTables?: RelationshipValue[] | null
    bookedChairs?: BookedChairValue[] | null
}

function relationId(value: RelationshipValue): string | null {
    if (typeof value === 'object' && value !== null) {
        return value.id ? String(value.id) : null
    }
    return value ? String(value) : null
}

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
        // ── Prevent double-booking whole tables at the same time ───────────────
        beforeValidate: [
            async ({ data, req, operation, originalDoc }) => {
                if (!data?.reservationDate) return data

                const incomingTableIds = new Set<string>()

                if (Array.isArray(data?.reservedTables)) {
                    for (const table of data.reservedTables) {
                        const tableId = relationId(table)
                        if (tableId) incomingTableIds.add(String(tableId))
                    }
                }

                // Backward compatibility: old clients may still submit bookedChairs.
                if (Array.isArray(data?.bookedChairs)) {
                    for (const bc of data.bookedChairs) {
                        const tableId = relationId(bc.table)
                        if (tableId) incomingTableIds.add(String(tableId))
                    }
                }

                if (incomingTableIds.size === 0) return data

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
                const others = (existing.docs as ReservationDoc[]).filter((doc) =>
                    operation === 'update' ? String(doc.id) !== String(originalDoc?.id) : true
                )

                // Build a set of occupied table IDs for the overlapping period
                const occupied = new Set<string>()

                for (const res of others) {
                    const resStart = new Date(res.reservationDate as string).getTime()
                    const resDuration = (res.duration ?? 90) * 60 * 1000
                    const resEnd = resStart + resDuration

                    if (incomingStart < resEnd && incomingEnd > resStart) {
                        if (Array.isArray(res.reservedTables)) {
                            for (const table of res.reservedTables) {
                                const tableId = relationId(table)
                                if (tableId) occupied.add(String(tableId))
                            }
                        }

                        // Old reservations still block the whole table.
                        if (Array.isArray(res.bookedChairs)) {
                            for (const bc of res.bookedChairs) {
                                const tableId = relationId(bc.table)
                                if (tableId) occupied.add(String(tableId))
                            }
                        }
                    }
                }

                const conflicts: string[] = []
                for (const tableId of incomingTableIds) {
                    if (occupied.has(tableId)) conflicts.push(`Table ${tableId}`)
                }

                if (conflicts.length > 0) {
                    throw new Error(
                        `Double-booking conflict: the following tables are already reserved for this time: ${conflicts.join(', ')}`
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
            name: 'partySize',
            type: 'number',
            label: 'Party Size',
            required: true,
            defaultValue: 2,
            min: 1,
            admin: {
                description: 'Number of guests in this reservation',
            },
        },
        {
            name: 'reservedTables',
            type: 'relationship',
            relationTo: 'table-layout',
            hasMany: true,
            label: 'Reserved Tables',
            required: true,
            admin: {
                description: 'Whole table(s) reserved for this party',
            },
        },

        // ── Legacy booked chairs ──────────────────────────────────────────────
        {
            name: 'bookedChairs',
            type: 'array',
            label: 'Legacy Booked Chairs',
            required: false,
            admin: {
                description: 'Legacy field. New reservations reserve whole tables instead.',
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
