import type { CollectionConfig } from 'payload'

export const PanoramaView: CollectionConfig = {
    slug: 'panorama-view',
    admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'updatedAt'],
        group: 'Restaurant System',
        components: {
            views: {
                list: {
                    Component: '/components/admin/PanoramaEditorView#PanoramaEditorView',
                },
            },
        },
    },
    access: {
        read: () => true,
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
            admin: { description: 'e.g. "Main Restaurant Tour"' },
        },
        {
            name: 'linkedFloorPlan',
            type: 'relationship',
            relationTo: 'floor-plan',
            required: false,
            admin: { description: 'Optional — link to the matching 2D floor plan' },
        },

        // ── Scenes ────────────────────────────────────────────────────────────
        {
            name: 'scenes',
            type: 'array',
            label: 'Scenes',
            admin: {
                description: 'Each scene is one 360° panorama photo. Add one per zone/area.',
            },
            fields: [
                {
                    name: 'sceneId',
                    type: 'text',
                    required: true,
                    admin: {
                        description: 'URL-safe slug, e.g. "main-floor", "patio". Auto-set by editor.',
                    },
                },
                {
                    name: 'label',
                    type: 'text',
                    required: true,
                    admin: { description: 'Display name shown on the scene tab, e.g. "Main Floor"' },
                },
                {
                    name: 'panoramaImage',
                    type: 'upload',
                    relationTo: 'media',
                    required: false,
                    admin: { description: 'Equirectangular 360° photo (JPG/PNG, ideally 4096×2048px)' },
                },
                {
                    name: 'defaultYaw',
                    type: 'number',
                    defaultValue: 0,
                    admin: { description: 'Initial horizontal camera angle when scene loads (-180 → 180)' },
                },
                {
                    name: 'defaultPitch',
                    type: 'number',
                    defaultValue: 0,
                    admin: { description: 'Initial vertical camera angle when scene loads (-90 → 90)' },
                },

                // ── Hotspots — managed by editor only, hidden from Payload UI ─
                {
                    name: 'hotspots',
                    type: 'array',
                    label: 'Hotspots',
                    // FIX 1: Hide from Payload's own admin UI entirely.
                    // The custom editor manages these — Payload should not
                    // validate or render them in the raw form view.
                    admin: {
                        condition: () => false,
                    },
                    fields: [
                        {
                            name: 'key',
                            type: 'text',
                            required: false,   // FIX 2: no required fields inside hotspots
                        },
                        {
                            name: 'type',
                            type: 'select',
                            required: false,   // FIX 2
                            options: [
                                { label: 'Table', value: 'table' },
                                { label: 'Navigate', value: 'navigate' },
                            ],
                        },
                        {
                            name: 'yaw',
                            type: 'number',
                            defaultValue: 0,
                        },
                        {
                            name: 'pitch',
                            type: 'number',
                            defaultValue: 0,
                        },
                        // table hotspot fields
                        {
                            name: 'table',
                            type: 'relationship',
                            relationTo: 'table-layout',
                            required: false,   // FIX 2: must be false — nav hotspots have no table
                        },
                        {
                            name: 'tableNumber',
                            type: 'text',
                            required: false,
                        },
                        // navigate hotspot fields
                        {
                            name: 'targetSceneId',
                            type: 'text',
                            required: false,
                        },
                        {
                            name: 'targetSceneLabel',
                            type: 'text',
                            required: false,
                        },
                    ],
                },
            ],
        },
    ],
}