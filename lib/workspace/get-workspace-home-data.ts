import type {
  WorkspaceActivity,
  WorkspaceHomeData,
  WorkspaceOrder,
  WorkspaceTask,
} from "@/lib/domain/workspace-home";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ServiceRow = {
  id: string;
  name: string;
  estimated_work_hours: number | string;
  rush_supported: boolean;
};

type OrderRow = {
  id: string;
  service_id: string;
  customer_name: string;
  delivery_date: string;
  result: string;
  status: string | null;
  loss_reason: string | null;
  created_at: string;
};

type ScheduleRow = {
  id: string;
  title: string;
  work_type: string;
  scheduled_date: string;
  estimated_duration_hours: number | string;
  completed_at: string | null;
  created_at: string;
};

function dateKeyInShanghai(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function weekRange(today: string) {
  const anchor = new Date(`${today}T00:00:00Z`);
  const day = anchor.getUTCDay() || 7;
  const start = new Date(anchor);
  start.setUTCDate(anchor.getUTCDate() - day + 1);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function dateLabel(today: string) {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${today}T00:00:00Z`));
}

function roundHours(value: number) {
  return Math.round(value * 4) / 4;
}

function daysFrom(today: string, date: string) {
  const start = new Date(`${today}T00:00:00Z`).getTime();
  const end = new Date(`${date}T00:00:00Z`).getTime();
  return Math.round((end - start) / 86_400_000);
}

function buildObservation(
  orders: OrderRow[],
  currentOrders: OrderRow[],
  serviceNames: Map<string, string>,
  today: string,
) {
  const lossCounts = new Map<string, number>();
  for (const order of orders.slice(0, 12)) {
    if (order.result === "Did not proceed" && order.loss_reason) {
      lossCounts.set(order.loss_reason, (lossCounts.get(order.loss_reason) ?? 0) + 1);
    }
  }
  const repeatedLoss = [...lossCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (repeatedLoss && repeatedLoss[1] >= 3) {
    return `${repeatedLoss[1]} recent orders did not proceed because of ${repeatedLoss[0].toLowerCase()}. This is now a repeated pattern.`;
  }

  const dueSoon = currentOrders.filter((order) => {
    const days = daysFrom(today, order.delivery_date);
    return days >= 0 && days <= 3;
  });
  if (dueSoon.length >= 2) {
    return `${dueSoon.length} active orders are due in the next three days. Your delivery window is getting tighter.`;
  }

  const serviceCounts = new Map<string, number>();
  for (const order of orders.slice(0, 8)) {
    serviceCounts.set(order.service_id, (serviceCounts.get(order.service_id) ?? 0) + 1);
  }
  const repeatedService = [...serviceCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (repeatedService && repeatedService[1] >= 3) {
    const name = serviceNames.get(repeatedService[0]);
    if (name) {
      return `${repeatedService[1]} of your recent orders were for ${name}. Demand is beginning to concentrate around this service.`;
    }
  }

  return undefined;
}

function buildActivities(orders: OrderRow[], schedule: ScheduleRow[]): WorkspaceActivity[] {
  const orderActivity = orders.slice(0, 5).map((order) => ({
    id: `order-${order.id}`,
    text: `Order recorded for ${order.customer_name}.`,
    occurredAt: order.created_at,
  }));
  const scheduleActivity = schedule.slice(0, 8).flatMap((block) => {
    if (block.completed_at) {
      return [
        {
          id: `completed-${block.id}`,
          text: `${block.title} completed.`,
          occurredAt: block.completed_at,
        },
      ];
    }
    return [
      {
        id: `scheduled-${block.id}`,
        text: `${block.title} added to the schedule.`,
        occurredAt: block.created_at,
      },
    ];
  });

  return [...orderActivity, ...scheduleActivity]
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
    .slice(0, 4);
}

function emptyWorkspace(today: string): WorkspaceHomeData {
  return {
    today,
    todayLabel: dateLabel(today),
    tasks: [],
    currentOrders: [],
    capacity: { scheduledHours: 0 },
    activities: [],
  };
}

export async function getWorkspaceHomeData(): Promise<WorkspaceHomeData> {
  const today = dateKeyInShanghai();
  const empty = emptyWorkspace(today);

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

    const [{ data: servicesData }, { data: ordersData }, { data: scheduleData }, settingsResult] =
      await Promise.all([
        supabase
          .from("services")
          .select("id,name,estimated_work_hours,rush_supported")
          .order("created_at", { ascending: true }),
        supabase
          .from("orders")
          .select("id,service_id,customer_name,delivery_date,result,status,loss_reason,created_at")
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("schedule_blocks")
          .select(
            "id,title,work_type,scheduled_date,estimated_duration_hours,completed_at,created_at",
          )
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("workspace_settings")
          .select("weekly_capacity_hours")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

    const services = (servicesData ?? []) as ServiceRow[];
    const orders = (ordersData ?? []) as OrderRow[];
    const schedule = (scheduleData ?? []) as ScheduleRow[];
    const serviceNames = new Map(services.map((service) => [service.id, service.name]));

    const tasks: WorkspaceTask[] = schedule
      .filter((block) => block.scheduled_date === today)
      .map((block) => ({
        id: block.id,
        title: block.title,
        workType: block.work_type,
        scheduledDate: block.scheduled_date,
        estimatedDurationHours: Number(block.estimated_duration_hours),
        completedAt: block.completed_at ?? undefined,
      }))
      .sort((a, b) => Number(Boolean(a.completedAt)) - Number(Boolean(b.completedAt)))
      .slice(0, 6);

    const focus = tasks.find((task) => !task.completedAt);
    const currentOrderRows = orders
      .filter(
        (order) =>
          order.status === "Not Started" ||
          order.status === "In Progress" ||
          order.status === "Waiting Customer" ||
          (!order.status && order.result === "Still in progress"),
      )
      .sort((a, b) => a.delivery_date.localeCompare(b.delivery_date))
      .slice(0, 4);
    const currentOrders: WorkspaceOrder[] = currentOrderRows.map((order) => ({
      id: order.id,
      customerName: order.customer_name,
      serviceName: serviceNames.get(order.service_id) ?? "Service",
      deliveryDate: order.delivery_date,
      result: order.status ?? order.result,
    }));

    const range = weekRange(today);
    const scheduledHours = roundHours(
      schedule
        .filter(
          (block) =>
            block.scheduled_date >= range.start && block.scheduled_date <= range.end,
        )
        .reduce((sum, block) => sum + Number(block.estimated_duration_hours), 0),
    );
    const weeklyCapacityValue = settingsResult.data?.weekly_capacity_hours;
    const weeklyCapacityHours = weeklyCapacityValue
      ? Number(weeklyCapacityValue)
      : undefined;
    const standardOrderHours = services.length
      ? Math.min(...services.map((service) => Number(service.estimated_work_hours)))
      : undefined;
    const rushServices = services.filter((service) => service.rush_supported);
    const rushOrderHours = rushServices.length
      ? Math.min(...rushServices.map((service) => Number(service.estimated_work_hours)))
      : undefined;

    return {
      today,
      todayLabel: dateLabel(today),
      focus,
      tasks,
      currentOrders,
      capacity: {
        weeklyCapacityHours,
        scheduledHours,
        remainingHours:
          weeklyCapacityHours === undefined
            ? undefined
            : roundHours(Math.max(0, weeklyCapacityHours - scheduledHours)),
        standardOrderHours,
        rushOrderHours,
      },
      observation: buildObservation(orders, currentOrderRows, serviceNames, today),
      activities: buildActivities(orders, schedule),
    };
  } catch {
    return empty;
  }
}
