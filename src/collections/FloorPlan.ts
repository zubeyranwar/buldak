import type { CollectionConfig } from 'payload'

export const FloorPlan: CollectionConfig = {
    slug: 'floor-plan',
    admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'updatedAt'],
        group: 'Restaurant System',
    },
    access: {
        read: () => true,
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
        },
        {
            name: 'backgroundImage',
            type: 'upload',
            relationTo: 'media',
            required: false,
        },
        {
            name: 'canvasWidth',
            type: 'number',
            defaultValue: 1100,
        },
        {
            name: 'canvasHeight',
            type: 'number',
            defaultValue: 700,
        },
        // ── Theme ─────────────────────────────────────────────────────────────
        {
            name: 'theme',
            type: 'group',
            label: 'Theme Colors',
            fields: [
                {
                    name: 'tableFillColor',
                    type: 'text',
                    defaultValue: '#d4a96a',
                    admin: { description: 'Hex or CSS color for table fill' },
                },
                {
                    name: 'chairFillColor',
                    type: 'text',
                    defaultValue: '#a8c5a0',
                    admin: { description: 'Hex or CSS color for available chairs' },
                },
                {
                    name: 'textFillColor',
                    type: 'text',
                    defaultValue: '#374151',
                    admin: { description: 'Hex or CSS color for text labels' },
                },
                {
                    name: 'selectionColor',
                    type: 'text',
                    defaultValue: '#3b82f6',
                    admin: { description: 'Hex or CSS color for selected items' },
                },
                {
                    name: 'bookedColor',
                    type: 'text',
                    defaultValue: '#ef4444',
                    admin: { description: 'Hex or CSS color for booked/unavailable tables' },
                },
            ],
        },
    ],
}
