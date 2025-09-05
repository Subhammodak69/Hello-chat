import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

//Signup a new user

export const signup = async (req, res)=>{
    const { fullName, email, password, bio } = req.body;

    try {
        if (!fullName || !email || !password || !bio){
            return res.json({success: false, message: "Missing Details"})
        }
        const user = await User.findOne({email});
        if (user){
            return res.json({success: false, message: "Account already exists"})
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            fullName, email, password: hashedPassword, bio
        });
        const token = generateToken(newUser._id)

        res.json({success: true, userData: newUser, token, message: "Account Created Successfully."})
    } catch (error) {
        res.json({ success: false, message: error.message }); 
    }
}


// Controller to login a user

export const login = async (req, res) =>{
    try{
        const { email, password } = req.body;
        const userData = await User.findOne({email})
        if (!userData){
            res.json({success:false, message: "User not Found"})
        } 

        const isPasswordCorrect = await bcrypt.compare(password, userData.password);
        if (!isPasswordCorrect){
            res.json({success: false, message: "Invalid Password."}) 
        }

        const token = generateToken(newUser._id)

        res.json({success: true, userData: newUser, token, message: "Login Successfully."})

    } catch (error) {
        res.json({success: false, message: "Account Created Successfully."}) 
    }
}

//Controller to check id User is Authenticated

export const checkAuth = (req,res)=>{
    res.json({success:true, user: req.user});
}


//Controller to update user profile details

export const updateProfile = async (req, res) => {
  try {
    const { profilePic, fullName, bio } = req.body;

    // Assign userId once here
    const userId = req.user._id;

    let updatedUser;
    if (!profilePic) {
      updatedUser = await User.findByIdAndUpdate(userId, { bio, fullName }, { new: true });
    } else {
      const upload = await cloudinary.uploader.upload(profilePic);
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { profilePic: upload.secure_url, bio, fullName },
        { new: true }
      );
    }

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
