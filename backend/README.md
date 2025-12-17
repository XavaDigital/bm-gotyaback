# Backend

This is the backend for the Fundraising Shirt Campaign Platform.

## Setup

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Create a `.env` file in the root directory with the following variables:
    ```
    PORT=5000
    MONGO_URI=mongodb://localhost:27017/bm-gotyaback
    JWT_SECRET=your_jwt_secret
    ```

3.  Run the server:
    ```bash
    npm run dev
    ```

## Scripts

-   `npm run dev`: Run the server in development mode using nodemon.
-   `npm run build`: Compile TypeScript to JavaScript.
-   `npm start`: Run the compiled JavaScript in production mode.
