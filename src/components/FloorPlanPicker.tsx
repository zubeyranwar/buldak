'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import type { CanvasTable, FloorPlanTheme } from '@/components/admin/FloorPlanEditorClient'

const KonvaCanvas = dynamic(() => import('@/components/admin/KonvaCanvas'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            Loading floor plan…
        </div>
    ),
})

export interface BookedChair {
    table: string
    chairId: string
}

interface FloorPlanPickerProps {
    date: string
    time: string
    duration?: number
    guests: number
    selectedChairKeys: Set<string>
    onSelectionChange: (keys: Set<string>) => void
}

const DEFAULT_THEME: FloorPlanTheme = {
    tableFillColor: '#d4a96a',
    chairFillColor: '#a8c5a0',
    textFillColor: '#374151',
    selectionColor: '#3b82f6',
    bookedColor: '#ef4444',
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FloorPlanPicker({
    date,
    time,
    duration = 90,
    guests,
    selectedChairKeys,
    onSelectionChange,
}: FloorPlanPickerProps) {
    const [tables, setTables] = useState<CanvasTable[]>([])
    const [floorPlan, setFloorPlan] = useState<{
        imageUrl: string
        canvasWidth: number
        canvasHeight: number
    } | null>(null)
    const [theme, setTheme] = useState<FloorPlanTheme>(DEFAULT_THEME)
    const [bookedChairKeys, setBookedChairKeys] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const [availLoading, setAvailLoading] = useState(false)
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null)

    // Track if layout has loaded so we can trigger availability after
    const tablesLoadedRef = useRef(false)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // ── Fetch availability — standalone function so it can be called anytime ──

    const fetchAvailability = useCallback(async (forDate: string, forTime: string, dur: number) => {
        setAvailLoading(true)
        try {
            const res = await fetch(
                `/api/reservation?where[status][not_equals]=cancelled&limit=500&depth=1`
            )
            const data = await res.json()

            // If no date/time selected yet, show ALL booked chairs regardless of time
            // so users always see what's reserved
            const occupied = new Set<string>()

            // Parse selected time to ms if provided
            let startMs: number | null = null
            let endMs: number | null = null

            if (forDate && forTime) {
                // Normalise 12h → 24h
                const ampm = forTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
                let time24 = forTime
                if (ampm) {
                    let h = parseInt(ampm[1], 10)
                    const m = ampm[2]
                    const meridiem = ampm[3].toUpperCase()
                    if (meridiem === 'AM' && h === 12) h = 0
                    if (meridiem === 'PM' && h !== 12) h += 12
                    time24 = `${String(h).padStart(2, '0')}:${m}`
                }
                const dt = new Date(`${forDate}T${time24}:00`)
                if (!isNaN(dt.getTime())) {
                    startMs = dt.getTime()
                    endMs = startMs + dur * 60 * 1000
                }
            }

            for (const reservation of data.docs ?? []) {
                // If we have a time, only mark chairs from overlapping reservations
                if (startMs !== null && endMs !== null) {
                    const resStart = new Date(reservation.reservationDate).getTime()
                    const resDur = (reservation.duration ?? 90) * 60 * 1000
                    const resEnd = resStart + resDur
                    // Skip non-overlapping reservations
                    if (startMs >= resEnd || endMs <= resStart) continue
                }

                for (const bc of reservation.bookedChairs ?? []) {
                    const tableId = typeof bc.table === 'object'
                        ? String(bc.table?.id ?? '')
                        : String(bc.table ?? '')
                    if (tableId && bc.chairId) {
                        occupied.add(`${tableId}:${bc.chairId}`)
                    }
                }
            }

            console.log('[FloorPlanPicker] booked keys:', [...occupied])
            setBookedChairKeys(occupied)

            // Clear selected chairs that are now booked
            onSelectionChange(new Set([...selectedChairKeys].filter(k => !occupied.has(k))))
        } catch (err) {
            console.error('[FloorPlanPicker] availability fetch failed', err)
            setBookedChairKeys(new Set())
        } finally {
            setAvailLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [duration])

    // ── Load floor plan + tables, then immediately fetch availability ─────────

    useEffect(() => {
        Promise.all([
            fetch('/api/floor-plan?limit=1&depth=2').then(r => r.json()),
            fetch('/api/table-layout?limit=500&depth=2').then(r => r.json()),
        ]).then(([fpData, tlData]) => {
            const fp = fpData.docs?.[0]
            if (fp) {
                setFloorPlan({
                    imageUrl: fp.backgroundImage?.url ?? fp.image?.url ?? '',
                    canvasWidth: fp.canvasWidth ?? 1100,
                    canvasHeight: fp.canvasHeight ?? 700,
                })
                setTheme({
                    tableFillColor: fp.theme?.tableFillColor ?? DEFAULT_THEME.tableFillColor,
                    chairFillColor: fp.theme?.chairFillColor ?? DEFAULT_THEME.chairFillColor,
                    textFillColor: fp.theme?.textFillColor ?? DEFAULT_THEME.textFillColor,
                    selectionColor: fp.theme?.selectionColor ?? DEFAULT_THEME.selectionColor,
                    bookedColor: fp.theme?.bookedColor ?? DEFAULT_THEME.bookedColor,
                })
            }

            const mapped: CanvasTable[] = (tlData.docs ?? [])
                .filter((d: any) => d.isActive !== false)
                .map((t: any): CanvasTable => ({
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
                }))

            setTables(mapped)
            tablesLoadedRef.current = true
            setLoading(false)

            // ← Fetch availability immediately after tables are ready
            fetchAvailability(date, time, duration)
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ── Re-fetch with debounce whenever date/time/duration changes ────────────

    useEffect(() => {
        // Don't run until tables have loaded (the initial fetch above handles that)
        if (!tablesLoadedRef.current) return

        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            fetchAvailability(date, time, duration)
        }, 400)

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [date, time, duration, fetchAvailability])

    // ── Handle chair click ────────────────────────────────────────────────────

    const handleChairClick = (tableId: string, chairId: string) => {
        const key = `${tableId}:${chairId}`
        if (bookedChairKeys.has(key)) return

        const next = new Set(selectedChairKeys)
        if (next.has(key)) {
            next.delete(key)
        } else {
            next.add(key)
        }
        onSelectionChange(next)
    }

    // ── Derived ───────────────────────────────────────────────────────────────

    const selectionCount = selectedChairKeys.size
    const notEnough = selectionCount < guests

    const legendItems = [
        { color: theme.chairFillColor, label: 'Available' },
        { color: theme.bookedColor, label: 'Booked' },
        { color: theme.selectionColor, label: 'Your selection' },
    ]

    if (loading) {
        return (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                Loading floor plan…
            </div>
        )
    }

    if (!floorPlan) {
        return (
            <p className="text-sm text-muted-foreground py-4">
                No floor plan found. Ask the restaurant to set one up.
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

            {/* Status line */}
            <div className="flex items-center gap-2 text-xs">
                {availLoading && (
                    <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full text-muted-foreground" />
                )}
                {(!date || !time) ? (
                    <p className="text-amber-600">
                        ⚠ Select a date and time above to filter availability.
                    </p>
                ) : notEnough ? (
                    <p className="text-amber-600">
                        Select {guests - selectionCount} more chair{guests - selectionCount !== 1 ? 's' : ''} for your party of {guests}.
                    </p>
                ) : (
                    <p className="text-green-700">
                        ✓ {selectionCount} chair{selectionCount !== 1 ? 's' : ''} selected for your party of {guests}.
                    </p>
                )}
            </div>

            {/* Canvas */}
            <div
                className="border rounded-lg overflow-auto"
                style={{ maxWidth: '100%', display: 'inline-block' }}
            >
                <KonvaCanvas
                    tables={tables}
                    floorPlan={floorPlan}
                    theme={theme}
                    selectedId={selectedTableId}
                    zoom={0.75}
                    onSelect={setSelectedTableId}
                    onChange={() => { }}
                    bookedChairKeys={bookedChairKeys}
                    selectedChairKeys={selectedChairKeys}
                    onChairClick={handleChairClick}
                    readOnly
                />
            </div>

            {/* Selected chair list */}
            {selectionCount > 0 && (
                <div className="text-xs text-muted-foreground">
                    Selected: {[...selectedChairKeys].map(k => {
                        const [tId, cId] = k.split(':')
                        const t = tables.find(x => x.id === tId)
                        return `Table ${t?.tableNumber ?? tId} · ${cId}`
                    }).join(' — ')}
                </div>
            )}
        </div>
    )
}