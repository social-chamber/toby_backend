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
    const list = await Service.find({ category: hourly._id }).lean();
    console.log(JSON.stringify(list.map(s => ({
      _id: s._id,
      name: s.name,
      availableDays: s.availableDays,
      timeRange: s.timeRange,
      slotDurationHours: s.slotDurationHours,
      pricePerSlot: s.pricePerSlot,
    })), null, 2));
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();


