import { generateResponse } from "../../../lib/responseFormate.js";
import {
  createService,
  getAllServices,
  getServiceByCategoryId,
  getServiceById,
} from "./createServices.service.js";


export const createServiceController = async (req, res) => {
  try {
    const service = await createService(req.body);
    generateResponse(res, 200, true, "Service created successfully", service);
  } catch (error) {
    generateResponse(res, 500, false, "Failed to create service", error.message);
  }
};


export const getAllServicesController = async (req, res) => {
  try {
    const services = await getAllServices();
    generateResponse(res, 200, true, "Services fetched successfully", services);
  } catch (error) {
    generateResponse(res, 500, false, "Failed to fetch services", error.message);
  }
};


export const getServiceByIdController = async (req, res) => {
  try {
    const service = await getServiceById(req.params.id);
    if (!service) {
      return generateResponse(res, 404, false, "Service not found");
    }
    generateResponse(res, 200, true, "Service fetched successfully", service);
  } catch (error) {
    generateResponse(res, 500, false, "Failed to fetch service", error.message);
  }
};


export const getServiceByCategoryIdController = async (req, res) => {
  try {
    const services = await getServiceByCategoryId(req.params.categoryId);
    if (!services || services.length === 0) {
      return generateResponse(res, 200, true, "Service fetched successfully", []);
    }
    
    // Convert to plain objects to remove Mongoose metadata
    const cleanServices = services.map(service => ({
      _id: service._id.toString(),
      name: service.name,
      category: service.category,
      availableDays: service.availableDays,
      timeRange: service.timeRange,
      slotDurationHours: service.slotDurationHours,
      pricePerSlot: service.pricePerSlot,
      maxPeopleAllowed: service.maxPeopleAllowed,
      description: service.description
    }));
    
    generateResponse(res, 200, true, "Service fetched successfully", cleanServices);
  } catch (error) {
    generateResponse(res, 500, false, "Failed to fetch service", error.message);
  }
};
