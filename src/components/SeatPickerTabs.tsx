'use client'
import { FloorPlanPicker } from '@/components/FloorPlanPicker'
import React from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { LayoutGrid, Globe } from 'lucide-react'
import PanoramaPicker from './PanoramaBookingPicker'

export interface SeatPickerTabsProps {
    date: string
    time: string
    duration?: number
    guests: number
    selectedTableIds: Set<string>
    onSelectionChange: (keys: Set<string>) => void
}

export function SeatPickerTabs({
    date,
    time,
    duration = 90,
    guests,
    selectedTableIds,
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
                    2D View
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
                    selectedTableIds={selectedTableIds}
                    onSelectionChange={onSelectionChange}
                />
            </TabsContent>

            {/* ── 3D tab ── */}
            <TabsContent
                value="3d"
                className="mt-0 focus-visible:outline-none focus-visible:ring-0 overflow-hidden relative data-[state=inactive]:hidden"
            >
                <PanoramaPicker
                    date={date}
                    time={time}
                    duration={duration}
                    guests={guests}
                    selectedTableIds={selectedTableIds}
                    onSelectionChange={onSelectionChange}
                />
            </TabsContent>
        </Tabs>
    )
}

export default SeatPickerTabs
