import ifcopenshell
import sys

def run():
    ifc_file = "01_BIMcollab_Example_ARC.ifc"
    f = ifcopenshell.open(ifc_file)
    
    mat_count = 0
    mat_names = set()
    
    for rel in f.by_type("IfcRelAssociatesMaterial"):
        mat_count += 1
        mat = rel.RelatingMaterial
        name = "Unknown"
        
        if mat.is_a("IfcMaterial"):
            name = mat.Name
        elif mat.is_a("IfcMaterialLayerSet"):
            if mat.MaterialLayers:
                name = mat.MaterialLayers[0].Material.Name
        elif mat.is_a("IfcMaterialLayerSetUsage"):
            if mat.ForLayerSet.MaterialLayers:
                name = mat.ForLayerSet.MaterialLayers[0].Material.Name
        elif mat.is_a("IfcMaterialList"):
            if mat.Materials:
                name = mat.Materials[0].Name
        elif mat.is_a("IfcMaterialProfileSet"):
            if mat.MaterialProfiles:
                name = mat.MaterialProfiles[0].Material.Name
        elif mat.is_a("IfcMaterialProfileSetUsage"):
            if mat.ForProfileSet.MaterialProfiles:
                name = mat.ForProfileSet.MaterialProfiles[0].Material.Name
        
        mat_names.add(name)
        
        if mat_count < 10:
            print(f"Rel: {rel.id()}, MatType: {mat.is_a()}, FoundName: {name}")

    print(f"Total Material Relations: {mat_count}")
    print(f"Unique Materials: {mat_names}")

if __name__ == "__main__":
    run()
