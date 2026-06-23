import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
const p1 = Object.keys(OBC).filter(k => k.includes("Manager") || k.includes("Index") || k.includes("High"));
const p2 = Object.keys(OBCF).filter(k => k.includes("Manager") || k.includes("Index") || k.includes("High"));
console.log("OBC:", p1.join(", "));
console.log("OBCF:", p2.join(", "));
