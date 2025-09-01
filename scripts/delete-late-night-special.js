import mongoose from "mongoose";
import Service from "../src/entities/admin/Services/createServices.model.js";
import Category from "../src/entities/category/category.model.js";
import { mongoURI } from "../src/core/config/config.js";

async function run() {
  if (!mongoURI) {
    console.error("MONGO_URI is not set in environment");
    process.exit(1);
  }

  await mongoose.connect(mongoURI);
  try {
    const hourly = await Category.findOne({ name: "Hourly" });
    if (!hourly) {
      console.error("Hourly category not found.");
      process.exit(1);
    }

    const res = await Service.deleteMany({ name: "Late Night Special", category: hourly._id });
    console.log(`Deleted ${res.deletedCount || 0} service(s) named "Late Night Special" in Hourly category.`);
  } catch (err) {
    console.error("Delete failed:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();


