"use client"

import { useState } from "react"
import { account ,databases, ID } from "@/lib/appwrite"

const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const collectionId = process.env.NEXT_PUBLIC_COLLECTION_PROJECTS_ID!;

const ProjectsForm = ({onProjectAdded, isOpen, onClose} : {
  onProjectAdded: () => void,
  isOpen: boolean,
  onClose: () => void
}) => {
    const [form, setForm] = useState({
    name: "",
    client: "",
    status: "Planning",
    priority: "medium",
    budget: "",
    startDate: "",
    deadline: "",
    description: "",
    tags: ""
  });
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");

const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({...form, [e.target.name] : e.target.value});
};

const handleSubmit = async(e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const user = await account.get();
        const documentData = {
            ...form,
            budget: form.budget ? Number(form.budget) : null,
            tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
            userId: user.$id,
        };
        
        console.log("Sending data:", documentData); 
        
        await databases.createDocument(
            databaseId,
            collectionId,
            ID.unique(),
            documentData
        );
        
        setForm({
            name: "",
            client: "",
            status: "Planning",
            priority: "medium",
            budget: "",
            startDate: "",
            deadline: "",
            description: "",
            tags: ""
        });
        onProjectAdded();
        onClose();
    } catch(err: any) {
        console.error("Error creating document:", err); // Better error logging
        setError(err.message || "Failed to add project");
    } finally {
        setLoading(false);
    }
}

if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card text-card-foreground rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">New Project</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xl font-bold"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Project Name
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full px-2 py-1.5 text-sm border border-border rounded bg-input text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
              />  
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Client
              </label>
              <input
                name="client"
                value={form.client}
                onChange={handleChange}
                required
                className="w-full px-2 py-1.5 text-sm border border-border rounded bg-input text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-border rounded bg-input text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
              >
                <option value="Planning">Planning</option>
                <option value="Progress">Progress</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-border rounded bg-input text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Budget
              </label>
              <input
                name="budget"
                type="number"
                value={form.budget}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-border rounded bg-input text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Tags
              </label>
              <input
                name="tags"
                value={form.tags}
                onChange={handleChange}
                placeholder="tag1, tag2"
                className="w-full px-2 py-1.5 text-sm border border-border rounded bg-input text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Start Date
              </label>
              <input
                name="startDate"
                type="date"
                value={form.startDate}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-border rounded bg-input text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Deadline
              </label>
              <input
                name="deadline"
                type="date"
                value={form.deadline}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-border rounded bg-input text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full px-2 py-1.5 text-sm border border-border rounded bg-input text-foreground focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
              rows={2}
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
          
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-1.5 text-sm border border-border rounded text-muted-foreground hover:bg-muted transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProjectsForm
