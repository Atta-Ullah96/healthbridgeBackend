import mongoose from "mongoose";
const inventorySchema = new mongoose.Schema({
  laboratoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Laboratory", required: true },

  itemName: String,
  quantity: Number,
  threshold: Number
});

export const Inventory = mongoose.model("Inventory" , inventorySchema)