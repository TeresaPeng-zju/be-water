import type {
  OrderEditorCustomer,
  OrderEditorData,
  OrderEditorService,
} from "@/lib/domain/order-editor";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CustomerRow = {
  id: string;
  name: string;
  email: string | null;
  notes: string | null;
};

type CustomerOrderRow = {
  customer_id: string | null;
  created_at: string;
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

export async function getOrderEditorData(): Promise<OrderEditorData> {
  const today = dateKeyInShanghai();
  const empty: OrderEditorData = {
    today,
    customers: [],
    services: [],
    scheduledHours: 0,
  };

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

    const range = weekRange(today);
    const [customersResult, servicesResult, orderHistoryResult, scheduleResult, settingsResult] =
      await Promise.all([
        supabase.from("customers").select("id,name,email,notes").order("name"),
        supabase
          .from("services")
          .select(
            "id,name,standard_price,currency,standard_delivery_days,estimated_work_hours,rush_supported,rush_delivery_days,rush_price",
          )
          .order("created_at", { ascending: true }),
        supabase
          .from("orders")
          .select("customer_id,created_at")
          .not("customer_id", "is", null)
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("schedule_blocks")
          .select("estimated_duration_hours")
          .gte("scheduled_date", range.start)
          .lte("scheduled_date", range.end),
        supabase
          .from("workspace_settings")
          .select("weekly_capacity_hours")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

    const orderHistory = (orderHistoryResult.data ?? []) as CustomerOrderRow[];
    const customers: OrderEditorCustomer[] = ((customersResult.data ?? []) as CustomerRow[]).map(
      (customer) => {
        const history = orderHistory.filter((order) => order.customer_id === customer.id);
        return {
          id: customer.id,
          name: customer.name,
          email: customer.email ?? undefined,
          notes: customer.notes ?? undefined,
          previousOrders: history.length,
          lastInteraction: history[0]?.created_at,
        };
      },
    );

    const services: OrderEditorService[] = (servicesResult.data ?? []).map((service) => ({
      id: service.id as string,
      name: service.name as string,
      standardPrice: Number(service.standard_price),
      currency: service.currency as string,
      standardDeliveryDays: Number(service.standard_delivery_days),
      estimatedWorkHours: Number(service.estimated_work_hours),
      rushSupported: Boolean(service.rush_supported),
      rushDeliveryDays: service.rush_delivery_days
        ? Number(service.rush_delivery_days)
        : undefined,
      rushPrice: service.rush_price ? Number(service.rush_price) : undefined,
    }));

    return {
      today,
      customers,
      services,
      weeklyCapacityHours: settingsResult.data?.weekly_capacity_hours
        ? Number(settingsResult.data.weekly_capacity_hours)
        : undefined,
      scheduledHours: (scheduleResult.data ?? []).reduce(
        (sum, block) => sum + Number(block.estimated_duration_hours),
        0,
      ),
    };
  } catch {
    return empty;
  }
}
