import mongoose, { Schema, model, models } from "mongoose";

const AccessPolicySchema = new Schema({
  companyId: {
    type: Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  moduleId: {
    type: String,
    required: true,
  },
  features: {
    type: [String],
    default: [],
  },
});

AccessPolicySchema.index({ companyId: 1, moduleId: 1 }, { unique: true });

const AccessPolicy =
  models.AccessPolicy || model("AccessPolicy", AccessPolicySchema);

export default AccessPolicy;
