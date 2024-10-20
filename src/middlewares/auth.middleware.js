import jwt from "jsonwebtoken"
import { User } from "../models/user.models"

import { ApiError } from "../utils/ApiError"
import { asyncHandler } from "../utils/asyncHandler"

export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token = req.cookies.accessToken || req.body.accessToken || req.header("Authorization").replace("Bearer ", "")
    if (!token) {
        throw new ApiError(401, "Unauthorized")
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(decoded._id).select("-password -refreshToken")
    next()

})