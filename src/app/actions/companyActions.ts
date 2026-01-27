"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/dbConnect";
import Company from "@/models/Company";

/**
 * Fetches all companies from the DB.
 * Converts MongoDB objects to plain JSON to avoid Next.js serialization warnings.
 */
export async function getCompanies() {
  await dbConnect();

  try {
    const companies = await Company.find({}).sort({ createdAt: -1 }).lean();

    return companies.map((company: any) => ({
      ...company,
      _id: company._id.toString(), // Convert ObjectId to string
      createdAt: company.createdAt?.toISOString(),
    }));
  } catch (error) {
    console.error("Failed to fetch companies:", error);
    return [];
  }
}

/**
 * Creates a new company with the selected modules.
 */
export async function createCompany(prevState: any, formData: FormData) {
  await dbConnect();

  const name = formData.get("name") as string;
  // "modules" will be an array of values from checked checkboxes
  const allowedModules = formData.getAll("modules") as string[];

  if (!name) {
    return { success: false, message: "Company name is required" };
  }

  try {
    await Company.create({
      name,
      allowedModules,
    });

    // Refresh the admin page data immediately
    revalidatePath("/admin");

    return { success: true, message: "Company created successfully!" };
  } catch (error: any) {
    // specific error handling for duplicate names
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

/**
 * Deletes a company by ID
 */
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
