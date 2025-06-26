"use client";

import { useEffect, useState } from "react";
import { account, databases, Query } from "@/lib/appwrite";
import Link from "next/link";
import StripeButton from "./StripeButton";


const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const collectionId = process.env.NEXT_PUBLIC_COLLECTION_INVOICES_ID!;

const InvoicesList = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const user = await account.get();

        const response = await databases.listDocuments(databaseId, collectionId, [Query.equal("userId", user.$id)]);
        setInvoices(response.documents);
      } catch (err) {
        setError("Failed to load invoices.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  if (loading) return <div>Loading invoices...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (invoices.length === 0) return <div>No invoices found.</div>;

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold mb-2">Invoices</h2>
      <ul className="space-y-3">
        {invoices.map((invoice) => (
          <li
            key={invoice.$id}
            className="border p-4 rounded shadow-sm bg-white flex justify-between items-center"
          >
            <div>
              <p className="font-medium">{invoice.invoice_number}</p>
              <p className="text-sm text-gray-500">{invoice.client_email}</p>
              <p className="text-sm text-gray-500">Status: {invoice.status}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/invoices/${invoice.$id}`}
                className="text-purple-600 hover:underline"
              >
                View
              </Link>

              {invoice.status !== "paid" && (
                 <StripeButton
                    invoiceId={invoice.$id}
                    amount={invoice.total_amount}
                    email={invoice.client_email}
                />
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InvoicesList;
