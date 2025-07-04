# 💸 Invoices Module (How I Built It)

This doc explains how the **Invoices** feature works in **FreelanceFlow**. Each invoice is tied to a **client**, contains multiple **items**, and connects to **Stripe** for payment. Data lives in two collections: `invoices` and `invoice_items` in **Appwrite**.

```
User ─► Client ─► Invoice ─► Items
                     └─► Stripe Checkout (optional)
```

---

## 🧩 Basic Overview

* **Collection:** `invoices`
* **Sub‑collection:** `invoice_items` (linked via `invoice_id`)
* Each invoice stores metadata (number, dates, subtotal, tax, discount, total, status) plus references to the issuing business and the client.

---

## ⚙️ Tech Used

| Feature            | What I Used                                  |
| ------------------ | -------------------------------------------- |
| Database           | Appwrite Collections                         |
| Form Handling      | React Hook Form + shadcn/ui                  |
| Validation         | Zod (schema in form & backend)               |
| Calculations       | Custom hooks / `useWatch` for live totals    |
| Currency / Dates   | `date-fns` + simple currency rounding        |
| Optimistic Updates | TanStack Query (`useMutation`, `invalidate`) |
| Payment (optional) | Stripe Checkout (future)—not in MVP          |

---

## 🔄 Flow Breakdown

### 📝 1. Creating an Invoice (`/invoices/new`)

* **Select Client** → loads client data from `clients` collection.
* **Add Items** → dynamically add/remove rows (`id`, `description`, `quantity`, `rate`).
* **Auto‑calculate** `subtotal`, `discount_amount`, `tax_amount`, `total_amount` via `useEffect` watching form state.

```ts
const newInvoice = await databases.createDocument(
  DB_ID,
  'invoices',
  ID.unique(),
  {
    ...invoiceDataWithoutItems,
    user_id: user.$id,
  }
);

await Promise.all(items.map((itm, idx) =>
  databases.createDocument(DB_ID, 'invoice_items', ID.unique(), {
    invoice_id: newInvoice.$id,
    description: itm.description,
    quantity: itm.quantity,
    unit_price: itm.rate,
    total_price: itm.amount,
    item_order: idx + 1,
  })
));
```

* **Status** defaults to `draft`. Can later be set to `sent`, `paid`, or `overdue`.

---

### 📋 2. Listing Invoices (`/invoices`)

* Filter by `status` or `client`.
* Search by `invoice_number`.
* Displays `total_amount`, `paid_amount`, and due status.

---

### ✏️ 3. Editing an Invoice (`/invoices/[id]/edit`)

* Not allowed once `status == paid` (business rule).
* Otherwise re‑uses same form schema with pre‑filled values.

---

### 💳 4. Marking as Paid / Stripe Checkout *(future)*

* Clicking **Send Invoice** triggers Stripe Checkout generation (future doc).
* On webhook success → update `status` to `paid` and `paid_amount`.

---

## 🌐 Why I Chose This Design

| Need                         | Solution                                         |
| ---------------------------- | ------------------------------------------------ |
| Multiple items per invoice   | Separate `invoice_items` collection              |
| Accurate totals              | Recalc on every field change using `useWatch`    |
| Recurring invoices (future)  | `is_recurring`, `recurring_interval`, `end_date` |
| Easy integration with Stripe | Store amounts in cents (rounded)                 |

---

## 🔒 Security Details

| Security Feature   | Implementation                                      |
| ------------------ | --------------------------------------------------- |
| RLS                | `user_id == currentUserId` rule on both collections |
| Immutable paid inv | Disallow updates on `status === 'paid'`             |
| Server validation  | Zod re‑checking on server actions before write      |

---

## 📁 Files Related to Invoices

```
app/
  (dashboard)/
    invoices/
      page.tsx          // list & filter invoices
      new/page.tsx      // create invoice form
      [id]/edit.tsx     // edit invoice unless paid
components/
  InvoiceForm.tsx       // the huge form UI (in code snippet)
lib/
  actions/invoices.ts   // server actions for CRUD
  validations.ts        // Zod schema for invoice + items
  stripe.ts             // (future) Stripe server helpers
```

---

### ✅ Invoices Feature Checklist

* [x] Create invoice with multiple items
* [x] Auto‑calculations & currency rounding
* [x] List, filter, and search invoices
* [x] Session‑protected & data scoped to user
* [ ] Stripe checkout
* [ ] PDF export / email send

---

## 📌 Improvements Planned

* [ ] Attach PDF invoice + email send
* [ ] Stripe Checkout & webhooks for status updates
* [ ] Recurring invoices engine
* [ ] Attach files (purchase orders, receipts)
