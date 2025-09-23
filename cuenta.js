document.addEventListener('DOMContentLoaded', function() {
                // DOM Elements
                const authContainer = document.getElementById('authContainer');
                const profileSection = document.getElementById('profileSection');
                const advisorApplicationSection = document.getElementById('advisorApplicationSection');
                const recentActivitySection = document.getElementById('recentActivitySection'); // New section
                const notificationsSection = document.getElementById('notificationsSection');
                const privacySettingsSection = document.getElementById('privacySettingsSection');

                const showAdvisorFormBtn = document.getElementById('showAdvisorFormBtn');
                const backToProfileBtn = document.getElementById('backToProfileBtn');
                const logoutBtn = document.getElementById('logoutBtn');
                const authTitle = document.getElementById('authTitle');
                const authForm = document.getElementById('authForm');
                const registerLink = document.getElementById('registerLink');
                const confirmPasswordGroup = document.getElementById('confirmPasswordGroup'); // Confirm password field group
                const confirmPasswordInput = document.getElementById('confirmPassword'); // Confirm password input

                const editProfileBtn = document.getElementById('editProfileBtn');
                const editProfileModal = document.getElementById('editProfileModal');
                const saveProfileBtn = document.getElementById('saveProfileBtn');
                const cancelEditProfileBtn = document.getElementById('cancelEditProfileBtn');
                const editAvatarUrlInput = document.getElementById('editAvatarUrl'); // Avatar URL input in modal
                const profileAvatarDisplay = document.getElementById('profileAvatarDisplay'); // Avatar img in profile section

                const advisorApplicationForm = document.getElementById('advisorApplicationForm');
                const savePrivacySettingsBtn = document.getElementById('savePrivacySettingsBtn');
                const activityList = document.getElementById('activityList'); // Activity list for recent activities


                // Global message box functions
                function showMessage(title, text) {
                    document.getElementById('messageTitle').textContent = title;
                    document.getElementById('messageText').textContent = text;
                    document.getElementById('messageBox').classList.add('show');
                }

                document.getElementById('messageOkBtn').addEventListener('click', function() {
                    document.getElementById('messageBox').classList.remove('show');
                });


                // Initial simulated profile data
                let userProfileData = JSON.parse(localStorage.getItem('userProfile')) || {
                    username: "JohnDoe",
                    email: "johndoe@example.com",
                    userType: "Estudiante",
                    avatarUrl: "https://placehold.co/120x120/4682B4/FFFFFF?text=Avatar" // Default avatar
                };

                // Initial simulated privacy settings
                let privacySettings = JSON.parse(localStorage.getItem('privacySettings')) || {
                    showEmail: true,
                    receiveNotifications: true,
                    dataSharing: false
                };

                // Function to add activity to the recent activity list
                function addActivity(iconClass, message) {
                    const now = new Date();
                    const timeString = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                    const activityItem = document.createElement('li');
                    activityItem.classList.add('recent-activity-item');
                    activityItem.innerHTML = `
                        <i class='bx ${iconClass}'></i>
                        <p>${message}</p>
                        <span class="timestamp">${timeString}</span>
                    `;
                    // Add new activity to the top of the list
                    if (activityList.firstChild) {
                        activityList.insertBefore(activityItem, activityList.firstChild);
                    } else {
                        activityList.appendChild(activityItem);
                    }
                    // Limit the number of activities to keep the list clean (e.g., last 5)
                    while (activityList.children.length > 5) {
                        activityList.removeChild(activityList.lastChild);
                    }
                }


                // Function to update displayed profile information
                function updateProfileDisplay() {
                    document.getElementById('displayUsername').textContent = userProfileData.username;
                    document.getElementById('displayEmail').textContent = userProfileData.email;
                    document.getElementById('displayUserType').textContent = userProfileData.userType;
                    profileAvatarDisplay.src = userProfileData.avatarUrl || "https://placehold.co/120x120/4682B4/FFFFFF?text=Avatar";
                }

                // Function to update displayed privacy settings
                function updatePrivacySettingsDisplay() {
                    document.getElementById('showEmail').checked = privacySettings.showEmail;
                    document.getElementById('receiveNotifications').checked = privacySettings.receiveNotifications;
                    document.getElementById('dataSharing').checked = privacySettings.dataSharing;
                }

                // Simulate session status using localStorage for persistence
                let isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'; // Initialize from localStorage

                /**
                 * Updates the user interface based on the authentication status.
                 * Shows the authentication section if not logged in,
                 * or the user profile and other sections if logged in.
                 */
                function updateUI() {
                    if (isLoggedIn) {
                        authContainer.style.display = 'none';
                        profileSection.style.display = 'block';
                        recentActivitySection.style.display = 'block'; // Show new section
                        notificationsSection.style.display = 'block';
                        privacySettingsSection.style.display = 'block';
                        advisorApplicationSection.style.display = 'none'; // Ensure advisor form is hidden upon login

                        localStorage.setItem('isLoggedIn', 'true'); // Persist login state
                        localStorage.setItem('userProfile', JSON.stringify(userProfileData)); // Persist profile data
                        localStorage.setItem('privacySettings', JSON.stringify(privacySettings)); // Persist privacy settings

                        // Update displayed info based on current data
                        updateProfileDisplay();
                        updatePrivacySettingsDisplay();
                    } else {
                        authContainer.style.display = 'flex'; // Keep authentication container visible
                        profileSection.style.display = 'none';
                        recentActivitySection.style.display = 'none'; // Hide new section
                        notificationsSection.style.display = 'none';
                        privacySettingsSection.style.display = 'none';
                        advisorApplicationSection.style.display = 'none';

                        // Reset form to "Login" when logged out
                        authTitle.textContent = 'Iniciar Sesión';
                        authForm.querySelector('button[type="submit"]').textContent = 'Iniciar Sesión';
                        registerLink.textContent = 'Regístrate';
                        confirmPasswordGroup.style.display = 'none'; // Hide confirm password field
                        confirmPasswordInput.removeAttribute('required'); // Remove required from confirm password

                        authForm.reset();
                        localStorage.setItem('isLoggedIn', 'false'); // Persist logout state
                    }
                }

                // Handle click on "Register" / "Login" link
                registerLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    if (authTitle.textContent === 'Iniciar Sesión') {
                        // Switch to Register form
                        authTitle.textContent = 'Registrarse';
                        authForm.querySelector('button[type="submit"]').textContent = 'Registrarse';
                        registerLink.textContent = 'Inicia Sesión';
                        confirmPasswordGroup.style.display = 'block'; // Show confirm password field
                        confirmPasswordInput.setAttribute('required', 'required'); // Make it required for registration
                    } else {
                        // Switch to Login form
                        authTitle.textContent = 'Iniciar Sesión';
                        authForm.querySelector('button[type="submit"]').textContent = 'Iniciar Sesión';
                        registerLink.textContent = 'Regístrate';
                        confirmPasswordGroup.style.display = 'none'; // Hide confirm password field
                        confirmPasswordInput.removeAttribute('required'); // Remove required from confirm password

                        authForm.reset();
                    }
                });

                // Handle submission of authentication/registration form
                authForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    const usernameOrEmail = document.getElementById('usernameEmail').value;
                    const password = document.getElementById('password').value;
                    const isRegistering = authTitle.textContent === 'Registrarse';

                    if (!usernameOrEmail || !password) {
                        showMessage('Error', 'Por favor, complete todos los campos.');
                        return;
                    }

                    if (isRegistering) {
                        const confirmPassword = confirmPasswordInput.value;
                        if (password !== confirmPassword) {
                            showMessage('Error', 'Las contraseñas no coinciden.');
                            return;
                        }
                        // Simulate successful registration
                        isLoggedIn = true;
                        userProfileData.username = usernameOrEmail;
                        userProfileData.email = usernameOrEmail.includes('@') ? usernameOrEmail : 'usuario@ejemplo.com';
                        userProfileData.userType = "Nuevo Usuario"; // Default for new users
                        updateUI();
                        showMessage('Éxito', 'Registro exitoso. ¡Bienvenido!');
                        addActivity('bx-user-plus', 'Se registró como nuevo usuario.');
                    } else {
                        // Simulate successful login
                        isLoggedIn = true;
                        userProfileData.username = usernameOrEmail; // Assume login successful, update username
                        userProfileData.email = usernameOrEmail.includes('@') ? usernameOrEmail : userProfileData.email; // Keep existing email if username is not email
                        updateUI();
                        showMessage('Éxito', 'Inicio de sesión exitoso. ¡Bienvenido!');
                        addActivity('bx-log-in', 'Inició sesión en su cuenta.');
                    }
                });

                // Handle "Editar Perfil" button click
                editProfileBtn.addEventListener('click', function() {
                    // Populate modal with current profile data
                    document.getElementById('editUsername').value = userProfileData.username;
                    document.getElementById('editEmail').value = userProfileData.email;
                    document.getElementById('editUserType').value = userProfileData.userType;
                    editAvatarUrlInput.value = userProfileData.avatarUrl; // Set current avatar URL
                    editProfileModal.classList.add('show');
                });

                // Handle "Cancelar" button in Edit Profile modal
                cancelEditProfileBtn.addEventListener('click', function() {
                    editProfileModal.classList.remove('show');
                });

                // Handle "Guardar Cambios" button in Edit Profile modal
                saveProfileBtn.addEventListener('click', function() {
                    const newUsername = document.getElementById('editUsername').value;
                    const newEmail = document.getElementById('editEmail').value;
                    const newUserType = document.getElementById('editUserType').value;
                    const newAvatarUrl = editAvatarUrlInput.value;

                    // Update userProfileData
                    userProfileData.username = newUsername;
                    userProfileData.email = newEmail;
                    userProfileData.userType = newUserType;
                    userProfileData.avatarUrl = newAvatarUrl || "https://placehold.co/120x120/4682B4/FFFFFF?text=Avatar"; // Fallback to default if empty

                    updateProfileDisplay(); // Update displayed profile info
                    localStorage.setItem('userProfile', JSON.stringify(userProfileData)); // Update localStorage
                    editProfileModal.classList.remove('show');
                    showMessage('Éxito', 'Perfil actualizado correctamente.');
                    addActivity('bx-user-circle', 'Actualizó la información de su perfil.');
                });

                // Handle advisor form submission
                advisorApplicationForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    const formData = new FormData(advisorApplicationForm);
                    const data = {};
                    for (let [key, value] of formData.entries()) {
                        data[key] = value;
                    }
                    console.log('Datos de la solicitud de asesor enviados (simulado):', data);
                    showMessage('Solicitud Enviada', '¡Gracias por tu interés! Tu solicitud para ser asesor ha sido enviada y será revisada.');
                    advisorApplicationForm.reset();
                    advisorApplicationSection.style.display = 'none'; // Hide advisor form
                    // Show all other sections
                    profileSection.style.display = 'block';
                    recentActivitySection.style.display = 'block';
                    notificationsSection.style.display = 'block';
                    privacySettingsSection.style.display = 'block';
                    addActivity('bx-message-rounded-dots', 'Envió una solicitud para ser asesor.');
                });

                // Handle click on "Convertirse en Asesor"
                showAdvisorFormBtn.addEventListener('click', function() {
                    profileSection.style.display = 'none';
                    recentActivitySection.style.display = 'none';
                    notificationsSection.style.display = 'none';
                    privacySettingsSection.style.display = 'none';
                    advisorApplicationSection.style.display = 'block';
                });

                // Handle click on "Volver al Perfil" from advisor form
                backToProfileBtn.addEventListener('click', function() {
                    advisorApplicationSection.style.display = 'none';
                    profileSection.style.display = 'block';
                    recentActivitySection.style.display = 'block';
                    notificationsSection.style.display = 'block';
                    privacySettingsSection.style.display = 'block';
                    advisorApplicationForm.reset();
                });

                // Handle click on "Cerrar Sesión"
                logoutBtn.addEventListener('click', function() {
                    isLoggedIn = false;
                    localStorage.removeItem('userProfile'); // Clear profile data on logout
                    localStorage.removeItem('privacySettings'); // Clear privacy settings on logout
                    updateUI();
                    console.log('Sesión cerrada.');
                    showMessage('Sesión Cerrada', 'Has cerrado tu sesión.');
                    addActivity('bx-log-out', 'Cerró sesión en su cuenta.'); // Log activity
                });

                // Notification "Mark as Read" handler
                document.querySelectorAll('.mark-as-read-btn').forEach(button => {
                    button.addEventListener('click', function() {
                        const notificationItem = this.closest('.notification-item');
                        if (!notificationItem.classList.contains('read')) {
                            notificationItem.classList.add('read');
                            this.textContent = 'Leído';
                            this.disabled = true;
                            showMessage('Notificación', 'Notificación marcada como leída.');
                            addActivity('bx-bell', 'Marcó una notificación como leída.');
                        }
                    });
                });

                // Privacy settings save handler
                savePrivacySettingsBtn.addEventListener('click', function() {
                    privacySettings.showEmail = document.getElementById('showEmail').checked;
                    privacySettings.receiveNotifications = document.getElementById('receiveNotifications').checked;
                    privacySettings.dataSharing = document.getElementById('dataSharing').checked;

                    localStorage.setItem('privacySettings', JSON.stringify(privacySettings)); // Save to localStorage
                    showMessage('Configuración Guardada', 'Tu configuración de privacidad ha sido actualizada.');
                    addActivity('bx-lock-alt', 'Actualizó la configuración de privacidad.');
                });

                // Initial load of UI
                updateUI();
            });