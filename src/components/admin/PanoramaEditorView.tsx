'use client'

/**
 * PanoramaEditorView.tsx
 *
 * Thin Payload admin view wrapper — identical pattern to FloorPlanEditorView.
 * Register in panorama-view collection config:
 *
 *   admin: {
 *     components: {
 *       views: {
 *         list: {
 *           Component: '/components/admin/PanoramaEditorView#PanoramaEditorView',
 *         },
 *       },
 *     },
 *   },
 */

import React from 'react'
import { PanoramaEditorClient } from './PanoramaEditorClient'

export function PanoramaEditorView() {
    return (
        <div style={{ padding: '24px 28px', maxWidth: 1200 }}>
            <PanoramaEditorClient />
        </div>
    )
}

export default PanoramaEditorView