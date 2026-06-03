'use client'

import { toSlotMs } from '@/lib/timezone'
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { HotspotStatus, PhotoSphereScene, PhotoSphereViewerTheme } from '../components/admin/PhotoSphereViewer'

const PhotoSphereViewer = dynamic(() => import('@/components/admin/PhotoSphereViewer'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            Loading panorama…
        </div>
    ),
})

// ── Types ─────────────────────────────────────────────────────────────────────

interface PanoramaPanoramaImage {
    url?: string | null
}

type PanoramaHotspotDoc = {
    key?: string | null
    type?: 'table' | 'navigate' | null
    yaw?: number | null
    pitch?: number | null
    table?: string | number | { id?: string | number | null; tableNumber?: string | null } | null
    tableNumber?: string | null
    targetSceneId?: string | null
    targetSceneLabel?: string | null
}

type PanoramaSceneDoc = {
    sceneId?: string | null
    label?: string | null
    panoramaImage?: PanoramaPanoramaImage | string | null
    defaultYaw?: number | null
    defaultPitch?: number | null
    hotspots?: PanoramaHotspotDoc[] | null
}

type PanoramaViewDoc = {
    id: string | number
    scenes?: PanoramaSceneDoc[] | null
}

type ReservationApiDoc = {
    reservationDate: string
    duration?: number | null
    reservedTables?: (string | number | { id?: string | number | null })[] | null
    bookedChairs?: { table?: string | number | { id?: string | number | null } }[] | null
}

interface PanoramaPickerProps {
    date: string
    time: string
    duration?: number
    guests: number
    selectedTableIds: Set<string>
    onSelectionChange: (keys: Set<string>) => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function relationId(value: string | number | { id?: string | number | null } | null | undefined): string {
    if (typeof value === 'object' && value !== null) {
        return value.id ? String(value.id) : ''
    }
    return value ? String(value) : ''
}

function getImageUrl(img: PanoramaPanoramaImage | string | null | undefined): string {
    if (!img) return ''
    if (typeof img === 'string') return img
    return img.url ?? ''
}

const DEFAULT_THEME: PhotoSphereViewerTheme = {
    available: '#a8c5a0',
    booked: '#ef4444',
    inactive: '#6b7280',
    selected: '#3b82f6',
    text: '#ffffff',
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PanoramaPicker({
    date,
    time,
    duration = 90,
    guests,
    selectedTableIds,
    onSelectionChange,
}: PanoramaPickerProps) {
    const [scenes, setScenes] = useState<PhotoSphereScene[]>([])
    const [activeSceneId, setActiveSceneId] = useState<string | undefined>(undefined)
    const [bookedTableIds, setBookedTableIds] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const [availLoading, setAvailLoading] = useState(false)

    // Raw hotspot docs keyed by sceneId — we re-map statuses on top
    const rawScenesRef = useRef<{ sceneId: string; panoramaUrl: string; hotspots: { key: string; tableId: string; tableNumber: string; yaw: number; pitch: number; type: 'table' | 'navigate'; targetSceneId?: string; targetSceneLabel?: string }[] }[]>([])

    const tablesLoadedRef = useRef(false)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // ── Build PhotoSphereScene[] by merging raw hotspot data with availability ──

    const buildScenes = useCallback((booked: Set<string>, selected: Set<string>): PhotoSphereScene[] => {
        return rawScenesRef.current.map(rawScene => ({
            sceneId: rawScene.sceneId,
            label: rawScene.sceneId,
            panoramaUrl: rawScene.panoramaUrl,  // ← empty!
            hotspots: rawScene.hotspots.map(h => {
                if (h.type === 'navigate') {
                    return {
                        key: h.key,
                        type: 'navigate' as const,
                        yaw: h.yaw,
                        pitch: h.pitch,
                        targetSceneId: h.targetSceneId,
                        targetSceneLabel: h.targetSceneLabel,
                    }
                }
                const status: HotspotStatus = booked.has(h.tableId)
                    ? 'booked'
                    : 'available'
                return {
                    key: h.key,
                    type: 'table' as const,
                    yaw: h.yaw,
                    pitch: h.pitch,
                    tableId: h.tableId,
                    tableNumber: h.tableNumber,
                    status,
                }
            }),
        }))
    }, [])

    // ── Fetch availability ────────────────────────────────────────────────────

    const fetchAvailability = useCallback(async (forDate: string, forTime: string, dur: number) => {
        setAvailLoading(true)
        try {
            const res = await fetch(
                `/api/reservation?where[status][not_equals]=cancelled&limit=500&depth=1`
            )
            const data = await res.json()

            const occupied = new Set<string>()
            const startMs = (forDate && forTime) ? toSlotMs(forDate, forTime) : null
            const endMs = startMs !== null ? startMs + dur * 60 * 1000 : null

            for (const reservation of (data.docs ?? []) as ReservationApiDoc[]) {
                if (startMs !== null && endMs !== null) {
                    const resStart = new Date(reservation.reservationDate).getTime()
                    const resDur = (reservation.duration ?? 90) * 60 * 1000
                    const resEnd = resStart + resDur
                    if (startMs >= resEnd || endMs <= resStart) continue
                }

                for (const table of reservation.reservedTables ?? []) {
                    const tableId = relationId(table)
                    if (tableId) occupied.add(tableId)
                }
                for (const bc of reservation.bookedChairs ?? []) {
                    const tableId = relationId(bc.table)
                    if (tableId) occupied.add(tableId)
                }
            }

            setBookedTableIds(occupied)

            // Remove any selected tables that are now booked
            const validSelected = new Set([...selectedTableIds].filter(k => !occupied.has(k)))
            if (validSelected.size !== selectedTableIds.size) {
                onSelectionChange(validSelected)
            }

            // Rebuild scenes with updated statuses
            setScenes(buildScenes(occupied, validSelected))

        } catch (err) {
            console.error('[PanoramaPicker] availability fetch failed', err)
            setBookedTableIds(new Set())
        } finally {
            setAvailLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [duration, buildScenes])

    // ── Load panorama-view collection ─────────────────────────────────────────

    useEffect(() => {
        fetch('/api/panorama-view?limit=1&depth=2')
            .then(r => r.json())
            .then((pvData) => {
                const pv: PanoramaViewDoc | undefined = pvData.docs?.[0]
                if (!pv?.scenes?.length) {
                    setLoading(false)
                    return
                }

                // Build raw scene refs (stable — no availability baked in yet)
                rawScenesRef.current = pv.scenes
                    .filter((s): s is PanoramaSceneDoc & { sceneId: string } => !!s.sceneId)
                    .map(s => ({
                        sceneId: s.sceneId,
                        panoramaUrl: getImageUrl(s.panoramaImage),
                        hotspots: (s.hotspots ?? []).map(h => {
                            const tableObj = h.table
                            const tableId = typeof tableObj === 'object' && tableObj !== null
                                ? String((tableObj as any).id ?? '')
                                : String(tableObj ?? '')
                            const tableNumber = typeof tableObj === 'object' && tableObj !== null
                                ? (tableObj as any).tableNumber ?? h.tableNumber ?? ''
                                : h.tableNumber ?? ''
                            return {
                                key: h.key ?? `${h.type}:${tableId || h.targetSceneId || Math.random()}`,
                                type: (h.type ?? 'table') as 'table' | 'navigate',
                                yaw: h.yaw ?? 0,
                                pitch: h.pitch ?? 0,
                                tableId,
                                tableNumber,
                                targetSceneId: h.targetSceneId ?? undefined,
                                targetSceneLabel: h.targetSceneLabel ?? undefined,
                            }
                        }),
                    }))

                // Build initial scenes (all available, no booking data yet)
                const initialScenes: PhotoSphereScene[] = pv.scenes
                    .filter((s): s is PanoramaSceneDoc & { sceneId: string } => !!s.sceneId)
                    .map(s => ({
                        sceneId: s.sceneId,
                        label: s.label ?? s.sceneId,
                        panoramaUrl: getImageUrl(s.panoramaImage),
                        hotspots: (s.hotspots ?? []).map(h => {
                            const tableObj = h.table
                            const tableId = typeof tableObj === 'object' && tableObj !== null
                                ? String((tableObj as any).id ?? '')
                                : String(tableObj ?? '')
                            const tableNumber = typeof tableObj === 'object' && tableObj !== null
                                ? (tableObj as any).tableNumber ?? h.tableNumber ?? ''
                                : h.tableNumber ?? ''
                            return {
                                key: h.key ?? `${h.type}:${tableId || h.targetSceneId || Math.random()}`,
                                type: (h.type ?? 'table') as 'table' | 'navigate',
                                yaw: h.yaw ?? 0,
                                pitch: h.pitch ?? 0,
                                tableId,
                                tableNumber,
                                status: 'available' as HotspotStatus,
                                targetSceneId: h.targetSceneId ?? undefined,
                                targetSceneLabel: h.targetSceneLabel ?? undefined,
                            }
                        }),
                    }))

                setScenes(initialScenes)
                setActiveSceneId(initialScenes[0]?.sceneId)
                tablesLoadedRef.current = true
                setLoading(false)

                fetchAvailability(date, time, duration)
            })
            .catch(err => {
                console.error('[PanoramaPicker] load failed', err)
                setLoading(false)
            })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ── Re-fetch with debounce when date/time/duration changes ────────────────

    useEffect(() => {
        if (!tablesLoadedRef.current) return
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            fetchAvailability(date, time, duration)
        }, 400)
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [date, time, duration, fetchAvailability])

    // ── Reset selection on guest/date/time changes ────────────────────────────

    useEffect(() => {
        onSelectionChange(new Set())
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [guests, date, time])

    // ── Update scenes when selectedTableIds changes (keep marker highlights in sync) ──

    useEffect(() => {
        if (!tablesLoadedRef.current) return
        setScenes(buildScenes(bookedTableIds, selectedTableIds))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTableIds, bookedTableIds])

    // ── Handle hotspot click from panorama ───────────────────────────────────

    const handleHotspotClick = useCallback((key: string) => {
        // Check if it's a nav hotspot first
        for (const raw of rawScenesRef.current) {
            const h = raw.hotspots.find(h => h.key === key)
            if (h && h.type === 'navigate' && h.targetSceneId) {
                setActiveSceneId(h.targetSceneId)  // ← manual scene switch
                return
            }
            if (h && h.type === 'table' && h.tableId) {
                if (bookedTableIds.has(h.tableId)) return
                const next = new Set(selectedTableIds)
                if (next.has(h.tableId)) next.delete(h.tableId)
                else next.add(h.tableId)
                onSelectionChange(next)
                return
            }
        }
    }, [bookedTableIds, selectedTableIds, onSelectionChange])

    // ── Derived ───────────────────────────────────────────────────────────────

    const selectedTables = scenes
        .flatMap(s => s.hotspots)
        .filter(h => h.type === 'table' && h.tableId && selectedTableIds.has(h.tableId ?? ''))

    // We don't have per-table capacity here, so we use the FloorPlan for that.
    // Just show a simple count indicator.
    const selectedCount = selectedTableIds.size

    const legendItems = [
        { color: DEFAULT_THEME.available, label: 'Available' },
        { color: DEFAULT_THEME.booked, label: 'Booked' },
        { color: DEFAULT_THEME.selected, label: 'Your selection' },
    ]

    if (loading) {
        return (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                Loading panorama…
            </div>
        )
    }

    if (!scenes.length) {
        return (
            <p className="text-sm text-muted-foreground py-4">
                No panorama tour set up yet. Ask the restaurant to configure one in the admin panel.
            </p>
        )
    }

    return (
        <div className="flex flex-col gap-3">
            {/* Legend */}
            <div className="flex gap-4 flex-wrap text-xs text-muted-foreground">
                {legendItems.map(l => (
                    <span key={l.label} className="flex items-center gap-1.5">
                        <span
                            className="inline-block w-3 h-3 rounded-full"
                            style={{ background: l.color }}
                        />
                        {l.label}
                    </span>
                ))}
            </div>

            {/* Status line — mirrors FloorPlanPicker */}
            <div className="flex items-center gap-2 text-xs">
                {availLoading && (
                    <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full text-muted-foreground" />
                )}
                {(!date || !time) ? (
                    <p className="text-amber-600">
                        ⚠ Select a date and time above to filter availability.
                    </p>
                ) : selectedCount === 0 ? (
                    <p className="text-amber-600">
                        Click a table in the panorama to select it.
                    </p>
                ) : (
                    <p className="text-green-700">
                        ✓ {selectedCount} table{selectedCount !== 1 ? 's' : ''} selected — you're all set!
                    </p>
                )}
            </div>

            {/* Panorama viewer */}
            <div className="border rounded-lg overflow-hidden" style={{ maxWidth: '100%' }}>
                <PhotoSphereViewer
                    imageUrl={scenes.find(s => s.sceneId === activeSceneId)?.panoramaUrl ?? ''}
                    hotspots={scenes.find(s => s.sceneId === activeSceneId)?.hotspots ?? []}
                    selectedTableIds={selectedTableIds}
                    onHotspotClick={handleHotspotClick}
                    height={460}
                    width="100%"
                    disableIntro={false}
                    key={activeSceneId}
                />
            </div>

            {/* Scene tabs — shown only when there are multiple scenes */}
            {scenes.length > 1 && (
                <div className="flex gap-2 flex-wrap text-xs">
                    {scenes.map(s => (
                        <button
                            key={s.sceneId}
                            onClick={() => setActiveSceneId(s.sceneId)}
                            className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${s.sceneId === activeSceneId
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border text-muted-foreground hover:border-primary/50'
                                }`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export default PanoramaPicker