'use server'

import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { toUTCIso } from '@/lib/timezone'
import type { TableLayout } from '@/payload-types'

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
    | { error: 'invalid-selection'; message: string }
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
    const partySize = Math.max(1, Number(formData.get('guests') ?? 0))

    // ── toUTCIso: treats "7:00 PM" as 19:00 UTC+3 → stores as 16:00 UTC ──────
    // This is consistent with how both pickers query availability.
    const reservationDate = toUTCIso(date, time)
    if (!reservationDate) {
        console.error('[handleReserveTable] invalid date/time', { date, time })
        return { error: 'invalid-date' }
    }

    let reservedTables: number[] = []
    try {
        const raw = formData.get('reservedTables') as string
        if (raw) {
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed)) {
                reservedTables = [...new Set(parsed
                    .map((tableId: unknown) => Number(tableId))
                    .filter((tableId: number) => !isNaN(tableId) && tableId > 0))]
            }
        }
    } catch (err) {
        console.warn('Could not parse reservedTables:', err)
    }

    if (!partySize) {
        return { error: 'invalid-selection', message: 'Please choose a valid party size.' }
    }

    if (reservedTables.length === 0) {
        return { error: 'invalid-selection', message: 'Please choose a table for your reservation.' }
    }

    const payload = await getPayload({ config: configPromise })

    const selectedTables = await Promise.all(
        reservedTables.map(tableId => payload.findByID({
            collection: 'table-layout',
            id: tableId,
            depth: 0,
        }))
    )

    const totalCapacity = selectedTables.reduce(
        (sum, table: TableLayout) => sum + Number(table?.capacity ?? 0),
        0
    )

    if (totalCapacity < partySize) {
        return {
            error: 'invalid-selection',
            message: 'Selected table capacity is not enough for your party size.',
        }
    }

    try {
        await payload.create({
            collection: 'reservation',
            data: {
                customer: { name, phone, ...(email ? { email } : {}) },
                reservationDate,
                duration: 90,
                partySize,
                reservedTables,
                status: 'confirmed',
            },
        })
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : ''
        if (msg.includes('Double-booking')) {
            return {
                error: 'conflict',
                message: 'One of your selected tables was just booked by someone else. Please choose another table.',
            }
        }
        console.error('Error creating reservation:', msg)
        return { error: 'unknown' }
    }

    redirect('/reserve-table/success')
}
