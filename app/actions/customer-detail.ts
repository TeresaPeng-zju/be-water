"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  customerFeedbackSchema,
  customerFollowUpSchema,
  sentFollowUpSchema,
  type CustomerFeedbackInput,
  type CustomerFeedbackNote,
  type CustomerFollowUp,
  type CustomerFollowUpInput,
  type SentFollowUpInput,
} from "@/lib/domain/customer-detail";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function authenticatedCustomer(customerId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return undefined;

  const { data: customer, error } = await supabase
    .from("customers")
    .select("id")
    .eq("id", customerId)
    .eq("user_id", user.id)
    .single();
  if (error || !customer) return undefined;
  return { supabase, user };
}

export async function createCustomerFeedbackAction(
  input: CustomerFeedbackInput,
): Promise<ActionResult<CustomerFeedbackNote>> {
  const parsed = customerFeedbackSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "This note needs more detail." };

  try {
    const auth = await authenticatedCustomer(parsed.data.customerId);
    if (!auth) return { ok: false, error: "The customer could not be found." };

    if (parsed.data.orderId) {
      const { data: order, error: orderError } = await auth.supabase
        .from("orders")
        .select("id")
        .eq("id", parsed.data.orderId)
        .eq("customer_id", parsed.data.customerId)
        .eq("user_id", auth.user.id)
        .single();
      if (orderError || !order) {
        return { ok: false, error: "The selected order does not belong to this customer." };
      }
    }

    const { data, error } = await auth.supabase
      .from("customer_feedback")
      .insert({
        user_id: auth.user.id,
        customer_id: parsed.data.customerId,
        order_id: parsed.data.orderId || null,
        note_type: parsed.data.noteType,
        body: parsed.data.body,
      })
      .select("id,order_id,note_type,body,occurred_at")
      .single();
    if (error || !data) return { ok: false, error: "The feedback note could not be saved." };

    revalidatePath(`/workspace/customers/${parsed.data.customerId}`);
    return {
      ok: true,
      data: {
        id: data.id as string,
        orderId: (data.order_id as string | null) ?? undefined,
        noteType: data.note_type as CustomerFeedbackNote["noteType"],
        body: data.body as string,
        occurredAt: data.occurred_at as string,
      },
    };
  } catch {
    return { ok: false, error: "The workspace database is unavailable." };
  }
}

export async function createCustomerFollowUpAction(
  input: CustomerFollowUpInput,
): Promise<ActionResult<CustomerFollowUp>> {
  const parsed = customerFollowUpSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "The follow-up details need attention." };

  try {
    const auth = await authenticatedCustomer(parsed.data.customerId);
    if (!auth) return { ok: false, error: "The customer could not be found." };

    const scheduledFor = new Date(parsed.data.scheduledFor).toISOString();
    const { data, error } = await auth.supabase
      .from("customer_follow_ups")
      .insert({
        user_id: auth.user.id,
        customer_id: parsed.data.customerId,
        note: parsed.data.note,
        scheduled_for: scheduledFor,
      })
      .select("id,note,scheduled_for,completed_at")
      .single();
    if (error || !data) return { ok: false, error: "The follow-up could not be scheduled." };

    revalidatePath(`/workspace/customers/${parsed.data.customerId}`);
    return {
      ok: true,
      data: {
        id: data.id as string,
        note: data.note as string,
        scheduledFor: data.scheduled_for as string,
        completedAt: (data.completed_at as string | null) ?? undefined,
      },
    };
  } catch {
    return { ok: false, error: "The workspace database is unavailable." };
  }
}

export async function completeCustomerFollowUpAction(
  followUpId: string,
  customerId: string,
): Promise<ActionResult<{ completedAt: string }>> {
  const parsed = z.object({ followUpId: z.string().uuid(), customerId: z.string().uuid() }).safeParse({
    followUpId,
    customerId,
  });
  if (!parsed.success) return { ok: false, error: "This follow-up could not be found." };

  try {
    const auth = await authenticatedCustomer(parsed.data.customerId);
    if (!auth) return { ok: false, error: "The customer could not be found." };
    const completedAt = new Date().toISOString();
    const { error } = await auth.supabase
      .from("customer_follow_ups")
      .update({ completed_at: completedAt, updated_at: completedAt })
      .eq("id", parsed.data.followUpId)
      .eq("customer_id", parsed.data.customerId)
      .eq("user_id", auth.user.id);
    if (error) return { ok: false, error: "The follow-up could not be completed." };

    revalidatePath(`/workspace/customers/${parsed.data.customerId}`);
    return { ok: true, data: { completedAt } };
  } catch {
    return { ok: false, error: "The workspace database is unavailable." };
  }
}

export async function recordSentFollowUpAction(
  input: SentFollowUpInput,
): Promise<ActionResult<{ eventId: string; occurredAt: string }>> {
  const parsed = sentFollowUpSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Record what was sent." };

  try {
    const auth = await authenticatedCustomer(parsed.data.customerId);
    if (!auth) return { ok: false, error: "The customer could not be found." };
    const { data, error } = await auth.supabase
      .from("customer_events")
      .insert({
        user_id: auth.user.id,
        customer_id: parsed.data.customerId,
        event_type: "Follow-up",
        title: "Follow-up sent",
        detail: parsed.data.note,
      })
      .select("id,occurred_at")
      .single();
    if (error || !data) return { ok: false, error: "The follow-up could not be recorded." };

    revalidatePath(`/workspace/customers/${parsed.data.customerId}`);
    return {
      ok: true,
      data: { eventId: data.id as string, occurredAt: data.occurred_at as string },
    };
  } catch {
    return { ok: false, error: "The workspace database is unavailable." };
  }
}
