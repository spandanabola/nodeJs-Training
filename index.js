//const PORT=8080;
var express = require("express");
var bodyParser = require("body-parser");
var path = require("path");
var mainRouter = require("./routes/route.js");
var apiRouter = require("./routes/api.js");
// var session=require("express-session");
var mongoose = require("mongoose");
 mongoose.Promise = require("bluebird");
var app = express();
var port = process.env.PORT || 8009;
var session = require("express-session");
var schedule = require('./services/scheduler');
//var RedisStore = require("connect-redis")(session)

app.use(session({
// store:new RedisStore({
//     url:"redis://localhost:6379"
// }),
secret:"123",
resave: false,
saveUninitialized:false
}))
//app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/", mainRouter);
app.use("/api", apiRouter);



// var schedule = require('node-schedule');
// var rule = new schedule.RecurrenceRule();
// rule.minute = new schedule.Range(0, 59, 1);
// var intMail = schedule.scheduleJob(rule, function(){
//     console.log(rule);
//       console.log('its run');
// });

// app.use(session({secret:'hello',
//                     cookie: { maxAge: 50 * 1000 },
//                     proxy: true,
//                  saveUninitialized:true, 
//                  resave:true}))
// var xoauth2 = require('xoauth2');
//         var nodemailer = require('nodemailer');
//         var smtpTransport = require('nodemailer-smtp-transport');

// app.set(process.env.MAIL_URL='smtp://test.nodemailer%40gmail.com:' + encodeURIComponent("Nodemailer123") + '@smtp.gmail.com:465')

app.set("views", __dirname + "/client/src/Registration-Login/views");
app.set("view engine", "ejs");
app.engine("html", require("ejs").renderFile);
app.use(express.static(__dirname + "/client"));

mongoose.connect("mongodb://localhost/SampleDB").then(() => {
    var db = mongoose.connection.db;
    console.log("database connected to " + db.databaseName);
    schedule.serverScheduler();
}, (err) => {
    console.log(err);
});


app.listen(port, () => {
    console.log("sever running on port " + port);
});

app.use(function(err,req,res,next){
    res.status(err.status||500);
    res.send(err.message);
})
module.exports = app; 