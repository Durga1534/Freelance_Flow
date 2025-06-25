"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  FileText,
  Clock,
  Settings,
  Menu,
  X,
  Bell,
  Search,
  User,
  LogOut,
} from "lucide-react";
import { account } from "@/lib/appwrite";
import { fetchUserProfile } from "@/lib/profile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { globalSearch } from "@/lib/globalSearch";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Projects", href: "/projects", icon: FolderOpen },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Time Tracking", href: "/time-tracking", icon: Clock },
  { name: "Settings", href: "/settings", icon: Settings },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const pathName = usePathname();
  const router = useRouter();
  const debounceTimeout = useRef(null);

  // Search effect with debouncing
  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }

    setSearchLoading(true);

    // Clear previous timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(async () => {
      try {
        const session = await account.get();
        const userId = session?.$id;

        const data = await globalSearch(search, userId);
        setResults(data);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [search]);

  useEffect(() => {
    let timeoutId;

    const checkSessionAndStartTimer = async () => {
      try {
        const sessionUser = await account.get();
        setUser(sessionUser);
        
        await fetchUserProfileData(sessionUser.$id);
        
        setLoading(false);

        // Auto logout after 30 minutes
        timeoutId = setTimeout(async () => {
          try {
            await account.deleteSession("current");
            router.push("/login");
          } catch (err) {
            console.error("Auto-logout failed:", err);
          }
        }, 30 * 60 * 1000);
      } catch (err) {
        console.error("Session check failed:", err);
        router.replace("/login");
      }
    };

    checkSessionAndStartTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [router]);

  useEffect(() => {
    const handleStorageChange = () => {
      if (user) {
        fetchUserProfileData(user.$id);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profile-updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profile-updated', handleStorageChange);
    };
  }, [user]);

  const fetchUserProfileData = async (userId) => {
    try {
      const profile = await fetchUserProfile(userId);
      
      console.log("Fetched profile:", profile);
      
      if (profile && profile.profileImageUrl) {
        setProfileImageUrl(profile.profileImageUrl);
        console.log("Profile image URL set:", profile.profileImageUrl);
      } else {
        console.log("No profile image URL found in profile data");
        setProfileImageUrl(null);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setProfileImageUrl(null);
    }
  };

  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
      router.push("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const handleSearchResultClick = (item) => {
    console.log("Clicked:", item);
    setSearch("");
    setResults([]);
    
    // Navigate to the appropriate page based on item type
    if (item._collection === 'clients') {
      router.push(`/clients/${item.$id}`);
    } else if (item._collection === 'projects') {
      router.push(`/projects/${item.$id}`);
    } else if (item._collection === 'invoices') {
      router.push(`/invoices/${item.$id}`);
    } else if (item._collection === 'timeEntries') {
      router.push(`/time-tracking`);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background">
      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-sidebar px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-sidebar-border">
            <div className="flex items-center justify-between">
              <div className="text-xl font-bold text-sidebar-foreground">FreelanceFlow</div>
              <button
                className="-m-2.5 rounded-md p-2.5 text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="mt-8">
              <ul className="space-y-2">
                {navigation.map((item) => {
                  const isActive = pathName === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={classNames(
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          "group flex gap-x-3 rounded-md p-3 text-sm font-medium leading-6 transition-all duration-200"
                        )}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-sidebar px-6 pb-4 ring-1 ring-sidebar-border">
          <div className="flex h-16 shrink-0 items-center">
            <div className="text-xl font-bold text-sidebar-foreground">FreelanceFlow</div>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-2">
              {navigation.map((item) => {
                const isActive = pathName === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={classNames(
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        "group flex gap-x-3 rounded-md p-3 text-sm font-medium leading-6 transition-all duration-200"
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>

      {/* Main Panel */}
      <div className="lg:pl-72">
        {/* Top Bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-card px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-foreground lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="h-6 w-px bg-border lg:hidden" />
          
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="relative flex flex-1 items-center">
              <div className="relative w-full max-w-lg">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  className="block w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm"
                  placeholder="Search clients, projects, invoices..."
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                
                {/* Search Results Dropdown */}
                {search.length > 0 && (
                  <div className="absolute top-full left-0 z-50 mt-2 w-full rounded-md border bg-popover shadow-md">
                    {searchLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
                      </div>
                    ) : results.length > 0 ? (
                      <ul className="max-h-60 overflow-y-auto divide-y divide-border">
                        {results.map((item, index) => (
                          <li
                            key={`${item._collection}-${item.$id}-${index}`}
                            onClick={() => handleSearchResultClick(item)}
                            className="cursor-pointer p-3 hover:bg-muted transition-colors"
                          >
                            <div className="text-sm font-medium text-foreground">
                              {item.name || item.title || item.subject || "Untitled"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item._collection === 'clients' && 'Client'}
                              {item._collection === 'projects' && 'Project'}
                              {item._collection === 'invoices' && 'Invoice'}
                              {item._collection === 'timeEntries' && 'Time Entry'}
                              {item.email && ` • ${item.email}`}
                              {item.status && ` • ${item.status}`}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No results found for "{search}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <button
                type="button"
                className="-m-2.5 p-2.5 text-muted-foreground hover:text-foreground"
              >
                <Bell className="h-6 w-6" />
              </button>

              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" />

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className="focus:outline-none">
                  <div className="flex items-center gap-3 rounded-full p-1.5 hover:bg-muted">
                    {profileImageUrl ? (
                      <img
                        src={profileImageUrl}
                        alt="Profile"
                        className="h-8 w-8 rounded-full object-cover border-2 border-primary/20"
                        onError={(e) => {
                          console.log("Image failed to load:", profileImageUrl);
                          setProfileImageUrl(null);
                        }}
                        onLoad={() => console.log("Image loaded successfully:", profileImageUrl)}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                        <User className="h-5 w-5 text-primary-foreground" />
                      </div>
                    )}
                    <span className="hidden lg:inline text-sm font-medium text-foreground">
                      {user?.name || "User"}
                    </span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push("/settings")}>
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="py-8">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}