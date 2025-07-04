# 👥 Clients Module (How I Built It)

This doc explains how the **Clients** feature works in **FreelanceFlow**, the SaaS I built to manage freelance projects. I used **Appwrite** for data and **Next.js App Router** for UI and routing. Each client is linked to the logged-in user and can have multiple associated projects and invoices.

```
User ─► Clients ─► Projects + Invoices
```

---

## 🧩 Basic Overview

Each client is stored in the **clients** collection in Appwrite. When a user logs in, they can view, create, edit, or delete their own clients only. All actions are scoped to their session using `user.$id`.

---

## ⚙️ Tech Used

| Feature           | What I Used                     |
| ----------------- | ------------------------------- |
| Database          | Appwrite Collections            |
| Routing framework | Next.js App Router (v15)        |
| Forms             | React Hook Form + shadcn/ui     |
| Validation        | Zod (frontend + backend)        |
| UI Feedback       | Toast + Button/Modal components |

---

## 🔄 Flow Breakdown

### 📄 1. Creating a Client (`/clients/new`)

* Inputs: `name`, `email`, `phone`, `company`, `notes`
* Client-side validation:

  * Name required
  * Email format checked
  * Optional fields trimmed
* Submit action:

```ts
await databases.createDocument(
  DB_ID,
  'clients',
  ID.unique(),
  {
    name,
    email,
    phone,
    company,
    notes,
    user_id: user.$id
  }
)
```

* On success: redirect to `/clients`, show toast "Client created"

---

### 📋 2. Listing Clients (`/clients`)

* Query only current user’s clients:

```ts
await databases.listDocuments(
  DB_ID,
  'clients',
  [Query.equal('user_id', user.$id)]
)
```

* Show in a clean card/table UI with basic info
* Sort by name or recent creation

---

### 🛠️ 3. Editing a Client (`/clients/[id]/edit`)

* Pre-fill the form with current data
* Validate fields again
* Submit using:

```ts
await databases.updateDocument(
  DB_ID,
  'clients',
  clientId,
  { name, email, ... }
)
```

* Show toast "Client updated" and redirect to `/clients`

---

### 🗑️ 4. Deleting a Client

* Prompt with modal confirmation
* Cascade delete not automatic (manual deletion of related projects/invoices to be handled)

```ts
await databases.deleteDocument(DB_ID, 'clients', clientId)
```

* Show toast "Client removed"

---

## 🌐 Why I Chose This Design

| Need                     | How I Solved It                       |
| ------------------------ | ------------------------------------- |
| Link clients to users    | Stored `user_id` with every client    |
| Secure multi-user system | Filtered queries with `Query.equal()` |
| Quick CRUD UI            | Used shadcn/ui + React Hook Form      |
| Editable in future       | Routes and forms are modular          |

---

## 🔒 Security Details

| Security Feature  | What I Did                                  |
| ----------------- | ------------------------------------------- |
| Client isolation  | Only fetch/update where `user_id == $id`    |
| RLS enabled       | Appwrite rules block access to others' data |
| Server validation | Checked inputs with Zod before submitting   |

---

## 📁 Files Related to Clients

```
app/
  (dashboard)/
    clients/
      page.tsx       // list clients
      new/page.tsx   // create client
      [id]/edit.tsx  // update client
lib/
  appwrite.ts         // Appwrite client config
  validations.ts      // Zod schema for client data
```

---

### ✅ Clients Feature Checklist (My Own Review)

* [x] Can create new client
* [x] Can update existing client
* [x] All routes are session-protected
* [x] Data scoped to user
* [x] Validated with Zod
* [ ] Deletion handles orphaned data (needs improvement)

---

## 📌 What I Plan to Improve

* [ ] Soft-delete instead of hard delete
* [ ] Merge duplicate client entries
* [ ] Link to recent activity per client
* [ ] Project summary per client on list page
