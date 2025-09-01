import mongoose from "mongoose";
import Service from "../src/entities/admin/Services/createServices.model.js";
import Category from "../src/entities/category/category.model.js";
import { mongoURI } from "../src/core/config/config.js";

const services = [
  {
    name: "Mon-Fri (9am-12pm) Early Bird",
    availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    timeRange: { start: "09:00", end: "12:00" },
    slotDurationHours: 1,
    pricePerSlot: 5.9,
    maxPeopleAllowed: 5,
    description: "",
  },
  {
    name: "Fri (12am-6pm) Non-Peak",
    availableDays: ["Fri"],
    timeRange: { start: "00:00", end: "18:00" },
    slotDurationHours: 1,
    pricePerSlot: 9.9,
    maxPeopleAllowed: 5,
    description: "",
  },
  {
    name: "Mon-Thurs (12pm-9am) Non-Peak",
    availableDays: ["Mon", "Tue", "Wed", "Thu"],
    timeRange: { start: "12:00", end: "09:00" },
    slotDurationHours: 1,
    pricePerSlot: 9.9,
    maxPeopleAllowed: 5,
    description: "",
  },
  {
    name: "Friday Night (6pm-12am) Peak",
    availableDays: ["Fri"],
    timeRange: { start: "18:00", end: "00:00" },
    slotDurationHours: 1,
    pricePerSlot: 11.9,
    maxPeopleAllowed: 5,
    description: "",
  },
  {
    name: "Sat/Sun (12am-9am) Peak",
    availableDays: ["Sat", "Sun"],
    timeRange: { start: "00:00", end: "09:00" },
    slotDurationHours: 1,
    pricePerSlot: 11.9,
    maxPeopleAllowed: 5,
    description: "",
  },
  {
    name: "Mon-Fri (12am-9am) Non-Peak",
    availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    timeRange: { start: "00:00", end: "09:00" },
    slotDurationHours: 1,
    pricePerSlot: 9.9,
    maxPeopleAllowed: 5,
    description: "",
  },
];

async function upsert(hourlyId, svc) {
  const existing = await Service.findOne({ name: svc.name, category: hourlyId });
  if (existing) {
    Object.assign(existing, { ...svc, category: hourlyId });
    await existing.save();
    return { action: "updated", id: existing._id.toString() };
  }
  const created = await Service.create({ ...svc, category: hourlyId });
  return { action: "created", id: created._id.toString() };
}

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
    for (const svc of services) {
      const res = await upsert(hourly._id, svc);
      console.log(`${res.action}: ${svc.name} (${res.id})`);
    }
  } catch (err) {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();


