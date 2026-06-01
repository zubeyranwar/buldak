'use client'

/**
 * PickerStage.tsx — Konva canvas for client seat picker.
 * Chairs are interactive. Tables are decorative.
 * All react-konva imports static — dynamically imported as one unit.
 */

import React from 'react'
import {
    Stage, Layer,
    Image as KonvaImage,
    Rect, Circle, Text, Group,
} from 'react-konva'
import useImage from 'use-image'
import type { SeatItem } from './FloorPlanPicker'

interface Props {
    items: SeatItem[]
    floorPlan: { imageUrl: string; canvasWidth: number; canvasHeight: number }
    scale: number
    bookedChairIds: Set<string>
    selectedChairIds: Set<string>
    onChairClick: (chairId: string) => void
    getEffectiveStatus: (item: SeatItem) => 'available' | 'selected' | 'booked'
    colors: {
        chairAvailable: string
        chairSelected: string
        chairBooked: string
        tableFill: string
        textFill: string
    }
}

function ChairShape({ item, status, onClick, colors }: {
    item: SeatItem
    status: 'available' | 'selected' | 'booked'
    onClick: () => void
    colors: Props['colors']
}) {
    const fillMap = {
        available: colors.chairAvailable,
        selected: colors.chairSelected,
        booked: colors.chairBooked,
    }
    const strokeMap = {
        available: '#15803d',
        selected: '#ea580c',
        booked: '#6b7280',
    }
    const fill = fillMap[status]
    const stroke = strokeMap[status]
    const isBooked = status === 'booked'

    return (
        <Group
            x={item.x} y={item.y}
            rotation={item.rotation}
            onClick={isBooked ? undefined : onClick}
            onTap={isBooked ? undefined : onClick}
            onMouseEnter={e => {
                if (!isBooked) {
                    const stage = e.target.getStage()
                    if (stage) stage.container().style.cursor = 'pointer'
                }
            }}
            onMouseLeave={e => {
                const stage = e.target.getStage()
                if (stage) stage.container().style.cursor = 'default'
            }}
        >
            {/* Selection glow ring */}
            {status === 'selected' && (
                <Rect
                    width={item.width + 8} height={item.height + 8}
                    offsetX={(item.width + 8) / 2} offsetY={(item.height + 8) / 2}
                    fill="transparent"
                    stroke={colors.chairSelected}
                    strokeWidth={2}
                    dash={[4, 3]}
                    cornerRadius={6}
                />
            )}
            <Rect
                width={item.width} height={item.height}
                offsetX={item.width / 2} offsetY={item.height / 2}
                fill={fill} stroke={stroke}
                strokeWidth={status === 'selected' ? 2 : 1.5}
                cornerRadius={4}
                shadowEnabled={status === 'selected'}
                shadowColor={colors.chairSelected}
                shadowBlur={8}
                shadowOpacity={0.5}
            />
            {item.seatNumber != null && (
                <Text
                    text={String(item.seatNumber)}
                    fontSize={9} fill="#fff"
                    align="center" verticalAlign="middle"
                    width={item.width} height={item.height}
                    offsetX={item.width / 2} offsetY={item.height / 2}
                />
            )}
        </Group>
    )
}

function TableShape({ item, colors }: { item: SeatItem; colors: Props['colors'] }) {
    if (item.shape === 'round') {
        const r = item.width / 2
        return (
            <Group x={item.x} y={item.y} listening={false}>
                <Circle radius={r} fill={colors.tableFill} stroke="#991b1b" strokeWidth={2} />
                <Text
                    text={item.label} fontSize={10} fontStyle="bold" fill="#fff"
                    align="center" verticalAlign="middle"
                    width={r * 2} height={r * 2} offsetX={r} offsetY={r}
                />
            </Group>
        )
    }
    return (
        <Group x={item.x} y={item.y} rotation={item.rotation} listening={false}>
            <Rect
                width={item.width} height={item.height}
                offsetX={item.width / 2} offsetY={item.height / 2}
                fill={colors.tableFill} stroke="#991b1b" strokeWidth={2} cornerRadius={2}
            />
            <Text
                text={item.label} fontSize={10} fontStyle="bold" fill="#fff"
                align="center" verticalAlign="middle"
                width={item.width} height={item.height}
                offsetX={item.width / 2} offsetY={item.height / 2}
            />
        </Group>
    )
}

export default function PickerStage({ items, floorPlan, scale, onChairClick, getEffectiveStatus, colors }: Props) {
    const [bgImage] = useImage(floorPlan.imageUrl, 'anonymous')

    return (
        <Stage
            width={floorPlan.canvasWidth * scale}
            height={floorPlan.canvasHeight * scale}
            scaleX={scale} scaleY={scale}
            style={{ display: 'block' }}
        >
            <Layer>
                {bgImage && (
                    <KonvaImage image={bgImage}
                        width={floorPlan.canvasWidth} height={floorPlan.canvasHeight}
                        listening={false} />
                )}
                {/* Tables — non-interactive */}
                {items.filter(i => i.itemType === 'table').map(item => (
                    <TableShape key={item.id} item={item} colors={colors} />
                ))}
                {/* Text labels */}
                {items.filter(i => i.itemType === 'text').map(item => (
                    <Text key={item.id}
                        x={item.x} y={item.y}
                        text={item.label} fontSize={15} fontStyle="bold"
                        fill={colors.textFill} listening={false}
                    />
                ))}
                {/* Chairs — interactive */}
                {items.filter(i => i.itemType === 'chair').map(item => {
                    const status = getEffectiveStatus(item)
                    return (
                        <ChairShape key={item.id} item={item} status={status}
                            onClick={() => onChairClick(item.id)}
                            colors={colors}
                        />
                    )
                })}
            </Layer>
        </Stage>
    )
}