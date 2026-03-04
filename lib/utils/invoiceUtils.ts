import { format } from 'date-fns'
import { Databases, Query } from 'appwrite'

export const generateInvoiceNumber = async (databases: Databases, databaseId: string, collectionId: string) => {
    try {
        const response = await databases.listDocuments(databaseId, collectionId, [
            Query.orderDesc('invoice_number'),
            Query.limit(1)
        ]);

        const lastInvoice = response.documents[0];
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = (currentDate.getMonth() + 1).toString().padStart(1, '0');

        if (!lastInvoice) {
            return `INV-${year}${month}-0001`
        }

        const lastNumber = parseInt(lastInvoice.invoice_number.split('-').pop());
        const newNumber = (lastNumber + 1).toString().padStart(4, '0');
        return `INV-${year}${month}-${newNumber}`;
    } catch (err) {
        console.error('Error generating invoice number: ', err);
        return `INV-${Date.now()}`;
    }
};


export const calculateDueDate = (invoiceDate: Date, paymentTerms: number) => {
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + paymentTerms);
    return format(dueDate, 'yyyy-MM-dd');
};


export const calculateInvoiceTotals = (
    items: Array<{ quantity: number, rate: number }>,
    taxRate: number,
    discountType: 'percentage' | 'fixed',
    discountValue: number
) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const discountAmount = discountType === 'percentage' ? (subtotal * discountValue) / 100 : discountValue;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * taxRate) / 100;
    const totalAmount = taxableAmount + taxAmount;

    return {
        subtotal: Math.round(subtotal * 100) / 100,
        discountAmount: Math.round(discountAmount * 100) / 100,
        taxAmount: Math.round(taxAmount * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
    };
};