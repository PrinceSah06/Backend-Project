
import mongoose, { Schema } from "mongoose";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt'




const UserSchema = new Schema({
    userName: {
        type: String,
        required: true,
        uniqe: true,
        lowecase: true,
        trim: true, index: true
    }, email: {
        type: String,
        required: true,
        uniqe: true,
        lowecase: true,
        trim: true, index: true
    }, fullname: {
        type: String,
        required: true,
        uniqe: true,
        lowecase: true,
        trim: true, index: true
    }, avatar: {
        type: String,
        required: true,

    }
    , coverImage: {
        type: String,


    }, watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: 'video'
        }
    ],
    password: {
        type: String,
        required: [true, 'password is required']

    }
    , refreshToken: {
        type: String
    },


}, {
    timestamps: true
})


UserSchema.pre('save', async function (next) {
    if (!this.isModified("password")) return next()
    this.password = await bcrypt.hash(this.password, 10);
    next()
})

UserSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)

}
UserSchema.methods.genrateAccesToken = function () {

    console.log(`env varables  secret key : ${process.env.ACCESS_TOKEN_SECRET}   secret key : ${process.env.ACCESS_TOKEN_EXPIRY}`)
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.userName,
        fullname: this.fullname
    },
        process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    })
}
UserSchema.methods.refreshAccesToken = function () {
    console.log(`env varables  refresh token key : ${process.env.REFRESH_TOKEN_SECRET}   refresh token expirey key : ${process.env.REFRESH_TOKEN_EXPIRY}`)

    return jwt.sign({
        _id: this._id
    },
        process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    })
}


export const User = mongoose.model('User', UserSchema)

//6:43:03