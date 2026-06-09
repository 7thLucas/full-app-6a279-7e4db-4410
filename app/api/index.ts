// Import global routes
import routes from "./routes";
import { initializeModels } from "./models";
<<<<<<< HEAD
import warehouseRoutes from "~/warehouse/warehouse.routes";
import { runWarehouseSeeds } from "~/warehouse/warehouse.api.seed";

// Initialize models
await initializeModels();
await initializeWarehouseModels();
await runWarehouseSeeds();

async function initializeWarehouseModels() {
  // Force-import warehouse models so Typegoose registers them
  await import("../warehouse/models/location.model");
  await import("../warehouse/models/inventory-item.model");
  await import("../warehouse/models/movement.model");
}

import { Router } from "express";
const combined = Router();
combined.use(warehouseRoutes);
combined.use(routes);

export default combined;
=======

// Initialize models
await initializeModels();

export default routes;
>>>>>>> 7c6385e (chore(app-preview): inject skaffold + env configs)
