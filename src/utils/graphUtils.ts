interface RawNode {
  data: {
    id: string;
    label: string;
    complexity?: string;
    module?: string; 
    isManual?: boolean; 
  };
}

interface RawEdge {
  data: {
    source: string;
    target: string;
    type?: string;
  };
}

interface GraphJson {
  nodes: RawNode[];
  edges: RawEdge[];
}

const cleanLabel = (l: string): string => {
  let s = l
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .trim();
  s = s.replace(/ Controller/i, "").replace(/ Service/i, "");
  return s.length > 20 ? s.substring(0, 18) + ".." : s;
};

export const classifyModule = (id: string, label: string): string => {
  const t = (id + " " + label).toLowerCase();

  if (t.match(/attend|leave|holiday|shift|salary|payroll|ctc/)) return "HRMS";
  if (t.match(/candid|interv|applic|hiring|resume|recruit/)) return "ATS";
  if (t.match(/deal|lead|invoice|quote|crm|client|bill/)) return "CRM";
  if (t.match(/project|sprint|story|epic|task|kanban/)) return "Projects";
  if (t.match(/chat|messag|channel|email|notif|comm/)) return "Comm";
  if (t.match(/ai_|openai|gpt|voice|eval/)) return "AI";
  if (t.match(/user|company|auth|login|role|setting|profile/)) return "Core";

  return "Utils";
};

export const processGraphData = (rawJson: GraphJson) => {
  const nodes: any[] = [];
  const edges: any[] = [];
  const groups = new Set<string>();

  const counts: Record<string, number> = {};
  const nodeModuleMap: Record<string, string> = {};

  rawJson.nodes.forEach((n) => {
    let mod;
    if (n.data.isManual && n.data.module) {
      mod = n.data.module;
    } else {
      mod = classifyModule(n.data.id, n.data.label);
    }

    nodeModuleMap[n.data.id] = mod;
  });

  rawJson.edges.forEach((e) => {
    counts[e.data.source] = (counts[e.data.source] || 0) + 1;
    counts[e.data.target] = (counts[e.data.target] || 0) + 1;
  });

  rawJson.nodes.forEach((n) => {
    const mod = nodeModuleMap[n.data.id];
    groups.add(mod);

    let arch = "Model";
    if (n.data.label.includes("Controller")) arch = "Controller";
    else if (n.data.label.includes("Service")) arch = "Service";

    const degree = counts[n.data.id] || 0;
    const complexity = n.data.complexity || (degree > 5 ? "high" : "normal");

    nodes.push({
      data: {
        id: n.data.id,
        label: cleanLabel(n.data.label),
        fullLabel: n.data.label,
        module: mod,
        parent: "g_" + mod,
        weight: degree,
        complexity: complexity,
        archetype: arch,
      },
    });
  });

  rawJson.edges.forEach((e) => {
    const sourceMod = nodeModuleMap[e.data.source];
    const targetMod = nodeModuleMap[e.data.target];

    edges.push({
      data: {
        source: e.data.source,
        target: e.data.target,
        type: e.data.type || "default",
        isInterModule: sourceMod !== targetMod,
      },
    });
  });

  groups.forEach((g) => {
    nodes.push({
      data: {
        id: "g_" + g,
        label: g,
        isGroup: true,
        module: g,
      },
    });
  });

  return { nodes, edges };
};
