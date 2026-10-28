import { prisma } from './prisma';
import { addDays } from 'date-fns';

export async function getBlockedDates(apartmentId: string, from: Date, to: Date) {
  const bookings = await prisma.booking.findMany({
    where: {
      apartmentId,
      status: { in: ['CONFIRMED'] },
      OR: [
        {
          status: 'CONFIRMED',
          checkIn: { lt: to },
          checkOut: { gt: from },
        },
        {
          status: 'PENDING',
          holdExpiresAt: { gt: new Date() },
          checkIn: { lt: to },
          checkOut: { gt: from },
        },
      ],
    },
    select: { checkIn: true, checkOut: true },
  });

  const blocked = new Set<string>();
  for (const booking of bookings) {
    let current = new Date(booking.checkIn);
    const end = new Date(booking.checkOut);
    while (current < end) {
      blocked.add(current.toISOString().split('T')[0]);
      current = addDays(current, 1);
    }
  }
  return Array.from(blocked);
}
