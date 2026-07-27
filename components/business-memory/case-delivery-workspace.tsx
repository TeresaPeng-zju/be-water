"use client";

import {ChangeEvent, useState} from "react";
import {ArrowRight, Check, FileText, FileUp, Link2, PackageCheck, Plus, Sparkles, Trash2} from "lucide-react";
import {useTranslations} from "next-intl";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {
  addDeliveryMaterial,
  deleteDeliveryMaterial,
  getCaseStatus,
  getDeliveryRelation,
  promoteMaterialToAsset,
  reuseServiceAsset,
  updateCaseStatus,
  useBusinessMemory,
} from "@/lib/business-memory/store";
import {
  commercialStatuses,
  deliveryMaterialRoles,
  deliveryStatuses,
  isReusableServiceAssetRole,
  outcomeStatuses,
  paymentStatuses,
  type CommercialStatus,
  type DeliveryMaterialFormat,
  type DeliveryMaterialRole,
  type DeliveryStatus,
  type OutcomeStatus,
  type PaymentStatus,
  type DeliveryMaterial,
} from "@/lib/domain/delivery";

const maxLocalFileBytes = 1_500_000;

function fileFormat(file:File):DeliveryMaterialFormat {
  if (file.type.startsWith("image/")) return "image";
  if (file.type || file.name.includes(".")) return "document";
  return "other";
}

function readDataUrl(file:File) {
  return new Promise<string>((resolve,reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export function CaseDeliveryWorkspace({serviceId,caseId}:{serviceId:string;caseId:string}) {
  const t = useTranslations("deliveryWorkspace");
  const assetT = useTranslations("assetReuse");
  const relationT = useTranslations("deliveryRelations");
  const model = useBusinessMemory();
  const service = model.services.find((entry) => entry.id === serviceId);
  const item = service?.cases.find((entry) => entry.id === caseId);
  const [isAdding,setIsAdding] = useState(false);
  const [title,setTitle] = useState("");
  const [role,setRole] = useState<DeliveryMaterialRole>("preparation");
  const [content,setContent] = useState("");
  const [externalUrl,setExternalUrl] = useState("");
  const [selectedFile,setSelectedFile] = useState<File | null>(null);
  const [linkedEvidenceIds,setLinkedEvidenceIds] = useState<string[]>([]);
  const [fulfillsMaterialIds,setFulfillsMaterialIds] = useState<string[]>([]);
  const [validatesMaterialIds,setValidatesMaterialIds] = useState<string[]>([]);
  const [fileError,setFileError] = useState("");
  const [pendingDelete,setPendingDelete] = useState<DeliveryMaterial | null>(null);

  if (!service || !item) return null;

  const status = getCaseStatus(item);
  const materials = item.materials ?? [];
  const relation = getDeliveryRelation(item);
  const promotedAssets = new Set((service.assets ?? []).map((asset) => asset.sourceMaterialId));
  const reusedAssetIds = new Set(materials.flatMap((material) => material.promotedAssetId ? [material.promotedAssetId] : []));

  function resetComposer() {
    setIsAdding(false);
    setTitle("");
    setRole("preparation");
    setContent("");
    setExternalUrl("");
    setSelectedFile(null);
    setLinkedEvidenceIds([]);
    setFulfillsMaterialIds([]);
    setValidatesMaterialIds([]);
    setFileError("");
  }

  function chooseFile(event:ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setFileError("");
    if (file && file.size > maxLocalFileBytes) {
      setSelectedFile(null);
      setFileError(t("fileTooLarge"));
      return;
    }
    setSelectedFile(file);
    if (file && !title.trim()) setTitle(file.name.replace(/\.[^.]+$/,""));
  }

  async function saveMaterial() {
    if (!title.trim() || (!content.trim() && !externalUrl.trim() && !selectedFile)) return;
    let dataUrl:string|undefined;
    let textContent = content.trim() || undefined;
    if (selectedFile) {
      dataUrl = await readDataUrl(selectedFile);
      if (!textContent && (selectedFile.type.startsWith("text/") || /\.(md|txt|csv|json)$/i.test(selectedFile.name))) {
        textContent = (await selectedFile.text()).slice(0,50_000);
      }
    }
    const format:DeliveryMaterialFormat = selectedFile ? fileFormat(selectedFile) : externalUrl.trim() ? "link" : "text";
    addDeliveryMaterial(serviceId,caseId,{title,role,format,content:textContent,fileName:selectedFile?.name,mimeType:selectedFile?.type,dataUrl,externalUrl:externalUrl.trim() || undefined,linkedEvidenceIds,fulfillsMaterialIds:role === "actual_deliverable" ? fulfillsMaterialIds : [],validatesMaterialIds:role === "customer_outcome" ? validatesMaterialIds : []});
    resetComposer();
  }

  function updateDimension(dimension:"commercial"|"delivery"|"payment"|"outcome",value:string) {
    updateCaseStatus(serviceId,caseId,{
      ...status,
      [dimension]:value,
      updatedAt:new Date().toISOString(),
    } as typeof status);
  }

  function toggleEvidence(evidenceId:string) {
    setLinkedEvidenceIds((current) => current.includes(evidenceId) ? current.filter((id) => id !== evidenceId) : [...current,evidenceId]);
  }

  function toggleRelation(id:string,kind:"fulfills"|"validates") {
    const setter = kind === "fulfills" ? setFulfillsMaterialIds : setValidatesMaterialIds;
    setter((current) => current.includes(id) ? current.filter((entry) => entry !== id) : [...current,id]);
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    deleteDeliveryMaterial(serviceId,caseId,pendingDelete.id);
    setPendingDelete(null);
  }

  return <>
    <section className="case-status-workspace">
      <div className="journey-heading"><p>{t("statusEyebrow")}</p><h2>{t("statusTitle")}</h2><span>{t("statusDescription")}</span></div>
      <div className="case-status-grid">
        <label><span>{t("dimensions.commercial")}</span><select value={status.commercial} onChange={(event) => updateDimension("commercial",event.target.value as CommercialStatus)}>{commercialStatuses.map((value) => <option key={value} value={value}>{t(`statuses.commercial.${value}`)}</option>)}</select></label>
        <label><span>{t("dimensions.delivery")}</span><select value={status.delivery} onChange={(event) => updateDimension("delivery",event.target.value as DeliveryStatus)}>{deliveryStatuses.map((value) => <option key={value} value={value}>{t(`statuses.delivery.${value}`)}</option>)}</select></label>
        <label><span>{t("dimensions.payment")}</span><select value={status.payment} onChange={(event) => updateDimension("payment",event.target.value as PaymentStatus)}>{paymentStatuses.map((value) => <option key={value} value={value}>{t(`statuses.payment.${value}`)}</option>)}</select></label>
        <label><span>{t("dimensions.outcome")}</span><select value={status.outcome} onChange={(event) => updateDimension("outcome",event.target.value as OutcomeStatus)}>{outcomeStatuses.map((value) => <option key={value} value={value}>{t(`statuses.outcome.${value}`)}</option>)}</select></label>
      </div>
    </section>

    <section className="delivery-materials">
      <div className="delivery-materials-head"><div className="journey-heading"><p>{t("materialsEyebrow")}</p><h2>{t("materialsTitle")}</h2><span>{t("materialsDescription")}</span></div><button className="prototype-text-action" type="button" onClick={() => setIsAdding(true)}><Plus/>{t("addMaterial")}</button></div>
      {service.assets?.length ? <div className="material-asset-reuse">
        <div><Sparkles/><span>{assetT("title")}</span></div>
        <div>{service.assets.map((asset) => {
          const alreadyUsed = reusedAssetIds.has(asset.id);
          return <button type="button" key={asset.id} disabled={alreadyUsed} onClick={() => reuseServiceAsset(serviceId,caseId,asset.id)}>
            <span>{t(`roles.${asset.role}`)}</span>
            <strong>{asset.title}</strong>
            <small>{alreadyUsed ? assetT("used") : assetT("use")}</small>
          </button>;
        })}</div>
      </div> : null}
      {isAdding ? <div className="material-composer">
        <div className="material-role-picker"><span>{t("roleQuestion")}</span><div>{deliveryMaterialRoles.map((value) => <button type="button" key={value} className={role === value ? "is-selected" : ""} onClick={() => setRole(value)}>{role === value ? <Check/> : null}{t(`roles.${value}`)}</button>)}</div></div>
        <label><span>{t("titleLabel")}</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t("titlePlaceholder")}/></label>
        <label className="material-file-picker"><FileUp/><span>{selectedFile?.name || t("fileLabel")}</span><input type="file" accept="image/*,.pdf,.txt,.md,.csv,.json,.doc,.docx,.ppt,.pptx" onChange={chooseFile}/></label>
        {fileError ? <p className="material-error">{fileError}</p> : null}
        <label><span>{t("linkLabel")}</span><div className="material-link-input"><Link2/><input type="url" value={externalUrl} onChange={(event) => setExternalUrl(event.target.value)} placeholder="https://"/></div></label>
        <label><span>{t("noteLabel")}</span><textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder={t("notePlaceholder")}/></label>
        {item.evidence.length ? <div className="material-evidence-links"><span>{t("linkEvidence")}</span><div>{item.evidence.slice(-8).map((evidence) => <button type="button" key={evidence.id} className={linkedEvidenceIds.includes(evidence.id) ? "is-selected" : ""} onClick={() => toggleEvidence(evidence.id)}>{linkedEvidenceIds.includes(evidence.id) ? <Check/> : null}{evidence.extractionSummary || evidence.content.slice(0,42) || evidence.type}</button>)}</div></div> : null}
        {role === "actual_deliverable" && materials.some((material) => material.role === "planned_deliverable" || material.role === "preparation") ? <div className="material-evidence-links"><span>{relationT("fulfillsQuestion")}</span><div>{materials.filter((material) => material.role === "planned_deliverable" || material.role === "preparation").map((material) => <button type="button" key={material.id} className={fulfillsMaterialIds.includes(material.id) ? "is-selected" : ""} onClick={() => toggleRelation(material.id,"fulfills")}>{fulfillsMaterialIds.includes(material.id) ? <Check/> : null}{material.title}</button>)}</div></div> : null}
        {role === "customer_outcome" && materials.some((material) => material.role === "actual_deliverable") ? <div className="material-evidence-links"><span>{relationT("validatesQuestion")}</span><div>{materials.filter((material) => material.role === "actual_deliverable").map((material) => <button type="button" key={material.id} className={validatesMaterialIds.includes(material.id) ? "is-selected" : ""} onClick={() => toggleRelation(material.id,"validates")}>{validatesMaterialIds.includes(material.id) ? <Check/> : null}{material.title}</button>)}</div></div> : null}
        <div className="material-composer-actions"><button className="prototype-quiet" type="button" onClick={resetComposer}>{t("cancel")}</button><button className="prototype-primary" type="button" onClick={() => void saveMaterial()} disabled={!title.trim() || (!content.trim() && !externalUrl.trim() && !selectedFile)}><Plus/>{t("saveMaterial")}</button></div>
      </div> : null}
      {materials.length ? <div className="material-list">{materials.map((material) => <article key={material.id}>
        <div className="material-icon">{material.format === "link" ? <Link2/> : material.role === "actual_deliverable" ? <PackageCheck/> : <FileText/>}</div>
        <div><span>{t(`roles.${material.role}`)}</span><h3>{material.title}</h3><p>{material.content?.slice(0,120) || material.fileName || material.externalUrl}</p>{material.linkedEvidenceIds.length ? <small>{t("linkedFacts",{count:material.linkedEvidenceIds.length})}</small> : null}{(material.fulfillsMaterialIds?.length ?? 0) > 0 ? <small>{relationT("fulfillsCount",{count:material.fulfillsMaterialIds.length})}</small> : null}{(material.validatesMaterialIds?.length ?? 0) > 0 ? <small>{relationT("validatesCount",{count:material.validatesMaterialIds.length})}</small> : null}</div>
        <div className="material-actions">{material.externalUrl ? <a href={material.externalUrl} target="_blank" rel="noreferrer">{t("open")}</a> : material.dataUrl ? <a href={material.dataUrl} download={material.fileName}>{t("download")}</a> : null}{isReusableServiceAssetRole(material.role) ? <button type="button" disabled={Boolean(material.promotedAssetId) || promotedAssets.has(material.id)} onClick={() => promoteMaterialToAsset(serviceId,caseId,material.id)}><Sparkles/>{material.promotedAssetId || promotedAssets.has(material.id) ? t("promoted") : t("promote")}</button> : null}<button type="button" aria-label={t("delete")} onClick={() => setPendingDelete(material)}><Trash2/></button></div>
      </article>)}</div> : <p className="materials-empty">{t("materialsEmpty")}</p>}
    </section>

    <section className="delivery-relation">
      <div className="journey-heading"><p>{t("relationEyebrow")}</p><h2>{t("relationTitle")}</h2><span>{t("relationDescription")}</span></div>
      <div className="delivery-relation-grid">
        {(["planned","actual","outcomes"] as const).map((phase,index) => <div className="delivery-relation-phase" key={phase}><span>{t(`phases.${phase}`)}</span>{relation[phase].length ? <ul>{relation[phase].slice(0,5).map((entry) => <li key={entry.ref}><span>{entry.title}</span>{entry.relatedRefs.length ? <small>{relationT("connected",{count:entry.relatedRefs.length})}</small> : null}</li>)}</ul> : <p>{t(`phaseEmpty.${phase}`)}</p>}{index < 2 ? <ArrowRight/> : null}</div>)}
      </div>
    </section>

    <ConfirmDialog open={Boolean(pendingDelete)} title={t("deleteTitle")} description={t("deleteDescription")} cancelLabel={t("cancel")} confirmLabel={t("deleteConfirm")} onCancel={() => setPendingDelete(null)} onConfirm={confirmDelete}/>
  </>;
}
