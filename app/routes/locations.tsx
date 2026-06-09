import { redirect } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, Form, useActionData } from "react-router";
import { useState } from "react";
import { getUserFromRequest } from "~/modules/authentication/authentication.server";
import { UserRole } from "~/modules/authentication/authentication.types";
import { AppShell } from "~/components/layout/AppShell";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = getUserFromRequest(request);
  if (!user) return redirect("/auth/login");
  if (user.role !== UserRole.Admin) return redirect("/dashboard");

  try {
    const baseUrl = new URL(request.url).origin;
    const res = await fetch(`${baseUrl}/api/locations`, {
      headers: { cookie: request.headers.get("cookie") || "" },
    });
    const data = res.ok ? await res.json() : { data: [] };
    return { locations: data.data ?? [] };
  } catch {
    return { locations: [] };
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const user = getUserFromRequest(request);
  if (!user || user.role !== UserRole.Admin) return redirect("/dashboard");

  const formData = await request.formData();
  const baseUrl = new URL(request.url).origin;
  const cookie = request.headers.get("cookie") || "";

  const payload = {
    zone: String(formData.get("zone") ?? "").toUpperCase(),
    rack: String(formData.get("rack") ?? ""),
    shelf: String(formData.get("shelf") ?? ""),
    bin: String(formData.get("bin") ?? "").toUpperCase(),
    posX: Number(formData.get("posX") ?? 0),
    posY: Number(formData.get("posY") ?? 0),
    posZ: Number(formData.get("posZ") ?? 0),
  };

  const res = await fetch(`${baseUrl}/api/locations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return data.success ? { success: true } : { error: data.message };
}

const ZONE_COLORS: Record<string, string> = {
  A: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  B: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  C: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  D: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

export default function LocationsPage() {
  const { locations } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [showAdd, setShowAdd] = useState(false);

  // Group by zone
  const byZone = locations.reduce((acc: Record<string, any[]>, loc: any) => {
    acc[loc.zone] = acc[loc.zone] ?? [];
    acc[loc.zone].push(loc);
    return acc;
  }, {});

  return (
    <AppShell>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">Locations</h1>
            <p className="text-slate-400 text-sm">{locations.length} bins configured</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-[#0F1629] font-semibold rounded-lg text-sm transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Location
          </button>
        </div>

        {Object.entries(byZone).sort(([a], [b]) => a.localeCompare(b)).map(([zone, locs]: [string, any[]]) => (
          <div key={zone} className="bg-[#1A2340] border border-[#2D3F5E] rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[#2D3F5E] flex items-center gap-3">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${ZONE_COLORS[zone] ?? "bg-slate-500/10 text-slate-400"}`}>
                Zone {zone}
              </span>
              <span className="text-slate-400 text-sm">{locs.length} bins</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2D3F5E] bg-[#0F1629]">
                    <th className="text-left px-4 py-2.5 text-slate-400 font-medium text-xs uppercase tracking-wider">Label</th>
                    <th className="text-left px-4 py-2.5 text-slate-400 font-medium text-xs uppercase tracking-wider">Rack</th>
                    <th className="text-left px-4 py-2.5 text-slate-400 font-medium text-xs uppercase tracking-wider">Shelf</th>
                    <th className="text-left px-4 py-2.5 text-slate-400 font-medium text-xs uppercase tracking-wider">Bin</th>
                    <th className="text-right px-4 py-2.5 text-slate-400 font-medium text-xs uppercase tracking-wider">3D Position</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D3F5E]">
                  {locs.map((loc: any) => (
                    <tr key={loc._id} className="hover:bg-[#0F1629] transition-colors">
                      <td className="px-4 py-2.5 font-mono text-amber-400 font-medium">{loc.label}</td>
                      <td className="px-4 py-2.5 text-slate-300">{loc.rack}</td>
                      <td className="px-4 py-2.5 text-slate-300">{loc.shelf}</td>
                      <td className="px-4 py-2.5 text-slate-300">{loc.bin}</td>
                      <td className="px-4 py-2.5 text-right text-slate-500 text-xs font-mono">
                        ({loc.posX?.toFixed(1)}, {loc.posY?.toFixed(1)}, {loc.posZ?.toFixed(1)})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {locations.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <p>No locations configured yet.</p>
            <p className="text-xs mt-1">They will be seeded automatically on first start.</p>
          </div>
        )}
      </div>

      {/* Add Location Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div
            className="bg-[#1A2340] border border-[#2D3F5E] rounded-xl w-full max-w-sm"
            style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.6)" }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D3F5E]">
              <h3 className="text-white font-semibold">Add Location</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-500 hover:text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <Form method="post" onSubmit={() => setTimeout(() => setShowAdd(false), 200)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: "zone", label: "Zone", placeholder: "A" },
                  { name: "rack", label: "Rack", placeholder: "01" },
                  { name: "shelf", label: "Shelf", placeholder: "1" },
                  { name: "bin", label: "Bin", placeholder: "A" },
                ].map((field) => (
                  <div key={field.name}>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">{field.label}</label>
                    <input
                      type="text"
                      name={field.name}
                      required
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2.5 bg-[#0F1629] border border-[#2D3F5E] rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase"
                    />
                  </div>
                ))}
                {[
                  { name: "posX", label: "Pos X" },
                  { name: "posY", label: "Pos Y" },
                  { name: "posZ", label: "Pos Z" },
                ].map((field) => (
                  <div key={field.name}>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">{field.label}</label>
                    <input
                      type="number"
                      name={field.name}
                      defaultValue={0}
                      step="0.1"
                      className="w-full px-3 py-2.5 bg-[#0F1629] border border-[#2D3F5E] rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2.5 bg-[#0F1629] border border-[#2D3F5E] text-slate-300 rounded-lg text-sm hover:bg-[#2D3F5E] transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-[#0F1629] font-semibold rounded-lg text-sm transition-colors">Add</button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
