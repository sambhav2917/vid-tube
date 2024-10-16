import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app=express()

//setting up some middleware
app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials:true
    })
)

app.use(express.json({limit: "16kb"}))                            //allowing json format with limit
app.use(express.urlencoded({extended:true,limit:"16kb"}))        //encoding url 
app.use(express.static("public"))                                //serving static directory of public
app.use(cookieParser())


import userRouter from './routes/user.router.js'



app.use("/",userRouter)

export {app}