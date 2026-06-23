import * as WebIFC from "web-ifc";
import fs from "fs";

async function run() {
  const IfcAPI = new WebIFC.IfcAPI();
  IfcAPI.SetWasmPath("./node_modules/web-ifc/");
  await IfcAPI.Init();

  const fileData = fs.readFileSync("./01_BIMcollab_Example_ARC.ifc");

  const modelID = IfcAPI.OpenModel(new Uint8Array(fileData));

  const rels = IfcAPI.GetLineIDsWithType(modelID, WebIFC.IFCRELASSOCIATESMATERIAL);
  let matMap = {};
  for (let i = 0; i < rels.size(); i++) {
    const relID = rels.get(i);
    const rel = IfcAPI.GetLine(modelID, relID);
    
    let matName = "Unknown";
    try {
        const mat = IfcAPI.GetLine(modelID, rel.RelatingMaterial.value);
        if (mat.Name && mat.Name.value) {
            matName = mat.Name.value;
        } else if (mat.MaterialLayers) {
            const layer = IfcAPI.GetLine(modelID, mat.MaterialLayers[0].value);
            const m = IfcAPI.GetLine(modelID, layer.Material.value);
            if (m && m.Name) matName = m.Name.value;
        } else if (mat.Materials) {
            const m = IfcAPI.GetLine(modelID, mat.Materials[0].value);
            if (m && m.Name) matName = m.Name.value;
        } else if (mat.ForLayerSet) {
            const layerSet = IfcAPI.GetLine(modelID, mat.ForLayerSet.value);
            if (layerSet && layerSet.MaterialLayers) {
                const layer = IfcAPI.GetLine(modelID, layerSet.MaterialLayers[0].value);
                const m = IfcAPI.GetLine(modelID, layer.Material.value);
                if (m && m.Name) matName = m.Name.value;
            }
        }
    } catch (e) {
    }

    if (rel.RelatedObjects) {
        for(let j=0; j<rel.RelatedObjects.length; j++) {
            const objId = rel.RelatedObjects[j].value;
            matMap[objId] = matName;
        }
    }
  }

  console.log("Material Map entries:", Object.keys(matMap).length);
  const keys = Object.keys(matMap);
  if(keys.length > 0) {
      console.log("Example 1:", keys[0], matMap[keys[0]]);
      console.log("Example 2:", keys[1], matMap[keys[1]]);
  } else {
      console.log("NO MATERIALS FOUND!");
  }

  IfcAPI.CloseModel(modelID);
}
run().catch(console.error);
