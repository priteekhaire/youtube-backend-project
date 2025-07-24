import express from "express";
import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
  path: "./.env" // NOTE: Make sure the file is named `.env`, not just `env`
});

const app = express(); // ✅ Define app

// Connect to DB first
connectDB()
  .then(() => {
    // Start server after DB connection
    const port = process.env.PORT || 8000;
    app.listen(port, () => {
      console.log(`🚀 Server is running on port ${port}`);
    });

    // ✅ Handle app errors (outside listen callback)
    app.on("error", (err) => {
      console.error("❌ App-level error:", err);
      throw err;
    });
  })
  .catch((err) => {
    console.error("❌ Error connecting to the database:", err);
  });

















// import express from "express";
// const app = express();

// (async () => {
//   try {
//   await mongoose.connect('${ process.env.MONGODB_URI }/${DB_NAME}')
//   app.on('error', (err) => {
//     console.error("Connection error:", err);
//     throw err;
//   });
//   app.listen(process.env.PORT, () => {
//     console.log(`Server is running on port  ${process.env.PORT}  }`);
//   });
//   } catch (error) {
//     console.error("Error:", error);
//     throw error;
//   }
// })()