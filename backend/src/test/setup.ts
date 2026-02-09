import { beforeAll, afterAll, afterEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

let mongoServer: MongoMemoryServer;

/**
 * Setup before all tests
 * - Start in-memory MongoDB server
 * - Connect to test database
 */
beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to in-memory database
  await mongoose.connect(mongoUri);
  
  console.log('✅ Test database connected');
});

/**
 * Cleanup after each test
 * - Clear all collections
 */
afterEach(async () => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

/**
 * Cleanup after all tests
 * - Disconnect from database
 * - Stop in-memory MongoDB server
 */
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  
  console.log('✅ Test database disconnected');
});

/**
 * Set test environment variables
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-minimum-32-characters';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.PORT = '5001';

// Mock AWS S3 for tests
process.env.AWS_S3_REGION = 'us-east-1';
process.env.AWS_S3_BUCKET = 'test-bucket';
process.env.AWS_S3_ACCESS_KEY = 'test-access-key';
process.env.AWS_S3_SECRET_ACCESS_KEY = 'test-secret-key';
process.env.AWS_S3_SERVER_URL = 'https://test-bucket.s3.amazonaws.com/';

// Mock Stripe for tests
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key';
process.env.STRIPE_PUBLIC_KEY = 'pk_test_mock_key';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_mock_secret';

// Mock Mailgun for tests
process.env.MAILGUN_API_KEY = 'test-mailgun-key';
process.env.MAILGUN_DOMAIN = 'test.mailgun.org';
process.env.EMAIL_FROM = 'test@example.com';

