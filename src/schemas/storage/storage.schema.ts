import { Schema } from "mongoose";
import { StorageInterface } from "./storage.interface";
const { ObjectId } = Schema.Types;

export const StorageSchema: Schema<StorageInterface> = new Schema(
  {
    code: { type: String, index: true, required: true },
    vendor: {
      id: ObjectId,
      code: String,
      name: String
    },
    materialWarehouse: {
      id: ObjectId,
      name: String,
      code: String
    },
    name: { type: String, required: true },
    dateExpired: { type: Date, required: true, index: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    discount: Number,
    dateImport: { type: Date, required: true },

    unitPrice: { type: Number, required: true },
    deleted: { type: Boolean, default: false },
    deletedAt: Date
  },
  { versionKey: false, timestamps: true }
);

StorageSchema.index({
  createdAt: -1
});

StorageSchema.index({
  updatedAt: -1
});
