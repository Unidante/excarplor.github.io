document.addEventListener('DOMContentLoaded', function () {
    // Section Elements
    const profileSection = document.getElementById('profileSection');
    const advisorApplicationSection = document.getElementById('advisorApplicationSection');
    const recentActivitySection = document.getElementById('recentActivitySection');
    const privacySettingsSection = document.getElementById('privacySettingsSection');
    const editProfileModal = document.getElementById('editProfileModal');

    // Buttons and Interactive Elements
    const editProfileBtn = document.getElementById('editProfileBtn');
    const showAdvisorFormBtn = document.getElementById('showAdvisorFormBtn');
    const backToProfileBtn = document.getElementById('backToProfileBtn');
    const cancelEditProfileBtn = document.getElementById('cancelEditProfileBtn');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const savePrivacySettingsBtn = document.getElementById('savePrivacySettingsBtn');
    const activityList = document.getElementById('activityList');

    let currentUser;
    const db = firebase.firestore();

    // Main function on Auth State Change
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            currentUser = user;
            // Show default sections
            profileSection.style.display = 'block';
            recentActivitySection.style.display = 'block';
            privacySettingsSection.style.display = 'block';
            advisorApplicationSection.style.display = 'none'; // Ensure this is hidden
            
            // Load user data
            loadUserProfile(user);
            loadUserPrivacySettings(user);
            loadUserActivity(user);
            
            // Log sign-in activity
            logUserActivity('Inició sesión en la plataforma.', 'bx-log-in');

        } else {
            window.location.href = 'sesion.html';
        }
    });

    // --- DATA LOADING FUNCTIONS ---

    function loadUserProfile(user) {
        document.getElementById('displayUsername').textContent = user.displayName || 'N/A';
        document.getElementById('displayEmail').textContent = user.email;
        if(user.photoURL) {
            document.getElementById('profileAvatarDisplay').src = user.photoURL;
        }
    }

    function loadUserPrivacySettings(user) {
        db.collection('users').doc(user.uid).get().then(doc => {
            if (doc.exists && doc.data().privacySettings) {
                const settings = doc.data().privacySettings;
                document.getElementById('showEmail').checked = settings.showEmail;
                document.getElementById('receiveNotifications').checked = settings.receiveNotifications;
            }
        });
    }

    function loadUserActivity(user) {
        db.collection('users').doc(user.uid).collection('activity').orderBy('timestamp', 'desc').limit(10).get()
            .then(snapshot => {
                activityList.innerHTML = ''; // Clear previous activity
                if (snapshot.empty) {
                    activityList.innerHTML = '<li>No hay actividad reciente.</li>';
                    return;
                }
                snapshot.forEach(doc => {
                    const activity = doc.data();
                    const activityItem = document.createElement('li');
                    activityItem.classList.add('recent-activity-item');
                    const timestamp = activity.timestamp ? new Date(activity.timestamp.seconds * 1000).toLocaleString() : 'Ahora';
                    activityItem.innerHTML = `<i class='bx ${activity.icon}'></i><p>${activity.description}</p><span class='timestamp'>${timestamp}</span>`;
                    activityList.appendChild(activityItem);
                });
            });
    }

    function logUserActivity(description, icon) {
        if (!currentUser) return;
        const activityRef = db.collection('users').doc(currentUser.uid).collection('activity');
        activityRef.add({
            description: description,
            icon: icon,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            loadUserActivity(currentUser); // Refresh activity list after logging
        });
    }

    // --- EVENT LISTENERS ---

    showAdvisorFormBtn.addEventListener('click', () => {
        profileSection.style.display = 'none';
        advisorApplicationSection.style.display = 'block';
    });

    backToProfileBtn.addEventListener('click', () => {
        profileSection.style.display = 'block';
        advisorApplicationSection.style.display = 'none';
    });

    editProfileBtn.addEventListener('click', () => {
        document.getElementById('editUsername').value = currentUser.displayName || '';
        document.getElementById('editAvatarUrl').value = currentUser.photoURL || '';
        editProfileModal.style.display = 'flex';
    });

    cancelEditProfileBtn.addEventListener('click', () => {
        editProfileModal.style.display = 'none';
    });

    saveProfileBtn.addEventListener('click', () => {
        const newUsername = document.getElementById('editUsername').value;
        const newAvatarUrl = document.getElementById('editAvatarUrl').value;

        currentUser.updateProfile({
            displayName: newUsername,
            photoURL: newAvatarUrl
        }).then(() => {
            loadUserProfile(currentUser);
            logUserActivity('Se actualizó la información del perfil.', 'bx-user-check');
            editProfileModal.style.display = 'none';
        }).catch(error => {
            console.error('Error updating profile:', error);
        });
    });

    savePrivacySettingsBtn.addEventListener('click', () => {
        const showEmail = document.getElementById('showEmail').checked;
        const receiveNotifications = document.getElementById('receiveNotifications').checked;
        db.collection('users').doc(currentUser.uid).set({ 
            privacySettings: { showEmail, receiveNotifications } 
        }, { merge: true }).then(() => {
            logUserActivity('Se actualizó la configuración de privacidad.', 'bx-shield-quarter');
        }).catch(error => {
            console.error('Error saving privacy settings:', error);
        });
    });

    logoutBtn.addEventListener('click', function() {
        logUserActivity('Cerró sesión.', 'bx-log-out');
        setTimeout(() => { // Short delay to ensure the log is sent
            firebase.auth().signOut().then(() => {
                window.location.href = 'index.html';
            }).catch((error) => {
                console.error('Error signing out: ', error);
            });
        }, 300);
    });
});
