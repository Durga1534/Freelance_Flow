"use client";

import { useEffect, useState } from "react";
import { account, databases, Query } from "@/lib/appwrite";
import Link from "next/link";
import { MoreHorizontal, Tag } from "lucide-react";

const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const collectionId = process.env.NEXT_PUBLIC_COLLECTION_PROJECTS_ID!;

type Project = {
  $id: string;
  name: string;
  client: string;
  status: "planning" | "In Progress" | "Completed" | "Pending";
  priority: "low" | "medium" | "high";
  budget?: number;
  startDate?: string;
  deadline?: string;
  tags?: string[];
  description?: string;
};

const statusColors: Record<Project["status"], string> = {
  planning: "text-blue-600 bg-blue-100",
  "In Progress": "text-yellow-600 bg-yellow-100",
  Completed: "text-green-600 bg-green-100",
  Pending: "text-gray-600 bg-gray-100",
};

const priorityColors: Record<Project["priority"], string> = {
  low: "text-green-700 bg-green-100",
  medium: "text-yellow-700 bg-yellow-100",
  high: "text-red-700 bg-red-100",
};

export default function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const user = await account.get();

      const response = await databases.listDocuments(databaseId, collectionId, [Query.equal("userId", user.$id)]);
      setProjects(response.documents as Project[]);
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
  };

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-semibold mb-6">Projects List</h2>
      {loading ? (
        <p className="text-muted-foreground">Loading projects...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border shadow-sm bg-card">
          <table className="w-full min-w-[1000px] text-sm text-left">
            <thead className="bg-muted text-muted-foreground uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Budget</th>
                <th className="px-4 py-3">Start</th>
                <th className="px-4 py-3">Deadline</th>
                <th className="px-4 py-3">Tags</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr
                  key={project.$id}
                  className="border-t border-border hover:bg-muted/20 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-primary hover:underline">
                    <Link href={`/projects/${project.$id}`}>{project.name}</Link>
                  </td>
                  <td className="px-4 py-3">{project.client}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${statusColors[project.status]}`}
                    >
                      {project.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${priorityColors[project.priority]}`}
                    >
                      {project.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {project.budget ? `₹${project.budget.toLocaleString()}` : "-"}
                  </td>
                  <td className="px-4 py-3">{formatDate(project.startDate)}</td>
                  <td className="px-4 py-3">{formatDate(project.deadline)}</td>
                  <td className="px-4 py-3 space-x-1 whitespace-nowrap">
                    {project.tags?.length ? (
                      project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-0.5 bg-muted rounded text-xs"
                        >
                          <Tag className="h-3 w-3 mr-1" /> {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate">{project.description || "-"}</td>
                  <td className="px-4 py-3 text-right">
                    <MoreHorizontal
                      className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Actions"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
