"use client";
import { useState } from "react";
import ClientForm from "./ClientForm";
import ClientsList from "./ClientsList";

const ClientsPage = () => {
  const [refresh, setRefresh] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleClientAdded = () => {
    setRefresh((prev) => !prev);
    setShowModal(false); 
  };

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <ClientsList key={refresh ? "1" : "0"} />

      <button
        className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90"
        onClick={() => setShowModal(true)}
      >
        Add Client
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-card p-6 rounded w-full max-w-lg shadow-md relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-2 text-foreground text-xl"
            >
              ×
            </button>
            <ClientForm onClientAdded={handleClientAdded} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsPage;
