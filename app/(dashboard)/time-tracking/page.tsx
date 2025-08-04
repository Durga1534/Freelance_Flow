"use client";

import { useEffect, useState } from "react";
import { account, databases, ID, Query } from "@/lib/appwrite";
import { format } from "date-fns";
import { PauseCircle, PlayCircle, Trash2 } from "lucide-react";

const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const timeCollectionId = process.env.NEXT_PUBLIC_COLLECTION_TIME_TRACKING_ID!;
const projectCollectionId = process.env.NEXT_PUBLIC_COLLECTION_PROJECTS_ID!;

interface TimeEntry {
  $id: string;
  projectId: string;
  description: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  tag?: string;
}

interface Project {
  $id: string;
  name: string;
}

export default function TimeTrackingPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState({ projectId: "", description: "", tag: "" });
  const [submitting, setSubmitting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timerId, setTimerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [filter, setFilter] = useState<"all" | "week" | "month">("all");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        setElapsedSeconds(Math.floor((now.getTime() - startTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  const fetchProjects = async () => {
     try {
    const user = await account.get(); 

    const res = await databases.listDocuments(
      databaseId,
      projectCollectionId,
      [Query.equal("userId", user.$id)]
    );

    setProjects(res.documents as Project[]);
  } catch (err) {
    console.error("Failed to fetch projects:", err);
  }
  };

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const user = await account.get();

      const res = await databases.listDocuments(databaseId, timeCollectionId, [Query.equal("userId", user.$id), Query.orderDesc("$createdAt")]);
      setEntries(res.documents as TimeEntry[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchEntries();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleStart = async () => {
    const now = new Date().toISOString();
    const user = await account.get();

    const doc = await databases.createDocument(databaseId, timeCollectionId, ID.unique(), {
      projectId: form.projectId,
      description: form.description,
      tag: form.tag,
      startTime: now,
      userId: user.$id,
    });
    setTimerId(doc.$id);
    setStartTime(new Date(now));
    setElapsedSeconds(0);
    setIsRunning(true);
  };

  const handleStop = async () => {
    if (!timerId || !startTime) return;
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    await databases.updateDocument(databaseId, timeCollectionId, timerId, {
      endTime: endTime.toISOString(),
      duration: duration,
    });
    setTimerId(null);
    setStartTime(null);
    setIsRunning(false);
    fetchEntries();
  };

  const handleDelete = async (id: string) => {
    await databases.deleteDocument(databaseId, timeCollectionId, id);
    setEntries((prev) => prev.filter((entry) => entry.$id !== id));
  };

  const getTotalHours = (seconds: number) => (seconds / 3600).toFixed(2);

  const getStats = () => {
    const now = new Date();
    const stats: Record<string, number> = {};
    const filtered = entries.filter((e) => {
      if (!e.duration || !e.endTime) return false;
      const entryDate = new Date(e.endTime);
      if (filter === "week") {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return entryDate >= oneWeekAgo;
      }
      if (filter === "month") {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(now.getMonth() - 1);
        return entryDate >= oneMonthAgo;
      }
      return true;
    });
    filtered.forEach((e) => {
      stats[e.projectId] = (stats[e.projectId] || 0) + (e.duration || 0);
    });
    return stats;
  };

  const projectMap = Object.fromEntries(projects.map((p) => [p.$id, p.name]));

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-wrap justify-center mb-4">
        <h1 className="text-3xl font-bold mb-2">Time Tracking</h1>
        {isRunning && (
          <p className="text-green-600 font-semibold">
            Tracking: {projectMap[form.projectId] || "Unnamed Project"} —
            {` ${Math.floor(elapsedSeconds / 3600)}h ${Math.floor((elapsedSeconds % 3600) / 60)}m ${elapsedSeconds % 60}s`}
          </p>
        )}
      </div>

      <form className="space-y-3 bg-card p-4 rounded shadow">
        <select
          name="projectId"
          value={form.projectId}
          onChange={handleChange}
          className="w-full p-2 border rounded bg-input text-foreground"
          required
        >
          <option value="">Select Project</option>
          {projects.map((p) => (
            <option key={p.$id} value={p.$id}>{p.name}</option>
          ))}
        </select>

        <input
          type="text"
          name="tag"
          value={form.tag}
          placeholder="Tag (optional)"
          onChange={handleChange}
          className="w-full p-2 border rounded bg-input text-foreground"
        />

        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          className="w-full p-2 border rounded bg-input text-foreground"
        />

        {!isRunning ? (
          <button
            type="button"
            onClick={handleStart}
            disabled={!form.projectId || submitting}
            className="bg-primary text-primary-foreground px-4 py-2 rounded flex items-center gap-2"
          >
            <PlayCircle className="w-4 h-4" /> Start
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStop}
            className="bg-red-600 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <PauseCircle className="w-4 h-4" /> Stop
          </button>
        )}
      </form>

      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Project Stats</h2>
          <select
            className="bg-muted p-1 rounded text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="all">All</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
        <ul className="grid md:grid-cols-3 gap-3">
          {Object.entries(getStats()).map(([projectId, seconds]) => (
            <li key={projectId} className="bg-muted p-4 rounded">
              <p className="font-semibold">{projectMap[projectId] || "Unknown Project"}</p>
              <p className="text-muted-foreground text-sm">{getTotalHours(seconds)} hrs</p>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">All Entries</h2>
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div key={entry.$id} className="bg-muted p-3 rounded flex justify-between items-center">
                <div>
                  <p className="font-semibold">{projectMap[entry.projectId] || "Unknown Project"}</p>
                  <p className="text-sm text-muted-foreground">{entry.description}</p>
                  {entry.tag && <p className="text-xs text-blue-500">#{entry.tag}</p>}
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(entry.startTime), "PPpp")} —
                    {entry.endTime ? ` ${format(new Date(entry.endTime), "PPpp")}` : " In Progress"}
                  </p>
                </div>
                <button onClick={() => handleDelete(entry.$id)}>
                  <Trash2 className="w-4 h-4 text-red-500 hover:text-red-700" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
