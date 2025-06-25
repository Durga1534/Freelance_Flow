import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2024-06-20",
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
            success_url: `${process.env.NEXTAUTH_URL}/success?invoice=${invoiceId}`,
            cancel_url: `${process.env.NEXTAUTH_URL}/invoices/${invoiceId}`,
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