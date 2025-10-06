"use client";
import { useRouter } from "next/navigation";
import InvoiceForm from "../components/InvoiceForm";

export default function NewInvoicePage() {
  const router = useRouter();
  return (
    <div className="max-w-4xl mx-auto mt-8">
      <InvoiceForm
        onClose={() => router.push("/invoices")}
      />
    </div>
  );
}