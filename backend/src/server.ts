import dotenv from 'dotenv';

// Load environment variables FIRST before importing anything else
dotenv.config();

import app from './app';
import connectDB from './config/db';

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
