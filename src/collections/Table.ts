import type { CollectionConfig } from 'payload'

export const Table: CollectionConfig = {
    slug: 'table',
    admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'phone', 'date', 'time', 'numOfguests'],
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
            name: 'phone',
            type: 'text',
            required: true,
        },
        {
            name: 'date',
            type: 'date',
            required: true,
            admin: {
                date: {
                    pickerAppearance: 'dayOnly',
                },
            },
        },
        {
            name: 'time',
            type: 'text',
            required: true,
        },
        {
            name: 'numOfguests',
            type: 'number',
            required: false,
            defaultValue: 1,
            min: 1,
        },
    ],
}
