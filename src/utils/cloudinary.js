import{v2 as cloudinary } from 'cloudinary'
import  fs from 'fs'
import dotenv from 'dotenv';
dotenv.config({
    path: './.env'
});


cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY
,
    api_secret:process.env.CLOUDINARY_API_SECRET

})


const uploadOnCloudinary = async (loacalFilePath)=>{

    try {
        if(!loacalFilePath) return null;
        // upload the file 
       const response= await   cloudinary.uploader.upload(loacalFilePath,{
            resource_type:'auto',
        })
        // file uploaded success fully
        return response;
    } catch (error) {
        console.log('this error is coming from cloudinary js :',error)
          // ✅ Same safety check in error case
    if (fs.existsSync(loacalFilePath)) {
      fs.unlinkSync(loacalFilePath);
    }
        fs.unlinkSync(loacalFilePath) // remove rhe locally saved file
        return null
    }
}

export default uploadOnCloudinary;