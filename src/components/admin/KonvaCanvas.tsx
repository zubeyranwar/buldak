'use client'

import React, { useEffect, useRef, useCallback } from 'react'
import Konva from 'konva'
import type { CanvasTable, EmbeddedChair, FloorPlanTheme } from './FloorPlanEditorClient'

// ── Props ─────────────────────────────────────────────────────────────────────

interface KonvaCanvasProps {
    tables: CanvasTable[]
    floorPlan: {
        imageUrl: string
        canvasWidth: number
        canvasHeight: number
    }
    theme: FloorPlanTheme
    selectedId: string | null
    zoom: number
    onSelect: (id: string | null) => void
    onChange: (id: string, updated: Partial<CanvasTable>) => void
    /** Optional: used by FloorPlanPicker to highlight booked chairs */
    bookedChairKeys?: Set<string>   // "tableId:chairId"
    selectedChairKeys?: Set<string> // "tableId:chairId"
    onChairClick?: (tableId: string, chairId: string) => void
    readOnly?: boolean
}

// ── Chair shape size ──────────────────────────────────────────────────────────

const CHAIR_RADIUS = 10

// ── Draw a single table group ─────────────────────────────────────────────────

function buildTableGroup(
    table: CanvasTable,
    theme: FloorPlanTheme,
    isSelected: boolean,
    bookedChairKeys: Set<string>,
    selectedChairKeys: Set<string>,
    readOnly: boolean,
    onSelect: (id: string | null) => void,
    onChange: (id: string, updated: Partial<CanvasTable>) => void,
    onChairClick?: (tableId: string, chairId: string) => void,
    layer?: Konva.Layer
): Konva.Group {
    const group = new Konva.Group({
        id: String(table.id),
        x: table.x,
        y: table.y,
        rotation: table.rotation,
        draggable: !readOnly,
    })

    // ── Table body ────────────────────────────────────────────────────────────
    const halfW = table.width / 2
    const halfH = table.height / 2
    const strokeColor = isSelected ? theme.selectionColor : '#92400e'

    let tableShape: Konva.Shape

    if (table.type === 'round') {
        tableShape = new Konva.Circle({
            x: 0, y: 0,
            radius: halfW,
            fill: theme.tableFillColor,
            stroke: strokeColor,
            strokeWidth: isSelected ? 2.5 : 1.5,
        })
    } else {
        // square or rectangle
        tableShape = new Konva.Rect({
            x: -halfW, y: -halfH,
            width: table.width,
            height: table.height,
            fill: theme.tableFillColor,
            stroke: strokeColor,
            strokeWidth: isSelected ? 2.5 : 1.5,
            cornerRadius: table.type === 'square' ? 4 : 6,
        })
    }

    group.add(tableShape)

    // ── Table label ───────────────────────────────────────────────────────────
    group.add(new Konva.Text({
        x: -halfW, y: -9,
        width: table.width,
        text: table.tableNumber,
        fontSize: 13,
        fontFamily: 'system-ui, sans-serif',
        fontStyle: 'bold',
        fill: theme.textFillColor,
        align: 'center',
    }))

    // ── Chair count label ─────────────────────────────────────────────────────
    if (table.chairs.length > 0) {
        group.add(new Konva.Text({
            x: -halfW, y: 2,
            width: table.width,
            text: `${table.chairs.length} seats`,
            fontSize: 9,
            fontFamily: 'system-ui, sans-serif',
            fill: theme.textFillColor,
            align: 'center',
            opacity: 0.7,
        }))
    }

    // ── Embedded chairs ───────────────────────────────────────────────────────
    table.chairs.forEach((chair: EmbeddedChair) => {
        const key = `${table.id}:${chair.chairId}`
        const isBooked = bookedChairKeys.has(key)
        const isChairSelected = selectedChairKeys.has(key)

        const chairColor = isChairSelected
            ? theme.selectionColor
            : isBooked
                ? theme.bookedColor
                : theme.chairFillColor

        const chairCircle = new Konva.Circle({
            id: `chair-${table.id}-${chair.chairId}`,
            x: chair.relativePosition.x,
            y: chair.relativePosition.y,
            radius: CHAIR_RADIUS,
            fill: chairColor,
            stroke: isChairSelected ? theme.selectionColor : '#555',
            strokeWidth: isChairSelected ? 2 : 1,
        })

        // Chair ID label
        const chairLabel = new Konva.Text({
            x: chair.relativePosition.x - CHAIR_RADIUS,
            y: chair.relativePosition.y - 5,
            width: CHAIR_RADIUS * 2,
            text: chair.chairId.replace('C', ''),
            fontSize: 8,
            fontFamily: 'system-ui, sans-serif',
            fill: '#fff',
            align: 'center',
        })

        if (onChairClick) {
            chairCircle.on('click tap', (e) => {
                e.cancelBubble = true
                onChairClick(table.id, chair.chairId)
            })
            chairCircle.on('mouseenter', () => {
                document.body.style.cursor = 'pointer'
            })
            chairCircle.on('mouseleave', () => {
                document.body.style.cursor = 'default'
            })
        }

        group.add(chairCircle)
        group.add(chairLabel)
    })

    // ── Selection ring ────────────────────────────────────────────────────────
    if (isSelected) {
        const selR = Math.max(halfW, halfH) + 14
        group.add(new Konva.Circle({
            x: 0, y: 0,
            radius: selR,
            stroke: theme.selectionColor,
            strokeWidth: 1.5,
            dash: [6, 4],
            listening: false,
        }))
    }

    // ── Drag behaviour ────────────────────────────────────────────────────────
    if (!readOnly) {
        group.on('dragend', () => {
            onChange(table.id, { x: group.x(), y: group.y() })
        })
        group.on('click tap', (e) => {
            e.cancelBubble = true
            onSelect(table.id)
        })
        group.on('mouseenter', () => {
            document.body.style.cursor = 'move'
        })
        group.on('mouseleave', () => {
            document.body.style.cursor = 'default'
        })
    } else {
        group.on('click tap', (e) => {
            e.cancelBubble = true
            onSelect(table.id)
        })
    }

    return group
}

// ── KonvaCanvas ───────────────────────────────────────────────────────────────

export default function KonvaCanvas({
    tables,
    floorPlan,
    theme,
    selectedId,
    zoom,
    onSelect,
    onChange,
    bookedChairKeys = new Set(),
    selectedChairKeys = new Set(),
    onChairClick,
    readOnly = false,
}: KonvaCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<Konva.Stage | null>(null)
    const layerRef = useRef<Konva.Layer | null>(null)
    const bgLayerRef = useRef<Konva.Layer | null>(null)

    // ── Init stage ────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!containerRef.current) return

        const stage = new Konva.Stage({
            container: containerRef.current,
            width: floorPlan.canvasWidth,
            height: floorPlan.canvasHeight,
        })

        const bgLayer = new Konva.Layer()
        const layer = new Konva.Layer()
        stage.add(bgLayer)
        stage.add(layer)

        stageRef.current = stage
        layerRef.current = layer
        bgLayerRef.current = bgLayer

        // Background image
        if (floorPlan.imageUrl) {
            const img = new Image()
            img.onload = () => {
                bgLayer.add(new Konva.Image({
                    image: img,
                    x: 0, y: 0,
                    width: floorPlan.canvasWidth,
                    height: floorPlan.canvasHeight,
                    opacity: 0.35,
                    listening: false,
                }))
                bgLayer.batchDraw()
            }
            img.src = floorPlan.imageUrl
        } else {
            bgLayer.add(new Konva.Rect({
                x: 0, y: 0,
                width: floorPlan.canvasWidth,
                height: floorPlan.canvasHeight,
                fill: '#f3f4f6',
                listening: false,
            }))
            bgLayer.batchDraw()
        }

        // Deselect on stage click
        stage.on('click tap', () => onSelect(null))

        return () => {
            stage.destroy()
            stageRef.current = null
            layerRef.current = null
            bgLayerRef.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [floorPlan.imageUrl, floorPlan.canvasWidth, floorPlan.canvasHeight])

    // ── Rebuild table layer on data change ────────────────────────────────────
    useEffect(() => {
        const layer = layerRef.current
        if (!layer) return

        layer.destroyChildren()

        tables.forEach(table => {
            const group = buildTableGroup(
                table,
                theme,
                table.id === selectedId,
                bookedChairKeys,
                selectedChairKeys,
                readOnly,
                onSelect,
                onChange,
                onChairClick,
                layer,
            )
            layer.add(group)
        })

        layer.batchDraw()
    }, [tables, selectedId, theme, bookedChairKeys, selectedChairKeys, readOnly, onSelect, onChange, onChairClick])

    // ── Zoom ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        const stage = stageRef.current
        if (!stage) return
        stage.scale({ x: zoom, y: zoom })
        stage.size({
            width: floorPlan.canvasWidth * zoom,
            height: floorPlan.canvasHeight * zoom,
        })
        stage.batchDraw()
    }, [zoom, floorPlan.canvasWidth, floorPlan.canvasHeight])

    return (
        <div
            ref={containerRef}
            style={{
                width: floorPlan.canvasWidth * zoom,
                height: floorPlan.canvasHeight * zoom,
                cursor: readOnly ? 'default' : 'crosshair',
            }}
        />
    )
}