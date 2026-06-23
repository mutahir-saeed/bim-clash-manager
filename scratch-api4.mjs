import * as OBC from "@thatopen/components";
const p1 = Object.keys(OBC).filter(k => k.includes("Ifc") || k.includes("Property") || k.includes("Relation"));
console.log("OBC:", p1.join(", "));
