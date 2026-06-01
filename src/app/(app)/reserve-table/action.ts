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

export const handleReserveTable = async (formData: FormData) => {
    // ── Turnstile verification ────────────────────────────────────────────────
    const cfToken = formData.get('cf-turnstile-response') as string
    if (!cfToken) redirect('/reserve-table/error')

    const isHuman = await verifyTurnstile(cfToken)
    if (!isHuman) redirect('/reserve-table/error')

    // ── Parse form fields ─────────────────────────────────────────────────────
    const name = formData.get('name') as string
    const phone = formData.get('phone') as string
    const email = (formData.get('email') as string | null) || undefined
    const date = formData.get('date') as string
    const time = formData.get('time') as string
    const numOfguests = Number(formData.get('guests') ?? 2)

    // ── Build ISO reservationDate from date + time ────────────────────────────
    const dateOnly = resolvePickerDate(date) // e.g. "2025-08-15"

    // Convert time to 24h "HH:MM" regardless of whether it's "7:00 PM" or "19:00"
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
        // Already 24h — just normalise
        const plain = t.match(/^(\d{1,2}):(\d{2})$/)
        if (plain) return `${plain[1].padStart(2, '0')}:${plain[2]}`
        return null
    }

    const time24 = to24h(time)
    const reservationDate = dateOnly && time24
        ? `${dateOnly.split('T')[0]}T${time24}:00.000Z`
        : null

    if (!reservationDate) {
        console.error('Invalid date/time', { date, time })
        redirect('/reserve-table/error')
    }

    // ── Parse bookedChairs JSON ───────────────────────────────────────────────
    // Expected shape from form: JSON.stringify([{ table: string, chairId: string }])
    let bookedChairs: Array<{ table: number; chairId: string }> = []
    try {
        const raw = formData.get('bookedChairs') as string
        if (raw) {
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed)) {
                bookedChairs = parsed
                    .filter((bc: any) => bc.table && bc.chairId)
                    .map((bc: any) => ({
                        table: Number(bc.table), // Payload relationship needs numeric ID
                        chairId: String(bc.chairId),
                    }))
                    .filter((bc) => !isNaN(bc.table) && bc.chairId.length > 0)
            }
        }
    } catch (err) {
        console.warn('Could not parse bookedChairs:', err)
    }

    console.log('Creating reservation', {
        name, phone, email,
        reservationDate, numOfguests, bookedChairs,
    })

    // ── Create Payload document ───────────────────────────────────────────────
    const payload = await getPayload({ config: configPromise })

    try {
        await payload.create({
            // @ts-ignore — Payload types lag behind schema changes
            collection: 'reservation',
            data: {
                customer: {
                    name,
                    phone,
                    ...(email ? { email } : {}),
                },
                reservationDate,
                duration: 90,
                bookedChairs,
                status: 'confirmed',
            },
        })
    } catch (error: any) {
        console.error('Error creating reservation:', error?.message ?? error)
        // Surface double-booking errors vs generic failures
        if (error?.message?.includes('Double-booking')) {
            redirect('/reserve-table/conflict')
        }
        redirect('/reserve-table/error')
    }

    redirect('/reserve-table/success')
}