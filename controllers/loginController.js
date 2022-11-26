const { connectToDb, getDb } = require("../config/dbconnection");
const config = require("../config");
const { response } = require("express");
const client = require("twilio")(config.accountSID, config.authToken);
const objectId = require("mongodb").ObjectId;

const Razorpay = require('razorpay');
const { resolve } = require("path");

var instance = new Razorpay({
  key_id: 'rzp_test_JfHGWPsG2YbN0R',
  key_secret: 'RTc3TnFafAc1EQsl1U6ayngO',
});





let db;
connectToDb(() => {
  db = getDb();
});

const loginValidation = (req, res) => {
  let { logmail, logpass } = req.body;
  console.log("validating login");
  console.log(req.body);
  if (logmail == "" || logpass == "") {
    res.render("login", { Message: "Input field cannot be empty*" });
  } else if (logmail) {
    password = logpass;
    email = logmail;
    db.collection("userdata")
      .findOne({ email: logmail })
      .then((ress) => {
        console.log("checking Blocked")
        if (ress.blocked) {
          console.log("This user is blocked")
          res.render("login", { blocked: "This User is blocked" });
        } else {


          console.log("checking exist");
          let data = ress;
          let passcheck = data.password;
          if (logpass == passcheck) {
            req.session.userloggedIn = true;
            req.session.user = ress;
            const userId = req.session.user._id
            console.log(req.session.user);
            db.collection("cart")
              .findOne({ user: objectId(userId) })
              .then((resolve) => {
                console.log(resolve, 'this is redllk')
                res.render("home", {name: data.firstname, id: data._id, cart: resolve });
              })
          } else {
            res.render("login", {
              Message: "Please Check Your Password",
              title: "password",
            });
          }
        }
      })
      .catch((rej) => {
        console.log("user doesn't exist");
        res.render("login", { title: "user doesn't exists" });
      });
  }
};


const checkforlogin = (req, res) => {
  if (req.session.userloggedIn) {
    const userId = req.session.user._id
    const products = db.collection("products")
    .find().toArray().then(() => {
      db.collection("cart")
        .findOne({ user: objectId(userId) })
        .then((resolve) => {
          console.log(resolve, 'this is redllk')
          console.log(products)
          res.render("home", { name : req.session.user.firstname, cart: resolve,products });
        })
      
    })
    .catch(() => {
      console.log("failed to load");
    })
  } else {
    res.render("home");
  }
};

const checkNumber = (req, res) => {
  console.log("suii");
  console.log(req.body);
};



const login = (req, res) => {
  if (req.session.userloggedIn) {
    let data = req.session.user
    console.log("hoiiiii");
    res.render("home", { name: data.firstname });
  } else {
    res.render("login");
  }
};

// const home = (req, res) => {
//   let cartCount = null
//   if (req.session.userloggedIn) {

//     let data = req.session.user
//     res.render("home", { name: data.firstname });
//   } else {
//     res.render("home");
//   }
// };

const category = (req, res) => {

  if (req.session.userloggedIn) {
    let data = req.session.user
    res.render("category", { name: data.firstname });
  } else {
    res.render("login");
  }



};

const wishlist = (req, res) => {
  if (req.session.userloggedIn) {
    let data = req.session.user
    res.render("wishlist", { name: data.firstname });
  } else {
    res.render("login");
  }
};

const contactus = (req, res) => {
  if (req.session.userloggedIn) {
    let data = req.session.user
    res.render("contactUs", { name: data.firstname });
  } else {
    res.render("login");
  }
};

const otp = (req, res) => {
  res.render("otpPage");
};

const userhome = (req, res) => {
  res.render("userhome");
};



const mobnum = (req, res) => {
  console.log(req.body);
  res.render("mobilenum");
};

const otpFn = (req, res) => {
  let phonenumber = req.body.phonenumber;
  console.log(req.body);
  db.collection("userdata")
    .findOne({ phonenumber: phonenumber })
    .then((response) => {
      console.log("response here");
      console.log(response);
      if (response) {
        console.log("otp working");
        client.verify
          .services(config.serviceID)
          .verifications.create({
            to: "+91" + req.body.phonenumber,
            channel: "sms",
          })
          .then((data) => {
            res.status(200).send(data);
            console.log("otp sent successfully");
          });
        req.session.phonenumber = phonenumber;
        res.render("otpPage", { phonenumber });
      } else {
        let noUser = true;
        res.redirect("/mobnum");
      }
    });
};

const verifyOtp = (req, res) => {
  return new Promise(async (resolve, reject) => {
    console.log(req.body.otpVal);
    let otpVal = req.body.otpVal;
    let OTP = "";
    otpVal.forEach((val) => {
      OTP += val;
    });
    let phonenumber = req.session.phonenumber;
    let user = req.session.user;
    var otpApproved;
    console.log(phonenumber);
    await client.verify
      .services(config.serviceID)
      .verificationChecks.create({
        to: "+91" + phonenumber,
        code: OTP,
      })
      .then((data) => {
        console.log(data);
        if (data.status == "approved") {
          otpApproved = true;
          console.log("Otp verified");
          req.session.userloggedIn = true;
          res.render("home", { name: data.firstname });
          // let user = req.session.user;
          // res.render("userhome",{user})
        } else {
          otpApproved = false;
          console.log("OTP error");
        }
        console.log(OTP);
      });
  });
};

//user profile/user edit

const userProfile = (req, res) => {
  const userId = req.url.slice(12)
  
console.log('heyyy');
  console.log(userId);
  if (req.session.userloggedIn) {
    db.collection('userdata').findOne({ _id: objectId(userId) })
      .then((resolve) => {
        res.render("userProfile", { name: resolve.firstname, resolve });
      })

    


  } else {
    res.render("login");

  }
}

const editUser = (req, res) => {
  const userId = req.query.id
  const { firstname, lastname, phonenumber, email } = req.body

  db.collection('userdata').updateOne({ _id: objectId(userId) }, {
    $set: {
      firstname: firstname,
      lastname: lastname,
      phnonenumber: phonenumber,
      email: email
    }
  }).then((resolve) => {
    //  db.collection('userdata').updateOne({_id:objectId(userId)})

    console.log(resolve);
    res.redirect("/userprofile:id")
  })


}

//add-to-cart
const addToCart = async (req, res) => {
  let proId = req.params.id;
  console.log(proId);
  let userId = req.session.user._id;
  let proObj = {
    item: objectId(proId),
    quantity: 1,                        ///-----> creating and object      
  };

  return new Promise(async (resolve, reject) => {
    let userCart = await db
      .collection("cart")
      .findOne({ user: objectId(userId) });

    ///------>if user cart exist true and the product exist, the increses product count   


    if (userCart) {
      let proExist = userCart.products.findIndex(
        (product) => product.item == proId
      );
      console.log(proExist,);
      if (proExist != -1) {

        //if -1 product not exist , if 0 product  exist in the 0th element in the array.
        db.collection("cart")

          .updateOne(
            { user: objectId(userId), "products.item": objectId(proId) },
            {
              $inc: { "products.$.quantity": 1 },
            }
          )
          .then(() => {
            resolve();
          });
      } else {
        db.collection("cart")
          .updateOne({ user: objectId }, { $push: { products: proObj } })


          ///---->if that product is not exist add that product. 

          .then((response) => {
            resolve();
          });
      }
    } else {
      let cartObj = {
        user: objectId(userId),
        products: [proObj],
      };
      db.collection("cart")           ///----->if user cart not exist, in create a new cart
        .insertOne(cartObj)
        .then((response) => {
          resolve();
        });
    }
    // res.redirect("/products");
    res.json({ status: true })
  });
};

const getCartProducts = (req, res) => {

  console.log('hellooo')
  return new Promise(async (resolve, reject) => {
    let userId = req.session.user._id;
    let cartItems = await db
      .collection("cart")
      .aggregate([
        {
          $match: { user: objectId(userId) },
        },
        {
          $unwind: '$products'
        },
        {
          $project: {
            items: '$products.item',
            quantity: '$products.quantity'
          }
        },
        {
          $lookup: {
            from: "products",
            localField: 'items',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $project: {
            item: 1,
            quantity: 1, product: { $arrayElemAt: ['$product', 0] }
          }
        }

      ])
      .toArray();

    let total = 0
    let grandTotal = 0
    console.log(cartItems);
    cartItems.forEach((x) => {
      total = (x.quantity) * (x.product.newPrice)
      console.log(total)
      grandTotal += total
    })
    let cartEmpty;
    if(cartItems.length == 0){
      cartEmpty =true
    }
    //   console.log(parseInt(grandTotal))
    res.render('cart', { cartItems: cartItems, grandTotal ,'cartempty': cartEmpty})
  });
};

const productDetails = (req, res) => {

  let prodId = (req.query.id)
  db.collection("products").findOne({ _id: objectId(prodId) })
    .then((response) => {

      res.render("productDetails", { response })
    })
}






const removeCartItems = (req, res) => {
  let userId = req.session.user._id
  let proId = req.params.id;
  console.log(proId);
  console.log(userId);
  return new Promise((resolve, reject) => {
    db.collection('cart').updateOne({ user: objectId(userId) },
      {
        $pull: { products: { item: objectId(proId) } }
      }).then((response) => {
        resolve(response)

        res.redirect("/cart")
      })
  })
}


const getCartCount = (req, res) => {

  return new Promise(async (resolve, reject) => {
    let userId = req.session.user._id
    let count
    let cart = await db.collection("cart").findOne({ user: objectId(userId) })
    if (cart) {
      count = cart.products.length
    }
    resolve(count)
  }
  )


  res.render("home", { Count })
}


const checkout =async (req, res) => {

  let userId = req.session.user._id;

   let userdata=await db.collection("userdata").findOne({_id:objectId(userId)})

   console.log(userdata);

  
    console.log('demooo');
  

  let value = req.body.totalPrice
  console.log(req.body);
  // if (req.session.userloggedIn) {
  let data = req.session.user
  res.render("checkout", { totalPrice: value , userdata});

};
const changeQuantity = async (req, res) => {

  const {
    cartId,
    prodId,
    quantity,
    count
  } = req.body

  if (count == -1 && quantity == 1) {

    let totalAmount = await getTotalAmount(cartId)
    res.json({ removeProduct: true, totalAmount })

  }

  else {
    db.collection('cart').updateOne({ _id: objectId(cartId), 'products.item': objectId(prodId) },
      {
        $inc: { "products.$.quantity": parseInt(count) }
      }
    ).then(async (response) => {
      let totalAmount = await getTotalAmount(cartId)
      res.json({ removeProduct: false, totalAmount })
      console.log(response);
    })
  }
}




const getTotalAmount = (cartId) => {

  console.log('hello')
  console.log(cartId)
  return new Promise(async (resolve, reject) => {
    prodata = await db.collection('cart').aggregate([{
      $match: { _id: objectId(cartId) }
    },
    {
      $unwind: '$products'
    },
    {
      $project: {
        item: '$products.item',
        quantity: '$products.quantity'
      }
    },
    {
      $lookup: {
        from: 'products',
        localField: 'item',
        foreignField: '_id',
        as: 'product'
      }

    },
    {
      $project: {
        item: 1,
        quantity: 1, product: { $arrayElemAt: ['$product', 0] }
      }
    }

    ]).toArray()

    console.log("black adam")
    console.log(prodata)
    let total = 0;
    let grandTotal = 0
    prodata.forEach((x) => {
      // console.log(x.quantity)
      // console.log(x.product.price)  
      total = (x.quantity) * (parseInt(x.product.newPrice))
      console.log(total)
      grandTotal += total
    })


    resolve(grandTotal)
  })
}



const placeOrder = (req, res) => {

  // if (req.session.userloggedIn) {
  return new Promise(async (resolve, reject) => {
    let userId = req.session.user._id;

    let cartItems = await db
      .collection("cart")
      .aggregate([
        {
          $match: { user: objectId(userId) },
        },
        {
          $unwind: '$products'
        },
        {
          $project: {
            items: '$products.item',
            quantity: '$products.quantity'
          }
        },
        {
          $lookup: {
            from: "products",
            localField: 'items',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $project: {
            item: 1,
            quantity: 1, product: { $arrayElemAt: ['$product', 0] }
          }
        }

      ])
      .toArray();
    console.log('komklmlk', cartItems, 'ijihhijhuji');
    console.log("qwerty");

    const { firstname,
      lastname,
      address,
      city,
      postcode,
      phonenumber,
      paymentmethod,
      country,
      state,
      email } = req.body
    console.log(req.body, 'thid');

    if (paymentmethod == "cod") {

      db.collection("orders").insertOne({
        userId: userId,
        products: cartItems,
        orderDetails: [{
          date: new Date(),
          firstname,
          lastname,
          address,
          city,
          postcode,
          phonenumber,
          paymentmethod,
          country,
          state,
          email,
        }]
      })

      res.render('orderSuccess')


    }
  })

}


const OrderSuccess = (req, res) => {
  return new Promise(async (resolve, reject) => {
    let userId = req.session.user._id;
    let products
    
   
    let date = new Date()

    let userDetails = await db
      .collection("userdata")
      .aggregate([
        {
          $match: { _id: objectId(userId) },
        }

      ])
      .toArray();
    db.collection('cart').findOne({ user: objectId(userId) }).then((resolve) => {
      products = resolve.products
      console.log('products', products);
      let firstname = userDetails[0].firstname,
        lastname = userDetails[0].lastname,
        address = userDetails[0].Details.address,
        city = userDetails[0].Details.city,
        postcode = userDetails[0].Details.postcode,
        phonenumber = userDetails[0].Details.phonenumber,
        paymentmethod = userDetails[0].Details.paymentmethod,
        country = userDetails[0].Details.country,
        state = userDetails[0].Details.state,
        email = userDetails[0].Details.email
      /*   console.log(req.body, 'thid'); */
      db.collection("orders").insertOne({
        userId: userId,
        status: 'placed',
        date: new Date(),
        month:date.getMonth(),
        products,
        orderDetails: [{
          firstname,
          lastname,
          address,
          city,
          postcode,
          phonenumber,
          paymentmethod,
          country,
          state,
          email,
        }]
      })
    })

    console.log("fsdgg", userDetails);


    console.log("added");
    res.render('orderSuccess')

  })
}









//add-to-wishlist
const addToWishlist = async (req, res) => {
  let proId = req.params.id;
  console.log(proId);
  let userId = req.session.user._id;


  let proObj = {
    item: objectId(proId)
    ///-----> creating and object      
  };

  return new Promise(async (resolve, reject) => {
    console.log("wishlist working")

    let userWishlist = await db
      .collection("Wishlist")
      .findOne({ user: objectId(userId) });

    ///------>if user wishlist exist true and the product exist, the increses product count   


    if (userWishlist) {
      let proExist = userWishlist.products.findIndex(
        (product) => product.item == proId
      );
      console.log(proExist,);
      if (proExist != -1) {
        db.collection("cart")

          .updateOne(
            { user: objectId(userId), "products.item": objectId(proId) },
            {
              $inc: { "products.$.quantity": 1 },
            }
          )
          .then(() => {
            resolve();
          });
      } else {

        //if -1 product not exist , if 0 product  exist in the 0th element in the array.

        db.collection("Wishlist")
          .updateOne({ user: objectId }, { $push: { products: proObj } })


          ///---->if that product is not exist add that product. 

          .then((response) => {
            resolve();
          });
      }
    } else {
      let wishlistObj = {
        user: objectId(userId),
        products: [proObj],
      };
      db.collection("Wishlist")           ///----->if user cart not exist, in create a new cart
        .insertOne(wishlistObj)
        .then((response) => {
          resolve();
        });
    }

  });
};



const getWishList = async (req, res) => {

  console.log('getting wishlist')
  let userId = req.session.user._id;
  let wishlistItems = await db
    .collection("Wishlist")
    .aggregate([
      {
        $match: { user: objectId(userId) },
      },
      {
        $unwind: '$products'
      },
      {
        $project: {
          item: '$products.item',
          quantity: '$products.quantity'
        }
      },
      {
        $lookup: {
          from: "products",
          localField: 'item',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $project: {
          item: 1, product: { $arrayElemAt: ['$product', 0] }
        }
      }

    ])
    .toArray();

  console.log(wishlistItems);




  res.render('wishlist', { wishlistItems })
};




const orderManagement = (req, res) => {

  let userId = req.session.user._id

  return new Promise(async (resolve, reject) => {
    console.log(userId);
    let orders = await db.collection('orders').find({ userId:userId }).toArray()
    
    console.log('orders is',orders);
    res.render('OrderManagement',{orders})
})

 


  // let userid = req.session.user._id
  // console.log(userid);
  // let prd = []
  // db.collection('orders').find({ userId: { $eq: userid } })
  //   .forEach(userId => prd.push(userId))
  //   .then((response) => {
  //     console.log("jnjjnj", prd);
  //     console.log('hello')
  //       ;
  //     // console.log("cxzzv",response[0].userId);
  //     let orderItems = db.collection('orders').aggregate([
  //       {
  //         $match: { _id: objectId(orderId) }
  //       },
  //       {
  //         $unwind: '$products'
  //       },
  //       {
  //         $project: {
  //           item: '$products.item',
  //           quantity: '$products.quantity'
  //         }
  //       },
  //       {
  //         $lookup: {
  //           from: product,
  //           localField: 'item',
  //           foreignField: '_id',
  //           as: 'product'
  //         }
  //       },
  //       {
  //         $project: {
  //           item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
  //         }
  //       }
  //     ]).toArray()
  //     console.log('productdetails', orderitems);
  //     res.render("orderManagement", { prd })
  //   })





  // console.log('ordered items')
  // console.log(orderItems)



}









const cancelOrder = (req, res) => {
  let id = req.query.id
  console.log('cancelled');
  console.log(id);

  db.collection('orders').updateOne({ _id: objectId(id) }, { $set: { status: "cancelled" } })
    .then((response) => {

      res.redirect('/orders')
      console.log('cancelorder', response);
    })
}











const payment = (req, res) => {
  let paymmentmethod = req.body.paymentmethod
  console.log(paymmentmethod);
  if (paymmentmethod == 'cod') {

    console.log("cod succss");
    res.json({ status: 'false' })
  } else {
    console.log("total", req.body.total)

    let price = req.body.total
    let userId = req.session.user._id
    var options = {
      amount: price * 100,
      currency: "INR",
      receipt: "" + userId
    };
    instance.orders.create(options, function (err, order) {

      console.log("ghbhgbhg", order, paymmentmethod);
      res.json({ order, status: 'true' })
    })
  }

}

const verifypayment = (req, res) => {
  console.log("verify", req.body)
  let paymentDetails = req.body
  console.log();

  const crypto = require('crypto');
  let hmac = crypto.createHmac('sha256', 'RTc3TnFafAc1EQsl1U6ayngO')
  hmac.update(paymentDetails.payment.razorpay_order_id + '|' + paymentDetails.payment.razorpay_payment_id)
  hmac = hmac.digest('hex')
  if (hmac == paymentDetails.payment.razorpay_signature) {
    console.log("payment success");
    res.json(hmac)
  } else {
    rejects()
  }
}
const successPage = (req, res) => {
  res.render('thanks')
}

const offerApply = (req, res) => {
  let userId = req.session.user._id
  let Code = req.body.code
  let price = parseInt(req.body.price)
  let discount
  console.log(req.body);
  let coupons
  console.log("1");
  db.collection('Coupons').findOne({ _id: objectId(Code) })
    .then((response) => {
      discount = price - response.Discount

      db.collection('userdata').updateOne({ _id: objectId(userId) }, { $set: { coupons: Code } }).then(() => {
        console.log('inserted successfully');
        res.json({ discount })
      })

    })
}

const mensOnly=(req,res)=>{
  return new Promise(async(resolve,reject)=>{
    const userId = req.session.user._id
    let products = await db.collection('products').find({category:'Mens'}).toArray()
    db.collection("cart").findOne({ user: objectId(userId) }).then((resolve) => {
          console.log(resolve, 'this is redllk')
          res.render("products", { products, cart: resolve});
        })
  })
}

const womensOnly=(req,res)=>{
  return new Promise(async(resolve,reject)=>{
    const userId = req.session.user._id
    let products = await db.collection('products').find({category:'Womens'}).toArray()
    db.collection("cart").findOne({ user: objectId(userId) }).then((resolve) => {
          console.log(resolve, 'this is redllk')
          res.render("products", { products, cart: resolve});
        })
  })
}

const kidsOnly=(req,res)=>{
  return new Promise(async(resolve,reject)=>{
    const userId = req.session.user._id
    let products = await db.collection('products').find({category:'Kids'}).toArray()
    db.collection("cart").findOne({ user: objectId(userId) }).then((resolve) => {
          console.log(resolve, 'this is redllk')
          res.render("products", { products, cart: resolve});
        })
  })
}


const editprofile=(req,res)=>{

  let firstname=req.body.firstname
  let lastname=req.body.lastname
  let phone=req.body.mobilenumber
  let postcode=req.body.postcode
  let state=req.body.state
  let address=req.body.address
  let country=req.body.country

  let userId=req.session.user._id

  console.log(firstname,address,lastname,phone,postcode,state,country);
  db.collection("userdata").updateOne({_id:objectId(userId)},{$set:{
    firstname:firstname,
   lastname:lastname,
   phonenumber:phone,
   postcode:postcode,
   state:state,
   address:address,
   county:country
  
  }})
  
  .then((response)=>{
    console.log(response);
  })

}

const search=async(req,res)=>{
  console.log('searching');
  const userId = req.session.user._id
  let search=req.body.search
  console.log(search);
  return new Promise(async (resolve, reject) => {
    await db.collection("cart")
        .findOne({ user: objectId(userId) })
    try {
        
        await db.collection('products').createIndex({ Name: "text", category: "text" }).then((response) => {
            new Promise(async (resolve, reject) => {
               let products = await db.collection('products').find({ $text: { $search: search } }, { score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" } }).toArray()
                console.log(products)
                resolve(products)
            }).then((products) => {
                if (products == "") {
                    console.log("products are null")
                }else{
                  console.log(products)
                  res.render("products", { products});
                  resolve(products)
                }
            })
        })
    } catch {
      console.log("Error occured")
        response.status(400).send({ sucess: false })
        
    }
})
}


const logout=(req,res)=>{
  req.session.destroy();
  res.redirect('/')
}



  














module.exports = {
  loginValidation,
  checkforlogin,
  checkNumber,
  login,
  // home,
  userProfile,
  category,
  wishlist,
  contactus,
  otp,
  userhome,
  otpFn,
  verifyOtp,
  mobnum,
  addToCart,
  getCartProducts,
  productDetails,
  editUser,
  removeCartItems,
  getCartCount,
  checkout,
  changeQuantity,
  getTotalAmount,
  placeOrder,
  OrderSuccess,
  orderManagement,
  addToWishlist,
  getWishList,
  cancelOrder,
  payment,
  verifypayment,
  offerApply,
  mensOnly,
  womensOnly,
  kidsOnly,
  editprofile,
  search,
  logout

}
