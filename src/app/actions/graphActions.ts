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

// --- NEW EDITOR ACTIONS ---

export async function addNodeToGraph(nodeData: any) {
  const session = await auth();
  if (session?.user?.role !== "admin") return { error: "Unauthorized" };

  await dbConnect();
  const latest = await GraphLog.findOne().sort({ uploadedAt: -1 });
  if (!latest) return { error: "No active graph found to edit" };

  try {
    const newContent = { ...latest.content };
    // Wrap data in format expected by schema if needed, usually just push the node object
    newContent.nodes.push({ data: nodeData });

    latest.content = newContent;
    latest.markModified("content"); // Essential for Mixed types
    await latest.save();

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to save node" };
  }
}

export async function addEdgeToGraph(edgeData: any) {
  const session = await auth();
  if (session?.user?.role !== "admin") return { error: "Unauthorized" };

  await dbConnect();
  const latest = await GraphLog.findOne().sort({ uploadedAt: -1 });
  if (!latest) return { error: "No active graph found" };

  try {
    const newContent = { ...latest.content };
    newContent.edges.push({ data: edgeData });

    latest.content = newContent;
    latest.markModified("content");
    await latest.save();

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to save edge" };
  }
}

export async function deleteGraphElement(id: string) {
  const session = await auth();
  if (session?.user?.role !== "admin") return { error: "Unauthorized" };

  await dbConnect();
  const latest = await GraphLog.findOne().sort({ uploadedAt: -1 });
  if (!latest) return { error: "No active graph found" };

  try {
    const newContent = { ...latest.content };

    // Filter out the node
    newContent.nodes = newContent.nodes.filter((n: any) => n.data.id !== id);

    // Filter out edges connected to this ID or the edge itself
    newContent.edges = newContent.edges.filter(
      (e: any) =>
        e.data.id !== id && e.data.source !== id && e.data.target !== id,
    );

    latest.content = newContent;
    latest.markModified("content");
    await latest.save();

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to delete element" };
  }
}
