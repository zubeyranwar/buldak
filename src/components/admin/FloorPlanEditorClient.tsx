'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Loader2, Undo2, Redo2 } from 'lucide-react'

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
    id: string
    chairId: string
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
    _new?: boolean      // pending create
    _deleted?: boolean  // pending delete
}

export interface FloorPlanTheme {
    tableFillColor: string
    chairFillColor: string
    textFillColor: string
    selectionColor: string
    bookedColor: string
}

// ── History manager ───────────────────────────────────────────────────────────

class LayoutHistory {
    private past: CanvasTable[][] = []
    private future: CanvasTable[][] = []

    push(state: CanvasTable[]) {
        this.past.push(structuredClone(state))
        this.future = []   // new action clears redo stack
    }

    undo(current: CanvasTable[]): CanvasTable[] | null {
        if (this.past.length === 0) return null
        this.future.push(structuredClone(current))
        return this.past.pop()!
    }

    redo(current: CanvasTable[]): CanvasTable[] | null {
        if (this.future.length === 0) return null
        this.past.push(structuredClone(current))
        return this.future.pop()!
    }

    canUndo() { return this.past.length > 0 }
    canRedo() { return this.future.length > 0 }
}

// ── mapDoc ────────────────────────────────────────────────────────────────────

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
        floorId: typeof t.floor === 'object'
            ? String(t.floor?.id ?? '') || null
            : String(t.floor ?? '') || null,
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

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_THEME: FloorPlanTheme = {
    tableFillColor: '#d4a96a',
    chairFillColor: '#a8c5a0',
    textFillColor: '#374151',
    selectionColor: '#3b82f6',
    bookedColor: '#ef4444',
}

let _tmpId = -1
function tmpId() { return String(_tmpId--) }  // negative = not yet saved

function makeDefaultChairs(count: number, radius: number): EmbeddedChair[] {
    return Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * 2 * Math.PI - Math.PI / 2
        return {
            id: tmpId(),
            chairId: `C${i + 1}`,
            seatLabel: '',
            relativePosition: {
                x: Math.round(Math.cos(angle) * radius),
                y: Math.round(Math.sin(angle) * radius),
            },
        }
    })
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FloorPlanEditorClient() {
    const [tables, setTables] = useState<CanvasTable[]>([])
    const [floorPlan, setFloorPlan] = useState<{
        id: string; imageUrl: string; canvasWidth: number; canvasHeight: number; theme: FloorPlanTheme
    } | null>(null)

    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [selectedChairKey, setSelectedChairKey] = useState<string | null>(null)
    const [zoom, setZoom] = useState(1)
    const [loadingSave, setLoadingSave] = useState(false)
    const [status, setStatus] = useState<{ msg: string; ok: boolean } | null>(null)

    // Undo/redo — stable ref so it doesn't trigger re-renders
    const history = useRef(new LayoutHistory())
    const [canUndo, setCanUndo] = useState(false)
    const [canRedo, setCanRedo] = useState(false)

    // ── Sync undo/redo flags ──────────────────────────────────────────────────
    const syncHistory = () => {
        setCanUndo(history.current.canUndo())
        setCanRedo(history.current.canRedo())
    }

    // ── Mutate tables — always push to history first ──────────────────────────
    const mutate = useCallback((fn: (prev: CanvasTable[]) => CanvasTable[]) => {
        setTables(prev => {
            history.current.push(prev)
            syncHistory()
            return fn(prev)
        })
    }, [])

    // ── Load ──────────────────────────────────────────────────────────────────
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
            if (tlData.docs) setTables(tlData.docs.map(mapDoc))
        })
    }, [])

    // ── Add table (local only — _new flag) ────────────────────────────────────
    const addTable = (type: 'square' | 'round' | 'rectangle') => {
        const isRect = type === 'rectangle'
        const w = isRect ? 90 : 60
        const h = isRect ? 54 : 60
        const radius = Math.max(w, h) / 2 + 24
        const chairCount = isRect ? 6 : 4

        const newTable: CanvasTable = {
            id: tmpId(),
            tableNumber: '',   // assigned on save
            type,
            zone: 'main-floor',
            capacity: chairCount,
            x: 200, y: 200,
            width: w, height: h,
            rotation: 0,
            isActive: true,
            floorId: floorPlan?.id ?? null,
            chairs: makeDefaultChairs(chairCount, radius),
            _new: true,
        }

        mutate(prev => [...prev, newTable])
        setSelectedId(newTable.id)
        setSelectedChairKey(null)
    }

    // ── Add chair to selected table (local only) ──────────────────────────────
    const addChair = () => {
        if (!selectedId) { setStatus({ msg: '⚠ Select a table first', ok: false }); return }
        mutate(prev => prev.map(t => {
            if (t.id !== selectedId) return t
            const count = t.chairs.length
            const angle = (count / (count + 1)) * 2 * Math.PI - Math.PI / 2
            const radius = Math.max(t.width, t.height) / 2 + 24
            const newChair: EmbeddedChair = {
                id: tmpId(),
                chairId: `C${count + 1}`,
                seatLabel: '',
                relativePosition: {
                    x: Math.round(Math.cos(angle) * radius),
                    y: Math.round(Math.sin(angle) * radius),
                },
            }
            return { ...t, chairs: [...t.chairs, newChair], capacity: count + 1 }
        }))
    }

    // ── Delete selected chair (local only) ────────────────────────────────────
    const deleteChair = () => {
        if (!selectedChairKey) return
        const [tableId, chairId] = selectedChairKey.split(':')
        mutate(prev => prev.map(t => {
            if (t.id !== tableId) return t
            const chairs = t.chairs.filter(c => c.chairId !== chairId)
            return { ...t, chairs, capacity: chairs.length }
        }))
        setSelectedChairKey(null)
    }

    // ── Delete selected table (local only, mark _deleted) ─────────────────────
    const deleteTable = () => {
        if (!selectedId) return
        mutate(prev => prev.map(t =>
            t.id === selectedId ? { ...t, _deleted: true } : t
        ))
        setSelectedId(null)
        setSelectedChairKey(null)
    }

    // ── Undo ──────────────────────────────────────────────────────────────────
    const undo = () => {
        setTables(prev => {
            const restored = history.current.undo(prev)
            if (!restored) return prev
            syncHistory()
            return restored
        })
        setSelectedChairKey(null)
    }

    // ── Redo ──────────────────────────────────────────────────────────────────
    const redo = () => {
        setTables(prev => {
            const restored = history.current.redo(prev)
            if (!restored) return prev
            syncHistory()
            return restored
        })
        setSelectedChairKey(null)
    }

    // ── Save — flush all pending changes to API ───────────────────────────────
    const saveAll = useCallback(async () => {
        setLoadingSave(true)
        setStatus(null)
        try {
            const toDelete = tables.filter(t => t._deleted && !t._new)
            const toCreate = tables.filter(t => t._new && !t._deleted)
            const toUpdate = tables.filter(t => !t._new && !t._deleted)

            // 1. Delete
            await Promise.all(toDelete.map(t => apiDelete(t.id)))

            // 2. Create — get back real IDs from Payload
            const created: CanvasTable[] = await Promise.all(
                toCreate.map(async t => {
                    const data = await apiPost({
                        type: t.type,
                        zone: t.zone,
                        capacity: t.capacity,
                        position: { x: Math.round(t.x), y: Math.round(t.y), rotation: Math.round(t.rotation) },
                        width: Math.round(t.width),
                        height: Math.round(t.height),
                        isActive: t.isActive,
                        floor: t.floorId ?? undefined,
                        chairs: t.chairs.map(c => ({
                            chairId: c.chairId,
                            seatLabel: c.seatLabel ?? '',
                            relativePosition: {
                                x: Math.round(c.relativePosition.x),
                                y: Math.round(c.relativePosition.y),
                            },
                        })),
                    })
                    return mapDoc(data.doc)
                })
            )

            // 3. Update positions/chairs
            await Promise.all(
                toUpdate.map(t => apiPatch(t.id, {
                    position: { x: Math.round(t.x), y: Math.round(t.y), rotation: Math.round(t.rotation) },
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
                }))
            )

            // 4. Rebuild local state with real IDs, remove deleted
            setTables([
                ...toUpdate,
                ...created,
            ])
            history.current = new LayoutHistory()
            syncHistory()
            setStatus({ msg: '✓ Layout saved successfully', ok: true })
        } catch (err) {
            console.error(err)
            setStatus({ msg: 'Save failed — please try again', ok: false })
        } finally {
            setLoadingSave(false)
        }
    }, [tables])

    // ── Canvas onChange (drag / transformer) ──────────────────────────────────
    const handleChange = useCallback((id: string, updated: Partial<CanvasTable>) => {
        mutate(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t))
    }, [mutate])

    // ── Derived ───────────────────────────────────────────────────────────────
    const visibleTables = tables.filter(t => !t._deleted)
    const selected = visibleTables.find(t => t.id === selectedId)
    const theme = floorPlan?.theme ?? DEFAULT_THEME
    const selectedChairTableId = selectedChairKey?.split(':')[0]
    const selectedChairId = selectedChairKey?.split(':')[1]

    const pendingCount = tables.filter(t => t._new || t._deleted).length
    const hasUnsaved = pendingCount > 0 || tables.some(t => !t._new && !t._deleted)

    return (
        <div style={{ fontFamily: 'system-ui, sans-serif', paddingBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Floor Plan Editor</h1>
                {pendingCount > 0 && (
                    <span style={{
                        fontSize: 11, padding: '2px 8px',
                        background: '#fef3c7', border: '1px solid #f59e0b',
                        borderRadius: 12, color: '#92400e',
                    }}>
                        {pendingCount} unsaved change{pendingCount !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* ── Toolbar ── */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
                {/* Undo / Redo */}
                <Button variant="outline" size="sm" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
                    <Undo2 className="w-3.5 h-3.5" />
                </Button>
                <Button variant="outline" size="sm" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)">
                    <Redo2 className="w-3.5 h-3.5" />
                </Button>

                <span style={{ width: 1, height: 24, background: '#e5e7eb', display: 'inline-block', margin: '0 2px' }} />

                <Button variant="outline" size="sm" onClick={() => addTable('square')}>+ Square</Button>
                <Button variant="outline" size="sm" onClick={() => addTable('round')}>+ Round</Button>
                <Button variant="outline" size="sm" onClick={() => addTable('rectangle')}>+ Rectangle</Button>

                {selectedId && (
                    <Button variant="outline" size="sm" onClick={addChair}>+ Chair</Button>
                )}

                {selectedChairKey && (
                    <Button variant="destructive" size="sm" onClick={deleteChair}>
                        Delete Chair ({selectedChairId}) ✕
                    </Button>
                )}

                {selectedId && !selectedChairKey && (
                    <Button variant="destructive" size="sm" onClick={deleteTable}>
                        Delete Table ✕
                    </Button>
                )}

                <span style={{ width: 1, height: 24, background: '#e5e7eb', display: 'inline-block', margin: '0 2px' }} />

                <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.min(2, +(z + 0.1).toFixed(1)))}>
                    Zoom In 🔍
                </Button>
                <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.max(0.3, +(z - 0.1).toFixed(1)))}>
                    Zoom Out 🔍
                </Button>

                <Button
                    size="sm"
                    onClick={saveAll}
                    disabled={loadingSave}
                    className="bg-green-700 hover:bg-green-800 text-white ml-auto"
                >
                    {loadingSave && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                    {loadingSave ? 'Saving…' : 'Save Layout'}
                </Button>

                {status && (
                    <span style={{ fontSize: 13, color: status.ok ? '#15803d' : '#dc2626' }}>
                        {status.msg}
                    </span>
                )}
            </div>

            {/* ── Canvas ── */}
            <div style={{ border: '1px solid #d1d5db', borderRadius: 8, overflow: 'auto', display: 'inline-block', maxWidth: '100%' }}>
                {floorPlan ? (
                    <KonvaCanvas
                        tables={visibleTables}
                        floorPlan={floorPlan}
                        theme={theme}
                        selectedId={selectedId}
                        selectedChairKey={selectedChairKey}
                        zoom={zoom}
                        onSelect={setSelectedId}
                        onSelectChair={setSelectedChairKey}
                        onChange={handleChange}
                    />
                ) : (
                    <div style={{ padding: '80px 60px', color: '#6b7280', textAlign: 'center' }}>
                        No floor plan image found.<br />
                        Add one in <strong>Restaurant System → Floor Plan</strong>.
                    </div>
                )}
            </div>

            {/* ── Info bar ── */}
            {selected && (
                <div style={{
                    marginTop: 10, padding: '9px 14px',
                    background: '#f9fafb', border: '1px solid #e5e7eb',
                    borderRadius: 8, fontSize: 13,
                    display: 'inline-flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
                }}>
                    <strong>Table {selected.tableNumber || '(unsaved)'}</strong>
                    <span style={{ color: '#6b7280' }}>
                        {selected.type} · {selected.chairs.length} chair(s)
                        {selected._new && <span style={{ color: '#f59e0b', marginLeft: 6 }}>● new</span>}
                    </span>
                    {selectedChairKey && (
                        <span style={{ color: '#3b82f6', fontWeight: 500 }}>
                            Chair {selectedChairId} selected — click "Delete Chair" to remove
                        </span>
                    )}
                    <span style={{ color: '#9ca3af', fontSize: 12 }}>
                        drag to move · handles to resize &amp; rotate · click chair to select it
                    </span>
                </div>
            )}

            {/* ── Keyboard shortcuts ── */}
            <KeyboardShortcuts onUndo={undo} onRedo={redo} canUndo={canUndo} canRedo={canRedo} />
        </div>
    )
}

// ── Keyboard shortcuts (Ctrl+Z / Ctrl+Y) ─────────────────────────────────────

function KeyboardShortcuts({
    onUndo, onRedo, canUndo, canRedo,
}: { onUndo: () => void; onRedo: () => void; canUndo: boolean; canRedo: boolean }) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey && canUndo) {
                e.preventDefault(); onUndo()
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey)) && canRedo) {
                e.preventDefault(); onRedo()
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onUndo, onRedo, canUndo, canRedo])
    return null
}