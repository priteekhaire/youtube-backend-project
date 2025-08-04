import  {asyncHandler}  from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";

// export const verifyJwt = asyncHandler(async(req, res, next) => {
//    try {
//     const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "") ;
//     console.log("Token:", token);
//      if (!token) {
//         throw new ApiError(401, "Access token is required");
//     }
//      const decodedToken= jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

 
//    const user=await User.findById(decodedToken._id).select("-password -refreshToken")
//    if (!user) {
//      // todo
//      throw new ApiError(401, "invalid access token");
//    }
//        req.user = user;
//          next();
 
//    } catch (error) {
//        console.error("JWT verification error:", error);
//        return res.status(401).json({ message: "Invalid access token" });
    
//    }
    
// })
export const verifyJwt = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    console.log("Token:", token);

    if (!token) {
      throw new ApiError(401, "Access token is required");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log("Decoded Token:", decodedToken);

    const user = await User.findById(decodedToken._id).select("-password -refreshToken");

    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("JWT verification error:", error);
    return res.status(401).json({ message: "Invalid access token" });
  }
});
