import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { getUserFromRequest } from "~/modules/authentication/authentication.server";
import { UserRole } from "~/modules/authentication/authentication.types";
import { AppShell } from "~/components/layout/AppShell";
import { useConfigurables } from "~/modules/configurables";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = getUserFromRequest(request);
  if (!user) return redirect("/auth/login");
  if (user.role !== UserRole.Admin) return redirect("/dashboard");

  try {
    const baseUrl = new URL(request.url).origin;
    const cookie = request.headers.get("cookie") || "";

    const [statsRes, movementsRes, lowStockRes] = await Promise.all([
      fetch(`${baseUrl}/api/inventory/stats`, { headers: { cookie } }),
      fetch(`${baseUrl}/api/movements?limit=200`, { headers: { cookie } }),
      fetch(`${baseUrl}/api/inventory?status=low_stock&limit=100`, { headers: { cookie } }),
    ]);

    const [stats, movementsData, lowStockData] = await Promise.all([
      statsRes.ok ? statsRes.json() : { data: {} },
      movementsRes.ok ? movementsRes.json() : { data: [] },
      lowStockRes.ok ? lowStockRes.json() : { data: [] },
    ]);

    // Aggregate movement counts by day (last 14 days)
    const movements: any[] = movementsData.data ?? [];
    const dayMap = new Map<string, { date: string; inbound: number; outbound: number }>();
    const now = Date.now();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dayMap.set(key, { date: key, inbound: 0, outbound: 0 });
    }
    for (const m of movements) {
      const d = new Date(m.createdAt);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (dayMap.has(key)) {
        const entry = dayMap.get(key)!;
        if (m.type === "inbound") entry.inbound += Math.abs(m.quantity_change);
        else if (m.type === "outbound") entry.outbound += Math.abs(m.quantity_change);
      }
    }
    const movementChart = Array.from(dayMap.values());

    return {
      stats: stats.data ?? {},
      movementChart,
      lowStockItems: lowStockData.data ?? [],
    };
  } catch {
    return { stats: {}, movementChart: [], lowStockItems: [] };
  }
}

const PIE_COLORS = ["#3B82F6", "#14B8A6", "#8B5CF6", "#F97316", "#EF4444", "#10B981", "#F59E0B", "#EC4899"];

export default function ReportsPage() {
  const { stats, movementChart, lowStockItems } = useLoaderData<typeof loader>();
  const { config } = useConfigurables();
  const currency = config.currency ?? "$";

  const categoryData = (stats.categoryBreakdown ?? []).map((c: any) => ({
    name: c._id ?? "Uncategorized",
    count: c.count,
    units: c.totalQty,
  }));

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide">Reports</h1>
          <p className="text-slate-400 text-sm">Analytics and inventory insights</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Items", value: (stats.totalItems ?? 0).toLocaleString(), color: "text-blue-400" },
            { label: "Low Stock", value: stats.lowStockItems ?? 0, color: "text-amber-400" },
            { label: "Out of Stock", value: stats.outOfStockItems ?? 0, color: "text-red-400" },
            { label: "Occupancy", value: `${stats.occupancyRate ?? 0}%`, color: "text-emerald-400" },
          ].map((s) => (
            <div key={s.label} className="bg-[#1A2340] border border-[#2D3F5E] rounded-xl p-4">
              <p className="text-slate-400 text-xs uppercase tracking-wider">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Movement chart */}
        <div className="bg-[#1A2340] border border-[#2D3F5E] rounded-xl p-5">
          <h3 className="text-white font-semibold text-sm mb-5">Stock Movement — Last 14 Days</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={movementChart} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2D3F5E" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#94A3B8", fontSize: 11 }}
                axisLine={{ stroke: "#2D3F5E" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#94A3B8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#1A2340", border: "1px solid #2D3F5E", borderRadius: "8px", color: "#F1F5F9" }}
                labelStyle={{ color: "#94A3B8" }}
              />
              <Legend wrapperStyle={{ color: "#94A3B8", fontSize: "12px" }} />
              <Bar dataKey="inbound" fill="#10B981" name="Inbound" radius={[3, 3, 0, 0]} />
              <Bar dataKey="outbound" fill="#EF4444" name="Outbound" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category breakdown pie */}
          <div className="bg-[#1A2340] border border-[#2D3F5E] rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-5">Items by Category</h3>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    dataKey="count"
                    nameKey="name"
                    paddingAngle={2}
                  >
                    {categoryData.map((_: any, index: number) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1A2340", border: "1px solid #2D3F5E", borderRadius: "8px", color: "#F1F5F9" }}
                  />
                  <Legend
                    formatter={(value) => <span style={{ color: "#94A3B8", fontSize: "11px" }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-600 text-sm">
                No data available
              </div>
            )}
          </div>

          {/* Low stock report */}
          <div className="bg-[#1A2340] border border-[#2D3F5E] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#2D3F5E]">
              <h3 className="text-white font-semibold text-sm">Low Stock Report</h3>
            </div>
            <div className="overflow-y-auto max-h-56 divide-y divide-[#2D3F5E]">
              {lowStockItems.length === 0 ? (
                <div className="p-5 text-center text-slate-600 text-sm">
                  All items are adequately stocked
                </div>
              ) : (
                lowStockItems.map((item: any) => (
                  <div key={item._id} className="flex items-center justify-between px-5 py-2.5">
                    <div>
                      <p className="text-white text-sm">{item.name}</p>
                      <p className="text-slate-500 text-xs font-mono">{item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${item.quantity === 0 ? "text-red-400" : "text-amber-400"}`}>
                        {item.quantity}
                      </p>
                      <p className="text-slate-600 text-xs">min: {item.min_quantity}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Inventory value report */}
        {config.showInventoryValue !== false && (
          <div className="bg-[#1A2340] border border-[#2D3F5E] rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-4">Warehouse Utilization</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Total Value</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {currency}{(stats.totalValue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Locations Used</p>
                <p className="text-2xl font-bold text-blue-400">
                  {stats.occupiedLocations ?? 0}
                  <span className="text-sm text-slate-500 font-normal"> / {stats.totalLocations ?? 0}</span>
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Utilization Rate</p>
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-2 bg-[#0F1629] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-500 transition-all"
                        style={{ width: `${stats.occupancyRate ?? 0}%` }}
                      />
                    </div>
                    <span className="text-amber-400 font-bold text-sm">{stats.occupancyRate ?? 0}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
