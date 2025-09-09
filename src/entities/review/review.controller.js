import { generateResponse } from '../../lib/responseFormate.js';
import { getGoogleReviews } from './review.service.js';
import { handleControllerError } from '../../lib/handleError.js';

export const fetchGoogleReviews = async (req, res) => {
  try {
    const reviews = await getGoogleReviews();
    generateResponse(res, 200, true, "Google reviews fetched successfully", reviews);
  } catch (error) {
    handleControllerError(res, error, "Failed to fetch Google reviews");
  }
};
