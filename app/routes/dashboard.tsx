import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link } from "react-router";
import { getUserFromRequest } from "~/modules/authentication/authentication.server";
import { AppShell } from "~/components/layout/AppShell";
import { useConfigurables } from "~/modules/configurables";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = getUserFromRequest(request);
  if (!user) return redirect("/auth/login");

  try {
    const baseUrl = new URL(request.url).origin;
    const [statsRes, movementsRes] = await Promise.all([
      fetch(`${baseUrl}/api/inventory/stats`, {
        headers: { cookie: request.headers.get("cookie") || "" },
      }),
      fetch(`${baseUrl}/api/movements?limit=8`, {
        headers: { cookie: request.headers.get("cookie") || "" },
      }),
    ]);

    const [statsData, movementsData] = await Promise.all([
      statsRes.ok ? statsRes.json() : { data: {} },
      movementsRes.ok ? movementsRes.json() : { data: [] },
    ]);

    // Fetch low stock items
    const lowStockRes = await fetch(`${baseUrl}/api/inventory?status=low_stock&limit=8`, {
      headers: { cookie: request.headers.get("cookie") || "" },
    });
    const lowStockData = lowStockRes.ok ? await lowStockRes.json() : { data: [] };

    return {
      stats: statsData.data ?? {},
      recentMovements: movementsData.data ?? [],
      lowStockItems: lowStockData.data ?? [],
      userRole: user.role,
    };
  } catch {
    return { stats: {}, recentMovements: [], lowStockItems: [], userRole: user.role };
  }
}

function StatCard({
  label,
  value,
  sub,
  color = "amber",
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: "amber" | "emerald" | "red" | "blue";
  icon: React.ReactNode;
}) {
  const colorMap = {
    amber: "text-amber-400 bg-amber-400/10",
    emerald: "text-emerald-400 bg-emerald-400/10",
    red: "text-red-400 bg-red-400/10",
    blue: "text-blue-400 bg-blue-400/10",
  };

  return (
    <div
      className="bg-[#1A2340] border border-[#2D3F5E] rounded-xl p-5"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.4)" }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function MovementTypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    inbound: { label: "IN", cls: "bg-emerald-500/20 text-emerald-400" },
    outbound: { label: "OUT", cls: "bg-red-500/20 text-red-400" },
    transfer: { label: "MOVE", cls: "bg-blue-500/20 text-blue-400" },
    adjustment: { label: "ADJ", cls: "bg-amber-500/20 text-amber-400" },
  };
  const badge = map[type] ?? { label: type.toUpperCase(), cls: "bg-slate-500/20 text-slate-400" };

  return (
    <span className={`text-xs font-bold px-1.5 py-0.5 rounded font-mono ${badge.cls}`}>
      {badge.label}
    </span>
  );
}

function StockBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    in_stock: { label: "In Stock", cls: "bg-emerald-500/15 text-emerald-400" },
    low_stock: { label: "Low Stock", cls: "bg-amber-500/15 text-amber-400" },
    out_of_stock: { label: "Out of Stock", cls: "bg-red-500/15 text-red-400" },
  };
  const badge = map[status] ?? { label: status, cls: "bg-slate-500/15 text-slate-400" };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>{badge.label}</span>
  );
}

export default function DashboardPage() {
  const { stats, recentMovements, lowStockItems, userRole } = useLoaderData<typeof loader>();
  const { config } = useConfigurables();

  const showValue = config.showInventoryValue !== false;
  const currency = config.currency ?? "$";

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Real-time overview of {config.warehouseName ?? "your warehouse"}
          </p>
        </div>

        {/* Low stock alert banner */}
        {(stats.lowStockItems > 0 || stats.outOfStockItems > 0) && (
          <div className="alert-banner flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" className="flex-shrink-0">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <p className="text-amber-300 text-sm">
              <span className="font-semibold">{stats.lowStockItems ?? 0} items</span> are low on stock
              {stats.outOfStockItems > 0 && (
                <> and <span className="font-semibold text-red-400">{stats.outOfStockItems} items</span> are out of stock.</>
              )}
              {" "}
              <Link to="/inventory?status=low_stock" className="underline hover:text-amber-200">View all</Link>
            </p>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Items"
            value={(stats.totalItems ?? 0).toLocaleString()}
            sub="Active inventory"
            color="blue"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
            }
          />
          <StatCard
            label="Low Stock"
            value={(stats.lowStockItems ?? 0)}
            sub={`${stats.outOfStockItems ?? 0} out of stock`}
            color="amber"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            }
          />
          <StatCard
            label="Occupancy"
            value={`${stats.occupancyRate ?? 0}%`}
            sub={`${stats.occupiedLocations ?? 0} / ${stats.totalLocations ?? 0} locations`}
            color="emerald"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
            }
          />
          {showValue && (
            <StatCard
              label="Inventory Value"
              value={`${currency}${(stats.totalValue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
              sub="Total estimated value"
              color="emerald"
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" x2="12" y1="2" y2="22" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              }
            />
          )}
        </div>

        {/* Lower panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Stock Items */}
          <div
            className="bg-[#1A2340] border border-[#2D3F5E] rounded-xl overflow-hidden"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.4)" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2D3F5E]">
              <h3 className="text-white font-semibold text-sm">Low Stock Items</h3>
              <Link to="/inventory?status=low_stock" className="text-xs text-amber-400 hover:text-amber-300">
                View all
              </Link>
            </div>
            <div className="divide-y divide-[#2D3F5E]">
              {lowStockItems.length === 0 ? (
                <div className="px-5 py-8 text-center text-slate-500 text-sm">
                  All items are well stocked
                </div>
              ) : (
                lowStockItems.slice(0, 6).map((item: any) => (
                  <div key={item._id} className="flex items-center justify-between px-5 py-3 hover:bg-[#0F1629] transition-colors">
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{item.name}</p>
                      <p className="text-slate-500 text-xs font-mono">{item.sku}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <div className="text-right">
                        <p className={`text-sm font-bold ${item.quantity === 0 ? "text-red-400" : "text-amber-400"}`}>
                          {item.quantity}
                        </p>
                        <p className="text-slate-600 text-xs">/ {item.min_quantity} min</p>
                      </div>
                      <StockBadge status={item.stock_status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Movements */}
          <div
            className="bg-[#1A2340] border border-[#2D3F5E] rounded-xl overflow-hidden"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.4)" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2D3F5E]">
              <h3 className="text-white font-semibold text-sm">Recent Movements</h3>
              <Link to="/movements" className="text-xs text-amber-400 hover:text-amber-300">
                View all
              </Link>
            </div>
            <div className="divide-y divide-[#2D3F5E]">
              {recentMovements.length === 0 ? (
                <div className="px-5 py-8 text-center text-slate-500 text-sm">
                  No recent movements
                </div>
              ) : (
                recentMovements.slice(0, 6).map((move: any) => (
                  <div key={move._id} className="flex items-center gap-3 px-5 py-3 hover:bg-[#0F1629] transition-colors">
                    <MovementTypeBadge type={move.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {move.item?.name ?? "Unknown Item"}
                      </p>
                      <p className="text-slate-500 text-xs">
                        by {move.performed_by ?? "system"} · {new Date(move.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-bold flex-shrink-0 ${
                        move.quantity_change > 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {move.quantity_change > 0 ? "+" : ""}{move.quantity_change}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Category breakdown */}
        {stats.categoryBreakdown && stats.categoryBreakdown.length > 0 && (
          <div
            className="bg-[#1A2340] border border-[#2D3F5E] rounded-xl p-5"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.4)" }}
          >
            <h3 className="text-white font-semibold text-sm mb-4">Inventory by Category</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {stats.categoryBreakdown.slice(0, 8).map((cat: any, i: number) => {
                const colors = ["amber", "emerald", "blue", "purple", "red", "teal", "orange", "pink"];
                const colorClasses: Record<string, string> = {
                  amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
                  emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                  blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
                  purple: "bg-purple-500/10 border-purple-500/20 text-purple-400",
                  red: "bg-red-500/10 border-red-500/20 text-red-400",
                  teal: "bg-teal-500/10 border-teal-500/20 text-teal-400",
                  orange: "bg-orange-500/10 border-orange-500/20 text-orange-400",
                  pink: "bg-pink-500/10 border-pink-500/20 text-pink-400",
                };
                const cls = colorClasses[colors[i % colors.length]];

                return (
                  <div key={cat._id} className={`rounded-lg border p-3 ${cls}`}>
                    <p className="text-xs font-medium truncate">{cat._id ?? "Uncategorized"}</p>
                    <p className="text-lg font-bold mt-1">{cat.count}</p>
                    <p className="text-xs opacity-70">{cat.totalQty} units</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          <Link
            to="/warehouse-3d"
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-[#0F1629] font-semibold rounded-lg text-sm transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 3h18v18H3z" />
              <path d="M3 9h18" /><path d="M3 15h18" />
              <path d="M9 3v18" /><path d="M15 3v18" />
            </svg>
            Open 3D Warehouse
          </Link>
          <Link
            to="/inventory"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1A2340] hover:bg-[#2D3F5E] text-slate-200 font-medium rounded-lg text-sm transition-colors border border-[#2D3F5E]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            Search Inventory
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
