"use server";

import dbConnect from "@/lib/dbConnect";
import Module from "@/models/Module";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getModules() {
  await dbConnect();
  const modules = await Module.find({}).sort({ name: 1 }).lean();
  return modules.map((m: any) => ({
    _id: m._id.toString(),
    name: m.name,
    color: m.color,
  }));
}

export async function saveModule(prevState: any, formData: FormData) {
  await dbConnect();
  const session = await auth();

  if (session?.user?.role !== "admin") {
    return { success: false, message: "Unauthorized: Admin access required." };
  }

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const color = formData.get("color") as string;

  if (!name || !color) {
    return { success: false, message: "Name and Color are required." };
  }

  try {
    const query: any = {
      name: { $regex: new RegExp(`^${name}$`, "i") },
    };
    if (id) {
      query._id = { $ne: id };
    }

    const existing = await Module.findOne(query);
    if (existing) {
      return { success: false, message: "Module name already exists." };
    }

    if (id) {
      await Module.findByIdAndUpdate(id, { name, color });
      revalidatePath("/admin");
      revalidatePath("/");
      return { success: true, message: "Module updated successfully!" };
    } else {
      await Module.create({ name, color });
      revalidatePath("/admin");
      revalidatePath("/");
      return { success: true, message: "Module created successfully!" };
    }
  } catch (error) {
    console.error("Save module error:", error);
    return { success: false, message: "Failed to save module." };
  }
}

export async function deleteModule(id: string) {
  await dbConnect();
  const session = await auth();

  if (session?.user?.role !== "admin") {
    return { success: false, message: "Unauthorized" };
  }

  try {
    await Module.findByIdAndDelete(id);
    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true, message: "Module deleted." };
  } catch (error) {
    console.error("Delete module error:", error);
    return { success: false, message: "Failed to delete module." };
  }
}
