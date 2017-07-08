var nodemailer = require('nodemailer');
var schedule = require('node-schedule');
var fetch = require('node-fetch');
var handlebars = require('handlebars');
const mongoose = require("mongoose");

const httpProxyAgent = require('http-proxy-agent');
const agent = new httpProxyAgent("http://cis-india-pitc-bangalorez.proxy.corporate.ge.com:80");

var fs = require('fs');

var ejs = require('ejs');

function sendMail(name,app) {

    console.log("inside sendMail");
    
    const template = './services/email.ejs';


    var readHTMLFile = function (template, callback) {
        fs.readFile(template, { encoding: 'utf-8' }, function (err, html) {
            if (err) {
                throw err;
                callback(err);
            }
            else {
                callback(null, html);
            }
        });
    };

    var transport = nodemailer.createTransport({
        host: 'smtp.geips.ge.com',
        port: 25
    });
   
    var errors = [];
    for (var i = 0; i < app.test_suites.length; i++) {
        if (app.test_suites[i].status === "Failed") {
            errors.push({ "url": app.test_suites[i].url, "message": app.test_suites[i].statusMsg[(app.test_suites[i].statusMsg.length)-1].message });
            //errors = errors + "****" + app.test_suites[i].url + "----" + app.test_suites[i].error
            //app.test_suites[i].error[(app.test_suites[i].error.length) - 1].message 
        } else {
            continue;
        }
    }

    readHTMLFile(template, function (err, html) {
        
        var template = handlebars.compile(html);
        var replacements = {
            appname: name,
            suitename: app.suiteName
        };
        var htmlToSend = template(replacements);

        var mdata = "<h1>Errors</h1>"
        mdata += "<ul>"
        for (var i = 0; i < errors.length; i++) {
            mdata += "<li>URL: " + errors[i].url + "--- Error: "
            mdata += errors[i].message + "</li>"
        }
        mdata += "</ul>";
        //var smtpTransport = require('nodemailer-smtp-transport');
        //process.env.MAIL_URL='smtp://:' + encodeURIComponent("Nodemailer123") + '@smtp.geips.ge.com:25';

        // ejs.renderFile(template, 'utf8', (err, html) => {
        //     if (err) console.log(err); // Handle error

        //     console.log(`HTML: ${html}`);

        var message = {

            // sender info
            from: 'spanadana.bola@capgemini.com',

            // Comma separated list of recipients
            to: app.to,
            cc: app.cc,
            bcc: app.bcc,
            // Subject of the message
            subject: 'Info regarding Test suite failure',

            // plaintext body

            // HTML body
            html: `${htmlToSend}+${mdata}`
        };



        console.log('Sending Mail');


        console.log('SMTP Configured');
        if (name != "") {
            transport.sendMail(message, function (error) {
                if (error) {
                    console.log('Error occured');
                    console.log(error.message);
                    return;
                }
                console.log('Message sent successfully!');

                // if you don't want to use this transport object anymore, uncomment following line
                //transport.close(); // close the connection pool
            });
        }


    });
    // Message object

}
function getAppName(app){
        
    //console.log(req.params.id)
    // ses.id=1;
    var appName = "";
    var getClientApps = require('../models/client.js');
    var GetClientApp = mongoose.model('clients', getClientApps);
  
    
    GetClientApp.findOne({ "_id": app.appId }, (err, docs) => {
        if (!err) {
            //console.log(docs);

            console.log(docs.title);
            appName = docs.title;
            if(appName!=null || appName!=""){
                 console.log("connection closed in sendMail");
                 sendMail(appName,app);
            }
            
           

        } else {
            //db.close();
            //res.json({ error: err });
            console.log(err);
        }
    });
}

function saveTest(app) {
    var testSuites = require('../models/testSuites.js');
    var TestSuite = mongoose.model('testsuites', testSuites);
        console.log("inside saveTest");
        console.log(app.test_suites);
        
        TestSuite.update({ '_id': app._id }, { $set: { 'test_suites': app.test_suites } }, function (err, doc) {
            if (!err) {
                    for (var i = 0; i < app.test_suites.length; i++) {
                        if (app.test_suites[i].status === "Failed") {

                            console.log("inside for loop");
                            console.log("stored successfully");
                            getAppName(app);
                            break;
                        }else{
                            continue;
                        }
                    }


            } else {
                db.close();
                console.log("error occured" + err);
            }

        })
}
function tokenGenerated(appname, callback){
    var info={};
     var getApps = require('../models/client.js');
            var GetApp = mongoose.model('clients', getApps);


            GetApp.findOne({ "_id": appname }, (err, doc) => {
                if (err) {
                    //console.log(docs);
                    // info = {
                    //     stat: false,
                    //     msg: err
                    // }
                    callback(err);
                    //return info;
                    // res.send(info);
                    // res.end();
                } else {
                    if (doc != null) {
                        var url = 'https://fssfed.stage.ge.com/fss/as/token.oauth2?grant_type=' + doc.grantType + '&client_id=' + doc.clientId + '&client_secret=' + doc.clientSecret + '&scope=' + doc.scope;
                        console.log(url);
                        fetch(url, { method: "POST" })
                            .then(function successCallback(response) {
                                
                             
                                return response.json();

                            }).then(function(response){
                                //  let info = {
                                //     stat: true,
                                //     token: response.access_token
                                // }
                                console.log(response.access_token);
                                callback(response.access_token);


                               //return info.token;
                                // res.send(info);
                                // res.end();
                            })
                            .catch(function errorCallback(err) {   
                                next(err)
                            });
                        
                    }
                    //res.json({ error: err });
                   
                };
                
            });
            // if(info.token!=undefined || info.token!=null){
            //     return info;
            // }       
}

// tokenGenerated('appname',function(response){
//         console.log(response);
//         return response;
// });

//data.url, { method: data.selectedReqType, body: data.body, headers: jsonHeader }
// function Hello(){
//     tokenGenerated("5959fd601722120ad46689b5",function(response){
//         console.log("atxxxx",response);
// });
// }
// Hello();
function fetching(data,app){
        console.log(data);
    console.log("url " + data.url);
    var req=data.url.substring(0,5);
    console.log(req);
    if(req=="https"){
        console.log("https");
    }else if(req=="http:"){
        console.log("http");
    }else{

    }
    console.log(JSON.parse(data.header));
    fetch(data.url, { method: data.selectedReqType, body: data.body, headers: JSON.parse(data.header) })
        .then(function successCallback(response) {
            console.log("inside success hitapi");
            console.log(response.status);
            console.log("success");
            
            // $scope.showData[counter].responseTime[0].endTime = new Date().getTime();
            app.test_suites[counter].responseTime.push({ "startTime": app.test_suites[counter].startTime, "endTime": new Date().getTime() });
            app.test_suites[counter].status = "Successfull";
            app.test_suites[counter].statusMsg.push({"time":new Date(),"message":"Successfull"});
            //app.test_suites[counter].success.push({ "time": new Date(), "message": "Sucessfully running" });
            console.log("Start Time - ", app.test_suites[counter].responseTime[0].startTime);
            console.log("End Time - ", app.test_suites[counter].responseTime[0].endTime);
            console.log("Response Time - ", app.test_suites[counter].responseTime[0].endTime - app.test_suites[counter].responseTime[0].startTime);
            counter = counter + 1;
            if (counter < app.test_suites.length) {
                app.test_suites[counter].startTime = new Date().getTime();
                hitApi(app.test_suites[counter], app);
            } else {
                //server store
                saveTest(app);

            }


        })
        .catch(function errorCallback(err) {
            console.log("inside failure hitapi");
            app.test_suites[counter].responseTime.push({ "startTime": app.test_suites[counter].startTime, "endTime": new Date().getTime() });
            app.test_suites[counter].status = "Failed";
            app.test_suites[counter].statusMsg.push({"time":new Date(),"message":err});
            counter = counter + 1;
            if (counter < app.test_suites.length) {
                app.test_suites[counter].startTime = new Date().getTime();
                hitApi(app.test_suites[counter], app);
            } else {

                saveTest(app);
            }
        });
}
function hitApi(data, app) {
    var jsonHeader={};
    if(data.oauthFilter){
        tokenGenerated(app.appId,function(response){
        console.log("at",response);
         jsonHeader = JSON.parse(data.header);
        jsonHeader.Authorization="Bearer "+response;
        data.header=JSON.stringify(jsonHeader);
        console.log(data.header);
        console.log(jsonHeader);
        fetching(data,app);
});
    }else{
        fetching(data,app);
    }
    //var jsonHeader = JSON.parse(data.header);
        
    
    
}
function testApi(data, app) {
    counter = 0;
    console.log("inside testApi");
    data[0].startTime = new Date().getTime();
    hitApi(data[0], app);

}


module.exports = {

    scheduler: function (data) {
        console.log(data);
        console.log(data.suiteName + "started");
        schedule.scheduleJob(data.suiteName, data.frequency, function () {
            console.log(schedule.scheduledJobs[data.suiteName]);
           testApi(data.test_suites, data);

        });
    },
    serverScheduler: function(){
        var getTestSuites = require('../models/testSuites.js');
        var GetTestSuite = mongoose.model('testsuites', getTestSuites);
        GetTestSuite.find({ "isScheduled": true }, (err, docs) => {
            if (err) {

                 info = {
                    stat: false,
                    msg: err
                }
                console.log(err);
                //console.log(docs);
                
            } else {
                //res.json({ error: err });
               for (var i = 0; i < docs.length; i++) {
                    console.log("scheduler started");
                     this.scheduler(docs[i]);
                }
                info = {
                    stat: true
                }
                console.log(docs);
            };
        });
    },
    sendOTPMail: function (email,number) {

    console.log("inside sendMail");
    
    const template = './services/otpMail.ejs';


    var readHTMLFile = function (template, callback) {
        fs.readFile(template, { encoding: 'utf-8' }, function (err, html) {
            if (err) {
                throw err;
                callback(err);
            }
            else {
                callback(null, html);
            }
        });
    };

    var transport = nodemailer.createTransport({
        host: 'smtp.geips.ge.com',
        port: 25
    });
   

    readHTMLFile(template, function (err, html) {
        
        var template = handlebars.compile(html);
        var replacements = {
            otp: number
        };
        var htmlToSend = template(replacements);

        //var smtpTransport = require('nodemailer-smtp-transport');
        //process.env.MAIL_URL='smtp://:' + encodeURIComponent("Nodemailer123") + '@smtp.geips.ge.com:25';

        // ejs.renderFile(template, 'utf8', (err, html) => {
        //     if (err) console.log(err); // Handle error

        //     console.log(`HTML: ${html}`);

        var message = {

            // sender info
            from: 'spanadana.bola@capgemini.com',

            // Comma separated list of recipients
            to: email,
            // Subject of the message
            subject: 'Your OTP Number',

            // plaintext body

            // HTML body
            html: `${htmlToSend}`
        };



        console.log('Sending Mail');


        console.log('SMTP Configured');
            transport.sendMail(message, function (error) {
                if (error) {
                    console.log('Error occured');
                    console.log(error.message);
                    return;
                }
                console.log('Message sent successfully!');

                // if you don't want to use this transport object anymore, uncomment following line
                //transport.close(); // close the connection pool
            });
        }


   );
    // Message object

}

//     },
//     tokenGenerate:function(appname,callback){
//          var info={};
//      var getApps = require('../models/client.js');
//             var GetApp = mongoose.model('clients', getApps);


//             GetApp.findOne({ "_id": appname }, (err, doc) => {
//                 if (err) {
//                     //console.log(docs);
//                     // info = {
//                     //     stat: false,
//                     //     msg: err
//                     // }
//                     callback(err);
//                     //return info;
//                     // res.send(info);
//                     // res.end();
//                 } else {
//                     if (doc != null) {
//                         var url = 'https://fssfed.stage.ge.com/fss/as/token.oauth2?grant_type=' + doc.grantType + '&client_id=' + doc.clientId + '&client_secret=' + doc.clientSecret + '&scope=' + doc.scope;
//                         console.log(url);
//                         fetch(url, { method: "POST" })
//                             .then(function successCallback(response) {
                                
                             
//                                 return response.json();

//                             }).then(function(response){
//                                 //  let info = {
//                                 //     stat: true,
//                                 //     token: response.access_token
//                                 // }
//                                 console.log(response.access_token);
//                                 callback(response.access_token);


//                                //return info.token;
//                                 // res.send(info);
//                                 // res.end();
//                             })
//                             .catch(function errorCallback(err) {   
//                                 next(err)
//                             });
                        
//                     }
//                     //res.json({ error: err });
                   
//                 };
                
//             });
// }
}