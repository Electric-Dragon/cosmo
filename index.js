const { v4: uuidv4 } = require('uuid');
require('dotenv').config()
const express = require("express");
const https = require("https");
const path = require('path');
const app = express();
const port = 5050;
const {RtcTokenBuilder, RtcRole} = require('agora-access-token')

app.use(express.static(path.join(__dirname + '/public')));
app.use(express.urlencoded({extended:true}));


app.get("/", function(req, res) {
  res.sendFile(__dirname + "/public/html/home.html");
});

app.get("/call/:channel", function(req, res) {
  res.sendFile(__dirname + "/public/html/call.html");
});

app.get("/home", function(req, res) {
  res.sendFile(__dirname + "/public/html/home.html");
});

app.post("/getToken", function(req, res) {
  var channel = req.body.channel

  const appID = process.env.APP_ID;
  const appCertificate = process.env.APP_CERTIF
  const channelName = channel;
  const uid = 0;
  const role = RtcRole.PUBLISHER;
  const expirationTimeInSeconds = 7200
  const currentTimestamp = Math.floor(Date.now() / 1000)
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds

  const token = RtcTokenBuilder.buildTokenWithUid(appID, appCertificate, channelName, uid, role, privilegeExpiredTs);

  res.json({token: token, appID: process.env.APP_ID})
  
});

app.get("/create", function(req, res) {
  var uuid = uuidv4();
  res.redirect(`/call/${uuid}`)
});

app.listen(process.env.PORT || port, function() {
    console.log(`Server started on http://localhost:${port}`);
});