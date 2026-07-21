import type {
  AssetCategory,
  AssetEvolutionEvent,
  AssetMaturity,
  AssetUsageEvent,
  BusinessAsset,
  BusinessAssetOrder,
  BusinessAssetsData,
} from "@/lib/domain/business-assets";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ServiceRow = { id: string; name: string };
type OrderRow = {
  id: string;
  customer_id: string | null;
  customer_name: string;
  service_id: string;
  order_date: string;
  status: string | null;
  result: string;
  created_at: string;
};
type CustomerRow = { id: string; name: string };
type ScheduleRow = {
  id: string;
  order_id: string | null;
  title: string;
  work_type: string;
  scheduled_date: string;
  created_at: string;
};
type AssetRow = {
  id: string;
  source_key: string | null;
  title: string;
  category: AssetCategory;
  description: string;
  origin: string;
  origin_order_id: string | null;
  maturity: AssetMaturity;
  current_version: string;
  updated_at: string;
};
type UsageRow = {
  id: string;
  asset_id: string;
  order_id: string;
  customer_id: string | null;
  note: string | null;
  used_at: string;
};
type EvolutionRow = {
  id: string;
  asset_id: string;
  event_type: AssetEvolutionEvent["eventType"];
  title: string;
  detail: string | null;
  version: string | null;
  occurred_at: string;
};

type DetectedAsset = {
  sourceKey: string;
  serviceId: string;
  workType: string;
  title: string;
  category: AssetCategory;
  description: string;
  origin: string;
  originOrderId: string;
  orderIds: string[];
  usedAtByOrder: Map<string, string>;
};

const empty: BusinessAssetsData = {
  assets: [],
  availableOrders: [],
  growth: { total: 0, validated: 0, productReady: 0 },
};

const assetShape: Record<string, { suffix: string; category: AssetCategory; action: string }> = {
  Preparation: { suffix: "Preparation Checklist", category: "Checklists", action: "preparation" },
  "Service delivery": { suffix: "Delivery Checklist", category: "Checklists", action: "delivery" },
  Revision: { suffix: "Revision Checklist", category: "Checklists", action: "revision" },
  "Customer communication": { suffix: "Client Update Template", category: "Templates", action: "customer communication" },
  "Follow-up": { suffix: "Follow-up Template", category: "Templates", action: "follow-up" },
  "Content work": { suffix: "Content SOP", category: "SOPs", action: "content work" },
};

function statusOf(order: OrderRow) {
  return order.status ?? order.result;
}

function asOrder(order: OrderRow, services: Map<string, ServiceRow>): BusinessAssetOrder {
  return {
    id: order.id,
    customerName: order.customer_name,
    serviceName: services.get(order.service_id)?.name ?? "Service",
    date: order.order_date,
    result: statusOf(order),
  };
}

function sourceKey(serviceId: string, workType: string) {
  return `${serviceId}:${workType.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function detectAssets(
  schedule: ScheduleRow[],
  orders: Map<string, OrderRow>,
  services: Map<string, ServiceRow>,
): DetectedAsset[] {
  const groups = new Map<string, ScheduleRow[]>();
  for (const block of schedule) {
    if (!block.order_id || !assetShape[block.work_type]) continue;
    const order = orders.get(block.order_id);
    if (!order) continue;
    const key = sourceKey(order.service_id, block.work_type);
    groups.set(key, [...(groups.get(key) ?? []), block]);
  }

  return [...groups.entries()].flatMap(([key, blocks]) => {
    const distinctOrderIds = [...new Set(blocks.flatMap((block) => block.order_id ? [block.order_id] : []))];
    if (distinctOrderIds.length < 3) return [];
    const firstOrder = orders.get(distinctOrderIds[distinctOrderIds.length - 1]);
    if (!firstOrder) return [];
    const service = services.get(firstOrder.service_id);
    const shape = assetShape[blocks[0].work_type];
    if (!service || !shape) return [];
    const usedAtByOrder = new Map<string, string>();
    for (const block of blocks) {
      if (!block.order_id) continue;
      const current = usedAtByOrder.get(block.order_id);
      const blockDate = `${block.scheduled_date}T12:00:00Z`;
      if (!current || Date.parse(blockDate) > Date.parse(current)) usedAtByOrder.set(block.order_id, blockDate);
    }
    return [{
      sourceKey: key,
      serviceId: firstOrder.service_id,
      workType: blocks[0].work_type,
      title: `${service.name} ${shape.suffix}`,
      category: shape.category,
      description: `A reusable ${shape.action} tool shaped by repeated ${service.name} delivery.`,
      origin: `Emerged from ${blocks.length} recorded ${shape.action} work blocks across ${distinctOrderIds.length} customer orders.`,
      originOrderId: distinctOrderIds[distinctOrderIds.length - 1],
      orderIds: distinctOrderIds,
      usedAtByOrder,
    }];
  });
}

function productOpportunity(asset: AssetRow, uses: UsageRow[]) {
  const customers = new Set(uses.map((usage) => usage.customer_id).filter(Boolean));
  if (asset.maturity !== "Product Ready" || uses.length < 12 || customers.size < 5) return undefined;
  const format = asset.category === "Templates"
    ? "a focused template pack"
    : asset.category === "Checklists"
      ? "a standalone starter kit"
      : asset.category === "SOPs"
        ? "a practical operating guide"
        : "a small standalone resource";
  return {
    statement: `This asset has been used successfully in ${uses.length} customer orders across ${customers.size} customers.`,
    possibleValue: `It may now be worth testing as ${format}. The evidence supports a small product test—not a course by default.`,
  };
}

export async function getBusinessAssets(): Promise<BusinessAssetsData> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return empty;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return empty;

    const [servicesResult, ordersResult, customersResult, scheduleResult] = await Promise.all([
      supabase.from("services").select("id,name"),
      supabase
        .from("orders")
        .select("id,customer_id,customer_name,service_id,order_date,status,result,created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase.from("customers").select("id,name"),
      supabase
        .from("schedule_blocks")
        .select("id,order_id,title,work_type,scheduled_date,created_at")
        .order("scheduled_date", { ascending: false })
        .limit(1000),
    ]);
    if (servicesResult.error || ordersResult.error || customersResult.error || scheduleResult.error) return empty;

    const services = new Map(((servicesResult.data ?? []) as ServiceRow[]).map((row) => [row.id, row]));
    const orderRows = (ordersResult.data ?? []) as OrderRow[];
    const orders = new Map(orderRows.map((row) => [row.id, row]));
    const customers = new Map(((customersResult.data ?? []) as CustomerRow[]).map((row) => [row.id, row]));
    const detected = detectAssets((scheduleResult.data ?? []) as ScheduleRow[], orders, services);

    if (detected.length) {
      await supabase.from("business_assets").upsert(
        detected.map((asset) => ({
          user_id: user.id,
          source_key: asset.sourceKey,
          title: asset.title,
          category: asset.category,
          description: asset.description,
          origin: asset.origin,
          origin_order_id: asset.originOrderId,
        })),
        { onConflict: "user_id,source_key", ignoreDuplicates: true },
      );
    }

    let assetsResult = await supabase
      .from("business_assets")
      .select("id,source_key,title,category,description,origin,origin_order_id,maturity,current_version,updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (assetsResult.error) return { ...empty, availableOrders: orderRows.map((order) => asOrder(order, services)) };

    const assetsBySource = new Map(
      ((assetsResult.data ?? []) as AssetRow[]).flatMap((asset) => asset.source_key ? [[asset.source_key, asset] as const] : []),
    );
    const detectedUsages = detected.flatMap((candidate) => {
      const asset = assetsBySource.get(candidate.sourceKey);
      if (!asset) return [];
      return candidate.orderIds.flatMap((orderId) => {
        const order = orders.get(orderId);
        if (!order) return [];
        return [{
          user_id: user.id,
          asset_id: asset.id,
          order_id: orderId,
          customer_id: order.customer_id,
          usage_source: "Detected",
          note: `Detected from recorded ${candidate.workType.toLowerCase()} work.`,
          used_at: candidate.usedAtByOrder.get(orderId) ?? order.created_at,
        }];
      });
    });
    if (detectedUsages.length) {
      await supabase.from("business_asset_usages").upsert(detectedUsages, {
        onConflict: "asset_id,order_id",
        ignoreDuplicates: true,
      });
      assetsResult = await supabase
        .from("business_assets")
        .select("id,source_key,title,category,description,origin,origin_order_id,maturity,current_version,updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
    }

    const assetRows = (assetsResult.data ?? []) as AssetRow[];
    if (!assetRows.length) return { ...empty, availableOrders: orderRows.map((order) => asOrder(order, services)) };
    const assetIds = assetRows.map((asset) => asset.id);
    const [usageResult, evolutionResult] = await Promise.all([
      supabase
        .from("business_asset_usages")
        .select("id,asset_id,order_id,customer_id,note,used_at")
        .in("asset_id", assetIds)
        .order("used_at", { ascending: false }),
      supabase
        .from("business_asset_evolution")
        .select("id,asset_id,event_type,title,detail,version,occurred_at")
        .in("asset_id", assetIds)
        .order("occurred_at", { ascending: true }),
    ]);
    if (usageResult.error || evolutionResult.error) return empty;
    const usageRows = (usageResult.data ?? []) as UsageRow[];
    const evolutionRows = (evolutionResult.data ?? []) as EvolutionRow[];

    const assets: BusinessAsset[] = assetRows.map((asset) => {
      const assetUses = usageRows.filter((usage) => usage.asset_id === asset.id);
      const orderIds = [...new Set(assetUses.map((usage) => usage.order_id))];
      const relatedOrders = orderIds.flatMap((id) => {
        const order = orders.get(id);
        return order ? [asOrder(order, services)] : [];
      });
      const customerCounts = new Map<string, number>();
      for (const usage of assetUses) {
        if (usage.customer_id) customerCounts.set(usage.customer_id, (customerCounts.get(usage.customer_id) ?? 0) + 1);
      }
      const usageTimeline: AssetUsageEvent[] = assetUses.flatMap((usage) => {
        const order = orders.get(usage.order_id);
        if (!order) return [];
        return [{
          id: usage.id,
          usedAt: usage.used_at,
          customerName: order.customer_name,
          serviceName: services.get(order.service_id)?.name ?? "Service",
          orderId: order.id,
          ...(usage.note ? { note: usage.note } : {}),
        }];
      });
      const evolution: AssetEvolutionEvent[] = evolutionRows
        .filter((event) => event.asset_id === asset.id)
        .map((event) => ({
          id: event.id,
          title: event.title,
          ...(event.detail ? { detail: event.detail } : {}),
          ...(event.version ? { version: event.version } : {}),
          occurredAt: event.occurred_at,
          eventType: event.event_type,
        }));
      return {
        id: asset.id,
        title: asset.title,
        category: asset.category,
        description: asset.description,
        origin: asset.origin,
        ...(asset.origin_order_id ? { originOrderId: asset.origin_order_id } : {}),
        maturity: asset.maturity,
        currentVersion: asset.current_version,
        timesUsed: assetUses.length,
        lastUpdated: asset.updated_at,
        relatedOrders,
        relatedCustomers: [...customerCounts.entries()].flatMap(([id, usageCount]) => {
          const customer = customers.get(id);
          return customer ? [{ id, name: customer.name, usageCount }] : [];
        }),
        usageTimeline,
        evolution,
        productOpportunity: productOpportunity(asset, assetUses),
      };
    });

    const recentMaturityEvent = [...evolutionRows]
      .reverse()
      .find((event) => event.event_type === "Maturity change");
    const recentMatch = recentMaturityEvent?.title.match(/^Moved from (Seed|Growing|Validated|Product Ready) to (Seed|Growing|Validated|Product Ready)$/);
    const recentAsset = recentMaturityEvent ? assetRows.find((asset) => asset.id === recentMaturityEvent.asset_id) : undefined;
    const mostUsed = [...assets].sort((a, b) => b.timesUsed - a.timesUsed)[0];

    return {
      assets,
      availableOrders: orderRows.map((order) => asOrder(order, services)),
      growth: {
        total: assets.length,
        validated: assets.filter((asset) => asset.maturity === "Validated" || asset.maturity === "Product Ready").length,
        productReady: assets.filter((asset) => asset.maturity === "Product Ready").length,
        ...(recentMatch && recentAsset && recentMaturityEvent ? {
          recent: {
            assetTitle: recentAsset.title,
            from: recentMatch[1] as AssetMaturity,
            to: recentMatch[2] as AssetMaturity,
            occurredAt: recentMaturityEvent.occurred_at,
          },
        } : {}),
      },
      ...(mostUsed && mostUsed.timesUsed >= 3 ? {
        beeObservation: `You no longer start this part of the work from zero. ${mostUsed.title} now carries experience from ${mostUsed.timesUsed} customer orders.`,
      } : {}),
    };
  } catch {
    return empty;
  }
}
