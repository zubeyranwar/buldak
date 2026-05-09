'use server'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export const handleReserveTable = async (formData: FormData) => {
    const payload = await getPayload({
        config: configPromise,
    });

    const data = {
        name: formData.get('name') as string,
        phone: formData.get('phone') as string,
        date: formData.get('date') as string,
        time: formData.get('time') as string,
        numOfGuests: Number(formData.get('guests')),
    };

    try {
        await payload.create({
            collection: 'table' as never,
            data,
        });
    } catch (error) {
        console.error('Error reserving table:', error);
        redirect('/reserve-table/error');
    }
}