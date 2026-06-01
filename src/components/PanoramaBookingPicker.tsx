//@ts-nocheck
'use client'

import React, { useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import type { PanoramaHotspot, HotspotStatus } from '../components/admin/PhotoSphereViewer'

const PhotoSphereViewer = dynamic(() => import('../components/admin/PhotoSphereViewer'), {
    ssr: false,
    loading: () => (
        <div style={{
            height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#0f172a', color: '#64748b',
            fontFamily: 'DM Sans, system-ui', borderRadius: 12, fontSize: 13,
        }}>
            Loading 3D view…
        </div>
    ),
})

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChairInfo { chairId: string; seatLabel?: string }

interface TableInfo {
    id: string; tableNumber: string; capacity: number
    zone?: string; type?: string; chairs: ChairInfo[]
}

interface AvailabilityInfo {
    status: HotspotStatus
    bookedChairs: number; totalChairs: number
    bookedChairIds: string[]
}

interface PanoramaSceneDoc {
    sceneId: string; label: string; panoramaImageUrl?: string
    hotspots: {
        key: string; type: 'table' | 'navigate'
        yaw: number; pitch: number
        tableId?: string; tableNumber?: string
        targetSceneId?: string; targetSceneLabel?: string
    }[]
}

export interface PanoramaBookingPickerProps {
    date: string; time: string; duration?: number
    guests: number
    selectedChairKeys: Set<string>
    onSelectionChange: (keys: Set<string>) => void
}

const STATUS_COLOR: Record<HotspotStatus, string> = {
    available: '#a8c5a0', partial: '#f59e0b',
    booked: '#ef4444', inactive: '#6b7280',
}

// ── Helpers (same pattern as FloorPlanPicker) ─────────────────────────────────

/**
 * Resolves human-friendly date labels like "Today" / "Tomorrow" into
 * "YYYY-MM-DD". Already-formatted dates pass through unchanged.
 */
function resolveDate(raw: string): string {
    const lower = raw.trim().toLowerCase()
    if (lower === 'today') {
        const now = new Date()
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    }
    if (lower === 'tomorrow') {
        const d = new Date()
        d.setDate(d.getDate() + 1)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }
    return raw.trim()
}

/**
 * Normalises "7:00 PM" → "19:00" and passes through "19:00" / "07:00"
 * unchanged. Matches the exact logic used in FloorPlanPicker.
 */
function resolveTime(raw: string): string {
    const ampm = raw.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
    if (ampm) {
        let h = parseInt(ampm[1], 10)
        const m = ampm[2]
        const meridiem = ampm[3].toUpperCase()
        if (meridiem === 'AM' && h === 12) h = 0
        if (meridiem === 'PM' && h !== 12) h += 12
        return `${String(h).padStart(2, '0')}:${m}`
    }
    return raw.trim()
}

// ── Chair Picker Panel ────────────────────────────────────────────────────────

function ChairPickerPanel({ table, availability, guests, selectedChairKeys, onSelectionChange, onClose }: {
    table: TableInfo; availability: AvailabilityInfo | null
    guests: number; selectedChairKeys: Set<string>
    onSelectionChange: (keys: Set<string>) => void; onClose: () => void
}) {
    const bookedIds = new Set(availability?.bookedChairIds ?? [])
    const selectedForThisTable = table.chairs
        .filter(c => selectedChairKeys.has(`${table.id}:${c.chairId}`))
    const totalSelectedCount = selectedChairKeys.size
    const remainingSlots = guests - totalSelectedCount + selectedForThisTable.length

    const toggleChair = (chairId: string) => {
        const key = `${table.id}:${chairId}`
        const next = new Set(selectedChairKeys)
        if (next.has(key)) { next.delete(key) }
        else {
            if (totalSelectedCount >= guests) return
            next.add(key)
        }
        onSelectionChange(next)
    }

    const statusColor = availability ? STATUS_COLOR[availability.status] : STATUS_COLOR.available

    return (
        <div style={{
            position: 'absolute', right: 16, top: 16, bottom: 16,
            width: 240, zIndex: 20,
            background: 'rgba(15,23,42,0.97)',
            border: `1px solid ${statusColor}44`,
            borderRadius: 14,
            boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(12px)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            animation: 'slideIn 0.2s ease',
        }}>
            <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}`}</style>

            <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', fontFamily: 'DM Sans, system-ui' }}>Table T-{table.tableNumber}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, fontFamily: 'DM Sans, system-ui' }}>
                        {table.zone ?? ''}{table.zone ? ' · ' : ''}{table.capacity} seats
                    </div>
                </div>
                <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 18, lineHeight: 1, padding: 2 }}>×</button>
            </div>

            <div style={{ padding: '10px 16px 6px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `${statusColor}18`, border: `1px solid ${statusColor}44`, borderRadius: 999, padding: '3px 10px' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: statusColor, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'DM Sans, system-ui' }}>
                        {availability?.bookedChairs ?? 0}/{availability?.totalChairs ?? table.capacity} booked
                    </span>
                </div>
            </div>

            <div style={{ padding: '4px 16px 8px' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'DM Sans, system-ui' }}>
                    Select up to <strong style={{ color: '#f1f5f9' }}>{remainingSlots}</strong> more seat{remainingSlots !== 1 ? 's' : ''}
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {table.chairs.map(chair => {
                        const key = `${table.id}:${chair.chairId}`
                        const isBooked = bookedIds.has(chair.chairId)
                        const isSelected = selectedChairKeys.has(key)
                        const isDisabled = isBooked || (!isSelected && totalSelectedCount >= guests)

                        return (
                            <button
                                type="button"
                                key={chair.chairId}
                                onClick={() => !isDisabled && toggleChair(chair.chairId)}
                                disabled={isDisabled}
                                style={{
                                    padding: '10px 6px', borderRadius: 9,
                                    border: '1.5px solid',
                                    borderColor: isSelected ? '#a8c5a0' : isBooked ? '#ef444444' : '#334155',
                                    background: isSelected ? '#a8c5a018' : isBooked ? '#ef444408' : 'transparent',
                                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                                    opacity: isDisabled && !isSelected ? 0.45 : 1,
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                                    transition: 'all 0.12s ease',
                                }}
                            >
                                <div style={{ fontSize: 18 }}>{isBooked ? '🚫' : isSelected ? '✅' : '🪑'}</div>
                                <span style={{ fontSize: 10, fontWeight: 600, color: isSelected ? '#a8c5a0' : isBooked ? '#ef4444' : '#94a3b8', fontFamily: 'DM Sans, system-ui', letterSpacing: '0.04em' }}>
                                    {chair.seatLabel || chair.chairId}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {selectedForThisTable.length > 0 && (
                <div style={{ padding: '10px 16px', borderTop: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: '#a8c5a0', fontFamily: 'DM Sans, system-ui', fontWeight: 600 }}>
                        {selectedForThisTable.length} seat{selectedForThisTable.length !== 1 ? 's' : ''} selected
                    </span>
                    <button
                        type="button"
                        onClick={() => {
                            const next = new Set(selectedChairKeys)
                            table.chairs.forEach(c => next.delete(`${table.id}:${c.chairId}`))
                            onSelectionChange(next)
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 11, fontFamily: 'DM Sans, system-ui', textDecoration: 'underline' }}
                    >Clear</button>
                </div>
            )}
        </div>
    )
}

// ── Main component ────────────────────────────────────────────────────────────

export function PanoramaBookingPicker({ date, time, duration = 90, guests, selectedChairKeys, onSelectionChange }: PanoramaBookingPickerProps) {
    const [scenes, setScenes] = useState<PanoramaSceneDoc[]>([])
    const [activeSceneId, setActiveSceneId] = useState<string | null>(null)
    const [tableMap, setTableMap] = useState<Record<string, TableInfo>>({})
    const [availability, setAvailability] = useState<Record<string, AvailabilityInfo>>({})
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [availLoading, setAvailLoading] = useState(false)
    const [availLoaded, setAvailLoaded] = useState(false)

    const tablesLoadedRef = useRef(false)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const pollRef = useRef<ReturnType<typeof setInterval>>()

    // ── fetchAvailability — same pattern as FloorPlanPicker ──────────────────
    // Fetches ALL non-cancelled reservations then filters by time overlap in JS.
    // No custom API endpoint needed — identical to what works in the 2D picker.
    // tableMapOverride lets the initial call pass the map before state has settled.
    const fetchAvailability = async (forDate: string, forTime: string, dur: number, tableMapOverride?: Record<string, TableInfo>) => {
        setAvailLoading(true)
        try {
            const resolvedDate = resolveDate(forDate)
            const resolvedTime = resolveTime(forTime)

            const dt = new Date(`${resolvedDate}T${resolvedTime}:00`)
            if (isNaN(dt.getTime())) {
                console.warn('[PanoramaBookingPicker] invalid date/time after resolve:', resolvedDate, resolvedTime)
                return
            }

            const slotStart = dt.getTime()
            const slotEnd = slotStart + dur * 60 * 1000
            console.log('[PanoramaBookingPicker] checking slot', dt.toISOString(), '→', new Date(slotEnd).toISOString())

            // ── Same fetch as FloorPlanPicker — all non-cancelled reservations ──
            const res = await fetch(`/api/reservation?where[status][not_equals]=cancelled&limit=500&depth=1`)
            const data = await res.json()

            // Build: tableId → booked chairIds (filtering by time overlap in JS)
            const bookedByTable: Record<string, string[]> = {}

            for (const reservation of data.docs ?? []) {
                const resStart = new Date(reservation.reservationDate).getTime()
                const resDur = (reservation.duration ?? 90) * 60 * 1000
                const resEnd = resStart + resDur

                // Skip non-overlapping
                if (slotStart >= resEnd || slotEnd <= resStart) continue

                for (const bc of reservation.bookedChairs ?? []) {
                    const tableId = typeof bc.table === 'object'
                        ? String(bc.table?.id ?? '')
                        : String(bc.table ?? '')

                    if (!tableId || !bc.chairId) continue
                    if (!bookedByTable[tableId]) bookedByTable[tableId] = []
                    if (!bookedByTable[tableId].includes(bc.chairId)) {
                        bookedByTable[tableId].push(bc.chairId)
                    }
                }
            }

            console.log('[PanoramaBookingPicker] booked by table:', bookedByTable)

            // Use override map if provided (initial call before state settles),
            // otherwise use the state value
            const map = tableMapOverride ?? tableMap

            const avail: Record<string, AvailabilityInfo> = {}
            for (const [tableId, table] of Object.entries(map)) {
                const bookedChairIds = bookedByTable[tableId] ?? []
                const total = table.capacity
                const booked = bookedChairIds.length
                let status: HotspotStatus = 'available'
                if (booked >= total) status = 'booked'
                else if (booked > 0) status = 'partial'

                avail[tableId] = { status, bookedChairs: booked, totalChairs: total, bookedChairIds }
            }

            setAvailability(avail)
            setAvailLoaded(true)
        } catch (e) {
            console.error('[PanoramaBookingPicker] availability error', e)
        } finally {
            setAvailLoading(false)
        }
    }

    // ── Load panorama + tables once, then immediately fetch availability ───────
    useEffect(() => {
        Promise.all([
            fetch('/api/panorama-view?limit=1&depth=2').then(r => r.json()),
            fetch('/api/table-layout?limit=500&depth=1').then(r => r.json()),
        ]).then(([pvData, tlData]) => {
            const map: Record<string, TableInfo> = {}
            for (const t of (tlData.docs ?? [])) {
                map[String(t.id)] = {
                    id: String(t.id),
                    tableNumber: t.tableNumber ?? '',
                    capacity: t.capacity ?? 4,
                    zone: t.zone ?? '',
                    type: t.type ?? 'square',
                    chairs: (t.chairs ?? []).map((c: any) => ({
                        chairId: c.chairId ?? '',
                        seatLabel: c.seatLabel ?? '',
                    })),
                }
            }
            setTableMap(map)

            const doc = pvData.docs?.[0]
            if (doc) {
                const mapped: PanoramaSceneDoc[] = (doc.scenes ?? []).map((s: any) => ({
                    sceneId: s.sceneId,
                    label: s.label ?? 'Scene',
                    panoramaImageUrl: s.panoramaImage?.url ?? '',
                    hotspots: (s.hotspots ?? []).map((h: any) => ({
                        key: h.key,
                        type: h.type,
                        yaw: h.yaw ?? 0,
                        pitch: h.pitch ?? 0,
                        tableId: typeof h.table === 'object' ? h.table?.id : h.table,
                        tableNumber: h.tableNumber ?? h.table?.tableNumber,
                        targetSceneId: h.targetSceneId,
                        targetSceneLabel: h.targetSceneLabel,
                    })),
                }))
                setScenes(mapped)
                setActiveSceneId(mapped[0]?.sceneId ?? null)
            }

            tablesLoadedRef.current = true
            setLoading(false)

            // Pass map directly — setTableMap has not settled into state yet
            fetchAvailability(date, time, duration, map)
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ── Re-fetch with debounce whenever date/time/duration changes ─────────────
    useEffect(() => {
        // Don't run until tables have loaded (initial fetch above handles that)
        if (!tablesLoadedRef.current) return

        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            fetchAvailability(date, time, duration)
        }, 400)

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date, time, duration])

    // ── Polling every 30s ──────────────────────────────────────────────────────
    useEffect(() => {
        clearInterval(pollRef.current)
        if (!date || !time) return
        pollRef.current = setInterval(() => fetchAvailability(date, time, duration), 30_000)
        return () => clearInterval(pollRef.current)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date, time, duration])

    // ── Build hotspots ────────────────────────────────────────────────────────
    const activeScene = scenes.find(s => s.sceneId === activeSceneId)

    const hotspots: PanoramaHotspot[] = (activeScene?.hotspots ?? []).map(h => {
        if (h.type === 'navigate') {
            return { key: h.key, type: 'navigate' as const, yaw: h.yaw, pitch: h.pitch, targetSceneId: h.targetSceneId, targetSceneLabel: h.targetSceneLabel }
        }
        const tableId = h.tableId ?? ''
        const avail = availability[tableId]
        const selectedHere = [...selectedChairKeys].filter(k => k.startsWith(`${tableId}:`)).length
        return {
            key: h.key, type: 'table' as const,
            yaw: h.yaw, pitch: h.pitch,
            tableNumber: h.tableNumber ?? tableMap[tableId]?.tableNumber ?? '?',
            bookedChairs: (avail?.bookedChairs ?? 0) + selectedHere,
            totalChairs: avail?.totalChairs ?? tableMap[tableId]?.capacity ?? 0,
            status: !availLoaded ? 'inactive' : (avail?.status ?? 'available'),
        }
    })

    const handleHotspotClick = (key: string) => {
        if (key.startsWith('nav:')) {
            // Extract target sceneId from the key "nav:patio"
            const targetSceneId = key.replace('nav:', '')
            setActiveSceneId(targetSceneId)
            setSelectedTableId(null)
            return
        }
        if (!key.startsWith('table:')) return
        const tableId = key.replace('table:', '')
        const avail = availability[tableId]
        if (avail?.status === 'booked') return
        setSelectedTableId(prev => prev === tableId ? null : tableId)
    }

    const totalSelected = selectedChairKeys.size

    if (loading) {
        return (
            <div style={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', borderRadius: 12, color: '#64748b', fontFamily: 'DM Sans, system-ui', fontSize: 13 }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #334155', borderTopColor: '#3b82f6', animation: 'spin 0.8s linear infinite', margin: '0 auto 8px' }} />
                    Loading floor…
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </div>
            </div>
        )
    }

    if (scenes.length === 0) {
        return (
            <div style={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', borderRadius: 12, color: '#64748b', fontFamily: 'DM Sans, system-ui', fontSize: 13, flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 28 }}>🌐</span>
                <span>No panorama configured yet</span>
            </div>
        )
    }

    const selectedTable = selectedTableId ? tableMap[selectedTableId] : null
    const selectedTableAvail = selectedTableId ? availability[selectedTableId] : null

    return (
        <div style={{ fontFamily: 'DM Sans, system-ui' }}>
            {/* Scene tabs */}
            {scenes.length > 1 && (
                <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
                    {scenes.map(s => (
                        <button
                            type="button"
                            key={s.sceneId}
                            onClick={() => { setActiveSceneId(s.sceneId); setSelectedTableId(null) }}
                            style={{ padding: '4px 12px', borderRadius: 999, border: '1px solid', borderColor: s.sceneId === activeSceneId ? '#3b82f6' : '#334155', background: s.sceneId === activeSceneId ? '#1d4ed820' : 'transparent', color: s.sceneId === activeSceneId ? '#60a5fa' : '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, system-ui' }}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            )}

            <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden' }}>
                <PhotoSphereViewer
                    imageUrl={activeScene?.panoramaImageUrl || 'https://pannellum.org/images/alma.jpg'}
                    hotspots={hotspots}
                    editorMode={null}
                    selectedKey={selectedTableId ? `table:${selectedTableId}` : null}
                    onHotspotClick={handleHotspotClick}
                    height={420}
                    width="100%"
                />

                {!availLoaded && !availLoading && (
                    <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', background: 'rgba(15,23,42,0.9)', borderRadius: 999, padding: '5px 14px', fontSize: 11, color: '#f59e0b', fontFamily: 'DM Sans, system-ui', zIndex: 15, whiteSpace: 'nowrap', backdropFilter: 'blur(6px)' }}>
                        📅 Select a date and time to see availability
                    </div>
                )}

                {availLoading && (
                    <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', background: 'rgba(15,23,42,0.85)', borderRadius: 999, padding: '4px 12px', fontSize: 11, color: '#94a3b8', fontFamily: 'DM Sans, system-ui', zIndex: 15 }}>
                        Checking availability…
                    </div>
                )}

                {availLoaded && !selectedTableId && !availLoading && (
                    <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', background: 'rgba(15,23,42,0.85)', borderRadius: 999, padding: '5px 14px', fontSize: 11, color: '#94a3b8', fontFamily: 'DM Sans, system-ui', zIndex: 15, whiteSpace: 'nowrap', backdropFilter: 'blur(6px)' }}>
                        🪑 Click a table to pick your seats
                    </div>
                )}

                {selectedTable && (
                    <ChairPickerPanel
                        table={selectedTable}
                        availability={selectedTableAvail}
                        guests={guests}
                        selectedChairKeys={selectedChairKeys}
                        onSelectionChange={onSelectionChange}
                        onClose={() => setSelectedTableId(null)}
                    />
                )}
            </div>

            {/* Summary */}
            <div style={{ marginTop: 10, padding: '8px 12px', background: totalSelected > 0 ? '#a8c5a010' : '#f9fafb', border: `1px solid ${totalSelected > 0 ? '#a8c5a040' : '#e5e7eb'}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                <span style={{ fontSize: 12, color: totalSelected > 0 ? '#a8c5a0' : '#9ca3af', fontWeight: 600 }}>
                    {totalSelected === 0
                        ? `Select ${guests} seat${guests !== 1 ? 's' : ''} for your party`
                        : `${totalSelected} / ${guests} seat${guests !== 1 ? 's' : ''} selected`}
                </span>
                {totalSelected > 0 && totalSelected < guests && <span style={{ fontSize: 11, color: '#f59e0b' }}>{guests - totalSelected} more needed</span>}
                {totalSelected === guests && <span style={{ fontSize: 11, color: '#a8c5a0' }}>✓ All seats chosen</span>}
                {totalSelected > 0 && (
                    <button type="button" onClick={() => onSelectionChange(new Set())} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 11, textDecoration: 'underline' }}>
                        Clear all
                    </button>
                )}
            </div>
        </div>
    )
}

export default PanoramaBookingPicker