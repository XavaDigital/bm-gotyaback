import mongoose from 'mongoose';

const RETRY_DELAYS_MS = [1000, 2000, 4000]; // 3 retries: 1s, 2s, 4s

const connectDB = async () => {
  for (let attempt = 1; attempt <= RETRY_DELAYS_MS.length + 1; attempt++) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI as string);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      const isLastAttempt = attempt > RETRY_DELAYS_MS.length;
      if (isLastAttempt) {
        console.error(`MongoDB connection failed after ${attempt} attempts: ${(error as Error).message}`);
        process.exit(1);
      }
      const delay = RETRY_DELAYS_MS[attempt - 1];
      console.error(`MongoDB connection attempt ${attempt} failed — retrying in ${delay / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

export default connectDB;
