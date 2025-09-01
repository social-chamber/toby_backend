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
    const packages = await Category.findOne({ name: "Packages" });
    if (!packages) {
      console.error("Packages category not found.");
      process.exit(1);
    }

    const midnightServices = await Service.find({
      category: packages._id,
      name: /midnight/i,
    });

    let updated = 0;
    for (const svc of midnightServices) {
      // Ensure weekend-only, 12am-9am, 9h block
      svc.availableDays = ["Sat", "Sun"];
      svc.timeRange = { start: "00:00", end: "09:00" };
      svc.slotDurationHours = 9;
      await svc.save();
      updated++;
    }

    console.log(`Updated ${updated} Midnight Package service(s) in Packages.`);
  } catch (err) {
    console.error("Fix failed:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();


