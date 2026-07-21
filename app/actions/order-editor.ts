"use server";

import { revalidatePath } from "next/cache";
import {
  createOrderSchema,
  type CreateOrderInput,
} from "@/lib/domain/order-editor";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CreateOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

function legacyResult(status: CreateOrderInput["status"]) {
  if (status === "Completed") return "Completed";
  if (status === "Cancelled") return "Cancelled";
  if (status === "Lost") return "Did not proceed";
  return "Still in progress";
}

export async function createCanonicalOrderAction(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Some order details need attention." };
  }

  let newlyCreatedCustomerId: string | undefined;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return { ok: false, error: "Your session has expired." };

    const existingRequest = await supabase
      .from("orders")
      .select("id")
      .eq("client_request_id", parsed.data.clientRequestId)
      .maybeSingle();
    if (existingRequest.data?.id) {
      return { ok: true, orderId: existingRequest.data.id as string };
    }

    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("id,currency")
      .eq("id", parsed.data.serviceId)
      .eq("user_id", user.id)
      .single();
    if (serviceError || !service) {
      return { ok: false, error: "The selected service could not be found." };
    }

    let customerId = parsed.data.customerId;
    let customerName: string;

    if (parsed.data.customerMode === "new") {
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .insert({
          user_id: user.id,
          name: parsed.data.newCustomerName,
          email: parsed.data.newCustomerEmail || null,
          notes: parsed.data.customerNotes || null,
        })
        .select("id,name")
        .single();
      if (customerError || !customer) {
        return { ok: false, error: "The new customer could not be saved." };
      }
      customerId = customer.id as string;
      customerName = customer.name as string;
      newlyCreatedCustomerId = customerId;
    } else {
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select("id,name")
        .eq("id", customerId!)
        .eq("user_id", user.id)
        .single();
      if (customerError || !customer) {
        return { ok: false, error: "The selected customer could not be found." };
      }
      customerName = customer.name as string;

      if (parsed.data.customerNotes) {
        await supabase
          .from("customers")
          .update({
            notes: parsed.data.customerNotes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", customerId!)
          .eq("user_id", user.id);
      }
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        customer_id: customerId,
        customer_name: customerName,
        service_id: parsed.data.serviceId,
        actual_price: parsed.data.price,
        currency: service.currency,
        estimated_work_hours: parsed.data.estimatedWorkHours,
        order_date: parsed.data.orderDate,
        delivery_date: parsed.data.dueDate,
        rush: parsed.data.rush,
        rush_fee: parsed.data.rush ? (parsed.data.rushFee ?? 0) : 0,
        status: parsed.data.status,
        result: legacyResult(parsed.data.status),
        next_action: parsed.data.nextAction || null,
        internal_notes: parsed.data.internalNotes || null,
        loss_reason: null,
        client_request_id: parsed.data.clientRequestId,
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (orderError || !order) {
      if (newlyCreatedCustomerId) {
        await supabase
          .from("customers")
          .delete()
          .eq("id", newlyCreatedCustomerId)
          .eq("user_id", user.id);
      }
      return { ok: false, error: "The order could not be saved. Please try again." };
    }

    revalidatePath("/workspace");
    return { ok: true, orderId: order.id as string };
  } catch {
    return { ok: false, error: "The workspace database is unavailable." };
  }
}
