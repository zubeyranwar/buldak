'use client'
import { FloorPlanPicker } from '@/components/FloorPlanPicker'

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
        <div className="w-full overflow-hidden relative">
            <FloorPlanPicker
                date={date}
                time={time}
                duration={duration}
                guests={guests}
                selectedTableIds={selectedTableIds}
                onSelectionChange={onSelectionChange}
            />
        </div>
    )
}

export default SeatPickerTabs
