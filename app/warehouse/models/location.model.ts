import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { CommonTypegooseEntity } from "~/api/models/base/common-typegoose.entity";

@modelOptions({
  schemaOptions: {
    collection: "tbl_locations",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  },
})
export class Location extends CommonTypegooseEntity {
  @prop({ type: String, required: true })
  zone!: string; // e.g. "A", "B", "C", "D"

  @prop({ type: String, required: true })
  rack!: string; // e.g. "01", "02"

  @prop({ type: String, required: true })
  shelf!: string; // e.g. "1", "2", "3"

  @prop({ type: String, required: true })
  bin!: string; // e.g. "A", "B"

  @prop({ type: String })
  label?: string; // computed display like "A-01-1-A"

  // 3D position in warehouse model
  @prop({ type: Number, default: 0 })
  posX!: number;

  @prop({ type: Number, default: 0 })
  posY!: number;

  @prop({ type: Number, default: 0 })
  posZ!: number;

  @prop({ type: Boolean, default: true })
  is_active!: boolean;
}

export const LocationModel = getModelForClass(Location);
