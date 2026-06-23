import * as OBC from "@thatopen/components";
const props = Object.keys(OBC).filter(k => k.includes("Manager") || k.includes("Relation") || k.includes("Fragment") || k.includes("Ifc"));
console.log("OBC Exports:", props.join(", "));
