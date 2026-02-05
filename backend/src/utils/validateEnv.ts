/**
 * Environment variable validation utility
 * Validates that all required environment variables are set on startup
 */

interface EnvConfig {
  // Required variables
  NODE_ENV: string;
  PORT: string;
  MONGODB_URI: string;
  JWT_SECRET: string;
  FRONTEND_URL: string;
  
  // AWS S3 (Required for file uploads)
  AWS_REGION: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_S3_BUCKET_NAME: string;
  
  // Email (Required for password reset)
  MAILGUN_API_KEY: string;
  MAILGUN_DOMAIN: string;
  MAILGUN_FROM_EMAIL: string;
  
  // Stripe (Optional - only if payments are enabled)
  STRIPE_SECRET_KEY?: string;
  STRIPE_PUBLIC_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
}

// Critical variables required in all environments
const criticalEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
];

// Required in production, optional in development
const productionRequiredVars = [
  'NODE_ENV',
  'FRONTEND_URL',
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_S3_BUCKET_NAME',
  'MAILGUN_API_KEY',
  'MAILGUN_DOMAIN',
  'MAILGUN_FROM_EMAIL',
];

const optionalEnvVars = [
  'PORT',
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLIC_KEY',
  'STRIPE_WEBHOOK_SECRET',
];

/**
 * Validates that all required environment variables are set
 * Throws an error if any required variables are missing
 */
export const validateEnvironment = (): void => {
  const missingCritical: string[] = [];
  const missingProduction: string[] = [];
  const warnings: string[] = [];

  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

  // Debug: Log what we're checking
  console.log('\n🔍 Validating environment variables...');
  console.log(`Environment: ${process.env.NODE_ENV || 'development (default)'}`);

  // Check critical variables (required in all environments)
  for (const varName of criticalEnvVars) {
    if (!process.env[varName]) {
      missingCritical.push(varName);
    }
  }

  // If critical variables are missing, throw error
  if (missingCritical.length > 0) {
    console.error('\n❌ ENVIRONMENT VALIDATION FAILED');
    console.error('Missing critical environment variables:');
    missingCritical.forEach(varName => {
      console.error(`  - ${varName}`);
    });
    console.error('\nPlease set these variables in your .env file\n');
    throw new Error('Missing critical environment variables');
  }

  // Check production-required variables
  for (const varName of productionRequiredVars) {
    if (!process.env[varName]) {
      if (isProduction) {
        missingProduction.push(varName);
      } else {
        warnings.push(varName);
      }
    }
  }

  // If production variables are missing in production, throw error
  if (isProduction && missingProduction.length > 0) {
    console.error('\n❌ PRODUCTION ENVIRONMENT VALIDATION FAILED');
    console.error('Missing required environment variables for production:');
    missingProduction.forEach(varName => {
      console.error(`  - ${varName}`);
    });
    console.error('\nPlease set these variables in your .env file\n');
    throw new Error('Missing required production environment variables');
  }

  // Check optional variables
  for (const varName of optionalEnvVars) {
    if (!process.env[varName] && varName.startsWith('STRIPE')) {
      warnings.push(varName);
    }
  }

  // Validate specific formats (only for set variables)
  validateSpecificFormats();

  // Log success
  console.log('✅ Environment variables validated successfully');

  if (isDevelopment) {
    console.log('   Running in DEVELOPMENT mode');
  }

  // Log warnings for missing optional/development variables
  if (warnings.length > 0 && isDevelopment) {
    console.log('\n⚠️  Optional environment variables not set (OK for development):');
    warnings.forEach(varName => {
      console.log(`  - ${varName}`);
    });
    console.log('');
  }
};

/**
 * Validates specific environment variable formats
 */
const validateSpecificFormats = (): void => {
  // Validate NODE_ENV if set
  if (process.env.NODE_ENV) {
    const validNodeEnvs = ['development', 'production', 'test'];
    if (!validNodeEnvs.includes(process.env.NODE_ENV)) {
      throw new Error(`NODE_ENV must be one of: ${validNodeEnvs.join(', ')}`);
    }
  }

  // Validate PORT is a number if set
  if (process.env.PORT) {
    const port = parseInt(process.env.PORT, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      throw new Error('PORT must be a valid port number (1-65535)');
    }
  }

  // Validate MONGODB_URI format (required)
  if (!process.env.MONGODB_URI?.startsWith('mongodb')) {
    throw new Error('MONGODB_URI must be a valid MongoDB connection string');
  }

  // Validate JWT_SECRET length (required)
  if ((process.env.JWT_SECRET?.length || 0) < 32) {
    console.warn('⚠️  WARNING: JWT_SECRET should be at least 32 characters for security');
  }

  // Validate FRONTEND_URL format if set
  if (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.startsWith('http')) {
    throw new Error('FRONTEND_URL must be a valid URL starting with http:// or https://');
  }

  // Validate email format if set
  if (process.env.MAILGUN_FROM_EMAIL) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(process.env.MAILGUN_FROM_EMAIL)) {
      throw new Error('MAILGUN_FROM_EMAIL must be a valid email address');
    }
  }

  // If Stripe keys are partially set, warn about missing ones
  const stripeVars = ['STRIPE_SECRET_KEY', 'STRIPE_PUBLIC_KEY', 'STRIPE_WEBHOOK_SECRET'];
  const setStripeVars = stripeVars.filter(v => process.env[v]);
  if (setStripeVars.length > 0 && setStripeVars.length < stripeVars.length) {
    console.warn('\n⚠️  WARNING: Some Stripe variables are set but not all:');
    console.warn('Set variables:', setStripeVars.join(', '));
    console.warn('Missing variables:', stripeVars.filter(v => !process.env[v]).join(', '));
    console.warn('Stripe payments may not work correctly\n');
  }
};

/**
 * Gets a typed environment configuration object
 */
export const getEnvConfig = (): EnvConfig => {
  return {
    NODE_ENV: process.env.NODE_ENV!,
    PORT: process.env.PORT!,
    MONGODB_URI: process.env.MONGODB_URI!,
    JWT_SECRET: process.env.JWT_SECRET!,
    FRONTEND_URL: process.env.FRONTEND_URL!,
    AWS_REGION: process.env.AWS_REGION!,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID!,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY!,
    AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME!,
    MAILGUN_API_KEY: process.env.MAILGUN_API_KEY!,
    MAILGUN_DOMAIN: process.env.MAILGUN_DOMAIN!,
    MAILGUN_FROM_EMAIL: process.env.MAILGUN_FROM_EMAIL!,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  };
};

