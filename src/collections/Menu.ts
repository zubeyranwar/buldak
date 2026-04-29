import type { CollectionConfig } from 'payload'

export const Menu: CollectionConfig = {
    slug: 'menu',
    admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'catagory', 'price', 'date'],
    },
    access: {
        read: () => true,
    },
    fields: [
        {
            name: 'title',
            type: 'text',
            required: true,
        },
        {
            name: 'description',
            type: 'text',
            required: false,
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
            name: 'catagory',
            type: 'relationship',
            relationTo: 'catagory' as never,
            required: true,
            hasMany: false,
        },
        {
            name: 'price',
            type: 'number',
            required: true,
            min: 0,
            admin: {
                step: 0.01,
            },
        },
        {
            name: 'oldPrice',
            type: 'number',
            min: 0,
            admin: {
                step: 0.01,
            },
        },
        {
            name: 'volume',
            type: 'text',
            required: false,
        },
        {
            name: 'label',
            type: 'text',
            required: false,
        },
        {
            name: 'kcal',
            type: 'number',
            required: false,
            min: 0,
        },
        {
            name: 'image',
            type: 'upload',
            relationTo: 'media',
            required: true,
        },
        {
            name: 'slug',
            type: 'text',
            required: true,
            unique: true,
            index: true,
        },
        {
            name: 'content',
            type: 'richText',
            required: false,
        },
    ],
}
