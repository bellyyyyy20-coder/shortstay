import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { prisma } from '../../../lib/prisma';
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const resend = new Resend(process.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request }) => {
  const sig = request.headers.get('stripe-signature');
  const body = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId;

    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { apartment: true, guest: true },
      });

      if (booking && booking.status !== 'CONFIRMED') {
        await prisma.$transaction(async (tx) => {
          await tx.booking.update({
            where: { id: bookingId },
            data: {
              status: 'CONFIRMED',
              confirmationCode: `SS-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
            },
          });
          await tx.payment.upsert({
            where: { bookingId },
            create: {
              bookingId,
              providerSessionId: session.id,
              providerPaymentIntentId: session.payment_intent as string,
              amount: booking.totalPrice,
              currency: booking.currency,
              status: 'SUCCEEDED',
              paidAt: new Date(),
            },
            update: {
              providerSessionId: session.id,
              providerPaymentIntentId: session.payment_intent as string,
              status: 'SUCCEEDED',
              paidAt: new Date(),
            },
          });
        });

        // Send check-in instructions email
        if (process.env.RESEND_API_KEY) {
          try {
            await resend.emails.send({
              from: 'ShortStay <noreply@shortstay.app>',
              to: booking.guestEmail,
              subject: 'Your ShortStay booking confirmed',
              html: `
                <h1>Booking Confirmed</h1>
                <p>Hi ${booking.guestFirstName},</p>
                <p>Your booking at ${booking.apartment.title} has been confirmed.</p>
                <p><strong>Check-in Instructions:</strong></p>
                <p>${booking.apartment.checkInInstructions || 'Please contact the host for check-in details.'}</p>
                <p>Check-in: ${booking.checkIn.toISOString().split('T')[0]}<br/>
                Check-out: ${booking.checkOut.toISOString().split('T')[0]}</p>
              `,
            });
          } catch (e) {
            console.error('Email error:', e);
          }
        }
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
};
