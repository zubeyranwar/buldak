"use client"

import SeatPickerTabs from '@/components/SeatPickerTabs'
import { DateTimePicker, PartySizePicker } from '@/components/wheelpicker'
import { Turnstile } from '@marsidev/react-turnstile'
import { useMemo, useState } from 'react'

export const ReserveTableForm = () => {
    const [datetime, setDatetime] = useState<{ date?: string; time?: string }>({})
    const [guests, setGuests] = useState(2)
    const [token, setToken] = useState<string | null>(null)

    // Chair selection: a Set of "tableId:chairId" keys
    const [selectedChairKeys, setSelectedChairKeys] = useState<Set<string>>(new Set())

    // ── Serialize selectedChairKeys → JSON for the hidden input ──────────────

    const bookedChairsJson = useMemo(() => {
        const arr = [...selectedChairKeys].map(key => {
            const [table, chairId] = key.split(':')
            return { table, chairId }
        })
        return JSON.stringify(arr)
    }, [selectedChairKeys])

    return (
        <>
            {/* Name */}
            <div className="flex flex-col gap-2">
                <label htmlFor="name" className="body-low">
                    Name
                </label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-2">
                <label htmlFor="phone" className="body-low">
                    Phone
                </label>
                <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    className="bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </div>

            {/* Email (optional) */}
            <div className="flex flex-col gap-2">
                <label htmlFor="email" className="body-low">
                    Email <span className="text-muted-foreground text-xs">(optional)</span>
                </label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    className="bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </div>

            {/* Party size */}
            <div className="flex flex-col gap-2">
                <label className="body-low">
                    Party size
                </label>
                <PartySizePicker value={guests} onChange={setGuests} />
                <input type="hidden" name="guests" value={guests} />
            </div>

            {/* Date and time */}
            <div className="flex flex-col gap-2">
                <label className="body-low">
                    Date and time
                </label>
                <DateTimePicker onChange={setDatetime} />
            </div>

            {/* Floor plan chair picker */}
            <div className="flex flex-col gap-2">
                <label className="body-low">Choose your seats</label>
                <SeatPickerTabs
                    date={datetime.date ?? ''}
                    time={datetime.time ?? ''}
                    duration={90}
                    guests={guests}
                    selectedChairKeys={selectedChairKeys}
                    onSelectionChange={setSelectedChairKeys}
                />
            </div>

            {/* Hidden fields for server action */}
            <input type="hidden" name="date" value={datetime.date ?? ''} />
            <input type="hidden" name="time" value={datetime.time ?? ''} />

            {/*
                bookedChairs: JSON array of { table: string, chairId: string }
                Parsed in action.ts and sent to Payload as the bookedChairs array.
            */}
            <input type="hidden" name="bookedChairs" value={bookedChairsJson} />

            {/* Turnstile */}
            <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                onSuccess={setToken}
                onError={() => setToken(null)}
                onExpire={() => setToken(null)}
            />
            <input type="hidden" name="cf-turnstile-response" value={token ?? ''} />
        </>
    )
}