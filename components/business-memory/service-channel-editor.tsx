"use client";

import {Check, Plus, Trash2} from "lucide-react";
import {useTranslations} from "next-intl";
import {type ChannelStatus, type PlatformType, type PrototypeServiceChannel} from "@/lib/business-memory/store";

const platforms: PlatformType[] = ["xianyu", "xiaohongshu", "zhishixingqiu", "wechat", "douyin", "offline", "other"];
const statuses: ChannelStatus[] = ["testing", "active", "paused"];

export function ServiceChannelEditor({channels, onChange}: {channels: PrototypeServiceChannel[]; onChange: (channels: PrototypeServiceChannel[]) => void}) {
  const t = useTranslations("channels");

  function toggle(platform: PlatformType) {
    const existing = channels.find((channel) => channel.platform === platform);
    if (existing) onChange(channels.filter((channel) => channel.id !== existing.id));
    else onChange([...channels, {id:crypto.randomUUID(), platform, status:"active", launchedAt:new Date().toISOString().slice(0,10)}]);
  }

  function update(id: string, input: Partial<PrototypeServiceChannel>) {
    onChange(channels.map((channel) => channel.id === id ? {...channel, ...input} : channel));
  }

  return <div className="channel-editor">
    <div className="channel-options">{platforms.map((platform) => {const selected = channels.some((channel) => channel.platform === platform); return <button type="button" key={platform} className={selected ? "is-selected" : ""} onClick={() => toggle(platform)}>{selected ? <Check/> : <Plus/>}{t(`platforms.${platform}`)}</button>;})}</div>
    {channels.length ? <div className="channel-details">{channels.map((channel) => <div key={channel.id} className="channel-detail-row">
      <strong>{channel.platform === "other" ? <input value={channel.customName ?? ""} onChange={(event) => update(channel.id,{customName:event.target.value})} placeholder={t("otherPlaceholder")}/> : t(`platforms.${channel.platform}`)}</strong>
      <label><span>{t("launchDate")}</span><input type="date" value={channel.launchedAt ?? ""} onChange={(event) => update(channel.id,{launchedAt:event.target.value})}/></label>
      <label><span>{t("statusLabel")}</span><select value={channel.status} onChange={(event) => update(channel.id,{status:event.target.value as ChannelStatus})}>{statuses.map((status) => <option key={status} value={status}>{t(`statuses.${status}`)}</option>)}</select></label>
      <button type="button" onClick={() => onChange(channels.filter((entry) => entry.id !== channel.id))} aria-label={t("remove")}><Trash2/></button>
    </div>)}</div> : null}
  </div>;
}
