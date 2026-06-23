import { XMLParser } from "fast-xml-parser";

/**
 * Parse a Navisworks clash detection XML file into structured clash objects.
 * Handles the exact XML structure exported by Navisworks Manage.
 */

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) => {
    // Force these to always be arrays even if single element
    return ["clashtest", "clashresult", "clashobject", "smarttag", "node"].includes(name);
  },
});

/**
 * Determine severity from penetration distance (in meters, negative value)
 */
function getSeverity(distance) {
  const absDistance = Math.abs(distance);
  if (absDistance > 0.05) return "Critical";
  if (absDistance > 0.01) return "Major";
  return "Minor";
}

/**
 * Extract discipline from IFC filename
 */
function getDiscipline(filename) {
  if (!filename) return "UNKNOWN";
  const upper = filename.toUpperCase();
  if (upper.includes("ARC")) return "ARC";
  if (upper.includes("STR")) return "STR";
  if (upper.includes("MEP")) return "MEP";
  return "UNKNOWN";
}

/**
 * Build a sorted discipline pair string
 */
function getDisciplinePair(disc1, disc2) {
  return [disc1, disc2].sort().join("-");
}

/**
 * Normalize a value that may be a string or array to always be an array
 */
function toArray(val) {
  if (val == null) return [];
  if (Array.isArray(val)) return val;
  return [val];
}

/**
 * Parse a single clashobject element
 */
function parseClashObject(obj) {
  if (!obj) return null;

  const elementId = obj.objectattribute?.value || "";
  const layer = obj.layer || "";

  // Parse pathlink nodes
  const nodes = toArray(obj.pathlink?.node);

  // Find .ifc filename
  const file = nodes.find((n) => typeof n === "string" && n.toLowerCase().endsWith(".ifc")) || "";

  // Find IFC type (first node starting with "Ifc")
  const ifcType = nodes.find((n) => typeof n === "string" && n.startsWith("Ifc")) || "";

  // Extract discipline from filename
  const discipline = getDiscipline(file);

  // Get element name from smarttags
  const smarttags = toArray(obj.smarttags?.smarttag);
  const itemNameTag = smarttags.find((t) => t?.name === "Item Name");
  const elementName = itemNameTag?.value || "";

  return { elementId, file, discipline, ifcType, elementName, floor: layer };
}

/**
 * Extract project info from the first clashobject's pathlink
 */
function extractProjectInfo(nodes) {
  // Typical pathlink: File, File, filename.ifc, ProjectName, SiteAddress, BuildingName, Floor, ...
  // Index 3 = project name, Index 4 = site address
  if (nodes.length >= 5) {
    return {
      projectName: nodes[3] || "BIM Project",
      siteAddress: nodes[4] || "",
    };
  }
  return { projectName: "BIM Project", siteAddress: "" };
}

/**
 * Main parse function — takes XML string, returns { clashes, projectInfo }
 */
export function parseClashXml(xmlString) {
  const result = parser.parse(xmlString);

  const exchange = result.exchange;
  if (!exchange) throw new Error("Invalid XML: missing <exchange> root element");

  const batchtest = exchange.batchtest;
  if (!batchtest) throw new Error("Invalid XML: missing <batchtest> element");

  const clashtests = toArray(batchtest.clashtests?.clashtest);
  if (clashtests.length === 0) throw new Error("No clash tests found in XML");

  const allClashes = [];
  let projectInfo = null;

  clashtests.forEach((test, testIndex) => {
    const testName = test["@_name"] || `Test ${testIndex + 1}`;
    const clashresults = toArray(test.clashresults?.clashresult);

    clashresults.forEach((cr) => {
      const name = cr["@_name"] || "";
      const guid = cr["@_guid"] || "";
      const status = (cr["@_status"] || "active").toLowerCase();
      const distance = parseFloat(cr["@_distance"]) || 0;

      // Parse clash point
      const pos = cr.clashpoint?.pos3f;
      const x = parseFloat(pos?.["@_x"]) || 0;
      const y = parseFloat(pos?.["@_y"]) || 0;
      const z = parseFloat(pos?.["@_z"]) || 0;

      // Parse grid location: "D-8 : 02 Second floor"
      const gridlocation = cr.gridlocation || "";
      const gridParts = gridlocation.split(" : ");
      const gridRef = gridParts[0]?.trim() || "";
      const floor = gridParts[1]?.trim() || "";

      // Parse created date
      const dateEl = cr.createddate?.date;
      let createdDate = "";
      if (dateEl) {
        const yr = dateEl["@_year"] || "2024";
        const mo = String(dateEl["@_month"] || "1").padStart(2, "0");
        const dy = String(dateEl["@_day"] || "1").padStart(2, "0");
        const hr = String(dateEl["@_hour"] || "0").padStart(2, "0");
        const mi = String(dateEl["@_minute"] || "0").padStart(2, "0");
        const sc = String(dateEl["@_second"] || "0").padStart(2, "0");
        createdDate = `${yr}-${mo}-${dy} ${hr}:${mi}:${sc}`;
      }

      // Parse clash objects
      const clashobjects = toArray(cr.clashobjects?.clashobject);
      const obj1 = parseClashObject(clashobjects[0]);
      const obj2 = parseClashObject(clashobjects[1]);

      // Extract project info from first clash's first object
      if (!projectInfo && obj1) {
        const nodes = toArray(clashobjects[0]?.pathlink?.node);
        projectInfo = extractProjectInfo(nodes);
      }

      const severity = getSeverity(distance);
      const disciplinePair =
        obj1 && obj2 ? getDisciplinePair(obj1.discipline, obj2.discipline) : "";

      allClashes.push({
        id: `${testIndex}_${name}`,
        displayId: name,
        guid,
        status,
        distance,
        severity,
        clashTestName: testName,
        clashTestIndex: testIndex,
        disciplinePair,
        floor,
        gridRef,
        x,
        y,
        z,
        createdDate,

        obj1_elementId: obj1?.elementId || "",
        obj1_file: obj1?.file || "",
        obj1_discipline: obj1?.discipline || "",
        obj1_ifcType: obj1?.ifcType || "",
        obj1_elementName: obj1?.elementName || "",
        obj1_floor: obj1?.floor || "",

        obj2_elementId: obj2?.elementId || "",
        obj2_file: obj2?.file || "",
        obj2_discipline: obj2?.discipline || "",
        obj2_ifcType: obj2?.ifcType || "",
        obj2_elementName: obj2?.elementName || "",
        obj2_floor: obj2?.floor || "",

        assignedTo: "",
        comment: "",
        userStatus: status,
      });
    });
  });

  return {
    clashes: allClashes,
    projectInfo: projectInfo || { projectName: "BIM Project", siteAddress: "" },
    testNames: clashtests.map((t) => t["@_name"] || ""),
    parseDate: new Date().toISOString(),
  };
}
