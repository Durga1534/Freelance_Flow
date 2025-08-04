"use client";

import { useState, useEffect } from "react";
import { account, databases, ID } from "@/lib/appwrite";

const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const collectionId = process.env.NEXT_PUBLIC_COLLECTION_CLIENTS_ID!;

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

// Better TypeScript approach - no React.FC
function ClientForm({ onClientAdded }: ClientFormProps) {
  const [form, setForm] = useState<ClientFields>({
    name: "",
    email: "",
    phone: "",
    company: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await account.get();
        setCurrentUser(user);
      } catch (err) {
        console.error("No user session found:", err);
        setError("Please log in to add clients.");
      }
    };
    
    checkUser();
  }, []);

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
      
      if (!user || !user.$id) {
        throw new Error("User session not found. Please log in again.");
      }

      // Convert user ID to string and ensure it's not too long
      let userId = String(user.$id);
      
      // If userId is longer than 20 chars, create a hash or use a different approach
      if (userId.length > 20) {
        // Option 2: Create a hash (better approach)
        userId = btoa(userId).substring(0, 20).replace(/[+/=]/g, '');
        console.log("Original userId too long, using hashed version:", userId);
      }

      console.log("Final userId to be stored:", userId, "Length:", userId.length);

      const documentData = {
        ...form,
        userId: userId
      };

      const result = await databases.createDocument(
        databaseId, 
        collectionId, 
        ID.unique(), 
        documentData
      );

      console.log("Document created successfully:", result);

      // Reset form
      setForm({
        name: "",
        email: "",
        phone: "",
        company: "",
        notes: ""
      });
      
      onClientAdded();
    } catch (err: any) {
      console.error("Error adding client:", err);
      
      let errorMessage = "Failed to add client. Please try again.";
      
      if (err.code === 401) {
        errorMessage = "Authentication failed. Please log in again.";
      } else if (err.code === 400) {
        errorMessage = "Invalid data format. Please check all fields.";
      } else if (err.message?.includes("Invalid document structure")) {
        errorMessage = "Data validation failed. Please contact support.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="space-y-4 bg-card text-card-foreground p-6 rounded shadow-md">
        <h2 className="text-xl font-semibold">Add New Client</h2>
        <p className="text-destructive">Please log in to add clients.</p>
      </div>
    );
  }

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
}

export default ClientForm;