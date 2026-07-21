"use server";

import { revalidatePath } from "next/cache";
import {
  recordAssetEvolutionSchema,
  recordAssetUsageSchema,
  type RecordAssetEvolutionInput,
  type RecordAssetUsageInput,
} from "@/lib/domain/business-assets";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AssetActionResult = { ok: true } | { ok: false; error: string };

async function authenticatedAsset(assetId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "Your session has expired." } as const;

  const assetResult = await supabase
    .from("business_assets")
    .select("id")
    .eq("id", assetId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (assetResult.error || !assetResult.data) {
    return { ok: false, error: "This business asset could not be found." } as const;
  }

  return { ok: true, supabase, user } as const;
}

export async function recordAssetUsageAction(
  input: RecordAssetUsageInput,
): Promise<AssetActionResult> {
  const parsed = recordAssetUsageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Choose a valid order to record this use." };

  try {
    const context = await authenticatedAsset(parsed.data.assetId);
    if (!context.ok) return { ok: false, error: context.error };
    const { supabase, user } = context;
    const orderResult = await supabase
      .from("orders")
      .select("id,customer_id")
      .eq("id", parsed.data.orderId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (orderResult.error || !orderResult.data) {
      return { ok: false, error: "This order could not be found." };
    }

    const { error } = await supabase.from("business_asset_usages").insert({
      user_id: user.id,
      asset_id: parsed.data.assetId,
      order_id: parsed.data.orderId,
      customer_id: orderResult.data.customer_id,
      usage_source: "Recorded",
      note: parsed.data.note || null,
      used_at: new Date().toISOString(),
    });
    if (error?.code === "23505") {
      return { ok: false, error: "This order is already part of the asset history." };
    }
    if (error) return { ok: false, error: "This use could not be recorded." };

    revalidatePath("/workspace/assets");
    return { ok: true };
  } catch {
    return { ok: false, error: "The workspace database is unavailable." };
  }
}

export async function recordAssetEvolutionAction(
  input: RecordAssetEvolutionInput,
): Promise<AssetActionResult> {
  const parsed = recordAssetEvolutionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Describe what changed before saving." };

  try {
    const context = await authenticatedAsset(parsed.data.assetId);
    if (!context.ok) return { ok: false, error: context.error };
    const { supabase, user } = context;
    const now = new Date().toISOString();
    const { error } = await supabase.from("business_asset_evolution").insert({
      user_id: user.id,
      asset_id: parsed.data.assetId,
      event_type: "Improvement",
      title: parsed.data.title,
      detail: parsed.data.detail || null,
      version: parsed.data.version || null,
      occurred_at: now,
    });
    if (error) return { ok: false, error: "This improvement could not be recorded." };

    const { error: updateError } = await supabase
      .from("business_assets")
      .update({
        ...(parsed.data.version ? { current_version: parsed.data.version } : {}),
        updated_at: now,
      })
      .eq("id", parsed.data.assetId)
      .eq("user_id", user.id);
    if (updateError) return { ok: false, error: "The asset version could not be updated." };

    revalidatePath("/workspace/assets");
    return { ok: true };
  } catch {
    return { ok: false, error: "The workspace database is unavailable." };
  }
}
