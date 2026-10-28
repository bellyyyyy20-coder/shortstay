import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { addMinutes } from 'date-fns';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { apartmentId, checkIn, checkOut, guestId, guestCount, guestFirstName, guestLastName, guestEmail, guestPhone } = body;

    const apartment = await prisma.apartment.findUnique({ where: { id: apartmentId } });
    if (!apartment) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    // Transactional overlap check
    const result = await prisma.$transaction(async (tx) => {
      const overlapping = await tx.booking.findFirst({
        where: {
          apartmentId,
          status: { in: ['CONFIRMED'] },
          OR: [
            { status: 'CONFIRMED', checkIn: { lt: checkOutDate }, checkOut: { gt: checkInDate } },
            { status: 'PENDING', holdExpiresAt: { gt: new Date() }, checkIn: { lt: checkOutDate }, checkOut: { gt: checkInDate } },
          ],
        },
      });

      if (overlapping) throw new Error('Dates not available');

      const totalPrice = Number(apartment.pricePerNight) * nights;
      const booking = await tx.booking.create({
        data: {
          apartmentId,
          guestId,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          nights,
          pricePerNightSnapshot: apartment.pricePerNight,
          totalPrice,
          currency: apartment.currency,
          guestCount,
          guestFirstName,
          guestLastName,
          guestEmail,
          guestPhone,
          status: 'PENDING',
          holdExpiresAt: addMinutes(new Date(), 10),
        },
      });
      return booking;
    });

    return new Response(JSON.stringify({ booking: result }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
};
