"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/dbConnect";
import Company from "@/models/Company";
import User from "@/models/User";
import { COLORS } from "@/utils/constants";

// ... (keep getStatistics and getCompanies as they are) ...

export async function getStatistics() {
  await dbConnect();
  try {
    const [companyCount, userCount] = await Promise.all([
      Company.countDocuments(),
      User.countDocuments(),
    ]);
    const moduleCount = Object.keys(COLORS).length;
    return { companyCount, userCount, moduleCount };
  } catch (error) {
    return { companyCount: 0, userCount: 0, moduleCount: 0 };
  }
}

export async function getCompanies() {
  await dbConnect();
  try {
    const companies = await Company.find({}).sort({ createdAt: -1 }).lean();
    return companies.map((company: any) => ({
      ...company,
      _id: company._id.toString(),
      createdAt: company.createdAt?.toISOString(),
    }));
  } catch (error) {
    return [];
  }
}

// --- UPDATED SAVE FUNCTION ---
export async function saveCompany(prevState: any, formData: FormData) {
  await dbConnect();

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const allowedModules = formData.getAll("modules") as string[];

  if (!name) {
    return {
      success: false,
      message: "Company name is required",
      timestamp: Date.now(),
    };
  }

  try {
    if (id) {
      await Company.findByIdAndUpdate(id, { name, allowedModules });
      revalidatePath("/admin");
      return {
        success: true,
        message: "Company updated successfully!",
        timestamp: Date.now(),
      };
    } else {
      await Company.create({ name, allowedModules });
      revalidatePath("/admin");
      return {
        success: true,
        message: "Company created successfully!",
        timestamp: Date.now(),
      };
    }
  } catch (error: any) {
    if (error.code === 11000) {
      return {
        success: false,
        message: "Name already exists.",
        timestamp: Date.now(),
      };
    }
    return {
      success: false,
      message: "Operation failed.",
      timestamp: Date.now(),
    };
  }
}

// ... (keep deleteCompany as is) ...
export async function deleteCompany(companyId: string) {
  await dbConnect();
  await Company.findByIdAndDelete(companyId);
  revalidatePath("/admin");
  return { success: true };
}
