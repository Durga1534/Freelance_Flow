"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  FolderOpen,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import db from "@/lib/dbOperations";
import { account } from "@/lib/appwrite";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

interface StatItem {
  name: string;
  value: string | number;
  change: string;
  changeType: "increase" | "decrease";
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const CHART_COLORS = ["#D8B4FE", "#FCA5A5", "#6EE7B7", "#FCD34D", "#93C5FD"];

export default function DashboardPage() {
  const [stats, setStats] = useState<StatItem[]>([]);
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number; invoices: number }[]>([]);
  const [projectStatusData, setProjectStatusData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [invoiceStatusData, setInvoiceStatusData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; revenue: number; invoices: number; projects: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchStats = async () => {
      const session = await account.get();
      const userId = session?.$id;

      try {
        setLoading(true);
        setError(null);

        const [clientsRes, projectsRes, invoicesRes] = await Promise.all([
          db.clients.getAll(userId),
          db.projects.getAll(userId),
          db.invoices.getAll(userId),
        ]);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const invoices = invoicesRes.documents || [];
        const projects = projectsRes.documents || [];
        const clients = clientsRes.documents || [];

        const paidInvoicesThisMonth = invoices.filter((inv: Record<string, unknown>) => {
          const invoiceDate = new Date((inv.date || inv.created_at || inv.$createdAt) as string);
          return (
            (inv.status === "paid" || inv.status === "Paid") &&
            invoiceDate >= startOfMonth &&
            invoiceDate <= endOfMonth
          );
        });

        const totalRevenue = paidInvoicesThisMonth.reduce((sum: number, inv: Record<string, unknown>) => {
          const amount = inv.paid_amount || inv.total_amount || 0;
          return sum + (typeof amount === "string" ? parseFloat(amount) : (amount as number));
        }, 0);

        const activeProjects = projects.filter((p: Record<string, unknown>) =>
          p.status === "progress" || p.status === "Progress"
        );

        const pendingInvoices = invoices.filter((inv: Record<string, unknown>) =>
          inv.status === "pending" || inv.status === "Pending" || inv.status === "draft"
        );

        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        const paidInvoicesLastMonth = invoices.filter((inv: Record<string, unknown>) => {
          const invoiceDate = new Date((inv.date || inv.created_at || inv.$createdAt) as string);
          return (
            (inv.status === "paid" || inv.status === "Paid") &&
            invoiceDate >= startOfLastMonth &&
            invoiceDate <= endOfLastMonth
          );
        });

        const lastMonthRevenue = paidInvoicesLastMonth.reduce((sum: number, inv: Record<string, unknown>) => {
          const amount = inv.paid_amount || inv.total_amount || 0;
          return sum + (typeof amount === "string" ? parseFloat(amount) : (amount as number));
        }, 0);

        const revenueChange =
          lastMonthRevenue > 0
            ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
            : "0";

        const statsData: StatItem[] = [
          {
            name: "Total Clients",
            value: clients.length,
            change: "+2",
            changeType: "increase",
            icon: Users,
            color: "text-blue-600",
            bgColor: "bg-blue-50 dark:bg-blue-950",
          },
          {
            name: "Active Projects",
            value: activeProjects.length,
            change: "+1",
            changeType: "increase",
            icon: FolderOpen,
            color: "text-green-600",
            bgColor: "bg-green-50 dark:bg-green-950",
          },
          {
            name: "Pending Invoices",
            value: pendingInvoices.length,
            change: pendingInvoices.length > 3 ? "+2" : "-1",
            changeType: pendingInvoices.length > 3 ? "increase" : "decrease",
            icon: FileText,
            color: "text-orange-600",
            bgColor: "bg-orange-50 dark:bg-orange-950",
          },
          {
            name: "Monthly Revenue",
            value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            change: `${parseFloat(revenueChange) >= 0 ? "+" : ""}${revenueChange}%`,
            changeType: parseFloat(revenueChange) >= 0 ? "increase" : "decrease",
            icon: DollarSign,
            color: "text-purple-600",
            bgColor: "bg-purple-50 dark:bg-purple-950",
          },
        ];

        setStats(statsData);

        // Revenue trend for last 6 months (real computed data, no Math.random)
        const last6Months = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
          const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

          const monthlyRevenue = invoices
            .filter((inv: Record<string, unknown>) => {
              const invoiceDate = new Date((inv.date || inv.created_at || inv.$createdAt) as string);
              return (
                (inv.status === "paid" || inv.status === "Paid") &&
                invoiceDate >= monthStart &&
                invoiceDate <= monthEnd
              );
            })
            .reduce((sum: number, inv: Record<string, unknown>) => {
              const amount = inv.paid_amount || inv.total_amount || 0;
              return sum + (typeof amount === "string" ? parseFloat(amount) : (amount as number));
            }, 0);

          const monthInvoiceCount = invoices.filter((inv: Record<string, unknown>) => {
            const invoiceDate = new Date((inv.date || inv.created_at || inv.$createdAt) as string);
            return invoiceDate >= monthStart && invoiceDate <= monthEnd;
          }).length;

          last6Months.push({
            month: date.toLocaleDateString("en-US", { month: "short" }),
            revenue: monthlyRevenue,
            invoices: monthInvoiceCount,
          });
        }
        setRevenueData(last6Months);

        // Project status distribution
        const statusCounts = projects.reduce((acc: Record<string, number>, project: Record<string, unknown>) => {
          const status = (project.status as string) || "unknown";
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        setProjectStatusData(
          Object.entries(statusCounts).map(([status, count], index) => ({
            name: status.charAt(0).toUpperCase() + status.slice(1),
            value: count,
            color: CHART_COLORS[index % CHART_COLORS.length],
          }))
        );

        // Invoice status distribution
        const invoiceStatusCounts = invoices.reduce((acc: Record<string, number>, invoice: Record<string, unknown>) => {
          const status = (invoice.status as string) || "unknown";
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        setInvoiceStatusData(
          Object.entries(invoiceStatusCounts).map(([status, count], index) => ({
            name: status.charAt(0).toUpperCase() + status.slice(1),
            value: count,
            color: CHART_COLORS[index % CHART_COLORS.length],
          }))
        );

        // Monthly overview — real project counts by created date
        const monthlyOverview = last6Months.map((month, i) => {
          const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
          const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
          const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

          const monthProjects = projects.filter((p: Record<string, unknown>) => {
            const created = new Date((p.$createdAt) as string);
            return created >= monthStart && created <= monthEnd;
          }).length;

          const monthClients = clients.filter((c: Record<string, unknown>) => {
            const created = new Date((c.$createdAt) as string);
            return created >= monthStart && created <= monthEnd;
          }).length;

          return {
            ...month,
            projects: monthProjects,
            clients: monthClients,
          };
        });
        setMonthlyData(monthlyOverview);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-destructive">Error</h3>
              <p className="mt-2 text-sm text-destructive/80">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-background min-h-screen">
      {/* Header */}
      <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-card-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Welcome back! Here&apos;s what&apos;s happening with your business.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-card rounded-lg border border-border p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
          >
            <div className="flex items-center">
              <div className={classNames(stat.bgColor, "p-3 rounded-lg")}>
                <stat.icon className={classNames(stat.color, "h-6 w-6")} />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                <p className="text-2xl font-semibold text-card-foreground mt-1">{stat.value}</p>
                <div className="flex items-center mt-2">
                  {stat.changeType === "increase" ? (
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                  )}
                  <span
                    className={classNames(
                      stat.changeType === "increase" ? "text-green-600" : "text-red-600",
                      "text-sm font-medium"
                    )}
                  >
                    {stat.change}
                  </span>
                  <span className="text-muted-foreground text-sm ml-1">from last month</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-card-foreground">Revenue Trend</h3>
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" stroke="var(--color-muted-foreground)" />
              <YAxis stroke="var(--color-muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  color: "var(--color-card-foreground)",
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={CHART_COLORS[0]}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Project Status Distribution */}
        <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">Project Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={projectStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: { name: string; percent: number }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                dataKey="value"
              >
                {projectStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  color: "var(--color-card-foreground)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Overview */}
        <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">Monthly Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" stroke="var(--color-muted-foreground)" />
              <YAxis stroke="var(--color-muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  color: "var(--color-card-foreground)",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="invoices"
                stroke={CHART_COLORS[1]}
                strokeWidth={2}
                name="Invoices"
                dot={{ fill: CHART_COLORS[1], strokeWidth: 2, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="projects"
                stroke={CHART_COLORS[2]}
                strokeWidth={2}
                name="Projects"
                dot={{ fill: CHART_COLORS[2], strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Invoice Status Distribution */}
        <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">Invoice Status</h3>
          {invoiceStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={invoiceStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    color: "var(--color-card-foreground)",
                  }}
                />
                <Bar dataKey="value" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]}>
                  {invoiceStatusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
                <p>No invoice data available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            className="flex items-center p-4 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors duration-200"
            onClick={() => router.push("/clients/new")}
          >
            <Users className="h-8 w-8 text-blue-600 mr-3" />
            <div className="text-left">
              <p className="font-medium text-blue-900 dark:text-blue-100">Add Client</p>
              <p className="text-sm text-blue-600 dark:text-blue-400">Create new client</p>
            </div>
          </button>
          <button
            className="flex items-center p-4 bg-green-50 dark:bg-green-950/50 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-lg transition-colors duration-200"
            onClick={() => router.push("/projects/new")}
          >
            <FolderOpen className="h-8 w-8 text-green-600 mr-3" />
            <div className="text-left">
              <p className="font-medium text-green-900 dark:text-green-100">New Project</p>
              <p className="text-sm text-green-600 dark:text-green-400">Start new project</p>
            </div>
          </button>
          <button
            className="flex items-center p-4 bg-orange-50 dark:bg-orange-950/50 hover:bg-orange-100 dark:hover:bg-orange-900/50 rounded-lg transition-colors duration-200"
            onClick={() => router.push("/invoices/new")}
          >
            <FileText className="h-8 w-8 text-orange-600 mr-3" />
            <div className="text-left">
              <p className="font-medium text-orange-900 dark:text-orange-100">Create Invoice</p>
              <p className="text-sm text-orange-600 dark:text-orange-400">Generate invoice</p>
            </div>
          </button>
          <button
            className="flex items-center p-4 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg transition-colors duration-200"
            onClick={() => router.push("/dashboard")}
          >
            <DollarSign className="h-8 w-8 text-purple-600 mr-3" />
            <div className="text-left">
              <p className="font-medium text-purple-900 dark:text-purple-100">View Reports</p>
              <p className="text-sm text-purple-600 dark:text-purple-400">Financial reports</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
