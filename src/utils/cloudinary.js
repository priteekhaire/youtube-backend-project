import {v2 as cloudinary} from "cloudinary";
import fs from "fs";




    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret:  process.env.CLOUDINARY_API_SECRET
    });
 const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null; // Return null if no file path is provided
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto", // Automatically determine the resource type (image, video, etc.)
        });
        // console.log("Cloudinary upload response:", response.url);
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        } // Clean up the local file after upload
        return response;
    } catch (error) {
       if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        } // Clean up the local file if upload fails
        return null; // Return null if upload fails
    }
};
export {uploadOnCloudinary};