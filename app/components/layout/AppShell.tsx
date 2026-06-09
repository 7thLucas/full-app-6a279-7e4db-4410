import { useState } from "react";
import { Link, useLocation, Form, useNavigate } from "react-router";
import { useAuth } from "~/modules/authentication/use-authentication";
import { useConfigurables } from "~/modules/configurables";
import { UserRole } from "~/modules/authentication/authentication.types";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  managerOnly?: boolean;
}

const LayoutIcon = ({ children }: { children: React.ReactNode }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <LayoutIcon>
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </LayoutIcon>
    ),
  },
  {
    label: "Inventory",
    href: "/inventory",
    icon: (
      <LayoutIcon>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" x2="12" y1="22.08" y2="12" />
      </LayoutIcon>
    ),
  },
  {
    label: "3D Warehouse",
    href: "/warehouse-3d",
    icon: (
      <LayoutIcon>
        <path d="M3 3h18v18H3z" />
        <path d="M3 9h18" />
        <path d="M3 15h18" />
        <path d="M9 3v18" />
        <path d="M15 3v18" />
      </LayoutIcon>
    ),
  },
  {
    label: "Movements",
    href: "/movements",
    icon: (
      <LayoutIcon>
        <path d="M17 3L21 7L17 11" />
        <path d="M3 7H21" />
        <path d="M7 21L3 17L7 13" />
        <path d="M21 17H3" />
      </LayoutIcon>
    ),
  },
  {
    label: "Reports",
    href: "/reports",
    icon: (
      <LayoutIcon>
        <line x1="18" x2="18" y1="20" y2="10" />
        <line x1="12" x2="12" y1="20" y2="4" />
        <line x1="6" x2="6" y1="20" y2="14" />
      </LayoutIcon>
    ),
    managerOnly: true,
  },
  {
    label: "Locations",
    href: "/locations",
    icon: (
      <LayoutIcon>
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </LayoutIcon>
    ),
    managerOnly: true,
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { config } = useConfigurables();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isManager = user?.role === UserRole.Admin;

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.managerOnly || isManager
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#0F1629]">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-[#0F1629] border-r border-[#2D3F5E] flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-[#2D3F5E]">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" fill="#0F1629" stroke="#0F1629" strokeWidth="1"/>
              <path d="M9 22V12h6v10" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">{config.appName ?? "MyWare"}</p>
            <p className="text-slate-500 text-xs">{config.warehouseName ?? "Main Warehouse"}</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-0.5">
            {visibleNavItems.map((item) => {
              const isActive =
                location.pathname === item.href ||
                (item.href !== "/dashboard" && location.pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${
                    isActive
                      ? "bg-amber-500/10 text-amber-400"
                      : "text-slate-400 hover:text-slate-200 hover:bg-[#1A2340]"
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-amber-500 rounded-r-full" />
                  )}
                  <span className={`transition-colors ${isActive ? "text-amber-400" : "text-slate-500 group-hover:text-slate-300"}`}>
                    {item.icon}
                  </span>
                  {item.label}
                  {item.managerOnly && (
                    <span className="ml-auto text-xs text-amber-500/60 border border-amber-500/20 rounded px-1 py-0.5 leading-none">
                      MGR
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User info + logout */}
        <div className="border-t border-[#2D3F5E] p-4">
          {loading ? (
            <div className="h-10 bg-[#1A2340] rounded-lg animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-amber-400 text-xs font-bold">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{user.username}</p>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isManager
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-emerald-500/20 text-emerald-400"
                  }`}
                >
                  {isManager ? "Manager" : "Employee"}
                </span>
              </div>
              <Form method="post" action="/auth/logout">
                <button
                  type="submit"
                  className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded"
                  title="Sign out"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" x2="9" y1="12" y2="12" />
                  </svg>
                </button>
              </Form>
            </div>
          ) : null}
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-60">
        {/* Top bar */}
        <header className="flex-shrink-0 h-14 bg-[#0F1629] border-b border-[#2D3F5E] flex items-center px-4 gap-4">
          {/* Mobile menu button */}
          <button
            className="lg:hidden text-slate-400 hover:text-white transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm min-w-0">
            <span className="text-slate-500">{config.appName ?? "MyWare"}</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-200 font-medium truncate">
              {visibleNavItems.find((n) =>
                location.pathname === n.href ||
                (n.href !== "/dashboard" && location.pathname.startsWith(n.href))
              )?.label ?? "Page"}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Role chip */}
            {!loading && user && (
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  isManager
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                    : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                }`}
              >
                {isManager ? "Manager" : "Employee"}
              </span>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
