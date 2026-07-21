import { z } from "zod";
import type {
  CustomerDetailData,
  CustomerFeedbackNote,
  CustomerFollowUp,
  CustomerOrderHistory,
  CustomerStatus,
  CustomerTimelineEvent,
  TimelineCategory,
} from "@/lib/domain/customer-detail";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CustomerRow = {
  id: string;
  name: string;
  email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type OrderRow = {
  id: string;
  service_id: string;
  actual_price: number | string;
  currency: string | null;
  order_date: string;
  delivery_date: string;
  status: string | null;
  result: string;
  rush: boolean;
  rush_fee: number | string;
  created_at: string;
  updated_at: string;
};

type ServiceRow = {
  id: string;
  name: string;
  currency: string;
};

type ScheduleRow = {
  id: string;
  order_id: string;
  title: string;
  work_type: string;
  scheduled_date: string;
  estimated_duration_hours: number | string;
  completed_at: string | null;
};

type EventRow = {
  id: string;
  event_type: string;
  title: string;
  detail: string | null;
  occurred_at: string;
};

type FeedbackRow = {
  id: string;
  order_id: string | null;
  note_type: CustomerFeedbackNote["noteType"];
  body: string;
  occurred_at: string;
};

type FollowUpRow = {
  id: string;
  note: string;
  scheduled_for: string;
  completed_at: string | null;
};

function addDateTime(date: string) {
  return `${date}T12:00:00.000Z`;
}

function deliveryDays(order: OrderRow) {
  const start = new Date(`${order.order_date}T00:00:00Z`).getTime();
  const end = new Date(`${order.delivery_date}T00:00:00Z`).getTime();
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

function currentStatus(orders: OrderRow[]): CustomerStatus {
  const statuses = orders.map((order) => order.status ?? order.result);
  if (statuses.includes("Waiting Customer")) return "Waiting";
  if (statuses.some((status) => status === "Not Started" || status === "In Progress" || status === "Still in progress")) {
    return "Active";
  }
  if (orders.length > 1) return "Repeat Customer";
  const latest = orders[0];
  if (!latest) return "Waiting";
  if (latest.status === "Lost" || latest.result === "Did not proceed") return "Lost";
  if (latest.status === "Completed" || latest.result === "Completed") return "Completed";
  return "Waiting";
}

function eventCategory(type: string): TimelineCategory {
  if (type === "Follow-up") return "Follow-up";
  if (type === "Delivery" || type === "Revision") return "Work";
  if (type === "Paid" || type === "Repeat purchase") return "Order";
  return "Relationship";
}

function latestDate(values: Array<string | undefined>) {
  return values
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0];
}

function primaryServiceName(orders: OrderRow[], services: Map<string, ServiceRow>) {
  const counts = new Map<string, number>();
  for (const order of orders) {
    counts.set(order.service_id, (counts.get(order.service_id) ?? 0) + 1);
  }
  const serviceId = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  return serviceId ? services.get(serviceId)?.name : undefined;
}

function buildSignals(
  orders: OrderRow[],
  schedule: ScheduleRow[],
  events: EventRow[],
) {
  const signals: string[] = [];
  if (orders.length > 1) {
    signals.push(`Returned for ${orders.length - 1} repeat ${orders.length === 2 ? "order" : "orders"}.`);
  }
  const rushOrders = orders.filter((order) => order.rush).length;
  if (rushOrders >= 2 || (orders.length >= 2 && rushOrders / orders.length >= 0.5)) {
    signals.push("Usually purchases rush services.");
  }
  const revisions = schedule.filter((block) => block.work_type === "Revision").length;
  if (orders.length && revisions / orders.length >= 1.5) {
    signals.push("Revision work repeats across orders.");
  }
  const referrals = events.filter((event) => event.event_type === "Referral").length;
  if (referrals) signals.push(`Has referred ${referrals} ${referrals === 1 ? "customer" : "customers"}.`);
  const questions = events.filter((event) => event.event_type === "Question").length;
  if (questions >= 3) signals.push("Frequently asks detailed questions.");
  return signals.slice(0, 4);
}

function buildObservation(
  orders: OrderRow[],
  followUps: FollowUpRow[],
  primaryService?: string,
) {
  if (orders.length > 1) {
    const completedFollowUpsNearDelivery = followUps.filter((followUp) => {
      if (!followUp.completed_at) return false;
      return orders.some((order) => {
        const delivery = new Date(`${order.delivery_date}T00:00:00Z`).getTime();
        const followUpTime = Date.parse(followUp.completed_at!);
        const days = (followUpTime - delivery) / 86_400_000;
        return days >= 0 && days <= 3;
      });
    }).length;
    return {
      text: `This customer has returned ${orders.length - 1} ${orders.length === 2 ? "time" : "times"}${primaryService ? ` after purchasing ${primaryService}` : ""}.`,
      possibleExplanation:
        completedFollowUpsNearDelivery >= 2
          ? "Two or more recorded follow-ups happened within three days after delivery. This timing may have supported the relationship."
          : completedFollowUpsNearDelivery === 1
            ? "One recorded follow-up happened within three days after delivery. It may be connected, but there is not enough evidence yet."
            : "There is not enough recorded follow-up history to explain the repeat behavior yet.",
    };
  }

  const rushOrders = orders.filter((order) => order.rush).length;
  if (rushOrders >= 2) {
    return {
      text: "This customer has purchased rush delivery more than once.",
      possibleExplanation: "The reason is not recorded. Time sensitivity is possible, but should not be treated as fact.",
    };
  }

  return {
    text: "No durable relationship pattern has appeared yet.",
    possibleExplanation: "More completed orders, feedback, or follow-up history is needed before suggesting a reason.",
  };
}

export async function getCustomerDetailData(
  customerId: string,
): Promise<CustomerDetailData | undefined> {
  const parsedId = z.string().uuid().safeParse(customerId);
  if (!parsedId.success) return undefined;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return undefined;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return undefined;

    const customerResult = await supabase
      .from("customers")
      .select("id,name,email,notes,created_at,updated_at")
      .eq("id", parsedId.data)
      .eq("user_id", user.id)
      .single();
    if (customerResult.error || !customerResult.data) return undefined;
    const customer = customerResult.data as CustomerRow;

    const [ordersResult, servicesResult, eventsResult, feedbackResult, followUpsResult] =
      await Promise.all([
        supabase
          .from("orders")
          .select(
            "id,service_id,actual_price,currency,order_date,delivery_date,status,result,rush,rush_fee,created_at,updated_at",
          )
          .eq("customer_id", customer.id)
          .order("created_at", { ascending: false }),
        supabase.from("services").select("id,name,currency"),
        supabase
          .from("customer_events")
          .select("id,event_type,title,detail,occurred_at")
          .eq("customer_id", customer.id)
          .order("occurred_at", { ascending: true }),
        supabase
          .from("customer_feedback")
          .select("id,order_id,note_type,body,occurred_at")
          .eq("customer_id", customer.id)
          .order("occurred_at", { ascending: false }),
        supabase
          .from("customer_follow_ups")
          .select("id,note,scheduled_for,completed_at")
          .eq("customer_id", customer.id)
          .order("scheduled_for", { ascending: false }),
      ]);

    if (
      ordersResult.error ||
      servicesResult.error ||
      eventsResult.error ||
      feedbackResult.error ||
      followUpsResult.error
    ) {
      return undefined;
    }

    const orders = (ordersResult.data ?? []) as OrderRow[];
    const services = (servicesResult.data ?? []) as ServiceRow[];
    const events = (eventsResult.data ?? []) as EventRow[];
    const feedbackRows = (feedbackResult.data ?? []) as FeedbackRow[];
    const followUpRows = (followUpsResult.data ?? []) as FollowUpRow[];
    const serviceMap = new Map(services.map((service) => [service.id, service]));
    const orderIds = orders.map((order) => order.id);
    const scheduleResult = orderIds.length
      ? await supabase
          .from("schedule_blocks")
          .select(
            "id,order_id,title,work_type,scheduled_date,estimated_duration_hours,completed_at",
          )
          .in("order_id", orderIds)
          .order("scheduled_date", { ascending: true })
      : { data: [], error: null };
    if (scheduleResult.error) return undefined;
    const schedule = (scheduleResult.data ?? []) as ScheduleRow[];

    const orderHistory: CustomerOrderHistory[] = orders.map((order) => {
      const service = serviceMap.get(order.service_id);
      return {
        id: order.id,
        serviceName: service?.name ?? "Service",
        price: Number(order.actual_price) + Number(order.rush_fee ?? 0),
        currency: order.currency ?? service?.currency ?? "CNY",
        orderDate: order.order_date,
        deliveryDate: order.delivery_date,
        result: order.status ?? order.result,
        rush: order.rush,
      };
    });
    const feedback: CustomerFeedbackNote[] = feedbackRows.map((note) => ({
      id: note.id,
      orderId: note.order_id ?? undefined,
      noteType: note.note_type,
      body: note.body,
      occurredAt: note.occurred_at,
    }));
    const followUps: CustomerFollowUp[] = followUpRows.map((followUp) => ({
      id: followUp.id,
      note: followUp.note,
      scheduledFor: followUp.scheduled_for,
      completedAt: followUp.completed_at ?? undefined,
    }));

    const timeline: CustomerTimelineEvent[] = [
      {
        id: `customer-${customer.id}`,
        category: "Relationship" as const,
        title: "Relationship record started",
        detail: customer.notes ?? undefined,
        occurredAt: customer.created_at,
      },
      ...events.map((event) => ({
        id: `event-${event.id}`,
        category: eventCategory(event.event_type),
        title: event.title,
        detail: event.detail ?? undefined,
        occurredAt: event.occurred_at,
      })),
      ...orders.flatMap((order, index) => {
        const serviceName = serviceMap.get(order.service_id)?.name ?? "Service";
        const chronologicalIndex = orders.length - index;
        return [
          {
            id: `order-start-${order.id}`,
            category: "Order" as const,
            title: chronologicalIndex > 1 ? `Repeat order · ${serviceName}` : `First order · ${serviceName}`,
            detail: `Recorded status: ${order.status ?? order.result}.`,
            occurredAt: order.created_at,
          },
          {
            id: `order-delivery-${order.id}`,
            category: "Order" as const,
            title: `Delivery date · ${serviceName}`,
            detail: "The delivery date recorded on this order.",
            occurredAt: addDateTime(order.delivery_date),
          },
        ];
      }),
      ...schedule.map((block) => ({
        id: `work-${block.id}`,
        category: "Work" as const,
        title: block.title,
        detail: `${block.work_type} · ${Number(block.estimated_duration_hours)}h${block.completed_at ? " · completed" : " · scheduled"}`,
        occurredAt: block.completed_at ?? addDateTime(block.scheduled_date),
        upcoming: !block.completed_at && Date.parse(addDateTime(block.scheduled_date)) > Date.now(),
      })),
      ...feedback.map((note) => ({
        id: `feedback-${note.id}`,
        category: "Feedback" as const,
        title: note.noteType,
        detail: note.body,
        occurredAt: note.occurredAt,
      })),
      ...followUps.map((followUp) => ({
        id: `follow-up-${followUp.id}`,
        category: "Follow-up" as const,
        title: followUp.completedAt ? "Follow-up completed" : "Follow-up scheduled",
        detail: followUp.note,
        occurredAt: followUp.completedAt ?? followUp.scheduledFor,
        upcoming: !followUp.completedAt && Date.parse(followUp.scheduledFor) > Date.now(),
      })),
    ].sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt));

    const status = currentStatus(orders);
    const primaryService = primaryServiceName(orders, serviceMap);
    const completedFollowUps = followUps.filter((followUp) => followUp.completedAt);
    const nextFollowUps = followUps
      .filter((followUp) => !followUp.completedAt)
      .sort((a, b) => Date.parse(a.scheduledFor) - Date.parse(b.scheduledFor));
    const lastContactAt = latestDate([
      customer.updated_at,
      ...orders.map((order) => order.created_at),
      ...events.map((event) => event.occurred_at),
      ...feedback.map((note) => note.occurredAt),
      ...completedFollowUps.map((followUp) => followUp.completedAt),
    ]);
    const currencies = [...new Set(orderHistory.map((order) => order.currency))];
    const mixedCurrencies = currencies.length > 1;
    const totalRevenue = mixedCurrencies
      ? 0
      : orderHistory.reduce((sum, order) => sum + order.price, 0);
    const averageDeliveryDays = orders.length
      ? orders.reduce((sum, order) => sum + deliveryDays(order), 0) / orders.length
      : undefined;
    const revisions = schedule.filter((block) => block.work_type === "Revision").length;
    const averageRevisionCount = orders.length ? revisions / orders.length : undefined;

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email ?? undefined,
        notes: customer.notes ?? undefined,
        status,
        primaryService,
        lastOrderAt: orders[0]?.order_date,
        totalOrders: orders.length,
        lastContactAt,
      },
      timeline,
      orders: orderHistory,
      feedback,
      followUp: {
        last: completedFollowUps.sort(
          (a, b) => Date.parse(b.completedAt!) - Date.parse(a.completedAt!),
        )[0],
        next: nextFollowUps[0],
      },
      summary: {
        repeatOrders: Math.max(0, orders.length - 1),
        totalRevenue,
        currency: currencies[0] ?? "CNY",
        mixedCurrencies,
        averageDeliveryDays,
        averageRevisionCount,
        currentStage: status,
      },
      signals: buildSignals(orders, schedule, events),
      observation: buildObservation(orders, followUpRows, primaryService),
    };
  } catch {
    return undefined;
  }
}
