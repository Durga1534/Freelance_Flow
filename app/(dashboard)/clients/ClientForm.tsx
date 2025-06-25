"use client";

import { useState } from "react";
import { account, databases, ID } from "@/lib/appwrite";

const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const collectionId = process.env.NEXT_PUBLIC_COLLECTION_CLIENTS_ID;

type ClientFields = {
  name: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
};

type ClientFormProps = {
  onClientAdded: () => void;
};

const ClientForm: React.FC<ClientFormProps> = ({ onClientAdded }) => {
  const [form, setForm] = useState<ClientFields>({
    name: "",
    email: "",
    phone: "",
    company: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = await account.get(); 

      await databases.createDocument(databaseId, collectionId, ID.unique(), {
          ...form, 
          userId: user.$id
      });
      setForm({
        name: "",
        email: "",
        phone: "",
        company: "",
        notes: ""
      });
      onClientAdded();
    } catch (err) {
      console.error("Error adding client:", err);
      setError("Failed to add client. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-card text-card-foreground p-6 rounded shadow-md"
    >
      <h2 className="text-xl font-semibold">Add New Client</h2>

      {(Object.keys(form) as (keyof ClientFields)[]).map((field) => (
        <div key={field}>
          <label htmlFor={field} className="block mb-1 capitalize">
            {field}
          </label>
          <input
            id={field}
            name={field}
            type="text"
            value={form[field]}
            onChange={handleChange}
            required={field !== "notes"}
            className="w-full px-3 py-2 border border-border rounded bg-input text-foreground"
          />
        </div>
      ))}

      {error && <p className="text-destructive text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 transition"
      >
        {loading ? "Adding..." : "Add Client"}
      </button>
    </form>
  );
};

export default ClientForm;
