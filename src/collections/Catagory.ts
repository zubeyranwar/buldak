import type { CollectionConfig } from 'payload'

export const Catagory: CollectionConfig = {
    slug: 'catagory',
    admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'description', 'isDefault'],
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
            name: 'description',
            type: 'textarea',
        },
        {
            name: 'isDefault',
            type: 'checkbox',
            defaultValue: false,
            label: 'Default',
        },
    ],
}
