'use client'

/**
 * PanoramaEditorClient.tsx
 *
 * Full state machine for the panorama editor.
 * Mirrors FloorPlanEditorClient — same patterns:
 *   - local-first mutations with _new / _deleted flags
 *   - LayoutHistory (undo/redo) — copied verbatim, it's generic
 *   - saveAll() flushes via Payload REST
 *   - mutate() always pushes to history first
 *
 * New concepts vs FloorPlanEditorClient:
 *   - scenes[] instead of a flat tables[]
 *   - activeSceneId tab switching
 *   - editorMode: 'table' | 'navigate' | null
 *   - hotspot keys: "table:T4" | "nav:patio"
 *   - table picker popup after click-to-place
 */

import { Button } from '@payloadcms/ui'
import { Loader2, Navigation, Plus, Redo2, TableIcon, Trash2, Undo2, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { HotspotStatus, PanoramaHotspot } from './PannellumViewer'

const PhotoSphereViewer = dynamic(() => import('./PhotoSphereViewer'), {
    ssr: false,
    loading: () => <div style={{ padding: '80px 60px', textAlign: 'center' }}>Loading viewer…</div>,
})

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StoredHotspot {
    key: string                         // "table:T4" | "nav:patio"
    type: 'table' | 'navigate'
    yaw: number
    pitch: number
    tableId?: string                    // relates to table-layout
    tableNumber?: string                // denormalized for display
    targetSceneId?: string
    targetSceneLabel?: string
    _new?: boolean
    _deleted?: boolean
}

export interface PanoramaScene {
    sceneId: string                     // "main-floor", "patio" — slug
    label: string                       // "Main Floor"
    panoramaImageId?: string
    panoramaImageUrl?: string
    defaultYaw: number
    defaultPitch: number
    hotspots: StoredHotspot[]
    _new?: boolean
    _deleted?: boolean
}

export interface PanoramaDoc {
    id: string
    name: string
    linkedFloorPlanId?: string
    scenes: PanoramaScene[]
}

// Lightweight table ref fetched from table-layout collection
interface TableRef {
    id: string
    tableNumber: string
    capacity: number
    zone?: string
}

// ── History (copied verbatim from FloorPlanEditorClient — it's generic) ───────

class LayoutHistory<T> {
    private past: T[] = []
    private future: T[] = []

    push(state: T) {
        this.past.push(structuredClone(state))
        this.future = []
    }
    undo(current: T): T | null {
        if (this.past.length === 0) return null
        this.future.push(structuredClone(current))
        return this.past.pop()!
    }
    redo(current: T): T | null {
        if (this.future.length === 0) return null
        this.past.push(structuredClone(current))
        return this.future.pop()!
    }
    canUndo() { return this.past.length > 0 }
    canRedo() { return this.future.length > 0 }
    reset() { this.past = []; this.future = [] }
}

// ── ID helpers ────────────────────────────────────────────────────────────────

let _tmpId = -1
const tmpId = () => String(_tmpId--)
const slugify = (s: string) => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

// ── mapDoc ────────────────────────────────────────────────────────────────────

function mapDoc(doc: any): PanoramaDoc {
    return {
        id: String(doc.id),
        name: doc.name ?? 'Untitled',
        linkedFloorPlanId: typeof doc.linkedFloorPlan === 'object'
            ? doc.linkedFloorPlan?.id
            : doc.linkedFloorPlan,
        scenes: (doc.scenes ?? []).map((s: any): PanoramaScene => ({
            sceneId: s.sceneId ?? tmpId(),
            label: s.label ?? 'Unnamed Scene',
            panoramaImageId: typeof s.panoramaImage === 'object'
                ? s.panoramaImage?.id
                : s.panoramaImage,
            panoramaImageUrl: s.panoramaImage?.url ?? '',
            defaultYaw: s.defaultYaw ?? 0,
            defaultPitch: s.defaultPitch ?? 0,
            hotspots: (s.hotspots ?? []).map((h: any): StoredHotspot => ({
                key: h.key ?? `${h.type}:${h.tableId ?? h.targetSceneId ?? tmpId()}`,
                type: h.type ?? 'table',
                yaw: h.yaw ?? 0,
                pitch: h.pitch ?? 0,
                tableId: typeof h.table === 'object' ? h.table?.id : h.table,
                tableNumber: h.table?.tableNumber ?? h.tableNumber,
                targetSceneId: h.targetSceneId,
                targetSceneLabel: h.targetSceneLabel,
            })),
        })),
    }
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function apiPost(body: Record<string, unknown>): Promise<any> {
    const res = await fetch('/api/panorama-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
    return res.json()
}

async function apiPatch(id: string, body: Record<string, unknown>): Promise<void> {
    await fetch(`/api/panorama-view/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
}

// ── Serialise scenes back to Payload shape ────────────────────────────────────

function serialiseScenes(scenes: PanoramaScene[]) {
    return scenes
        .filter(s => !s._deleted)
        .map(s => ({
            sceneId: s.sceneId,
            label: s.label,
            panoramaImage: s.panoramaImageId ? Number(s.panoramaImageId) : null,
            defaultYaw: s.defaultYaw,
            defaultPitch: s.defaultPitch,
            hotspots: s.hotspots
                .filter(h => !h._deleted)
                .map(h => ({
                    key: h.key,
                    type: h.type,
                    yaw: h.yaw,
                    pitch: h.pitch,
                    table: h.tableId ?? null,
                    tableNumber: h.tableNumber ?? null,
                    targetSceneId: h.targetSceneId ?? null,
                    targetSceneLabel: h.targetSceneLabel ?? null,
                })),
        }))
}

// ── Table Picker Popup ────────────────────────────────────────────────────────

function TablePickerPopup({
    tables,
    onPick,
    onCancel,
}: {
    tables: TableRef[]
    onPick: (table: TableRef) => void
    onCancel: () => void
}) {
    const [search, setSearch] = useState('')
    const filtered = tables.filter(t =>
        t.tableNumber.toLowerCase().includes(search.toLowerCase()) ||
        (t.zone ?? '').toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
            onClick={e => { if (e.target === e.currentTarget) onCancel() }}
        >
            <div style={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 12,
                width: 340,
                maxHeight: 420,
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                overflow: 'hidden',
            }}>
                {/* Header */}
                <div style={{
                    padding: '14px 16px 10px',
                    borderBottom: '1px solid #334155',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <span style={{
                        fontFamily: 'DM Sans, system-ui',
                        fontWeight: 700, fontSize: 14,
                        color: '#f1f5f9',
                    }}>Select Table</span>
                    <button
                        onClick={onCancel}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 18, lineHeight: 1 }}
                    >×</button>
                </div>

                {/* Search */}
                <div style={{ padding: '10px 16px 6px' }}>
                    <input
                        autoFocus
                        placeholder="Search table number or zone…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            width: '100%', boxSizing: 'border-box',
                            background: '#0f172a', border: '1px solid #334155',
                            borderRadius: 7, padding: '7px 10px',
                            color: '#f1f5f9', fontSize: 13,
                            fontFamily: 'DM Sans, system-ui',
                            outline: 'none',
                        }}
                    />
                </div>

                {/* List */}
                <div style={{ overflowY: 'auto', flex: 1, padding: '4px 8px 12px' }}>
                    {filtered.length === 0 && (
                        <div style={{ textAlign: 'center', color: '#64748b', fontSize: 13, padding: '20px 0' }}>
                            No tables found
                        </div>
                    )}
                    {filtered.map(t => (
                        <button
                            key={t.id}
                            onClick={() => onPick(t)}
                            style={{
                                width: '100%', textAlign: 'left',
                                background: 'none', border: 'none',
                                borderRadius: 7,
                                padding: '9px 10px',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                color: '#e2e8f0',
                                fontFamily: 'DM Sans, system-ui',
                                transition: 'background 0.12s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#334155')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        >
                            <span style={{ fontWeight: 600, fontSize: 13 }}>
                                T-{t.tableNumber}
                            </span>
                            <span style={{ fontSize: 11, color: '#64748b' }}>
                                {t.zone ?? ''} · {t.capacity} seats
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ── Scene Picker Popup ────────────────────────────────────────────────────────

function ScenePickerPopup({
    scenes,
    currentSceneId,
    onPick,
    onCancel,
}: {
    scenes: PanoramaScene[]
    currentSceneId: string
    onPick: (scene: PanoramaScene) => void
    onCancel: () => void
}) {
    const available = scenes.filter(s => s.sceneId !== currentSceneId && !s._deleted)

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
            onClick={e => { if (e.target === e.currentTarget) onCancel() }}
        >
            <div style={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 12, width: 300,
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                overflow: 'hidden',
            }}>
                <div style={{
                    padding: '14px 16px 10px',
                    borderBottom: '1px solid #334155',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <span style={{ fontFamily: 'DM Sans, system-ui', fontWeight: 700, fontSize: 14, color: '#f1f5f9' }}>
                        Navigate to Scene
                    </span>
                    <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 18 }}>×</button>
                </div>
                <div style={{ padding: '8px 8px 12px' }}>
                    {available.length === 0 && (
                        <div style={{ textAlign: 'center', color: '#64748b', fontSize: 13, padding: '20px 0' }}>
                            No other scenes — add more scenes first
                        </div>
                    )}
                    {available.map(s => (
                        <button
                            key={s.sceneId}
                            onClick={() => onPick(s)}
                            style={{
                                width: '100%', textAlign: 'left',
                                background: 'none', border: 'none', borderRadius: 7,
                                padding: '10px 12px', cursor: 'pointer',
                                color: '#e2e8f0', fontFamily: 'DM Sans, system-ui', fontSize: 13,
                                display: 'flex', alignItems: 'center', gap: 8,
                                transition: 'background 0.12s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#334155')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        >
                            <span style={{ fontSize: 16 }}>➜</span>
                            <span style={{ fontWeight: 600 }}>{s.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ── Main component ────────────────────────────────────────────────────────────

export function PanoramaEditorClient() {
    const [doc, setDoc] = useState<PanoramaDoc | null>(null)
    const [scenes, setScenes] = useState<PanoramaScene[]>([])
    const [activeSceneId, setActiveSceneId] = useState<string | null>(null)
    const [availableTables, setAvailableTables] = useState<TableRef[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploadingSceneId, setUploadingSceneId] = useState<string | null>(null)
    const [uploadingImage, setUploadingImage] = useState(false)

    const [editorMode, setEditorMode] = useState<'table' | 'navigate' | null>(null)
    const [selectedHotspotKey, setSelectedHotspotKey] = useState<string | null>(null)

    // Pending click placement — holds yaw/pitch while picker popup is open
    const [pendingCoords, setPendingCoords] = useState<{ yaw: number; pitch: number } | null>(null)
    const [showTablePicker, setShowTablePicker] = useState(false)
    const [showScenePicker, setShowScenePicker] = useState(false)

    const [loadingSave, setLoadingSave] = useState(false)
    const [status, setStatus] = useState<{ msg: string; ok: boolean } | null>(null)

    const history = useRef(new LayoutHistory<PanoramaScene[]>())
    const [canUndo, setCanUndo] = useState(false)
    const [canRedo, setCanRedo] = useState(false)

    // ── Sync history flags ────────────────────────────────────────────────────
    const syncHistory = () => {
        setCanUndo(history.current.canUndo())
        setCanRedo(history.current.canRedo())
    }

    // ── mutate — always push to history first (same as FloorPlanEditorClient) ─
    const mutate = useCallback((fn: (prev: PanoramaScene[]) => PanoramaScene[]) => {
        setScenes(prev => {
            history.current.push(prev)
            syncHistory()
            return fn(prev)
        })
    }, [])

    // ── Load ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        Promise.all([
            fetch('/api/panorama-view?limit=1&depth=2').then(r => r.json()),
            fetch('/api/table-layout?limit=500&depth=0').then(r => r.json()),
        ]).then(([pvData, tlData]) => {
            const pv = pvData.docs?.[0]
            if (pv) {
                const mapped = mapDoc(pv)
                setDoc(mapped)
                setScenes(mapped.scenes)
                setActiveSceneId(mapped.scenes[0]?.sceneId ?? null)
            }
            if (tlData.docs) {
                setAvailableTables(tlData.docs.map((t: any): TableRef => ({
                    id: String(t.id),
                    tableNumber: t.tableNumber ?? '',
                    capacity: t.capacity ?? 4,
                    zone: t.zone ?? '',
                })))
            }
        })
    }, [])

    // ── Active scene helpers ──────────────────────────────────────────────────
    const activeScene = scenes.find(s => s.sceneId === activeSceneId && !s._deleted) ?? null

    const visibleHotspots: PanoramaHotspot[] = (activeScene?.hotspots ?? [])
        .filter(h => !h._deleted)
        .map(h => ({
            key: h.key,
            type: h.type,
            yaw: h.yaw,
            pitch: h.pitch,
            tableNumber: h.tableNumber,
            targetSceneId: h.targetSceneId,
            targetSceneLabel: h.targetSceneLabel,
            // Status is 'available' in editor — live view will override
            status: 'available' as HotspotStatus,
        }))

    // ── Add scene ─────────────────────────────────────────────────────────────
    const addScene = () => {
        const label = prompt('Scene name (e.g. "Patio", "Bar Area"):')
        if (!label?.trim()) return
        const newScene: PanoramaScene = {
            sceneId: slugify(label) || tmpId(),
            label: label.trim(),
            defaultYaw: 0,
            defaultPitch: 0,
            hotspots: [],
            _new: true,
        }
        mutate(prev => [...prev, newScene])
        setActiveSceneId(newScene.sceneId)
    }

    // ── Delete scene ──────────────────────────────────────────────────────────
    const deleteScene = () => {
        if (!activeSceneId) return
        if (!confirm('Delete this scene and all its hotspots?')) return
        mutate(prev => prev.map(s =>
            s.sceneId === activeSceneId ? { ...s, _deleted: true } : s
        ))
        const next = scenes.find(s => s.sceneId !== activeSceneId && !s._deleted)
        setActiveSceneId(next?.sceneId ?? null)
        setSelectedHotspotKey(null)
    }

    // ── Upload panorama image for a scene ─────────────────────────────────────
    const handleImageUpload = async (file: File, sceneId: string) => {
        setUploadingImage(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('alt', file.name)

            const res = await fetch('/api/media', {
                method: 'POST',
                body: formData,
            })

            if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
            const data = await res.json()

            const doc = data.doc ?? data
            const mediaId = String(doc.id)
            const mediaUrl = doc.url ?? ''

            mutate(prev => prev.map(s =>
                s.sceneId !== sceneId ? s : {
                    ...s,
                    panoramaImageId: mediaId,
                    panoramaImageUrl: mediaUrl,
                }
            ))

            setStatus({ msg: '✓ Image uploaded — click Save to persist', ok: true })
        } catch (err) {
            console.error('[panorama] image upload failed', err)
            setStatus({ msg: 'Image upload failed', ok: false })
        } finally {
            setUploadingImage(false)
            setUploadingSceneId(null)
        }
    }

    // ── Click on panorama → open picker popup ─────────────────────────────────
    const handlePanoramaClick = useCallback(({ yaw, pitch }: { yaw: number; pitch: number }) => {
        if (!editorMode) return
        setPendingCoords({ yaw, pitch })
        if (editorMode === 'table') setShowTablePicker(true)
        if (editorMode === 'navigate') setShowScenePicker(true)
    }, [editorMode])

    // ── Confirm: place table hotspot ──────────────────────────────────────────
    const handlePickTable = (table: TableRef) => {
        if (!pendingCoords || !activeSceneId) return
        setShowTablePicker(false)

        const key = `table:${table.id}`
        const newHotspot: StoredHotspot = {
            key,
            type: 'table',
            yaw: pendingCoords.yaw,
            pitch: pendingCoords.pitch,
            tableId: table.id,
            tableNumber: table.tableNumber,
            _new: true,
        }

        mutate(prev => prev.map(s =>
            s.sceneId !== activeSceneId ? s : {
                ...s,
                hotspots: [
                    // Replace if same table already exists in this scene
                    ...s.hotspots.filter(h => h.key !== key),
                    newHotspot,
                ],
            }
        ))
        setSelectedHotspotKey(key)
        setPendingCoords(null)
    }

    // ── Confirm: place nav hotspot ────────────────────────────────────────────
    const handlePickScene = (scene: PanoramaScene) => {
        if (!pendingCoords || !activeSceneId) return
        setShowScenePicker(false)

        const key = `nav:${scene.sceneId}`
        const newHotspot: StoredHotspot = {
            key,
            type: 'navigate',
            yaw: pendingCoords.yaw,
            pitch: pendingCoords.pitch,
            targetSceneId: scene.sceneId,
            targetSceneLabel: scene.label,
            _new: true,
        }

        mutate(prev => prev.map(s =>
            s.sceneId !== activeSceneId ? s : {
                ...s,
                hotspots: [
                    ...s.hotspots.filter(h => h.key !== key),
                    newHotspot,
                ],
            }
        ))
        setSelectedHotspotKey(key)
        setPendingCoords(null)
    }

    // ── Delete selected hotspot ───────────────────────────────────────────────
    const deleteHotspot = () => {
        if (!selectedHotspotKey || !activeSceneId) return
        mutate(prev => prev.map(s =>
            s.sceneId !== activeSceneId ? s : {
                ...s,
                hotspots: s.hotspots.map(h =>
                    h.key === selectedHotspotKey ? { ...h, _deleted: true } : h
                ),
            }
        ))
        setSelectedHotspotKey(null)
    }

    // ── Undo ──────────────────────────────────────────────────────────────────
    const undo = () => {
        setScenes(prev => {
            const restored = history.current.undo(prev)
            if (!restored) return prev
            syncHistory()
            return restored
        })
        setSelectedHotspotKey(null)
    }

    // ── Redo ──────────────────────────────────────────────────────────────────
    const redo = () => {
        setScenes(prev => {
            const restored = history.current.redo(prev)
            if (!restored) return prev
            syncHistory()
            return restored
        })
        setSelectedHotspotKey(null)
    }

    // ── Save ──────────────────────────────────────────────────────────────────
    const saveAll = useCallback(async () => {
        if (!doc) return
        setLoadingSave(true)
        setStatus(null)
        try {
            const payload = { scenes: serialiseScenes(scenes) }

            if (doc.id.startsWith('-')) {
                // New doc — shouldn't happen (collection always pre-exists) but guard anyway
                const result = await apiPost({ name: doc.name, ...payload })
                setDoc(mapDoc(result.doc))
            } else {
                await apiPatch(doc.id, payload)
            }

            // Clean _new / _deleted flags after successful save
            setScenes(prev => prev
                .filter(s => !s._deleted)
                .map(s => ({
                    ...s, _new: false,
                    hotspots: s.hotspots
                        .filter(h => !h._deleted)
                        .map(h => ({ ...h, _new: false })),
                }))
            )

            history.current.reset()
            syncHistory()
            setStatus({ msg: '✓ Panorama saved', ok: true })
        } catch (err) {
            console.error(err)
            setStatus({ msg: 'Save failed — check console', ok: false })
        } finally {
            setLoadingSave(false)
        }
    }, [doc, scenes])

    // ── Keyboard shortcuts (Ctrl+Z / Ctrl+Y) — same as FloorPlanEditorClient ──
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey && canUndo) {
                e.preventDefault(); undo()
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey)) && canRedo) {
                e.preventDefault(); redo()
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [canUndo, canRedo])

    // ── Derived ───────────────────────────────────────────────────────────────
    const visibleScenes = scenes.filter(s => !s._deleted)
    const selectedHotspot = activeScene?.hotspots.find(h => h.key === selectedHotspotKey && !h._deleted)
    const pendingChanges = scenes.filter(s => s._new || s._deleted ||
        s.hotspots.some(h => h._new || h._deleted)).length

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div style={{ fontFamily: 'DM Sans, system-ui, sans-serif', paddingBottom: 40 }}>

            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#0f172a' }}>
                    Panorama Editor
                </h1>
                {pendingChanges > 0 && (
                    <span style={{
                        fontSize: 11, padding: '2px 8px',
                        background: '#fef3c7', border: '1px solid #f59e0b',
                        borderRadius: 12, color: '#92400e',
                    }}>
                        {pendingChanges} unsaved change{pendingChanges !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* ── Scene tabs ── */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                marginBottom: 12, flexWrap: 'wrap',
            }}>
                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => {
                        const file = e.target.files?.[0]
                        if (file && uploadingSceneId) {
                            handleImageUpload(file, uploadingSceneId)
                        }
                        e.target.value = '' // reset so same file can be re-selected
                    }}
                />

                {visibleScenes.map(s => (
                    <div key={s.sceneId} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <button
                            onClick={() => { setActiveSceneId(s.sceneId); setSelectedHotspotKey(null) }}
                            style={{
                                padding: '6px 14px',
                                borderRadius: s.sceneId === activeSceneId ? '999px 0 0 999px' : 999,
                                border: '1.5px solid',
                                borderRight: s.sceneId === activeSceneId ? 'none' : '1.5px solid',
                                borderColor: s.sceneId === activeSceneId ? '#3b82f6' : '#d1d5db',
                                background: s.sceneId === activeSceneId ? '#eff6ff' : '#fff',
                                color: s.sceneId === activeSceneId ? '#1d4ed8' : '#374151',
                                fontSize: 13, fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: 'DM Sans, system-ui',
                                display: 'flex', alignItems: 'center', gap: 5,
                            }}
                        >
                            {s.label}
                            {s._new && (
                                <span style={{
                                    width: 6, height: 6, borderRadius: '50%',
                                    background: '#f59e0b', display: 'inline-block',
                                }} />
                            )}
                            {/* Small green dot if image is set */}
                            {s.panoramaImageUrl && (
                                <span style={{
                                    width: 6, height: 6, borderRadius: '50%',
                                    background: '#22c55e', display: 'inline-block',
                                }} title="Panorama image set" />
                            )}
                        </button>

                        {/* Upload button — only shown on active scene tab */}
                        {s.sceneId === activeSceneId && (
                            <button
                                onClick={() => {
                                    setUploadingSceneId(s.sceneId)
                                    fileInputRef.current?.click()
                                }}
                                disabled={uploadingImage}
                                title={s.panoramaImageUrl ? 'Replace panorama image' : 'Upload panorama image'}
                                style={{
                                    padding: '6px 9px',
                                    borderRadius: '0 999px 999px 0',
                                    border: '1.5px solid #3b82f6',
                                    borderLeft: 'none',
                                    background: uploadingImage ? '#dbeafe' : '#eff6ff',
                                    color: '#1d4ed8',
                                    fontSize: 12, cursor: uploadingImage ? 'wait' : 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 3,
                                    fontFamily: 'DM Sans, system-ui',
                                }}
                            >
                                {uploadingImage && uploadingSceneId === s.sceneId
                                    ? <Loader2 size={11} className="animate-spin" />
                                    : <span style={{ fontSize: 13 }}>🖼</span>
                                }
                                {s.panoramaImageUrl ? 'Replace' : 'Upload'}
                            </button>
                        )}
                    </div>
                ))}

                <button
                    onClick={addScene}
                    style={{
                        padding: '6px 12px', borderRadius: 999,
                        border: '1.5px dashed #d1d5db',
                        background: 'transparent', color: '#6b7280',
                        fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, system-ui',
                        display: 'flex', alignItems: 'center', gap: 4,
                    }}
                >
                    <Plus size={13} /> Scene
                </button>
            </div>

            {/* ── Toolbar ── */}
            <div style={{
                display: 'flex', gap: 6, flexWrap: 'wrap',
                marginBottom: 12, alignItems: 'center',
            }}>
                {/* Undo / Redo */}
                <Button buttonStyle='none' onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
                    <Undo2 size={15} />
                </Button>
                <Button buttonStyle='none' onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)">
                    <Redo2 size={15} />
                </Button>

                <span style={{ width: 1, height: 24, background: '#e5e7eb', display: 'inline-block', margin: '0 2px' }} />

                {/* Mode toggles */}
                <button
                    onClick={() => setEditorMode(m => m === 'table' ? null : 'table')}
                    style={{
                        padding: '6px 12px', borderRadius: 7,
                        border: '1.5px solid',
                        borderColor: editorMode === 'table' ? '#a8c5a0' : '#d1d5db',
                        background: editorMode === 'table' ? '#f0fdf4' : '#fff',
                        color: editorMode === 'table' ? '#166534' : '#374151',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 5,
                        fontFamily: 'DM Sans, system-ui',
                    }}
                >
                    <TableIcon size={13} />
                    {editorMode === 'table' ? 'Placing Table…' : '+ Table Hotspot'}
                </button>

                <button
                    onClick={() => setEditorMode(m => m === 'navigate' ? null : 'navigate')}
                    style={{
                        padding: '6px 12px', borderRadius: 7,
                        border: '1.5px solid',
                        borderColor: editorMode === 'navigate' ? '#3b82f6' : '#d1d5db',
                        background: editorMode === 'navigate' ? '#eff6ff' : '#fff',
                        color: editorMode === 'navigate' ? '#1d4ed8' : '#374151',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 5,
                        fontFamily: 'DM Sans, system-ui',
                    }}
                >
                    <Navigation size={13} />
                    {editorMode === 'navigate' ? 'Placing Nav…' : '+ Nav Hotspot'}
                </button>

                {editorMode && (
                    <button
                        onClick={() => { setEditorMode(null); setPendingCoords(null) }}
                        style={{
                            padding: '6px 10px', borderRadius: 7,
                            border: '1.5px solid #fca5a5',
                            background: '#fef2f2', color: '#dc2626',
                            fontSize: 12, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 4,
                            fontFamily: 'DM Sans, system-ui',
                        }}
                    >
                        <X size={12} /> Cancel
                    </button>
                )}

                <span style={{ width: 1, height: 24, background: '#e5e7eb', display: 'inline-block', margin: '0 2px' }} />

                {selectedHotspotKey && (
                    <button
                        onClick={deleteHotspot}
                        style={{
                            padding: '6px 12px', borderRadius: 7,
                            border: '1.5px solid #fca5a5',
                            background: '#fef2f2', color: '#dc2626',
                            fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 5,
                            fontFamily: 'DM Sans, system-ui',
                        }}
                    >
                        <Trash2 size={13} /> Delete Hotspot
                    </button>
                )}

                {activeSceneId && (
                    <button
                        onClick={deleteScene}
                        style={{
                            padding: '6px 12px', borderRadius: 7,
                            border: '1.5px solid #e5e7eb',
                            background: '#fff', color: '#6b7280',
                            fontSize: 13, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 5,
                            fontFamily: 'DM Sans, system-ui',
                        }}
                    >
                        <Trash2 size={13} /> Delete Scene
                    </button>
                )}

                {/* Save — pushed to right like FloorPlanEditorClient */}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {status && (
                        <span style={{ fontSize: 13, color: status.ok ? '#15803d' : '#dc2626' }}>
                            {status.msg}
                        </span>
                    )}
                    <Button
                        onClick={saveAll}
                        disabled={loadingSave || !doc}
                    >
                        {loadingSave && <Loader2 size={13} style={{ marginRight: 4 }} className="animate-spin" />}
                        {loadingSave ? 'Saving…' : 'Save Panorama'}
                    </Button>
                </div>
            </div>

            {/* ── Viewer ── */}
            <div style={{
                border: '1px solid #d1d5db',
                borderRadius: 10,
                overflow: 'hidden',
                cursor: editorMode ? 'crosshair' : 'grab',
                height: 560,   // ← add this
            }}>
                <PhotoSphereViewer
                    imageUrl={activeScene?.panoramaImageUrl ?? ""}
                    hotspots={visibleHotspots}
                    editorMode={editorMode}
                    selectedKey={selectedHotspotKey}
                    onPanoramaClick={handlePanoramaClick}
                    onHotspotClick={setSelectedHotspotKey}
                    height={560}
                />
            </div>

            {/* ── Info bar ── */}
            {(selectedHotspot || activeScene) && (
                <div style={{
                    marginTop: 10, padding: '9px 14px',
                    background: '#f9fafb', border: '1px solid #e5e7eb',
                    borderRadius: 8, fontSize: 13,
                    display: 'inline-flex', gap: 14, alignItems: 'center', flexWrap: 'wrap',
                }}>
                    {selectedHotspot ? (
                        <>
                            <strong>
                                {selectedHotspot.type === 'table'
                                    ? `Table T-${selectedHotspot.tableNumber}`
                                    : `Nav → ${selectedHotspot.targetSceneLabel}`}
                            </strong>
                            <span style={{ color: '#6b7280' }}>
                                yaw: {selectedHotspot.yaw.toFixed(1)}°
                                · pitch: {selectedHotspot.pitch.toFixed(1)}°
                            </span>
                            {selectedHotspot._new && (
                                <span style={{ color: '#f59e0b' }}>● unsaved</span>
                            )}
                            <span style={{ color: '#9ca3af', fontSize: 12 }}>
                                click "Delete Hotspot" to remove
                            </span>
                        </>
                    ) : activeScene ? (
                        <>
                            <strong>{activeScene.label}</strong>
                            <span style={{ color: '#6b7280' }}>
                                {visibleHotspots.length} hotspot{visibleHotspots.length !== 1 ? 's' : ''}
                            </span>
                            <span style={{ color: '#9ca3af', fontSize: 12 }}>
                                click a mode button then click the panorama to place a hotspot
                            </span>
                        </>
                    ) : null}
                </div>
            )}

            {/* ── Hotspot count summary ── */}
            {visibleScenes.length > 0 && (
                <div style={{
                    marginTop: 8, fontSize: 12, color: '#9ca3af',
                    display: 'flex', gap: 12, flexWrap: 'wrap',
                }}>
                    {visibleScenes.map(s => (
                        <span key={s.sceneId}>
                            {s.label}: {s.hotspots.filter(h => !h._deleted && h.type === 'table').length} tables,{' '}
                            {s.hotspots.filter(h => !h._deleted && h.type === 'navigate').length} nav
                        </span>
                    ))}
                </div>
            )}

            {/* ── Pickers ── */}
            {showTablePicker && (
                <TablePickerPopup
                    tables={availableTables}
                    onPick={handlePickTable}
                    onCancel={() => { setShowTablePicker(false); setPendingCoords(null) }}
                />
            )}
            {showScenePicker && (
                <ScenePickerPopup
                    scenes={visibleScenes}
                    currentSceneId={activeSceneId ?? ''}
                    onPick={handlePickScene}
                    onCancel={() => { setShowScenePicker(false); setPendingCoords(null) }}
                />
            )}
        </div>
    )
}

export default PanoramaEditorClient