import mongoose, { Schema, model, models } from "mongoose";

const GraphLogSchema = new Schema({
  uploaderEmail: { type: String, required: true },
  fileName: { type: String, required: true },
  content: { type: Object, required: true }, 
  uploadedAt: { type: Date, default: Date.now },
});

GraphLogSchema.index({ uploadedAt: -1 });

const GraphLog = models.GraphLog || model("GraphLog", GraphLogSchema);

export default GraphLog;
