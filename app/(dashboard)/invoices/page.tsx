"use client";
import { useState } from "react";
import InvoicesList from "./components/InvoiceList";
import InvoiceForm from "./components/InvoiceForm";

const InvoicesPage = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Invoices</h1>
        <button
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition"
          onClick={() => setShowModal(true)}
        >
          Create Invoice
        </button>
      </div>
      <InvoicesList />

      {/* Modal for InvoiceForm */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-auto">
          <div className="bg-card p-6 rounded shadow-lg w-full max-w-2xl relative max-h-[90vh] overflow-y-auto m-4">
            <button
              className="absolute top-2 right-2 text-xl"
              onClick={() => setShowModal(false)}
            >
              &times;
            </button>
            <InvoiceForm />
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;