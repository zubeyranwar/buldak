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
    );
    const data = await res.json();
    return data.success === true;
}

export const handleReserveTable = async (formData: FormData) => {
    const cfToken = formData.get('cf-turnstile-response') as string;
    if (!cfToken) redirect('/reserve-table/error');

    const isHuman = await verifyTurnstile(cfToken);
    if (!isHuman) redirect('/reserve-table/error');

    const payload = await getPayload({ config: configPromise });

    const data = {
        name: formData.get('name') as string,
        phone: formData.get('phone') as string,
        date: formData.get('date') as string,
        time: formData.get('time') as string,
        numOfGuests: Number(formData.get('guests')),
    };

    const isoDate = resolvePickerDate(data.date);

    try {
        await payload.create({
            //@ts-ignore
            collection: 'table',
            data: {
                name: data.name,
                //@ts-ignore
                phone: data.phone,
                date: isoDate,
                time: data.time,
                numOfguests: data.numOfGuests,
            },
        });
    } catch (error) {
        console.error('Error reserving table:', error);
        redirect('/reserve-table/error');
    }
}