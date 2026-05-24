"use client"

import { DateTimePicker, PartySizePicker } from '@/components/wheelpicker';
import { useState } from 'react';

export const ReserveTableForm = () => {
    const [datetime, setDatetime] = useState({});
    const [guests, setGuests] = useState(2);

    return (
        <>
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

            <div className="flex flex-col gap-2">
                <label className="body-low">
                    Party size
                </label>

                <PartySizePicker
                    value={guests}
                    onChange={setGuests}
                />

                <input
                    type="hidden"
                    name="guests"
                    value={guests}
                />
            </div>

            <div className="flex flex-col gap-2">
                <label className="body-low">
                    Date and time
                </label>

                <DateTimePicker onChange={setDatetime} />

                <input
                    type="hidden"
                    name="date"
                    value={(datetime as any)?.date || ""}
                />

                <input
                    type="hidden"
                    name="time"
                    value={(datetime as any)?.time || ""}
                />
            </div>
        </>
    );
}
