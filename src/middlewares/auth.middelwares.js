import  jwt  from "jsonwebtoken";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

export const  verifyJWT = asyncHandler(async(req,res,next)=>{

console.log('inside veryfy token')
try {
      const token = req.cookies?.accesToken || req.header('Authorization')?.replace("Bearer ","")
    console.log(`this is varify token in veryfyjwt : ${token}`)
     if(!token ){
        throw new ApiError(401,"Unauthorized requset")
     }
    
     const decodedToken =  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
    
     const user =await User.findById(decodedToken?._id).select("-password -refreshToken")
    
    
     if (!user){
        throw new ApiError(401,"Invalid Access Token")
     }
    
     req.user = user;
     next()
} catch (error) {
    throw new ApiError(404,'somthing wrong during logout:',error)
    
}




})
