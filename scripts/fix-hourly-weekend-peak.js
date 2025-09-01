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
      category: hourly._id,
      availableDays: { $all: ["Sat", "Sun"] },
    });

    let updated = 0;
    for (const svc of candidates) {
      const s = svc.timeRange?.start;
      const e = svc.timeRange?.end;
      const is24h = s === e; // e.g., 00:00 to 00:00
      const hasWrongName = /12am-12am/i.test(svc.name || "");
      const isPeak = /peak/i.test(svc.name || "");
      if (is24h || hasWrongName || isPeak) {
        // Force to 12am-9am, hourly pricing
        svc.timeRange = { start: "00:00", end: "09:00" };
        svc.slotDurationHours = 1;
        if (svc.pricePerSlot !== 11.9 && isPeak) {
          svc.pricePerSlot = 11.9;
        }
        if (svc.name) {
          svc.name = svc.name.replace(/12am-12am/gi, "12am-9am");
          // If name doesn't include window, prepend
          if (!/\(.*\)/.test(svc.name)) {
            svc.name = `Sat/Sun (12am-9am) ${svc.name}`.trim();
          }
        } else {
          svc.name = "Sat/Sun (12am-9am) Peak";
        }
        await svc.save();
        updated++;
      }
    }
    console.log(`Updated ${updated} Hourly weekend Peak service(s).`);
  } catch (err) {
    console.error("Fix failed:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();


