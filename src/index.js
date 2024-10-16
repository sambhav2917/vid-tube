import { app } from "./app.js"
import dotenv from "dotenv"
import connectDB from "./db/index.js";


dotenv.config({
    path: "./.env"
})



const Port=process.env.PORT || 3001;

connectDB()
.then(()=>{
    app.listen(Port,()=>{
        console.log(`Server is running ${Port}`)
    })
})
.catch((err)=>{
    console.log("MongoDb connection error")
})




