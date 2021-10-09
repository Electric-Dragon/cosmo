var pathArray = window.location.pathname.split( '/' );
var channel = pathArray.pop()

var rtc = {
    client: null,
    joined: false,
    published: false,
    localStream: null,
    remoteStreams: [],
    params: {}
}

$.ajax({
    type: "POST",
    url: "/getToken",
    data: {channel: channel}}).then(function(response) {
        
        let token = response['token']
        let appID = response['appID']

        console.log(token, appID);

        var obj = {
            appID: appID,
            cameraId: "",
            cameraResolution: "default",
            channel: channel,
            codec: "h264",
            microphoneId: "",
            mode: "live",
            token: token,
            uid: null
        }

        join(rtc, obj)

    }).catch(err => {
        console.log(err);
    });

    function join (rtc, option) {
        if (rtc.joined) {
        //   Toast.error("Your already joined")
          return;
        }
  
        /**
         * A class defining the properties of the config parameter in the createClient method.
         * Note:
         *    Ensure that you do not leave mode and codec as empty.
         *    Ensure that you set these properties before calling Client.join.
         *  You could find more detail here. https://docs.agora.io/en/Video/API%20Reference/web/interfaces/agorartc.clientconfig.html
        **/
        rtc.client = AgoraRTC.createClient({mode: option.mode, codec: option.codec})
  
        rtc.params = option
  
        // handle AgoraRTC client event
        handleEvents(rtc)
  
        // init client
        rtc.client.init(option.appID, function () {
          console.log("init success")
  
          /**
           * Joins an AgoraRTC Channel
           * This method joins an AgoraRTC channel.
           * Parameters
           * tokenOrKey: string | null
           *    Low security requirements: Pass null as the parameter value.
           *    High security requirements: Pass the string of the Token or Channel Key as the parameter value. See Use Security Keys for details.
           *  channel: string
           *    A string that provides a unique channel name for the Agora session. The length must be within 64 bytes. Supported character scopes:
           *    26 lowercase English letters a-z
           *    26 uppercase English letters A-Z
           *    10 numbers 0-9
           *    Space
           *    "!", "#", "$", "%", "&", "(", ")", "+", "-", ":", ";", "<", "=", ".", ">", "?", "@", "[", "]", "^", "_", "{", "}", "|", "~", ","
           *  uid: number | null
           *    The user ID, an integer. Ensure this ID is unique. If you set the uid to null, the server assigns one and returns it in the onSuccess callback.
           *   Note:
           *      All users in the same channel should have the same type (number or string) of uid.
           *      If you use a number as the user ID, it should be a 32-bit unsigned integer with a value ranging from 0 to (232-1).
          **/
          rtc.client.join(option.token ? option.token : null, option.channel, option.uid ? +option.uid : null, function (uid) {
            // Toast.notice("join channel: " + option.channel + " success, uid: " + uid)
            console.log("join channel: " + option.channel + " success, uid: " + uid)
            rtc.joined = true
  
            rtc.params.uid = uid
  
            // create local stream
            rtc.localStream = AgoraRTC.createStream({
              streamID: rtc.params.uid,
              audio: true,
              video: true,
              screen: false,
              microphoneId: option.microphoneId,
              cameraId: option.cameraId
            })
  
            // initialize local stream. Callback function executed after intitialization is done
            rtc.localStream.init(function () {
              console.log("init local stream success")
              // play stream with html element id "local_stream"
              rtc.localStream.play("local_stream")
  
              // publish local stream
              publish(rtc)
            }, function (err)  {
            //   Toast.error("stream init failed, please open console see more detail")
              console.error("init local stream failed ", err)
            })
          }, function(err) {
            // Toast.error("client join failed, please open console see more detail")
            console.error("client join failed", err)
          })
        }, (err) => {
        //   Toast.error("client init failed, please open console see more detail")
          console.error(err)
        })
      }
  
      function publish (rtc) {
        if (!rtc.client) {
        //   Toast.error("Please Join Room First")
          return
        }
        if (rtc.published) {
        //   Toast.error("Your already published")
          return
        }
        var oldState = rtc.published
  
        // publish localStream
        rtc.client.publish(rtc.localStream, function (err) {
          rtc.published = oldState
          console.log("publish failed")
        //   Toast.error("publish failed")
          console.error(err)
        })
        Toast.info("publish")
        rtc.published = true
      }
  
      function unpublish (rtc) {
        if (!rtc.client) {
        //   Toast.error("Please Join Room First")
          return
        }
        if (!rtc.published) {
        //   Toast.error("Your didn't publish")
          return
        }
        var oldState = rtc.published
        rtc.client.unpublish(rtc.localStream, function (err) {
          rtc.published = oldState
          console.log("unpublish failed")
        //   Toast.error("unpublish failed")
          console.error(err)
        })
        // Toast.info("unpublish")
        rtc.published = false
      }
  
      function leave (rtc) {
        if (!rtc.client) {
        //   Toast.error("Please Join First!")
          return
        }
        if (!rtc.joined) {
        //   Toast.error("You are not in channel")
          return
        }
        /**
         * Leaves an AgoraRTC Channel
         * This method enables a user to leave a channel.
         **/
        rtc.client.leave(function () {
          // stop stream
          if(rtc.localStream.isPlaying()) {
            rtc.localStream.stop()
          }
          // close stream
          rtc.localStream.close()
          for (let i = 0; i < rtc.remoteStreams.length; i++) {
            var stream = rtc.remoteStreams.shift()
            var id = stream.getId()
            if(stream.isPlaying()) {
              stream.stop()
            }
            removeView(id)
          }
          rtc.localStream = null
          rtc.remoteStreams = []
          rtc.client = null
          console.log("client leaves channel success")
          rtc.published = false
          rtc.joined = false
        //   Toast.notice("leave success")
        }, function (err) {
          console.log("channel leave failed")
        //   Toast.error("leave success")
          console.error(err)
        })
      }

      function handleEvents (rtc) {
        rtc.client.on("error", (err) => {
          console.log(err)
        })
        rtc.client.on("peer-leave", function (evt) {
          var id = evt.uid;
          console.log("id", evt)
          let streams = rtc.remoteStreams.filter(e => id !== e.getId())
          let peerStream = rtc.remoteStreams.find(e => id === e.getId())
          if(peerStream && peerStream.isPlaying()) {
            peerStream.stop()
          }
          rtc.remoteStreams = streams
          if (id !== rtc.params.uid) {
            removeView(id)
          }
          console.log("peer-leave", id)
        })
        rtc.client.on("stream-published", function (evt) {
          console.log("stream-published")
        })
        rtc.client.on("stream-added", function (evt) {  
          var remoteStream = evt.stream
          var id = remoteStream.getId()
          Toast.info("stream-added uid: " + id)
          if (id !== rtc.params.uid) {
            rtc.client.subscribe(remoteStream, function (err) {
              console.log("stream subscribe failed", err)
            })
          }
          console.log("stream-added remote-uid: ", id)
        })
        rtc.client.on("stream-subscribed", function (evt) {
          var remoteStream = evt.stream
          var id = remoteStream.getId()
          rtc.remoteStreams.push(remoteStream)
          addView(id)
          remoteStream.play("remote_video_" + id)
          Toast.info("stream-subscribed remote-uid: " + id)
          console.log("stream-subscribed remote-uid: ", id)
        })
        rtc.client.on("stream-removed", function (evt) {
          var remoteStream = evt.stream
          var id = remoteStream.getId()
          Toast.info("stream-removed uid: " + id)
          if(remoteStream.isPlaying()) {
            remoteStream.stop()
          }
          rtc.remoteStreams = rtc.remoteStreams.filter(function (stream) {
            return stream.getId() !== id
          })
          removeView(id)
          console.log("stream-removed remote-uid: ", id)
        })
        rtc.client.on("onTokenPrivilegeWillExpire", function(){
          // After requesting a new token
          // rtc.client.renewToken(token);
          Toast.info("onTokenPrivilegeWillExpire")
          console.log("onTokenPrivilegeWillExpire")
        })
        rtc.client.on("onTokenPrivilegeDidExpire", function(){
          // After requesting a new token
          // client.renewToken(token);
          Toast.info("onTokenPrivilegeDidExpire")
          console.log("onTokenPrivilegeDidExpire")
        })
      }
  

      function addView (id, show) {
        if (!$("#" + id)[0]) {
          $("<div/>", {
            id: "remote_video_panel_" + id,
            class: "video",
          }).appendTo(".grid")
  
          $("<div/>", {
            id: "remote_video_" + id,
            class: "video-",
          }).appendTo(".grid-" + id)
  
          $("<div/>", {
            id: "remote_video_info_" + id,
            class: "video " + (show ? "" :  "hide"),
          }).appendTo(".grid-" + id)
  
          $("<div/>", {
            id: "video_autoplay_"+ id,
            class: "autoplay-fallback hide",
          }).appendTo(".grid-" + id)
        }
      }
      function removeView (id) {
        if ($("remote_video_panel_" + id)[0]) {
          $("remote_video_panel_"+id).remove()
        }
      }
  