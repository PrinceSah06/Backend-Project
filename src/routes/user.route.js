import { Router } from "express";
import { registerUser, loginUser,refreshAccessToken, logoutUser, changeCurrentPassword, getCurrentUser, updatedAccountDetails, updateUserAvatar, updateUserImage, getUserChanelProfel, getWatchHistory } from "../controllers/user.controler.js";
import { upload } from "../middlewares/mulder.middlewares.js"
import { verifyJWT } from "../middlewares/auth.middelwares.js";
const router = Router()
router.route('/register').post(upload.fields([
    {
        name: "avatar",
        maxCount: 1
    }, {
        name: 'coverImage',
        maxCount: 1
    }
]), registerUser)
router.route('/login').post(loginUser)
//secured routes

router.route("/logout") .post(verifyJWT,logoutUser)

router.route("/refresh-token").post(refreshAccessToken)


router.route('/change-password').post(verifyJWT,changeCurrentPassword)
router.route("/currunt-user").get(verifyJWT,getCurrentUser)
router.route("/update-account").patch(verifyJWT,updatedAccountDetails)
router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)
router.route("/cover-image").patch(verifyJWT,upload.single("/coverImage"),updateUserImage);
router.route("c/:username").get(verifyJWT,getUserChanelProfel);

router.route("/history").get(verifyJWT,getWatchHistory)
export default router