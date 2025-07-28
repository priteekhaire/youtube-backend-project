import {asyncHandler} from '../utils/asyncHandler.js';

const registerUser = asyncHandler(async (req, res) => {
    //get user data from frontend
    //validation-not empty
    // //  user already exists-username or email
    // check for image,check for avtar
    //upload them on cloudinary,avtar
    // create user object-create entry in db
    // remove password and refresh token from response
    // check for user cration
    // return response
     const { fullName, usrname,email, password } = req.body;
     console.log("email", email, "fullName", fullName, "usrname", usrname, "password", password);



   });



export { registerUser }