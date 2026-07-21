import type {
  BusinessObservation,
  BusinessObservationsData,
  ExperimentStatus,
  ObservationEvidence,
  RelatedObservationCustomer,
  RelatedObservationOrder,
} from "@/lib/domain/business-observations";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type OrderRow = {
  id: string;
  customer_id: string | null;
  customer_name: string;
  service_id: string;
  order_date: string;
  delivery_date: string;
  status: string | null;
  result: string;
  rush: boolean;
  created_at: string;
};

type ServiceRow = {
  id: string;
  name: string;
  standard_delivery_days: number | string;
};

type CustomerRow = {
  id: string;
  name: string;
};

type ScheduleRow = {
  id: string;
  order_id: string | null;
  title: string;
  work_type: string;
  scheduled_date: string;
};

type FollowUpRow = {
  id: string;
  customer_id: string;
  scheduled_for: string;
  completed_at: string | null;
};

type CustomerEventRow = {
  id: string;
  customer_id: string;
  event_type: string;
  occurred_at: string;
};

type ObservationStateRow = {
  observation_key: string;
  discovered_at: string;
  experiment_status: ExperimentStatus;
};

type ObservationCandidate = Omit<
  BusinessObservation,
  "discoveredAt" | "status" | "relatedCustomers" | "relatedOrders" | "experiment"
> & {
  experiment: Omit<BusinessObservation["experiment"], "status">;
};

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

function statusOf(order: OrderRow) {
  return order.status ?? order.result;
}

function isActiveOrder(order: OrderRow) {
  const status = statusOf(order);
  return status === "Not Started" || status === "In Progress" || status === "Waiting Customer" || status === "Still in progress";
}

function isCompletedOrder(order: OrderRow) {
  return order.status === "Completed" || order.result === "Completed";
}

function orderEvidence(
  order: OrderRow,
  event: string,
  date = order.created_at,
): ObservationEvidence {
  return {
    id: `${event}-${order.id}`,
    subject: order.customer_name,
    event,
    date,
    orderId: order.id,
    customerId: order.customer_id ?? undefined,
  };
}

function rushObservation(
  orders: OrderRow[],
  services: Map<string, ServiceRow>,
): ObservationCandidate | undefined {
  const recent = orders.slice(0, 10);
  const previous = orders.slice(10, 20);
  const rushOrders = recent.filter((order) => order.rush);
  if (rushOrders.length < 3) return undefined;
  const recentShare = rushOrders.length / recent.length;
  const previousShare = previous.length
    ? previous.filter((order) => order.rush).length / previous.length
    : 0;
  const increasing = previous.length >= 3 && recentShare > previousShare + 0.2;
  const deliveryWindows = rushOrders
    .map((order) => Number(services.get(order.service_id)?.standard_delivery_days))
    .filter((value) => Number.isFinite(value));
  const averageDelivery = deliveryWindows.length
    ? deliveryWindows.reduce((sum, value) => sum + value, 0) / deliveryWindows.length
    : undefined;

  return {
    key: "rush-orders",
    title: increasing ? "Rush Orders Increasing" : "Rush Orders Concentrated",
    evidenceCount: rushOrders.length,
    observation: `${rushOrders.length} of the last ${recent.length} recorded orders used rush delivery.`,
    evidence: rushOrders.map((order) => orderEvidence(order, "Rush delivery recorded")),
    possibleExplanation: [
      averageDelivery !== undefined
        ? `Standard delivery for the affected services averages ${Math.round(averageDelivery * 10) / 10} days. Recent demand may be more time-sensitive than that promise.`
        : "Recent demand may be becoming more time-sensitive.",
      "Customers might be arriving later in their own decision process, but the workspace does not record that context yet.",
    ],
    unknowns: [
      "We do not yet know whether customers would accept a higher rush price.",
      "We do not know whether delivery speed matters more than price or availability.",
    ],
    experiment: {
      title: "Protect one rush slot per week for two weeks",
      steps: [
        "Reserve one delivery slot that is not sold as standard capacity.",
        "Offer that slot at a 30% higher price.",
        "Record whether the customer accepts and whether the delivery stays within capacity.",
      ],
      expectedLearning: "Understand whether rush delivery is worth productizing without overloading the week.",
    },
  };
}

function revisionObservation(
  schedule: ScheduleRow[],
  orders: Map<string, OrderRow>,
  services: Map<string, ServiceRow>,
): ObservationCandidate | undefined {
  const revisions = schedule.filter((block) => block.work_type === "Revision" && block.order_id);
  const affectedOrders = new Set(revisions.map((block) => block.order_id));
  if (revisions.length < 3 || affectedOrders.size < 2) return undefined;
  const serviceCounts = new Map<string, number>();
  for (const block of revisions) {
    const order = block.order_id ? orders.get(block.order_id) : undefined;
    if (order) serviceCounts.set(order.service_id, (serviceCounts.get(order.service_id) ?? 0) + 1);
  }
  const leadingServiceId = [...serviceCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const leadingService = leadingServiceId ? services.get(leadingServiceId)?.name : undefined;
  const evidence = revisions.flatMap((block) => {
    const order = block.order_id ? orders.get(block.order_id) : undefined;
    if (!order) return [];
    return [orderEvidence(order, `Revision work · ${block.title}`, `${block.scheduled_date}T12:00:00Z`)];
  });

  return {
    key: "high-revision-count",
    title: "High Revision Count",
    evidenceCount: revisions.length,
    observation: `${revisions.length} revision work blocks were recorded across ${affectedOrders.size} orders.`,
    evidence,
    possibleExplanation: [
      leadingService
        ? `Revision work appears most often in ${leadingService}. The service scope or review boundary may be unclear.`
        : "The service scope or review boundary may be unclear.",
      "Some revisions might be normal iteration rather than avoidable rework.",
    ],
    unknowns: [
      "We do not know which revisions were included in the original scope.",
      "We do not know whether revision requests came from unclear instructions, changing needs, or delivery quality.",
    ],
    experiment: {
      title: "Set one explicit review boundary for the next three orders",
      steps: [
        "Write what the first delivery includes before work begins.",
        "Define one included revision round.",
        "Record revision work separately for the next three orders.",
      ],
      expectedLearning: "Learn whether a clearer review boundary reduces unplanned revision work.",
    },
  };
}

function repeatCustomerObservation(orders: OrderRow[]): ObservationCandidate | undefined {
  const grouped = new Map<string, OrderRow[]>();
  for (const order of orders) {
    if (!order.customer_id) continue;
    grouped.set(order.customer_id, [...(grouped.get(order.customer_id) ?? []), order]);
  }
  const repeats = [...grouped.values()].filter((customerOrders) => customerOrders.length > 1);
  if (!repeats.length) return undefined;
  const repeatPurchases = repeats.reduce((sum, customerOrders) => sum + customerOrders.length - 1, 0);
  const evidence = repeats.map((customerOrders) => {
    const latest = customerOrders[0];
    return orderEvidence(latest, `${customerOrders.length} recorded orders`);
  });
  return {
    key: "repeat-customers",
    title: "Repeat Customers",
    evidenceCount: repeats.length,
    observation: `${repeats.length} ${repeats.length === 1 ? "customer has" : "customers have"} purchased again, creating ${repeatPurchases} repeat ${repeatPurchases === 1 ? "order" : "orders"}.`,
    evidence,
    possibleExplanation: [
      "The delivered work may have created enough value for customers to return.",
      "Follow-up timing or the mix of services might also be supporting repeat purchases.",
    ],
    unknowns: [
      "We do not know which part of the experience caused customers to return.",
      "We do not know whether repeat purchases would happen without follow-up.",
    ],
    experiment: {
      title: "Use the same three-day follow-up window for the next three deliveries",
      steps: [
        "Schedule a follow-up within three days after delivery.",
        "Ask one outcome-focused question without selling another service.",
        "Record whether a new need appears within 30 days.",
      ],
      expectedLearning: "Understand whether consistent follow-up helps reveal repeat demand.",
    },
  };
}

function noFollowUpObservation(
  orders: OrderRow[],
  followUps: FollowUpRow[],
  events: CustomerEventRow[],
): ObservationCandidate | undefined {
  const withoutFollowUp = orders.filter((order) => {
    if (!isCompletedOrder(order) || !order.customer_id) return false;
    const delivery = Date.parse(`${order.delivery_date}T00:00:00Z`);
    const withinWindow = (value: string) => {
      const days = (Date.parse(value) - delivery) / 86_400_000;
      return days >= 0 && days <= 14;
    };
    return !followUps.some(
      (followUp) =>
        followUp.customer_id === order.customer_id &&
        withinWindow(followUp.completed_at ?? followUp.scheduled_for),
    ) && !events.some(
      (event) =>
        event.customer_id === order.customer_id &&
        event.event_type === "Follow-up" &&
        withinWindow(event.occurred_at),
    );
  });
  if (withoutFollowUp.length < 2) return undefined;
  return {
    key: "no-follow-up",
    title: "No Follow-up Recorded",
    evidenceCount: withoutFollowUp.length,
    observation: `${withoutFollowUp.length} completed orders have no follow-up recorded within 14 days after delivery.`,
    evidence: withoutFollowUp.map((order) =>
      orderEvidence(order, "No follow-up within 14 days", `${order.delivery_date}T12:00:00Z`),
    ),
    possibleExplanation: [
      "Follow-up may be happening outside BeWater and not being recorded.",
      "Delivery may currently feel like the end of the service rather than the start of an ongoing relationship.",
    ],
    unknowns: [
      "We do not know whether these customers were contacted somewhere else.",
      "We do not know whether a follow-up would create useful outcomes or feel unnecessary.",
    ],
    experiment: {
      title: "Record one outcome follow-up after the next three deliveries",
      steps: [
        "Send one short outcome question within seven days.",
        "Record the reply without adding a sales message.",
        "Compare reply quality across three customers.",
      ],
      expectedLearning: "Learn whether post-delivery follow-up produces useful customer outcomes or new context.",
    },
  };
}

function overdueObservation(orders: OrderRow[], today: string): ObservationCandidate | undefined {
  const overdue = orders.filter((order) => isActiveOrder(order) && order.delivery_date < today);
  if (!overdue.length) return undefined;
  return {
    key: "delivery-dates-passed",
    title: "Delivery Dates Passed",
    evidenceCount: overdue.length,
    observation: `${overdue.length} active ${overdue.length === 1 ? "order is" : "orders are"} past the recorded delivery date.`,
    evidence: overdue.map((order) =>
      orderEvidence(order, `Delivery date passed · ${statusOf(order)}`, `${order.delivery_date}T12:00:00Z`),
    ),
    possibleExplanation: [
      "Scheduled workload may be exceeding the available delivery capacity.",
      "Some order statuses or delivery dates might not have been updated after the work changed.",
    ],
    unknowns: [
      "We do not know whether the customer agreed to a new delivery date.",
      "We do not know how much of the remaining work is actually unfinished.",
    ],
    experiment: {
      title: "Protect a delivery buffer on the next two active orders",
      steps: [
        "Reserve two hours before each delivery date.",
        "Do not fill that time with new order work.",
        "Record whether the delivery date is met without moving other commitments.",
      ],
      expectedLearning: "Understand whether a small delivery buffer reduces overdue active work.",
    },
  };
}

function relatedCustomers(
  evidence: ObservationEvidence[],
  customers: Map<string, CustomerRow>,
  orders: OrderRow[],
): RelatedObservationCustomer[] {
  const ids = [...new Set(evidence.map((item) => item.customerId).filter((id): id is string => Boolean(id)))];
  return ids.slice(0, 6).flatMap((id) => {
    const customer = customers.get(id);
    if (!customer) return [];
    return [{
      id,
      name: customer.name,
      relatedOrders: orders.filter((order) => order.customer_id === id).length,
    }];
  });
}

function relatedOrders(
  evidence: ObservationEvidence[],
  orders: Map<string, OrderRow>,
  services: Map<string, ServiceRow>,
): RelatedObservationOrder[] {
  const ids = [...new Set(evidence.map((item) => item.orderId).filter((id): id is string => Boolean(id)))];
  return ids.slice(0, 6).flatMap((id) => {
    const order = orders.get(id);
    if (!order) return [];
    return [{
      id,
      customerName: order.customer_name,
      serviceName: services.get(order.service_id)?.name ?? "Service",
      date: order.order_date,
      result: statusOf(order),
    }];
  });
}

function observationStatus(status: ExperimentStatus): BusinessObservation["status"] {
  if (status === "Running") return "Experiment Running";
  if (status === "Completed") return "Learning Recorded";
  return "Observed";
}

export async function getBusinessObservations(): Promise<BusinessObservationsData> {
  const today = dateKeyInShanghai();
  const empty = { today, observations: [] };
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return empty;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return empty;

    const [ordersResult, servicesResult, customersResult, scheduleResult, followUpsResult, eventsResult] =
      await Promise.all([
        supabase
          .from("orders")
          .select("id,customer_id,customer_name,service_id,order_date,delivery_date,status,result,rush,created_at")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase.from("services").select("id,name,standard_delivery_days"),
        supabase.from("customers").select("id,name"),
        supabase
          .from("schedule_blocks")
          .select("id,order_id,title,work_type,scheduled_date")
          .order("scheduled_date", { ascending: false })
          .limit(500),
        supabase
          .from("customer_follow_ups")
          .select("id,customer_id,scheduled_for,completed_at")
          .order("scheduled_for", { ascending: false })
          .limit(500),
        supabase
          .from("customer_events")
          .select("id,customer_id,event_type,occurred_at")
          .eq("event_type", "Follow-up")
          .order("occurred_at", { ascending: false })
          .limit(500),
      ]);

    if (
      ordersResult.error ||
      servicesResult.error ||
      customersResult.error ||
      scheduleResult.error ||
      followUpsResult.error ||
      eventsResult.error
    ) {
      return empty;
    }

    const orders = (ordersResult.data ?? []) as OrderRow[];
    const serviceRows = (servicesResult.data ?? []) as ServiceRow[];
    const customerRows = (customersResult.data ?? []) as CustomerRow[];
    const schedule = (scheduleResult.data ?? []) as ScheduleRow[];
    const followUps = (followUpsResult.data ?? []) as FollowUpRow[];
    const events = (eventsResult.data ?? []) as CustomerEventRow[];
    const serviceMap = new Map(serviceRows.map((service) => [service.id, service]));
    const customerMap = new Map(customerRows.map((customer) => [customer.id, customer]));
    const orderMap = new Map(orders.map((order) => [order.id, order]));
    const candidates = [
      rushObservation(orders, serviceMap),
      revisionObservation(schedule, orderMap, serviceMap),
      repeatCustomerObservation(orders),
      noFollowUpObservation(orders, followUps, events),
      overdueObservation(orders, today),
    ].filter((candidate): candidate is ObservationCandidate => Boolean(candidate));
    if (!candidates.length) return empty;

    await supabase.from("business_observation_states").upsert(
      candidates.map((candidate) => ({
        user_id: user.id,
        observation_key: candidate.key,
      })),
      { onConflict: "user_id,observation_key", ignoreDuplicates: true },
    );
    const statesResult = await supabase
      .from("business_observation_states")
      .select("observation_key,discovered_at,experiment_status")
      .in("observation_key", candidates.map((candidate) => candidate.key));
    const states = new Map(
      ((statesResult.data ?? []) as ObservationStateRow[]).map((state) => [state.observation_key, state]),
    );
    const now = new Date().toISOString();

    const observations: BusinessObservation[] = candidates.map((candidate) => {
      const state = states.get(candidate.key);
      const experimentStatus = state?.experiment_status ?? "Not Started";
      return {
        ...candidate,
        discoveredAt: state?.discovered_at ?? now,
        status: observationStatus(experimentStatus),
        experiment: { ...candidate.experiment, status: experimentStatus },
        relatedCustomers: relatedCustomers(candidate.evidence, customerMap, orders),
        relatedOrders: relatedOrders(candidate.evidence, orderMap, serviceMap),
      };
    });

    return {
      today,
      observations: observations.sort(
        (a, b) => Date.parse(b.discoveredAt) - Date.parse(a.discoveredAt),
      ),
    };
  } catch {
    return empty;
  }
}
