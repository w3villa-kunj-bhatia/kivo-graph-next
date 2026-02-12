import cytoscape from "cytoscape";

export const highlightNode = (cy: cytoscape.Core, nodeId: string) => {
  cy.batch(() => {
    cy.elements().removeClass("highlight dimmed");
    cy.elements().addClass("dimmed");

    const node = cy.getElementById(nodeId);

    const nbrs = node.neighborhood().add(node);
    nbrs.removeClass("dimmed").addClass("highlight");
    nbrs.edges().addClass("highlight");

    node.parent().removeClass("dimmed").addClass("highlight");
    nbrs.nodes().forEach((n) => {
      if (n.isNode() && n.parent().nonempty()) {
        n.parent().removeClass("dimmed").addClass("highlight");
      }
    });
  });
};

export const clearHighlights = (cy: cytoscape.Core) => {
  cy.batch(() => {
    cy.elements().removeClass("highlight dimmed");
  });
};

export const traceFlow = (
  cy: cytoscape.Core,
  nodeId: string,
  direction: "up" | "down",
) => {
  const node = cy.getElementById(nodeId);
  if (node.empty()) return;

  cy.batch(() => {
    cy.elements().removeClass("highlight dimmed");
    cy.elements().addClass("dimmed");

    const collection =
      direction === "up" ? node.predecessors() : node.successors();
    const path = collection.union(node);

    path.removeClass("dimmed").addClass("highlight");
    path.edges().addClass("highlight");

    path.nodes().forEach((n) => {
      if (n.isNode() && n.parent().nonempty())
        n.parent().removeClass("dimmed").addClass("highlight");
    });
  });
};

export const applyFiltersToGraph = (
  cy: cytoscape.Core,
  activeFilters: Set<string>,
) => {
  if (!cy || cy.destroyed()) return;

  cy.batch(() => {
    cy.nodes().forEach((n) => {
      if (n.isParent()) {
        const mod = n.data("module");
        if (mod && !activeFilters.has(mod)) {
          n.addClass("filtered-out");
        } else {
          n.removeClass("filtered-out");
        }
        return;
      }

      const mod = n.data("module");
      const complexity = n.data("complexity") || "normal";
      const archetype = n.data("archetype") || "Model";
      const degree = n.degree(false);

      let topology = "normal";
      if (degree === 0) topology = "orphan";
      else if (degree > 5) topology = "hub";

      const modMatch = !mod || activeFilters.has(mod);
      const riskMatch = activeFilters.has(complexity);
      const archMatch = activeFilters.has(archetype);
      const topoMatch = activeFilters.has(topology);

      if (modMatch && riskMatch && archMatch && topoMatch) {
        n.removeClass("filtered-out");
      } else {
        n.addClass("filtered-out");
      }
    });
  });
};
