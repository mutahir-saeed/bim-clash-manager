import * as OBC from "@thatopen/components";
const props = Object.keys(OBC).filter(k => k.includes("Prop") || k.includes("Index") || k.includes("High"));
console.log("OBC Exports:", props.join(", "));
