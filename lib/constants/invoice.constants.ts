export const PAYMENT_TERMS = {
    IMMEDIATE: 0,
    NET_15: 15,
    NET_30: 30,
    NET_45: 45,
    NET_60: 60,
} as const;

export const INVOICE_STATUS = {
    DRAFT: 'draft',
    SENT: 'sent',
    PAID: 'paid',
    OVERDUE: 'overdue',
} as const;

export const CURRENCIES = {
    USD: 'USD',
    EUR: 'EUR',
    INR: 'INR',
} as const;

export const RECURRING_INTERVALS = {
    MONTHLY: 'monthly',
    QUATERLY: 'quaterly',
    YEARLY: 'yearly',
} as const;