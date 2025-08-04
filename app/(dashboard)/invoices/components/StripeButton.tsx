"use client";

import { loadStripe } from "@stripe/stripe-js";
import { useState } from "react";

const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface StripeButtonProps {
    invoiceId: string;
    amount: number | null | undefined;
    email: string;
    payment_date?: Date;
    payment_method?: string;
    status?: "pending" | "paid" | "failed";
    transaction_id?: string;
}

function StripeButton({
    invoiceId,
    amount,
    email,
    payment_date,
    payment_method,
    status = "pending",
    transaction_id
}: StripeButtonProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Validate amount
    const validAmount = amount && typeof amount === 'number' && amount > 0 ? amount : 0;

    const handlePayment = async () => {
        // Validate before payment
        if (!validAmount || validAmount <= 0) {
            setError("Invalid amount for payment");
            return;
        }

        if (!email || !invoiceId) {
            setError("Missing required payment information");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const stripe = await stripePromise;

            if (!stripe) {
                throw new Error("Stripe failed to load");
            }

            // Create checkout session using Appwrite function
            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    invoiceId,
                    amount: validAmount,
                    email,
                    payment_date,
                    payment_method,
                    transaction_id
                }),
            });

            // Check if response is ok
            if (!response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Server error: ${response.status}`);
                } else {
                    // Response is HTML (likely an error page)
                    const text = await response.text();
                    console.error('Non-JSON response:', text);
                    throw new Error(`Server error: ${response.status} - Check your API route`);
                }
            }

            const data = await response.json();
            const { sessionId } = data;

            if (!sessionId) {
                throw new Error('No session ID received from server');
            }

            // Redirect to Stripe Checkout
            const { error } = await stripe.redirectToCheckout({ sessionId });

            if (error) {
                setError(error.message || "An error occurred during payment");
            }

        } catch (err) {
            console.error('Payment error:', err);
            setError(err instanceof Error ? err.message : "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    // Don't show button if already paid
    if (status === "paid") {
        return (
            <div className="text-green-600 font-medium">
                ✓ Payment Completed
                {transaction_id && (
                    <div className="text-sm text-gray-500">
                        Transaction ID: {transaction_id}
                    </div>
                )}
            </div>
        );
    }

    // Don't show button if amount is invalid
    if (!validAmount || validAmount <= 0) {
        return (
            <div className="text-gray-500 text-sm">
                Invalid amount
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <button
                onClick={handlePayment}
                disabled={loading || status === "paid" || !validAmount}
                className={`
                    px-6 py-3 rounded-lg font-medium transition-colors shadow-sm
                    ${loading || !validAmount
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                    }
                `}
            >
                {loading ? 'Processing...' : `Pay $${validAmount.toFixed(2)}`}
            </button>

            {error && (
                <div className="text-red-600 text-sm">
                    {error}
                </div>
            )}

            {status === "failed" && (
                <div className="text-red-600 text-sm">
                    Previous payment failed. Please try again.
                </div>
            )}
        </div>
    );
}

export default StripeButton;