import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {

    //1. Validate input fields
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be of atleast 6 characters" });
    }


    //2. Check if user already exists
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "Email already exists" });
    }


    //3. Hash the password before saving 
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);


    //4. Create a new user 
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });


    //5. Save the new user and generate a token
    if (newUser) {
      generateToken(newUser._id, res);
      await newUser.save();

      //201 -> something has been created
      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
    } 
    else [res.status(400).json({ message: "Invalid user data" })];
  } 
  catch (error) {
    console.log("Error in signup Controller", error.message);
    res.status(500).json({ message: "Internal Server Error" }); //500 -> server error
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {

    // 1. Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "invalid credentials" });
    }


    // 2. Compare the provided password with the stored hashed password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "invalid credentials" });
    }


    // 3. Generate a token and send user details in response
    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });

  } 
  catch (error) {
    console.log("Error in login Controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged Out Successfully " });
  } 
  catch (error) {
    console.log("Error in logout Controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;


    //1. Validate Input
    if (!profilePic) {
      res.status(400).json({ message: "Profile pic is required" });
    }


    // 2. Upload new profile picture to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    console.log(uploadResponse);


    // 3. Update the user's profile picture in the database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }   
    );

    res.status(200).json(updatedUser);
    
  } 
  catch (error) {
    console.log("error in updateprofile", error.message);
    res.status(200).json({ message: "Internal server error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } 
  catch (error) {
    console.log("Error in checkAuth Controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
