import { generateResponse } from "../../lib/responseFormate.js";
import { 
  getAllUsers,
  getAllAdmins,
  getAllSellers,
  getUserById,
  updateUser,
  deleteUser,
  createAvatarProfile,
  updateAvatarProfile,
  deleteAvatarProfile,

  createMultipleAvatar,
  updateMultipleAvatar,
  deleteMultipleAvatar,
  

  updateUserFileService,  
  deleteUserFileService,
  uploadUserFileService

} from "./user.service.js";


export const getAllUsersController = async (req, res) => {
  try {
    const { page, limit, search, date } = req.query;
    const { users, paginationInfo } = await getAllUsers({ page, limit, search, date });
    generateResponse(res, 200, true, 'Users fetched successfully', { users, paginationInfo });
  } catch (error) {
    generateResponse(res, 500, false, 'Failed to fetch users', null);
  }
};


export const getAllAdminsController = async (req, res) => {
  try {
    const { page, limit, search, date } = req.query;
    const { admins, paginationInfo } = await getAllAdmins({ page, limit, search, date });
    generateResponse(res, 200, true, 'Admins fetched successfully', { admins, paginationInfo });
  } catch (error) {
    generateResponse(res, 500, false, 'Failed to fetch admins', null);
  }
};


export const getAllSelleresController = async (req, res) => {
  try {
    const { page, limit, search, date } = req.query;
    const { sellers, paginationInfo } = await getAllSellers({ page, limit, search, date });
    generateResponse(res, 200, true, 'Seller fetched successfully', { sellers, paginationInfo });
  } catch (error) {
    generateResponse(res, 500, false, 'Failed to fetch seller', null);
  }
};


export const getUserByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getUserById(id);
    generateResponse(res, 200, true, 'User fetched successfully', user);
  } catch (error) {
    generateResponse(res, 500, false, 'Failed to fetch user', null);
  }
};


export const updateUserController = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedUser = await updateUser({ id, ...req.body });
    generateResponse(res, 200, true, 'User updated successfully', updatedUser);
  } catch (error) {
    generateResponse(res, 500, false, 'Failed to update user', null);
  }
};


export const deleteUserController = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteUser(id);
    generateResponse(res, 200, true, 'User deleted successfully', null);
  } catch (error) {
    generateResponse(res, 500, false, 'Failed to delete user', null);
  }
};


export const createAvatarController = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.files?.profileImage) {
      return generateResponse(res, 400, false, 'Profile image is required');
    }
    // console.log(id)

    const user = await createAvatarProfile(id, req.files);
    generateResponse(res, 200, true, 'Avatar uploaded successfully', user);
  } catch (error) {
    console.error(error);
    const status = error.message.includes('not found') ? 404 : 500;
    const message = status === 500 ? 'Failed to upload avatar' : error.message;
    generateResponse(res, status, false, message);
  }
};


export const updateAvatarProfileController = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await updateAvatarProfile(id, req.files);
    generateResponse(res, 200, true, 'Avatar updated successfully', user); 
  } catch (error) {
    console.error(error);
    generateResponse(res, 500, false, 'Failed to update avatar', error.message);
  }
};


export const deleteAvatarController = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedUser = await deleteAvatarProfile(id);
    generateResponse(res, 200, true, 'Avatar deleted successfully', updatedUser);
  } catch (error) {
    console.error(error);
    generateResponse(res, 500, false, 'Failed to delete avatar', error.message);
  }
};


export const createMultipleAvatarController = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await createMultipleAvatar(id, req.files);
    generateResponse(res, 200, true, 'Multiple avatars uploaded successfully', user);
  } catch (error) {
    console.error(error);
    generateResponse(res, 500, false, 'Failed to upload multiple avatars', error.message);
  }
};


export const updateMultipleAvatarController = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await updateMultipleAvatar(id, req.files);
    generateResponse(res, 200, true, 'Multiple avatars updated successfully', user);
  } catch (error) {
    console.error(error);
    generateResponse(res, 500, false, 'Failed to update multiple avatars', error.message);
  }
};


export const deleteMultipleAvatarController = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await deleteMultipleAvatar(id);
    generateResponse(res, 200, true, 'Multiple avatars deleted successfully', user);
  } catch (error) {
    console.error(error);
    generateResponse(res, 500, false, 'Failed to delete multiple avatars', error.message);
  }
};


export const createUserfileController = async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.files?.file?.[0];

    if (!file) {
      return generateResponse(res, 400, false, 'File is required');
    }

    const result = await uploadUserFileService(id, file);

    return generateResponse(res, 200, true, 'File uploaded successfully', result);
  } catch (error) {
    console.error(error);
    return generateResponse(res, 500, false, 'File upload failed', error.message);
  }
};

export const updateUserfileController = async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.files?.file?.[0];

    if (!file) {
      return generateResponse(res, 400, false, 'File is required');
    }

    const result = await updateUserFileService(id, file);

    return generateResponse(res, 200, true, 'File updated successfully', result);
  } catch (error) {
    console.error(error);
    return generateResponse(res, 500, false, 'Failed to update file', error.message);
  }
};

export const deletefileController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteUserFileService(id);

    return generateResponse(res, 200, true, 'File deleted successfully', result);
  } catch (error) {
    console.error(error);
    return generateResponse(res, 500, false, 'Failed to delete file', error.message);
  }
};