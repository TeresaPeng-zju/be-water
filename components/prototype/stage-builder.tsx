"use client";

import {useState} from "react";
import {Check, GripVertical, Plus, Trash2, X} from "lucide-react";
import {isPresetStage, type EvidenceType, type PrototypeStage} from "@/lib/prototype/business-memory";

type StageBuilderProps = {
  stages: PrototypeStage[];
  onChange: (stages: PrototypeStage[]) => void;
  getLabel: (stage: PrototypeStage) => string;
  getTypeLabel: (type: EvidenceType) => string;
  addLabel: string;
  addTypeLabel: string;
  addNameLabel: string;
  addConfirmLabel: string;
  addCancelLabel: string;
  presetLabel: string;
  customPlaceholder: string;
  description: string;
};

const stageTypes: EvidenceType[] = ["conversation", "quote", "delivery", "feedback", "note"];

export function StageBuilder({stages, onChange, getLabel, getTypeLabel, addLabel, addTypeLabel, addNameLabel, addConfirmLabel, addCancelLabel, presetLabel, customPlaceholder, description}: StageBuilderProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newType, setNewType] = useState<EvidenceType | "">("");
  const [newLabel, setNewLabel] = useState("");

  function updateLabel(stageId: string, label: string) {
    onChange(stages.map((stage) => stage.id === stageId ? {...stage, label} : stage));
  }

  function cancelAdd() {
    setAdding(false);
    setNewType("");
    setNewLabel("");
  }

  function addStage() {
    if (!newType || !newLabel.trim()) return;
    onChange([...stages, {id: `custom-stage-${crypto.randomUUID()}`, type: newType, label: newLabel.trim(), origin: "custom"}]);
    cancelAdd();
  }

  function removeStage(stageId: string) {
    if (stages.length <= 1) return;
    onChange(stages.filter((stage) => stage.id !== stageId));
  }

  function moveStage(targetId: string) {
    if (!draggingId || draggingId === targetId) return;
    const next = [...stages];
    const sourceIndex = next.findIndex((stage) => stage.id === draggingId);
    const targetIndex = next.findIndex((stage) => stage.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const [source] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, source);
    onChange(next);
  }

  return <div className="stage-builder">
    <p>{description}</p>
    <div>
      {stages.map((stage, index) => <div
        key={stage.id}
        className={draggingId === stage.id ? "stage-builder-row is-dragging" : "stage-builder-row"}
        draggable
        onDragStart={() => setDraggingId(stage.id)}
        onDragEnd={() => setDraggingId(null)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={() => moveStage(stage.id)}
      >
        <GripVertical aria-hidden="true"/>
        <span>{String(index + 1).padStart(2, "0")}</span>
        {isPresetStage(stage) ? <div className="stage-builder-name is-locked"><strong>{getLabel(stage)}</strong><small>{presetLabel}</small></div> : <div className="stage-builder-name"><input
          value={stage.label ?? ""}
          onChange={(event) => updateLabel(stage.id, event.target.value)}
          placeholder={customPlaceholder}
          aria-label={`${index + 1}. ${getLabel(stage) || customPlaceholder}`}
        /><small>{getTypeLabel(stage.type)}</small></div>}
        <button type="button" onClick={() => removeStage(stage.id)} disabled={stages.length <= 1} aria-label={`${getLabel(stage)} · ${customPlaceholder}`}><Trash2/></button>
      </div>)}
    </div>
    {!adding ? <button type="button" className="stage-builder-add" onClick={() => setAdding(true)}><Plus/>{addLabel}</button> : <div className="stage-builder-create">
      <div><span>{addTypeLabel}</span><div className="stage-type-options">{stageTypes.map((type) => <button type="button" key={type} className={newType === type ? "is-selected" : ""} onClick={() => setNewType(type)}>{newType === type ? <Check/> : null}{getTypeLabel(type)}</button>)}</div></div>
      <label><span>{addNameLabel}</span><input autoFocus value={newLabel} onChange={(event) => setNewLabel(event.target.value)} placeholder={customPlaceholder}/></label>
      <div className="stage-builder-create-actions"><button type="button" onClick={cancelAdd}><X/>{addCancelLabel}</button><button type="button" className="is-primary" disabled={!newType || !newLabel.trim()} onClick={addStage}><Plus/>{addConfirmLabel}</button></div>
    </div>}
  </div>;
}
