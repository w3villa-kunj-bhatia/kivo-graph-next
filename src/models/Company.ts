import mongoose, { Schema, model, models } from "mongoose";

const CompanySchema = new Schema({
  name: {
    type: String,
    required: [true, "Please provide a company name"],
    unique: true,
    trim: true,
  },
  allowedModules: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Company = models.Company || model("Company", CompanySchema);

export default Company;
