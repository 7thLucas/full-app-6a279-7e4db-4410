/*
 * Default Configurable Data — seeded into Mongo on first boot.
 *
 * BEFORE EDITING: read ./RULES.md (especially R5: schema and defaults must
 * stay in sync) and ./configurables.schema.ts. For per-type schema and
 * default-value samples, see RULES.md §5 "Field Type Reference".
 */

export type TBrandColor = {
  primary: string;
  secondary: string;
  accent: string;
};

export type TZone = {
  id: string;
  name: string;
  color: string;
};

export type TDefaultConfigurableData = {
  appName: string;
  logoUrl: string;
  brandColor: TBrandColor;
  tagline?: string;
  warehouseName?: string;
  lowStockThresholdDefault?: number;
  itemsPerPage?: number;
  showInventoryValue?: boolean;
  enableBarcodeSearch?: boolean;
  currency?: string;
  zones?: TZone[];
};

export const defaultConfigurablesData: TDefaultConfigurableData = {
  appName: "WareVision 3D",
  logoUrl: "FILL_LOGO_URL_HERE",
  brandColor: {
    primary: "#F59E0B",
    secondary: "#10B981",
    accent: "#0F1629",
  },
  tagline: "See your warehouse in three dimensions. Find every item in seconds.",
  warehouseName: "Main Warehouse",
  lowStockThresholdDefault: 10,
  itemsPerPage: 50,
  showInventoryValue: true,
  enableBarcodeSearch: true,
  currency: "$",
  zones: [
    { id: "A", name: "Zone A — Electronics", color: "#3B82F6" },
    { id: "B", name: "Zone B — Office Supplies", color: "#14B8A6" },
    { id: "C", name: "Zone C — Tools & Hardware", color: "#8B5CF6" },
    { id: "D", name: "Zone D — Cleaning & Safety", color: "#F97316" },
  ],
};
