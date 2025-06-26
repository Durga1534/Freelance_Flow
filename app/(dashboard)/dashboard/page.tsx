"use client";

import { useEffect, useState } from "react";
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
  LineChart,
  Line,
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
  icon: any;
  color: string;
  bgColor: string;
  paidInvoices?: any[];
}

const getCSSColor = (property: string): string => {
  if (typeof window === "undefined") return "#8B5CF6";
  
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(property)
    .trim();
  
  if (value.startsWith('oklch(')) {
    const colorMap: { [key: string]: string } = {
      "--chart-1": "#D8B4FE",
      "--chart-2": "#FCA5A5",
      "--chart-3": "#6EE7B7",
      "--chart-4": "#FCD34D",
      "--chart-5": "#93C5FD",

    };
    return colorMap[property] || '#D8B4FE';
  }
  
  return value || '#D8B4FE';
};

export default function DashboardPage() {
  const [stats, setStats] = useState<StatItem[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [projectStatusData, setProjectStatusData] = useState<any[]>([]);
  const [invoiceStatusData, setInvoiceStatusData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [chartColors, setChartColors] = useState<string[]>([]);

  useEffect(() => {
    const COLORS = [
      "#D8B4FE", 
      "#FCA5A5",
      "#6EE7B7", 
      "#FCD34D", 
      "#93C5FD",
    ];

    setChartColors(COLORS);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      const session = await account.get();
      const userId = session?.$id;

      try {
        setLoading(true);
        setError(null);

        // Fetch all data concurrently
        const [clientsRes, projectsRes, invoicesRes] = await Promise.all([
          db.clients.getAll(userId),
          db.projects.getAll(userId),
          db.invoices.getAll(userId),
        ]);

        console.log("Fetched data:", { clientsRes, projectsRes, invoicesRes });

        // Calculate current month date range
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Process invoices data
        const invoices = invoicesRes.documents || [];
        const projects = projectsRes.documents || [];
        
        // Filter paid invoices for current month
        const paidInvoicesThisMonth = invoices.filter((inv: any) => {
          const invoiceDate = new Date(inv.date || inv.created_at || inv.$createdAt);
          return (
            (inv.status === "paid" || inv.status === "Paid") &&
            invoiceDate >= startOfMonth &&
            invoiceDate <= endOfMonth
          );
        });

        // Calculate total revenue from paid invoices this month
        const totalRevenue = paidInvoicesThisMonth.reduce((sum: number, inv: any) => {
          const amount = inv.amount || inv.total || inv.totalAmount || 0;
          return sum + (typeof amount === 'string' ? parseFloat(amount) : amount);
        }, 0);

        // Count active projects
        const activeProjects = projects.filter((p: any) => 
          p.status === "progress" || p.status === "Progress"
        );

        // Count pending invoices
        const pendingInvoices = invoices.filter((inv: any) => 
          inv.status === "pending" || inv.status === "Pending" || inv.status === "draft"
        );

        // Previous month calculations for change percentage
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        
        const paidInvoicesLastMonth = invoices.filter((inv: any) => {
          const invoiceDate = new Date(inv.date || inv.created_at || inv.$createdAt);
          return (
            (inv.status === "paid" || inv.status === "Paid") &&
            invoiceDate >= startOfLastMonth &&
            invoiceDate <= endOfLastMonth
          );
        });

        const lastMonthRevenue = paidInvoicesLastMonth.reduce((sum: number, inv: any) => {
          const amount = inv.amount || inv.total || inv.totalAmount || 0;
          return sum + (typeof amount === 'string' ? parseFloat(amount) : amount);
        }, 0);

        // Calculate revenue change percentage
        const revenueChange = lastMonthRevenue > 0 
          ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
          : "0";

        // Build stats array
        const statsData: StatItem[] = [
          {
            name: "Total Clients",
            value: clientsRes.total || clientsRes.documents?.length || 0,
            change: "+2",
            changeType: "increase",
            icon: Users,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
          },
          {
            name: "Active Projects",
            value: activeProjects.length,
            change: "+1",
            changeType: "increase",
            icon: FolderOpen,
            color: "text-green-600",
            bgColor: "bg-green-50",
          },
          {
            name: "Pending Invoices",
            value: pendingInvoices.length,
            change: pendingInvoices.length > 3 ? "+2" : "-1",
            changeType: pendingInvoices.length > 3 ? "increase" : "decrease",
            icon: FileText,
            color: "text-orange-600",
            bgColor: "bg-orange-50",
          },
          {
            name: "Monthly Revenue",
            value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            change: `${parseFloat(revenueChange) >= 0 ? '+' : ''}${revenueChange}%`,
            changeType: parseFloat(revenueChange) >= 0 ? "increase" : "decrease",
            icon: DollarSign,
            color: "text-purple-600",
            bgColor: "bg-purple-50",
            paidInvoices: paidInvoicesThisMonth.map((inv: any) => ({
              $id: inv.$id,
              clientName: inv.clientName || inv.client?.name || "Unnamed Client",
              amount: typeof inv.amount === "string" ? parseFloat(inv.amount) : (inv.amount || inv.total || inv.totalAmount || 0),
              date: inv.date || inv.$createdAt,
            })),
          },
        ];

        setStats(statsData);
        
        // 1. Revenue trend for last 6 months
        const last6Months = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
          const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
          
          const monthlyRevenue = invoices
            .filter((inv: any) => {
              const invoiceDate = new Date(inv.date || inv.created_at || inv.$createdAt);
              return (
                (inv.status === "paid" || inv.status === "Paid") &&
                invoiceDate >= monthStart &&
                invoiceDate <= monthEnd
              );
            })
            .reduce((sum: number, inv: any) => {
              const amount = inv.amount || inv.total || inv.totalAmount || 0;
              return sum + (typeof amount === 'string' ? parseFloat(amount) : amount);
            }, 0);

          last6Months.push({
            month: date.toLocaleDateString('en-US', { month: 'short' }),
            revenue: monthlyRevenue,
            invoices: invoices.filter((inv: any) => {
              const invoiceDate = new Date(inv.date || inv.created_at || inv.$createdAt);
              return invoiceDate >= monthStart && invoiceDate <= monthEnd;
            }).length,
          });
        }
        setRevenueData(last6Months);

        // 2. Project status distribution
        const statusCounts = projects.reduce((acc: any, project: any) => {
          const status = project.status || 'unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        const projectStatusChart = Object.entries(statusCounts).map(([status, count], index) => ({
          name: status.charAt(0).toUpperCase() + status.slice(1),
          value: count,
          color: chartColors[index % chartColors.length] || '#8B5CF6',
        }));
        setProjectStatusData(projectStatusChart);

        // 3. Invoice status distribution - FIXED
        const invoiceStatusCounts = invoices.reduce((acc: any, invoice: any) => {
          const status = invoice.status || 'unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        console.log("Invoice status counts:", invoiceStatusCounts); // Debug log

        const invoiceStatusChart = Object.entries(invoiceStatusCounts).map(([status, count], index) => ({
          name: status.charAt(0).toUpperCase() + status.slice(1),
          value: count,
          color: chartColors[index % chartColors.length] || '#8B5CF6',
        }));
        
        console.log("Invoice status chart data:", invoiceStatusChart); // Debug log
        setInvoiceStatusData(invoiceStatusChart);

        // 4. Monthly overview combining multiple metrics
        const monthlyOverview = last6Months.map(month => ({
          ...month,
          clients: Math.floor(Math.random() * 5) + (clientsRes.total || 10), // Simulated growth
          projects: Math.floor(Math.random() * 3) + activeProjects.length,
        }));
        setMonthlyData(monthlyOverview);

      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [chartColors]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Welcome back! Here&apos;s what&apos;s happening with your business.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>{new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          if (stat.name === "Monthly Revenue") {
            return (
              <div
                key={stat.name}
                className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 col-span-1 lg:col-span-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={classNames(stat.bgColor, "p-3 rounded-lg")}>
                      <stat.icon className={classNames(stat.color, "h-6 w-6")} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                      <p className="text-2xl font-semibold text-gray-900 mt-1">
                        {stat.value}
                      </p>
                      <div className="flex items-center mt-2">
                        {stat.changeType === "increase" ? (
                          <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                        )}
                        <span
                          className={classNames(
                            stat.changeType === "increase"
                              ? "text-green-600"
                              : "text-red-600",
                            "text-sm font-medium"
                          )}
                        >
                          {stat.change}
                        </span>
                        <span className="text-gray-500 text-sm ml-1">
                          from last month
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Show paid invoices list */}
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Recent Paid Invoices
                  </h4>
                  {stat.paidInvoices?.length > 0 ? (
                    <ul className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                      {stat.paidInvoices.map((inv: any) => (
                        <li
                          key={inv.$id}
                          className="flex justify-between items-center text-sm text-gray-600"
                        >
                          <span>
                            {inv.clientName || "Unnamed Client"}
                            <span className="ml-2 text-xs text-gray-400">
                              ({new Date(inv.date || inv.$createdAt).toLocaleDateString()})
                            </span>
                          </span>
                          <span className="font-medium text-gray-800">
                            ${inv.amount?.toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No paid invoices yet.</p>
                  )}
                </div>
              </div>
            );
          }

          // Keep other cards as-is
          return (
            <div
              key={stat.name}
              className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
            >
              <div className="flex items-center">
                <div className={classNames(stat.bgColor, "p-3 rounded-lg")}>
                  <stat.icon className={classNames(stat.color, "h-6 w-6")} />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                  <div className="flex items-center mt-2">
                    {stat.changeType === "increase" ? (
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                    )}
                    <span
                      className={classNames(
                        stat.changeType === "increase"
                          ? "text-green-600"
                          : "text-red-600",
                        "text-sm font-medium"
                      )}
                    >
                      {stat.change}
                    </span>
                    <span className="text-gray-500 text-sm ml-1">from last month</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue Trend Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColors[0]} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={chartColors[0]} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value: any) => [`$${value.toLocaleString()}`, 'Revenue']}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke={chartColors[0]} 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Project Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={projectStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8B5CF6"
                dataKey="value"
              >
                {projectStatusData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={chartColors[index % chartColors.length]} 
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Overview */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="invoices" 
                stroke={chartColors[1]}
                strokeWidth={2} 
                name="Invoices"
                dot={{ fill: chartColors[1], strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="projects" 
                stroke={chartColors[2]} 
                strokeWidth={2} 
                name="Projects"
                dot={{ fill: chartColors[2], strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Invoice Status Distribution - FIXED */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Status</h3>
          {invoiceStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={invoiceStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="value" 
                  fill={chartColors[0]} 
                  radius={[4, 4, 0, 0]}
                >
                  {invoiceStatusData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={chartColors[index % chartColors.length]} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No invoice data available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200">
            <Users className="h-8 w-8 text-blue-600 mr-3" />
            <div className="text-left">
              <p className="font-medium text-blue-900">Add Client</p>
              <p className="text-sm text-blue-600">Create new client</p>
            </div>
          </button>
          <button className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200">
            <FolderOpen className="h-8 w-8 text-green-600 mr-3" />
            <div className="text-left">
              <p className="font-medium text-green-900">New Project</p>
              <p className="text-sm text-green-600">Start new project</p>
            </div>
          </button>
          <button className="flex items-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors duration-200">
            <FileText className="h-8 w-8 text-orange-600 mr-3" />
            <div className="text-left">
              <p className="font-medium text-orange-900">Create Invoice</p>
              <p className="text-sm text-orange-600">Generate invoice</p>
            </div>
          </button>
          <button className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200">
            <DollarSign className="h-8 w-8 text-purple-600 mr-3" />
            <div className="text-left">
              <p className="font-medium text-purple-900">View Reports</p>
              <p className="text-sm text-purple-600">Financial reports</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}