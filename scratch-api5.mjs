import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
const components = new OBC.Components();
const fragments = components.get(OBC.FragmentsManager);
const hider = components.get(OBC.Hider);
const highlighter = components.get(OBCF.Highlighter);

console.log("FragmentsManager:", Object.keys(Object.getPrototypeOf(fragments)).join(", "));
console.log("Hider:", Object.keys(Object.getPrototypeOf(hider)).join(", "));
console.log("Highlighter:", Object.keys(Object.getPrototypeOf(highlighter)).join(", "));
