import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-05-28.basil",
});

export async function POST(req: Request) {
    try {
        const { invoiceId, amount, email } = await req.json();

        if (!invoiceId || !amount || !email) {
            return NextResponse.json(
                { error: "Missing required fields: invoiceId, amount, or email" },
                { status: 400 }
            );
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            customer_email: email,
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: `Invoice #${invoiceId}`,
                        },
                        unit_amount: Math.round(amount * 100), // Convert to cents
                    },
                    quantity: 1,
                },
            ],
            success_url: `${req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/success?invoice=${invoiceId}`,
            cancel_url: `${req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invoices/${invoiceId}`,
            metadata: {
                invoiceId,
            }
        });

        return NextResponse.json({ sessionId: session.id });
    } catch (err) {
        console.error("Stripe checkout error:", err);
        return NextResponse.json(
            { error: "Failed to create checkout session" },
            { status: 500 }
        );
    }
}