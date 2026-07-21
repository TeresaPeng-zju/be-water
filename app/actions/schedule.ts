"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const moveWorkBlockSchema = z.object({
  blockId: z.string().uuid(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

type MoveWorkBlockResult =
  | { ok: true }
  | { ok: false; error: string };

export async function moveScheduleBlockAction(
  blockId: string,
  scheduledDate: string,
): Promise<MoveWorkBlockResult> {
  const parsed = moveWorkBlockSchema.safeParse({ blockId, scheduledDate });
  if (!parsed.success) {
    return { ok: false, error: "This work item could not be moved." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return { ok: false, error: "Your session has expired." };

    const { error } = await supabase
      .from("schedule_blocks")
      .update({
        scheduled_date: parsed.data.scheduledDate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.blockId)
      .eq("user_id", user.id);

    if (error) return { ok: false, error: "The work item could not be moved." };

    revalidatePath("/workspace");
    revalidatePath("/workspace/schedule");
    return { ok: true };
  } catch {
    return { ok: false, error: "The workspace database is unavailable." };
  }
}
