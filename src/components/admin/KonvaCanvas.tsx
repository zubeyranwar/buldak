'use client'

import React, { useEffect, useRef } from 'react'
import Konva from 'konva'
import type { CanvasTable, EmbeddedChair, FloorPlanTheme } from './FloorPlanEditorClient'

// ── Props ─────────────────────────────────────────────────────────────────────

interface KonvaCanvasProps {
    tables: CanvasTable[]
    floorPlan: { imageUrl: string; canvasWidth: number; canvasHeight: number }
    theme: FloorPlanTheme
    selectedId: string | null
    selectedChairKey?: string | null
    zoom: number
    onSelect: (id: string | null) => void
    onSelectChair?: (key: string | null) => void   // optional — not used in picker
    onChange: (id: string, updated: Partial<CanvasTable>) => void
    bookedChairKeys?: Set<string>
    selectedChairKeys?: Set<string>
    onChairClick?: (tableId: string, chairId: string) => void
    readOnly?: boolean
}

const CHAIR_SIZE = 22
const CHAIR_HALF = CHAIR_SIZE / 2

// ── Build one table group ─────────────────────────────────────────────────────

function buildTableGroup(
    table: CanvasTable,
    theme: FloorPlanTheme,
    isSelected: boolean,
    selectedChairKey: string | null,
    bookedChairKeys: Set<string>,
    pickerSelectedKeys: Set<string>,
    readOnly: boolean,
    onSelect: (id: string | null) => void,
    onSelectChair: (key: string | null) => void,
    onChange: (id: string, updated: Partial<CanvasTable>) => void,
    onChairClick?: (tableId: string, chairId: string) => void,
): Konva.Group {
    const group = new Konva.Group({
        id: String(table.id),
        x: table.x,
        y: table.y,
        rotation: table.rotation,
        draggable: !readOnly,
        // Store dims as attrs so transformer can read them
        width: table.width,
        height: table.height,
    })

    const hw = table.width / 2
    const hh = table.height / 2
    const stroke = isSelected ? theme.selectionColor : '#92400e'

    // ── Table body ────────────────────────────────────────────────────────────
    const tableShape: Konva.Shape = table.type === 'round'
        ? new Konva.Circle({
            name: 'tableBody',
            x: 0, y: 0,
            radius: hw,
            fill: theme.tableFillColor,
            stroke, strokeWidth: isSelected ? 2.5 : 1.5,
        })
        : new Konva.Rect({
            name: 'tableBody',
            x: -hw, y: -hh,
            width: table.width, height: table.height,
            fill: theme.tableFillColor,
            stroke, strokeWidth: isSelected ? 2.5 : 1.5,
            cornerRadius: 5,
        })
    group.add(tableShape)

    // ── Labels ────────────────────────────────────────────────────────────────
    group.add(new Konva.Text({
        x: -hw, y: -10, width: table.width,
        text: table.tableNumber,
        fontSize: 13, fontStyle: 'bold',
        fontFamily: 'system-ui, sans-serif',
        fill: theme.textFillColor, align: 'center',
        listening: false,
    }))
    if (table.chairs.length > 0) {
        group.add(new Konva.Text({
            x: -hw, y: 4, width: table.width,
            text: `${table.chairs.length} seats`,
            fontSize: 9, fontFamily: 'system-ui, sans-serif',
            fill: theme.textFillColor, align: 'center', opacity: 0.7,
            listening: false,
        }))
    }

    // ── Chairs ────────────────────────────────────────────────────────────────
    table.chairs.forEach((chair: EmbeddedChair) => {
        const key = `${table.id}:${chair.chairId}`
        const isEditorSelected = selectedChairKey === key
        const isPickerSelected = pickerSelectedKeys.has(key)
        const isBooked = bookedChairKeys.has(key)

        const fill = isEditorSelected || isPickerSelected
            ? theme.selectionColor
            : isBooked ? theme.bookedColor : theme.chairFillColor

        const chairGroup = new Konva.Group({
            id: `chair-${table.id}-${chair.chairId}`,
            x: chair.relativePosition.x,
            y: chair.relativePosition.y,
        })

        chairGroup.add(new Konva.Rect({
            x: -CHAIR_HALF, y: -CHAIR_HALF,
            width: CHAIR_SIZE, height: CHAIR_SIZE,
            fill,
            stroke: isEditorSelected ? theme.selectionColor : '#444',
            strokeWidth: isEditorSelected ? 2 : 1,
            cornerRadius: 3,
        }))

        chairGroup.add(new Konva.Text({
            x: -CHAIR_HALF, y: -CHAIR_HALF,
            width: CHAIR_SIZE, height: CHAIR_SIZE,
            text: chair.chairId,
            fontSize: 7,
            fontFamily: 'system-ui, sans-serif',
            fill: '#fff', align: 'center', verticalAlign: 'middle',
            listening: false,
        }))

        if (!readOnly) {
            chairGroup.on('click tap', (e) => {
                e.cancelBubble = true
                onSelectChair(isEditorSelected ? null : key)
                onSelect(table.id)
            })
            chairGroup.on('mouseenter', () => { document.body.style.cursor = 'pointer' })
            chairGroup.on('mouseleave', () => { document.body.style.cursor = 'move' })
        } else if (onChairClick) {
            chairGroup.on('click tap', (e) => {
                e.cancelBubble = true
                onChairClick(table.id, chair.chairId)
            })
            chairGroup.on('mouseenter', () => { document.body.style.cursor = 'pointer' })
            chairGroup.on('mouseleave', () => { document.body.style.cursor = 'default' })
        }

        group.add(chairGroup)
    })

    // ── Selection ring ────────────────────────────────────────────────────────
    if (isSelected && !readOnly) {
        group.add(new Konva.Circle({
            x: 0, y: 0,
            radius: Math.max(hw, hh) + 18,
            stroke: theme.selectionColor,
            strokeWidth: 1.5,
            dash: [6, 4],
            listening: false,
        }))
    }

    // ── Drag ──────────────────────────────────────────────────────────────────
    if (!readOnly) {
        group.on('dragend', () => {
            onChange(table.id, {
                x: Math.round(group.x()),
                y: Math.round(group.y()),
            })
        })
        group.on('click tap', (e) => {
            e.cancelBubble = true
            onSelect(table.id)
            onSelectChair(null)
        })
        group.on('mouseenter', () => {
            if (!group.isDragging()) document.body.style.cursor = 'move'
        })
        group.on('mouseleave', () => { document.body.style.cursor = 'default' })
    } else {
        group.on('click tap', (e) => {
            e.cancelBubble = true
            onSelect(table.id)
        })
    }

    return group
}

// ── Transformer — attached to the tableBody shape, not the group ──────────────

function attachTransformer(
    layer: Konva.Layer,
    group: Konva.Group,
    table: CanvasTable,
    theme: FloorPlanTheme,
    onChange: (id: string, updated: Partial<CanvasTable>) => void,
) {
    // Target the inner shape so Konva knows its bounding box correctly
    const bodyShape = group.findOne('.tableBody') as Konva.Shape | undefined
    if (!bodyShape) return

    const tr = new Konva.Transformer({
        nodes: [group],
        name: 'transformer',
        rotateEnabled: true,
        resizeEnabled: true,
        enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right',
            'middle-left', 'middle-right', 'top-center', 'bottom-center'],
        borderStroke: theme.selectionColor,
        anchorStroke: theme.selectionColor,
        anchorFill: '#fff',
        anchorSize: 9,
        rotationSnaps: [0, 45, 90, 135, 180, 225, 270, 315],
        keepRatio: false,
        boundBoxFunc: (oldBox, newBox) => {
            // Minimum size guard
            if (newBox.width < 30 || newBox.height < 30) return oldBox
            return newBox
        },
    })
    layer.add(tr)

    // Disable drag on the group while transforming to prevent position fighting
    tr.on('transformstart', () => { group.draggable(false) })

    // Counter-scale chairs during live transform so they don't stretch visually
    tr.on('transform', () => {
        const sx = group.scaleX() || 1
        const sy = group.scaleY() || 1
        group.getChildren().forEach(child => {
            // Only counter-scale chair groups (id starts with 'chair-')
            if (child.id().startsWith('chair-')) {
                child.scaleX(1 / sx)
                child.scaleY(1 / sy)
            }
        })
    })

    tr.on('transformend', () => {
        group.draggable(true)

        const scaleX = group.scaleX()
        const scaleY = group.scaleY()

        // Bake scale back to 1 — store real pixel dimensions
        const newW = Math.round(Math.abs(table.width * scaleX))
        const newH = Math.round(Math.abs(table.height * scaleY))

        group.scaleX(1)
        group.scaleY(1)
        group.width(newW)
        group.height(newH)

        // Reset any counter-scaling applied during live transform
        group.getChildren().forEach(child => {
            if (child.id().startsWith('chair-')) {
                child.scaleX(1)
                child.scaleY(1)
            }
        })

        // Redistribute chairs evenly around the new table edge
        const radius = Math.max(newW, newH) / 2 + 24
        const count = table.chairs.length
        const updatedChairs = table.chairs.map((c, i) => {
            const angle = (i / count) * 2 * Math.PI - Math.PI / 2
            return {
                ...c,
                relativePosition: {
                    x: Math.round(Math.cos(angle) * radius),
                    y: Math.round(Math.sin(angle) * radius),
                },
            }
        })

        onChange(table.id, {
            x: Math.round(group.x()),
            y: Math.round(group.y()),
            rotation: Math.round(group.rotation()),
            width: newW,
            height: newH,
            chairs: updatedChairs,
        })
    })

    return tr
}

// ── KonvaCanvas ───────────────────────────────────────────────────────────────

export default function KonvaCanvas({
    tables,
    floorPlan,
    theme,
    selectedId,
    selectedChairKey = null,
    zoom,
    onSelect,
    onSelectChair,
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

    // ── Stable callback refs — never change identity, always call latest fn ──
    const onSelectRef = useRef(onSelect)
    const onSelectChairRef = useRef<(k: string | null) => void>(onSelectChair ?? (() => { }))
    const onChangeRef = useRef(onChange)
    const onChairClickRef = useRef(onChairClick)
    useEffect(() => { onSelectRef.current = onSelect }, [onSelect])
    useEffect(() => { onSelectChairRef.current = onSelectChair ?? (() => { }) }, [onSelectChair])
    useEffect(() => { onChangeRef.current = onChange }, [onChange])
    useEffect(() => { onChairClickRef.current = onChairClick }, [onChairClick])

    // ── Init stage once ───────────────────────────────────────────────────────
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

        if (floorPlan.imageUrl) {
            const img = new Image()
            img.onload = () => {
                bgLayer.add(new Konva.Image({
                    image: img, x: 0, y: 0,
                    width: floorPlan.canvasWidth,
                    height: floorPlan.canvasHeight,
                    opacity: 0.35, listening: false,
                }))
                bgLayer.batchDraw()
            }
            img.src = floorPlan.imageUrl
        } else {
            bgLayer.add(new Konva.Rect({
                x: 0, y: 0,
                width: floorPlan.canvasWidth,
                height: floorPlan.canvasHeight,
                fill: '#f3f4f6', listening: false,
            }))
            bgLayer.batchDraw()
        }

        // Deselect on empty canvas click
        stage.on('click tap', (e) => {
            if (e.target === stage) {
                onSelectRef.current(null)
                onSelectChairRef.current(null)
            }
        })

        return () => {
            stage.destroy()
            stageRef.current = null
            layerRef.current = null
            bgLayerRef.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [floorPlan.imageUrl, floorPlan.canvasWidth, floorPlan.canvasHeight])

    // ── Rebuild layer on any data change ──────────────────────────────────────
    useEffect(() => {
        const layer = layerRef.current
        if (!layer) return

        layer.destroyChildren()

        tables.forEach(table => {
            const isSelected = table.id === selectedId
            const group = buildTableGroup(
                table, theme, isSelected, selectedChairKey,
                bookedChairKeys, selectedChairKeys,
                readOnly, onSelectRef.current, onSelectChairRef.current, onChangeRef.current, onChairClickRef.current,
            )
            layer.add(group)

            if (isSelected && !readOnly) {
                attachTransformer(layer, group, table, theme, onChangeRef.current)
            }
        })

        layer.batchDraw()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tables, selectedId, selectedChairKey, theme, bookedChairKeys, selectedChairKeys, readOnly])  // callbacks via refs — stable

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