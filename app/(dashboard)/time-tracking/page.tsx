"use client";

import { useEffect, useState } from "react";
import { account, databases, ID, Query } from "@/lib/appwrite";
import { format } from "date-fns";
import { PauseCircle, PlayCircle, Trash2, Clock, Tag, AlignLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

type FilterType = "all" | "week" | "month";

export default function TimeTrackingPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState({ projectId: "", description: "", tag: "" });
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timerId, setTimerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
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
      const res = await databases.listDocuments(databaseId, projectCollectionId, [
        Query.equal("userId", user.$id),
      ]);
      setProjects(res.documents as Project[]);
    } catch {
      // Projects may not exist yet — silently continue
    }
  };

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const user = await account.get();
      const res = await databases.listDocuments(databaseId, timeCollectionId, [
        Query.equal("userId", user.$id),
        Query.orderDesc("$createdAt"),
      ]);
      setEntries(res.documents as TimeEntry[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
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
      duration,
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

  const formatElapsed = () => {
    const h = Math.floor(elapsedSeconds / 3600);
    const m = Math.floor((elapsedSeconds % 3600) / 60);
    const s = elapsedSeconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Time Tracking</h1>
          <p className="text-muted-foreground mt-1">Track time spent on your projects.</p>
        </div>
        {isRunning && (
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">
              {projectMap[form.projectId] || "Unnamed Project"} — {formatElapsed()}
            </p>
          </div>
        )}
      </div>

      {/* Timer Form */}
      <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-card-foreground">Start a Timer</h2>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Project</label>
          <select
            name="projectId"
            value={form.projectId}
            onChange={handleChange}
            className="w-full rounded-md border border-input bg-background py-2 px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
            required
          >
            <option value="">Select Project</option>
            {projects.map((p) => (
              <option key={p.$id} value={p.$id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            <span className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" /> Tag <span className="text-muted-foreground font-normal">(optional)</span>
            </span>
          </label>
          <Input
            type="text"
            name="tag"
            value={form.tag}
            placeholder="e.g. design, development"
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            <span className="flex items-center gap-1.5">
              <AlignLeft className="h-3.5 w-3.5" /> Description
            </span>
          </label>
          <textarea
            name="description"
            placeholder="What are you working on?"
            value={form.description}
            onChange={handleChange}
            rows={2}
            className="w-full rounded-md border border-input bg-background py-2 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {!isRunning ? (
          <Button
            type="button"
            onClick={handleStart}
            disabled={!form.projectId}
            className="flex items-center gap-2"
          >
            <PlayCircle className="w-4 h-4" /> Start Timer
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleStop}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <PauseCircle className="w-4 h-4" /> Stop Timer
          </Button>
        )}
      </div>

      {/* Project Stats */}
      <div className="bg-card border border-border rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Project Stats
          </h2>
          <select
            className="bg-muted border border-border rounded-md px-2 py-1 text-sm text-foreground focus:outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterType)}
          >
            <option value="all">All Time</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
        <ul className="grid md:grid-cols-3 gap-3">
          {Object.entries(getStats()).map(([projectId, seconds]) => (
            <li key={projectId} className="bg-muted/50 border border-border p-4 rounded-lg">
              <p className="font-semibold text-foreground">{projectMap[projectId] || "Unknown Project"}</p>
              <p className="text-muted-foreground text-sm mt-0.5">{getTotalHours(seconds)} hrs</p>
            </li>
          ))}
          {Object.keys(getStats()).length === 0 && (
            <li className="col-span-3 text-center py-6 text-muted-foreground">
              No time entries for this period.
            </li>
          )}
        </ul>
      </div>

      {/* All Entries */}
      <div className="bg-card border border-border rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-card-foreground mb-4">All Entries</h2>
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No time entries yet. Start your first timer above!</p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.$id}
                className="bg-muted/50 border border-border p-4 rounded-lg flex justify-between items-start"
              >
                <div className="space-y-0.5">
                  <p className="font-semibold text-foreground">
                    {projectMap[entry.projectId] || "Unknown Project"}
                  </p>
                  {entry.description && (
                    <p className="text-sm text-muted-foreground">{entry.description}</p>
                  )}
                  {entry.tag && (
                    <span className="inline-flex items-center gap-1 text-xs text-primary bg-primary/10 rounded-full px-2 py-0.5">
                      <Tag className="h-2.5 w-2.5" />
                      {entry.tag}
                    </span>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(entry.startTime), "PPpp")} —
                    {entry.endTime
                      ? ` ${format(new Date(entry.endTime), "PPpp")}`
                      : " In Progress"}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(entry.$id)}
                  className="ml-4 p-1 rounded hover:bg-destructive/10 transition-colors"
                  aria-label="Delete entry"
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
