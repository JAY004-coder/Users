var express = require('express');
var nodemailer = require('nodemailer');
var jwt = require('jsonwebtoken');
var moment = require('moment')
const { body, validationResult } = require('express-validator');
var router = express.Router();
// jwt.decode(token[1]).specifier == "Login"
var encryption = require("./encryption");
var Authentication = require("./auth")
var db = require("../models");


var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'jay@yopmail.com', // here use your real email
    pass: '123'// put your password correctly (not in this question please)
  }
});

const Emailvalidation = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const passvalidation = "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})"

// User Registration
// localhost:8888/Registration
// {
//   "email":"jayb@gmail.com",
//   "password":"Jayss15@",
//   "confirm_password":"Jayss15@",
//   "role_id":"60af962c6b7bd3fdf7fe74a4"
// }
router.post("/Registration", async (req, res, next) => {
  try {

    if (!req.body.email) {
      res.json({ 'res': '0', 'data': "Please enter proper email address." })
    } else if (!Emailvalidation.test(req.body.email)) {
      res.json({ 'res': '0', 'data': "Invalid email address." })
    } else if (!req.body.password.match(passvalidation)) {
      res.json({ 'res': '0', 'data': "Password must be atlest one number one special character and one capital letter." })
    } else if (req.body.password != req.body.confirm_password) {
      res.json({ 'res': '0', 'msg': "Password and confirm password not same." })
    } else if (!req.body.role_id) {
      res.json({ 'res': '0', 'msg': "Please enter role" })
    } else {
      var obj = {
        email: req.body.email,
        password: encryption.Encrypt(req.body.password),
        name: req.body.name,
        role_id: req.body.role_id,
        is_active: 0
      }
      var user_available = await db.users.findOne({ email: req.body.email })
      if (!user_available) {
        var user_data = await db.users.create(obj);
        var token = jwt.sign({ "user_id": user_data.id, "identifier": "user identifier", 'time': moment(new Date()).format('YYYY-MM-DD HH:mm:ss') }, process.env.Jwt_token);
        var mailOptions = {
          to: req.body.email,
          subject: 'Email Verification',
          html: '<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8" /></head><body>Please <a href="http://localhost:8888/ActiveUser/' + token + '">Click here </a> for active user.</body></html>'
        };
        var sendEmailData = await transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log({ Response: false, Message: error, Data: null });
          } else {
            console.log({ Response: true, Message: "Register Successfully.", Data: userData });
          }
        });
        res.json({ 'res': '1', 'msg': "User has been register successfully." })
      } else {
        res.json({ 'res': '0', 'msg': "User is already register." })
      }

    }

  } catch (err) {
    res.json({ 'res': '0', 'msg': err });
  }
});

// Active user
router.get("/ActiveUser/:token", async (req, res, next) => {
  try {
    var data = jwt.verify(req.params.token, process.env.Jwt_token);
    if (data.identifier == "user identifier") {
      var user_id = data.user_id
      var token_create_time = moment(new Date(data.time)).format('YYYY-MM-DDTHH:mm:ss');
      var current_time = moment(new Date()).format('YYYY-MM-DDTHH:mm:ss')
      if (moment(current_time).diff(moment(token_create_time), 'minutes') < 10) {
        var user_data = await db.users.updateOne({ _id: user_id }, { $set: { is_active: 1 } });
        res.json({ 'res': '1', 'msg': "user has been active successfully." })
      } else {
        res.json({ 'res': '0', 'msg': "Token has been expire." })
      }

    } else {
      res.json({ 'res': '0', 'data': "invalid user" })
    }
  } catch (err) {
    res.json({ 'res': '0', 'msg': err });
  }
});

// Login
// localhost:8888/Login
// {
//   "email":"jayb@gmail.com",
//   "password":"Jayss15@"
// }
router.post("/Login", async (req, res, next) => {
  try {
    if (!req.body.email) {
      res.json({ 'res': '0', 'data': "Please enter proper email address." })
    } else if (!req.body.password) {
      res.json({ 'res': '0', 'data': "Please enter password." })
    } else {
      var user_data = await db.users.findOne({ email: req.body.email, is_active: 1 });
      if (user_data) {
        if (req.body.password == encryption.Decrypt(user_data.password)) {
          var access_token = jwt.sign({ "user_id": user_data._id, "identifier": "Login" }, process.env.Jwt_token, {
            expiresIn: "48h"
          });
          var refresh_token = jwt.sign({ "user_id": user_data._id, "identifier": "Login" }, process.env.Jwt_token, {
            expiresIn: '365d'
          });
          res.json({ 'res': '1', 'msg': 'Success', 'token': { "access_token": access_token, "refresh_token": refresh_token } })
        } else {
          res.json({ 'res': '0', 'msg': "Invalid password" });
        }
      } else {
        res.json({ 'res': '0', 'msg': "Invalid user name" });
      }
    }
  } catch (err) {
    res.json({ 'res': '0', 'msg': err });
  }
});

// Get user data
// localhost:8888/GetUserData
// Authorization : Bearer accesstoken
router.get("/GetUserData", Authentication, async (req, res, next) => {
  try {
    var user_data = await db.users.find({ _id: { $ne: req.body.user_id } }).populate({ path: 'user_role' })
    res.json({ 'res': '1', 'msg': "Success", 'data': user_data })
  } catch (err) {
    res.json({ 'res': '0', 'msg': err });
  }
})
module.exports = router;

