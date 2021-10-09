var pathArray = window.location.pathname.split( '/' );
var channel = pathArray.pop()

$.ajax({
    type: "POST",
    url: "/getToken",
    data: {channel: channel}}).then(function(response) {
        
        let token = response['token']

    }).catch(err => {
        console.log(err);
    });