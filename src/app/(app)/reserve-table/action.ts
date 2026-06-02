'use server'

import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { toUTCIso } from '@/lib/timezone'

async function verifyTurnstile(token: string): Promise<boolean> {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            secret: process.env.TURNSTILE_SECRET_KEY,
            response: token,
        }),
    })
    const data = await res.json()
    return data.success === true
}

export type ReserveResult =
    | { error: 'turnstile' }
    | { error: 'invalid-date' }
    | { error: 'conflict'; message: string }
    | { error: 'unknown' }

export const handleReserveTable = async (
    formData: FormData,
): Promise<ReserveResult | void> => {

    const cfToken = formData.get('cf-turnstile-response') as string
    if (!cfToken) return { error: 'turnstile' }
    const isHuman = await verifyTurnstile(cfToken)
    if (!isHuman) return { error: 'turnstile' }

    const name = formData.get('name') as string
    const phone = formData.get('phone') as string
    const email = (formData.get('email') as string | null) || undefined
    const date = formData.get('date') as string
    const time = formData.get('time') as string

    // ── toUTCIso: treats "7:00 PM" as 19:00 UTC+3 → stores as 16:00 UTC ──────
    // This is consistent with how both pickers query availability.
    const reservationDate = toUTCIso(date, time)
    if (!reservationDate) {
        console.error('[handleReserveTable] invalid date/time', { date, time })
        return { error: 'invalid-date' }
    }

    let bookedChairs: Array<{ table: number; chairId: string }> = []
    try {
        const raw = formData.get('bookedChairs') as string
        if (raw) {
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed)) {
                bookedChairs = parsed
                    .filter((bc: any) => bc.table && bc.chairId)
                    .map((bc: any) => ({
                        table: Number(bc.table),
                        chairId: String(bc.chairId),
                    }))
                    .filter(bc => !isNaN(bc.table) && bc.chairId.length > 0)
            }
        }
    } catch (err) {
        console.warn('Could not parse bookedChairs:', err)
    }

    const payload = await getPayload({ config: configPromise })

    try {
        await payload.create({
            // @ts-ignore
            collection: 'reservation',
            data: {
                customer: { name, phone, ...(email ? { email } : {}) },
                reservationDate,
                duration: 90,
                bookedChairs,
                status: 'confirmed',
            },
        })
    } catch (error: any) {
        const msg: string = error?.message ?? ''
        if (msg.includes('Double-booking')) {
            return {
                error: 'conflict',
                message: 'Some of your selected seats were just booked by someone else. Please choose different seats.',
            }
        }
        console.error('Error creating reservation:', msg)
        return { error: 'unknown' }
    }

    redirect('/reserve-table/success')
}