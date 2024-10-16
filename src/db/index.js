import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";





const connectDB= async() =>{
    try {
        const connectionInstanse=await mongoose.connect(`${process.env.MONGODB_URL}`)
        console.log(`Mongo Db connected ${connectionInstanse.connection.host}`)
        
    } catch (error) {
        console.log("MongodB Connection Error",error)
        process.exit(1);
    }
}

export default connectDB