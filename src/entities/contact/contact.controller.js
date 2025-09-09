import { createContactMessageService, getAllContactMessagesService, getContactMessageByIdService } from './contact.service.js';
import { generateResponse } from '../../lib/responseFormate.js';
import { handleControllerError } from '../../lib/handleError.js';


export const submitContactMessage = async (req, res) => {
  try {
    const saved = await createContactMessageService(req.body);
    generateResponse(res, 201, true, 'Message received successfully', saved);
  } catch (error) {
    handleControllerError(res, error, 'Failed to submit message');
  }
};


export const getAllContactMessages = async (req, res) => {
  try {
    const messages = await getAllContactMessagesService();
    generateResponse(res, 200, true, 'Messages fetched successfully', messages);
  } catch (error) {
    handleControllerError(res, error, 'Failed to fetch messages');
  }
};


export const getContactMessageById = async (req, res) => {
  try {
    const message = await getContactMessageByIdService(req.params.id);
    if (!message) {
      return generateResponse(res, 404, false, 'Message not found');
    }
    generateResponse(res, 200, true, 'Message fetched successfully', message);
  } catch (error) {
    handleControllerError(res, error, 'Failed to fetch message');
  }
};