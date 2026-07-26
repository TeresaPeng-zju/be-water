export type PrototypeLocale = "zh-CN" | "zh-TW" | "en-US";

export function prototypeLocale(locale:string):PrototypeLocale {
  return locale === "en" || locale === "en-US" ? "en-US" : locale === "zh-TW" ? "zh-TW" : "zh-CN";
}

export const prototypeUi = {
  "zh-CN": {
    nav:["服务与案例","证据观察","增长闭环","本地记忆"],
    notebookCta:["把这些判断变成本周行动","Bee 会选择三项优先动作，并生成可直接使用的营销素材。","查看增长计划"],
    caseStory:["返回增长计划","完整经营旅程","从咨询、预约到交付与反馈","Bee 把不同材料中的经营事件按同一个客户串联起来，每一步都能回到原始记录。","同一客户","记录","已归一为"],
    growth:{title:"本周增长行动",progress:["真实材料","证据诊断","本周行动","执行结果","下一轮调整"],diagnosis:"有证据的增长诊断",source:"查看原始记录",fullCase:"查看“一条 / 小鱼”完整案例",actionsLabel:"本周只做三件事",actionsTitle:"从判断直接进入行动",target:"目标：3 个有效咨询",allDone:"全部已执行",markAll:"全部标记已执行",copy:"复制全文",copied:"已复制",generated:(n:number)=>`依据 ${n} 条真实记录生成`,done:"已执行",markDone:"标记为已执行",results:"执行结果",resultsTitle:"让结果成为下一轮证据",fillResults:"快速填入本次结果",noResult:"尚未记录结果",edit:"修改",record:"记录结果",revision:"BEE 下一轮调整",judgment:"本轮判断",next:"下一轮三项行动",ready:"结果已经回来，可以更新下一轮判断。",waiting:"完成行动并记录结果后，Bee 会在这里调整策略。",revisionBody:"Bee 会比较渠道、主题和漏斗表现，明确什么继续、什么修改，以及下周最值得做什么。",generateRevision:"根据结果生成下一轮调整",resultEditor:"记录这项行动的结果",cancel:"取消",save:"保存并回流",emptyMock:"Bee 正在整理演示经营记录",empty:"让真实经营变成下一步行动",emptyMockBody:"马上为你还原证据、诊断、行动、素材、结果和调整。",emptyBody:"Bee 会根据现有真实案例形成第一份本周增长计划。",create:"根据现有证据生成计划",needEvidence:"请先留下至少一条案例记录"},
    channels:{xianyu:"闲鱼服务页",xiaohongshu:"小红书帖子",wechat:"微信回访"},statuses:{planned:"待准备",ready:"素材已生成",published:"已执行",measured:"结果已回流"},metrics:["曝光","收藏/互动","咨询","预约","成交","收入"],asset:"素材",
  },
  "zh-TW": {
    nav:["服務與案例","證據觀察","成長閉環","本機記憶"],
    notebookCta:["把這些判斷變成本週行動","Bee 會選擇三項優先行動，並產生可直接使用的行銷素材。","查看成長計畫"],
    caseStory:["返回成長計畫","完整經營旅程","從諮詢、預約到交付與回饋","Bee 把不同材料中的經營事件依同一位客戶串聯起來，每一步都能回到原始記錄。","同一客戶","記錄","已歸一為"],
    growth:{title:"本週成長行動",progress:["真實材料","證據診斷","本週行動","執行結果","下一輪調整"],diagnosis:"有證據的成長診斷",source:"查看原始記錄",fullCase:"查看「一條 / 小魚」完整案例",actionsLabel:"本週只做三件事",actionsTitle:"從判斷直接進入行動",target:"目標：3 個有效諮詢",allDone:"全部已執行",markAll:"全部標記已執行",copy:"複製全文",copied:"已複製",generated:(n:number)=>`依據 ${n} 條真實記錄產生`,done:"已執行",markDone:"標記為已執行",results:"執行結果",resultsTitle:"讓結果成為下一輪證據",fillResults:"快速填入本次結果",noResult:"尚未記錄結果",edit:"修改",record:"記錄結果",revision:"BEE 下一輪調整",judgment:"本輪判斷",next:"下一輪三項行動",ready:"結果已經回來，可以更新下一輪判斷。",waiting:"完成行動並記錄結果後，Bee 會在這裡調整策略。",revisionBody:"Bee 會比較渠道、主題和漏斗表現，明確什麼繼續、什麼修改，以及下週最值得做什麼。",generateRevision:"根據結果產生下一輪調整",resultEditor:"記錄這項行動的結果",cancel:"取消",save:"儲存並回流",emptyMock:"Bee 正在整理示範經營記錄",empty:"讓真實經營變成下一步行動",emptyMockBody:"馬上為你還原證據、診斷、行動、素材、結果和調整。",emptyBody:"Bee 會根據現有真實案例形成第一份本週成長計畫。",create:"根據現有證據產生計畫",needEvidence:"請先留下至少一條案例記錄"},
    channels:{xianyu:"閒魚服務頁",xiaohongshu:"小紅書貼文",wechat:"微信回訪"},statuses:{planned:"待準備",ready:"素材已產生",published:"已執行",measured:"結果已回流"},metrics:["曝光","收藏／互動","諮詢","預約","成交","收入"],asset:"素材",
  },
  "en-US": {
    nav:["Services & Cases","Evidence","Growth Loop","Local Memory"],
    notebookCta:["Turn these judgments into this week's actions","Bee selects three priorities and creates marketing assets you can use immediately.","View growth plan"],
    caseStory:["Back to growth plan","Complete business journey","From inquiry and booking to delivery and feedback","Bee connects business events from different materials to the same client, with every step linked back to its source.","Same client","Record","Unified as"],
    growth:{title:"This Week's Growth Actions",progress:["Real material","Evidence diagnosis","Weekly actions","Execution results","Next adjustment"],diagnosis:"Evidence-backed growth diagnosis",source:"View source record",fullCase:"View the complete Yitiao / Xiaoyu case",actionsLabel:"Only three priorities this week",actionsTitle:"Move directly from judgment to action",target:"Goal: 3 qualified inquiries",allDone:"All executed",markAll:"Mark all as executed",copy:"Copy all",copied:"Copied",generated:(n:number)=>`Generated from ${n} real records`,done:"Executed",markDone:"Mark as executed",results:"Execution results",resultsTitle:"Turn results into evidence for the next round",fillResults:"Fill demo results",noResult:"No result recorded",edit:"Edit",record:"Record result",revision:"BEE'S NEXT ADJUSTMENT",judgment:"Current judgment",next:"Three actions for the next round",ready:"Results are back. Bee can update the next judgment.",waiting:"Complete an action and record its result, then Bee will adjust the strategy here.",revisionBody:"Bee compares channels, themes, and funnel performance to decide what to continue, what to change, and what matters most next week.",generateRevision:"Generate next adjustment from results",resultEditor:"Record the result of this action",cancel:"Cancel",save:"Save and feed back",emptyMock:"Bee is organizing the demo business records",empty:"Turn real business experience into the next action",emptyMockBody:"Bee is reconstructing the evidence, diagnosis, actions, assets, results, and adjustment.",emptyBody:"Bee will create the first weekly growth plan from your existing real cases.",create:"Create a plan from existing evidence",needEvidence:"Add at least one case record first"},
    channels:{xianyu:"Xianyu service page",xiaohongshu:"Xiaohongshu post",wechat:"WeChat follow-up"},statuses:{planned:"Planned",ready:"Asset ready",published:"Executed",measured:"Results captured"},metrics:["Impressions","Saves / engagement","Inquiries","Bookings","Sales","Revenue"],asset:" asset",
  },
} as const;
