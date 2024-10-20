import {  asyncHandler} from "../utils/asyncHandler.js";
import  {ApiError} from "../utils/ApiError.js"
import { User} from "../models/user.models.js"

import {uploadOnCloudinary} from "../utils/cloudinary.js"

import { ApiResponse } from "../utils/ApiResponse.js";

import jwt from "jsonwebtoken"


const generateAccessTokenandRefreshToken = async(userId)=>{
    try {
        const user = await User.findById(userId)
    
        const accessToken = user.generateAccessToken();
        const refreshToken=user.generateRefreshToken()
    
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
        return {accessToken, refreshToken}
    } catch (error) {
        
       throw new ApiError(500,"something went wrong")
    }

}

const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res


    const {fullName, email, username, password } = req.body
    //console.log("email: ", email);

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    console.log(req.files);

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    
    
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    console.log(avatar)
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
   

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

})

const loginUser = asyncHandler(async (req, res) => {
    const{username,email,password} = req.body

    if(!email){
        throw new ApiError(400, "Email is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    if(!user){
        throw new ApiError(401, "User not found")
    }

    const isPasswordValid=await user.isPasswordCorrect(password)  
    
    if(isPasswordValid){
        throw new ApiError(401,"Invalid password")
    }

    const {accessToken, refreshToken}= await generateAccessTokenandRefreshToken(user._id)

    const loggedInUser =await User.findById(user._id).select("-password -refreshToken")

    const option = {
        httpOnly : true,
        secure:process.env.NODE_ENV === "PRODUCTION"
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,option)
    .cookie("refreshToken",refreshToken,option)
    .json(new ApiResponse(200,loggedInUser,"User logged in successfully"))
    
})

const logoutUser = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(req.user._id, {
        $set: {
            refreshToken: undefined,
        }
    },{new: true})

    const options = {
        httpOnly: true,
        secure:process.env.NODE_ENV === "PRODUCTION"
    }

    return res
    .status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(new ApiResponse(200, null, "User logged out successfully"))



})

const refreshAcessToken= asyncHandler(async(res,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401, "Refresh token is required")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findOne(decodedToken?._id)
        if(!user){
        throw new ApiError(401, "User not found")}

        if(user?.refreshToken !== incomingRefreshToken){
            throw new ApiError(401, "Invalid refresh token")
        }

        const options = {
            httpOnly: true,
            secure:process.env.NODE_ENV === "PRODUCTION"
        }

        const {accessToken, refreshToken : newRefreshToken}= await generateAccessTokenandRefreshToken(user._id)

        res
        .status(200)
        .cookie("accessToken",accessToken,options)  
        .cookie("refreshToken",newRefreshToken,options)
        .json(new ApiResponse(200,{accessToken,refreshToken:newRefreshToken},"Refresh token generated successfully"))

    } catch (error) {
        throw new ApiError(401, "Invalid refresh token")
    }
})





export {registerUser,loginUser,refreshAcessToken,logoutUser}
