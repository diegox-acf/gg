import { Badge, type BadgeVariant } from "@gg/ui";
import type { OrderStatus } from "@/lib/orders/admin-client";

// In-flight saga states share the "pending" (amber) look; terminal states get their
// own colors. The real status name is always shown as the label.
const VARIANT: Record<OrderStatus, BadgeVariant> = {
  PENDING: "pending",
  RESERVING: "pending",
  PAYING: "pending",
  CONFIRMED: "confirmed",
  FAILED: "failed",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={VARIANT[status]} label={status} />;
}
