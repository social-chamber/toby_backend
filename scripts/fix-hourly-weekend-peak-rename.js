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

    const candidates = await Service.find({
      $or: [
        { name: /sat\s*\/?\s*sun/i },
        { availableDays: { $all: ["Sat", "Sun"] } },
      ],
      category: hourly._id,
    });

    let updated = 0;
    for (const svc of candidates) {
      const isPeak = /peak/i.test(svc.name || "");
      if (!isPeak) continue;
      svc.availableDays = ["Sat", "Sun"];
      svc.timeRange = { start: "00:00", end: "09:00" };
      svc.slotDurationHours = 1; // keep hourly slots
      svc.pricePerSlot = 11.9;
      svc.name = "Sat/Sun (12am-9am) Peak";
      await svc.save();
      updated++;
    }
    console.log(`Renamed/updated ${updated} Hourly weekend Peak service(s).`);
  } catch (e) {
    console.error("Fix failed:", e);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();


