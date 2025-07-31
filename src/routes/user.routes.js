import { Router } from "express";
import { loginUser, logoutUser, registerUser } from '../controllers/user.controller.js';
import {upload} from '../middlewares/multer.middlewares.js'; // Assuming you have a multer setup for file uploads
import { verifyJwt } from "../middlewares/auth.middlewares.js";

const router = Router()

router.route("/register").post(
    // middleware to handle file uploads
    // This will handle the avatar and coverImage fields in the request
    upload.fields([
        { name: 'avatar', maxCount: 1 },
        { name: 'coverImage', maxCount: 1 }
    ]),
    registerUser)
  
    router.route("/login").post(
    // login logic will go here
    loginUser
     
    );
    router.route("/logout").post(verifyJwt ,logoutUser)
    // logout logic will go here
    // This will clear the refresh token from the user's cookies
    router.route("/refresh-token").post(refreshAccessToken)
    // refresh token logic will go here)




export default router;