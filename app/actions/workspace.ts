"use server";

import {
  orderSchema,
  scheduleBlockSchema,
  serviceSchema,
  type Order,
  type OrderInput,
  type ScheduleBlock,
  type ScheduleBlockInput,
  type Service,
  type ServiceInput,
} from "@/lib/domain/workspace";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { FormSubmitResult } from "@/components/build-workspace/types";

async function getAuthenticatedClient() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false as const, error: "Your session has expired. Sign in again and retry." };
  }

  return { ok: true as const, supabase, user };
}

export async function createServiceAction(
  input: ServiceInput,
): Promise<FormSubmitResult<Service>> {
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Some service details need attention." };
  }

  try {
    const auth = await getAuthenticatedClient();
    if (!auth.ok) return auth;

    const { data, error } = await auth.supabase
      .from("services")
      .insert({
        user_id: auth.user.id,
        service_type: parsed.data.serviceType ?? null,
        name: parsed.data.name,
        standard_price: parsed.data.standardPrice,
        currency: parsed.data.currency,
        standard_delivery_days: parsed.data.standardDeliveryDays,
        estimated_work_hours: parsed.data.estimatedWorkHours,
        rush_supported: parsed.data.rushSupported,
        rush_delivery_days: parsed.data.rushDeliveryDays ?? null,
        rush_price: parsed.data.rushPrice ?? null,
      })
      .select("id")
      .single();

    if (error || !data) {
      return { ok: false, error: "We couldn’t save the service. Please try again." };
    }

    return {
      ok: true,
      persisted: true,
      data: { ...parsed.data, id: data.id as string },
    };
  } catch {
    return { ok: false, error: "We couldn’t reach the workspace database. Please try again." };
  }
}

export async function updateServiceAction(
  serviceId: string,
  input: ServiceInput,
): Promise<FormSubmitResult<Service>> {
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success || !serviceId) {
    return { ok: false, error: "Some service details need attention." };
  }

  try {
    const auth = await getAuthenticatedClient();
    if (!auth.ok) return auth;

    const { data, error } = await auth.supabase
      .from("services")
      .update({
        service_type: parsed.data.serviceType ?? null,
        name: parsed.data.name,
        standard_price: parsed.data.standardPrice,
        currency: parsed.data.currency,
        standard_delivery_days: parsed.data.standardDeliveryDays,
        estimated_work_hours: parsed.data.estimatedWorkHours,
        rush_supported: parsed.data.rushSupported,
        rush_delivery_days: parsed.data.rushDeliveryDays ?? null,
        rush_price: parsed.data.rushPrice ?? null,
      })
      .eq("id", serviceId)
      .eq("user_id", auth.user.id)
      .select("id")
      .single();

    if (error || !data) {
      return { ok: false, error: "We couldn’t update the service. Please try again." };
    }

    return {
      ok: true,
      persisted: true,
      data: { ...parsed.data, id: data.id as string },
    };
  } catch {
    return { ok: false, error: "We couldn’t reach the workspace database. Please try again." };
  }
}

export async function createOrderAction(
  input: OrderInput,
): Promise<FormSubmitResult<Order>> {
  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Some order details need attention." };
  }

  try {
    const auth = await getAuthenticatedClient();
    if (!auth.ok) return auth;

    const { data: service, error: serviceError } = await auth.supabase
      .from("services")
      .select("name")
      .eq("id", parsed.data.serviceId)
      .single();

    if (serviceError || !service) {
      return { ok: false, error: "The selected service could not be found." };
    }

    const { data, error } = await auth.supabase
      .from("orders")
      .insert({
        user_id: auth.user.id,
        service_id: parsed.data.serviceId,
        customer_name: parsed.data.customerName,
        actual_price: parsed.data.actualPrice,
        order_date: parsed.data.orderDate,
        delivery_date: parsed.data.deliveryDate,
        result: parsed.data.result,
        loss_reason: parsed.data.lossReason ?? null,
      })
      .select("id")
      .single();

    if (error || !data) {
      return { ok: false, error: "We couldn’t save the order. Please try again." };
    }

    return {
      ok: true,
      persisted: true,
      data: {
        ...parsed.data,
        id: data.id as string,
        serviceName: service.name as string,
      },
    };
  } catch {
    return { ok: false, error: "We couldn’t reach the workspace database. Please try again." };
  }
}

export async function createScheduleBlockAction(
  input: ScheduleBlockInput,
): Promise<FormSubmitResult<ScheduleBlock>> {
  const parsed = scheduleBlockSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Some schedule details need attention." };
  }

  try {
    const auth = await getAuthenticatedClient();
    if (!auth.ok) return auth;

    const { data, error } = await auth.supabase
      .from("schedule_blocks")
      .insert({
        user_id: auth.user.id,
        order_id: parsed.data.orderId || null,
        title: parsed.data.title,
        work_type: parsed.data.workType,
        scheduled_date: parsed.data.scheduledDate,
        estimated_duration_hours: parsed.data.estimatedDurationHours,
      })
      .select("id")
      .single();

    if (error || !data) {
      return { ok: false, error: "We couldn’t save this commitment. Please try again." };
    }

    return {
      ok: true,
      persisted: true,
      data: { ...parsed.data, id: data.id as string },
    };
  } catch {
    return { ok: false, error: "We couldn’t reach the workspace database. Please try again." };
  }
}
