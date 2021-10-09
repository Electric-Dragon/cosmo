var pathArray = window.location.pathname.split( '/' );
var channel = pathArray.pop()

var client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

var localTracks = {
    videoTrack: null,
    audioTrack: null
};

var localTrackState = {
    videoTrackEnabled: true,
    audioTrackEnabled: true
  }

var remoteUsers = {};

var options = {
    appid: null,
    channel: null,
    uid: null,
    token: null
};

mic, cam = true

hideChat()

$.ajax({
    type: "POST",
    url: "/getToken",
    data: {channel: channel}}).then(async function(response) {
        
        let token = response['token']
        let appID = response['appID']

        console.log(token, appID);

        options['appid'] = appID;
        options['channel'] = channel;
        options['token'] = token;

        await join()
        
    }).catch(err => {
        console.log(err);
    });

    async function join() {

        client.on("user-published", handleUserPublished);
        client.on("user-unpublished", handleUserUnpublished);
      
        [ options.uid, localTracks.audioTrack, localTracks.videoTrack ] = await Promise.all([
          client.join(options.appid, options.channel, options.token || null),
          AgoraRTC.createMicrophoneAudioTrack(),
          AgoraRTC.createCameraVideoTrack()
        ]);
        
        localTracks.videoTrack.play("local-player");
      
        await client.publish(Object.values(localTracks));
        console.log("publish success");
    }
      
      function leave() {
        window.location = "/"
      }
      
      async function subscribe(user, mediaType) {
        const uid = user.uid;
        await client.subscribe(user, mediaType);
        console.log("subscribe success");
        if (mediaType === 'video') {
          const player = $(`
              <div id="player-${uid}" class="player video"></div>
          `);
          $(".grid").append(player);
          user.videoTrack.play(`player-${uid}`);
        }
        if (mediaType === 'audio') {
          user.audioTrack.play();
        }
      }
      
      function handleUserPublished(user, mediaType) {
        const id = user.uid;
        remoteUsers[id] = user;
        subscribe(user, mediaType);
      }
      
      function handleUserUnpublished(user) {
        const id = user.uid;
        delete remoteUsers[id];
        $(`#player-${id}`).remove();
      }

function showChat() {
    $('.chat').show();
}

function hideChat() {
    $('.chat').hide()
}

function toggleMic() {
    console.log(localTrackState.audioTrackEnabled);
    if (localTrackState.audioTrackEnabled) {
        muteAudio();
    } else {
        unmuteAudio();
    }
}

function toggleCam() {
    console.log(localTrackState.videoTrackEnabled);
    if (localTrackState.videoTrackEnabled) {
        muteVideo();
    } else {
        unmuteVideo();
    }
}

async function muteAudio() {
    if (!localTracks.audioTrack) return;
    await localTracks.audioTrack.setEnabled(false);
    localTrackState.audioTrackEnabled = false;
  }
  
  async function muteVideo() {
    if (!localTracks.videoTrack) return;
    await localTracks.videoTrack.setEnabled(false);
    localTrackState.videoTrackEnabled = false;
  }
  
  async function unmuteAudio() {
    if (!localTracks.audioTrack) return;
    await localTracks.audioTrack.setEnabled(true);
    localTrackState.audioTrackEnabled = true;
  }
  
  async function unmuteVideo() {
    if (!localTracks.videoTrack) return;
    await localTracks.videoTrack.setEnabled(true);
    localTrackState.videoTrackEnabled = true;
  }