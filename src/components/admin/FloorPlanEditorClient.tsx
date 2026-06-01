'use client'

import React, { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

// ── KonvaCanvas loaded as one dynamic unit ────────────────────────────────────
const KonvaCanvas = dynamic(() => import('./KonvaCanvas'), {
    ssr: false,
    loading: () => (
        <div style={{ padding: '80px 60px', textAlign: 'center', color: '#6b7280' }}>
            Loading canvas…
        </div>
    ),
})

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EmbeddedChair {
    id: string          // Payload array row id
    chairId: string     // e.g. "C1"
    seatLabel?: string
    relativePosition: { x: number; y: number }
}

export interface CanvasTable {
    id: string
    tableNumber: string
    type: 'square' | 'round' | 'rectangle'
    zone: string
    capacity: number
    x: number
    y: number
    width: number
    height: number
    rotation: number
    isActive: boolean
    floorId: string | null
    chairs: EmbeddedChair[]
}

export interface FloorPlanTheme {
    tableFillColor: string
    chairFillColor: string
    textFillColor: string
    selectionColor: string
    bookedColor: string
}

// ── Map Payload docs → CanvasTable ────────────────────────────────────────────

function mapDoc(t: any): CanvasTable {
    return {
        id: String(t.id),
        tableNumber: t.tableNumber ?? '',
        type: t.type ?? 'square',
        zone: t.zone ?? '',
        capacity: t.capacity ?? 4,
        x: t.position?.x ?? t.xPos ?? 100,
        y: t.position?.y ?? t.yPos ?? 100,
        width: t.width ?? 60,
        height: t.height ?? 60,
        rotation: t.position?.rotation ?? t.rotation ?? 0,
        isActive: t.isActive ?? true,
        floorId:
            typeof t.floor === 'object' ? String(t.floor?.id ?? '') || null : String(t.floor ?? '') || null,
        chairs: (t.chairs ?? []).map((c: any) => ({
            id: String(c.id),
            chairId: c.chairId ?? '',
            seatLabel: c.seatLabel ?? '',
            relativePosition: {
                x: c.relativePosition?.x ?? 0,
                y: c.relativePosition?.y ?? 0,
            },
        })),
    }
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function apiPost(body: Record<string, unknown>): Promise<any> {
    const res = await fetch('/api/table-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
    return res.json()
}

async function apiPatch(id: string, body: Record<string, unknown>): Promise<void> {
    await fetch(`/api/table-layout/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
}

async function apiDelete(id: string): Promise<void> {
    await fetch(`/api/table-layout/${id}`, { method: 'DELETE' })
}

// ── Default theme ─────────────────────────────────────────────────────────────

const DEFAULT_THEME: FloorPlanTheme = {
    tableFillColor: '#d4a96a',
    chairFillColor: '#a8c5a0',
    textFillColor: '#374151',
    selectionColor: '#3b82f6',
    bookedColor: '#ef4444',
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FloorPlanEditorClient() {
    const [tables, setTables] = useState<CanvasTable[]>([])
    const [floorPlan, setFloorPlan] = useState<{
        id: string
        imageUrl: string
        canvasWidth: number
        canvasHeight: number
        theme: FloorPlanTheme
    } | null>(null)

    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [zoom, setZoom] = useState(1)

    // Loading states per button
    const [loadingSquare, setLoadingSquare] = useState(false)
    const [loadingRound, setLoadingRound] = useState(false)
    const [loadingRect, setLoadingRect] = useState(false)
    const [loadingChair, setLoadingChair] = useState(false)
    const [loadingDelete, setLoadingDelete] = useState(false)
    const [loadingSave, setLoadingSave] = useState(false)

    const [status, setStatus] = useState<{ msg: string; ok: boolean } | null>(null)

    // ── Load floor plan + tables ──────────────────────────────────────────────

    useEffect(() => {
        Promise.all([
            fetch('/api/floor-plan?limit=1&depth=2').then(r => r.json()),
            fetch('/api/table-layout?limit=500&depth=2').then(r => r.json()),
        ]).then(([fpData, tlData]) => {
            const fp = fpData.docs?.[0]
            if (fp) {
                setFloorPlan({
                    id: fp.id,
                    imageUrl: fp.backgroundImage?.url ?? fp.image?.url ?? '',
                    canvasWidth: fp.canvasWidth ?? 1100,
                    canvasHeight: fp.canvasHeight ?? 700,
                    theme: {
                        tableFillColor: fp.theme?.tableFillColor ?? DEFAULT_THEME.tableFillColor,
                        chairFillColor: fp.theme?.chairFillColor ?? DEFAULT_THEME.chairFillColor,
                        textFillColor: fp.theme?.textFillColor ?? DEFAULT_THEME.textFillColor,
                        selectionColor: fp.theme?.selectionColor ?? DEFAULT_THEME.selectionColor,
                        bookedColor: fp.theme?.bookedColor ?? DEFAULT_THEME.bookedColor,
                    },
                })
            }
            if (tlData.docs) {
                setTables(tlData.docs.map(mapDoc))
            }
        })
    }, [])

    // ── Generate default chairs for a new table ───────────────────────────────

    function makeDefaultChairs(count: number, radius: number): Omit<EmbeddedChair, 'id'>[] {
        return Array.from({ length: count }, (_, i) => {
            const angle = (i / count) * 2 * Math.PI - Math.PI / 2
            return {
                chairId: `C${i + 1}`,
                seatLabel: '',
                relativePosition: {
                    x: Math.round(Math.cos(angle) * radius),
                    y: Math.round(Math.sin(angle) * radius),
                },
            }
        })
    }

    // ── Add square table ──────────────────────────────────────────────────────

    const addSquareTable = async () => {
        setLoadingSquare(true)
        try {
            const chairs = makeDefaultChairs(4, 46)
            const data = await apiPost({
                type: 'square',
                zone: 'main-floor',
                capacity: 4,
                position: { x: 200, y: 200, rotation: 0 },
                width: 60, height: 60,
                isActive: true,
                floor: floorPlan?.id ?? null,
                chairs,
            })
            if (data.doc) setTables(prev => [...prev, mapDoc(data.doc)])
        } finally {
            setLoadingSquare(false)
        }
    }

    // ── Add round table ───────────────────────────────────────────────────────

    const addRoundTable = async () => {
        setLoadingRound(true)
        try {
            const chairs = makeDefaultChairs(4, 46)
            const data = await apiPost({
                type: 'round',
                zone: 'main-floor',
                capacity: 4,
                position: { x: 200, y: 200, rotation: 0 },
                width: 60, height: 60,
                isActive: true,
                floor: floorPlan?.id ?? null,
                chairs,
            })
            if (data.doc) setTables(prev => [...prev, mapDoc(data.doc)])
        } finally {
            setLoadingRound(false)
        }
    }

    // ── Add rectangle table ───────────────────────────────────────────────────

    const addRectTable = async () => {
        setLoadingRect(true)
        try {
            const chairs = makeDefaultChairs(6, 54)
            const data = await apiPost({
                type: 'rectangle',
                zone: 'main-floor',
                capacity: 6,
                position: { x: 200, y: 200, rotation: 0 },
                width: 90, height: 54,
                isActive: true,
                floor: floorPlan?.id ?? null,
                chairs,
            })
            if (data.doc) setTables(prev => [...prev, mapDoc(data.doc)])
        } finally {
            setLoadingRect(false)
        }
    }

    // ── Add chair to selected table ───────────────────────────────────────────

    const addChairToSelected = async () => {
        if (!selectedId) {
            setStatus({ msg: '⚠ Select a table first', ok: false })
            return
        }
        const target = tables.find(t => t.id === selectedId)
        if (!target) return

        setLoadingChair(true)
        try {
            const existingCount = target.chairs.length
            const newIndex = existingCount
            const totalSlots = existingCount + 1
            const angle = (newIndex / totalSlots) * 2 * Math.PI - Math.PI / 2
            const radius = target.width / 2 + 24

            const newChair: Omit<EmbeddedChair, 'id'> = {
                chairId: `C${existingCount + 1}`,
                seatLabel: '',
                relativePosition: {
                    x: Math.round(Math.cos(angle) * radius),
                    y: Math.round(Math.sin(angle) * radius),
                },
            }

            const updatedChairs = [...target.chairs.map(c => ({
                chairId: c.chairId,
                seatLabel: c.seatLabel,
                relativePosition: c.relativePosition,
            })), newChair]

            await apiPatch(target.id, {
                chairs: updatedChairs,
                capacity: updatedChairs.length,
            })

            // Re-fetch the table to get Payload-assigned array IDs
            const res = await fetch(`/api/table-layout/${target.id}?depth=2`)
            const doc = await res.json()
            setTables(prev => prev.map(t => t.id === target.id ? mapDoc(doc) : t))
        } finally {
            setLoadingChair(false)
        }
    }

    // ── Delete selected table ─────────────────────────────────────────────────

    const deleteSelected = async () => {
        if (!selectedId) return
        setLoadingDelete(true)
        try {
            await apiDelete(selectedId)
            setTables(prev => prev.filter(t => t.id !== selectedId))
            setSelectedId(null)
        } finally {
            setLoadingDelete(false)
        }
    }

    // ── Save all positions ────────────────────────────────────────────────────

    const saveAll = useCallback(async () => {
        setLoadingSave(true)
        setStatus(null)
        try {
            await Promise.all(
                tables.map(t =>
                    apiPatch(t.id, {
                        position: {
                            x: Math.round(t.x),
                            y: Math.round(t.y),
                            rotation: Math.round(t.rotation),
                        },
                        width: Math.round(t.width),
                        height: Math.round(t.height),
                        chairs: t.chairs.map(c => ({
                            chairId: c.chairId,
                            seatLabel: c.seatLabel ?? '',
                            relativePosition: {
                                x: Math.round(c.relativePosition.x),
                                y: Math.round(c.relativePosition.y),
                            },
                        })),
                    })
                )
            )
            setStatus({ msg: '✓ Layout saved successfully', ok: true })
        } catch {
            setStatus({ msg: 'Save failed — please try again', ok: false })
        } finally {
            setLoadingSave(false)
        }
    }, [tables])

    // ── Handle table drag/resize/rotate from canvas ───────────────────────────

    const handleChange = useCallback((id: string, updated: Partial<CanvasTable>) => {
        setTables(prev => prev.map(t => (t.id === id ? { ...t, ...updated } : t)))
    }, [])

    // ── Derived ───────────────────────────────────────────────────────────────

    const selected = tables.find(t => t.id === selectedId)
    const theme = floorPlan?.theme ?? DEFAULT_THEME

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div style={{ fontFamily: 'system-ui, sans-serif', paddingBottom: 40 }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 14px' }}>
                Floor Plan Editor
            </h1>

            {/* ── Toolbar ── */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
                <Button variant="outline" size="sm" onClick={addSquareTable} disabled={loadingSquare}>
                    {loadingSquare && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                    + Square Table
                </Button>

                <Button variant="outline" size="sm" onClick={addRoundTable} disabled={loadingRound}>
                    {loadingRound && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                    + Round Table
                </Button>

                <Button variant="outline" size="sm" onClick={addRectTable} disabled={loadingRect}>
                    {loadingRect && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                    + Rectangle Table
                </Button>

                {selectedId && (
                    <Button variant="outline" size="sm" onClick={addChairToSelected} disabled={loadingChair}>
                        {loadingChair && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                        + Chair to Selected
                    </Button>
                )}

                <Button
                    variant="outline" size="sm"
                    onClick={() => setZoom(z => Math.min(2, +(z + 0.1).toFixed(1)))}
                >
                    Zoom In 🔍
                </Button>

                <Button
                    variant="outline" size="sm"
                    onClick={() => setZoom(z => Math.max(0.3, +(z - 0.1).toFixed(1)))}
                >
                    Zoom Out 🔍
                </Button>

                {selectedId && (
                    <Button variant="destructive" size="sm" onClick={deleteSelected} disabled={loadingDelete}>
                        {loadingDelete && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                        Delete Table ✕
                    </Button>
                )}

                <Button
                    size="sm"
                    onClick={saveAll}
                    disabled={loadingSave}
                    className="bg-green-700 hover:bg-green-800 text-white ml-1"
                >
                    {loadingSave && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                    {loadingSave ? 'Saving…' : 'Save Layout'}
                </Button>

                {status && (
                    <span style={{ fontSize: 13, color: status.ok ? '#15803d' : '#dc2626', maxWidth: 360 }}>
                        {status.msg}
                    </span>
                )}
            </div>

            {/* ── Canvas ── */}
            <div style={{
                border: '1px solid #d1d5db', borderRadius: 8,
                overflow: 'auto', display: 'inline-block', maxWidth: '100%',
            }}>
                {floorPlan ? (
                    <KonvaCanvas
                        tables={tables}
                        floorPlan={floorPlan}
                        theme={theme}
                        selectedId={selectedId}
                        zoom={zoom}
                        onSelect={setSelectedId}
                        onChange={handleChange}
                    />
                ) : (
                    <div style={{ padding: '80px 60px', color: '#6b7280', textAlign: 'center' }}>
                        No floor plan image found.<br />
                        Add one in <strong>Restaurant System → Floor Plan</strong>.
                    </div>
                )}
            </div>

            {/* ── Selected info bar ── */}
            {selected && (
                <div style={{
                    marginTop: 10, padding: '9px 14px',
                    background: '#f9fafb', border: '1px solid #e5e7eb',
                    borderRadius: 8, fontSize: 13,
                    display: 'inline-flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
                }}>
                    <strong>Table {selected.tableNumber}</strong>
                    <span style={{ color: '#6b7280' }}>
                        {selected.type} · {selected.zone || 'no zone'} · {selected.chairs.length} chair(s) · capacity {selected.capacity}
                    </span>
                    <span style={{ color: '#6b7280' }}>
                        x:{Math.round(selected.x)} y:{Math.round(selected.y)} · rot:{Math.round(selected.rotation)}°
                    </span>
                    <span style={{ color: '#9ca3af', fontSize: 12 }}>
                        drag · handles to resize/rotate · click canvas to deselect
                    </span>
                </div>
            )}
        </div>
    )
}