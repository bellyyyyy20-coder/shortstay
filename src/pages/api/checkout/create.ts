import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { prisma } from '../../../lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export const POST: APIRoute = async ({ request }) => {
  try {
    const { bookingId } = await request.json();

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { apartment: true },
    });

    if (!booking) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    if (booking.status !== 'PENDING') return new Response(JSON.stringify({ error: 'Invalid booking' }), { status: 400 });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: booking.currency.toLowerCase(),
            product_data: {
              name: booking.apartment.title,
              description: `${booking.nights} night(s)`,
            },
            unit_amount: Math.round(Number(booking.totalPrice) * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.PUBLIC_APP_URL}/bookings/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.PUBLIC_APP_URL}/bookings/cancel`,
      metadata: {
        bookingId: booking.id,
      },
    });

    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        providerSessionId: session.id,
        amount: booking.totalPrice,
        currency: booking.currency,
        status: 'PENDING',
      },
    });

    return new Response(JSON.stringify({ url: session.url }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
