import { Badge } from "@gg/ui";
import type { CatalogStockStatus } from "@/lib/catalog/client";

export function StockStatusBadge({ status }: { status: CatalogStockStatus }) {
  return <Badge variant={status} />;
}
