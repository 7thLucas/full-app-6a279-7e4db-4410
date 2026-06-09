import { seedWarehouse } from "./warehouse.seed";
import { createLogger } from "~/lib/logger";

const logger = createLogger("WarehouseApiSeed");

export async function runWarehouseSeeds(): Promise<void> {
  try {
    await seedWarehouse();
  } catch (error) {
    logger.error("Warehouse seed failed:", error);
  }
}
