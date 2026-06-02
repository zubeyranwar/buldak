'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@payloadcms/ui'
import { Loader2, Undo2, Redo2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button as UiButton } from '@/components/ui/button'

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
    currentChairCount: number
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

type TableDoc = {
    id: string | number
    tableNumber?: string | null
    type?: CanvasTable['type'] | null
    zone?: string | null
    capacity?: number | null
    currentChairCount?: number | null
    position?: { x?: number | null; y?: number | null; rotation?: number | null } | null
    xPos?: number | null
    yPos?: number | null
    rotation?: number | null
    width?: number | null
    height?: number | null
    isActive?: boolean | null
    floor?: string | number | { id?: string | number | null } | null
    chairs?: ChairDoc[] | null
}

type ChairDoc = {
    id?: string | number | null
    chairId?: string | null
    seatLabel?: string | null
    relativePosition?: { x?: number | null; y?: number | null } | null
}

function relationId(value: TableDoc['floor']) {
    if (typeof value === 'object' && value !== null) {
        return value.id ? String(value.id) : ''
    }
    return value ? String(value) : ''
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

function mapDoc(t: TableDoc): CanvasTable {
    return {
        id: String(t.id),
        tableNumber: t.tableNumber ?? '',
        type: t.type ?? 'square',
        zone: t.zone ?? '',
        capacity: t.capacity ?? 4,
        currentChairCount: t.currentChairCount ?? t.chairs?.length ?? t.capacity ?? 4,
        x: t.position?.x ?? t.xPos ?? 100,
        y: t.position?.y ?? t.yPos ?? 100,
        width: t.width ?? 60,
        height: t.height ?? 60,
        rotation: t.position?.rotation ?? t.rotation ?? 0,
        isActive: t.isActive ?? true,
        floorId: relationId(t.floor) || null,
        chairs: (t.chairs ?? []).map((c) => ({
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

async function apiPost(body: Record<string, unknown>): Promise<{ doc: TableDoc }> {
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

// ── Component ─────────────────────────────────────────────────────────────────

export function FloorPlanEditorClient() {
    const [tables, setTables] = useState<CanvasTable[]>([])
    const [floorPlan, setFloorPlan] = useState<{
        id: string; imageUrl: string; canvasWidth: number; canvasHeight: number; theme: FloorPlanTheme
    } | null>(null)

    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [zoom, setZoom] = useState(1)
    const [loadingSave, setLoadingSave] = useState(false)
    const [status, setStatus] = useState<{ msg: string; ok: boolean } | null>(null)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [settingsMode, setSettingsMode] = useState<'add' | 'edit'>('add')
    const [settingsTableType, setSettingsTableType] = useState<CanvasTable['type']>('square')
    const [editingTableId, setEditingTableId] = useState<string | null>(null)
    const [seatDraft, setSeatDraft] = useState({ currentChairCount: '2', capacity: '2' })

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

    const openAddTableDialog = (type: CanvasTable['type']) => {
        setSettingsMode('add')
        setSettingsTableType(type)
        setEditingTableId(null)
        setSeatDraft({ currentChairCount: '2', capacity: '2' })
        setSettingsOpen(true)
    }

    const openEditTableDialog = useCallback((tableId: string) => {
        const table = tables.find(t => t.id === tableId && !t._deleted)
        if (!table) return
        setSelectedId(table.id)
        setSettingsMode('edit')
        setSettingsTableType(table.type)
        setEditingTableId(table.id)
        setSeatDraft({
            currentChairCount: String(table.currentChairCount),
            capacity: String(table.capacity),
        })
        setSettingsOpen(true)
    }, [tables])

    const closeSettingsDialog = () => {
        setSettingsOpen(false)
        setEditingTableId(null)
    }

    // ── Add table (local only — _new flag) ────────────────────────────────────
    const addTable = (type: 'square' | 'round' | 'rectangle', currentChairCount: number, capacity: number) => {
        const isRect = type === 'rectangle'
        const w = isRect ? 90 : 60
        const h = isRect ? 54 : 60

        const newTable: CanvasTable = {
            id: tmpId(),
            tableNumber: '',   // assigned on save
            type,
            zone: 'main-floor',
            capacity,
            currentChairCount,
            x: 200, y: 200,
            width: w, height: h,
            rotation: 0,
            isActive: true,
            floorId: floorPlan?.id ?? null,
            chairs: [],
            _new: true,
        }

        mutate(prev => [...prev, newTable])
        setSelectedId(newTable.id)
    }

    const saveTableSettings = () => {
        const currentChairCount = Math.max(0, Number(seatDraft.currentChairCount) || 0)
        const capacity = Math.max(1, Number(seatDraft.capacity) || 1, currentChairCount)

        if (settingsMode === 'add') {
            addTable(settingsTableType, currentChairCount, capacity)
        } else if (editingTableId) {
            mutate(prev => prev.map(t =>
                t.id === editingTableId ? { ...t, currentChairCount, capacity, chairs: [] } : t
            ))
        }

        closeSettingsDialog()
    }

    // ── Delete selected table (local only, mark _deleted) ─────────────────────
    const deleteTable = () => {
        if (!selectedId) return
        mutate(prev => prev.map(t =>
            t.id === selectedId ? { ...t, _deleted: true } : t
        ))
        setSelectedId(null)
    }

    // ── Undo ──────────────────────────────────────────────────────────────────
    const undo = () => {
        setTables(prev => {
            const restored = history.current.undo(prev)
            if (!restored) return prev
            syncHistory()
            return restored
        })
    }

    // ── Redo ──────────────────────────────────────────────────────────────────
    const redo = () => {
        setTables(prev => {
            const restored = history.current.redo(prev)
            if (!restored) return prev
            syncHistory()
            return restored
        })
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
                        currentChairCount: t.currentChairCount,
                        position: { x: Math.round(t.x), y: Math.round(t.y), rotation: Math.round(t.rotation) },
                        width: Math.round(t.width),
                        height: Math.round(t.height),
                        isActive: t.isActive,
                        floor: t.floorId ?? undefined,
                        chairs: [],
                    })
                    return mapDoc(data.doc as TableDoc)
                })
            )

            // 3. Update positions/chairs
            await Promise.all(
                toUpdate.map(t => apiPatch(t.id, {
                    position: { x: Math.round(t.x), y: Math.round(t.y), rotation: Math.round(t.rotation) },
                    capacity: t.capacity,
                    currentChairCount: t.currentChairCount,
                    width: Math.round(t.width),
                    height: Math.round(t.height),
                    chairs: [],
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

    const handleCanvasSelect = (id: string | null) => {
        if (!id) {
            setSelectedId(null)
            return
        }
        openEditTableDialog(id)
    }

    // ── Derived ───────────────────────────────────────────────────────────────
    const visibleTables = tables.filter(t => !t._deleted)
    const theme = floorPlan?.theme ?? DEFAULT_THEME

    const pendingCount = tables.filter(t => t._new || t._deleted).length

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
                <Button buttonStyle='none' onClick={undo} disabled={!canUndo}>
                    <Undo2 className="w-2 h-2" />
                </Button>
                <Button buttonStyle='none' onClick={redo} disabled={!canRedo}>
                    <Redo2 className="w-2 h-2" />
                </Button>

                <span style={{ width: 1, height: 24, background: '#e5e7eb', display: 'inline-block', margin: '0 2px' }} />

                <Button buttonStyle='pill' onClick={() => openAddTableDialog('square')}>+ Square</Button>
                <Button buttonStyle='pill' onClick={() => openAddTableDialog('round')}>+ Round</Button>
                <Button buttonStyle='pill' onClick={() => openAddTableDialog('rectangle')}>+ Rectangle</Button>

                {selectedId && (
                    <Button onClick={deleteTable}>
                        Delete Table ✕
                    </Button>
                )}

                <span style={{ width: 1, height: 24, background: '#e5e7eb', display: 'inline-block', margin: '0 2px' }} />

                <Button buttonStyle='pill' onClick={() => setZoom(z => Math.min(2, +(z + 0.1).toFixed(1)))}>
                    Zoom In 🔍
                </Button>
                <Button buttonStyle='pill' onClick={() => setZoom(z => Math.max(0.3, +(z - 0.1).toFixed(1)))}>
                    Zoom Out 🔍
                </Button>

                <Button
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
                        zoom={zoom}
                        onSelect={handleCanvasSelect}
                        onChange={handleChange}
                    />
                ) : (
                    <div style={{ padding: '80px 60px', color: '#6b7280', textAlign: 'center' }}>
                        No floor plan image found.<br />
                        Add one in <strong>Restaurant System → Floor Plan</strong>.
                    </div>
                )}
            </div>

            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogContent
                    style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 'min(420px, calc(100vw - 32px))',
                        zIndex: 2147483647,
                        display: 'grid',
                        gap: 16,
                        padding: 20,
                        borderRadius: 10,
                        border: '1px solid #d1d5db',
                        background: '#fff',
                        color: '#111827',
                        boxShadow: '0 24px 64px rgba(15, 23, 42, 0.24)',
                        fontFamily: 'system-ui, sans-serif',
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>{settingsMode === 'add' ? 'Add table' : 'Edit table'}</DialogTitle>
                        <DialogDescription>
                            Set the current seats and reservation capacity for this table.
                        </DialogDescription>
                    </DialogHeader>

                    <div style={{ display: 'grid', gap: 12 }}>
                        <label style={{ display: 'grid', gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 500 }}>Current seats</span>
                            <input
                                type="number"
                                min={0}
                                value={seatDraft.currentChairCount}
                                onChange={(e) => setSeatDraft(prev => ({ ...prev, currentChairCount: e.target.value }))}
                                style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: 6,
                                }}
                            />
                        </label>
                        <label style={{ display: 'grid', gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 500 }}>Max capacity</span>
                            <input
                                type="number"
                                min={1}
                                value={seatDraft.capacity}
                                onChange={(e) => setSeatDraft(prev => ({ ...prev, capacity: e.target.value }))}
                                style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: 6,
                                }}
                            />
                        </label>
                    </div>

                    <DialogFooter style={{ display: "flex", gap: 4 }}>
                        <Button type="button" buttonStyle="secondary" onClick={closeSettingsDialog}>
                            Cancel
                        </Button>
                        <Button type="button" onClick={saveTableSettings}>
                            {settingsMode === 'add' ? 'Add table' : 'Save changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
