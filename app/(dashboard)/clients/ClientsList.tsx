"use client";

import { useEffect, useState } from "react";
import { account, databases, Query } from "@/lib/appwrite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const collectionId = process.env.NEXT_PUBLIC_COLLECTION_CLIENTS_ID!;

type Client = {
  $id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
  userId: string;
};

const ClientsList = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Client>>({});
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null); // Fixed: Added missing state
  const [error, setError] = useState<string | null>(null); // Added: Error state

  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await account.get();
      setCurrentUser(user);

      // Handle userId length issue similar to ClientForm
      let userId = String(user.$id);
      if (userId.length > 20) {
        userId = btoa(userId).substring(0, 20).replace(/[+/=]/g, '');
      }

      const res = await databases.listDocuments(databaseId, collectionId, [
        Query.equal("userId", userId)
      ]);
      setClients(res.documents as Client[]);
    } catch (err) {
      console.error("Failed to fetch clients", err);
      setError("Failed to load clients. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const startEdit = (client: Client) => {
    setEditId(client.$id);
    setEditForm({ ...client });
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditForm({});
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const saveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    try {
      const updatedData: Record<string, string> = {
        name: editForm.name ?? "",
        email: editForm.email ?? "",
        phone: editForm.phone ?? "",
        company: editForm.company ?? "",
        notes: editForm.notes ?? "",
      };
      await databases.updateDocument(databaseId, collectionId, editId, updatedData);
      setEditId(null);
      setEditForm({});
      fetchClients();
    } catch (err) {
      console.error("Failed to update client:", err);
      alert("Failed to update client.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (clientId: string) => {
    if (!confirm("Are you sure you want to delete this client?")) return;
    try {
      await databases.deleteDocument(databaseId, collectionId, clientId);
      setClients(clients.filter((c) => c.$id !== clientId));
    } catch (err) {
      console.error("Failed to delete client:", err);
      alert("Failed to delete client.");
    }
  };

  // Show error state
  if (error) {
    return (
      <div className="mt-8 p-6 bg-red-50 rounded-xl border border-red-200">
        <h2 className="text-xl font-semibold text-red-900 mb-2">Error</h2>
        <p className="text-red-700">{error}</p>
        <Button 
          onClick={fetchClients} 
          className="mt-4"
          variant="outline"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-8 p-6 bg-white rounded-xl border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Clients</h2>
        <p className="text-sm text-muted-foreground">{clients.length} total</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading clients...</p>
      ) : clients.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No clients found.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Add your first client using the form above.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-muted bg-background">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client, idx) => (
                <tr
                  key={client.$id}
                  className={cn(
                    "border-t border-border",
                    idx % 2 === 0 ? "bg-white" : "bg-muted/10",
                    "hover:bg-muted/40"
                  )}
                >
                  {editId === client.$id ? (
                    <>
                      {["name", "email", "phone", "company", "notes"].map((field) => (
                        <td className="px-4 py-2" key={field}>
                          <Input
                            name={field}
                            value={editForm[field as keyof Client] || ""}
                            onChange={handleEditChange}
                          />
                        </td>
                      ))}
                      <td className="px-4 py-2 space-x-2">
                        <Button size="sm" variant="default" onClick={saveEdit} disabled={saving}>
                          {saving ? "Saving..." : "Save"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEdit}>
                          Cancel
                        </Button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2">{client.name}</td>
                      <td className="px-4 py-2">{client.email}</td>
                      <td className="px-4 py-2">{client.phone}</td>
                      <td className="px-4 py-2">{client.company}</td>
                      <td className="px-4 py-2">{client.notes}</td>
                      <td className="px-4 py-2 space-x-2">
                        <Button size="sm" variant="outline" onClick={() => startEdit(client)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(client.$id)}>
                          Delete
                        </Button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClientsList;