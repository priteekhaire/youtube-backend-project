import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js"; // ✅ Import your real Express app

dotenv.config({
  path: "./.env"
});

connectDB()
  .then(() => {
    const port = process.env.PORT || 8000;
    app.listen(port, () => {
      console.log(`🚀 Server is running on port ${port}`);
    });

    app.on("error", (err) => {
      console.error("❌ App-level error:", err);
      throw err;
    });
  })
  .catch((err) => {
    console.error("❌ Error connecting to the database:", err);
  });
 