import { Router, type Request, type Response } from "express";
import { requireAuth, requireAdmin } from "~/modules/authentication/authentication.middleware";
import { InventoryItemModel, StockStatus } from "./models/inventory-item.model";
import { LocationModel } from "./models/location.model";
import { MovementModel, MovementType } from "./models/movement.model";

const router = Router();

// ─── Locations ────────────────────────────────────────────────────────────────

router.get("/api/locations", requireAuth, async (req: Request, res: Response) => {
  try {
    const locations = await LocationModel.find({ is_active: true }).sort({ zone: 1, rack: 1, shelf: 1, bin: 1 });
    res.json({ success: true, data: locations });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/api/locations", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { zone, rack, shelf, bin, posX, posY, posZ } = req.body;
    const label = `${zone}-${rack}-${shelf}-${bin}`;
    const location = await LocationModel.create({ zone, rack, shelf, bin, label, posX: posX ?? 0, posY: posY ?? 0, posZ: posZ ?? 0 });
    res.status(201).json({ success: true, data: location });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Inventory Items ──────────────────────────────────────────────────────────

router.get("/api/inventory", requireAuth, async (req: Request, res: Response) => {
  try {
    const { search, category, status, page = "1", limit = "50" } = req.query;
    const filter: Record<string, any> = { is_active: true };

    if (search) {
      const rx = new RegExp(String(search), "i");
      filter.$or = [{ name: rx }, { sku: rx }, { barcode: rx }];
    }
    if (category) filter.category = category;
    if (status) filter.stock_status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      InventoryItemModel.find(filter)
        .populate("location")
        .sort({ name: 1 })
        .skip(skip)
        .limit(Number(limit)),
      InventoryItemModel.countDocuments(filter),
    ]);

    res.json({ success: true, data: items, total, page: Number(page), limit: Number(limit) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/api/inventory/stats", requireAuth, async (req: Request, res: Response) => {
  try {
    const [
      totalItems,
      lowStockItems,
      outOfStockItems,
      totalLocations,
      occupiedLocations,
    ] = await Promise.all([
      InventoryItemModel.countDocuments({ is_active: true }),
      InventoryItemModel.countDocuments({ is_active: true, stock_status: StockStatus.LowStock }),
      InventoryItemModel.countDocuments({ is_active: true, stock_status: StockStatus.OutOfStock }),
      LocationModel.countDocuments({ is_active: true }),
      InventoryItemModel.countDocuments({ is_active: true, location: { $exists: true, $ne: null } }),
    ]);

    const valueAgg = await InventoryItemModel.aggregate([
      { $match: { is_active: true } },
      { $group: { _id: null, total: { $sum: { $multiply: ["$quantity", "$unit_price"] } } } },
    ]);
    const totalValue = valueAgg[0]?.total ?? 0;

    const categoryAgg = await InventoryItemModel.aggregate([
      { $match: { is_active: true } },
      { $group: { _id: "$category", count: { $sum: 1 }, totalQty: { $sum: "$quantity" } } },
      { $sort: { count: -1 } },
    ]);

    const occupancyRate = totalLocations > 0 ? Math.round((occupiedLocations / totalLocations) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalItems,
        lowStockItems,
        outOfStockItems,
        totalLocations,
        occupiedLocations,
        occupancyRate,
        totalValue,
        categoryBreakdown: categoryAgg,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/api/inventory/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const item = await InventoryItemModel.findById(req.params.id).populate("location");
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });
    res.json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/api/inventory", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, sku, barcode, description, category, quantity, min_quantity, unit_price, unit, location, image_url } = req.body;

    let stockStatus = StockStatus.InStock;
    if (quantity === 0) stockStatus = StockStatus.OutOfStock;
    else if (quantity <= min_quantity) stockStatus = StockStatus.LowStock;

    const item = await InventoryItemModel.create({
      name, sku, barcode, description, category,
      quantity: quantity ?? 0,
      min_quantity: min_quantity ?? 0,
      unit_price: unit_price ?? 0,
      unit, location, image_url,
      stock_status: stockStatus,
    });

    // Record initial inbound movement
    if (quantity > 0) {
      await MovementModel.create({
        item: item._id,
        type: MovementType.Inbound,
        quantity_change: quantity,
        quantity_before: 0,
        quantity_after: quantity,
        notes: "Initial stock",
        performed_by: req.user?.username,
        performed_by_id: req.user?.id,
      });
    }

    res.status(201).json({ success: true, data: item });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put("/api/inventory/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const item = await InventoryItemModel.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    const { name, sku, barcode, description, category, quantity, min_quantity, unit_price, unit, location, image_url } = req.body;

    const newQty = quantity ?? item.quantity;
    const newMinQty = min_quantity ?? item.min_quantity;
    let stockStatus = StockStatus.InStock;
    if (newQty === 0) stockStatus = StockStatus.OutOfStock;
    else if (newQty <= newMinQty) stockStatus = StockStatus.LowStock;

    Object.assign(item, {
      name: name ?? item.name,
      sku: sku ?? item.sku,
      barcode: barcode ?? item.barcode,
      description: description ?? item.description,
      category: category ?? item.category,
      quantity: newQty,
      min_quantity: newMinQty,
      unit_price: unit_price ?? item.unit_price,
      unit: unit ?? item.unit,
      location: location ?? item.location,
      image_url: image_url ?? item.image_url,
      stock_status: stockStatus,
    });
    await item.save();

    res.json({ success: true, data: item });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete("/api/inventory/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    await InventoryItemModel.findByIdAndUpdate(req.params.id, { is_active: false });
    res.json({ success: true, message: "Item removed" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Stock Updates (Employee action) ─────────────────────────────────────────

router.post("/api/inventory/:id/update-stock", requireAuth, async (req: Request, res: Response) => {
  try {
    const item = await InventoryItemModel.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    const { quantity_change, type, notes } = req.body;
    const change = Number(quantity_change);
    const quantityBefore = item.quantity;
    const quantityAfter = Math.max(0, quantityBefore + change);

    let stockStatus = StockStatus.InStock;
    if (quantityAfter === 0) stockStatus = StockStatus.OutOfStock;
    else if (quantityAfter <= item.min_quantity) stockStatus = StockStatus.LowStock;

    item.quantity = quantityAfter;
    item.stock_status = stockStatus;
    await item.save();

    await MovementModel.create({
      item: item._id,
      type: type ?? (change > 0 ? MovementType.Inbound : MovementType.Outbound),
      quantity_change: change,
      quantity_before: quantityBefore,
      quantity_after: quantityAfter,
      notes,
      performed_by: req.user?.username,
      performed_by_id: req.user?.id,
    });

    res.json({ success: true, data: item });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─── Movements ────────────────────────────────────────────────────────────────

router.get("/api/movements", requireAuth, async (req: Request, res: Response) => {
  try {
    const { item_id, limit = "20" } = req.query;
    const filter: Record<string, any> = {};
    if (item_id) filter.item = item_id;

    const movements = await MovementModel.find(filter)
      .populate("item", "name sku")
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({ success: true, data: movements });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
