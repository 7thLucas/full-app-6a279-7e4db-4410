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

<<<<<<< HEAD
export type TZone = {
  id: string;
  name: string;
  color: string;
};

=======
>>>>>>> 7c6385e (chore(app-preview): inject skaffold + env configs)
export type TDefaultConfigurableData = {
  appName: string;
  logoUrl: string;
  brandColor: TBrandColor;
<<<<<<< HEAD
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
  appName: "MyWare",
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
=======
  // Mirror new schema fields here. Example:
  //   maxItemsPerPage?: number;
  //   enableNotifications?: boolean;
  //   featuredCategories?: string[];
};

export const defaultConfigurablesData: TDefaultConfigurableData = {
  appName: "FILL_APP_NAME_HERE",
  logoUrl: "FILL_LOGO_URL_HERE",
  brandColor: {
    primary: "FILL_PRIMARY_COLOR_HERE",
    secondary: "FILL_SECONDARY_COLOR_HERE",
    accent: "FILL_ACCENT_COLOR_HERE",
  },
  // ─────────────────────────────────────────────────────────────────────
  // Add new field defaults here. See RULES.md §5 for per-type shape.
  // Required branding fields → use the FILL_X_HERE placeholder pattern.
  // Optional/typed defaults → real value with a "// fill it here" comment:
  //
  //   maxItemsPerPage: 12,                     // fill it here
  //   enableNotifications: true,               // fill it here
  //   featuredCategories: [],                  // fill it here
  //   defaultLanguage: "en",                   // must match enum options
  //   launchDate: "2025-01-01T00:00:00.000Z",  // ISO-8601
  //   heroImage: "",                           // resolved URL after upload
  //   galleryImages: [],                       // array of resolved URLs
  // ─────────────────────────────────────────────────────────────────────
>>>>>>> 7c6385e (chore(app-preview): inject skaffold + env configs)
};
