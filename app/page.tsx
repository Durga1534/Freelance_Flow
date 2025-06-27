"use client";
import {
  ArrowRight,
  LogIn,
  Users,
  FolderOpen,
  FileText,
  Clock,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

const FEATURES = [
  {
    name: "Client CRM",
    desc: "All your clients, contacts & notes in one searchable place.",
    icon: Users,
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    name: "Project Tracking",
    desc: "Track project status, deadlines & budgets with zero fuss.",
    icon: FolderOpen,
    color: "bg-green-500/10 text-green-600",
  },
  {
    name: "Smart Invoicing",
    desc: "Create one-off or recurring invoices and send them in seconds.",
    icon: FileText,
    color: "bg-purple-500/10 text-purple-600",
  },
  {
    name: "Time Tracking",
    desc: "Built-in timers & timesheets—bill every minute you work.",
    icon: Clock,
    color: "bg-orange-500/10 text-orange-600",
  },
  {
    name: "Business Insights",
    desc: "Revenue, overdue invoices, active projects—at-a-glance.",
    icon: TrendingUp,
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    name: "Secure & Cloud-Hosted",
    desc: "OAuth login & encrypted data at rest.",
    icon: ShieldCheck,
    color: "bg-teal-500/10 text-teal-600",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-background">
      {/*  HEADER */}
      <header className="w-full flex items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-foreground"
        >
          FreelanceFlow
        </Link>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-md border border-input px-4 py-2
                     text-foreground hover:bg-green-500 hover:text-white transition"
        >
          <LogIn className="h-4 w-4" />
          Dashboard
        </Link>
      </header>

      {/* HERO */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 pt-20 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
          Run your freelance business{" "}
          <span className="text-primary">without the chaos</span>
        </h1>

        <p className="mt-4 max-w-xl text-muted-foreground">
          FreelanceFlow unifies projects, invoices, and time&nbsp;tracking in one
          dashboard – so you can focus on great work, not paperwork.
        </p>

        <div className="mt-6 flex gap-4">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3
                       text-primary-foreground font-medium hover:bg-primary/90 transition"
          >
            Get started free <ArrowRight className="h-5 w-5" />
          </Link>

          <a
            href="#features"
            className="inline-flex items-center rounded-md px-6 py-3 border border-input
                       text-foreground hover:bg-muted transition"
          >
            Features
          </a>
        </div>

        {/* Screenshot */}
        <div className="mt-12 w-full max-w-5xl shadow-lg ring-1 ring-border rounded-xl overflow-hidden">
          <img
            src="/freelance_dashboard.png"
            alt="FreelanceFlow dashboard screenshot"
            className="w-full object-cover"
          />
        </div>
      </section>

      {/*  FEATURES  */}
      <section
        id="features"
        className="px-6 py-20 bg-muted flex flex-col items-center"
      >
        <h2 className="text-3xl font-bold text-foreground text-center">
          Everything you need to run your solo business
        </h2>
        <p className="mt-3 max-w-2xl text-center text-muted-foreground">
          Stop stitching together multiple tools—FreelanceFlow handles the
          boring stuff so you can focus on billable work.
        </p>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-5xl">
          {FEATURES.map(({ name, desc, icon: Icon, color }, i) => (
            <div
              key={name}
              className={`group animate-fade-up delay-[${i * 80}ms]`}
            >
              <div
                className="flex items-start gap-4 bg-white
                           text-card-foreground p-6 rounded-lg shadow-sm
                           border border-border
                           transition transform duration-300
                           group-hover:-translate-y-1 group-hover:scale-[1.03]"
              >
                <span
                  className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${color}`}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{name}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
