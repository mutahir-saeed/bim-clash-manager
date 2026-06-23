import { useRef, useState, useCallback, useEffect } from "react";
import { Viewer, WebIFCLoaderPlugin, AmbientLight, DirLight, SectionPlanesPlugin } from "@xeokit/xeokit-sdk";
import * as WebIFC from "web-ifc";
import { WASM_PATH, IFC_CLASS_COLORS, CATEGORY_GROUPS, AUTO_COLOR_PALETTE } from "../config/viewer";
import { getDisciplineFromFilename } from "../utils/ifcElementMap";

export function useIfcScene(canvasRef, { onElementPicked } = {}) {
  const viewerRef = useRef(null);
  const ifcLoaderRef = useRef(null);
  const sectionPlanesRef = useRef(null);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingFile, setLoadingFile] = useState("");
  const [error, setError] = useState(null);
  const [loadedModels, setLoadedModels] = useState([]);
  const [clippingActive, setClippingActive] = useState(false);
  const [activeSectionPlanes, setActiveSectionPlanes] = useState([]);
  const [metaGroups, setMetaGroups] = useState(null);
  const [storeyData, setStoreyData] = useState([]);
  const [activeColorMode, setActiveColorMode] = useState(null);
  const [materialsMap, setMaterialsMap] = useState({}); // globalId -> material name

  const init = useCallback(async () => {
    if (viewerRef.current) return;

    try {
      const viewer = new Viewer({
        canvasElement: canvasRef.current,
        transparent: false,
        backgroundColor: [1, 1, 1],
        backgroundColorFromAmbientLight: false,
      });

      // Camera flight settings
      viewer.cameraFlight.duration = 1.0;
      viewer.cameraFlight.fitFOV = 45;
      
      // Beautiful rendering settings (SAO & edge enhancement)
      viewer.scene.sao.enabled = true;
      viewer.scene.sao.bias = 0.5;
      viewer.scene.sao.intensity = 0.5;
      viewer.scene.sao.numSamples = 40;
      viewer.scene.sao.kernelRadius = 100;
      viewer.scene.edgeMaterial.edges = true;
      viewer.scene.edgeMaterial.edgeColor = [0.2, 0.2, 0.2];
      viewer.scene.edgeMaterial.edgeAlpha = 1.0;

      // X-Ray styling for ghosted background elements (dark ghosting on white bg)
      viewer.scene.xrayMaterial.fill = true;
      viewer.scene.xrayMaterial.fillAlpha = 0.05;
      viewer.scene.xrayMaterial.fillColor = [0, 0, 0];
      viewer.scene.xrayMaterial.edges = true;
      viewer.scene.xrayMaterial.edgeAlpha = 0.2;
      viewer.scene.xrayMaterial.edgeColor = [0.4, 0.4, 0.4];
      
      // Highlight styling for clashes
      viewer.scene.highlightMaterial.fill = true;
      viewer.scene.highlightMaterial.fillAlpha = 0.8;
      viewer.scene.highlightMaterial.fillColor = [1, 0, 0];
      viewer.scene.highlightMaterial.edges = true;
      viewer.scene.highlightMaterial.edgeColor = [0.5, 0, 0];

      // Lighting setup
      viewer.scene.clearLights();
      new AmbientLight(viewer.scene, { color: [1, 1, 1], intensity: 0.8 });
      new DirLight(viewer.scene, { dir: [0.8, -0.6, -0.8], color: [1, 1, 1], intensity: 0.8, space: "world" });
      new DirLight(viewer.scene, { dir: [-0.8, -0.4, 0.4], color: [0.8, 0.8, 1.0], intensity: 0.4, space: "world" });

      // Init WebIFC API
      const IfcAPI = new WebIFC.IfcAPI();
      IfcAPI.SetWasmPath(WASM_PATH);
      await IfcAPI.Init();

      // Setup WebIFCLoaderPlugin
      const ifcLoader = new WebIFCLoaderPlugin(viewer, {
        WebIFC,
        IfcAPI,
        globalizeObjectIds: true
      });

      // Initialize SectionPlanesPlugin
      const sectionPlanes = new SectionPlanesPlugin(viewer, {
        overviewVisible: false,
      });

      // Handle picking
      viewer.cameraControl.on("picked", (pickResult) => {
        if (!pickResult.entity) return;
        
        // xeokit sets entity.id to either the GUID or modelId#GUID. We want just the GUID.
        let guid = pickResult.entity.id;
        if (guid.includes("#")) {
          guid = guid.split("#")[1];
        }
        
        if (onElementPicked) {
          onElementPicked(guid);
        }
        
        // Visual feedback
        viewer.scene.setObjectsSelected(viewer.scene.selectedObjectIds, false);
        pickResult.entity.selected = true;
      });

      viewer.cameraControl.on("pickedNothing", () => {
        viewer.scene.setObjectsSelected(viewer.scene.selectedObjectIds, false);
        if (onElementPicked) {
          onElementPicked(null);
        }
      });

      viewerRef.current = viewer;
      ifcLoaderRef.current = ifcLoader;
      sectionPlanesRef.current = sectionPlanes;
      setIsInitialized(true);
    } catch (err) {
      console.error("Xeokit Init Error:", err);
      setError(err.message);
    }
  }, [canvasRef, onElementPicked]);

  // ═══════════════════════════════════════
  // IFC Loading
  // ═══════════════════════════════════════

  const loadIfc = async (file) => {
    return new Promise((resolve, reject) => {
      if (!viewerRef.current || !ifcLoaderRef.current) return reject(new Error("Viewer not initialized"));

      const filename = file.name;
      const discipline = getDisciplineFromFilename(filename);

      setLoadingFile(filename);
      setIsLoading(true);
      setProgress(10);

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target.result;
          const modelId = filename.replace(/\.ifc$/i, "");
          
          // --- PARSE TRUE MATERIALS VIA WEB-IFC ---
          try {
            const tempApi = new WebIFC.IfcAPI();
            tempApi.SetWasmPath(WASM_PATH);
            await tempApi.Init();
            const tmpModelId = tempApi.OpenModel(new Uint8Array(arrayBuffer));
            const rels = tempApi.GetLineIDsWithType(tmpModelId, WebIFC.IFCRELASSOCIATESMATERIAL);
            const newMats = {};

            for (let i = 0; i < rels.size(); i++) {
              const relID = rels.get(i);
              const rel = tempApi.GetLine(tmpModelId, relID);
              let matName = null;
              
              const getString = (val) => {
                  if (!val) return null;
                  if (typeof val === 'string') return val;
                  if (val.value !== undefined) return val.value;
                  return null;
              };
              
              if (rel.RelatingMaterial && rel.RelatingMaterial.value) {
                try {
                  const mat = tempApi.GetLine(tmpModelId, rel.RelatingMaterial.value);
                  const nameVal = getString(mat.Name);
                  if (nameVal) {
                      matName = nameVal;
                  } else if (mat.MaterialLayers) {
                      const layer = tempApi.GetLine(tmpModelId, mat.MaterialLayers[0].value);
                      const m = tempApi.GetLine(tmpModelId, layer.Material.value);
                      if (m && m.Name) matName = getString(m.Name);
                  } else if (mat.Materials) {
                      const m = tempApi.GetLine(tmpModelId, mat.Materials[0].value);
                      if (m && m.Name) matName = getString(m.Name);
                  } else if (mat.ForLayerSet) {
                      const layerSet = tempApi.GetLine(tmpModelId, mat.ForLayerSet.value);
                      if (layerSet && layerSet.MaterialLayers) {
                          const layer = tempApi.GetLine(tmpModelId, layerSet.MaterialLayers[0].value);
                          const m = tempApi.GetLine(tmpModelId, layer.Material.value);
                          if (m && m.Name) matName = getString(m.Name);
                      }
                  } else if (mat.ForProfileSet) {
                      const profileSet = tempApi.GetLine(tmpModelId, mat.ForProfileSet.value);
                      if (profileSet && profileSet.MaterialProfiles) {
                          const profile = tempApi.GetLine(tmpModelId, profileSet.MaterialProfiles[0].value);
                          const m = tempApi.GetLine(tmpModelId, profile.Material.value);
                          if (m && m.Name) matName = getString(m.Name);
                      }
                  } else if (mat.MaterialProfiles) {
                      const profile = tempApi.GetLine(tmpModelId, mat.MaterialProfiles[0].value);
                      const m = tempApi.GetLine(tmpModelId, profile.Material.value);
                      if (m && m.Name) matName = getString(m.Name);
                  }
                } catch(err) {}
              }

              if (matName && rel.RelatedObjects) {
                  for (let j = 0; j < rel.RelatedObjects.length; j++) {
                      const objExpressId = rel.RelatedObjects[j].value;
                      try {
                          const objLine = tempApi.GetLine(tmpModelId, objExpressId);
                          const guid = getString(objLine.GlobalId);
                          if (guid) {
                              // xeokit globalizes IDs as modelId#guid when globalizeObjectIds is true
                              const globalId = `${modelId}#${guid}`;
                              newMats[globalId] = matName;
                              // also store un-globalized just in case
                              newMats[guid] = matName;
                          }
                      } catch (e) {}
                  }
              }
            }
            tempApi.CloseModel(tmpModelId);
            
            setMaterialsMap(prev => ({ ...prev, ...newMats }));
            const mapKeys = Object.keys(newMats).length;
            if (mapKeys === 0) {
               setError(`Debug: No materials found by WebIFC. rels size=${rels.size()}`);
            } else {
               // Show a brief success alert just for debugging
               console.log("Materials loaded:", mapKeys);
               // Also log a sample ID to error just to see its format!
               // setError(`Debug Success: found ${mapKeys} materials. Sample mapped ID: ${Object.keys(newMats)[0]}`);
            }
          } catch (matErr) {
            setError(`Debug mat parser error: ${matErr.message}`);
            console.warn("Failed to parse materials:", matErr);
          }
          // ----------------------------------------
          
          const model = ifcLoaderRef.current.load({
            id: modelId,
            ifc: arrayBuffer,
            edges: true,
            saoEnabled: true
          });

          model.on("loaded", () => {
             setProgress(100);
             setIsLoading(false);
             setLoadedModels(prev => [...prev, { filename, discipline, modelId }]);
             // Refresh storey data after model loads
             setTimeout(() => refreshStoreyData(), 100);
             resolve();
          });

          model.on("error", (errMsg) => {
             setError(errMsg);
             setIsLoading(false);
             reject(new Error(errMsg));
          });
          
        } catch (err) {
          setError(err.message);
          setIsLoading(false);
          reject(err);
        }
      };
      
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(10 + Math.round((e.loaded / e.total) * 80));
        }
      };
      
      reader.readAsArrayBuffer(file);
    });
  };

  const loadMultipleIfc = async (files) => {
    setError(null);
    for (const file of files) {
      try {
        await loadIfc(file);
      } catch (err) {
        console.error("Failed to load", file.name, err);
      }
    }
    
    if (viewerRef.current) {
        viewerRef.current.cameraFlight.flyTo({
            aabb: viewerRef.current.scene.aabb
        });
    }
  };

  // ═══════════════════════════════════════
  // Element Isolation & Highlighting
  // ═══════════════════════════════════════

  const isolateElements = useCallback((guids) => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    if (!guids || guids.length === 0) {
      viewer.scene.setObjectsVisible(viewer.scene.objectIds, true);
      viewer.scene.setObjectsXRayed(viewer.scene.xrayedObjectIds, false);
      return;
    }

    const allObjectIds = viewer.scene.objectIds;
    const targetGlobalizedIds = allObjectIds.filter(id => {
      const parts = id.split("#");
      const unPrefixed = parts.length > 1 ? parts[1] : id;
      return guids.includes(unPrefixed);
    });

    viewer.scene.setObjectsVisible(allObjectIds, false);
    viewer.scene.setObjectsVisible(targetGlobalizedIds, true);
  }, []);

  const getDisciplineRGB = (discipline) => {
    if (discipline === "ARC") return [0.23, 0.51, 0.96];
    if (discipline === "STR") return [0.96, 0.62, 0.04];
    if (discipline === "MEP") return [0.06, 0.73, 0.51];
    return [1, 0, 0];
  };

  const highlightClash = useCallback((clash) => {
    const viewer = viewerRef.current;
    if (!viewer || !clash) return;

    const { obj1_elementId, obj2_elementId, obj1_discipline, obj2_discipline } = clash;

    if (obj1_elementId && obj2_elementId) {
      const allObjectIds = viewer.scene.objectIds;
      
      const obj1Ids = allObjectIds.filter(id => {
        const parts = id.split("#");
        const unPrefixed = parts.length > 1 ? parts[1] : id;
        return unPrefixed === obj1_elementId;
      });
      const obj2Ids = allObjectIds.filter(id => {
        const parts = id.split("#");
        const unPrefixed = parts.length > 1 ? parts[1] : id;
        return unPrefixed === obj2_elementId;
      });

      const targetGlobalizedIds = [...obj1Ids, ...obj2Ids];

      viewer.scene.setObjectsXRayed(viewer.scene.visibleObjectIds, true);
      viewer.scene.setObjectsXRayed(targetGlobalizedIds, false);
      
      if (obj1Ids.length > 0) viewer.scene.setObjectsColorized(obj1Ids, getDisciplineRGB(obj1_discipline));
      if (obj2Ids.length > 0) viewer.scene.setObjectsColorized(obj2Ids, getDisciplineRGB(obj2_discipline));
    }
  }, []);

  const clearHighlights = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    viewer.scene.setObjectsXRayed(viewer.scene.xrayedObjectIds, false);
    viewer.scene.setObjectsHighlighted(viewer.scene.highlightedObjectIds, false);
    
    const colorized = viewer.scene.colorizedObjectIds;
    if (colorized && colorized.length > 0) {
      viewer.scene.setObjectsColorized(colorized, null);
    }
  }, []);

  const zoomToClash = useCallback((clash) => {
    const viewer = viewerRef.current;
    if (!viewer || !clash) return;

    viewer.camera.projection = "perspective";

    const { x, y, z, obj1_elementId, obj2_elementId } = clash;
    
    const guids = [obj1_elementId, obj2_elementId];
    const allObjectIds = viewer.scene.objectIds;
    const targetGlobalizedIds = allObjectIds.filter(id => {
      const parts = id.split("#");
      const unPrefixed = parts.length > 1 ? parts[1] : id;
      return guids.includes(unPrefixed);
    });
    
    if (targetGlobalizedIds.length > 0) {
       let aabb = viewer.scene.getAABB(targetGlobalizedIds);
       viewer.cameraFlight.flyTo({ aabb: aabb, duration: 1.0, fitFOV: 35 });
    } else {
       viewer.cameraFlight.flyTo({
           look: [x, y, z],
           eye: [x + 5, y + 5, z + 5],
           duration: 1.0
       });
    }
  }, []);

  const setDisciplineVisible = useCallback((discipline, visible) => {
      const viewer = viewerRef.current;
      if (!viewer) return;

      const modelsToToggle = loadedModels.filter(m => m.discipline === discipline);
      
      modelsToToggle.forEach(m => {
          const modelEntity = viewer.scene.models[m.modelId];
          if (modelEntity) {
              modelEntity.visible = visible;
          }
      });
  }, [loadedModels]);

  const fitCameraToScene = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.cameraFlight.flyTo({ aabb: viewer.scene.aabb, duration: 1.0 });
  }, []);
  
  const resetView = useCallback(() => {
    const viewer = viewerRef.current;
    if (viewer) viewer.camera.projection = "perspective";
    clearHighlights();
    fitCameraToScene();
  }, [clearHighlights, fitCameraToScene]);
  
  const setViewMode = useCallback((mode) => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const allObjects = viewer.scene.objectIds;
    
    viewer.scene.setObjectsVisible(allObjects, true);

    if (mode === "normal") {
      viewer.scene.setObjectsXRayed(allObjects, false);
      viewer.scene.xrayMaterial.fill = true;
      viewer.scene.xrayMaterial.fillAlpha = 0.05;
    } else if (mode === "xray") {
      viewer.scene.xrayMaterial.fill = true;
      viewer.scene.xrayMaterial.fillAlpha = 0.05;
      viewer.scene.setObjectsXRayed(allObjects, true);
    } else if (mode === "wireframe") {
      viewer.scene.xrayMaterial.fill = false;
      viewer.scene.setObjectsXRayed(allObjects, true);
    }
  }, []);

  // ═══════════════════════════════════════
  // COLORIZE BY RULE ("Lens")
  // ═══════════════════════════════════════

  const colorizeByRule = useCallback((mode) => {
    const viewer = viewerRef.current;
    if (!viewer) return [];

    // Clear previous colorization
    const colorized = viewer.scene.colorizedObjectIds;
    if (colorized && colorized.length > 0) {
      viewer.scene.setObjectsColorized(colorized, null);
    }
    viewer.scene.setObjectsXRayed(viewer.scene.xrayedObjectIds, false);

    const metaScene = viewer.metaScene;
    if (!metaScene) return [];

    const groups = {};
    let colorIndex = 0;

    // For category mode, also track sub-items (individual IFC types within each category)
    const categorySubItems = {};

    // Iterate all meta objects and group them
    for (const id in metaScene.metaObjects) {
      const metaObj = metaScene.metaObjects[id];
      const sceneObj = viewer.scene.objects[id];
      if (!sceneObj) continue;

      let groupKey = null;
      let groupColor = null;

      if (mode === "ifcClass") {
        groupKey = metaObj.type || "Unknown";
        groupColor = IFC_CLASS_COLORS[groupKey] || null;
      } else if (mode === "category") {
        let found = false;
        for (const [catName, catDef] of Object.entries(CATEGORY_GROUPS)) {
          if (catDef.types.includes(metaObj.type)) {
            groupKey = catName;
            groupColor = catDef.color;
            found = true;
            // Track sub-item
            if (!categorySubItems[catName]) categorySubItems[catName] = {};
            if (!categorySubItems[catName][metaObj.type]) {
              categorySubItems[catName][metaObj.type] = { name: metaObj.type, count: 0, objectIds: [] };
            }
            categorySubItems[catName][metaObj.type].count++;
            categorySubItems[catName][metaObj.type].objectIds.push(id);
            break;
          }
        }
        if (!found) {
          groupKey = "Other";
          groupColor = [0.62, 0.62, 0.62];
          if (!categorySubItems["Other"]) categorySubItems["Other"] = {};
          if (!categorySubItems["Other"][metaObj.type]) {
            categorySubItems["Other"][metaObj.type] = { name: metaObj.type, count: 0, objectIds: [] };
          }
          categorySubItems["Other"][metaObj.type].count++;
          categorySubItems["Other"][metaObj.type].objectIds.push(id);
        }
      } else if (mode === "material") {
        // Use true materials parsed from IfcRelAssociatesMaterial
        let mat = materialsMap[id];
        
        // Let's strip the prefix of 'id' and see if it works without modelId!
        if (!mat && id.includes('#')) {
            const shortId = id.split('#')[1];
            mat = materialsMap[`${modelId}#${shortId}`] || materialsMap[shortId];
        }

        mat = mat || "Unknown Material";
        
        // If unknown, fallback to heuristic from name
        if (mat === "Unknown Material" && metaObj.name) {
           const parts = metaObj.name.split(":");
           if (parts.length >= 2) mat = parts[1].trim();
           else mat = parts[0].trim();
           mat = mat.replace(/[\[\(].*?[\]\)]$/, '').trim();
           mat = mat.replace(/\s+\d{4,}$/, '').trim();
        }
        
        if (!mat || mat.length < 2) mat = metaObj.type || "Generic";
        if (mat.length > 50) mat = mat.substring(0, 50) + "...";

        groupKey = mat;
        groupColor = null; // Auto color
      } else if (mode === "discipline") {
        const modelId = id.split("#")[0];
        const modelInfo = loadedModels.find(m => m.modelId === modelId);
        const disc = modelInfo?.discipline || "UNKNOWN";
        const discLabels = { ARC: "Architecture", STR: "Structure", MEP: "MEP Systems", UNKNOWN: "Unknown" };
        groupKey = disc;
        groupColor = getDisciplineRGB(disc);
        // Use friendly name for display, but key by disc code
        if (!groups[groupKey]) {
          groups[groupKey] = { name: `${discLabels[disc] || disc} (${modelInfo?.filename || disc})`, color: groupColor, objectIds: [], count: 0 };
        }
      }

      if (!groupKey) continue;

      if (!groups[groupKey]) {
        if (!groupColor) {
          groupColor = AUTO_COLOR_PALETTE[colorIndex % AUTO_COLOR_PALETTE.length];
          colorIndex++;
        }
        groups[groupKey] = { name: groupKey, color: groupColor, objectIds: [], count: 0 };
      }

      groups[groupKey].objectIds.push(id);
      groups[groupKey].count++;
    }

    // Apply colors
    for (const group of Object.values(groups)) {
      if (group.objectIds.length > 0) {
        viewer.scene.setObjectsColorized(group.objectIds, group.color);
      }
    }

    // Attach sub-items to category groups
    if (mode === "category") {
      for (const group of Object.values(groups)) {
        const subs = categorySubItems[group.name];
        if (subs) {
          group.subItems = Object.values(subs).sort((a, b) => b.count - a.count);
        }
      }
    }

    // Sort by count descending
    const result = Object.values(groups).sort((a, b) => b.count - a.count);
    setMetaGroups(result);
    setActiveColorMode(mode);
    return result;
  }, [loadedModels]);

  const clearColorization = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const colorized = viewer.scene.colorizedObjectIds;
    if (colorized && colorized.length > 0) {
      viewer.scene.setObjectsColorized(colorized, null);
    }
    setMetaGroups(null);
    setActiveColorMode(null);
  }, []);

  const isolateByGroup = useCallback((objectIds) => {
    const viewer = viewerRef.current;
    if (!viewer || !objectIds || objectIds.length === 0) return;

    viewer.camera.projection = "perspective";

    // XRay everything, then un-xray the target group
    viewer.scene.setObjectsXRayed(viewer.scene.objectIds, true);
    viewer.scene.setObjectsXRayed(objectIds, false);

    // Fly camera to this group
    try {
      const aabb = viewer.scene.getAABB(objectIds);
      viewer.cameraFlight.flyTo({ aabb, duration: 1.0 });
    } catch (e) {
      // Ignore
    }
  }, []);

  const unisolateAll = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.scene.setObjectsXRayed(viewer.scene.xrayedObjectIds, false);
  }, []);

  // ═══════════════════════════════════════
  // STOREY / SPATIAL TREE
  // ═══════════════════════════════════════

  const refreshStoreyData = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer || !viewer.metaScene) return;

    const metaScene = viewer.metaScene;
    const storeys = [];

    // Find all IfcBuildingStorey metaObjects
    for (const id in metaScene.metaObjects) {
      const metaObj = metaScene.metaObjects[id];
      if (metaObj.type === "IfcBuildingStorey") {
        // Collect all child objects recursively
        const childIds = [];
        const collectChildren = (parentMeta) => {
          if (parentMeta.children) {
            for (const child of parentMeta.children) {
              // Only add if it's a real scene object
              if (viewer.scene.objects[child.id]) {
                childIds.push(child.id);
              }
              collectChildren(child);
            }
          }
        };
        collectChildren(metaObj);

        // Parse elevation from the name or properties
        let elevation = 0;
        const nameMatch = metaObj.name?.match(/([+-]?\d+\.?\d*)\s*m/i);
        if (nameMatch) {
          elevation = parseFloat(nameMatch[1]);
        } else {
          // Try to get from AABB if objects exist
          if (childIds.length > 0) {
            try {
              const aabb = viewer.scene.getAABB(childIds);
              elevation = aabb[1]; // min Y
            } catch (e) {
              // Ignore
            }
          }
        }

        storeys.push({
          id,
          name: metaObj.name || "Unnamed Storey",
          elevation,
          objectIds: childIds,
          count: childIds.length,
        });
      }
    }

    // Sort by elevation
    storeys.sort((a, b) => b.elevation - a.elevation);
    setStoreyData(storeys);
  }, []);

  const isolateStorey = useCallback((storeyId) => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    viewer.camera.projection = "perspective";

    const storey = storeyData.find(s => s.id === storeyId);
    if (!storey) return;

    // Hide everything
    viewer.scene.setObjectsVisible(viewer.scene.objectIds, false);
    // Show only this storey's objects
    viewer.scene.setObjectsVisible(storey.objectIds, true);
    
    // Fly camera to this storey
    if (storey.objectIds.length > 0) {
      try {
        const aabb = viewer.scene.getAABB(storey.objectIds);
        viewer.cameraFlight.flyTo({ aabb, duration: 1.0 });
      } catch (e) {
        // Ignore
      }
    }
  }, [storeyData]);

  const viewStoreyPlan = useCallback((storeyId) => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const storey = storeyData.find(s => s.id === storeyId);
    if (!storey || storey.objectIds.length === 0) return;

    // Show only this storey
    viewer.scene.setObjectsVisible(viewer.scene.objectIds, false);
    viewer.scene.setObjectsVisible(storey.objectIds, true);

    // Get AABB for this storey to position camera
    try {
      const aabb = viewer.scene.getAABB(storey.objectIds);
      const centerX = (aabb[0] + aabb[3]) / 2;
      const centerY = (aabb[1] + aabb[4]) / 2;
      const centerZ = (aabb[2] + aabb[5]) / 2;
      const sizeX = aabb[3] - aabb[0];
      const sizeZ = aabb[5] - aabb[2];
      const maxSize = Math.max(sizeX, sizeZ);

      // Top-down orthographic view
      viewer.camera.projection = "ortho";
      viewer.cameraFlight.flyTo({
        eye: [centerX, centerY + maxSize * 1.5, centerZ],
        look: [centerX, centerY, centerZ],
        up: [0, 0, -1],
        duration: 1.0,
        orthoScale: maxSize * 1.2
      });
    } catch (e) {
      // Ignore
    }
  }, [storeyData]);

  const showAllStoreys = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.scene.setObjectsVisible(viewer.scene.objectIds, true);
    // Clear any offsets
    viewer.scene.setObjectsOffset(viewer.scene.objectIds, [0, 0, 0]);
    fitCameraToScene();
  }, [fitCameraToScene]);

  const explodeStoreys = useCallback((factor = 1.5) => {
    const viewer = viewerRef.current;
    if (!viewer || storeyData.length === 0) return;

    // Show everything first
    viewer.scene.setObjectsVisible(viewer.scene.objectIds, true);
    viewer.scene.setObjectsOffset(viewer.scene.objectIds, [0, 0, 0]);

    // Calculate the average elevation to use as center
    const avgElev = storeyData.reduce((sum, s) => sum + s.elevation, 0) / storeyData.length;

    storeyData.forEach(storey => {
      const offset = (storey.elevation - avgElev) * factor;
      if (storey.objectIds.length > 0) {
        viewer.scene.setObjectsOffset(storey.objectIds, [0, offset, 0]);
      }
    });

    fitCameraToScene();
  }, [storeyData, fitCameraToScene]);

  // ═══════════════════════════════════════
  // SECTION PLANES
  // ═══════════════════════════════════════

  const addSectionPlane = useCallback((axis = "y") => {
    const viewer = viewerRef.current;
    const plugin = sectionPlanesRef.current;
    if (!viewer || !plugin) return;

    const aabb = viewer.scene.aabb;
    const center = [
      (aabb[0] + aabb[3]) / 2,
      (aabb[1] + aabb[4]) / 2,
      (aabb[2] + aabb[5]) / 2,
    ];

    const dir = axis === "x" ? [1, 0, 0] : axis === "y" ? [0, -1, 0] : [0, 0, 1];
    const planeId = `section_${axis}_${Date.now()}`;

    plugin.createSectionPlane({
      id: planeId,
      pos: center,
      dir,
    });

    setActiveSectionPlanes(prev => [...prev, { id: planeId, axis, dir }]);
    setClippingActive(true);
  }, []);

  const flipSectionPlane = useCallback((planeId) => {
    const plugin = sectionPlanesRef.current;
    if (!plugin) return;

    const plane = plugin.sectionPlanes[planeId];
    if (!plane) return;

    const dir = plane.dir;
    plane.dir = [-dir[0], -dir[1], -dir[2]];

    setActiveSectionPlanes(prev => prev.map(p => {
      if (p.id === planeId) {
        return { ...p, dir: [-p.dir[0], -p.dir[1], -p.dir[2]] };
      }
      return p;
    }));
  }, []);

  const removeSectionPlane = useCallback((planeId) => {
    const plugin = sectionPlanesRef.current;
    if (!plugin) return;

    plugin.destroySectionPlane(planeId);
    setActiveSectionPlanes(prev => {
      const next = prev.filter(p => p.id !== planeId);
      if (next.length === 0) setClippingActive(false);
      return next;
    });
  }, []);

  const clearSectionPlanes = useCallback(() => {
    const plugin = sectionPlanesRef.current;
    if (!plugin) return;

    plugin.clear();
    setActiveSectionPlanes([]);
    setClippingActive(false);
  }, []);

  // ═══════════════════════════════════════
  // CLEANUP
  // ═══════════════════════════════════════

  const dispose = useCallback(() => {
     if (viewerRef.current) {
         viewerRef.current.destroy();
         viewerRef.current = null;
         setIsInitialized(false);
     }
  }, []);

  useEffect(() => {
    const handleResize = () => {};
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    init,
    loadMultipleIfc,
    isolateElements,
    highlightClash,
    clearHighlights,
    zoomToClash,
    setDisciplineVisible,
    fitCameraToScene,
    resetView,
    setViewMode,
    dispose,
    isInitialized,
    isLoading,
    progress,
    loadingFile,
    error,
    loadedModels,
    
    // Colorize by Rule (Lens)
    colorizeByRule,
    clearColorization,
    isolateByGroup,
    unisolateAll,
    metaGroups,
    activeColorMode,

    // Storey / Spatial Tree
    storeyData,
    refreshStoreyData,
    isolateStorey,
    viewStoreyPlan,
    showAllStoreys,
    explodeStoreys,

    // Section Planes
    clippingActive,
    activeSectionPlanes,
    addSectionPlane,
    flipSectionPlane,
    removeSectionPlane,
    clearSectionPlanes,
  };
}
