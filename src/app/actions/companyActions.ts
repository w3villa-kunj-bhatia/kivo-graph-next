"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/dbConnect";
import Company from "@/models/Company";
import User from "@/models/User";
import { COLORS } from "@/utils/constants";

// --- NEW: Statistics Action ---
export async function getStatistics() {
  await dbConnect();

  try {
    const [companyCount, userCount] = await Promise.all([
      Company.countDocuments(),
      User.countDocuments(),
    ]);

    // Modules are hardcoded in constants.ts, so we just count the keys
    const moduleCount = Object.keys(COLORS).length;

    return {
      companyCount,
      userCount,
      moduleCount,
    };
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return { companyCount: 0, userCount: 0, moduleCount: 0 };
  }
}
// ------------------------------

/**
 * Fetches all companies from the DB.
 */
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
    console.error("Failed to fetch companies:", error);
    return [];
  }
}

/**
 * Creates a new company
 */
export async function createCompany(prevState: any, formData: FormData) {
  await dbConnect();

  const name = formData.get("name") as string;
  const allowedModules = formData.getAll("modules") as string[];

  if (!name) {
    return { success: false, message: "Company name is required" };
  }

  try {
    await Company.create({
      name,
      allowedModules,
    });

    revalidatePath("/admin");
    return { success: true, message: "Company created successfully!" };
  } catch (error: any) {
    if (error.code === 11000) {
      return {
        success: false,
        message: "A company with this name already exists.",
      };
    }
    return {
      success: false,
      message: "Server Error: Failed to create company.",
    };
  }
}

export async function deleteCompany(companyId: string) {
  await dbConnect();
  try {
    await Company.findByIdAndDelete(companyId);
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { success: false, message: "Failed to delete" };
  }
}
