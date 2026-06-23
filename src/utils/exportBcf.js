import JSZip from "jszip";

/**
 * Exports clashes to a BCF 2.1 zip file.
 * Each clash gets its own folder with a markup.bcf and viewpoint.bcfv.
 */
export async function exportBcf(clashes, projectInfo) {
  const zip = new JSZip();

  // Root bcf.version
  zip.file(
    "bcf.version",
    `<?xml version="1.0" encoding="UTF-8"?>\n<Version VersionId="2.1" DetailedVersion="2.1"/>`
  );

  clashes.forEach((clash) => {
    // Generate a GUID for the topic
    const topicGuid = clash.id || clash.guid || crypto.randomUUID();
    const folder = zip.folder(topicGuid);

    // 1. markup.bcf
    const status = clash.userStatus || clash.status || "Open";
    const markupXml = `<?xml version="1.0" encoding="UTF-8"?>
<Markup>
  <Header>
    <File IfcProject="${projectInfo?.name || "Project"}" IfcSpatialStructureElement="${clash.floor || ""}" isExternal="true">
      <Filename>${projectInfo?.name || "Model"}.ifc</Filename>
      <Date>${new Date().toISOString()}</Date>
    </File>
  </Header>
  <Topic Guid="${topicGuid}" TopicType="Clash" TopicStatus="${status}">
    <Title>${clash.displayId}: ${clash.disciplinePair} Clash</Title>
    <Index>0</Index>
    <Labels>
      <Label>${clash.severity}</Label>
      <Label>${clash.disciplinePair}</Label>
    </Labels>
    <CreationDate>${new Date().toISOString()}</CreationDate>
    <CreationAuthor>BIM Clash Manager</CreationAuthor>
    <Description>
      Clash between ${clash.obj1_elementName} (${clash.obj1_ifcType}) and ${clash.obj2_elementName} (${clash.obj2_ifcType}).
      Distance: ${Math.round(Math.abs(clash.distance) * 1000)}mm.
    </Description>
  </Topic>
</Markup>`;

    folder.file("markup.bcf", markupXml);

    // 2. viewpoint.bcfv
    // Convert clash coordinates to viewpoint camera
    // If x,y,z aren't available, just put a dummy camera
    const vpXml = `<?xml version="1.0" encoding="UTF-8"?>
<VisualizationInfo Guid="${crypto.randomUUID()}">
  <OrthogonalCamera>
    <CameraViewPoint>
      <X>${clash.x || 0}</X>
      <Y>${clash.y || 0}</Y>
      <Z>${clash.z || 0}</Z>
    </CameraViewPoint>
    <CameraDirection>
      <X>1</X>
      <Y>1</Y>
      <Z>-1</Z>
    </CameraDirection>
    <CameraUpVector>
      <X>0</X>
      <Y>0</Y>
      <Z>1</Z>
    </CameraUpVector>
    <ViewToWorldScale>1.0</ViewToWorldScale>
  </OrthogonalCamera>
  <Components>
    <Selection>
      <Component IfcGuid="${clash.obj1_elementId}" />
      <Component IfcGuid="${clash.obj2_elementId}" />
    </Selection>
  </Components>
</VisualizationInfo>`;

    folder.file("viewpoint.bcfv", vpXml);
  });

  // Generate and download
  const blob = await zip.generateAsync({ type: "blob" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Clash_Report_${new Date().toISOString().split("T")[0]}.bcfzip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
