import type { CollectionConfig } from 'payload'

export const Testimonal: CollectionConfig = {
    slug: 'testimonal',
    admin: {
        useAsTitle: 'quote',
        defaultColumns: ['quote', 'coverImage', 'videoUrl'],
    },
    access: {
        read: () => true,
    },
    fields: [
        {
            name: 'quote',
            type: 'text',
            required: true,
        },
        {
            name: 'coverImage',
            type: 'upload',
            relationTo: 'media',
        },
        {
            name: 'videoUrl',
            type: 'text',
        },
    ],
}
