import {
  prop,
  getModelForClass,
  modelOptions,
} from "@typegoose/typegoose";
import type { Ref } from "@typegoose/typegoose";
import { CommonTypegooseEntity } from "~/api/models/base/common-typegoose.entity";
import { InventoryItem } from "./inventory-item.model";

export enum MovementType {
  Inbound = "inbound",
  Outbound = "outbound",
  Transfer = "transfer",
  Adjustment = "adjustment",
}

@modelOptions({
  schemaOptions: {
    collection: "tbl_movements",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  },
})
export class Movement extends CommonTypegooseEntity {
  @prop({ ref: () => InventoryItem, required: true })
  item!: Ref<InventoryItem>;

  @prop({ type: String, enum: MovementType, required: true })
  type!: MovementType;

  @prop({ type: Number, required: true })
  quantity_change!: number; // positive for in, negative for out

  @prop({ type: Number, required: true })
  quantity_before!: number;

  @prop({ type: Number, required: true })
  quantity_after!: number;

  @prop({ type: String })
  notes?: string;

  @prop({ type: String })
  performed_by?: string; // username

  @prop({ type: String })
  performed_by_id?: string; // user id
}

export const MovementModel = getModelForClass(Movement);
