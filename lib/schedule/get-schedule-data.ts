import type {
  ScheduleDay,
  SchedulePageData,
  ScheduleService,
  ScheduleWorkBlock,
  ScheduleWorkKind,
} from "@/lib/domain/schedule";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ScheduleBlockRow = {
  id: string;
  order_id: string | null;
  title: string;
  work_type: string;
  scheduled_date: string;
  estimated_duration_hours: number | string;
  actual_duration_hours: number | string | null;
};

type OrderRow = {
  id: string;
  customer_name: string;
  service_id: string;
  status: string | null;
  result: string;
};

type ServiceRow = {
  id: string;
  name: string;
  estimated_work_hours: number | string;
  standard_delivery_days: number | string;
  rush_supported: boolean;
  rush_delivery_days: number | string | null;
};

const weekdayNames = [
  ["Monday", "Mon"],
  ["Tuesday", "Tue"],
  ["Wednesday", "Wed"],
  ["Thursday", "Thu"],
  ["Friday", "Fri"],
  ["Saturday", "Sat"],
  ["Sunday", "Sun"],
] as const;

function dateKeyInShanghai() {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function mondayOf(date: string) {
  const value = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(value.getTime())) return mondayOf(dateKeyInShanghai());
  const day = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() - day + 1);
  return value.toISOString().slice(0, 10);
}

function requestedWeekStart(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return mondayOf(dateKeyInShanghai());
  }
  return mondayOf(value);
}

function weekLabel(start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);
  const startLabel = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(startDate);
  const endLabel = new Intl.DateTimeFormat("en", {
    month: startDate.getUTCMonth() === endDate.getUTCMonth() ? undefined : "short",
    day: "numeric",
    year: startDate.getUTCFullYear() === endDate.getUTCFullYear() ? undefined : "numeric",
    timeZone: "UTC",
  }).format(endDate);
  return `${startLabel} – ${endLabel}, ${endDate.getUTCFullYear()}`;
}

function normalizeWorkType(value: string): ScheduleWorkKind {
  if (value === "Service delivery") return "Delivery";
  if (value === "Content work") return "Content";
  if (value === "Unavailable time") return "Unavailable";
  if (value === "Customer communication") return "Follow-up";
  if (
    value === "Preparation" ||
    value === "Revision" ||
    value === "Follow-up"
  ) {
    return value;
  }
  return "Delivery";
}

function buildDays(
  start: string,
  weeklyCapacityHours: number | undefined,
  blocks: ScheduleWorkBlock[],
): ScheduleDay[] {
  const weekdayCapacity =
    weeklyCapacityHours === undefined ? undefined : weeklyCapacityHours / 5;
  return weekdayNames.map(([label, shortLabel], index) => {
    const date = addDays(start, index);
    return {
      date,
      label,
      shortLabel,
      dayNumber: date.slice(8, 10).replace(/^0/, ""),
      workingHours: index < 5 ? weekdayCapacity : 0,
      blocks: blocks.filter((block) => block.scheduledDate === date),
    };
  });
}

function buildObservation(
  weekStart: string,
  weeklyCapacityHours: number | undefined,
  history: ScheduleBlockRow[],
) {
  if (weeklyCapacityHours === undefined) return undefined;
  const dailyCapacity = weeklyCapacityHours / 5;
  for (let weekday = 0; weekday < 5; weekday += 1) {
    const overloadedEveryWeek = [0, 1, 2].every((weeksAgo) => {
      const date = addDays(weekStart, weekday - weeksAgo * 7);
      const scheduled = history
        .filter((block) => block.scheduled_date === date)
        .reduce((sum, block) => sum + Number(block.estimated_duration_hours), 0);
      return scheduled > dailyCapacity;
    });
    if (overloadedEveryWeek) {
      return `Your ${weekdayNames[weekday][0]}s have been overloaded for three consecutive weeks.`;
    }
  }
  return undefined;
}

function emptyData(weekStart: string): SchedulePageData {
  const today = dateKeyInShanghai();
  const weekEnd = addDays(weekStart, 6);
  return {
    today,
    weekStart,
    weekEnd,
    weekLabel: weekLabel(weekStart, weekEnd),
    previousWeekStart: addDays(weekStart, -7),
    nextWeekStart: addDays(weekStart, 7),
    days: buildDays(weekStart, undefined, []),
    services: [],
    activeOrderCount: 0,
  };
}

export async function getScheduleData(requestedWeek?: string): Promise<SchedulePageData> {
  const weekStart = requestedWeekStart(requestedWeek);
  const empty = emptyData(weekStart);

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return empty;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return empty;

    const weekEnd = addDays(weekStart, 6);
    const historyStart = addDays(weekStart, -14);
    const [blocksResult, ordersResult, servicesResult, settingsResult] = await Promise.all([
      supabase
        .from("schedule_blocks")
        .select(
          "id,order_id,title,work_type,scheduled_date,estimated_duration_hours,actual_duration_hours",
        )
        .gte("scheduled_date", historyStart)
        .lte("scheduled_date", weekEnd)
        .order("scheduled_date", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("orders")
        .select("id,customer_name,service_id,status,result")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("services")
        .select(
          "id,name,estimated_work_hours,standard_delivery_days,rush_supported,rush_delivery_days",
        )
        .order("created_at", { ascending: true }),
      supabase
        .from("workspace_settings")
        .select("weekly_capacity_hours")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    if (blocksResult.error || ordersResult.error || servicesResult.error || settingsResult.error) {
      return empty;
    }

    const blockRows = (blocksResult.data ?? []) as ScheduleBlockRow[];
    const orderRows = (ordersResult.data ?? []) as OrderRow[];
    const serviceRows = (servicesResult.data ?? []) as ServiceRow[];
    const orderMap = new Map(orderRows.map((order) => [order.id, order]));
    const serviceMap = new Map(serviceRows.map((service) => [service.id, service.name]));

    const blocks: ScheduleWorkBlock[] = blockRows
      .filter(
        (block) => block.scheduled_date >= weekStart && block.scheduled_date <= weekEnd,
      )
      .map((block) => {
        const order = block.order_id ? orderMap.get(block.order_id) : undefined;
        return {
          id: block.id,
          title: block.title,
          workType: normalizeWorkType(block.work_type),
          scheduledDate: block.scheduled_date,
          estimatedHours: Number(block.estimated_duration_hours),
          actualHours:
            block.actual_duration_hours === null
              ? undefined
              : Number(block.actual_duration_hours),
          orderId: order?.id,
          customerName: order?.customer_name,
          serviceName: order ? serviceMap.get(order.service_id) : undefined,
        };
      });

    const services: ScheduleService[] = serviceRows.map((service) => ({
      id: service.id,
      name: service.name,
      estimatedWorkHours: Number(service.estimated_work_hours),
      deliveryDays: Number(service.standard_delivery_days),
      rushSupported: service.rush_supported,
      rushDeliveryDays:
        service.rush_delivery_days === null
          ? undefined
          : Number(service.rush_delivery_days),
    }));

    const weeklyCapacityValue = settingsResult.data?.weekly_capacity_hours;
    const weeklyCapacityHours =
      weeklyCapacityValue === null || weeklyCapacityValue === undefined
        ? undefined
        : Number(weeklyCapacityValue);
    const activeOrderCount = orderRows.filter(
      (order) =>
        order.status === "Not Started" ||
        order.status === "In Progress" ||
        order.status === "Waiting Customer" ||
        (!order.status && order.result === "Still in progress"),
    ).length;

    return {
      ...empty,
      weeklyCapacityHours,
      days: buildDays(weekStart, weeklyCapacityHours, blocks),
      services,
      activeOrderCount,
      observation: buildObservation(weekStart, weeklyCapacityHours, blockRows),
    };
  } catch {
    return empty;
  }
}
