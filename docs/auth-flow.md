# 🔐 Authentication Flow (How I Built It)

This doc explains how user authentication works in **FreelanceFlow** the SaaS I built to manage freelance projects, I used **Appwrite** for auth and **Next.js App Router** for routing. All dashboard routes are server‑protected.

```
/ (public) ─► /login  ─► ✅ if session → /dashboard  
                        └► ❌ if no session → stay on /login
```

---

## 🧩 Basic Overview

I'm using **Appwrite Auth** for both normal email/password login and Google sign-in. The dashboard is fully protected—users get redirected to `/login` if they’re not logged in.

---

## ⚙️ Tech Used

| Feature           | What I Used                           |
| ----------------- | ------------------------------------- |
| Auth system       | Appwrite (`account.create`, sessions) |
| Routing framework | Next.js App Router (v15)              |
| Forms             | React Hook Form + shadcn/ui inputs    |
| Validation        | Zod (backend) + regex (frontend)      |
| UI Feedback       | lucide-react icons (`Loader2`, etc.)  |

---

## 🔄 Flow Breakdown

### 🧾 1. Register Flow (`/register`)

* I take `email`, `password`, and `confirm password`.
* Validate on client:

  * Email format
  * Password strength (≥8 chars, uppercase, lowercase, number)
  * Passwords must match
* Create user using Appwrite:

  ```ts
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  await account.create(userId, email, password)
  ```
* If successful → show success message → redirect to `/login`
* Handle errors like:

  * `409`: email already exists
  * `400`: invalid format

👉 *I used custom IDs so I can test demo users more easily during development.*

---

### 🔐 2. Login Flow (`/login`)

* Clears any previous session first:

  ```ts
  await account.deleteSession('current')
  ```
* Then creates session:

  ```ts
  await account.createEmailPasswordSession(email, password)
  ```
* Redirects to `/dashboard` on success
* Handles errors like:

  * `401`: wrong credentials
  * `429`: too many tries
* Also supports:

  ```ts
  account.createOAuth2Session('google', successUrl, failureUrl)
  ```

---

### 🛡️ 3. Protecting Dashboard (`layout.tsx`)

Used in `app/(dashboard)/layout.tsx` to block unauthenticated users:

```ts
const user = await account.get().catch(() => null)
if (!user) redirect("/login")
```

This ensures the server checks before any dashboard content loads.

---

### 🔓 4. Logout

```ts
await account.deleteSession('current')
redirect('/login')
```

---

## 🌐 Why I chose Appwrite

| Need                        | Why Appwrite solved it                           |
|-----------------------------|--------------------------------------------------|
| Email & social logins       | SDK has email/password + OAuth in one package   |
| JWT sessions                | Server‑side validation without custom middleware |
| Free tier for MVP           | 100 K reqs/month – enough for launch            |
| Self‑host option            | Future flexibility if I outgrow the cloud plan  |

---

## 🔒 Security Details

| Security Feature     | What I Did                                          |
| -------------------- | --------------------------------------------------- |
| `.env.local` secrets | Never pushed to GitHub, used Vercel env vars        |
| Appwrite sessions    | Cookies are HTTP-only, managed for me               |
| Rate limiting        | Appwrite handles brute force automatically          |
| Client-side checks   | UX-friendly, but backend still re-checks everything |
| Fresh login always   | I delete old sessions to avoid weird login issues   |

---

## 📌 What I Plan to Improve

* [ ] Magic Link login (Appwrite supports this)
* [ ] Add more social login options (GitHub, LinkedIn)
* [ ] MFA (2FA or OTP) — for better security
* [ ] User profile edit – avatar & name (working on it)

---

## 📁 Files Related to Auth

```
lib/
  appwrite.ts             // Appwrite client setup
app/
  (auth)/
    login/page.tsx        // email & Google login form
    register/page.tsx     // registration + password rules
  (dashboard)/
    layout.tsx            // checks user session before loading pages
```

---

### ✅ Auth Test Checklist (My Own Review)

* [x] Tested email + password login manually
* [x] Google login flow works end-to-end
* [x] Secrets not committed (used `.env`)
* [ ] Still need to test what happens when same email tries to register again

