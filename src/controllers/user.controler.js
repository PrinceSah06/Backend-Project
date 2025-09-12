import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from "../utils/apiError.js"
import uploadOnCloudinary from '../utils/cloudinary.js'
import { User } from '../models/user.model.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import fs, { appendFile } from 'fs';
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { pipeline } from 'stream'



const genrateAccesAndRefreshToken = async (userId) => {
  try {
    console.log('Inside G A T ANDREF')
    const user = await User.findById(userId)
    console.log('user  : ', user)

    const accesToken = user.genrateAccesToken()
    console.log('Generated accessToken:', accesToken);

    const refreshToken = user.refreshAccesToken()
    console.log('Generated refreshToken:', refreshToken);

    user.refreshToken = refreshToken

    await user.save({ validateBeforeSave: false })

    return {
      accesToken, refreshToken
    }


  } catch (error) {
    console.error('Error in genrateAccesAndRefreshToken:', error);

    throw new ApiError(500, 'somthing went wrong while genrting token :', error.message)
  }
}
const registerUser = asyncHandler(async (req, res) => {

  //validation -not empty
  //check if user already exist
  //check avatar and imges,
  //upload to clounairry
  //check avatar uploaded or not
  // create user object;
  //create user in db
  //remove password and refers h token field 
  //check for user creation 
  //   return res

  const { userName, email, fullname, password } = req.body



  if ([fullname, userName, password, email].some((field) => field?.trim() === '')) {
    throw new ApiError(400, 'All field are required');
  }

  const existedUser = await User.findOne({ $or: [{ userName }, { email },] })

  if (existedUser) {
    throw new ApiError(409, "User is existied")
  }

  const avatarLocalPath = req.files?.avatar[0]?.path


  const coverImageLocalPath = req.files?.coverImage[0]?.path

  if (!avatarLocalPath || !fs.existsSync(avatarLocalPath)) {
    throw new ApiError(400, 'Avatar file is missing or invalid path');
  }
  if (coverImageLocalPath && !fs.existsSync(coverImageLocalPath)) {
    throw new ApiError(400, 'Cover image file is missing or invalid path');
  }

  let avatar;
  let coverImg;

  try {
    avatar = await uploadOnCloudinary(avatarLocalPath);
  } catch (err) {
    throw new ApiError(500, 'Avatar upload failed', err);
  }
  try {
    if (coverImageLocalPath) {
      coverImg = await uploadOnCloudinary(coverImageLocalPath);
    }
  } catch (err) {
    throw new ApiError(500, 'Cover image upload failed');
  }

  if (!avatar) {
    throw new ApiError(400, 'avatar file is required')

  }

  const user = await User.create(
    {
      fullname,
      avatar: avatar.url,
      coverImage: coverImg?.url || '',
      password, email,
      userName: userName.toLowerCase()
    })


  const createduser = await User.findById(user._id).select(
    "-password -refreshToken")


  if (!createduser) {
    throw new ApiError(505, 'somthie went wrong in server')
  }



  return res.status(201).json(
    new ApiResponse(200, createduser, "usernregistersuccesfully")
  )



})

const loginUser = asyncHandler(async (req, res) => {
  //req body -> data
  //username or email
  //find the user
  //passwod check
  // access and refresh token
  //drnf cookie

  const { email, userName, password } = req.body
  if (!userName && !email) {
    throw new ApiError(400, 'user and  email  required')
  }

  const user = await User.findOne({ $or: [{ userName }, { email }] })
  if (!user) {
    throw new ApiError(404,
      'User does not exist'
    )
  }

  const isPasswordValid = await user.isPasswordCorrect(password)

  if (!isPasswordValid) {
    throw new ApiError(401,
      'User password incorect'
    )
  }


  const { accesToken, refreshToken } = await genrateAccesAndRefreshToken(user._id)


  const loggedInUser = await User.findById(user._id).select("-password -refreshToken").lean()


  const options = {
    httpOnly: true,
    secure: true
  }

  return res.
    status(200)
    .cookie('accesToken', accesToken, options)
    .cookie('refreshToken', options)
    .json(new ApiResponse(200,
      { user: loggedInUser, accesToken, refreshToken }, "User loggedin success full")
    )
}



)
const logoutUser = (asyncHandler(async (req, res) => {
  console.log('inside logout ')
  User.findByIdAndUpdate(req.user._id,
    {
      $set:
      {
        refreshToken: undefined
      }
    }, { new: true }
  )

  const options = {
    httpOnly: true,
    secure: true
  }
  return res.status(200).clearcookie(accesToken, options).clearcookie("refreshToken", options).json(
    new ApiResponse(200, "user logot succes fully")
  )
})
)

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingREfreshToken = req.cookie.refreshToken || req.body.refreshToken

  if (!incomingREfreshToken) {
    throw new ApiError(401, "unAuthrised request  ")
  }

  try {

    const decodedToken = jwt.verify(incomingREfreshToken, process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken._id)

    if (!user) {
      throw new ApiError(401, 'invalid token')
    }

    if (incomingREfreshToken !== user?.refreshToken) {
      throw new ApiError(401, 'refresh token is expired or not mathched')
    }

    const options = {
      httpOnly: true, secure: true

    }
    const { accesToken, refreshToken } = await genrateAccesAndRefreshToken(user._id)



    return res
      .status(200)
      .cookie("accesToken", accesToken)
      .cookie("refreshToken", refreshToken)
      .json(new ApiResponse(200,
        {
          accesToken, refreshToken
        }, "acces token succesfully updated"
      )
      )
  } catch (error) {
    throw new ApiError(401, error.massage || "unauthrised  request")

  }
})


const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body
  const user = await User.findById(req.user?._id)

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
  if (!isPasswordCorrect) {
    throw new ApiError(400, 'Invalid Password')
  }

  user.password = newPassword
  await user.save({ validateBeforeSave: false })

  return res.status(200)
    .json(new ApiResponse(200, "Password updated "))






})
const getCurrentUser = asyncHandler(async (
  req, res) => {
  return res
    .status(200).
    json(200, req.user, "Current user fetched succesfully")

})

const updatedAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body
  if (!fullname || !email) {
    throw new ApiError(400, "All fields are required")
  }
  const user = await User.findByIdAndDelete(
    req.user?._id,
    {
      $set: {
        fullname, email
      }
    },
    { new: true }
  )
    .select("-password")

  return res.status(200)
    .json(new ApiResponse(200, user, "User updated successfully"))

})

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar File is missing")
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar")
  }
  const user = await User.findByIdAndUpdate(req.user._id, {
    $set: {
      avatar: avatar.url

    }
  }, { new: true }).select("-password")

  return res.status(200)
    .json(new ApiResponse(200, user, "Cover Image has been updated"))
})

const updateUserImage = asyncHandler(async (req, res) => {
  const imageLocalPath = req.file?.path

  if (!imageLocalPath) {
    throw new ApiError(400, "Avatar File is missing")
  }
  const coverImage = await uploadOnCloudinary(LocaimagelPath)

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading on coverImage")
  }
  const user = await User.findByIdAndUpdate(req.user._id, {
    $set: {
      coverImage: coverImage.url

    }
  }, { new: true }).select("-password")


  return res.status(200)
    .json(new ApiResponse(200, user, "Cover Image has been updated"))
})

const getUserChanelProfel = asyncHandler(async (req, res) => {
  const { userName } = req.params
  if (!userName?.trim()) {
    throw new ApiError(400, "user name is Missing")
  }
  const chennel = await User.aggregate([
    {
      $match: {
        userName
      }
    },
    {
      $lookup: {
        from: "Subscription",
        localField: _id,
        foreignField: "channel",
        as: 'subscribers'
      }
    }


    , {
      $lookup: {

        from: "Subscription",
        localField: _id,
        foreignField: "subscriber",
        as: 'subscribedTo'

      }
    }
    , {
      $addFields: {
        subsciberCount: {
          $size: "$subscribers"
        }, channelsSubsribedToCount: {
          $size: "$subscribedTo"
        }
        , isSubsribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] }, then: true, else: false
          }
        }
      }
    }, {
      $project: {
        fullname: 1, userName: 1, subsciberCount: 1, channelsSubsribedToCount: 1, isSubsribed: 1, avatar: 1, coverImage: 1, email: 1
      }
    }
  ])
  if (chennel?.length) {
    throw new ApiError(404, "cheenel does not exixts")
  }

  return res.status(200).join(new ApiResponse(200, chennel[0], "User chennel Featched succesfully "))
})


const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    }, {
      $lookup: {
        from: 'videos',
       localField: "watchHistory",
        foreignField: _id,
        as: 'watchHistory',
        pipeline: [
          {
            $lookup: {
              from: 'users',
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [{
                $project: {
                  fullname: 1, email: 1, userName: 1, avatar: 1
                }
              }]
            }
          }
        ]
      }
    }
  ])
  return res.status(200).json(new ApiResponse(200,user[0].watchHistory,"Watch history fetched succesfully"))
})

export { updateUserAvatar,getWatchHistory, getUserChanelProfel, updateUserImage, loginUser, updatedAccountDetails, registerUser, getCurrentUser, changeCurrentPassword, refreshAccessToken, logoutUser }

