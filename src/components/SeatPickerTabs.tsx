'use client'

import React from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { FloorPlanPicker } from '@/components/FloorPlanPicker'
import { PanoramaBookingPicker } from '@/components/PanoramaBookingPicker'
import { LayoutGrid, Globe } from 'lucide-react'

export interface SeatPickerTabsProps {
    date: string
    time: string
    duration?: number
    guests: number
    selectedChairKeys: Set<string>
    onSelectionChange: (keys: Set<string>) => void
}

export function SeatPickerTabs({
    date,
    time,
    duration = 90,
    guests,
    selectedChairKeys,
    onSelectionChange,
}: SeatPickerTabsProps) {
    return (
        <Tabs defaultValue="2d" className="w-full flex flex-col">
            {/* ── Tab bar ── */}
            <TabsList className="grid w-full grid-cols-2 gap-4 mb-4 h-10 bg-muted/60 rounded-xl p-1 shrink-0">
                <TabsTrigger
                    value="2d"
                    className="
                        flex items-center gap-2 rounded-lg text-sm font-semibold
                        data-[state=active]:bg-white
                        data-[state=active]:shadow-sm
                        data-[state=active]:text-foreground
                        text-muted-foreground
                        transition-all duration-150
                    "
                >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    Floor Plan
                </TabsTrigger>

                <TabsTrigger
                    value="3d"
                    className="
                        flex items-center gap-2 rounded-lg text-sm font-semibold
                        data-[state=active]:bg-white
                        data-[state=active]:shadow-sm
                        data-[state=active]:text-foreground
                        text-muted-foreground
                        transition-all duration-150
                    "
                >
                    <Globe className="w-3.5 h-3.5" />
                    3D View
                </TabsTrigger>
            </TabsList>

            {/* ── 2D tab ── */}
            <TabsContent
                value="2d"
                className="mt-0 focus-visible:outline-none focus-visible:ring-0 overflow-hidden relative"
            >
                <FloorPlanPicker
                    date={date}
                    time={time}
                    duration={duration}
                    guests={guests}
                    selectedChairKeys={selectedChairKeys}
                    onSelectionChange={onSelectionChange}
                />
            </TabsContent>

            {/* ── 3D tab ── */}
            <TabsContent
                value="3d"
                className="mt-0 focus-visible:outline-none focus-visible:ring-0 overflow-hidden relative"
            >
                <PanoramaBookingPicker
                    date={date}
                    time={time}
                    duration={duration}
                    guests={guests}
                    selectedChairKeys={selectedChairKeys}
                    onSelectionChange={onSelectionChange}
                />
            </TabsContent>
        </Tabs>
    )
}

export default SeatPickerTabs