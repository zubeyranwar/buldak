import type { CollectionConfig } from 'payload'

export const Anniversary: CollectionConfig = {
    slug: 'anniversary',
    admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'isConfirmed'],
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
            name: 'isConfirmed',
            type: 'checkbox',
            defaultValue: false,
            required: true,
        },
    ],
}
