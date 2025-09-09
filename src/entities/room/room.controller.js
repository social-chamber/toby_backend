import * as roomService from "./room.service.js";
import { generateResponse } from "../../lib/responseFormate.js";
import { handleControllerError } from "../../lib/handleError.js";
import { cloudinaryUpload } from "../../lib/cloudinaryUpload.js";


export const createRoom = async (req, res) => {
  try {
    const { title,maxCapacity,status } = req.body;
    const file = req.files?.image?.[0];

    if (!file) {
      return generateResponse(res, 400, false, "Image is required");
    }

    const uploadResult = await cloudinaryUpload(file.path, `room_${Date.now()}`, "room/images");

    const room = await roomService.createRoomService({
      title,

      maxCapacity,
      status,
      image: uploadResult.secure_url
    });

    generateResponse(res, 201, true, "Room created successfully", room);
  } catch (error) {
    handleControllerError(res, error, "Failed to create room");
  }
};


export const getAllRooms = async (req, res) => {
  try {
    const rooms = await roomService.getAllRoomsService();
    // Convert to plain objects to remove Mongoose metadata
    const cleanRooms = rooms.map(room => ({
      _id: room._id.toString(),
      title: room.title,
      image: room.image,
      category: room.category,
      maxCapacity: room.maxCapacity,
      status: room.status,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt
    }));
    generateResponse(res, 200, true, "Rooms fetched successfully", cleanRooms);
  } catch (error) {
    handleControllerError(res, error, "Failed to fetch rooms");
  }
};


export const getRoomById = async (req, res) => {
  try {
    const room = await roomService.getRoomByIdService(req.params.id);
    if (!room) {
      return generateResponse(res, 404, false, "Room not found");
    }
    generateResponse(res, 200, true, "Room fetched successfully", room);
  } catch (error) {
    handleControllerError(res, error, "Failed to fetch room");
  }
};


export const updateRoom = async (req, res) => {
  try {
    const { title,  maxCapacity, status } = req.body;
    const file = req.files?.image?.[0];

    let updateData = {};
    if (title) updateData.title = title;
    
    if (maxCapacity) updateData.maxCapacity = maxCapacity;
    if (status) updateData.status = status;

    if (file) {
      const result = await cloudinaryUpload(file.path, `room_${Date.now()}`, "room/images");
      updateData.image = result.secure_url;
    }

    const updatedRoom = await roomService.updateRoomService(req.params.id, updateData);
    if (!updatedRoom) {
      return generateResponse(res, 404, false, "Room not found");
    }

    generateResponse(res, 200, true, "Room updated successfully", updatedRoom);
  } catch (error) {
    handleControllerError(res, error, "Failed to update room");
  }
};


export const deleteRoom = async (req, res) => {
  try {
    const deleted = await roomService.deleteRoomService(req.params.id);
    if (!deleted) {
      return generateResponse(res, 404, false, "Room not found");
    }
    generateResponse(res, 200, true, "Room deleted successfully");
  } catch (error) {
    handleControllerError(res, error, "Failed to delete room");
  }
};
