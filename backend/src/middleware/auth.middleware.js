import jwt from 'jsonwebtoken'
import User from '../models/user.model.js'

export const protectRoute = async (req, res, next) =>{
    try {
        // 1️⃣ Extract the token from cookies
        const token = req.cookies.jwt;   //named the cookie with "jwt"
        if(!token){
            return res.status(401).json({ message: "Unauthorised - No token provided"})
        }

        // 2️⃣ Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if(!decoded){
            return res.status(401).json({ message: " Unauthorised- Invalid Token"});
        }
        
        // 3️⃣ Fetch the user from the database (excluding password)
        const user = await User.findById(decoded.userId).select("-password");
        if(!user){
            return res.status(404).json({ message: " User not found"});
        }

        // 4️⃣ Attach the user object to `req.user`
        req.user = user;

        next(); // Move to `updateProfile` controller
    } 
    catch (error) {
        console.log("Error in protectRoute middleware: ", error.message);
        res.status(500).json({ message: "Internal Server Error "})
    }
}