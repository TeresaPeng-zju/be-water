import { ArrowLeft, Hammer } from "lucide-react";
import {ButtonLink} from "@/components/ui/button";
import {EmptyState} from "@/components/ui/empty-state";

export function EmptyAssetState() {
  return <EmptyState icon={Hammer} title="Your assets will grow from real work." description="Every repeated customer interaction is a chance to build something reusable. When enough evidence appears, Bee will help you organize it." action={<ButtonLink href="/workspace/orders/new" variant="secondary"><ArrowLeft aria-hidden className="size-4"/>Return to Orders</ButtonLink>} note="A seed appears after the same kind of work is recorded across three customer orders."/>;
}
