import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGraphLayout extends Document {
  nodeId: string;
  x: number;
  y: number;
  context: string;
  updatedAt: Date;
}

const GraphLayoutSchema: Schema = new Schema(
  {
    nodeId: { type: String, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    context: { type: String, default: "global" },
  },
  { timestamps: true },
);

GraphLayoutSchema.index({ nodeId: 1, context: 1 }, { unique: true });

const GraphLayout: Model<IGraphLayout> =
  mongoose.models.GraphLayout ||
  mongoose.model<IGraphLayout>("GraphLayout", GraphLayoutSchema);

export default GraphLayout;
