import type { CollectionConfig } from 'payload'

export const TableLayout: CollectionConfig = {
    slug: 'table-layout',
    admin: {
        useAsTitle: 'tableNumber',
        defaultColumns: ['tableNumber', 'type', 'capacity', 'floor'],
        group: 'Restaurant System',
        components: {
            views: {
                list: {
                    Component: '/components/admin/FloorPlanEditorView#FloorPlanEditorView',
                },
            },
        },
    },
    access: {
        read: () => true,
    },
    hooks: {
        beforeChange: [
            async ({ data, req, operation }) => {
                // Auto-assign tableNumber on create
                if (operation === 'create' && !data.tableNumber) {
                    const all = await req.payload.find({
                        collection: 'table-layout',
                        limit: 1000,
                        depth: 0,
                    })
                    const max = all.docs.reduce((acc: number, doc: any) => {
                        const n = parseInt(doc.tableNumber ?? '0', 10)
                        return n > acc ? n : acc
                    }, 0)
                    data.tableNumber = String(max + 1)
                }

                // Auto-assign chair IDs within the chairs array
                if (Array.isArray(data.chairs)) {
                    data.chairs = data.chairs.map((chair: any, idx: number) => ({
                        ...chair,
                        chairId: chair.chairId || `C${idx + 1}`,
                    }))
                }

                return data
            },
        ],
    },
    fields: [
        // ── Identity ──────────────────────────────────────────────────────────
        {
            name: 'tableNumber',
            type: 'text',
            required: false,
            unique: true,
            admin: { description: 'Auto-generated if left blank' },
        },
        {
            name: 'floor',
            type: 'relationship',
            relationTo: 'floor-plan',
            required: false,
            admin: { description: 'Which floor plan this table belongs to' },
        },
        {
            name: 'type',
            type: 'select',
            required: true,
            defaultValue: 'square',
            options: [
                { label: 'Square', value: 'square' },
                { label: 'Round', value: 'round' },
                { label: 'Rectangle', value: 'rectangle' },
            ],
        },
        {
            name: 'zone',
            type: 'select',
            required: false,
            options: [
                { label: 'Window', value: 'window' },
                { label: 'Main Floor', value: 'main-floor' },
                { label: 'Bar Area', value: 'bar-area' },
                { label: 'Patio', value: 'patio' },
                { label: 'Private', value: 'private' },
            ],
        },
        {
            name: 'capacity',
            type: 'number',
            required: false,
            defaultValue: 4,
            min: 1,
            admin: { description: 'Maximum number of seats at this table' },
        },

        // ── Canvas position / dimensions ──────────────────────────────────────
        {
            name: 'position',
            type: 'group',
            label: 'Canvas Position',
            fields: [
                {
                    name: 'x',
                    type: 'number',
                    required: true,
                    defaultValue: 100,
                },
                {
                    name: 'y',
                    type: 'number',
                    required: true,
                    defaultValue: 100,
                },
                {
                    name: 'rotation',
                    type: 'number',
                    defaultValue: 0,
                },
            ],
        },
        {
            name: 'width',
            type: 'number',
            defaultValue: 60,
        },
        {
            name: 'height',
            type: 'number',
            defaultValue: 60,
        },
        {
            name: 'isActive',
            type: 'checkbox',
            defaultValue: true,
        },

        // ── Embedded chairs ───────────────────────────────────────────────────
        {
            name: 'chairs',
            type: 'array',
            label: 'Chairs',
            admin: {
                description: 'Each chair is a seat at this table. IDs are auto-assigned (C1, C2, …).',
            },
            fields: [
                {
                    name: 'chairId',
                    type: 'text',
                    required: false,
                    admin: {
                        description: 'Unique chair ID within this table (e.g. C1). Auto-assigned.',
                        readOnly: true,
                    },
                },
                {
                    name: 'seatLabel',
                    type: 'text',
                    required: false,
                    admin: { description: 'Optional display label (e.g. Window Seat)' },
                },
                // Relative offset from the table center
                {
                    name: 'relativePosition',
                    type: 'group',
                    label: 'Relative Position (offset from table center)',
                    fields: [
                        {
                            name: 'x',
                            type: 'number',
                            defaultValue: 0,
                        },
                        {
                            name: 'y',
                            type: 'number',
                            defaultValue: 0,
                        },
                    ],
                },
            ],
        },
    ],
}