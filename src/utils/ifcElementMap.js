/**
 * IFC Element ID → Three.js Object mapping utility.
 *
 * Builds a lookup from IFC GlobalId / ExpressID to Three.js mesh references,
 * enabling instant element highlighting when a clash is selected in the dashboard.
 */

/**
 * Build a map of expressID → { mesh, fragmentGroup } from loaded fragment models.
 * This is called after each IFC file is loaded.
 *
 * @param {THREE.Group} modelGroup - The group returned by IfcLoader.load()
 * @returns {Map<number, THREE.Mesh>} expressID → mesh reference
 */
export function buildExpressIdMap(modelGroup) {
  const map = new Map();

  modelGroup.traverse((child) => {
    if (child.isMesh && child.geometry) {
      // Fragment meshes store expressIDs in geometry attributes or userData
      const expressIds = child.geometry.getAttribute("expressID");
      if (expressIds) {
        for (let i = 0; i < expressIds.count; i++) {
          const eid = expressIds.getX(i);
          if (!map.has(eid)) {
            map.set(eid, child);
          }
        }
      }

      // Also check userData for element mapping
      if (child.userData?.expressID != null) {
        map.set(child.userData.expressID, child);
      }
    }
  });

  return map;
}

/**
 * Find all meshes in the scene that contain a specific element ID string.
 * This does a broader search through userData and geometry for when we
 * need to match by IFC GlobalId string rather than numeric ExpressID.
 *
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {string} elementId - The IFC element GlobalId to find
 * @returns {THREE.Mesh[]} Array of meshes containing this element
 */
export function findMeshesByElementId(scene, elementId) {
  const results = [];
  if (!elementId) return results;

  scene.traverse((child) => {
    if (!child.isMesh) return;

    // Check userData for matching element ID
    if (
      child.userData?.elementId === elementId ||
      child.userData?.globalId === elementId ||
      child.userData?.expressID?.toString() === elementId
    ) {
      results.push(child);
    }
  });

  return results;
}

/**
 * Get the discipline (ARC/STR/MEP) from a filename.
 * Matches the logic in parseXml.js.
 */
export function getDisciplineFromFilename(filename) {
  if (!filename) return "UNKNOWN";
  const upper = filename.toUpperCase();
  if (upper.includes("ARC")) return "ARC";
  if (upper.includes("STR")) return "STR";
  if (upper.includes("MEP")) return "MEP";
  return "UNKNOWN";
}
