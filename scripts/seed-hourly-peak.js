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

    const payload = {
      category: hourly._id,
      name: "Sat/Sun (12am-9am) Peak",
      availableDays: ["Sat", "Sun"],
      timeRange: { start: "00:00", end: "09:00" },
      slotDurationHours: 1,
      pricePerSlot: 11.9,
      maxPeopleAllowed: 5,
      description: "Weekend early morning hourly peak slots",
    };

    const existing = await Service.findOne({
      name: /Peak/i,
      category: hourly._id,
      availableDays: { $all: ["Sat", "Sun"] },
    });

    let result;
    if (existing) {
      Object.assign(existing, payload);
      result = await existing.save();
      console.log("Updated existing service:", result._id.toString());
    } else {
      result = await Service.create(payload);
      console.log("Created service:", result._id.toString());
    }
  } catch (err) {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();


