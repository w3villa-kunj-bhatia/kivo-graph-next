"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/dbConnect";
import GraphLog from "@/models/GraphLog";
import { auth } from "@/auth";

export async function uploadGraph(prevState: any, formData: FormData) {
  await dbConnect();

  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { success: false, message: "Unauthorized: Admin access required." };
  }

  const file = formData.get("file") as File;
  const uploaderEmail = session.user.email;

  if (!file) {
    return { success: false, message: "No file provided." };
  }

  try {
    const text = await file.text();
    const jsonContent = JSON.parse(text);

    if (!jsonContent.nodes || !jsonContent.edges) {
      return {
        success: false,
        message: "Invalid JSON structure. Missing nodes/edges.",
      };
    }

    await GraphLog.create({
      uploaderEmail,
      fileName: file.name,
      content: jsonContent,
      uploadedAt: new Date(),
    });

    revalidatePath("/admin");
    revalidatePath("/");
    return {
      success: true,
      message: "Graph uploaded and activated successfully!",
    };
  } catch (error) {
    console.error("Upload error:", error);
    return { success: false, message: "Failed to process file." };
  }
}

export async function getGraphLogs() {
  await dbConnect();
  const logs = await GraphLog.find({}, "-content")
    .sort({ uploadedAt: -1 })
    .lean();

  return logs.map((log: any) => ({
    ...log,
    _id: log._id.toString(),
    uploadedAt: log.uploadedAt.toISOString(),
  }));
}

export async function getActiveGraph() {
  await dbConnect();
  const latest = await GraphLog.findOne().sort({ uploadedAt: -1 }).lean();

  if (!latest) return null;

  return {
    nodes: latest.content.nodes,
    edges: latest.content.edges,
  };
}
