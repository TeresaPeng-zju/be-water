"use server";

import { revalidatePath } from "next/cache";
import {
  experimentStatusSchema,
  type ExperimentStatus,
} from "@/lib/domain/business-observations";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ExperimentStatusResult =
  | { ok: true; status: ExperimentStatus }
  | { ok: false; error: string };

export async function updateExperimentStatusAction(
  observationKey: string,
  status: ExperimentStatus,
): Promise<ExperimentStatusResult> {
  const parsed = experimentStatusSchema.safeParse({ observationKey, status });
  if (!parsed.success) return { ok: false, error: "This experiment status is invalid." };

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return { ok: false, error: "Your session has expired." };

    const now = new Date().toISOString();
    const currentResult = await supabase
      .from("business_observation_states")
      .select("experiment_started_at")
      .eq("user_id", user.id)
      .eq("observation_key", parsed.data.observationKey)
      .maybeSingle();
    const existingStartedAt = currentResult.data?.experiment_started_at as string | null | undefined;
    const { error } = await supabase.from("business_observation_states").upsert(
      {
        user_id: user.id,
        observation_key: parsed.data.observationKey,
        experiment_status: parsed.data.status,
        experiment_started_at:
          parsed.data.status === "Not Started"
            ? null
            : existingStartedAt ?? (parsed.data.status === "Running" ? now : null),
        experiment_completed_at: parsed.data.status === "Completed" ? now : null,
        updated_at: now,
      },
      { onConflict: "user_id,observation_key" },
    );
    if (error) return { ok: false, error: "The experiment status could not be updated." };

    revalidatePath("/workspace/observations");
    return { ok: true, status: parsed.data.status };
  } catch {
    return { ok: false, error: "The workspace database is unavailable." };
  }
}
