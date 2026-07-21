"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CapacityFormState = {
  ok: boolean;
  error?: string;
};

async function getAuthenticatedClient() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return undefined;
  return { supabase, user };
}

export async function toggleWorkspaceTaskAction(taskId: string, complete: boolean) {
  const parsedId = z.string().uuid().safeParse(taskId);
  if (!parsedId.success) return { ok: false, error: "This task could not be found." };

  try {
    const auth = await getAuthenticatedClient();
    if (!auth) return { ok: false, error: "Your session has expired." };

    const { error } = await auth.supabase
      .from("schedule_blocks")
      .update({ completed_at: complete ? new Date().toISOString() : null })
      .eq("id", parsedId.data)
      .eq("user_id", auth.user.id);

    if (error) return { ok: false, error: "The task could not be updated." };
    revalidatePath("/workspace");
    return { ok: true };
  } catch {
    return { ok: false, error: "The workspace database is unavailable." };
  }
}

export async function setWeeklyCapacityAction(
  _previousState: CapacityFormState,
  formData: FormData,
): Promise<CapacityFormState> {
  const parsed = z.coerce
    .number()
    .positive("Enter more than 0 hours.")
    .max(168, "Weekly capacity cannot exceed 168 hours.")
    .safeParse(formData.get("weeklyCapacityHours"));

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }

  try {
    const auth = await getAuthenticatedClient();
    if (!auth) return { ok: false, error: "Your session has expired." };

    const { error } = await auth.supabase.from("workspace_settings").upsert({
      user_id: auth.user.id,
      weekly_capacity_hours: parsed.data,
      updated_at: new Date().toISOString(),
    });

    if (error) return { ok: false, error: "Capacity could not be saved." };
    revalidatePath("/workspace");
    return { ok: true };
  } catch {
    return { ok: false, error: "The workspace database is unavailable." };
  }
}
