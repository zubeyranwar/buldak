'use client'

import type { CanvasTable, FloorPlanTheme } from '@/components/admin/FloorPlanEditorClient'
import { toSlotMs } from '@/lib/timezone'
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'

const KonvaCanvas = dynamic(() => import('@/components/admin/KonvaCanvas'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            Loading floor plan…
        </div>
    ),
})

interface FloorPlanPickerProps {
    date: string
    time: string
    duration?: number
    guests: number
    selectedTableIds: Set<string>
    onSelectionChange: (keys: Set<string>) => void
}

type ReservationApiDoc = {
    reservationDate: string
    duration?: number | null
    reservedTables?: (string | number | { id?: string | number | null })[] | null
    bookedChairs?: { table?: string | number | { id?: string | number | null } }[] | null
}

type TableApiDoc = {
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
    chairs?: {
        id?: string | number | null
        chairId?: string | null
        seatLabel?: string | null
        relativePosition?: { x?: number | null; y?: number | null } | null
    }[] | null
}

function relationId(value: string | number | { id?: string | number | null } | null | undefined) {
    if (typeof value === 'object' && value !== null) {
        return value.id ? String(value.id) : ''
    }
    return value ? String(value) : ''
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
    selectedTableIds,
    onSelectionChange,
}: FloorPlanPickerProps) {
    const [tables, setTables] = useState<CanvasTable[]>([])
    const [floorPlan, setFloorPlan] = useState<{
        imageUrl: string
        canvasWidth: number
        canvasHeight: number
    } | null>(null)
    const [theme, setTheme] = useState<FloorPlanTheme>(DEFAULT_THEME)
    const [bookedTableIds, setBookedTableIds] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const [availLoading, setAvailLoading] = useState(false)
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null)

    // Track if layout has loaded so we can trigger availability after
    const tablesLoadedRef = useRef(false)
    const userTouchedSelectionRef = useRef(false)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // ── Fetch availability — standalone function so it can be called anytime ──

    const fetchAvailability = useCallback(async (forDate: string, forTime: string, dur: number) => {
        setAvailLoading(true)
        try {
            const res = await fetch(
                `/api/reservation?where[status][not_equals]=cancelled&limit=500&depth=1`
            )
            const data = await res.json()

            const occupied = new Set<string>()

            // Parse selected time to ms if provided
            const startMs = (forDate && forTime) ? toSlotMs(forDate, forTime) : null
            const endMs = startMs !== null ? startMs + dur * 60 * 1000 : null

            for (const reservation of (data.docs ?? []) as ReservationApiDoc[]) {
                // If we have a time, only mark chairs from overlapping reservations
                if (startMs !== null && endMs !== null) {
                    const resStart = new Date(reservation.reservationDate).getTime()
                    const resDur = (reservation.duration ?? 90) * 60 * 1000
                    const resEnd = resStart + resDur
                    // Skip non-overlapping reservations
                    if (startMs >= resEnd || endMs <= resStart) continue
                }

                for (const table of reservation.reservedTables ?? []) {
                    const tableId = relationId(table)
                    if (tableId) occupied.add(tableId)
                }

                // Legacy reservations with chair selections still block the table.
                for (const bc of reservation.bookedChairs ?? []) {
                    const tableId = relationId(bc.table)
                    if (tableId) occupied.add(tableId)
                }
            }

            setBookedTableIds(occupied)

            onSelectionChange(new Set([...selectedTableIds].filter(k => !occupied.has(k))))
        } catch (err) {
            console.error('[FloorPlanPicker] availability fetch failed', err)
            setBookedTableIds(new Set())
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
                .filter((d: TableApiDoc) => d.isActive !== false)
                .map((t: TableApiDoc): CanvasTable => ({
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

    useEffect(() => {
        userTouchedSelectionRef.current = false
        onSelectionChange(new Set())
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [guests, date, time])

    const chooseDefaultTables = useCallback(() => {
        const available = tables
            .filter(t => t.isActive !== false && !bookedTableIds.has(t.id))
            .sort((a, b) => a.capacity - b.capacity)

        const single = available.find(t => t.capacity >= guests)
        if (single) return new Set([single.id])

        const byCapacity = [...available].sort((a, b) => b.capacity - a.capacity)
        const picked: CanvasTable[] = []
        let total = 0

        while (total < guests && byCapacity.length > 0) {
            const anchor = picked[picked.length - 1]
            const nextIndex = anchor
                ? byCapacity.reduce((bestIdx, table, idx) => {
                    const best = byCapacity[bestIdx]
                    const dist = Math.hypot(table.x - anchor.x, table.y - anchor.y)
                    const bestDist = Math.hypot(best.x - anchor.x, best.y - anchor.y)
                    return dist < bestDist ? idx : bestIdx
                }, 0)
                : 0
            const [next] = byCapacity.splice(nextIndex, 1)
            if (!next) break
            picked.push(next)
            total += next.capacity
        }

        return new Set(picked.map(t => t.id))
    }, [bookedTableIds, guests, tables])

    useEffect(() => {
        if (!tables.length || userTouchedSelectionRef.current || selectedTableIds.size > 0) return
        onSelectionChange(chooseDefaultTables())
    }, [chooseDefaultTables, onSelectionChange, selectedTableIds.size, tables.length])

    // ── Handle table click ────────────────────────────────────────────────────

    const handleTableClick = (tableId: string) => {
        if (bookedTableIds.has(tableId)) return

        userTouchedSelectionRef.current = true
        const next = new Set(selectedTableIds)
        if (next.has(tableId)) next.delete(tableId)
        else next.add(tableId)
        onSelectionChange(next)
    }

    // ── Derived ───────────────────────────────────────────────────────────────

    const selectedTables = tables.filter(t => selectedTableIds.has(t.id))
    const selectedCapacity = selectedTables.reduce((sum, t) => sum + t.capacity, 0)
    const selectedChairs = selectedTables.reduce((sum, t) => sum + t.currentChairCount, 0)
    const extraChairsNeeded = Math.max(0, guests - selectedChairs)
    const notEnough = selectedCapacity < guests

    const legendItems = [
        { color: theme.tableFillColor, label: 'Available table' },
        { color: theme.bookedColor, label: 'Booked table' },
        { color: theme.selectionColor, label: 'Your table' },
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
                        Choose a table for {guests - selectedCapacity} more guest{guests - selectedCapacity !== 1 ? 's' : ''}.
                    </p>
                ) : extraChairsNeeded > 0 ? (
                    <p className="text-amber-600">
                        Table fits your party of {guests}. Staff will add {extraChairsNeeded} chair{extraChairsNeeded !== 1 ? 's' : ''}.
                    </p>
                ) : (
                    <p className="text-green-700">
                        ✓ Table capacity selected for your party of {guests}.
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
                    bookedTableIds={bookedTableIds}
                    selectedTableIds={selectedTableIds}
                    onTableClick={handleTableClick}
                    readOnly
                />
            </div>
        </div>
    )
}
