function signUp() {

    var name = $('#signUpName').val();
    var email = $('#signUpEmail').val();
    var password = $('#signUpPassword').val();

    if (!(name === "") && !(email === "") && !(password === "")) {

        firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = firebase.auth().currentUser;

            user.updateProfile({
            displayName: name
            }).then(() => {

                firebase.auth().currentUser.sendEmailVerification()
                .then(() => {

                    Swal.fire({
                        title: 'Success!',
                        text: "Signed up successfully! Check your inbox for the verification email",
                        icon: 'success',
                        confirmButtonColor: '#3085d6',
                        confirmButtonText: 'Okay'
                      }).then((result) => {
                        if (result.isConfirmed) {
                          window.location = "/"
                        }
                    })
                });
                
            }).catch((error) => {
                Swal.fire(
                    'Error!',
                    error.message,
                    'error'
                )
            });  
        })
        .catch((error) => {
            Swal.fire(
                'Error!',
                error.message,
                'error'
            )
        });

    }

}

function login() {

    var email = $('#loginEmail').val();
    var password = $('#loginPassword').val();

    if(!(email === "") && !(password === "")) {

        firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {

            Swal.fire({
                title: 'Success!',
                text: "Logged in successfully",
                icon: 'success',
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'Okay'
              }).then((result) => {
                if (result.isConfirmed) {
                  window.location = "/"
                }
            })
        })
        .catch((error) => {
            Swal.fire(
                'Error!',
                error.message,
                'error'
            )
        });

    }

}
