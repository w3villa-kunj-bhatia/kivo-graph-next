"use server";

import dbConnect from "@/lib/dbConnect";
import AccessPolicy from "@/models/AccessPolicy";
import { revalidatePath } from "next/cache";

export async function savePolicy(
  companyId: string,
  moduleId: string,
  features: string[],
) {
  await dbConnect();

  try {
    await AccessPolicy.findOneAndUpdate(
      { companyId, moduleId },
      { features },
      { upsert: true, new: true },
    );
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Policy save error:", error);
    return { success: false, message: "Failed to save policy" };
  }
}

export async function getCompanyPolicies(companyId: string) {
  await dbConnect();
  try {
    const policies = await AccessPolicy.find({ companyId }).lean();

    const policyMap: Record<string, string[]> = {};
    policies.forEach((p: any) => {
      policyMap[p.moduleId] = p.features || [];
    });

    return policyMap;
  } catch (error) {
    console.error("Error fetching policies:", error);
    return {};
  }
}
