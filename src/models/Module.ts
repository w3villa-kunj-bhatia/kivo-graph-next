import mongoose, { Schema, model, models } from "mongoose";

const ModuleSchema = new Schema({
  name: {
    type: String,
    required: [true, "Please provide a module name"],
    unique: true,
    trim: true,
  },
  color: {
    type: String,
    required: [true, "Please provide a color code"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Module = models.Module || model("Module", ModuleSchema);

export default Module;
