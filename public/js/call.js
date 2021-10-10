$('#micOff').hide()
$('#camOff').hide()

var pathArray = window.location.pathname.split( '/' );
var channel = pathArray.pop()

$('#code').html(`Meeting Code: <strong>${channel}</strong>`)

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

hideChat()

var userSignedIn = false;
var username = null;
var db = firebase.firestore();

firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      userSignedIn = true;
      username = user.displayName;
    }
});

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
        $('#micOff').show()
        $('#micOn').hide()
        muteAudio();
    } else {
        $('#micOff').hide()
        $('#micOn').show()
        unmuteAudio();
    }
}

function toggleCam() {
    console.log(localTrackState.videoTrackEnabled);
    if (localTrackState.videoTrackEnabled) {
        $('#camOff').show()
        $('#camOn').hide()
        muteVideo();
    } else {
        $('#camOff').hide()
        $('#camOn').show()
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

function sendMessage() {

    if (!userSignedIn) {
        Swal.fire({
            title: 'Error!',
            text: 'You need to sign in to send a message!',
            icon: 'error'
        });
        return;
    }
    var message = $('#message').val().trim()
    if (message !== '') {
        var date = new Date()
        var data = {
            message: message,
            sender: username,
            timestamp: date
        }
        db.collection('Channels').doc(channel).collection('messages').add(data).then(() => {$('#message').val('')});
        db.collection('Channels').doc(channel).set({timestamp: date})
    }

}

function invite() {

  $('#inviteLink').val(window.location)
  $('#inviteLink').focus()
  $('#inviteLink').select()
  document.execCommand('copy')
  $('#inviteLink').blur()
  Swal.fire({
    position: 'bottom-left',
    icon: 'success',
    title: 'Copied to Clipboard',
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
  })
}

var messagesDone = []

db.collection("Channels").doc(channel).collection('messages').orderBy("timestamp")
.onSnapshot((querySnapshot) => {
        var messages = [];
        var ids = []
        querySnapshot.forEach((doc) => {
          messages.push(doc.data());
          ids.push(doc.id)
        });
        messages.forEach((message) => {
          var index = messages.indexOf(message)
          if (!messagesDone.includes(ids[index])) {
            var element = $(`<div class="message" id=><h5>${message.sender}: ${message.message}</h5></div>`)
            $('#content').append(element)
            messagesDone.push(ids[index])
          }

        })
});

$('#message').on('keydown', function(e) {
  if (e.key === 'Enter') {
    sendMessage()
  }
})