import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { getUserFromRequest } from "~/modules/authentication/authentication.server";
import { AppShell } from "~/components/layout/AppShell";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = getUserFromRequest(request);
  if (!user) return redirect("/auth/login");

  try {
    const baseUrl = new URL(request.url).origin;
    const res = await fetch(`${baseUrl}/api/movements?limit=100`, {
      headers: { cookie: request.headers.get("cookie") || "" },
    });
    const data = res.ok ? await res.json() : { data: [] };
    return { movements: data.data ?? [] };
  } catch {
    return { movements: [] };
  }
}

const MOVEMENT_CONFIG: Record<string, { label: string; cls: string; icon: string }> = {
  inbound: {
    label: "Inbound",
    cls: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
    icon: "↓",
  },
  outbound: {
    label: "Outbound",
    cls: "bg-red-500/15 text-red-400 border border-red-500/20",
    icon: "↑",
  },
  transfer: {
    label: "Transfer",
    cls: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
    icon: "⇄",
  },
  adjustment: {
    label: "Adjustment",
    cls: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
    icon: "~",
  },
};

export default function MovementsPage() {
  const { movements } = useLoaderData<typeof loader>();

  return (
    <AppShell>
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide">Movement History</h1>
          <p className="text-slate-400 text-sm">{movements.length} records</p>
        </div>

        <div
          className="bg-[#1A2340] border border-[#2D3F5E] rounded-xl overflow-hidden"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.4)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2D3F5E] bg-[#0F1629]">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Item</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Change</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Before</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">After</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Notes</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">By</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2D3F5E]">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-500">
                      No movements recorded yet
                    </td>
                  </tr>
                ) : (
                  movements.map((move: any, i: number) => {
                    const cfg = MOVEMENT_CONFIG[move.type] ?? {
                      label: move.type,
                      cls: "bg-slate-500/15 text-slate-400",
                      icon: "•",
                    };
                    return (
                      <tr key={move._id} className={`hover:bg-[#0F1629] transition-colors ${i % 2 === 0 ? "" : "bg-[#1A2340]/50"}`}>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.cls}`}>
                            {cfg.icon} {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-white font-medium">{move.item?.name ?? "Unknown Item"}</p>
                          <p className="text-slate-500 text-xs font-mono">{move.item?.sku}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-bold font-mono ${move.quantity_change > 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {move.quantity_change > 0 ? "+" : ""}{move.quantity_change}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-400 font-mono">{move.quantity_before}</td>
                        <td className="px-4 py-3 text-right text-white font-mono font-semibold">{move.quantity_after}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs max-w-xs truncate">{move.notes ?? "—"}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{move.performed_by ?? "system"}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                          {new Date(move.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
