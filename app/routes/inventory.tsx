import { redirect } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import {
  useLoaderData,
  useSearchParams,
  useNavigate,
  useActionData,
  Form,
  Link,
} from "react-router";
import { useState, useCallback, useRef } from "react";
import { getUserFromRequest } from "~/modules/authentication/authentication.server";
import { AppShell } from "~/components/layout/AppShell";
import { useAuth } from "~/modules/authentication/use-authentication";
import { UserRole } from "~/modules/authentication/authentication.types";
import { useConfigurables } from "~/modules/configurables";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = getUserFromRequest(request);
  if (!user) return redirect("/auth/login");

  const url = new URL(request.url);
  const search = url.searchParams.get("search") ?? "";
  const status = url.searchParams.get("status") ?? "";
  const category = url.searchParams.get("category") ?? "";
  const page = url.searchParams.get("page") ?? "1";

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  if (category) params.set("category", category);
  params.set("page", page);
  params.set("limit", "50");

  try {
    const baseUrl = url.origin;
    const res = await fetch(`${baseUrl}/api/inventory?${params.toString()}`, {
      headers: { cookie: request.headers.get("cookie") || "" },
    });
    const data = res.ok ? await res.json() : { data: [], total: 0 };

    // Fetch categories for filter
    const statsRes = await fetch(`${baseUrl}/api/inventory/stats`, {
      headers: { cookie: request.headers.get("cookie") || "" },
    });
    const statsData = statsRes.ok ? await statsRes.json() : { data: { categoryBreakdown: [] } };

    return {
      items: data.data ?? [],
      total: data.total ?? 0,
      page: Number(page),
      search,
      status,
      category,
      categories: (statsData.data?.categoryBreakdown ?? []).map((c: any) => c._id).filter(Boolean),
      userRole: user.role,
    };
  } catch {
    return { items: [], total: 0, page: 1, search: "", status: "", category: "", categories: [], userRole: user.role };
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const user = getUserFromRequest(request);
  if (!user) return redirect("/auth/login");

  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");
  const baseUrl = new URL(request.url).origin;
  const cookie = request.headers.get("cookie") || "";

  if (intent === "delete") {
    const id = String(formData.get("id") ?? "");
    await fetch(`${baseUrl}/api/inventory/${id}`, {
      method: "DELETE",
      headers: { cookie },
    });
    return { success: true, message: "Item removed" };
  }

  if (intent === "update-stock") {
    const id = String(formData.get("id") ?? "");
    const quantity_change = Number(formData.get("quantity_change") ?? 0);
    const notes = String(formData.get("notes") ?? "");
    const res = await fetch(`${baseUrl}/api/inventory/${id}/update-stock`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({ quantity_change, notes }),
    });
    const data = await res.json();
    return data.success ? { success: true } : { error: data.message };
  }

  if (intent === "create" || intent === "edit") {
    const id = intent === "edit" ? String(formData.get("id") ?? "") : null;
    const payload = {
      name: String(formData.get("name") ?? ""),
      sku: String(formData.get("sku") ?? ""),
      barcode: String(formData.get("barcode") ?? "") || undefined,
      description: String(formData.get("description") ?? "") || undefined,
      category: String(formData.get("category") ?? "") || undefined,
      quantity: Number(formData.get("quantity") ?? 0),
      min_quantity: Number(formData.get("min_quantity") ?? 0),
      unit_price: Number(formData.get("unit_price") ?? 0),
      unit: String(formData.get("unit") ?? "") || undefined,
      location: String(formData.get("location") ?? "") || undefined,
    };

    const res = await fetch(
      id ? `${baseUrl}/api/inventory/${id}` : `${baseUrl}/api/inventory`,
      {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", cookie },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    return data.success ? { success: true } : { error: data.message };
  }

  return null;
}

function StockBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    in_stock: { label: "In Stock", cls: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" },
    low_stock: { label: "Low Stock", cls: "bg-amber-500/15 text-amber-400 border border-amber-500/20" },
    out_of_stock: { label: "Out of Stock", cls: "bg-red-500/15 text-red-400 border border-red-500/20" },
  };
  const badge = map[status] ?? { label: status, cls: "bg-slate-500/15 text-slate-400" };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>{badge.label}</span>
  );
}

export default function InventoryPage() {
  const { items, total, page, search, status, category, categories, userRole } =
    useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const actionData = useActionData<typeof action>();
  const { user } = useAuth();
  const { config } = useConfigurables();

  const isManager = userRole === UserRole.Admin;
  const currency = config.currency ?? "$";

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [stockItem, setStockItem] = useState<any>(null);
  const [stockDelta, setStockDelta] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState<string>("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams);
        if (value) params.set("search", value);
        else params.delete("search");
        params.delete("page");
        setSearchParams(params);
      }, 300);
    },
    [searchParams, setSearchParams]
  );

  return (
    <AppShell>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">Inventory</h1>
            <p className="text-slate-400 text-sm">{total.toLocaleString()} items found</p>
          </div>
          {isManager && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="sm:ml-auto flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-[#0F1629] font-semibold rounded-lg text-sm transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Item
            </button>
          )}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, SKU, or barcode..."
              defaultValue={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[#1A2340] border border-[#2D3F5E] rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all font-mono"
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) params.set("status", e.target.value);
              else params.delete("status");
              setSearchParams(params);
            }}
            className="px-3 py-2.5 bg-[#1A2340] border border-[#2D3F5E] rounded-lg text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All Statuses</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          <select
            value={category}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) params.set("category", e.target.value);
              else params.delete("category");
              setSearchParams(params);
            }}
            className="px-3 py-2.5 bg-[#1A2340] border border-[#2D3F5E] rounded-lg text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat: string) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div
          className="bg-[#1A2340] border border-[#2D3F5E] rounded-xl overflow-hidden"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.4)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2D3F5E] bg-[#0F1629]">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Item</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">SKU</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Category</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Location</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Qty</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Status</th>
                  {isManager && (
                    <th className="text-right px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Value</th>
                  )}
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2D3F5E]">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={isManager ? 8 : 7} className="text-center py-12 text-slate-500">
                      No items found
                    </td>
                  </tr>
                ) : (
                  items.map((item: any, i: number) => (
                    <tr
                      key={item._id}
                      className={`hover:bg-[#0F1629] transition-colors ${i % 2 === 0 ? "" : "bg-[#1A2340]/50"}`}
                    >
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">{item.name}</p>
                        {item.barcode && <p className="text-slate-600 text-xs font-mono">{item.barcode}</p>}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300 text-xs">{item.sku}</td>
                      <td className="px-4 py-3 text-slate-400">{item.category ?? "—"}</td>
                      <td className="px-4 py-3">
                        {item.location ? (
                          <Link
                            to={`/warehouse-3d?location=${item.location._id}&item=${item._id}`}
                            className="font-mono text-amber-400 hover:text-amber-300 text-xs border border-amber-500/20 rounded px-1.5 py-0.5 bg-amber-500/5 transition-colors"
                          >
                            {item.location.label ?? `${item.location.zone}-${item.location.rack}-${item.location.shelf}-${item.location.bin}`}
                          </Link>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold ${item.quantity === 0 ? "text-red-400" : item.quantity <= item.min_quantity ? "text-amber-400" : "text-white"}`}>
                          {item.quantity}
                        </span>
                        <span className="text-slate-600 text-xs"> {item.unit ?? "pcs"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StockBadge status={item.stock_status} />
                      </td>
                      {isManager && (
                        <td className="px-4 py-3 text-right text-slate-400 text-xs">
                          {currency}{(item.quantity * item.unit_price).toFixed(2)}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setStockItem(item); setStockDelta(0); }}
                            className="text-xs px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors border border-emerald-500/20"
                            title="Update stock"
                          >
                            Stock
                          </button>
                          {isManager && (
                            <>
                              <button
                                onClick={() => setEditItem(item)}
                                className="text-xs px-2.5 py-1.5 bg-[#0F1629] hover:bg-[#2D3F5E] text-slate-300 rounded-lg transition-colors border border-[#2D3F5E]"
                              >
                                Edit
                              </button>
                              <Form method="post" className="inline">
                                <input type="hidden" name="intent" value="delete" />
                                <input type="hidden" name="id" value={item._id} />
                                <button
                                  type="submit"
                                  onClick={(e) => { if (!confirm("Remove this item?")) e.preventDefault(); }}
                                  className="text-xs px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20"
                                >
                                  Remove
                                </button>
                              </Form>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Stock Update Modal */}
      {stockItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div
            className="bg-[#1A2340] border border-[#2D3F5E] rounded-xl w-full max-w-sm"
            style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.6)" }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D3F5E]">
              <h3 className="text-white font-semibold">Update Stock</h3>
              <button onClick={() => setStockItem(null)} className="text-slate-500 hover:text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <Form method="post" onSubmit={() => setTimeout(() => setStockItem(null), 200)} className="p-6 space-y-4">
              <input type="hidden" name="intent" value="update-stock" />
              <input type="hidden" name="id" value={stockItem._id} />
              <div>
                <p className="text-white font-medium">{stockItem.name}</p>
                <p className="text-slate-400 text-sm font-mono">{stockItem.sku}</p>
                <p className="text-slate-400 text-sm mt-1">Current qty: <span className="text-white font-bold">{stockItem.quantity}</span></p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Quantity Change <span className="text-slate-500">(positive = add, negative = remove)</span>
                </label>
                <input
                  type="number"
                  name="quantity_change"
                  value={stockDelta}
                  onChange={(e) => setStockDelta(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-[#0F1629] border border-[#2D3F5E] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
                <p className="text-slate-500 text-xs mt-1">
                  New qty: <span className={`font-bold ${Math.max(0, stockItem.quantity + stockDelta) <= stockItem.min_quantity ? "text-amber-400" : "text-emerald-400"}`}>
                    {Math.max(0, stockItem.quantity + stockDelta)}
                  </span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Notes (optional)</label>
                <input
                  type="text"
                  name="notes"
                  placeholder="Reason for update..."
                  className="w-full px-3 py-2.5 bg-[#0F1629] border border-[#2D3F5E] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-600"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStockItem(null)} className="flex-1 py-2.5 bg-[#0F1629] border border-[#2D3F5E] text-slate-300 rounded-lg text-sm hover:bg-[#2D3F5E] transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-[#0F1629] font-semibold rounded-lg text-sm transition-colors">
                  Update Stock
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editItem) && (
        <ItemModal
          item={editItem}
          onClose={() => { setShowCreateModal(false); setEditItem(null); }}
        />
      )}
    </AppShell>
  );
}

function ItemModal({ item, onClose }: { item: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 overflow-y-auto">
      <div
        className="bg-[#1A2340] border border-[#2D3F5E] rounded-xl w-full max-w-lg my-4"
        style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.6)" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D3F5E]">
          <h3 className="text-white font-semibold">{item ? "Edit Item" : "Add New Item"}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <Form method="post" onSubmit={() => setTimeout(onClose, 300)} className="p-6 space-y-4">
          <input type="hidden" name="intent" value={item ? "edit" : "create"} />
          {item && <input type="hidden" name="id" value={item._id} />}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Item Name *</label>
              <input type="text" name="name" defaultValue={item?.name} required className="w-full px-3 py-2.5 bg-[#0F1629] border border-[#2D3F5E] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">SKU *</label>
              <input type="text" name="sku" defaultValue={item?.sku} required className="w-full px-3 py-2.5 bg-[#0F1629] border border-[#2D3F5E] rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Barcode</label>
              <input type="text" name="barcode" defaultValue={item?.barcode} className="w-full px-3 py-2.5 bg-[#0F1629] border border-[#2D3F5E] rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Category</label>
              <input type="text" name="category" defaultValue={item?.category} placeholder="e.g. Electronics" className="w-full px-3 py-2.5 bg-[#0F1629] border border-[#2D3F5E] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Unit</label>
              <input type="text" name="unit" defaultValue={item?.unit} placeholder="pcs, kg, box..." className="w-full px-3 py-2.5 bg-[#0F1629] border border-[#2D3F5E] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Quantity</label>
              <input type="number" name="quantity" defaultValue={item?.quantity ?? 0} min={0} className="w-full px-3 py-2.5 bg-[#0F1629] border border-[#2D3F5E] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Min Qty (Alert)</label>
              <input type="number" name="min_quantity" defaultValue={item?.min_quantity ?? 0} min={0} className="w-full px-3 py-2.5 bg-[#0F1629] border border-[#2D3F5E] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Unit Price</label>
              <input type="number" name="unit_price" defaultValue={item?.unit_price ?? 0} min={0} step="0.01" className="w-full px-3 py-2.5 bg-[#0F1629] border border-[#2D3F5E] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Location (ID)</label>
              <input type="text" name="location" defaultValue={item?.location?._id ?? item?.location ?? ""} placeholder="Location ID" className="w-full px-3 py-2.5 bg-[#0F1629] border border-[#2D3F5E] rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Description</label>
              <textarea name="description" defaultValue={item?.description} rows={2} className="w-full px-3 py-2.5 bg-[#0F1629] border border-[#2D3F5E] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-[#0F1629] border border-[#2D3F5E] text-slate-300 rounded-lg text-sm hover:bg-[#2D3F5E] transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-[#0F1629] font-semibold rounded-lg text-sm transition-colors">
              {item ? "Save Changes" : "Create Item"}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
