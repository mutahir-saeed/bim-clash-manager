import * as WebIFC from "web-ifc";
import fs from "fs";

async function run() {
  const IfcAPI = new WebIFC.IfcAPI();
  IfcAPI.SetWasmPath("./node_modules/web-ifc/");
  await IfcAPI.Init();

  const fileData = fs.readFileSync("./01_BIMcollab_Example_ARC.ifc");

  const modelID = IfcAPI.OpenModel(new Uint8Array(fileData));

  const rels = IfcAPI.GetLineIDsWithType(modelID, WebIFC.IFCRELASSOCIATESMATERIAL);
  for (let i = 0; i < 5; i++) {
    const relID = rels.get(i);
    const rel = IfcAPI.GetLine(modelID, relID);
    console.log("Rel:", rel);
    
    if (rel.RelatingMaterial && rel.RelatingMaterial.value) {
        const mat = IfcAPI.GetLine(modelID, rel.RelatingMaterial.value);
        console.log("Mat:", mat);
    }
  }
  IfcAPI.CloseModel(modelID);
}
run().catch(console.error);
