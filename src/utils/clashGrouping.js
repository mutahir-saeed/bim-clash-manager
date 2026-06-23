/**
 * Group clashes based on physical proximity and shared elements.
 * 
 * Rules for grouping:
 * 1. Must share at least one element (obj1_elementId or obj2_elementId)
 * 2. Must be within the specified radius (e.g., 500mm = 0.5m)
 * 3. Must be on the same floor
 */

export function groupClashes(clashes, radiusMeters = 1.0) {
  if (!clashes || clashes.length === 0) return [];

  const groups = [];
  const processed = new Set();

  for (let i = 0; i < clashes.length; i++) {
    const c1 = clashes[i];
    if (processed.has(c1.id)) continue;

    // Start a new group
    const group = {
      id: `group-${c1.id}`,
      primaryClash: c1,
      clashes: [c1],
      sharedElementId: null,
      sharedElementName: null,
    };
    processed.add(c1.id);

    // Find other clashes that share an element and are within radius
    for (let j = i + 1; j < clashes.length; j++) {
      const c2 = clashes[j];
      if (processed.has(c2.id)) continue;

      // Must be on same floor
      if (c1.floor !== c2.floor) continue;

      // Check for shared element
      let sharedId = null;
      let sharedName = null;

      if (c1.obj1_elementId === c2.obj1_elementId) {
        sharedId = c1.obj1_elementId;
        sharedName = c1.obj1_elementName;
      } else if (c1.obj1_elementId === c2.obj2_elementId) {
        sharedId = c1.obj1_elementId;
        sharedName = c1.obj1_elementName;
      } else if (c1.obj2_elementId === c2.obj1_elementId) {
        sharedId = c1.obj2_elementId;
        sharedName = c1.obj2_elementName;
      } else if (c1.obj2_elementId === c2.obj2_elementId) {
        sharedId = c1.obj2_elementId;
        sharedName = c1.obj2_elementName;
      }

      if (!sharedId) continue;

      // Check physical distance (x, y, z are in meters)
      const dx = c1.x - c2.x;
      const dy = c1.y - c2.y;
      const dz = c1.z - c2.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist <= radiusMeters) {
        group.clashes.push(c2);
        group.sharedElementId = sharedId;
        group.sharedElementName = sharedName;
        processed.add(c2.id);
      }
    }

    groups.push(group);
  }

  // Map groups back to a flat structure that the table can render,
  // or return the groups for a custom view.
  // To keep it compatible with the existing table, we can return the primary clash
  // but append group metadata to it.
  
  return groups.map((g) => {
    if (g.clashes.length === 1) {
      return { ...g.primaryClash, isGroup: false };
    }
    
    // It's a group!
    return {
      ...g.primaryClash,
      isGroup: true,
      groupSize: g.clashes.length,
      groupClashes: g.clashes,
      sharedElementId: g.sharedElementId,
      sharedElementName: g.sharedElementName,
      displayId: `Group of ${g.clashes.length}`,
    };
  });
}

export function getGroupSummary(clash) {
  if (!clash.isGroup) return clash.displayId;
  return `${clash.sharedElementName} + ${clash.groupSize - 1} others`;
}
