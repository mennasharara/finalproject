const port =4000;
const express=require("express");
const app=express();
const mongoose=require("mongoose");
const jwt=require("jsonwebtoken");
const multer=require("multer");
const path=require("path");
const cors=require("cors");
app.use(express.json());
app.use(cors());
//database connection with MongoDB
mongoose.connect("mongodb+srv://mennasharara151:My5sisters@cluster0.ylsbhmo.mongodb.net/Ecommerce");
//API creation





app.get("/",(req,res)=>{
    res.send("Express App is Running")

})
//Image storage engine
const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, './upload/images');
      },
      filename: (req, file, cb) => {
        cb(null, file.originalname);
      }
    })
  });

//creating upload endpoint for images
app.use("./images",express.static("upload/images"))
app.post("/upload",upload.single("product"),(req,res)=>{
    res.json({
        success:1,
        image_url:`http://localhost:${port}/images/${req.file.filename}`
    })
})
//schema for creating products
const Product =mongoose.model("Product",{
    id:{
        type:Number,
        required:true,
    },
    name:{
        type:String,
        required:true,
    },
    image:{
        type:String,
        required:true,
    },
    category:{
        type:String,
        required:true,
    },
    new_price:{
        type:Number,
        required:true,
    },
    old_price:{
        type:Number,
        required:true,
    },
    date:{
        type:Date,
        default:Date.now
    },
    available:{
        type:Boolean,
        default:true,
    },
})
app.post('/addproduct', async (req, res) => {
    try {
      const product = new Product(req.body);
      await product.save();
      res.json({ success: true, message: 'Product added successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Error adding product' });
    }
    console.log('Finished processing addproduct request');
  });
//creating APIfor deleting products
app.post("/removeproduct",async(req,res)=>{
    await Product.findOneAndDelete({id:req.body.id});
    console.log("Removed");
    res.json({
        success:true,
        name:req.body.name
    })
})
//creating API for getting all products
app.get("/allproducts",async(req,res)=>{
    let products=await Product.find({});
    console.log("All Products Fetched");
    res.send(products);
    

})
//schema  creating for User Model
const Users=mongoose.model("Users",{
    name:{
        type:String,
    },
    email:{
        type:String,
        unique:true,
    },
    password:{
        type:String,
    },
    cartData:{
        type:Object,
    },
    date:{
         type:Date,
         default:Date.now,
    }

})
//creating endpoint for Registering the user
app.post("/signup",async(req,res)=>{
    let check=await Users.findOne({email:req.body.email});
    if(check){
       return res.status(400).json({success:false,errors:"existing user found with same email address"})
    }
    let cart={};
    for(let i=0;i<300;i++){
        cart[i]=0;
    }
    const user=new Users({
        name:req.body.username,
        email:req.body.email,
        password:req.body.password,
        cartData:cart,
    })
    await user.save();
    const data={
        user:{
            id:user.id
        }
    }
    const token=jwt.sign(data,"secret_ecom");
    res.json({success:true,token})
})
//creating endpoint for user login
app.post("/login",async(req,res)=>{
    let user=await Users.findOne({email:req.body.email});
    if(user){
        const passCompare=req.body.password===user.password;
        if(passCompare){
           const data={
                user:{
                    id:user.id
                }
           }
           const token=jwt.sign(data,"secret_ecom");
           res.json({success:true,token});
        }
        else{
            res.json({success:false,errors:"Wrong Password"});
        }
    }
    else{
        res.json({success:false,errors:"Wrong Email ID"});
    }
})
//creating endpoint for newcollection data
app.get("/newcollections",async(req,res)=>{
    let products=await Product.find({});
    let newcollection=products.slice(1).slice(-8);
    console.log("NewCollection Fetched");
    res.send(newcollection);
})
//creating endpoint for popular in women section
app.get("/popularinwomen",async(req,res)=>{
   let products=await Product.find({category:"women"});
   let popular_in_women=products.slice(0,4);
   console.log("Popular in women fetched");
   res.send(popular_in_women);
})
//creating middelware to fetch user
   const fetchUser=async(req,res,next)=>{
       const token=req.headers("auth-token");
       if(!token){
         res.status(401).send({errors:"Please authenticate using valid token"})
       }
       else{
         try{
            const data=jwt.verify(token,"secret_ecom");
            req.user=data.user;
            next();
         }catch(error){
           res.status(401).send({errors:"please authenticate using a valid token"})
         }
       }
   }
//creating endpoint for adding products in cartdata
app.post("/addtocart", fetchUser, async(req,res)=>{
  console.log("Added",req.body.itemId);
  let userData=await Users.findOne({_id:req.user.id});
  userData.cartData[req.body.itemId]+=1;
  await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData});
  res.send("Added")
})
//creating endpoint to remove product from cartdata
app.post("/removefromcart",fetchUser,async(req,res)=>{
    console.log("removed",req.body.itemId);
    let userData=await Users.findOne({_id:req.user.id});
    if(userData.cartData[req.body.itemId]>0)
    userData.cartData[req.body.itemId]-=1;
    await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData});
    res.send("Removed")
})
//creating endpoint to get cartdata
app.post("/getcart",fetchUser,async(req,res)=>{
    console.log("GetCart");
    let userData=await Users.findOne({_id:req.user.id});
    res.json(userData.cartData);
})
app.listen(port,(error)=>{
    if(!error){
        console.log("Server  Running on Port"+port)
    }
    else
    {
        console.log("Error:"+error)
    }
})
