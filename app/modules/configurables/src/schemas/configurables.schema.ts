/* START: THIS SECTION CODE IS CANNOT BE CHANGED, YOU ONLY READ IT */
export interface FieldSchemaType {
  fieldName?: string;
  type:
    | "string"
    | "number"
    | "boolean"
    | "object"
    | "array"
    | "color"
    | "url"
    | "enum"
    | "datetime"
    | "file"
    | "files";
  required?: boolean;
  label?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  options?: string[];
  fields?: FieldSchemaType[];
  item?: FieldSchemaType;
}
/* END: THIS SECTION CODE IS CANNOT BE CHANGED, YOU ONLY READ IT */

export type ConfigurableSchemas = {
  formSchema: FieldSchemaType[];
};

export const configurableSchemas: ConfigurableSchemas = {
  formSchema: [
    {
      fieldName: "appName",
      type: "string",
      required: true,
      label: "App Name",
    },
    {
      fieldName: "logoUrl",
      type: "url",
      required: true,
      label: "Logo URL",
    },
    {
      fieldName: "brandColor",
      type: "object",
      required: true,
      label: "Brand Color",
      fields: [
        { fieldName: "primary", type: "color", required: true, label: "Primary (Amber)" },
        { fieldName: "secondary", type: "color", required: true, label: "Secondary (Emerald)" },
        { fieldName: "accent", type: "color", required: true, label: "Accent (Navy)" },
      ],
    },
    {
      fieldName: "tagline",
      type: "string",
      required: false,
      label: "Tagline",
    },
    {
      fieldName: "warehouseName",
      type: "string",
      required: false,
      label: "Warehouse Name",
    },
    {
      fieldName: "lowStockThresholdDefault",
      type: "number",
      required: false,
      label: "Default Low Stock Threshold",
      min: 1,
      max: 1000,
    },
    {
      fieldName: "itemsPerPage",
      type: "number",
      required: false,
      label: "Items Per Page",
      min: 10,
      max: 100,
    },
    {
      fieldName: "showInventoryValue",
      type: "boolean",
      required: false,
      label: "Show Inventory Value on Dashboard",
    },
    {
      fieldName: "enableBarcodeSearch",
      type: "boolean",
      required: false,
      label: "Enable Barcode Search",
    },
    {
      fieldName: "currency",
      type: "string",
      required: false,
      label: "Currency Symbol",
    },
    {
      fieldName: "zones",
      type: "array",
      required: false,
      label: "Warehouse Zones",
      item: {
        type: "object",
        fields: [
          { fieldName: "id", type: "string", required: true, label: "Zone ID" },
          { fieldName: "name", type: "string", required: true, label: "Zone Name" },
          { fieldName: "color", type: "color", required: true, label: "Zone Color" },
        ],
      },
    },
  ],
};
