import {
  prop,
  getModelForClass,
  modelOptions,
  Ref,
} from "@typegoose/typegoose";
import { CommonTypegooseEntity } from "~/api/models/base/common-typegoose.entity";
import { Location } from "./location.model";

export enum StockStatus {
  InStock = "in_stock",
  LowStock = "low_stock",
  OutOfStock = "out_of_stock",
}

@modelOptions({
  schemaOptions: {
    collection: "tbl_inventory_items",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  },
})
export class InventoryItem extends CommonTypegooseEntity {
  @prop({ type: String, required: true, trim: true })
  name!: string;

  @prop({ type: String, required: true, unique: true, trim: true, uppercase: true })
  sku!: string;

  @prop({ type: String, trim: true })
  barcode?: string;

  @prop({ type: String, trim: true })
  description?: string;

  @prop({ type: String, trim: true })
  category?: string;

  @prop({ type: Number, required: true, default: 0, min: 0 })
  quantity!: number;

  @prop({ type: Number, required: true, default: 0, min: 0 })
  min_quantity!: number; // low stock threshold

  @prop({ type: Number, default: 0 })
  unit_price!: number;

  @prop({ type: String })
  unit?: string; // e.g. "pcs", "kg", "box"

  @prop({ ref: () => Location })
  location?: Ref<Location>;

  @prop({ type: String, enum: StockStatus, default: StockStatus.InStock })
  stock_status!: StockStatus;

  @prop({ type: Boolean, default: true })
  is_active!: boolean;

  @prop({ type: String })
  image_url?: string;
}

export const InventoryItemModel = getModelForClass(InventoryItem);
