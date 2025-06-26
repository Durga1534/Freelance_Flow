"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { databases, Query } from "@/lib/appwrite";

const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const invoiceCollectionId = process.env.NEXT_PUBLIC_COLLECTION_INVOICES_ID!;
const itemCollectionId = process.env.NEXT_PUBLIC_COLLECTION_INVOICES_ITEMS_ID!;

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("invoice");

  const [invoice, setInvoice] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!invoiceId) return;

    const fetchInvoiceAndItems = async () => {
      try {
        const [invoiceDoc, itemDocs] = await Promise.all([
          databases.getDocument(databaseId, invoiceCollectionId, invoiceId),
          databases.listDocuments(databaseId, itemCollectionId, [
            Query.equal("invoice_id", invoiceId),
            Query.orderAsc("item_order"),
          ]),
        ]);

        setInvoice(invoiceDoc);
        setItems(itemDocs.documents);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceAndItems();
  }, [invoiceId]);

  useEffect(() => {
  if (invoice && invoice.status !== "paid") {
    databases.updateDocument(databaseId, invoiceCollectionId, invoiceId!, {
      status: "paid",
      payment_date: new Date().toISOString(),
    }).then(() => {
      console.log("Invoice updated to paid");
    }).catch((err) => {
      console.error("Error updating invoice:", err);
    });
  }
}, [invoice]);


  if (loading) return <p className="p-4 text-muted-foreground">Loading invoice...</p>;
  if (!invoice) return <p className="p-4 text-red-500">Invoice not found.</p>;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-green-600">✅ Payment Successful</h1>

      <div className="bg-card p-4 rounded shadow">
        <p className="font-medium">Invoice ID: {invoice.$id}</p>
        <p className="text-muted-foreground">Email: {invoice.email}</p>
        <p className="text-muted-foreground">Status: {invoice.status}</p>
        <p className="text-muted-foreground">Total: ₹{invoice.total}</p>
      </div>

      <div className="bg-muted p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Invoice Items</h2>
        {items.length === 0 ? (
          <p className="text-muted-foreground">No items found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th>Description</th>
                <th>Qty</th>
                <th>Unit ₹</th>
                <th>Total ₹</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.$id} className="border-t">
                  <td>{item.description}</td>
                  <td>{item.quantity}</td>
                  <td>{item.unit_price}</td>
                  <td>{item.total_price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
