# 📦 Projects Module (How I Built It)

This doc explains how the **Projects** feature works inside **FreelanceFlow**.  Each project is linked to a **client** and the **logged‑in user** so you can track status, budget, dates, and tags.  Data lives in the `projects` collection in **Appwrite**.

```
User ─► Client ─► 📦 Project ─► ⏱ Time Logs + 💸 Invoices
```

---

## 🧩 Basic Overview

* Collection: **projects**
* Key fields: `name`, `client`, `status`, `priority`, `budget`, `startDate`, `deadline`, `description`, `tags[]`, `user_id`
* All CRUD operations are done via **Next.js Server Actions** that call the Appwrite SDK.

---

## ⚙️ Tech Used

| Feature     | What I Used                          |
| ----------- | ------------------------------------ |
| Database    | Appwrite Collections (`databases.*`) |
| Routing     | Next.js 15 App Router                |
| Forms       | React Hook Form + shadcn/ui inputs   |
| Validation  | Zod (frontend + backend)             |
| UI Feedback | Lucide icons + toast notifications   |

---

## 🔄 Flow Breakdown

### 📝 1. Creating a Project (`/projects/new`)

* Form inputs: see code snippet below.
* Client‑side validation: **required** → `name`, `client`, `status`.
* Optional numeric field `budget` is cast to **Number** (or `null`).
* Tags are split by comma into an array.

```ts
const documentData = {
  ...form,
  budget: form.budget ? Number(form.budget) : null,
  tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
  user_id: user.$id,
};
await databases.createDocument(DB_ID, 'projects', ID.unique(), documentData);
```

* Success → toast **“Project created”** → redirect to `/projects`.

---

### 📋 2. Listing Projects (`/projects`)

```ts
await databases.listDocuments(
  DB_ID,
  'projects',
  [Query.equal('user_id', user.$id)]
);
```

* Displayed in a paginated table with **status**, **priority badge**, and **progress bar**.
* Sort by `deadline`, filter by `status`, search by `name`.

---

### ✏️ 3. Editing a Project (`/projects/[id]/edit`)

* Form is pre‑filled with the selected project.
* Uses same Zod schema for validation.

```ts
await databases.updateDocument(
  DB_ID,
  'projects',
  projectId,
  { ...updatedFields }
);
```

* Success → toast **“Project updated”**.

---

### 🗑️ 4. Deleting a Project

* Confirmation modal → if **Yes** call:

```ts
await databases.deleteDocument(DB_ID, 'projects', projectId);
```

* TODO: cascade delete or soft‑delete linked **time logs**.

---

## 🌐 Why I Chose This Design

| Need                          | Solution                                                        |
| ----------------------------- | --------------------------------------------------------------- |
| Link each project to a client | Store `client` string + later use `client_id` ref               |
| Multi‑user isolation          | Store `user_id` and filter queries                              |
| Quick status updates          | Enum field `status` (Planning / Progress / Completed / Pending) |
| Analytics per tag / priority  | Store `tags[]` + `priority` for drill‑downs                     |

---

## 🔒 Security Details

| Security Feature | Implementation                                         |
| ---------------- | ------------------------------------------------------ |
| RLS              | Appwrite rule: `user_id == currentUserId`              |
| Server actions   | All writes occur in **server code**, never client‑only |
| Input validation | Zod checks on both client and server                   |

---

## 📁 Files Related to Projects

```
app/
  (dashboard)/
    projects/
      page.tsx        // list + filter projects
      new/page.tsx    // create project modal
      [id]/edit.tsx   // update project
components/
  ProjectsForm.tsx    // the form UI (shown in code)
lib/
  actions/projects.ts // server actions for CRUD
  validations.ts      // Zod schema for project data
```

---

### ✅ Projects Feature Checklist (My Review)

* [x] Create project with validation
* [x] List, filter, and sort projects
* [x] Edit existing project
* [x] Session‑protected routes
* [x] All project data scoped to user
* [ ] Soft‑delete + archive option
* [ ] Cascade delete time logs (future)

---

## 📌 What I Plan to Improve

* [ ] **Progress tracking**: auto‑update status based on tasks/time logs
* [ ] **Budget alerts**: notify when spending exceeds budget
* [ ] **Gantt view**: visualize start & deadline dates
* [ ] **Client reference**: replace raw `client` string with `client_id` link
