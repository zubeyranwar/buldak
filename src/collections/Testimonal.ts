import type { CollectionConfig } from 'payload'

export const Testimonal: CollectionConfig = {
    slug: 'testimonal',
    admin: {
        useAsTitle: 'videoUrl',
        defaultColumns: ['videoUrl', 'coverImage'],
    },
    access: {
        read: () => true,
    },
    fields: [
        {
            name: 'videoUrl',
            type: 'text',
            required: true,
            admin: {
                description: 'TikTok or Instagram post/reel URL',
            },
        },
        {
            name: 'coverImage',
            type: 'upload',
            relationTo: 'media',
            admin: {
                description: 'Fallback thumbnail shown before embed loads',
            },
        },
    ],
}