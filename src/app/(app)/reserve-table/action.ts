'use server'

import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { resolvePickerDate } from '@/lib/resolve-picker-date'

async function verifyTurnstile(token: string): Promise<boolean> {
    const res = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                secret: process.env.TURNSTILE_SECRET_KEY,
                response: token,
            }),
        }
    )
    const data = await res.json()
    return data.success === true
}

// Return type — either success (redirect) or an error the form can display
export type ReserveResult =
    | { error: 'turnstile' }
    | { error: 'invalid-date' }
    | { error: 'conflict'; message: string }
    | { error: 'unknown' }

function to24h(t: string): string | null {
    if (!t) return null
    const ampm = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
    if (ampm) {
        let h = parseInt(ampm[1], 10)
        const m = ampm[2]
        const meridiem = ampm[3].toUpperCase()
        if (meridiem === 'AM' && h === 12) h = 0
        if (meridiem === 'PM' && h !== 12) h += 12
        return `${String(h).padStart(2, '0')}:${m}`
    }
    const plain = t.match(/^(\d{1,2}):(\d{2})$/)
    if (plain) return `${plain[1].padStart(2, '0')}:${plain[2]}`
    return null
}

export const handleReserveTable = async (
    formData: FormData,
): Promise<ReserveResult | void> => {

    // ── Turnstile ─────────────────────────────────────────────────────────────
    const cfToken = formData.get('cf-turnstile-response') as string
    if (!cfToken) return { error: 'turnstile' }
    const isHuman = await verifyTurnstile(cfToken)
    if (!isHuman) return { error: 'turnstile' }

    // ── Parse fields ──────────────────────────────────────────────────────────
    const name = formData.get('name') as string
    const phone = formData.get('phone') as string
    const email = (formData.get('email') as string | null) || undefined
    const date = formData.get('date') as string
    const time = formData.get('time') as string

    const dateOnly = resolvePickerDate(date)
    const time24 = to24h(time)
    if (!dateOnly || !time24) return { error: 'invalid-date' }
    const reservationDate = `${dateOnly.split('T')[0]}T${time24}:00.000+03:00`

    if (!reservationDate) return { error: 'invalid-date' }

    // ── Parse bookedChairs ────────────────────────────────────────────────────
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

    // ── Create reservation ────────────────────────────────────────────────────
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

        // ── Double-booking: return conflict error to the form ─────────────────
        // The form shows this inline — no redirect needed.
        if (msg.includes('Double-booking')) {
            return {
                error: 'conflict',
                message: 'Some of your selected seats were just booked by someone else. Please choose different seats.',
            }
        }

        console.error('Error creating reservation:', msg)
        return { error: 'unknown' }
    }

    // Success — redirect only on the happy path
    redirect('/reserve-table/success')
}