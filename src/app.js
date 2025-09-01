import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import xssClean from 'xss-clean';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from "path";
import { fileURLToPath } from "url";

import logger from './core/config/logger.js';
import errorHandler from './core/middlewares/errorMiddleware.js';
import notFound from './core/middlewares/notFound.js';
import { globalLimiter } from './lib/limit.js';
import appRouter from './core/app/appRouter.js';
import { stripeWebhook } from './entities/payment/webHook.controller.js';
import bodyParser from 'body-parser';
import { urlCleanupMiddleware } from './core/middlewares/urlCleanupMiddleware.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Set up security middleware
app.use(helmet());
app.use(
  cors({
    origin: "*"
  })
);
app.use(xssClean());
app.use(mongoSanitize());

// Set up logging middleware
app.use(morgan('combined'));

app.post('/api/v1/payment/webhook',  bodyParser.raw({type: "*/*"}), stripeWebhook);

// Set up body parsing middleware
app.use(express.json({
  limit: '10000kb',
  
}));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Set up rate limiting middleware
app.use(globalLimiter);

// Set up URL cleanup middleware (must come before routes)
app.use(urlCleanupMiddleware);

// Set up static files middleware
const uploadPath = path.resolve(__dirname, "../uploads");
app.use("/uploads", express.static(uploadPath));

// Set up API routes
app.use('/api', appRouter);

// Set up 404 error middleware
app.use(notFound);

// Set up error handling middleware
app.use(errorHandler);

logger.info('Middleware stack initialized');

//Export the app
export default app;


