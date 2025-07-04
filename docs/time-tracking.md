# ⏱ Time‑Tracking Module (How I Built It)

This doc explains the **Time‑Tracking** feature in **FreelanceFlow**.  Each entry records start/stop times for a project, calculates total duration, and rolls up weekly/monthly stats.

```
User ─► Project ─► Time Entries  ➜  Stats / Billing
```

---

## 🧩 Basic Overview

* **Collection:** `time_entries`
* Fields: `projectId`, `description`, `tag`, `startTime`, `endTime`, `duration`, `user_id`
* `duration` is stored in **seconds** for easy math.

---

## ⚙️ Tech Used

| Feature         | Stack / Library                       |
| --------------- | ------------------------------------- |
| Database        | Appwrite Collections                  |
| State & Effects | React Hooks (`useState`, `useEffect`) |
| Live Timer      | Interval updated every second         |
| Date Formatting | `date-fns`                            |
| Icons           | Lucide (`PlayCircle`, `PauseCircle`)  |
| Query Caching   | TanStack Query (`useMutation`)        |

---

## 🔄 Flow Breakdown

### 🏁 1. Start Tracking

```ts
const doc = await databases.createDocument(DB_ID, 'time_entries', ID.unique(), {
  projectId: form.projectId,
  description: form.description,
  tag: form.tag,
  startTime: new Date().toISOString(),
  user_id: user.$id,
});
setTimerId(doc.$id);
setStartTime(new Date());
setIsRunning(true);
```

* UI switches to **Stop** button and live counter.

---

### ⏹️ 2. Stop Tracking

```ts
const duration = Math.floor((Date.now() - startTime.getTime()) / 1000);
await databases.updateDocument(DB_ID, 'time_entries', timerId, {
  endTime: new Date().toISOString(),
  duration,
});
setIsRunning(false);
fetchEntries();
```

* Calculates seconds worked and saves `duration`.

---

### 📊 3. Stats Calculation

```ts
const getStats = () => {
  const now = new Date();
  const stats: Record<string, number> = {};
  entries.filter(e => withinFilterRange(e)).forEach(e => {
    stats[e.projectId] = (stats[e.projectId] || 0) + (e.duration || 0);
  });
  return stats; // seconds per project
};
```

* Filters by **all / week / month**.
* Shows hours per project (`seconds / 3600`).

---

### 🗑️ 4. Delete Entry

```ts
await databases.deleteDocument(DB_ID, 'time_entries', id);
setEntries(prev => prev.filter(e => e.$id !== id));
```

* Removes selected entry from UI instantly.

---

## 🌐 Why I Chose This Design

| Need                      | Solution                              |
| ------------------------- | ------------------------------------- |
| Live timer UI             | `useEffect` interval + state          |
| Prevent duplicate running | Store single `timerId` state          |
| Weekly/monthly roll‑up    | Client‑side filter + seconds math     |
| Link to projects          | Store `projectId`, fetch name via map |

---

## 🔒 Security Details

| Security Feature | Implementation                             |
| ---------------- | ------------------------------------------ |
| RLS              | `user_id == currentUserId` on collection   |
| Server actions   | All writes validated on backend            |
| Input validation | Required `projectId`, string length checks |

---

## 📁 Related Files

```
app/
  (dashboard)/
    time-tracking/page.tsx  // main component (code shown)
lib/
  appwrite.ts               // Appwrite client
  actions/time.ts           // (future) server actions
```

---

### ✅ Time‑Tracking Checklist

* [x] Start / stop timer
* [x] Live elapsed counter
* [x] Store duration in seconds
* [x] Weekly / monthly stats
* [ ] Export hours to invoice
* [ ] Tags filter & reporting

---

## 📌 Improvements Planned

* [ ] **Idle detection**: pause timer if no activity
* [ ] **Tag analytics**: breakdown by tags
* [ ] **CSV export** for payroll/invoicing
* [ ] **Mobile stopwatch** interface
