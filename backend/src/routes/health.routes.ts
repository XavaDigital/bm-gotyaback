import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import Stripe from 'stripe';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

const router = Router();

/**
 * Health check endpoint
 * GET /health
 * Returns the health status of the application and its dependencies
 */
router.get('/health', async (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: {
        status: 'checking',
        message: '',
      },
      stripe: {
        status: 'checking',
        message: '',
      },
      s3: {
        status: 'checking',
        message: '',
      },
    },
  };

  let isHealthy = true;

  // Check MongoDB connection
  try {
    if (mongoose.connection.readyState === 1) {
      // 1 = connected
      if (mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
      }
      health.services.database.status = 'healthy';
      health.services.database.message = 'Connected';
    } else {
      health.services.database.status = 'unhealthy';
      health.services.database.message = `Connection state: ${mongoose.connection.readyState}`;
      isHealthy = false;
    }
  } catch (error: any) {
    health.services.database.status = 'unhealthy';
    health.services.database.message = error.message || 'Connection failed';
    isHealthy = false;
  }

  // Check Stripe connection (if configured)
  try {
    if (process.env.STRIPE_SECRET_KEY) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-12-15.clover',
      });
      
      // Try to retrieve account info (lightweight check)
      await stripe.balance.retrieve();
      health.services.stripe.status = 'healthy';
      health.services.stripe.message = 'Connected';
    } else {
      health.services.stripe.status = 'not_configured';
      health.services.stripe.message = 'Stripe not configured (optional)';
    }
  } catch (error: any) {
    health.services.stripe.status = 'unhealthy';
    health.services.stripe.message = error.message || 'Connection failed';
    // Stripe is optional, so don't mark overall health as unhealthy
  }

  // Check S3 connection (if configured)
  try {
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET_NAME) {
      const s3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });

      // Check if bucket exists and is accessible
      const command = new HeadBucketCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
      });
      
      await s3Client.send(command);
      health.services.s3.status = 'healthy';
      health.services.s3.message = 'Connected';
    } else {
      health.services.s3.status = 'not_configured';
      health.services.s3.message = 'S3 not configured';
      // S3 might not be configured in development
    }
  } catch (error: any) {
    health.services.s3.status = 'unhealthy';
    health.services.s3.message = error.message || 'Connection failed';
    // S3 is optional in development, so don't mark overall health as unhealthy
    // unless we're in production
    if (process.env.NODE_ENV === 'production') {
      isHealthy = false;
    }
  }

  // Set overall status
  health.status = isHealthy ? 'healthy' : 'unhealthy';

  // Return appropriate status code
  const statusCode = isHealthy ? 200 : 503;
  res.status(statusCode).json(health);
});

/**
 * Simple liveness probe
 * GET /health/live
 * Returns 200 if the server is running
 */
router.get('/health/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Readiness probe
 * GET /health/ready
 * Returns 200 if the server is ready to accept traffic (database connected)
 */
router.get('/health/ready', async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState === 1) {
      if (mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
      }
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        message: 'Database not connected',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error: any) {
    res.status(503).json({
      status: 'not_ready',
      message: error.message || 'Database check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;

