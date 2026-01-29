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

  if (!file) return { success: false, message: "No file provided." };

  try {
    const text = await file.text();
    const jsonContent = JSON.parse(text);

    if (!jsonContent.nodes || !jsonContent.edges) {
      return { success: false, message: "Invalid JSON. Missing nodes/edges." };
    }

    await GraphLog.create({
      uploaderEmail,
      fileName: file.name,
      content: jsonContent,
      uploadedAt: new Date(),
    });

    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true, message: "Graph uploaded successfully!" };
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

export async function addNodeToGraph(nodeData: any) {
  const session = await auth();
  if (session?.user?.role !== "admin") return { error: "Unauthorized" };

  await dbConnect();
  const latest = await GraphLog.findOne().sort({ uploadedAt: -1 });

  const currentContent = latest ? latest.content : { nodes: [], edges: [] };
  const currentNodes = currentContent.nodes || [];
  const currentEdges = currentContent.edges || [];

  try {
    const newContent = {
      nodes: [...currentNodes, { data: nodeData }],
      edges: currentEdges,
    };

    await GraphLog.create({
      uploaderEmail: session.user.email,
      fileName: `Manual Add: ${nodeData.label}`,
      content: newContent,
      uploadedAt: new Date(),
    });

    revalidatePath("/");
    revalidatePath("/admin");
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
  const currentContent = latest ? latest.content : { nodes: [], edges: [] };

  try {
    const newContent = {
      nodes: currentContent.nodes,
      edges: [...(currentContent.edges || []), { data: edgeData }],
    };

    await GraphLog.create({
      uploaderEmail: session.user.email,
      fileName: `Manual Connect: ${edgeData.source} -> ${edgeData.target}`,
      content: newContent,
      uploadedAt: new Date(),
    });

    revalidatePath("/");
    revalidatePath("/admin");
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
    const oldNodes = latest.content.nodes || [];
    const oldEdges = latest.content.edges || [];

    const targetNode = oldNodes.find((n: any) => n.data.id === id);
    const label = targetNode ? targetNode.data.label : id;
    const isNode = !!targetNode;

    const newNodes = oldNodes.filter((n: any) => n.data.id !== id);
    const newEdges = oldEdges.filter(
      (e: any) =>
        e.data.id !== id && e.data.source !== id && e.data.target !== id,
    );

    const newContent = { nodes: newNodes, edges: newEdges };

    await GraphLog.create({
      uploaderEmail: session.user.email,
      fileName: `Manual Delete: ${isNode ? "Node" : "Edge"} '${label}'`,
      content: newContent,
      uploadedAt: new Date(),
    });

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to delete element" };
  }
}
