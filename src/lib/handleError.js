import { generateResponse } from './responseFormate.js';

const CLIENT_ERROR_REGEX = /invalid|expired|not\s*found|already\s*exists|exists|required|missing|no\s*recipients|no\s*booking|no\s*record|unauthorized|forbidden|conflict|limit\s*exceeded|usage\s*limit|inactive|no\s*longer\s*available/i;

export function handleControllerError(res, error, fallbackMessage = 'Request failed', notFoundTo404 = true) {
  const raw = (error && error.message) ? String(error.message) : fallbackMessage;
  const isClient = CLIENT_ERROR_REGEX.test(raw);
  const isNotFound = /not\s*found/i.test(raw);
  const status = isClient ? (isNotFound && notFoundTo404 ? 404 : 400) : 500;
  const message = isClient ? raw : fallbackMessage;
  generateResponse(res, status, false, message, null);
}

export default handleControllerError;


