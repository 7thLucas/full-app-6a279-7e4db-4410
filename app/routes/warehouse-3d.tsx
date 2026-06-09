import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams, Link } from "react-router";
import { useState, useCallback, lazy, Suspense } from "react";
import { getUserFromRequest } from "~/modules/authentication/authentication.server";
import { AppShell } from "~/components/layout/AppShell";

// Lazy-load the 3D canvas to prevent SSR issues with Three.js
const Warehouse3DCanvas = lazy(() => import("~/components/warehouse/Warehouse3DCanvas"));

export async function loader({ request }: LoaderFunctionArgs) {
  const user = getUserFromRequest(request);
  if (!user) return redirect("/auth/login");

  const url = new URL(request.url);
  const highlightLocation = url.searchParams.get("location") ?? "";
  const highlightItem = url.searchParams.get("item") ?? "";

  try {
    const baseUrl = url.origin;
    const [locsRes, itemsRes] = await Promise.all([
      fetch(`${baseUrl}/api/locations`, {
        headers: { cookie: request.headers.get("cookie") || "" },
      }),
      fetch(`${baseUrl}/api/inventory?limit=200`, {
        headers: { cookie: request.headers.get("cookie") || "" },
      }),
    ]);

    const [locsData, itemsData] = await Promise.all([
      locsRes.ok ? locsRes.json() : { data: [] },
      itemsRes.ok ? itemsRes.json() : { data: [] },
    ]);

    return {
      locations: locsData.data ?? [],
      items: itemsData.data ?? [],
      highlightLocation,
      highlightItem,
    };
  } catch {
    return { locations: [], items: [], highlightLocation: "", highlightItem: "" };
  }
}

// ── Page component ─────────────────────────────────────────────────────────────
export default function Warehouse3DPage() {
  const { locations, items, highlightLocation, highlightItem } =
    useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState(
    highlightItem ? (items as any[]).find((i: any) => i._id === highlightItem)?.name ?? "" : ""
  );

  const highlightId = searchParams.get("location") ?? highlightLocation;

  const handleBinClick = useCallback(
    (loc: any) => {
      const params = new URLSearchParams(searchParams);
      params.set("location", loc._id);
      setSearchParams(params);
    },
    [searchParams, setSearchParams]
  );

  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value);
      if (!value.trim()) {
        const params = new URLSearchParams(searchParams);
        params.delete("location");
        params.delete("item");
        setSearchParams(params);
        return;
      }
      const rx = new RegExp(value, "i");
      const found = (items as any[]).find(
        (item: any) => rx.test(item.name) || rx.test(item.sku) || rx.test(item.barcode ?? "")
      );
      if (found && found.location) {
        const locId = typeof found.location === "object" ? found.location._id : found.location;
        const params = new URLSearchParams(searchParams);
        params.set("location", locId);
        params.set("item", found._id);
        setSearchParams(params);
      }
    },
    [items, searchParams, setSearchParams]
  );

  const binItems = (items as any[]).filter((item: any) => {
    const locId =
      typeof item.location === "object" ? item.location?._id : item.location;
    return locId === highlightId;
  });

  const highlightedLoc = (locations as any[]).find((l: any) => l._id === highlightId);

  return (
    <AppShell>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-3.5rem)]">
        {/* 3D Viewport */}
        <div className="flex-1 relative bg-[#080E1C]">
          {/* Search overlay */}
          <div className="absolute top-4 left-4 right-4 z-10 max-w-sm">
            <div className="relative">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search item to locate in 3D..."
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[#1A2340]/90 backdrop-blur border border-[#2D3F5E] rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono shadow-lg"
              />
            </div>
            {highlightId && (
              <div className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Location highlighted in 3D view — click the glowing bin
              </div>
            )}
          </div>

          {/* Zone legend */}
          <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1.5 bg-[#1A2340]/80 backdrop-blur border border-[#2D3F5E] rounded-xl p-3">
            <p className="text-slate-400 text-xs font-medium mb-0.5">Zones</p>
            {[
              { zone: "A", color: "#3B82F6" },
              { zone: "B", color: "#14B8A6" },
              { zone: "C", color: "#8B5CF6" },
              { zone: "D", color: "#F97316" },
            ].map(({ zone, color }) => (
              <div key={zone} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
                <span className="text-xs text-slate-300">Zone {zone}</span>
              </div>
            ))}
          </div>

          {/* 3D Canvas — client-only */}
          {typeof window !== "undefined" ? (
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full text-slate-500">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm">Loading 3D Warehouse...</p>
                  </div>
                </div>
              }
            >
              <Warehouse3DCanvas
                locations={locations as any[]}
                highlightLocationId={highlightId}
                onBinClick={handleBinClick}
              />
            </Suspense>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Loading 3D Warehouse...</p>
              </div>
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="w-full lg:w-80 flex-shrink-0 bg-[#1A2340] border-l border-[#2D3F5E] flex flex-col overflow-y-auto">
          <div className="px-5 py-4 border-b border-[#2D3F5E]">
            <h3 className="text-white font-semibold text-sm">Location Detail</h3>
          </div>

          {highlightId ? (
            <div className="p-5 space-y-5">
              {/* Location info */}
              {highlightedLoc && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Selected Bin</p>
                  <div className="bg-[#0F1629] rounded-lg p-3 border border-amber-500/30">
                    <p className="text-amber-400 text-xl font-bold font-mono">{highlightedLoc.label}</p>
                    <p className="text-slate-400 text-sm mt-1">
                      Zone <span className="text-white">{highlightedLoc.zone}</span> · Rack{" "}
                      <span className="text-white">{highlightedLoc.rack}</span> · Shelf{" "}
                      <span className="text-white">{highlightedLoc.shelf}</span> · Bin{" "}
                      <span className="text-white">{highlightedLoc.bin}</span>
                    </p>
                    <p className="text-slate-600 text-xs mt-1 font-mono">
                      pos ({highlightedLoc.posX?.toFixed(1)}, {highlightedLoc.posY?.toFixed(1)}, {highlightedLoc.posZ?.toFixed(1)})
                    </p>
                  </div>
                </div>
              )}

              {/* Items in this bin */}
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                  Items in this bin ({binItems.length})
                </p>
                {binItems.length === 0 ? (
                  <p className="text-slate-600 text-sm">No items assigned to this bin</p>
                ) : (
                  <div className="space-y-2">
                    {binItems.map((item: any) => (
                      <div key={item._id} className="bg-[#0F1629] rounded-lg p-3 border border-[#2D3F5E]">
                        <p className="text-white font-medium text-sm">{item.name}</p>
                        <p className="text-slate-500 text-xs font-mono mt-0.5">{item.sku}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span
                            className={`text-sm font-bold ${
                              item.quantity === 0
                                ? "text-red-400"
                                : item.quantity <= item.min_quantity
                                ? "text-amber-400"
                                : "text-emerald-400"
                            }`}
                          >
                            {item.quantity} {item.unit ?? "pcs"}
                          </span>
                          <Link
                            to={`/inventory`}
                            className="text-xs text-slate-500 hover:text-amber-400 transition-colors"
                          >
                            View all
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-14 h-14 rounded-xl bg-[#0F1629] flex items-center justify-center mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2D3F5E" strokeWidth="1.5">
                  <path d="M3 3h18v18H3z" />
                  <path d="M3 9h18" />
                  <path d="M3 15h18" />
                  <path d="M9 3v18" />
                  <path d="M15 3v18" />
                </svg>
              </div>
              <p className="text-slate-400 text-sm font-medium">Click a bin in the 3D view</p>
              <p className="text-slate-600 text-xs mt-1">or search for an item above</p>
              <p className="text-slate-700 text-xs mt-3">
                Rotate: left-drag · Zoom: scroll · Pan: right-drag
              </p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
