
// require('dotenv').config({path:'./env'})
import dotenv from 'dotenv'
dotenv.config({path:'.env'})
import {app} from './app.js'


import connectDB from "./db/index.js";


connectDB()
.then(()=>{
    app.on('error',(error)=>{
        console.log('ERR:',error)
        throw error
    })
    app.listen(process.env.PORT ||8000),()=>{
        console.log(`Server is running on Port :${process.env.PORT}`)
    }
}

).catch((error)=>{
    console.log('MONGO db connection failel!!!',error)
})




































/*
import express from "express";
const app = express()
function connectDb(){}
(async ()=>{
    try {

           await  mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on('error',(error)=>{
            console.log("Error :",error);
            throw error
        })

app.length(process.env.PORT,()=>{
    console.log('App is listing on port ')
})



    } catch (error) {
        console.error("Error :",error)
    }
})

*/