import express from 'express'
const app = express()
import cookieParser from 'cookie-parser'
import cors from 'cors'


app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}))

app.use(express.json({limit: '16kb'}));
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'))

app.use(cookieParser())

//route
import userRouter from "./routes/user.route.js"


app.use((req, res, next) => {
  console.log('Request body:', req.body);
  next();
});
//routes declaration 
app.use('/api/v1/user',userRouter)




export { app }