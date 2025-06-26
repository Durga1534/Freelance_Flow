"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { databases } from "@/lib/appwrite";

const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const collectionId = process.env.NEXT_PUBLIC_COLLECTION_INVOICES_ID!;



const InvoiceDetails = () => {
    const {invoiceId} = useParams();
    const [invoice, setInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
    const fetchInvoice = async () => {
        try {
            const data = await databases.getDocument(databaseId, collectionId, invoiceId as string);
            setInvoice(data);
        }catch(err) {
            setInvoice(null);
        }finally {
            setLoading(false);
        }
    };
    if (invoiceId) fetchInvoice();
}, [invoiceId]);

useEffect(() => {
  const updatePaidStatus = async () => {
    if (
      invoice && 
      invoice.status !== "paid" && 
      typeof invoice.total_amount === "number"
    ) {
      try {
        await databases.updateDocument(databaseId, collectionId, invoiceId as string, {
          status: "paid",
          payment_date: new Date().toISOString(),
          paid_amount: invoice.total_amount,
        });
        const updatedInvoice = await databases.getDocument(databaseId, collectionId, invoiceId as string);
        setInvoice(updatedInvoice);
        console.log("Invoice updated successfully");
      } catch (err) {
        console.error("Failed to update invoice:", err);
      }
    }
  };

  updatePaidStatus();
}, [invoice, invoiceId]);


if (loading) return <div className="p-8">Loading...</div>
if (!invoice) return <div className="p-8 text-destructive">Invoice not found.</div>
  return (
      <div className="max-w-3xl mx-auto bg-card p-6 rounded-lg shadow mt-10 space-y-6">
        <h1 className="text-2xl font-bold text-primary">Invoice #{invoice.invoice_number}</h1>

        {/* Status + Dates */}
        <div className="grid grid-cols-2 gap-4 bg-muted p-4 rounded">
            <div><strong>Status:</strong> {invoice.status}</div>
            <div><strong>Currency:</strong> {invoice.currency}</div>
            <div><strong>Invoice Date:</strong> {invoice.invoice_date}</div>
            <div><strong>Due Date:</strong> {invoice.due_date}</div>
        </div>

        {/* Client Info */}
        <div className="bg-muted p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Client Info</h2>
            <div><strong>Email:</strong> {invoice.client_email}</div>
            <div><strong>Company:</strong> {invoice.client_company}</div>
        </div>

        {/* Business Info */}
        <div className="bg-muted p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Business Info</h2>
            <div><strong>Name:</strong> {invoice.business_name}</div>
            <div><strong>Email:</strong> {invoice.business_email}</div>
        </div>

        {/* Financial Summary */}
        <div className="bg-muted p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Amount Summary</h2>
            <div className="flex justify-between"><span>Subtotal:</span><span>{invoice.subtotal}</span></div>
            <div className="flex justify-between"><span>Tax ({invoice.tax_rate}%):</span><span>{invoice.tax_amount}</span></div>
            <div className="flex justify-between"><span>Discount ({invoice.discount_type}):</span><span>-{invoice.discount_value}</span></div>
            <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total:</span><span>{invoice.total_amount}</span></div>
            <div className="flex justify-between"><span>Paid:</span><span>{invoice.paid_amount}</span></div>
        </div>
    </div>

  )
}

export default InvoiceDetails
