"use client";

import { useMemo, useState } from "react";

type View = "today" | "experiment" | "content" | "leads" | "review" | "onboarding" | "paths";

const nav: { id: View; label: string; hint: string }[] = [
  { id: "today", label: "今日教练", hint: "Today" },
  { id: "experiment", label: "商业实验", hint: "Experiment" },
  { id: "content", label: "内容与渠道", hint: "Content" },
  { id: "leads", label: "线索流", hint: "Leads" },
  { id: "review", label: "增长复盘", hint: "Review" },
];

const leads = [
  { name: "林雨", role: "前端 · 2 年", signal: "项目经历不会讲深入", stage: "明确需求", time: "12 分钟前", tone: "mint" },
  { name: "周野", role: "应届生", signal: "收藏了面试自测表", stage: "已互动", time: "1 小时前", tone: "cyan" },
  { name: "陈珂", role: "前端 · 3 年", signal: "询问模拟面试价格", stage: "明确需求", time: "3 小时前", tone: "amber" },
];

export default function Home() {
  const [view, setView] = useState<View>("today");
  const [missionDone, setMissionDone] = useState(false);
  const [interviewStep, setInterviewStep] = useState(3);
  const [selectedLead, setSelectedLead] = useState(0);
  const [reviewPlaying, setReviewPlaying] = useState(false);
  const title = useMemo(() => nav.find((item) => item.id === view)?.label ?? "成长路径", [view]);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => setView("today")} aria-label="回到今日教练"><span className="brand-mark"><i /></span><span><strong>Be Water</strong><small>Growth OS</small></span></button>
        <nav aria-label="主导航">{nav.map((item) => <button key={item.id} className={view === item.id ? "nav-item active" : "nav-item"} onClick={() => setView(item.id)}><span className={`nav-icon icon-${item.id}`} /><span><b>{item.label}</b><small>{item.hint}</small></span>{item.id === "leads" && <em>3</em>}</button>)}</nav>
        <div className="sidebar-bottom"><div className="experiment-mini"><span className="eyebrow">当前实验</span><strong>前端模拟面试</strong><div className="mini-progress"><i /></div><div><span>Day 3 of 7</span><span>46%</span></div></div><button className="profile"><span>陈</span><div><b>小陈</b><small>个人工作区</small></div><i>•••</i></button></div>
      </aside>
      <section className="workspace">
        <header className="topbar"><div><span className="mobile-brand">Be Water</span><span className="crumb">小陈的实验</span><i>/</i><b>{title}</b></div><div className="top-actions"><button aria-label="搜索">⌕</button><button aria-label="通知" className="notify">◌<i /></button><span className="status-dot" /><small>所有改变已保存</small></div></header>
        <div className="page-stage" key={view}>
          {view === "today" && <Today missionDone={missionDone} setMissionDone={setMissionDone} go={setView} />}
          {view === "experiment" && <Experiment go={setView} />}
          {view === "content" && <Content />}
          {view === "leads" && <Leads selected={selectedLead} setSelected={setSelectedLead} />}
          {view === "review" && <Review playing={reviewPlaying} setPlaying={setReviewPlaying} />}
          {view === "onboarding" && <Onboarding step={interviewStep} setStep={setInterviewStep} go={setView} />}
          {view === "paths" && <Paths go={setView} />}
        </div>
      </section>
    </main>
  );
}

function Today({ missionDone, setMissionDone, go }: { missionDone: boolean; setMissionDone: (v: boolean) => void; go: (v: View) => void }) {
  return <div className="page today-page">
    <div className="page-heading"><div><span className="eyebrow mint">THURSDAY · JUL 16</span><h1>晚上好，小陈。</h1><p>实验进入第 3 天。今天只推进一件最重要的事。</p></div><button className="quiet-button" onClick={() => go("review")}>查看本周进展 <span>→</span></button></div>
    <section className={missionDone ? "mission-card completed" : "mission-card"}><div className="mission-top"><div><span className="live-dot" /><b>{missionDone ? "今日任务已完成" : "TODAY'S MISSION"}</b></div><span>预计 25 分钟</span></div><div className="mission-body"><div className="day-rail"><span>DAY</span><strong>03</strong><i /></div><div className="mission-copy"><span className="chip">痛点验证 · 小红书</span><h2>{missionDone ? "很好，水流开始形成。" : "发布一篇“项目深挖”痛点验证内容"}</h2><p>{missionDone ? "这条内容已进入数据观察期。产生的新信号会自动回流到实验。" : "用真实经历描述：为什么很多前端项目写得不错，却在面试中讲不深入。"}</p><div className="coach-note"><span>教练建议</span><p>最近两位潜在线索都主动提到“项目经历不知道如何讲深入”。这是值得优先验证的初步信号。</p><b>初步信号 · 2 条证据</b></div></div><div className="mission-action"><button onClick={() => setMissionDone(!missionDone)}>{missionDone ? "撤销完成" : "开始完成任务"} <span>→</span></button><small>{missionDone ? "已计入今日进展" : "已为你准备好内容草稿"}</small></div></div></section>
    <section className="dashboard-grid"><div className="reservoir-card"><div className="card-title"><div><span className="eyebrow">验证水位</span><h3>商业模型可信度</h3></div><span className="trend">↗ 8% 本周</span></div><div className="reservoir-layout"><div className="water-gauge"><div className="water-fill"><i /><i /><i /></div><strong>{missionDone ? 51 : 46}<small>%</small></strong><span>形成初步信号</span></div><div className="metric-streams"><Metric label="内容" value="2 / 3" percent={66} weight="15% 权重" /><Metric label="有效线索" value="2 / 3" percent={66} weight="30% 权重" /><Metric label="成交" value="0 / 1" percent={4} weight="35% 权重" /><Metric label="真实反馈" value="0 / 1" percent={4} weight="20% 权重" /></div></div></div><div className="signals-card"><div className="card-title"><div><span className="eyebrow">实时信号</span><h3>新流入的线索</h3></div><button onClick={() => go("leads")}>全部线索</button></div><div className="lead-list">{leads.map((lead, i) => <div className="lead-row" key={lead.name}><span className={`avatar ${lead.tone}`}>{lead.name[0]}</span><div><b>{lead.name}<small>{lead.role}</small></b><p>“{lead.signal}”</p></div><time>{lead.time}</time>{i === 0 && <i className="new-drop" />}</div>)}</div></div></section>
    <div className="bottom-grid"><button className="insight-card" onClick={() => go("review")}><span className="insight-mark">↳</span><div><span className="eyebrow">本周洞察正在形成</span><h3>“项目深挖”正在成为一条更宽的支流</h3><p>2 / 3 位高意向用户主动提及 · 还需要 1 个付费行为完成验证</p></div><span className="round-arrow">→</span></button><button className="next-card" onClick={() => go("onboarding")}><span>首次引导</span><b>查看能力源泉与商业路径</b><i>→</i></button></div>
  </div>;
}

function Metric({ label, value, percent, weight }: { label: string; value: string; percent: number; weight: string }) { return <div className="metric"><div><b>{label}</b><span>{weight}</span><strong>{value}</strong></div><div className="metric-line"><i style={{ width: `${percent}%` }} /></div></div>; }

function Experiment({ go }: { go: (v: View) => void }) { return <div className="page"><div className="page-heading"><div><span className="eyebrow mint">7-DAY EXPERIMENT · DAY 3</span><h1>前端模拟面试验证实验</h1><p>用最小成本判断：有经验的前端工程师，是否愿意为“项目深挖”付费。</p></div><button className="primary-small" onClick={() => go("paths")}>查看路径选择</button></div><section className="hypothesis-card"><span className="eyebrow">核心假设</span><h2>“项目写得不错但讲不深入”的前端工程师，愿意支付 ¥199 获得一次针对性模拟面试。</h2><div className="hypothesis-meta"><div><span>目标用户</span><b>1—3 年经验前端</b></div><div><span>验证周期</span><b>7 天</b></div><div><span>成功标准</span><b>3 条线索 · 1 次成交</b></div><div><span>当前信号</span><b className="mint-text">初步形成</b></div></div></section><section className="experiment-flow"><div className="flow-title"><h3>验证路径</h3><span>所有数据都回到这条假设</span></div><div className="flow-track"><FlowNode no="01" title="痛点内容" sub="2 / 3 已发布" done /><FlowNode no="02" title="有效线索" sub="2 / 3 已获得" done /><FlowNode no="03" title="付费行动" sub="0 / 1 待验证" /><FlowNode no="04" title="真实反馈" sub="0 / 1 待回流" /></div></section></div>; }
function FlowNode({ no, title, sub, done }: { no: string; title: string; sub: string; done?: boolean }) { return <div className={done ? "flow-node done" : "flow-node"}><span>{done ? "✓" : no}</span><b>{title}</b><small>{sub}</small></div>; }

function Content() {
  const [channel, setChannel] = useState("小红书"); const [copied, setCopied] = useState(false);
  return <div className="page"><div className="page-heading"><div><span className="eyebrow mint">CONTENT LAB</span><h1>内容与渠道</h1><p>每一条内容都服务于一个商业假设，而不是追逐空洞流量。</p></div><button className="primary-small" onClick={() => setCopied(true)}>{copied ? "草稿已保存" : "+ 新建内容"}</button></div><div className="content-layout"><section className="content-settings"><span className="eyebrow">实验设置</span><label>要验证的痛点<select><option>项目经历讲不深入</option><option>面试紧张</option></select></label><label>目标用户<select><option>1—3 年经验前端</option></select></label><label>发布渠道</label><div className="channel-row">{["小红书", "朋友圈", "公众号"].map(c => <button key={c} onClick={() => setChannel(c)} className={channel === c ? "selected" : ""}>{c}</button>)}</div><div className="coach-note compact"><span>内容旁批</span><p>不要急着介绍服务。先让用户在前三行认出自己的问题。</p><b>依据：2 条线索原话</b></div></section><section className="editor-card"><div className="editor-top"><div><span className="chip">{channel} · 痛点验证</span><small>草稿已自动保存</small></div><button onClick={() => setCopied(true)}>{copied ? "已复制" : "复制文案"}</button></div><h2>为什么很多前端项目写得不错，<br />却在面试中讲不深入？</h2><p>你可能做过复杂的中后台，也解决过线上性能问题。</p><p>但面试官追问：“为什么这样设计？”“还有什么替代方案？”时，回答却突然变得零散。</p><p>问题通常不是你没做过，而是你没有把一次项目经历整理成：</p><ul><li>业务问题是怎么被发现的</li><li>技术选择背后的判断是什么</li><li>结果如何被验证</li></ul><p className="editor-highlight">我整理了一份「项目深挖自测表」。如果你也卡在这里，评论区留下“项目”，我发给你。</p><div className="content-footer"><span>预计阅读 43 秒</span><span>目标：获得 2 条有效咨询</span></div></section></div></div>;
}

function Leads({ selected, setSelected }: { selected: number; setSelected: (n: number) => void }) {
  const active = leads[selected];
  return <div className="page"><div className="page-heading"><div><span className="eyebrow mint">LEAD RIVER</span><h1>线索流</h1><p>看见每一条线索从哪里来，以及下一步应该流向哪里。</p></div><button className="primary-small">+ 记录线索</button></div><section className="river-overview"><div className="river-stage active"><span>发现</span><b>4</b></div><i /><div className="river-stage active"><span>已互动</span><b>3</b></div><i /><div className="river-stage active"><span>明确需求</span><b>2</b></div><i /><div className="river-stage"><span>已成交</span><b>0</b></div><div className="sediment"><span>↳ 暂缓 1</span></div></section><div className="leads-layout"><section className="lead-table"><div className="table-head"><span>线索</span><span>信号</span><span>阶段</span><span>最近互动</span></div>{leads.map((lead, i) => <button key={lead.name} onClick={() => setSelected(i)} className={selected === i ? "table-row selected" : "table-row"}><span><i className={`avatar ${lead.tone}`}>{lead.name[0]}</i><b>{lead.name}<small>{lead.role}</small></b></span><span>{lead.signal}</span><span><em>{lead.stage}</em></span><time>{lead.time}</time></button>)}</section><aside className="lead-detail"><div className="detail-person"><span className={`avatar big ${active.tone}`}>{active.name[0]}</span><div><h3>{active.name}</h3><p>{active.role} · 来自小红书</p></div></div><div className="detail-signal"><span className="eyebrow">关键原话</span><blockquote>“{active.signal}，想知道有没有针对这个的练习。”</blockquote></div><div className="recommendation"><span>下一最佳行动</span><h3>先发送项目深挖自测表</h3><p>对方已经表达痛点，但还没有建立付费信任。先提供一次小价值，再询问最担心的追问类型。</p><b>较强信号 · 基于 2 次互动</b><button>使用建议话术 <i>→</i></button></div></aside></div></div>;
}

function Review({ playing, setPlaying }: { playing: boolean; setPlaying: (v: boolean) => void }) { return <div className={playing ? "page review-page playing" : "page review-page"}><div className="review-header"><div><span className="eyebrow mint">WEEK 01 · GROWTH REVIEW</span><h1>这一周，你验证了什么？</h1></div><button className="quiet-button" onClick={() => setPlaying(!playing)}>{playing ? "暂停演化" : "播放本周演化"} <span>{playing ? "Ⅱ" : "▶"}</span></button></div><section className="review-river"><div className="river-labels"><span>内容</span><span>线索</span><span>行动</span><span>反馈</span></div><div className="river-lines"><div className="stream s1"><i /><b>项目深挖</b></div><div className="stream s2"><i /><b>面试焦虑</b></div><div className="stream s3"><i /><b>八股复习</b></div><div className="confluence"><span>2</span><small>有效信号</small></div><div className="reservoir-review"><i /><strong>初步验证</strong></div></div></section><section className="review-insight"><span className="insight-mark large">↳</span><div><span className="eyebrow">本周最重要的收获</span><h2>你没有证明自己会写内容。<br />你证明了“项目深挖”是真实需求。</h2><p>3 篇内容带来 2 条有效线索，其中两位用户主动使用了相同表达。流量不是最大的，但信号最清晰。</p></div><div className="evidence-score"><span>证据强度</span><div><i /><i /><i /><i /></div><b>初步形成</b></div></section><section className="evolution"><div><span className="eyebrow">产品进化建议</span><p>从宽泛服务，收窄到已出现真实信号的场景。</p></div><div className="product-evolution"><span><small>原始假设</small><b>前端模拟面试</b></span><i>→</i><span className="future-product"><small>下一轮实验</small><b>前端项目深挖<br />模拟面试</b></span><button>开启下一轮实验 →</button></div></section></div>; }

function Onboarding({ step, setStep, go }: { step: number; setStep: (n: number) => void; go: (v: View) => void }) { return <div className="onboarding-page"><div className="onboarding-main"><button className="back-link" onClick={() => go("today")}>← 返回工作区</button><div className="interview-progress"><span>能力探索</span><div><i style={{ width: `${step * 20}%` }} /></div><b>{step} / 5</b></div><span className="eyebrow mint">问题 {step}</span><h1>{step < 5 ? "有没有哪一次，你帮助别人解决问题后，对方明确说“这对我很有用”？" : "很好，你的能力源泉已经形成。"}</h1><p className="why-ask">为什么问这个？<br />真实的帮助经历，比“我擅长什么”的自我判断更接近可售卖的价值。</p>{step < 5 ? <><textarea defaultValue="我曾经帮 4 位朋友准备前端面试。后来发现他们最容易卡住的，不是八股题，而是不知道怎么把项目经历讲深入……" /><div className="interview-actions"><button className="skip" onClick={() => setStep(Math.min(5, step + 1))}>暂时跳过</button><button className="primary-small" onClick={() => setStep(Math.min(5, step + 1))}>继续探索 →</button></div></> : <button className="primary-small path-cta" onClick={() => go("paths")}>查看三条商业路径 →</button>}</div><aside className="source-map"><span className="eyebrow">能力源泉 · 实时形成</span><div className="source-canvas"><div className="source-node n1 verified"><span>React 工程</span><small>架构升级</small></div><div className="source-node n2 verified"><span>面试辅导</span><small>帮助 4 人</small></div><div className="source-node n3"><span>内容表达</span><small>证据待验证</small></div><div className="source-node n4 verified"><span>项目拆解</span><small>复盘经验</small></div><div className="source-center"><i /><strong>你的源泉</strong><small>3 项有证据能力</small></div><div className="source-path p1" /><div className="source-path p2" /><div className="source-path p3" /><div className="source-path p4" /></div><div className="evidence-legend"><span><i className="solid" />已有真实证据</span><span><i />仍需验证</span></div></aside></div>; }

function Paths({ go }: { go: (v: View) => void }) {
  const [selected, setSelected] = useState(0); const paths = [{ price: "¥199", title: "项目深挖模拟面试", time: "7 天", fit: "最适合现在", evidence: "4 次辅导经历 + 明确痛点", risk: "需要验证付费意愿" }, { price: "¥999", title: "前端求职陪跑", time: "45 天", fit: "中期潜力", evidence: "能力覆盖较完整", risk: "需要口碑与交付体系" }, { price: "¥1,999", title: "项目实战辅导", time: "90 天", fit: "长期方向", evidence: "工程经验可迁移", risk: "需要更多项目案例" }];
  return <div className="paths-page"><button className="back-link" onClick={() => go("onboarding")}>← 返回能力源泉</button><div className="paths-heading"><span className="eyebrow mint">CHOOSE A FUTURE</span><h1>你的能力，可以流向三种未来。</h1><p>不是选择一个永久方向，而是选择下一步最值得验证的支流。</p></div><div className="future-grid">{paths.map((p, i) => <button className={selected === i ? "future-card selected" : "future-card"} key={p.title} onClick={() => setSelected(i)}><div className="future-top"><span>{i === 0 ? "最适合你当前的时间与证据" : `路径 0${i + 1}`}</span><i>{selected === i ? "✓" : ""}</i></div><strong className="price">{p.price}<small> / 起</small></strong><h2>{p.title}</h2><div className="future-timeline"><span>今天</span><i /><span>{p.time}后</span></div><b className="future-result">{i === 0 ? "完成第一次付费验证" : i === 1 ? "拥有一套陪跑服务" : "形成高客单产品"}</b><dl><div><dt>匹配度</dt><dd>{p.fit}</dd></div><div><dt>依据</dt><dd>{p.evidence}</dd></div><div><dt>最大风险</dt><dd>{p.risk}</dd></div></dl></button>)}</div><div className="path-bottom"><div><span>教练建议</span><p>先用 7 天验证最具体的痛点。一次真实付费，比规划一门完整课程更有价值。</p></div><button className="primary-small" onClick={() => go("experiment")}>进入这条路径 →</button></div></div>;
}
