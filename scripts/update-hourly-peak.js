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

    const query = {
      category: hourly._id,
      name: /Peak/i,
      availableDays: { $all: ["Sat", "Sun"] },
    };

    const svc = await Service.findOne(query);
    if (!svc) {
      console.error("No Hourly Peak service found for Sat/Sun.");
      process.exit(1);
    }

    svc.timeRange = { start: "00:00", end: "09:00" };
    svc.slotDurationHours = 1; // hourly slots
    svc.pricePerSlot = 11.9;
    svc.maxPeopleAllowed = svc.maxPeopleAllowed || 5;

    await svc.save();
    console.log("Updated service:", svc._id.toString());
  } catch (err) {
    console.error("Update failed:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();


