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
  Zap,
  Star,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const FEATURES = [
  {
    name: "Client CRM",
    desc: "All your clients, contacts & notes in one searchable, organized hub.",
    icon: Users,
    gradient: "from-blue-500 to-cyan-500",
    bg: "bg-blue-500/10",
  },
  {
    name: "Project Tracking",
    desc: "Track project status, deadlines & budgets with real-time progress.",
    icon: FolderOpen,
    gradient: "from-green-500 to-emerald-500",
    bg: "bg-green-500/10",
  },
  {
    name: "Smart Invoicing",
    desc: "Create one-off or recurring invoices and collect payments via Stripe.",
    icon: FileText,
    gradient: "from-purple-500 to-violet-500",
    bg: "bg-purple-500/10",
  },
  {
    name: "Time Tracking",
    desc: "Built-in timers & timesheets so you never miss a billable minute.",
    icon: Clock,
    gradient: "from-orange-500 to-amber-500",
    bg: "bg-orange-500/10",
  },
  {
    name: "Business Insights",
    desc: "Live revenue charts, overdue invoices & active projects at a glance.",
    icon: TrendingUp,
    gradient: "from-pink-500 to-rose-500",
    bg: "bg-pink-500/10",
  },
  {
    name: "Secure & Cloud",
    desc: "OAuth login, encrypted data at rest, and 99.9% uptime guaranteed.",
    icon: ShieldCheck,
    gradient: "from-teal-500 to-cyan-600",
    bg: "bg-teal-500/10",
  },
];

const STATS = [
  { value: "500+", label: "Freelancers" },
  { value: "$2M+", label: "Invoiced" },
  { value: "4.9★", label: "Rating" },
  { value: "10x", label: "Faster billing" },
];

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-background overflow-hidden">
      {/* ─── HEADER ─── */}
      <header className="w-full flex items-center justify-between px-6 py-4 border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">FreelanceFlow</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#stats" className="hover:text-foreground transition-colors">About</a>
        </nav>

        <Link
          href="/register"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2
                     text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all
                     shadow-lg shadow-primary/20 hover:shadow-primary/40"
        >
          Get started <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      {/* ─── HERO ─── */}
      <section className="relative flex flex-1 flex-col items-center justify-center px-6 pt-24 pb-16 text-center">
        {/* Animated gradient orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-orb hero-orb-3" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-4 py-1.5 text-sm text-muted-foreground mb-6 backdrop-blur animate-fade-in">
          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
          Built for modern freelancers
        </div>

        <h1 className="relative text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground max-w-4xl leading-[1.08] animate-fade-up">
          Run your freelance{" "}
          <span className="gradient-text">
            without the chaos
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-muted-foreground animate-fade-up animation-delay-100">
          FreelanceFlow unifies clients, projects, invoices, and time&nbsp;tracking
          in one powerful dashboard — so you can focus on great work, not paperwork.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 animate-fade-up animation-delay-200">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5
                       text-primary-foreground font-semibold hover:bg-primary/90 transition-all
                       shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5"
          >
            Get started free <ArrowRight className="h-5 w-5" />
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3.5
                       border border-border text-foreground font-semibold hover:bg-muted transition-all
                       hover:-translate-y-0.5"
          >
            <LogIn className="h-4 w-4" /> View Dashboard
          </Link>
        </div>

        {/* Stats bar */}
        <div id="stats" className="mt-14 flex flex-wrap justify-center gap-8 sm:gap-12 animate-fade-up animation-delay-300">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-2xl font-bold text-foreground">{value}</div>
              <div className="text-sm text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>

        {/* Dashboard screenshot */}
        <div className="mt-16 w-full max-w-5xl animate-fade-up animation-delay-400 relative">
          {/* Glow behind screenshot */}
          <div className="absolute -inset-4 bg-primary/10 blur-3xl rounded-3xl" />
          <div className="relative shadow-2xl ring-1 ring-border rounded-2xl overflow-hidden">
            <Image
              src="/freelance_dashboard.png"
              alt="FreelanceFlow dashboard screenshot"
              width={1200}
              height={700}
              className="w-full object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="px-6 py-24 flex flex-col items-center bg-muted/30">
        <div className="text-center max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-4 py-1.5 text-sm text-muted-foreground mb-4">
            <Zap className="h-3.5 w-3.5 text-primary" /> All-in-one platform
          </div>
          <h2 className="text-4xl font-bold text-foreground">
            Everything you need to run your solo business
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Stop stitching together multiple tools — FreelanceFlow handles the
            boring stuff so you can focus on billable work.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full max-w-5xl">
          {FEATURES.map(({ name, desc, icon: Icon, gradient, bg }) => (
            <div
              key={name}
              className="group relative bg-card border border-border rounded-2xl p-6 hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 cursor-default overflow-hidden"
            >
              {/* Subtle gradient shimmer on hover */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 bg-gradient-to-br ${gradient} transition-opacity duration-300 rounded-2xl`} />

              <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${bg} mb-4`}>
                <div className={`bg-gradient-to-br ${gradient} rounded-lg p-1.5`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>

              <h3 className="text-base font-semibold text-card-foreground">{name}</h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA BANNER ─── */}
      <section className="px-6 py-20 flex flex-col items-center text-center bg-background">
        <div className="relative max-w-3xl w-full rounded-3xl overflow-hidden border border-border bg-card p-12 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to level up your freelance business?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join 500+ freelancers who already use FreelanceFlow to manage their work.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5
                         text-primary-foreground font-semibold hover:bg-primary/90 transition-all
                         shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5"
            >
              Start for free <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="px-6 py-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-5 w-5 rounded bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Zap className="h-3 w-3 text-primary-foreground" />
          </div>
          <span>FreelanceFlow — Built with Next.js 15, Appwrite & Stripe</span>
        </div>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} FreelanceFlow. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
