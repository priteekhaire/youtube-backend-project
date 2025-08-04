import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from  '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import mongoose from "mongoose";



const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found while generating tokens");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error generating tokens:", error);
    throw new ApiError(500, "Error generating tokens");
  }
};


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
     $or: [ { email }, { username } ]
     } )
     if (!user) {
        throw new ApiError(404, "User not found");
     }
     const isPasswordValid=await user.isPasswordCorrect(password)
        
     if (!isPasswordValid) {
            throw new ApiError(401, "Invalid password");
        }
   const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id);    

   const loggedinUser=await User.findById(user._id).select("-password -refreshToken")

   const options = {
        httpOnly: true,
        secure:true,
       
    };

    return res.status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options).json(
        new ApiResponse(200, {User:loggedinUser, accessToken, refreshToken}, 
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
        { $unset:
             { 
                refreshToken: 1
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
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  console.log("Incoming refreshToken:", incomingRefreshToken);

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
     console.log("Decoded token:", decodedToken);

    const user = await User.findById(decodedToken.id);
    console.log("Found user:", user);
    if (!user) {
    
      throw new ApiError(401, "User not found");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or invalid");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    console.log("Stored refreshToken:", user?.refreshToken);


    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
   throw new ApiError(401, "Invalid or expired refresh token");
  }
  
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword} = req.body;
    const user = await User.findById(req.user._id);
    const isPasswordValid = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordValid) {
        throw new ApiError(400, "Invalid old password");
        }
        user.password = newPassword;
        await user.save({ validateBeforeSave: false });
        return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Password changed successfully")
        );
})
const getCurrentUser= asyncHandler(async (req, res) => {
    
    return res.status(200).json(
        new ApiResponse(200,req.user, "Current user fetched successfully")
    )
})
const updateAccountDetails = asyncHandler(async (req, res) => {

const { fullName, email } = req.body;
if(!fullName||!email){
    throw new ApiError(400, "Full name and email are required");
}
const user=await User.findByIdAndUpdate(req.user?._id, 
    { 
   $set: { 
        fullName, 
        email 
    }
}, { 
    new: true, 
    runValidators: true 
}).select("-password ");
return res
.status(200)
.json(
    new ApiResponse(200, user, "Account details updated successfully")
)

})
const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath=req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar) {
        throw new ApiError(500, "Failed to upload avatar");
    }
    const user=await User.findByIdAndUpdate(req.user._id,
        { 
            $set: { 
                avatar: avatar.url 
            } },
        {
            new: true,
        }).select("-password ")
        return res.status(200).json(
            new ApiResponse(200, user, "Avatar updated successfully")
        );
});
const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath=req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, "coverImage is required");
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage) {
        throw new ApiError(500, "Failed to upload coverImage");
    }
      const user= await User.findByIdAndUpdate(req.user._id,
        { 
            $set: { 
                coverImage:coverImage.url 
            } },
        {
            new: true,
        }).select("-password ")
        return res.status(200).json(
            new ApiResponse(200, user, "Cover image updated successfully")
        );
})
const getUserChannelProfile=asyncHandler(async (req, res) => {
   const {username} = req.params;
   if (!username?.trim()) {
        throw new ApiError(400, "Username is required");
    }
    const channel=await User.aggregate([
        {
        $match: {
                username: username.toLowerCase()
            }
      },
      {
        $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subscribers"
        }
      },
      {
        $lookup: {
           from: "subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscribedTo"
        }
      },
      {
        $addFields: {
            subscriberCount: {
                 $size: "$subscribers" 
                },
             channelsubscribedToCount: { 
                $size: "$subscribedTo" 
            },
             isSubscribed: {
                $cond: {
                    if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                    then: true,
                    else: false
                }
       
       
            }
         }
       },
        {
            $project: {
                fullName: 1,
                username: 1,
                avatar: 1,
                coverImage: 1,
                subscriberCount: 1,
                channelsubscribedToCount: 1,
                isSubscribed: 1,
                email: 1,
            }
        }
    ])
    if (!channel?.length) {
        throw new ApiError(404, "Channel not found");
    }
    return res.status(200).json(
        new ApiResponse(200, channel[0], "Channel profile fetched successfully")
    );
})
const getWatchHistory= asyncHandler(async (req, res) => {
    const user = await User.aggregate([
      {
        $match: {
          _id:new mongoose.Types.ObjectId(req.user._id)
        }
      },
      {
        $lookup: {
          from: "videos",
          localField: "watchHistory",
          foreignField: "_id",
          as: "watchHistory",
          pipeline: [
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline:[
                         {
                            $project: {
                                fullName: 1,
                                username: 1,
                                avatar: 1
                            }
                         }

                    ]
                  }  
            },
            {
                $addFields: {
                    owner: { 
                        $first: "$owner"

                    }
                }
            }
            

          ]
        }
      }
    ])
    return res.status(200).json(
        new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully")
    );
})
export { 
registerUser ,
 loginUser,
 logoutUser, 
refreshAccessToken,
changeCurrentPassword,
getCurrentUser,
updateAccountDetails,
updateUserAvatar,
updateUserCoverImage,
getUserChannelProfile,
getWatchHistory
}