"use client";

import {useRef,useState,useSyncExternalStore,type ChangeEvent} from "react";
import {Check,Database,Download,HardDrive,KeyRound,LockKeyhole,Upload} from "lucide-react";
import {PrototypeHeader} from "@/components/prototype/prototype-header";
import {exportBusinessMemory,importBusinessMemory,useBusinessMemory} from "@/lib/prototype/business-memory";
import {defaultMemoryPreferences,memoryPreferencesStore,type MemoryMode,type MemoryPreferences,type ModelProvider} from "@/lib/memory/preferences";

const modeOptions:{value:MemoryMode;title:string;description:string}[] = [
  {value:"local",title:"纯本地记忆",description:"经营资料只保存在当前设备，不调用外部模型。"},
  {value:"local_api",title:"本地记忆 + 自配模型",description:"数据留在本机，只把当前任务所需的最小上下文发送给你配置的模型。"},
  {value:"cloud",title:"可选云同步",description:"为未来的加密多设备同步预留；当前版本不会上传数据。"},
];

export function MemorySettingsPage() {
  const model = useBusinessMemory();
  const preferences = useSyncExternalStore(memoryPreferencesStore.subscribe,memoryPreferencesStore.read,()=>defaultMemoryPreferences);
  const inputRef = useRef<HTMLInputElement>(null);
  const [message,setMessage] = useState("");
  const cases = model.services.reduce((count,service)=>count+service.cases.length,0);
  const evidence = model.services.reduce((count,service)=>count+service.cases.reduce((sum,item)=>sum+item.evidence.length,0),0);
  const bytes = new Blob([JSON.stringify(model)]).size;

  function save(input:Partial<MemoryPreferences>) {
    memoryPreferencesStore.write({...preferences,...input,updatedAt:new Date().toISOString()});
    setMessage("设置已保存在当前设备");
  }

  function downloadMemory() {
    const blob = new Blob([JSON.stringify(exportBusinessMemory(),null,2)],{type:"application/json"});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href=url;
    anchor.download=`bewater-memory-${new Date().toISOString().slice(0,10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("记忆包已导出，API Key 不包含在文件中");
  }

  async function importMemory(event:ChangeEvent<HTMLInputElement>) {
    const file=event.target.files?.[0];
    event.target.value="";
    if (!file) return;
    if (!window.confirm("导入会覆盖当前设备上的经营记忆。建议先导出备份，是否继续？")) return;
    try {
      importBusinessMemory(JSON.parse(await file.text()));
      setMessage("记忆包导入成功");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "记忆包导入失败");
    }
  }

  return <main className="prototype-canvas min-h-dvh"><PrototypeHeader/><section className="prototype-shell memory-settings-shell">
    <header className="memory-settings-head"><p className="prototype-eyebrow">LOCAL-FIRST MEMORY</p><h1>你的经营记忆，首先属于你。</h1><span>原始材料、案例、证据与行动默认保存在当前设备。云端和外部模型只是可选能力。</span></header>

    <section className="memory-status-card"><div className="memory-status-icon"><HardDrive/></div><div><small>当前存储位置</small><h2>这台设备 · 浏览器本地空间</h2><p>当前阶段使用本地浏览器存储；桌面版将复用同一接口切换至 SQLite。</p></div><strong><LockKeyhole/>未启用云同步</strong></section>

    <div className="memory-stat-grid"><div><span>服务</span><strong>{model.services.length}</strong></div><div><span>案例</span><strong>{cases}</strong></div><div><span>证据</span><strong>{evidence}</strong></div><div><span>记忆体积</span><strong>{bytes<1024?`${bytes} B`:`${(bytes/1024).toFixed(1)} KB`}</strong></div></div>

    <section className="memory-settings-section"><div className="memory-section-head"><Database/><div><h2>记忆模式</h2><p>模式设置只影响数据如何被处理，不改变你对数据的所有权。</p></div></div><div className="memory-mode-grid">{modeOptions.map((option)=><button key={option.value} className={preferences.mode===option.value?"is-selected":""} onClick={()=>save({mode:option.value})}><span>{preferences.mode===option.value?<Check/>:null}</span><strong>{option.title}</strong><small>{option.description}</small></button>)}</div></section>

    <section className="memory-settings-section"><div className="memory-section-head"><KeyRound/><div><h2>模型连接</h2><p>这里只保存模型地址和名称。API Key 不会写入经营记忆或导出包。</p></div></div><div className="memory-model-form"><label><span>提供方</span><select value={preferences.provider} onChange={(event)=>save({provider:event.target.value as ModelProvider})}><option value="none">暂不连接模型</option><option value="ollama">Ollama 本地模型</option><option value="openai_compatible">OpenAI-compatible API</option></select></label><label><span>接口地址</span><input value={preferences.endpoint} placeholder="例如 http://127.0.0.1:11434" onChange={(event)=>save({endpoint:event.target.value})}/></label><label><span>模型名称</span><input value={preferences.model} placeholder="例如 qwen3:8b" onChange={(event)=>save({model:event.target.value})}/></label></div><p className="memory-key-note"><LockKeyhole/>桌面版会通过系统钥匙串保存密钥；当前网页版本不接收或保存 API Key。</p></section>

    <section className="memory-settings-section"><div className="memory-section-head"><Download/><div><h2>迁移与备份</h2><p>使用开放 JSON 记忆包迁移完整经营数据，不依赖 Be Water 云端。</p></div></div><div className="memory-transfer-actions"><button className="prototype-primary" onClick={downloadMemory}><Download/>导出本地记忆</button><button className="prototype-quiet" onClick={()=>inputRef.current?.click()}><Upload/>导入记忆包</button><input ref={inputRef} type="file" accept="application/json,.json" hidden onChange={(event)=>void importMemory(event)}/></div>{message?<p className="memory-message">{message}</p>:null}</section>
  </section></main>;
}
