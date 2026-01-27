"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function getUsers() {
  await dbConnect();
  try {
    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    return users.map((user: any) => ({
      ...user,
      _id: user._id.toString(),
      createdAt: user.createdAt?.toISOString(),
    }));
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return [];
  }
}

export async function toggleUserRole(userId: string, currentRole: string) {
  await dbConnect();
  try {
    const newRole = currentRole === "admin" ? "user" : "admin";
    await User.findByIdAndUpdate(userId, { role: newRole });
    revalidatePath("/admin");
    return { success: true, message: `User role updated to ${newRole}` };
  } catch (error) {
    return { success: false, message: "Failed to update role" };
  }
}

export async function deleteUser(userId: string) {
  await dbConnect();
  try {
    await User.findByIdAndDelete(userId);
    revalidatePath("/admin");
    return { success: true, message: "User deleted successfully" };
  } catch (error) {
    return { success: false, message: "Failed to delete user" };
  }
}
