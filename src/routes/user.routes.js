import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from '../controllers/user.controller.js';
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
    router.route("/change-password").post(verifyJwt, changeCurrentPassword)
// change password logic will go here
  router.route("/current-user").get(verifyJwt,getCurrentUser)
// get current user logic will go here
router.route("/update-account").patch(verifyJwt,updateAccountDetails)
// update account details logic will go here
router.route("/avatar").patch(verifyJwt, upload.single('avatar'), updateUserAvatar)
// update user avatar logic will go here
router.route("/coverImage").patch(verifyJwt, upload.single('coverImage'), updateUserCoverImage)
// update user cover image logic will go here
router.route("/c/:username").get(verifyJwt, getUserChannelProfile)
// get user channel profile logic will go here
router.route("/history").get(verifyJwt, getWatchHistory)




export default router;