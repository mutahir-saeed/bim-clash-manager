/**
 * Identify false positives and irrelevant clashes based on rule sets.
 * Returns the classification: "relevant", "irrelevant", or "review"
 */

export function classifyRelevance(clash) {
  const distMm = Math.abs(clash.distance) * 1000;

  // 1. Absolute tolerance check (< 5mm is usually a modeling tolerance/rounding issue)
  if (distMm < 5) {
    return {
      status: "irrelevant",
      reason: "Distance < 5mm (Tolerance)",
    };
  }

  // 2. Same-discipline touching/minor overlap (< 10mm)
  if (clash.obj1_discipline === clash.obj2_discipline && distMm < 10) {
    return {
      status: "irrelevant",
      reason: "Same discipline < 10mm",
    };
  }

  // 3. Architectural finishes (IfcCovering) vs Walls/Slabs
  const isFinish1 = clash.obj1_ifcType === "IfcCovering";
  const isFinish2 = clash.obj2_ifcType === "IfcCovering";
  const isWallOrSlab1 = clash.obj1_ifcType === "IfcWall" || clash.obj1_ifcType === "IfcSlab";
  const isWallOrSlab2 = clash.obj2_ifcType === "IfcWall" || clash.obj2_ifcType === "IfcSlab";

  if ((isFinish1 && isWallOrSlab2) || (isFinish2 && isWallOrSlab1)) {
    return {
      status: "irrelevant",
      reason: "Finishes vs Host Element",
    };
  }

  // 4. Structural connections (Beam vs Column) under 20mm often acceptable or handled by connections
  const isBeam1 = clash.obj1_ifcType === "IfcBeam";
  const isBeam2 = clash.obj2_ifcType === "IfcBeam";
  const isColumn1 = clash.obj1_ifcType === "IfcColumn";
  const isColumn2 = clash.obj2_ifcType === "IfcColumn";

  if (((isBeam1 && isColumn2) || (isBeam2 && isColumn1)) && distMm < 20) {
    return {
      status: "review",
      reason: "Beam/Column connection overlap",
    };
  }

  return {
    status: "relevant",
    reason: "",
  };
}

/**
 * Filter and annotate clashes with their relevance
 */
export function applyRelevance(clashes) {
  let relevantCount = 0;
  let irrelevantCount = 0;

  const annotated = clashes.map((c) => {
    const relevance = classifyRelevance(c);
    if (relevance.status === "irrelevant") irrelevantCount++;
    else relevantCount++;

    return {
      ...c,
      relevanceStatus: relevance.status, // "relevant" | "irrelevant" | "review"
      relevanceReason: relevance.reason,
    };
  });

  return {
    annotatedClashes: annotated,
    relevantCount,
    irrelevantCount,
    noiseReductionPercent:
      clashes.length > 0 ? (irrelevantCount / clashes.length) * 100 : 0,
  };
}
