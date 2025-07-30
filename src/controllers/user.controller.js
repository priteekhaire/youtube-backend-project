import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from  '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';


const generateAccessAndRefreshTokens =  async (user) => {
    try{
    // const user= await User.findById(user_id)
   const accesstoken= user.generateAccessToken()
   const refreshtoken= user.generateRefreshToken()
   
   user.refreshToken = refreshtoken;
  await user.save({ validateBeforeSave: false });

    
   return { accesstoken, refreshtoken };
   
    }
    catch (error) {
        console.error("Error generating tokens:", error);
        throw new ApiError(500, "something went wrong while generating refresh and access tokens");
    }
}

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
     const { fullName, username,email, password } = req.body;
     console.log("email", email,  "password", password);
     
    //  if (fullName==="" ){
    //     throw new ApiError(400, "Full name is required");
    //  }
    //  }
    if ([fullName, username, email, password].some(field => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }
    const existedUser=  await User.findOne(
        { $or: [{ username }, { email }] 
    
    })
    if (existedUser) {
        throw new ApiError(409, "Username or email already exists");
    }
    // console.log( req.files);
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    } 
    
    if (!avatarLocalPath ) {
        throw new ApiError(400, "Avatar  are required");
    }
    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)
    if (!avatar) {
        throw new ApiError(500, "Failed to upload avatar");
    }
   const user=await User.create({
        fullName,
        username : username.toLowerCase(),
        avatar: avatar.url,
        coverImage: coverImage ?.url ||"",
        password,
        email,
    })
    const createdUser=await User.findById(user._id).select("-password -refreshToken");
    if (!createdUser) {
        throw new ApiError(500, "Failed to create user");
    }

return res.status(201).json(
    new ApiResponse(201, createdUser, "User registered successfully")

)


});
const loginUser = asyncHandler(async (req, res) => {
    const { email, password,username } = req.body;
    // req-body - data
    // username or email
    // find for user
    // password check
    // access and refresh token
    // send cookies
    if(!email && !username) {
        throw new ApiError(400, "Email and username are required");
    }
    const user= await User.findOne({
      $or: [ { email },{username}]
     } )
     if (!user) {
        throw new ApiError(404, "User not found");
     }
     const isPasswordValid=await user.isPasswordCorrect(password)
        
     if (!isPasswordValid) {
            throw new ApiError(401, "Invalid password");
        }
   const {accesstoken,refreshtoken}=await generateAccessAndRefreshTokens(user);    

   const loggedinUser=await User.findByIdAndUpdate(user._id).select("-password -refreshToken")

   const options = {
        httpOnly: true,
        secure:true,
       
    };

    return res.status(200)
    .cookie('accessToken', accesstoken, options)
    .cookie('refreshToken', refreshtoken, options).json(
        new ApiResponse(200, {User:loggedinUser, accesstoken, refreshtoken}, 
            "User logged in successfully"

        )
    )

    // res.cookie('accessToken', accesstoken, options);
    // res.cookie('refreshToken', refreshtoken, options);

    // return res.status(200).json(
    //     new ApiResponse(200, loggedinUser, "User logged in successfully")
    // );

})
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, 
        { $set:
             { 
                refreshToken: undefined
            }
        }, { 
            new: true 
        }
     )
     const options = {
        httpOnly: true,
        secure:true,
       
    }
    return res.status(200)
    .clearCookie('accessToken', options)
    .clearCookie('refreshToken', options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));

})
const refreshAccessToken = asyncHandler(async (req, res) => {
const incomingRefreshToken=req.cookies.refreshToken||req.body.refreshToken
if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required");
}
try {
    const decodedToken = jwt.verify(
        incomingRefreshToken, 
        process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken.userId);
    if (!user) {
        throw new ApiError(401, "Refresh token is required");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
        throw new ApiError(401, "Refresh token is expired or used");
    }
    const options = {
        httpOnly: true,
        secure:true,
       
    };
    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id);
    return res.status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken',refreshToken, options)
        .json(new ApiResponse(200, {}, "Access token refreshed successfully"));
} catch (error) {
   throw new ApiError(401, "Invalid refresh token");
    
}
})

export { registerUser 
, loginUser, logoutUser, refreshAccessToken
}