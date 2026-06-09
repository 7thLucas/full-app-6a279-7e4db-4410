import bcrypt from "bcryptjs";
import { createLogger } from "~/lib/logger";
import { LocationModel } from "./models/location.model";
import { InventoryItemModel, StockStatus } from "./models/inventory-item.model";
import { UserModel } from "~/modules/authentication/authentication.model";
import { UserRole } from "~/modules/authentication/authentication.types";

const logger = createLogger("WarehouseSeed");

// WareVision warehouse: 4 zones (A, B, C, D), 3 racks each, 3 shelves, 3 bins
// Positions correspond to 3D model layout
const ZONES = [
  { id: "A", color: "blue", startX: -15 },
  { id: "B", color: "teal", startX: -5 },
  { id: "C", color: "violet", startX: 5 },
  { id: "D", color: "orange", startX: 15 },
];

const RACKS = ["01", "02", "03"];
const SHELVES = ["1", "2", "3"];
const BINS = ["A", "B", "C"];

async function seedLocations(): Promise<Map<string, string>> {
  const existing = await LocationModel.countDocuments();
  if (existing > 0) {
    const locs = await LocationModel.find({});
    const locMap = new Map<string, string>();
    locs.forEach((l) => locMap.set(l.label!, String(l._id)));
    logger.info(`Locations already seeded (${existing} found)`);
    return locMap;
  }

  logger.info("Seeding warehouse locations...");
  const locMap = new Map<string, string>();

  for (const zone of ZONES) {
    for (let ri = 0; ri < RACKS.length; ri++) {
      const rack = RACKS[ri];
      for (let si = 0; si < SHELVES.length; si++) {
        const shelf = SHELVES[si];
        for (let bi = 0; bi < BINS.length; bi++) {
          const bin = BINS[bi];
          const label = `${zone.id}-${rack}-${shelf}-${bin}`;

          // 3D positions
          const posX = zone.startX + bi * 2;
          const posY = si * 1.5 + 0.75;
          const posZ = ri * 3 - 3;

          const loc = await LocationModel.create({
            zone: zone.id,
            rack,
            shelf,
            bin,
            label,
            posX,
            posY,
            posZ,
          });
          locMap.set(label, String(loc._id));
        }
      }
    }
  }

  logger.info(`Seeded ${locMap.size} locations`);
  return locMap;
}

export async function seedWarehouse(): Promise<void> {
  try {
    const locMap = await seedLocations();

    // Seed demo users (manager + employees)
    const existingUsers = await UserModel.countDocuments({ role: { $in: [UserRole.Admin, UserRole.Authenticated] } });
    if (existingUsers === 0) {
      logger.info("Seeding demo users...");
      const hash = await bcrypt.hash("Demo1234!", 12);
      await UserModel.insertMany([
        { username: "manager", email: "manager@warevision.demo", password_hash: hash, role: UserRole.Admin, is_active: true, profile: { displayName: "Sarah Chen", jobTitle: "Warehouse Manager" } },
        { username: "employee1", email: "employee1@warevision.demo", password_hash: hash, role: UserRole.Authenticated, is_active: true, profile: { displayName: "Alex Rivera", jobTitle: "Warehouse Associate" } },
        { username: "employee2", email: "employee2@warevision.demo", password_hash: hash, role: UserRole.Authenticated, is_active: true, profile: { displayName: "Jordan Kim", jobTitle: "Inventory Specialist" } },
      ]);
    }

    const existingItems = await InventoryItemModel.countDocuments();
    if (existingItems > 0) {
      logger.info(`Inventory already seeded (${existingItems} items)`);
      return;
    }

    logger.info("Seeding inventory items...");

    const items = [
      // Zone A — Electronics
      { name: "Wireless Keyboard Model K520", sku: "ELEC-KB-K520", barcode: "4011199148148", category: "Electronics", quantity: 45, min_quantity: 10, unit_price: 29.99, unit: "pcs", location: locMap.get("A-01-1-A") },
      { name: "USB-C Hub 7-Port", sku: "ELEC-HUB-7P", barcode: "4011199148149", category: "Electronics", quantity: 8, min_quantity: 10, unit_price: 39.99, unit: "pcs", location: locMap.get("A-01-1-B") },
      { name: "Mechanical Mouse MX700", sku: "ELEC-MS-MX700", barcode: "4011199148150", category: "Electronics", quantity: 32, min_quantity: 8, unit_price: 49.99, unit: "pcs", location: locMap.get("A-01-2-A") },
      { name: 'LED Monitor 27" 4K', sku: "ELEC-MON-27K4", barcode: "4011199148151", category: "Electronics", quantity: 5, min_quantity: 3, unit_price: 399.99, unit: "pcs", location: locMap.get("A-01-2-B") },
      { name: "Laptop Stand Adjustable", sku: "ELEC-LS-ADJ", barcode: "4011199148152", category: "Electronics", quantity: 60, min_quantity: 15, unit_price: 24.99, unit: "pcs", location: locMap.get("A-01-3-A") },
      { name: "HDMI Cable 2m", sku: "ELEC-CAB-HDMI2", barcode: "4011199148153", category: "Electronics", quantity: 0, min_quantity: 20, unit_price: 9.99, unit: "pcs", location: locMap.get("A-02-1-A") },
      { name: "Power Strip 6-Outlet", sku: "ELEC-PS-6OT", barcode: "4011199148154", category: "Electronics", quantity: 22, min_quantity: 10, unit_price: 19.99, unit: "pcs", location: locMap.get("A-02-1-B") },
      { name: "Webcam HD 1080p", sku: "ELEC-WC-1080", barcode: "4011199148155", category: "Electronics", quantity: 14, min_quantity: 5, unit_price: 69.99, unit: "pcs", location: locMap.get("A-02-2-A") },
      { name: "Headset Pro Noise Cancel", sku: "ELEC-HS-PNC", barcode: "4011199148156", category: "Electronics", quantity: 9, min_quantity: 10, unit_price: 129.99, unit: "pcs", location: locMap.get("A-02-2-B") },
      { name: "Desk LED Light Bar", sku: "ELEC-LB-DSK", barcode: "4011199148157", category: "Electronics", quantity: 40, min_quantity: 10, unit_price: 34.99, unit: "pcs", location: locMap.get("A-03-1-A") },

      // Zone B — Office Supplies
      { name: "A4 Copy Paper 500 sheets", sku: "OFF-PP-A4-500", barcode: "5900636100016", category: "Office Supplies", quantity: 200, min_quantity: 50, unit_price: 5.99, unit: "ream", location: locMap.get("B-01-1-A") },
      { name: "Ballpoint Pen Box Blue", sku: "OFF-PEN-BLU-50", barcode: "5900636100017", category: "Office Supplies", quantity: 85, min_quantity: 20, unit_price: 4.99, unit: "box", location: locMap.get("B-01-1-B") },
      { name: "Stapler Heavy Duty", sku: "OFF-STP-HD", barcode: "5900636100018", category: "Office Supplies", quantity: 18, min_quantity: 5, unit_price: 12.99, unit: "pcs", location: locMap.get("B-01-2-A") },
      { name: "Sticky Notes 3x3 Yellow", sku: "OFF-SN-YLW-3", barcode: "5900636100019", category: "Office Supplies", quantity: 150, min_quantity: 30, unit_price: 2.49, unit: "pack", location: locMap.get("B-01-2-B") },
      { name: "Whiteboard Markers Set", sku: "OFF-WBM-SET", barcode: "5900636100020", category: "Office Supplies", quantity: 7, min_quantity: 10, unit_price: 8.99, unit: "set", location: locMap.get("B-02-1-A") },
      { name: "File Folders Letter 100pk", sku: "OFF-FF-LTR-100", barcode: "5900636100021", category: "Office Supplies", quantity: 40, min_quantity: 10, unit_price: 14.99, unit: "pack", location: locMap.get("B-02-1-B") },
      { name: "Scissors Stainless Steel", sku: "OFF-SCI-SS", barcode: "5900636100022", category: "Office Supplies", quantity: 30, min_quantity: 8, unit_price: 6.99, unit: "pcs", location: locMap.get("B-02-2-A") },
      { name: "Tape Dispenser + 3 Rolls", sku: "OFF-TD-3R", barcode: "5900636100023", category: "Office Supplies", quantity: 25, min_quantity: 5, unit_price: 9.49, unit: "pcs", location: locMap.get("B-02-2-B") },
      { name: "Desk Organizer 5-Section", sku: "OFF-DO-5S", barcode: "5900636100024", category: "Office Supplies", quantity: 12, min_quantity: 5, unit_price: 18.99, unit: "pcs", location: locMap.get("B-03-1-A") },
      { name: "Correction Tape Rollers 5pk", sku: "OFF-CT-5PK", barcode: "5900636100025", category: "Office Supplies", quantity: 60, min_quantity: 15, unit_price: 3.99, unit: "pack", location: locMap.get("B-03-1-B") },

      // Zone C — Tools & Hardware
      { name: "Power Drill Cordless 18V", sku: "TOOL-DR-18V", barcode: "3253561001001", category: "Tools", quantity: 6, min_quantity: 3, unit_price: 89.99, unit: "pcs", location: locMap.get("C-01-1-A") },
      { name: "Screwdriver Set 12pc", sku: "TOOL-SD-12PC", barcode: "3253561001002", category: "Tools", quantity: 20, min_quantity: 5, unit_price: 24.99, unit: "set", location: locMap.get("C-01-1-B") },
      { name: "Measuring Tape 5m", sku: "TOOL-MT-5M", barcode: "3253561001003", category: "Tools", quantity: 35, min_quantity: 10, unit_price: 7.99, unit: "pcs", location: locMap.get("C-01-2-A") },
      { name: "Work Gloves Leather L", sku: "TOOL-WGL-L", barcode: "3253561001004", category: "Tools", quantity: 4, min_quantity: 10, unit_price: 11.99, unit: "pair", location: locMap.get("C-01-2-B") },
      { name: "Safety Helmet Yellow", sku: "TOOL-SHY", barcode: "3253561001005", category: "Safety", quantity: 15, min_quantity: 5, unit_price: 19.99, unit: "pcs", location: locMap.get("C-02-1-A") },
      { name: "Box Cutter Heavy Duty", sku: "TOOL-BC-HD", barcode: "3253561001006", category: "Tools", quantity: 28, min_quantity: 10, unit_price: 5.49, unit: "pcs", location: locMap.get("C-02-1-B") },
      { name: "Packing Tape Rolls 6pk", sku: "TOOL-PT-6PK", barcode: "3253561001007", category: "Packaging", quantity: 80, min_quantity: 20, unit_price: 12.99, unit: "pack", location: locMap.get("C-02-2-A") },
      { name: "Bubble Wrap Roll 50m", sku: "TOOL-BW-50M", barcode: "3253561001008", category: "Packaging", quantity: 10, min_quantity: 5, unit_price: 18.99, unit: "roll", location: locMap.get("C-02-2-B") },
      { name: "Zip Ties Assorted 200pk", sku: "TOOL-ZT-200", barcode: "3253561001009", category: "Tools", quantity: 45, min_quantity: 10, unit_price: 8.99, unit: "pack", location: locMap.get("C-03-1-A") },
      { name: "Label Maker Industrial", sku: "TOOL-LM-IND", barcode: "3253561001010", category: "Tools", quantity: 3, min_quantity: 2, unit_price: 79.99, unit: "pcs", location: locMap.get("C-03-1-B") },

      // Zone D — Cleaning & Maintenance
      { name: "Microfiber Cloths 10pk", sku: "CLN-MF-10PK", barcode: "6281003069561", category: "Cleaning", quantity: 50, min_quantity: 15, unit_price: 8.99, unit: "pack", location: locMap.get("D-01-1-A") },
      { name: "All-Purpose Cleaner 5L", sku: "CLN-APC-5L", barcode: "6281003069562", category: "Cleaning", quantity: 20, min_quantity: 8, unit_price: 14.99, unit: "bottle", location: locMap.get("D-01-1-B") },
      { name: "Mop Floor Set", sku: "CLN-MOP-FS", barcode: "6281003069563", category: "Cleaning", quantity: 8, min_quantity: 3, unit_price: 29.99, unit: "set", location: locMap.get("D-01-2-A") },
      { name: "Nitrile Gloves 100pk M", sku: "CLN-NG-100M", barcode: "6281003069564", category: "Safety", quantity: 12, min_quantity: 20, unit_price: 12.99, unit: "box", location: locMap.get("D-01-2-B") },
      { name: "Trash Bags 50pk 65L", sku: "CLN-TB-50-65L", barcode: "6281003069565", category: "Cleaning", quantity: 100, min_quantity: 25, unit_price: 9.99, unit: "pack", location: locMap.get("D-02-1-A") },
      { name: "Dust Pan & Broom Set", sku: "CLN-DPB-SET", barcode: "6281003069566", category: "Cleaning", quantity: 10, min_quantity: 3, unit_price: 15.99, unit: "set", location: locMap.get("D-02-1-B") },
      { name: "Hand Sanitizer 500ml", sku: "CLN-HS-500", barcode: "6281003069567", category: "Safety", quantity: 35, min_quantity: 10, unit_price: 6.99, unit: "bottle", location: locMap.get("D-02-2-A") },
      { name: "Disinfectant Wipes 80ct", sku: "CLN-DW-80", barcode: "6281003069568", category: "Cleaning", quantity: 30, min_quantity: 10, unit_price: 4.99, unit: "tub", location: locMap.get("D-02-2-B") },
      { name: "Safety Vest High-Vis XL", sku: "CLN-SV-HV-XL", barcode: "6281003069569", category: "Safety", quantity: 6, min_quantity: 8, unit_price: 12.99, unit: "pcs", location: locMap.get("D-03-1-A") },
      { name: "First Aid Kit Complete", sku: "CLN-FAK-COMP", barcode: "6281003069570", category: "Safety", quantity: 4, min_quantity: 2, unit_price: 39.99, unit: "kit", location: locMap.get("D-03-1-B") },
    ];

    for (const item of items) {
      let stockStatus = StockStatus.InStock;
      if (item.quantity === 0) stockStatus = StockStatus.OutOfStock;
      else if (item.quantity <= item.min_quantity) stockStatus = StockStatus.LowStock;

      await InventoryItemModel.create({ ...item, stock_status: stockStatus });
    }

    logger.info(`Seeded ${items.length} inventory items`);
  } catch (error) {
    logger.error("Warehouse seed failed:", error);
  }
}
