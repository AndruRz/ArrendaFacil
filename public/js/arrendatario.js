document.addEventListener('DOMContentLoaded', async function() {
    // Variables para el menú móvil
    const menuToggle = document.getElementById('menu-toggle');
    const menuOverlay = document.getElementById('menu-overlay');
    const navbar = document.getElementById('navbar');
    const mainContent = document.getElementById('main-content');

    // Variables para la animación de bienvenida
    const welcomeAnimation = document.getElementById('welcome-animation');
    const steps = document.querySelectorAll('.step');
    const dots = document.querySelectorAll('.dot');
    const finishButton = document.getElementById('finish-animation');

    let currentStep = 0;

    // Función para mostrar el mensaje de error con fondo oscuro
    function showErrorMessage(message = 'Esta acción no se puede realizar, lo sentimos :D') {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        overlay.style.zIndex = '2999';
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';
        document.body.appendChild(overlay);

        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '50%';
        errorDiv.style.left = '50%';
        errorDiv.style.transform = 'translate(-50%, -50%)';
        errorDiv.style.backgroundColor = '#fff';
        errorDiv.style.padding = '2rem';
        errorDiv.style.borderRadius = '12px';
        errorDiv.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
        errorDiv.style.zIndex = '3000';
        errorDiv.style.textAlign = 'center';
        errorDiv.style.fontFamily = "'Roboto', sans-serif";
        errorDiv.style.color = '#2b6b6b';
        errorDiv.innerHTML = `
            <h3 style="margin-bottom: 1rem;">¡Uy!</h3>
            <p>${message}</p>
            <button style="
                background: linear-gradient(135deg, #2b6b6b, #4c9f9f);
                color: white;
                border: none;
                padding: 0.8rem 1.5rem;
                border-radius: 8px;
                cursor: pointer;
                margin-top: 1rem;
                font-weight: 500;
            ">Aceptar</button>
        `;
        document.body.appendChild(errorDiv);

        setTimeout(() => {
            overlay.style.opacity = '1';
            errorDiv.style.opacity = '1';
            errorDiv.style.transform = 'translate(-50%, -50%)';
        }, 10);

        const acceptButton = errorDiv.querySelector('button');
        acceptButton.addEventListener('click', () => {
            overlay.style.opacity = '0';
            errorDiv.style.opacity = '0';
            errorDiv.style.transform = 'translate(-50%, -60%)';
            setTimeout(() => {
                document.body.removeChild(overlay);
                document.body.removeChild(errorDiv);
            }, 300);
        });

        errorDiv.style.opacity = '0';
        errorDiv.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    }

    // Manejo del retroceso para usuarios registrados y finishRegister
    const isArrendadorPage = window.location.pathname.toLowerCase().endsWith('/arrendatario') || 
                            window.location.pathname.toLowerCase().endsWith('arrendatario.html');
    const isFinishRegisterPage = window.location.pathname.toLowerCase().endsWith('/finishregister') || 
                                window.location.pathname.toLowerCase().endsWith('finishregister.html');
    let isRegistered = localStorage.getItem('isRegistered') === 'true';

    // Extraer parámetros de la URL para Google login
    const urlParams = new URLSearchParams(window.location.search);
    const emailFromUrl = urlParams.get('email');
    const successFromUrl = urlParams.get('success') === 'true';
    const isGoogleLogin = urlParams.has('email') && urlParams.has('success');

    // Si viene de Google login, establecer el estado de registro
    if (isGoogleLogin && successFromUrl && emailFromUrl) {
        localStorage.setItem('currentUserEmail', decodeURIComponent(emailFromUrl));
        localStorage.setItem('isRegistered', 'true');
        isRegistered = true;
        // Limpiar los parámetros de la URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Aplicar bloqueo de retroceso
    if ((isArrendadorPage && isRegistered) || isFinishRegisterPage) {
        // Agregar múltiples estados para bloquear retrocesos
        for (let i = 0; i < 3; i++) {
            history.pushState({ page: 'restricted' }, null, window.location.pathname);
        }

        // Listener para el evento popstate
        window.addEventListener('popstate', function(event) {
            // Mostrar mensaje de error
            showErrorMessage('Ups, no se pudo realizar esta acción.');

            // Empujar un nuevo estado para mantener al usuario en la página actual
            history.pushState({ page: 'restricted' }, null, window.location.pathname);
        });
    }

    // Manejo del menú móvil
    if (menuToggle && navbar && menuOverlay) {
        menuToggle.addEventListener('click', function() {
            this.classList.toggle('open');
            navbar.classList.toggle('active');
            menuOverlay.classList.toggle('active');
        });

        menuOverlay.addEventListener('click', function() {
            menuToggle.classList.remove('open');
            navbar.classList.remove('active');
            this.classList.remove('active');
        });
    }

    // Hacer que los enlaces del menú cierren el menú en móvil
    const navLinks = document.querySelectorAll('.navbar a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                menuToggle.classList.remove('open');
                navbar.classList.remove('active');
                menuOverlay.classList.remove('active');
            }
        });
    });

    // Control para mostrar o no la animación de bienvenida
    const userEmail = localStorage.getItem('currentUserEmail');
    let hasSeenAnimation = true;

    if (userEmail) {
        try {
            const response = await fetch(`/api/animation-state/${encodeURIComponent(userEmail)}`);
            const data = await response.json();
            if (data.success) {
                hasSeenAnimation = data.hasSeen;
            } else {
                console.error('Error al obtener estado de animación:', data.message);
                showErrorMessage('No se pudo verificar el estado de la animación. Por favor, intenta nuevamente.');
            }
        } catch (error) {
            console.error('Error al consultar estado de animación:', error);
            showErrorMessage('No se pudo verificar el estado de la animación. Por favor, intenta nuevamente.');
            return;
        }
    } else {
        console.error('No se encontró el correo del usuario en localStorage');
        showErrorMessage('No se pudo identificar al usuario. Por favor, inicia sesión nuevamente.');
        return;
    }

    if (!hasSeenAnimation && welcomeAnimation) {
        // Mostrar la animación con transición de entrada
        welcomeAnimation.classList.add('visible');
        
        function goToStep(stepIndex) {
            steps.forEach(step => step.classList.remove('active'));
            dots.forEach(dot => dot.classList.remove('active'));
            steps[stepIndex].classList.add('active');
            dots[stepIndex].classList.add('active');
            currentStep = stepIndex;
        }

        dots.forEach(dot => {
            dot.addEventListener('click', function() {
                const stepIndex = parseInt(this.getAttribute('data-step')) - 1;
                goToStep(stepIndex);
            });
        });

        if (finishButton) {
            finishButton.addEventListener('click', async function() {
                welcomeAnimation.classList.add('hidden');
                try {
                    const response = await fetch(`/api/animation-state/${encodeURIComponent(userEmail)}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    const data = await response.json();
                    if (!data.success) {
                        console.error('Error al guardar estado de animación:', data.message);
                        showErrorMessage('No se pudo guardar el estado de la animación. Por favor, intenta nuevamente.');
                    }
                } catch (error) {
                    console.error('Error al guardar estado de animación:', error);
                    showErrorMessage('No se pudo guardar el estado de la animación. Por favor, intenta nuevamente.');
                }
                // Mostrar el contenido principal con transición
                setTimeout(() => {
                    mainContent.classList.add('active');
                }, 500); // Coincide con la duración de la transición
            });
        }

        let autoAdvance = setInterval(() => {
            if (currentStep < steps.length - 1) {
                goToStep(currentStep + 1);
            } else {
                clearInterval(autoAdvance);
            }
        }, 5000);

        welcomeAnimation.addEventListener('click', function() {
            clearInterval(autoAdvance);
        });
    } else {
        if (welcomeAnimation) {
            welcomeAnimation.style.display = 'none';
        }
        // Mostrar el contenido principal con transición
        setTimeout(() => {
            mainContent.classList.add('active');
        }, 100);
    }

    // Conectar los botones de acción rápida
    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach((button, index) => {
        button.addEventListener('click', function() {
            switch (index) {
                case 0:
                    window.location.href = 'crear-publicacion';
                    break;
                case 1:
                    window.location.href = 'mensajes';
                    break;
                case 2:
                    window.location.href = 'perfil';
                    break;
            }
        });
    });

    // Para pruebas: función para resetear y ver la animación de nuevo
    window.resetAnimation = function() {
        localStorage.removeItem('isRegistered');
        localStorage.removeItem('currentUserEmail');
        // Nota: El estado de la animación debe restablecerse manualmente en animationStates.json
        location.reload();
    };
});

// Nuevo bloque para la funcionalidad de actualización de perfil
document.addEventListener('DOMContentLoaded', function() {
    const mainContent = document.getElementById('main-content');
    const profileLink = document.querySelector('a[href="perfil"]');
    const dashboardLink = document.querySelector('a[href="dashboard"]');
    const menuLinks = document.querySelectorAll('.navbar a');

    let hasUnsavedChanges = false;
    let currentProfileData = null;
    let originalDashboardContent = mainContent.innerHTML;

    const style = document.createElement('style');
    style.innerHTML = `
        .navbar a.disabled {
            pointer-events: none;
            opacity: 0.5;
            cursor: not-allowed;
        }
    `;
    document.head.appendChild(style);

    function toggleNavbarLinks(disable) {
        menuLinks.forEach(link => {
            if (disable) {
                link.classList.add('disabled');
            } else {
                link.classList.remove('disabled');
            }
        });
    }

    const phoneFormats = {
        '+57': 10,
        '+54': 10,
        '+591': 8,
        '+55': 11,
        '+56': 9,
        '+506': 8,
        '+53': 8,
        '+593': 9,
        '+503': 8,
        '+502': 8,
        '+504': 8,
        '+52': 10,
        '+505': 8,
        '+507': 8,
        '+595': 9,
        '+51': 9,
        '+1': 10,
        '+598': 9,
        '+58': 10
    };

    const months = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    function showLoadingSpinner() {
        loadingOverlay = document.createElement('div');
        loadingOverlay.style.position = 'fixed';
        loadingOverlay.style.top = '0';
        loadingOverlay.style.left = '0';
        loadingOverlay.style.width = '100%';
        loadingOverlay.style.height = '100%';
        loadingOverlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
        loadingOverlay.style.zIndex = '2998';
        loadingOverlay.style.opacity = '0';
        loadingOverlay.style.transition = 'opacity 0.3s ease';
        loadingOverlay.style.pointerEvents = 'auto';
        document.body.appendChild(loadingOverlay);

        loadingSpinner = document.createElement('div');
        loadingSpinner.style.position = 'fixed';
        loadingSpinner.style.top = '50%';
        loadingSpinner.style.left = '50%';
        loadingSpinner.style.transform = 'translate(-50%, -50%)';
        loadingSpinner.style.backgroundColor = '#fff';
        loadingSpinner.style.padding = '2rem';
        loadingSpinner.style.borderRadius = '12px';
        loadingSpinner.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
        loadingSpinner.style.zIndex = '2999';
        loadingSpinner.style.textAlign = 'center';
        loadingSpinner.style.fontFamily = "'Roboto', sans-serif";
        loadingSpinner.style.color = '#2b6b6b';
        loadingSpinner.innerHTML = `
            <div style="border: 4px solid #f3f3f3; border-top: 4px solid #2b6b6b; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
            <p style="margin-top: 1rem;">Procesando actualización del perfil...</p>
        `;
        document.body.appendChild(loadingSpinner);

        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);

        setTimeout(() => {
            loadingOverlay.style.opacity = '1';
            loadingSpinner.style.opacity = '1';
        }, 10);

        loadingSpinner.style.opacity = '0';
        loadingSpinner.style.transition = 'opacity 0.3s ease';
    }

    function hideLoadingSpinner() {
        if (loadingOverlay && loadingSpinner) {
            loadingOverlay.style.opacity = '0';
            loadingSpinner.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(loadingOverlay);
                document.body.removeChild(loadingSpinner);
                loadingOverlay = null;
                loadingSpinner = null;
            }, 300);
        }
    }

    function formatDate(date) {
        if (!date) return 'No disponible';
        const d = new Date(date);
        const day = d.getDate();
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        return `${day} de ${month} de ${year}`;
    }

    function capitalizeFirstLetter(string) {
        if (!string) return 'No definido';
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }

    function showMessage(message, isError = true) {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
        overlay.style.zIndex = '2999';
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';
        document.body.appendChild(overlay);

        const messageDiv = document.createElement('div');
        messageDiv.style.position = 'fixed';
        messageDiv.style.top = '50%';
        messageDiv.style.left = '50%';
        messageDiv.style.transform = 'translate(-50%, -50%)';
        messageDiv.style.backgroundColor = '#fff';
        messageDiv.style.padding = '2rem';
        messageDiv.style.borderRadius = '12px';
        messageDiv.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
        messageDiv.style.zIndex = '3000';
        messageDiv.style.textAlign = 'center';
        messageDiv.style.fontFamily = "'Roboto', sans-serif";
        messageDiv.style.color = isError ? '#dc2626' : '#2b6b6b';
        messageDiv.innerHTML = `
            <h3 style="margin-bottom: 1rem;">${isError ? '¡Uy!' : '¡Éxito!'}</h3>
            <p>${message}</p>
            <button style="
                background: linear-gradient(135deg, #2b6b6b, #4c9f9f);
                color: white;
                border: none;
                padding: 0.8rem 1.5rem;
                border-radius: 8px;
                cursor: pointer;
                margin-top: 1rem;
                font-weight: 500;
            ">Aceptar</button>
        `;
        document.body.appendChild(messageDiv);

        setTimeout(() => {
            overlay.style.opacity = '1';
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translate(-50%, -50%)';
        }, 10);

        const acceptButton = messageDiv.querySelector('button');
        acceptButton.addEventListener('click', () => {
            overlay.style.opacity = '0';
            messageDiv.style.opacity = '0';
            messageDiv.style.transform = 'translate(-50%, -60%)';
            setTimeout(() => {
                document.body.removeChild(overlay);
                document.body.removeChild(messageDiv);
            }, 300);
        });

        messageDiv.style.opacity = '0';
        messageDiv.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    }

    function showUnsavedChangesWarning(callback) {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
        overlay.style.zIndex = '2999';
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';
        document.body.appendChild(overlay);

        const warningDiv = document.createElement('div');
        warningDiv.style.position = 'fixed';
        warningDiv.style.top = '50%';
        warningDiv.style.left = '50%';
        warningDiv.style.transform = 'translate(-50%, -50%)';
        warningDiv.style.backgroundColor = '#fff';
        warningDiv.style.padding = '2rem';
        warningDiv.style.borderRadius = '12px';
        warningDiv.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
        warningDiv.style.zIndex = '3000';
        warningDiv.style.textAlign = 'center';
        warningDiv.style.fontFamily = "'Roboto', sans-serif";
        warningDiv.style.color = '#2b6b6b';
        warningDiv.innerHTML = `
            <h3 style="margin-bottom: 1rem;">¡Atención!</h3>
            <p>¿Estás seguro de que deseas salir? Los cambios no guardados se perderán.</p>
            <div style="margin-top: 1rem; display: flex; gap: 1rem; justify-content: center;">
                <button id="exit-btn" style="
                    background: linear-gradient(135deg, #dc2626, #f87171);
                    color: white;
                    border: none;
                    padding: 0.8rem 1.5rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                ">Salir</button>
                <button id="cancel-btn" style="
                    background: linear-gradient(135deg, #2b6b6b, #4c9f9f);
                    color: white;
                    border: none;
                    padding: 0.8rem 1.5rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                ">Cancelar</button>
            </div>
        `;
        document.body.appendChild(warningDiv);

        setTimeout(() => {
            overlay.style.opacity = '1';
            warningDiv.style.opacity = '1';
            warningDiv.style.transform = 'translate(-50%, -50%)';
        }, 10);

        const exitButton = warningDiv.querySelector('#exit-btn');
        const cancelButton = warningDiv.querySelector('#cancel-btn');

        exitButton.addEventListener('click', () => {
            overlay.style.opacity = '0';
            warningDiv.style.opacity = '0';
            warningDiv.style.transform = 'translate(-50%, -60%)';
            setTimeout(() => {
                document.body.removeChild(overlay);
                document.body.removeChild(warningDiv);
                callback();
            }, 300);
        });

        cancelButton.addEventListener('click', () => {
            overlay.style.opacity = '0';
            warningDiv.style.opacity = '0';
            warningDiv.style.transform = 'translate(-50%, -60%)';
            setTimeout(() => {
                document.body.removeChild(overlay);
                document.body.removeChild(warningDiv);
            }, 300);
        });

        warningDiv.style.opacity = '0';
        warningDiv.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    }

    window.addEventListener('beforeunload', (event) => {
        if (hasUnsavedChanges) {
            const message = '¿Estás seguro de que deseas salir? Los cambios no guardados se perderán.';
            event.preventDefault();
            event.returnValue = message;
            return message;
        }
    });

    async function restoreDashboard() {
        mainContent.innerHTML = originalDashboardContent;
        if (typeof fetchStats === 'function') {
            await fetchStats();
        }
        if (typeof window.fetchNotifications === 'function') {
            await window.fetchNotifications();
        }
    }

    function renderProfileEditor() {
        mainContent.innerHTML = `
             <div class="profile-editor">
            <h1>Mi Perfil</h1>
            <div class="profile-sidebar">
                <div class="profile-picture-container">
                    <img id="profile-picture-preview" src="/img/default-profile.png" alt="Foto de perfil">
                    <div class="picture-buttons">
                        <input type="file" id="profile-picture" name="profilePicture" accept="image/jpeg,image/jpg,image/png" style="display: none;">
                        <button type="button" id="upload-picture-btn">Cambiar foto</button>
                        <button type="button" id="delete-picture-btn" style="display: none;">Eliminar foto</button>
                    </div>
                    <p class="error-message" id="picture-error"></p>
                </div>
            </div>
            
            <div class="profile-form-container">
                <form id="profile-form" class="profile-form">
                    <div class="form-group">
                        <label for="email">Correo Electrónico</label>
                        <input type="email" id="email" name="email" readonly>
                    </div>
                    <div class="form-group">
                        <label for="name">Nombre</label>
                        <input type="text" id="name" name="name" placeholder="Ingresa tu nombre" required>
                        <p class="error-message" id="name-error"></p>
                    </div>
                    <div class="form-group">
                        <label for="role">Rol</label>
                        <input type="text" id="role" name="role" readonly>
                    </div>
                    <div class="form-group">
                        <label for="created_at">Miembro desde</label>
                        <input type="text" id="created_at" name="created_at" readonly>
                    </div>
                    <div class="form-group">
                        <label for="phone">Teléfono</label>
                        <div class="phone-input-container">
                            <select id="phone-prefix" name="phone-prefix">
                                <option value="+57">Colombia (+57)</option>
                                <option value="+54">Argentina (+54)</option>
                                <option value="+591">Bolivia (+591)</option>
                                <option value="+55">Brasil (+55)</option>
                                <option value="+56">Chile (+56)</option>
                                <option value="+506">Costa Rica (+506)</option>
                                <option value="+53">Cuba (+53)</option>
                                <option value="+593">Ecuador (+593)</option>
                                <option value="+503">El Salvador (+503)</option>
                                <option value="+502">Guatemala (+502)</option>
                                <option value="+504">Honduras (+504)</option>
                                <option value="+52">México (+52)</option>
                                <option value="+505">Nicaragua (+505)</option>
                                <option value="+507">Panamá (+507)</option>
                                <option value="+595">Paraguay (+595)</option>
                                <option value="+51">Perú (+51)</option>
                                <option value="+1">Puerto Rico / Rep. Dominicana (+1)</option>
                                <option value="+598">Uruguay (+598)</option>
                                <option value="+58">Venezuela (+58)</option>
                            </select>
                            <input type="tel" id="phone-number" name="phone-number" placeholder="Número de teléfono" required>
                        </div>
                        <p class="error-message" id="phone-error"></p>
                    </div>
                    <div class="form-actions">
                        <button type="button" id="back-btn" class="action-btn secondary">Volver</button>
                        <button type="submit" class="action-btn">Guardar cambios</button>
                    </div>
                </form>
            </div>
        </div>
    `;

        loadUserProfile();

        const form = document.getElementById('profile-form');
        const nameInput = document.getElementById('name');
        const phonePrefixSelect = document.getElementById('phone-prefix');
        const phoneNumberInput = document.getElementById('phone-number');
        const pictureInput = document.getElementById('profile-picture');
        const uploadPictureBtn = document.getElementById('upload-picture-btn');
        const deletePictureBtn = document.getElementById('delete-picture-btn');
        const picturePreview = document.getElementById('profile-picture-preview');
        const backBtn = document.getElementById('back-btn');

        backBtn.addEventListener('click', () => {
            if (hasUnsavedChanges) {
                showUnsavedChangesWarning(() => {
                    hasUnsavedChanges = false;
                    toggleNavbarLinks(false);
                    restoreDashboard();
                });
            } else {
                restoreDashboard();
                toggleNavbarLinks(false);
            }
        });

        nameInput.addEventListener('input', () => {
            hasUnsavedChanges = true;
            toggleNavbarLinks(true);
            validateName();
        });

        phonePrefixSelect.addEventListener('change', () => {
            hasUnsavedChanges = true;
            toggleNavbarLinks(true);
            validatePhone();
        });

        phoneNumberInput.addEventListener('input', () => {
            hasUnsavedChanges = true;
            toggleNavbarLinks(true);
            validatePhone();
        });

        uploadPictureBtn.addEventListener('click', () => {
            pictureInput.click();
        });

        pictureInput.addEventListener('change', (event) => {
            hasUnsavedChanges = true;
            toggleNavbarLinks(true);
            const file = event.target.files[0];
            if (file) {
                validatePicture(file);
                const reader = new FileReader();
                reader.onload = (e) => {
                    picturePreview.src = e.target.result;
                    deletePictureBtn.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });

        deletePictureBtn.addEventListener('click', async () => {
            try {
                const email = localStorage.getItem('currentUserEmail');
                const response = await fetch(`/api/delete-profile-picture/${encodeURIComponent(email)}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Error al eliminar la foto de perfil');
                }

                const data = await response.json();
                if (data.success) {
                    picturePreview.src = '/img/default-profile.png';
                    deletePictureBtn.style.display = 'none';
                    pictureInput.value = '';
                    hasUnsavedChanges = true;
                    toggleNavbarLinks(true);
                    showMessage('Foto de perfil eliminada', false);
                } else {
                    showMessage(data.message || 'Error al eliminar la foto de perfil');
                }
            } catch (error) {
                console.error('Error al eliminar la foto:', error);
                showMessage(error.message || 'Error al eliminar la foto de perfil');
            }
        });

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!validateForm()) return;

            showLoadingSpinner();

            const formData = new FormData();
            formData.append('name', nameInput.value);
            formData.append('phone', phonePrefixSelect.value + phoneNumberInput.value);
            formData.append('email', localStorage.getItem('currentUserEmail'));
            if (pictureInput.files[0]) {
                formData.append('profilePicture', pictureInput.files[0]);
            }

            try {
                const response = await fetch('/api/update-profile', {
                    method: 'POST',
                    body: formData
                });

                hideLoadingSpinner();

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Error al actualizar el perfil');
                }

                const data = await response.json();
                if (data.success) {
                    hasUnsavedChanges = false;
                    toggleNavbarLinks(false);
                    currentProfileData = { name: nameInput.value, phone: phonePrefixSelect.value + phoneNumberInput.value, profilePicture: picturePreview.src };
                    showMessage('Perfil actualizado correctamente', false);
                } else {
                    showMessage(data.message || 'Error al actualizar el perfil');
                }
            } catch (error) {
                console.error('Error al guardar el perfil:', error);
                showMessage(error.message || 'Error al actualizar el perfil');
            }
        });
    }

    async function loadUserProfile() {
        try {
            const email = localStorage.getItem('currentUserEmail');
            if (!email) {
                showMessage('No se pudo identificar al usuario. Por favor, inicia sesión nuevamente.');
                return;
            }

            const response = await fetch(`/api/user-profile/${encodeURIComponent(email)}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Respuesta del servidor:', errorText);
                throw new Error(`Error ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('[DEBUG] Datos recibidos del backend:', data);

            if (data.success) {
                const nameInput = document.getElementById('name');
                const emailInput = document.getElementById('email');
                const roleInput = document.getElementById('role');
                const createdAtInput = document.getElementById('created_at');
                const phonePrefixSelect = document.getElementById('phone-prefix');
                const phoneNumberInput = document.getElementById('phone-number');
                const picturePreview = document.getElementById('profile-picture-preview');
                const deletePictureBtn = document.getElementById('delete-picture-btn');

                nameInput.value = data.name || '';
                emailInput.value = data.email || '';
                roleInput.value = capitalizeFirstLetter(data.role);
                createdAtInput.value = formatDate(data.created_at);

                if (data.phonePrefix && data.phoneNumber) {
                    console.log('[DEBUG] Asignando prefijo y número:', {
                        phonePrefix: data.phonePrefix,
                        phoneNumber: data.phoneNumber
                    });
                    phonePrefixSelect.value = data.phonePrefix;
                    phoneNumberInput.value = data.phoneNumber;
                } else {
                    console.log('[DEBUG] No se encontraron prefijo o número, usando valores por defecto');
                    phonePrefixSelect.value = '+57';
                    phoneNumberInput.value = '';
                }

                picturePreview.src = data.profilePicture || '/img/default-profile.png';
                if (data.profilePicture) {
                    deletePictureBtn.style.display = 'block';
                }

                currentProfileData = {
                    name: data.name || '',
                    phone: (data.phonePrefix || '+57') + (data.phoneNumber || ''),
                    profilePicture: data.profilePicture || '/img/default-profile.png'
                };
            } else {
                showMessage(data.message || 'Error al cargar los datos del perfil');
            }
        } catch (error) {
            console.error('Error al cargar el perfil:', error);
            showMessage('Error al cargar los datos del perfil: ' + error.message);
        }
    }

    function validateName() {
        const nameInput = document.getElementById('name');
        const nameError = document.getElementById('name-error');
        const name = nameInput.value.trim();
        const nameRegex = /^[A-Za-z\s]{1,50}$/;

        if (!name) {
            nameError.textContent = 'El nombre es obligatorio';
            return false;
        } else if (!nameRegex.test(name)) {
            nameError.textContent = 'El nombre solo puede contener letras y espacios (máx. 50 caracteres)';
            return false;
        } else {
            nameError.textContent = '';
            return true;
        }
    }

    function validatePhone() {
        const phonePrefixSelect = document.getElementById('phone-prefix');
        const phoneNumberInput = document.getElementById('phone-number');
        const phoneError = document.getElementById('phone-error');
        const prefix = phonePrefixSelect.value;
        const phoneNumber = phoneNumberInput.value.trim();
        const expectedLength = phoneFormats[prefix];

        if (!phoneNumber) {
            phoneError.textContent = 'El teléfono es obligatorio';
            return false;
        } else if (!/^\d+$/.test(phoneNumber)) {
            phoneError.textContent = 'El número debe contener solo dígitos';
            return false;
        } else if (phoneNumber.length !== expectedLength) {
            phoneError.textContent = `El número debe tener exactamente ${expectedLength} dígitos para el prefijo ${prefix}`;
            return false;
        } else {
            phoneError.textContent = '';
            return true;
        }
    }

    function validatePicture(file) {
        const pictureError = document.getElementById('picture-error');
        const allowedFormats = ['image/jpeg', 'image/jpg', 'image/png'];
        const maxSize = 5 * 1024 * 1024;

        if (!allowedFormats.includes(file.type)) {
            pictureError.textContent = 'Solo se permiten archivos JPG, JPEG o PNG';
            return false;
        } else if (file.size > maxSize) {
            pictureError.textContent = 'La imagen no debe exceder 5MB';
            return false;
        } else {
            pictureError.textContent = '';
            return true;
        }
    }

    function validateForm() {
        const isNameValid = validateName();
        const isPhoneValid = validatePhone();
        const pictureInput = document.getElementById('profile-picture');
        let isPictureValid = true;

        if (pictureInput.files[0]) {
            isPictureValid = validatePicture(pictureInput.files[0]);
        }

        return isNameValid && isPhoneValid && isPictureValid;
    }

    profileLink.addEventListener('click', (event) => {
        event.preventDefault();
        if (hasUnsavedChanges) {
            showUnsavedChangesWarning(() => {
                hasUnsavedChanges = false;
                renderProfileEditor();
            });
        } else {
            renderProfileEditor();
        }
    });

    dashboardLink.addEventListener('click', (event) => {
        event.preventDefault();
        if (hasUnsavedChanges) {
            showUnsavedChangesWarning(() => {
                hasUnsavedChanges = false;
                restoreDashboard();
            });
        } else {
            restoreDashboard();
        }
    });

    menuLinks.forEach(link => {
        if (link.getAttribute('href') !== 'perfil' && link.getAttribute('href') !== 'dashboard') {
            link.addEventListener('click', (event) => {
                if (hasUnsavedChanges) {
                    event.preventDefault();
                    showUnsavedChangesWarning(() => {
                        hasUnsavedChanges = false;
                        window.location.href = link.getAttribute('href');
                    });
                }
            });
        }
    });
});

// Nuevo bloque para la funcionalidad de Acuerdo y Eliminar Cuenta
document.addEventListener('DOMContentLoaded', function() {
    // Variables del DOM
    const mainContent = document.getElementById('main-content');
    const agreementLink = document.querySelector('a[href="configuracion"]');
    const originalDashboardContent = mainContent.innerHTML; // Almacenar el contenido original del dashboard

    // Variables para el loading spinner
    let loadingOverlay = null;
    let loadingSpinner = null;

    // Función para mostrar el loading spinner
    function showLoadingSpinner() {
        loadingOverlay = document.createElement('div');
        loadingOverlay.style.position = 'fixed';
        loadingOverlay.style.top = '0';
        loadingOverlay.style.left = '0';
        loadingOverlay.style.width = '100%';
        loadingOverlay.style.height = '100%';
        loadingOverlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
        loadingOverlay.style.zIndex = '2998';
        loadingOverlay.style.opacity = '0';
        loadingOverlay.style.transition = 'opacity 0.3s ease';
        loadingOverlay.style.pointerEvents = 'auto'; // Bloquea interacciones
        document.body.appendChild(loadingOverlay);

        loadingSpinner = document.createElement('div');
        loadingSpinner.style.position = 'fixed';
        loadingSpinner.style.top = '50%';
        loadingSpinner.style.left = '50%';
        loadingSpinner.style.transform = 'translate(-50%, -50%)';
        loadingSpinner.style.backgroundColor = '#fff';
        loadingSpinner.style.padding = '2rem';
        loadingSpinner.style.borderRadius = '12px';
        loadingSpinner.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
        loadingSpinner.style.zIndex = '2999';
        loadingSpinner.style.textAlign = 'center';
        loadingSpinner.style.fontFamily = "'Roboto', sans-serif";
        loadingSpinner.style.color = '#2b6b6b';
        loadingSpinner.innerHTML = `
            <div style="border: 4px solid #f3f3f3; border-top: 4px solid #2b6b6b; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
            <p style="margin-top: 1rem;">Procesando eliminación de cuenta...</p>
        `;
        document.body.appendChild(loadingSpinner);

        // Animación CSS para el spinner
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);

        setTimeout(() => {
            loadingOverlay.style.opacity = '1';
            loadingSpinner.style.opacity = '1';
        }, 10);

        loadingSpinner.style.opacity = '0';
        loadingSpinner.style.transition = 'opacity 0.3s ease';
    }

    // Función para ocultar el loading spinner
    function hideLoadingSpinner() {
        if (loadingOverlay && loadingSpinner) {
            loadingOverlay.style.opacity = '0';
            loadingSpinner.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(loadingOverlay);
                document.body.removeChild(loadingSpinner);
                loadingOverlay = null;
                loadingSpinner = null;
            }, 300);
        }
    }

    // Función para mostrar mensajes
    function showMessage(message, isError = true, callback = null) {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
        overlay.style.zIndex = '2999';
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';
        document.body.appendChild(overlay);

        const messageDiv = document.createElement('div');
        messageDiv.style.position = 'fixed';
        messageDiv.style.top = '50%';
        messageDiv.style.left = '50%';
        messageDiv.style.transform = 'translate(-50%, -50%)';
        messageDiv.style.backgroundColor = '#fff';
        messageDiv.style.padding = '2rem';
        messageDiv.style.borderRadius = '12px';
        messageDiv.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
        messageDiv.style.zIndex = '3000';
        messageDiv.style.textAlign = 'center';
        messageDiv.style.fontFamily = "'Roboto', sans-serif";
        messageDiv.style.color = isError ? '#dc2626' : '#2b6b6b';
        messageDiv.innerHTML = `
            <h3 style="margin-bottom: 1rem;">${isError ? '¡Uy!' : '¡Éxito!'}</h3>
            <p>${message}</p>
            <button style="
                background: linear-gradient(135deg, #2b6b6b, #4c9f9f);
                color: white;
                border: none;
                padding: 0.8rem 1.5rem;
                border-radius: 8px;
                cursor: pointer;
                margin-top: 1rem;
                font-weight: 500;
            ">Aceptar</button>
        `;
        document.body.appendChild(messageDiv);

        setTimeout(() => {
            overlay.style.opacity = '1';
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translate(-50%, -50%)';
        }, 10);

        const acceptButton = messageDiv.querySelector('button');
        acceptButton.addEventListener('click', () => {
            overlay.style.opacity = '0';
            messageDiv.style.opacity = '0';
            messageDiv.style.transform = 'translate(-50%, -60%)';
            setTimeout(() => {
                document.body.removeChild(overlay);
                document.body.removeChild(messageDiv);
                if (callback) callback();
            }, 300);
        });

        messageDiv.style.opacity = '0';
        messageDiv.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    }

    // Función para mostrar la advertencia de eliminación de cuenta
    function showDeleteWarning(callback) {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
        overlay.style.zIndex = '2999';
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';
        document.body.appendChild(overlay);

        const warningDiv = document.createElement('div');
        warningDiv.style.position = 'fixed';
        warningDiv.style.top = '50%';
        warningDiv.style.left = '50%';
        warningDiv.style.transform = 'translate(-50%, -50%)';
        warningDiv.style.backgroundColor = '#fff';
        warningDiv.style.padding = '2rem';
        warningDiv.style.borderRadius = '12px';
        warningDiv.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
        warningDiv.style.zIndex = '3000';
        warningDiv.style.textAlign = 'center';
        warningDiv.style.fontFamily = "'Roboto', sans-serif";
        warningDiv.style.color = '#2b6b6b';
        warningDiv.innerHTML = `
            <h3 style="margin-bottom: 1rem;">¡Atención!</h3>
            <p>¿Estás seguro de que deseas eliminar tu cuenta? Esta acción es irreversible y todos tus datos serán eliminados permanentemente.</p>
            <div style="margin-top: 1rem; display: flex; gap: 1rem; justify-content: center;">
                <button id="confirm-btn" style="
                    background: linear-gradient(135deg, #dc2626, #f87171);
                    color: white;
                    border: none;
                    padding: 0.8rem 1.5rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                ">Confirmar</button>
                <button id="cancel-btn" style="
                    background: linear-gradient(135deg, #2b6b6b, #4c9f9f);
                    color: white;
                    border: none;
                    padding: 0.8rem 1.5rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                ">Cancelar</button>
            </div>
        `;
        document.body.appendChild(warningDiv);

        setTimeout(() => {
            overlay.style.opacity = '1';
            warningDiv.style.opacity = '1';
            warningDiv.style.transform = 'translate(-50%, -50%)';
        }, 10);

        const confirmButton = warningDiv.querySelector('#confirm-btn');
        const cancelButton = warningDiv.querySelector('#cancel-btn');

        confirmButton.addEventListener('click', () => {
            overlay.style.opacity = '0';
            warningDiv.style.opacity = '0';
            warningDiv.style.transform = 'translate(-50%, -60%)';
            setTimeout(() => {
                document.body.removeChild(overlay);
                document.body.removeChild(warningDiv);
                callback();
            }, 300);
        });

        cancelButton.addEventListener('click', () => {
            overlay.style.opacity = '0';
            warningDiv.style.opacity = '0';
            warningDiv.style.transform = 'translate(-50%, -60%)';
            setTimeout(() => {
                document.body.removeChild(overlay);
                document.body.removeChild(warningDiv);
            }, 300);
        });

        warningDiv.style.opacity = '0';
        warningDiv.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    }

    // Función para restaurar el dashboard
    async function restoreDashboard() {
        mainContent.innerHTML = originalDashboardContent;
        // Volver a cargar las estadísticas y notificaciones
        if (typeof fetchTenantStats === 'function') {
            await fetchTenantStats();
        }
        if (typeof window.fetchNotifications === 'function') {
            await window.fetchNotifications();
        }
    }

    // Función para obtener el rol del usuario
    async function getUserRole() {
        try {
            const email = localStorage.getItem('currentUserEmail');
            if (!email) {
                showMessage('No se pudo identificar al usuario. Por favor, inicia sesión nuevamente.');
                return null;
            }

            const response = await fetch(`/api/user-profile/${encodeURIComponent(email)}`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            if (data.success) {
                return data.role;
            } else {
                showMessage(data.message || 'Error al obtener el rol del usuario');
                return null;
            }
        } catch (error) {
            console.error('Error al obtener el rol:', error);
            showMessage('Error al obtener el rol del usuario');
            return null;
        }
    }

    // Función para renderizar la sección de Acuerdo y Eliminar Cuenta
    async function renderAgreementAndDelete() {
        // Obtener el rol del usuario
        const role = await getUserRole();
        if (!role) return;

        // Contenido específico según el rol
        let roleContent = '';
        if (role === 'arrendador') {
            roleContent = `
                <h2>Guía del Arrendatario</h2>
                <p>Como arrendador en ArrendaFacil, tienes la posibilidad de publicar tus propiedades de manera sencilla y eficiente. Nuestra plataforma está diseñada para ayudarte a encontrar arrendatarios rápidamente, ofreciendo herramientas para optimizar tu experiencia y maximizar tus oportunidades de alquiler.</p>

                <h3>Guía para Publicar Propiedades</h3>
                <p>Publicar una propiedad en ArrendaFacil es un proceso fácil y rápido. Sigue estos pasos para crear una publicación atractiva:</p>
                <ul>
                    <li>Incluye fotos de alta calidad que muestren los mejores aspectos de tu propiedad (interiores, exteriores, áreas comunes).</li>
                    <li>Escribe una descripción detallada: menciona la ubicación, servicios incluidos (agua, luz, internet), y cualquier restricción (mascotas, fumadores).</li>
                    <li>Establece un precio competitivo basado en el mercado local para atraer más interesados.</li>
                </ul>
                <p>Una buena publicación puede marcar la diferencia y atraer a arrendatarios serios en menos tiempo.</p>

                <h3>Consejos para Gestionar Arrendatarios</h3>
                <p>Interactuar con arrendatarios es clave para cerrar un contrato exitoso. Aquí tienes algunos consejos prácticos:</p>
                <ul>
                    <li>Responde rápidamente a las consultas para mantener el interés del arrendatario.</li>
                    <li>Programa visitas en horarios que sean convenientes para ambas partes.</li>
                    <li>Verifica la información del arrendatario, como referencias o historial crediticio, para garantizar una transacción segura.</li>
                </ul>

                <h3>Aspectos Legales y de Seguridad</h3>
                <p>En ArrendaFacil, nos preocupamos por tu seguridad. Por eso, ofrecemos herramientas para verificar la identidad de los arrendatarios. Además, te recomendamos:</p>
                <ul>
                    <li>Firmar un contrato de arrendamiento claro que proteja tus derechos como arrendador.</li>
                    <li>Documentar el estado de la propiedad antes y después del alquiler con fotos y un inventario.</li>
                    <li>Estar al tanto de las leyes locales sobre arrendamiento para evitar problemas legales.</li>
                </ul>

                <h3>Soporte y Recursos</h3>
                <p>Si tienes dudas o necesitas asistencia para crear una publicación, nuestro equipo de soporte está disponible para ayudarte. Contáctanos en <a href="mailto:soportearrendafacil@gmail.com">soportearrendafacil@gmail.com</a> o a través de nuestro chat en línea. También puedes visitar nuestra sección de Preguntas Frecuentes para más información.</p>
            `;
        } else if (role === 'arrendatario') {
            roleContent = `
                <h2>Tu Rol como Arrendatario</h2>
                <p>Como arrendatario en ArrendaFacil, puedes buscar y encontrar la propiedad perfecta para ti. Nuestra plataforma te conecta con arrendadores confiables y te ofrece una experiencia de búsqueda personalizada para que encuentres el hogar ideal sin complicaciones.</p>

                <h3>Cómo Buscar Propiedades Eficientemente</h3>
                <p>ArrendaFacil te ofrece herramientas para facilitar tu búsqueda. Aquí tienes algunos consejos:</p>
                <ul>
                    <li>Usa nuestros filtros para buscar por ubicación, rango de precio, número de habitaciones, y otros criterios importantes para ti.</li>
                    <li>Guarda tus propiedades favoritas en tu lista para compararlas más tarde y no perder de vista las mejores opciones.</li>
                    <li>Revisa las fotos y descripciones detalladamente para asegurarte de que la propiedad cumple con tus expectativas.</li>
                </ul>

                <h3>Pasos para Contactar Arrendadores</h3>
                <p>Una vez que encuentres una propiedad que te guste, sigue estos pasos para contactar al arrendador:</p>
                <ul>
                    <li>Envía un mensaje al arrendador directamente desde la plataforma para expresar tu interés.</li>
                    <li>Prepárate para responder preguntas sobre tu perfil, como tu empleo o necesidades específicas (por ejemplo, si tienes mascotas).</li>
                    <li>Coordina una visita para conocer la propiedad en persona antes de tomar una decisión.</li>
                </ul>

                <h3>Consejos para un Alquiler Seguro</h3>
                <p>Queremos que tu experiencia sea segura y positiva. Aquí tienes algunas recomendaciones:</p>
                <ul>
                    <li>Verifica la identidad del arrendador y asegúrate de que la propiedad existe antes de realizar cualquier pago.</li>
                    <li>Revisa el contrato de arrendamiento cuidadosamente antes de firmar, y no dudes en preguntar si algo no está claro.</li>
                    <li>Si tienes dudas legales, busca asesoría para proteger tus derechos como arrendatario.</li>
                </ul>

                <h3>Soporte y Recursos</h3>
                <p>Si necesitas ayuda para encontrar una propiedad o tienes dudas sobre el proceso de alquiler, nuestro equipo de soporte está aquí para ayudarte. Contáctanos en <a href="mailto:soportearrendafacil@gmail.com">soportearrendafacil@gmail.com</a>. También puedes explorar nuestra sección de Preguntas Frecuentes para más información.</p>
            `;
        } else {
            roleContent = `
                <h2>Información de tu Rol</h2>
                <p>No se pudo determinar tu rol en la plataforma. Por favor, contacta a soporte en <a href="mailto:soportearrendafacil@gmail.com">soportearrendafacil@gmail.com</a>.</p>
            `;
        }

        mainContent.innerHTML = `
            <div class="agreement-editor">
                <h1>Acuerdo</h1>
                <div class="agreement-section">
                    ${roleContent}

                    <h2>Nuestro Equipo Desarrollador</h2>
                    <p>ArrendaFacil fue creada con dedicación por un equipo de desarrolladores apasionados por facilitar el proceso de alquiler de propiedades. Queremos agradecer a los siguientes miembros de nuestro equipo:</p>
                    <ul>
                        <li>Andre Rodriguez</li>
                        <li>Sebastian Delgado</li>
                        <li>Dilan Cano</li>
                        <li>Santiago Torrealba</li>
                        <li>Eduardo Burbano</li>
                        <li>Juan David Burbano</li>
                    </ul>
                    <p>Gracias a su esfuerzo, ArrendaFacil es una plataforma confiable y fácil de usar para arrendadores y arrendatarios. Si tienes sugerencias o comentarios sobre la aplicación, no dudes en escribirnos a <a href="mailto:soporte@arrendafacil.com">soporte@arrendafacil.com</a>.</p>
                </div>
                <div class="delete-account-section">
                    <h2>Eliminar Cuenta</h2>
                    <p>Estamos comprometidos a hacer tu experiencia en ArrendaFacil lo mejor posible. Sin embargo, si decides que ya no deseas formar parte de nuestra comunidad, puedes eliminar tu cuenta a continuación. Recuerda que esta acción es irreversible y todos tus datos serán eliminados permanentemente.</p>
                </div>
                <div class="form-actions">
                    <button id="delete-account-btn" class="action-btn danger">Eliminar mi cuenta</button>
                    <button type="button" id="back-btn" class="action-btn secondary">Volver</button>
                </div>
            </div>
        `;

        const deleteAccountBtn = document.getElementById('delete-account-btn');
        const backBtn = document.getElementById('back-btn');

        // Botón "Volver"
        backBtn.addEventListener('click', () => {
            restoreDashboard();
        });

        // Botón "Eliminar Cuenta"
        deleteAccountBtn.addEventListener('click', () => {
            showDeleteWarning(async () => {
                // Mostrar el loading spinner antes de iniciar la solicitud
                showLoadingSpinner();

                try {
                    const email = localStorage.getItem('currentUserEmail');
                    if (!email) {
                        hideLoadingSpinner();
                        showMessage('No se pudo identificar al usuario. Por favor, inicia sesión nuevamente.');
                        return;
                    }

                    const response = await fetch(`/api/delete-account/${encodeURIComponent(email)}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Error al eliminar la cuenta');
                    }

                    const data = await response.json();
                    if (data.success) {
                        hideLoadingSpinner();
                        showMessage('Tu cuenta ha sido eliminada correctamente. Serás redirigido al inicio de sesión.', false, () => {
                            // Limpiar localStorage y redirigir al inicio de sesión
                            localStorage.removeItem('currentUserEmail');
                            window.location.href = '/login'; // Ajusta la URL según tu ruta de inicio de sesión
                        });
                    } else {
                        hideLoadingSpinner();
                        showMessage(data.message || 'Error al eliminar la cuenta');
                    }
                } catch (error) {
                    console.error('Error al eliminar la cuenta:', error);
                    hideLoadingSpinner();
                    showMessage(error.message || 'Error al eliminar la cuenta');
                }
            });
        });
    }

    // Event listener para el enlace "Configuración" (usado para Acuerdo y Eliminar Cuenta)
    agreementLink.addEventListener('click', (event) => {
        event.preventDefault();
        renderAgreementAndDelete();
    });
});

//Bloque notificaciones, publicaciones, conversaciones (Estadisticas)
document.addEventListener('DOMContentLoaded', function() {
    // DOM Variables
    const mainContent = document.getElementById('main-content');
    const searchPropertiesLink = document.querySelector('a[href="buscar-propiedades"]');
    const dashboardLink = document.querySelector('a[href="dashboard"]');
    const conversationsLink = document.querySelector('a[href="conversations"]');
    const originalDashboardContent = mainContent ? mainContent.innerHTML : '';
    let loadingOverlay = null;
    let loadingSpinner = null;


    // Show message (error or success)
    function showMessage(message, isError = true, container = null) {
        if (container) {
            const existingMessage = container.querySelector('.message-div');
            if (existingMessage) existingMessage.remove();
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message-div';
            messageDiv.style.cssText = `
                background: #fff; padding: 1rem; border-radius: 8px; text-align: center;
                font-family: 'Roboto', sans-serif; color: ${isError ? '#dc2626' : '#2b6b6b'};
                margin-bottom: 1rem; opacity: 0; transition: opacity 0.3s ease;
            `;
            messageDiv.innerHTML = `
                <h3 style="margin-bottom: 0.5rem;">${isError ? '¡Uy!' : '¡Éxito!'}</h3>
                <p>${message}</p>
            `;
            container.insertBefore(messageDiv, container.querySelector('form'));
            setTimeout(() => messageDiv.style.opacity = '1', 10);
        } else {
            const existingOverlays = document.querySelectorAll('div[style*="z-index: 2999"], div[style*="z-index: 3000"]');
            existingOverlays.forEach(overlay => document.body.contains(overlay) && document.body.removeChild(overlay));
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.5); z-index: 2999; opacity: 0;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(overlay);
            const messageDiv = document.createElement('div');
            messageDiv.style.cssText = `
                position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                background: #fff; padding: 2rem; border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 3000; text-align: center;
                font-family: 'Roboto', sans-serif; color: ${isError ? '#dc2626' : '#2b6b6b'};
                opacity: 0; transition: opacity 0.3s ease, transform 0.3s ease;
            `;
            messageDiv.innerHTML = `
                <h3 style="margin-bottom: 1rem;">${isError ? '¡Uy!' : '¡Éxito!'}</h3>
                <p>${message}</p>
                <button style="
                    background: linear-gradient(135deg, #2b6b6b, #4c9f9f); color: white;
                    border: none; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer;
                    margin-top: 1rem; font-weight: 500;
                ">Aceptar</button>
            `;
            document.body.appendChild(messageDiv);
            setTimeout(() => {
                overlay.style.opacity = '1';
                messageDiv.style.opacity = '1';
            }, 10);
            messageDiv.querySelector('button').addEventListener('click', () => {
                overlay.style.opacity = '0';
                messageDiv.style.opacity = '0';
                messageDiv.style.transform = 'translate(-50%, -60%)';
                setTimeout(() => {
                    document.body.contains(overlay) && document.body.removeChild(overlay);
                    document.body.contains(messageDiv) && document.body.removeChild(messageDiv);
                }, 300);
            });
        }
    }

    // Show loading spinner
    function showLoadingSpinner() {
        loadingOverlay = document.createElement('div');
        loadingOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); z-index: 2998; opacity: 0;
            transition: opacity 0.3s ease; pointer-events: auto;
        `;
        document.body.appendChild(loadingOverlay);
        loadingSpinner = document.createElement('div');
        loadingSpinner.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: #fff; padding: 2rem; border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 2999; text-align: center;
            font-family: 'Roboto', sans-serif; color: #2b6b6b; opacity: 0;
            transition: opacity 0.3s ease;
        `;
        loadingSpinner.innerHTML = `
            <div style="border: 4px solid #f3f3f3; border-top: 4px solid #2b6b6b; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
            <p style="margin-top: 1rem;">Cargando...</p>
        `;
        document.body.appendChild(loadingSpinner);
        const style = document.createElement('style');
        style.innerHTML = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
        document.head.appendChild(style);
        setTimeout(() => {
            loadingOverlay.style.opacity = '1';
            loadingSpinner.style.opacity = '1';
        }, 10);
        return { overlay: loadingOverlay, spinner: loadingSpinner };
    }

    // Hide loading spinner
    function hideLoadingSpinner(elements) {
        if (elements?.overlay && elements?.spinner) {
            elements.overlay.style.opacity = '0';
            elements.spinner.style.opacity = '0';
            setTimeout(() => {
                document.body.contains(elements.overlay) && document.body.removeChild(elements.overlay);
                document.body.contains(elements.spinner) && document.body.removeChild(elements.spinner);
                loadingOverlay = null;
                loadingSpinner = null;
            }, 300);
        }
    }

    // Fetch notifications
    async function fetchNotifications() {
        const notificationsList = document.getElementById('notifications-list');
        if (!notificationsList) {
            console.log('No se encontró #notifications-list');
            return;
        }
        console.log('Solicitando notificaciones para:', localStorage.getItem('currentUserEmail'));
        try {
            const response = await fetch('/api/publications/tenant/notifications', {
                method: 'GET',
                headers: { 'x-user-email': localStorage.getItem('currentUserEmail') || '' }
            });
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            const data = await response.json();
            notificationsList.innerHTML = '';
            if (!data.success || !data.notifications || data.notifications.length === 0) {
                notificationsList.innerHTML = `
                    <div class="no-notifications">
                        <span>🔔</span>
                        <p>Aún no tienes notificaciones nuevas.</p>
                    </div>
                `;
                return;
            }
            const unreadNotifications = data.notifications.filter(n => !n.read);
            if (unreadNotifications.length === 0) {
                notificationsList.innerHTML = `
                    <div class="no-notifications">
                        <span>🔔</span>
                        <p>Aún no tienes notificaciones nuevas.</p>
                    </div>
                `;
                return;
            }
            const style = document.createElement('style');
            style.innerHTML = `
                .notifications-section { background: #fff; border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
                .notifications-section h2 { font-family: 'Roboto', sans-serif; color: #2b6b6b; font-size: 1.5rem; margin-bottom: 1rem; }
                .notification-card { display: flex; align-items: center; padding: 1rem; border-bottom: 1px solid #e5e7eb; font-family: 'Roboto', sans-serif; color: #374151; transition: background 0.3s ease; }
                .notification-card:last-child { border-bottom: none; }
                .notification-card.unread { background: #e6f0fa; font-weight: 500; }
                .notification-icon { font-size: 1.5rem; margin-right: 1rem; }
                .notification-card p { flex: 1; margin: 0; font-size: 0.9rem; line-height: 1.5; }
                .notification-action-btn { background: linear-gradient(135deg, #2b6b6b, #4c9f9f); color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-family: 'Roboto', sans-serif; font-size: 0.85rem; font-weight: 500; transition: background 0.3s ease; }
                .notification-action-btn:hover { background: linear-gradient(135deg, #4c9f9f, #2b6b6b); }
                .no-notifications { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; font-size: 1.2rem; color: #6b7280; padding: 2rem; width: 100%; }
                .no-notifications span { font-size: 3rem; margin-bottom: 0.5rem; }
                .no-notifications p { margin-top: 0.5rem; font-style: italic; font-size: 1rem; }
                .no-notifications.error { color: #dc2626; }
                @media (max-width: 768px) { .notifications-section { padding: 1rem; } .notification-card { flex-direction: column; align-items: flex-start; gap: 0.5rem; } .notification-action-btn { width: 100%; text-align: center; } .no-notifications { padding: 1.5rem; font-size: 1rem; } .no-notifications span { font-size: 2.5rem; } .no-notifications p { font-size: 0.9rem; } }
                @media (max-width: 480px) { .notifications-section { padding: 0.75rem; } .notification-card p { font-size: 0.85rem; } .notification-action-btn { padding: 0.4rem 0.8rem; font-size: 0.8rem; } .no-notifications { padding: 1rem; font-size: 0.9rem; } .no-notifications span { font-size: 2rem; } .no-notifications p { font-size: 0.8rem; } }
            `;
            document.head.appendChild(style);
            unreadNotifications.forEach(notification => {
                const notificationCard = document.createElement('div');
                notificationCard.className = `notification-card ${notification.read ? '' : 'unread'}`;
                let icon = '🔔', actionText = 'Ok';
                switch (notification.type) {
                    case 'message':
                        icon = '✉️';
                        actionText = 'Ver Mensaje';
                        break;
                    case 'publication_deleted':
                        icon = '🗑️';
                        actionText = 'Ok';
                        break;
                    case 'report_accepted':
                        icon = '👌';
                        actionText = 'Ok';
                        break;
                    case 'report_rejected':
                        icon = '😔';
                        actionText = 'Ok';
                        break;
                    case 'agreement_pending':
                        icon = '📝';
                        actionText = 'Ok';
                        break;
                    case 'contract_uploaded':
                        icon = '📤';
                        actionText = 'Ok';
                        break;
                    case 'contract_accepted':
                        icon = '🆗';
                        actionText = 'Ok';
                        break;
                     case 'opportunity_lost':
                        icon = '😔';
                        actionText = 'Ok';
                        break;
                      case 'agreement_expired':
                        icon = '⏰';
                        actionText = 'Ok';
                        break;
                    case 'agreement_updated':
                        icon = '♻️';
                        actionText = 'Ok';
                        break;
                     case 'agreement_cancelled':
                        icon = '❌';
                        actionText = 'Ok';
                        break;
                     case 'rating_received':
                        icon = '⭐';
                        actionText = 'Ok';
                        break;
                     case 'contract_rejected':
                        icon = '🚫';
                        actionText = 'Ok';
                        break;     
                }
                notificationCard.innerHTML = `
                    <span class="notification-icon">${icon}</span>
                    <p>${notification.message}</p>
                    <button class="notification-action-btn" data-id="${notification.id}" data-action="${notification.action_url || '#'}">${actionText}</button>
                `;
                notificationsList.appendChild(notificationCard);
                const actionBtn = notificationCard.querySelector('.notification-action-btn');
                actionBtn.addEventListener('click', async () => {
                    const elements = showLoadingSpinner();
                    try {
                        // Marcar la notificación como leída
                        await markNotificationAsRead(notification.id);
                        notificationCard.remove();
                        if (!notificationsList.querySelector('.notification-card')) {
                            notificationsList.innerHTML = `
                                <div class="no-notifications">
                                    <span>🔔</span>
                                    <p>Aún no tienes notificaciones nuevas.</p>
                                </div>
                            `;
                        }
                        if (notification.type === 'message' && notification.action_url && notification.action_url !== '#') {
                            console.log('Procesando notificación de mensaje:', {
                                action_url: notification.action_url,
                                notification_id: notification.id
                            });
                            // Validar la URL de la notificación
                            if (!notification.action_url.includes('/conversations/')) {
                                throw new Error('La URL de la notificación no contiene un ID de conversación válido');
                            }
                            // Extraer el ID de la conversación
                            const conversationIdMatch = notification.action_url.match(/\/conversations\/(\d+)/);
                            const conversationId = conversationIdMatch ? conversationIdMatch[1] : null;
                            if (!conversationId) {
                                throw new Error('Formato de URL inválido para la conversación');
                            }
                            console.log('Conversation ID extraído:', conversationId);
                            // Obtener detalles de la conversación usando el endpoint para arrendatario
                            const userEmail = localStorage.getItem('currentUserEmail') || '';
                            if (!userEmail) {
                                throw new Error('Por favor, inicia sesión nuevamente');
                            }
                            const conversationResponse = await fetch(`/api/conversations/tenant/${conversationId}`, {
                                method: 'GET',
                                headers: { 'x-user-email': userEmail }
                            });
                            console.log('Respuesta de /api/conversations/tenant/:id:', {
                                status: conversationResponse.status,
                                ok: conversationResponse.ok
                            });
                            let conversationData;
                            try {
                                conversationData = await conversationResponse.json();
                                console.log('Datos de la conversación:', conversationData);
                            } catch (jsonError) {
                                console.error('Error al parsear JSON:', jsonError);
                                throw new Error('Respuesta del servidor no válida');
                            }
                            if (!conversationResponse.ok || !conversationData.success || !conversationData.conversation) {
                                console.warn(`Conversación ${conversationId} no encontrada. Marcando notificación como leída.`);
                                showMessage('Esta conversación ya no está disponible.', true);
                                // Marcar todas las notificaciones relacionadas como leídas
                                const relatedNotifications = unreadNotifications.filter(n =>
                                    n.type === 'message' && n.action_url.includes(`/conversations/${conversationId}`)
                                );
                                for (const relatedNotification of relatedNotifications) {
                                    try {
                                        await markNotificationAsRead(relatedNotification.id);
                                        const card = notificationsList.querySelector(`.notification-action-btn[data-id="${relatedNotification.id}"]`)?.parentElement;
                                        if (card) card.remove();
                                    } catch (readError) {
                                        console.error(`Error al marcar notificación ${relatedNotification.id} como leída:`, readError);
                                    }
                                }
                                // Actualizar la lista si no quedan notificaciones
                                if (!notificationsList.querySelector('.notification-card')) {
                                    notificationsList.innerHTML = `
                                        <div class="no-notifications">
                                            <span>🔔</span>
                                            <p>Aún no tienes notificaciones nuevas.</p>
                                        </div>
                                    `;
                                }
                                return; // Salir sin abrir la conversación
                            }
                            const conversation = conversationData.conversation;
                            // Validar datos necesarios para abrir la conversación
                            if (!conversation.id || !conversation.publication_id || !conversation.landlord_email || !conversation.publication_title) {
                                throw new Error('Datos de la conversación incompletos');
                            }
                            // Preparar objetos landlord y publication
                            const landlord = {
                                email: conversation.landlord_email,
                                full_name: conversation.landlord_name || 'Arrendador desconocido',
                                profile_picture: conversation.landlord_profile_picture || '/img/default-profile.png'
                            };
                            const publication = {
                                title: conversation.publication_title || 'Publicación desconocida'
                            };
                            console.log('Abriendo conversación con datos:', { conversationId, landlord, publication });
                            // Abrir la conversación
                            await openConversation(
                                conversation.id,
                                conversation.publication_id,
                                landlord,
                                publication
                            );
                            // Marcar como leídas todas las notificaciones relacionadas con esta conversación
                            const relatedNotifications = unreadNotifications.filter(n =>
                                n.type === 'message' && n.action_url.includes(`/conversations/${conversationId}`)
                            );
                            for (const relatedNotification of relatedNotifications) {
                                try {
                                    await markNotificationAsRead(relatedNotification.id);
                                    const card = notificationsList.querySelector(`.notification-action-btn[data-id="${relatedNotification.id}"]`)?.parentElement;
                                    if (card) card.remove();
                                } catch (readError) {
                                    console.error(`Error al marcar notificación ${relatedNotification.id} como leída:`, readError);
                                }
                            }
                            // Verificar si quedan notificaciones
                            if (!notificationsList.querySelector('.notification-card')) {
                                notificationsList.innerHTML = `
                                    <div class="no-notifications">
                                        <span>🔔</span>
                                        <p>Aún no tienes notificaciones nuevas.</p>
                                    </div>
                                `;
                            }
                        } else if (notification.action_url && notification.action_url !== '#') {
                            await fetchNotifications();
                        }
                    } catch (error) {
                        console.error('Error al procesar la notificación:', error.message, error.stack);
                        showMessage(`Error al abrir la conversación: ${error.message}`, true);
                    } finally {
                        hideLoadingSpinner(elements);
                    }
                });
            });
        } catch (error) {
            console.error('Error al cargar notificaciones:', error.message, error.stack);
            notificationsList.innerHTML = `<p class="no-notifications error">Error al cargar notificaciones: ${error.message}</p>`;
        }
    }

    // Mark notification as read
    async function markNotificationAsRead(notificationId) {
        try {
            const response = await fetch(`/api/publications/tenant/notifications/${notificationId}/read`, {
                method: 'PATCH',
                headers: { 'x-user-email': localStorage.getItem('currentUserEmail') || '' }
            });
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        } catch (error) {
            console.error('Error marcando notificación como leída:', error);
        }
    }

    // Open report modal
    function openReportModal(publicationId, publicationTitle) {
        const modalOverlay = document.createElement('div');
        modalOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); z-index: 3000; display: flex;
            justify-content: center; align-items: center; opacity: 0;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(modalOverlay);
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: #fff; border-radius: 12px; padding: 2rem; width: 100%;
            max-width: 500px; box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            font-family: 'Roboto', sans-serif; color: #374151; opacity: 0;
            transition: opacity 0.3s ease;
        `;
        modalContent.innerHTML = `
            <h2 style="font-size: 1.5rem; color: #2b6b6b; margin-bottom: 1rem;">
                Reportar Publicación: ${publicationTitle}
            </h2>
            <form id="report-form">
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; font-weight: 500; margin-bottom: 0.5rem;">Motivo del Reporte</label>
                    <select id="report-reason" style="width: 100%; padding: 0.8rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.9rem;" required>
                        <option value="" disabled selected>Selecciona un motivo</option>
                        <option value="contenido_inapropiado">Contenido Inapropiado</option>
                        <option value="informacion_falsa">Información Falsa</option>
                        <option value="estafa">Posible Estafa</option>
                        <option value="otro">Otro</option>
                    </select>
                    <p id="reason-error" style="color: #dc2626; font-size: 0.8rem; margin-top: 0.25rem; display: none;">Por favor, selecciona un motivo.</p>
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; font-weight: 500; margin-bottom: 0.5rem;">Descripción</label>
                    <textarea id="report-description" style="width: 100%; padding: 0.8rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.9rem; min-height: 100px;" placeholder="Describe el problema en detalle" required></textarea>
                    <p id="description-error" style="color: #dc2626; font-size: 0.8rem; margin-top: 0.25rem; display: none;">La descripción es obligatoria y no debe exceder 500 caracteres.</p>
                </div>
                <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button type="button" id="cancel-report" style="background: linear-gradient(135deg, #6b7280, #9ca3af); color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 500;">Cancelar</button>
                    <button type="submit" id="submit-report" style="background: linear-gradient(135deg, #2b6b6b, #4c9f9f); color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 500;">Enviar Reporte</button>
                </div>
            </form>
        `;
        modalOverlay.appendChild(modalContent);
        setTimeout(() => {
            modalOverlay.style.opacity = '1';
            modalContent.style.opacity = '1';
        }, 10);
        const form = modalContent.querySelector('#report-form');
        const reasonSelect = modalContent.querySelector('#report-reason');
        const descriptionTextarea = modalContent.querySelector('#report-description');
        const reasonError = modalContent.querySelector('#reason-error');
        const descriptionError = modalContent.querySelector('#description-error');
        const cancelBtn = modalContent.querySelector('#cancel-report');
        const submitBtn = modalContent.querySelector('#submit-report');
        function validateReason() {
            if (!reasonSelect.value) {
                reasonError.style.display = 'block';
                return false;
            }
            reasonError.style.display = 'none';
            return true;
        }
        function validateDescription() {
            const description = descriptionTextarea.value.trim();
            if (!description || description.length > 500) {
                descriptionError.style.display = 'block';
                return false;
            }
            descriptionError.style.display = 'none';
            return true;
        }
        reasonSelect.addEventListener('change', validateReason);
        descriptionTextarea.addEventListener('input', validateDescription);
        cancelBtn.addEventListener('click', () => {
            modalOverlay.style.opacity = '0';
            modalContent.style.opacity = '0';
            setTimeout(() => document.body.contains(modalOverlay) && document.body.removeChild(modalOverlay), 300);
        });
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.style.opacity = '0';
                modalContent.style.opacity = '0';
                setTimeout(() => document.body.contains(modalOverlay) && document.body.removeChild(modalOverlay), 300);
            }
        });
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!validateReason() || !validateDescription()) {
                showMessage('Por favor, corrige los errores en el formulario.', true, modalContent);
                return;
            }
            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando...';
            try {
                const response = await fetch('/api/tenant/report', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-email': localStorage.getItem('currentUserEmail') || ''
                    },
                    body: JSON.stringify({
                        publicationId,
                        publicationTitle,
                        reason: reasonSelect.value,
                        description: descriptionTextarea.value.trim()
                    })
                });
                const data = await response.json();
                if (data.success) {
                    modalOverlay.style.opacity = '0';
                    modalContent.style.opacity = '0';
                    setTimeout(() => {
                        document.body.contains(modalOverlay) && document.body.removeChild(modalOverlay);
                        const elements = showLoadingSpinner();
                        setTimeout(() => {
                            hideLoadingSpinner(elements);
                            showMessage('Reporte enviado correctamente. Gracias por tu colaboración.', false);
                        }, 1000);
                    }, 300);
                } else {
                    showMessage(data.message || 'Error al enviar el reporte.', true, modalContent);
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Enviar Reporte';
                }
            } catch (error) {
                showMessage('Error al enviar el reporte. Por favor, intenta nuevamente.', true, modalContent);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Enviar Reporte';
            }
        });
    }

    // Initialize report buttons
    function initializeReportButtons() {
        document.querySelectorAll('.publication-action-btn.report, .action-btn.report').forEach(button => {
            button.removeEventListener('click', button._clickHandler);
            button._clickHandler = () => {
                const publicationId = button.dataset.id;
                const publicationTitle = button.dataset.title || 'Publicación sin título';
                const existingModal = document.querySelector('div[style*="z-index: 3000"]');
                if (existingModal) return;
                openReportModal(publicationId, publicationTitle);
            };
            button.addEventListener('click', button._clickHandler);
        });
    }

    // Obtener publicaciones disponibles (Acomodar)
    async function fetchAvailablePublications(queryString = 'status=available') {
        const publicationsList = document.getElementById('publications-list');
        if (!publicationsList) {
            showMessage('Error: No se encontró el contenedor de publicaciones.');
            return;
        }
        const elements = showLoadingSpinner();
        try {
            const userEmail = localStorage.getItem('currentUserEmail') || '';
            if (!userEmail) throw new Error('Por favor, inicia sesión nuevamente.');
            const response = await fetch(`/api/publications/tenant/available?${queryString}`, {
                method: 'GET',
                headers: { 'x-user-email': userEmail }
            });
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            const data = await response.json();
            publicationsList.innerHTML = '';
            if (!data.success || !data.publications || data.publications.length === 0) {
                publicationsList.innerHTML = `
                    <div class="no-publications">
                        <span>📋</span>
                        <p>No se encontraron propiedades disponibles con los criterios seleccionados.</p>
                    </div>
                `;
                hideLoadingSpinner(elements);
                return;
            }
            data.publications.forEach(publication => {
                const publicationCard = document.createElement('div');
                publicationCard.className = 'publication-card';
                const formattedPrice = Number(publication.price).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
                const imageSrc = publication.image_url || '/img/house_default.png';
                const type = publication.space_type || 'Desconocido';
                const landlordName = publication.full_name || 'Arrendador no especificado';
                const address = publication.address || {};

                let formattedType = '';
                switch (type.toLowerCase()) {
                    case 'apartamento':
                        formattedType = '<span class="space-type">Apartamento</span>';
                        break;
                    case 'casa':
                        formattedType = '<span class="space-type">Casa</span>';
                        break;
                    case 'habitacion':
                        formattedType = '<span class="space-type">Habitación</span>';
                        break;
                    case 'parqueo':
                        formattedType = '<span class="space-type">Parqueadero</span>';
                        break;
                    case 'bodega':
                        formattedType = '<span class="space-type">Bodega</span>';
                        break;
                    default:
                        formattedType = '<span class="space-type">' + type.charAt(0).toUpperCase() + type.slice(1) + '</span>';
                }

                let addressString = '';
                if (address.barrio || address.calle_carrera || address.numero) {
                    const addressParts = [];
                    if (address.barrio) addressParts.push(address.barrio);
                    if (address.calle_carrera) addressParts.push(address.calle_carrera);
                    if (address.numero) addressParts.push(`#${address.numero}`);
                    if (address.conjunto_torre) addressParts.push(`${address.conjunto_torre}`);
                    if (address.apartamento) addressParts.push(`Apto: ${address.apartamento}`);
                    if (address.piso) addressParts.push(`Piso: ${address.piso}`);
                    addressString = addressParts.join(', ');
                } else {
                    addressString = 'Dirección no disponible';
                }

                let formattedAvailability = '';
                switch (publication.availability) {
                    case 'inmediata':
                        formattedAvailability = '<span class="availability">Entrega Inmediata</span>';
                        break;
                    case 'futura_1mes':
                        formattedAvailability = '<span class="availability">Entrega Futura (1 mes)</span>';
                        break;
                    case 'futura_3meses':
                        formattedAvailability = '<span class="availability">Entrega Futura (3 meses)</span>';
                        break;
                    default:
                        formattedAvailability = '<span class="availability">' + publication.availability + '</span>';
                }

                let rentalStatusMessage = '';
                let viewDisabled = '';
                let contactDisabled = '';
                let reportDisabled = '';
                if (publication.rental_status === 'arrendado') {
                    rentalStatusMessage = '<p class="rental-status arrendado">No disponible</p>';
                    viewDisabled = 'disabled';
                    contactDisabled = 'disabled';
                    reportDisabled = 'disabled';
                } else if (publication.rental_status === 'disponible') {
                    rentalStatusMessage = '<p class="rental-status disponible">Disponible para Arrendar</p>';
                    viewDisabled = '';
                    contactDisabled = '';
                    reportDisabled = '';
                }
                else if (publication.rental_status === 'en_proceso_arrendamiento') {
                    rentalStatusMessage = '<p class="rental-status disponible">Disponible para Arrendar</p>';
                    viewDisabled = '';
                    contactDisabled = '';
                    reportDisabled = '';
                }

                publicationCard.innerHTML = `
                    <img src="${imageSrc}" alt="${publication.title}" class="publication-image">
                    <h3>${publication.title}</h3>
                    <p><strong>Arrendador:</strong> ${landlordName}</p>
                    <p><strong>Dirección:</strong> ${addressString}</p>
                    <p><strong>Tipo de Espacio:</strong> ${formattedType}</p>
                    <p><strong>Precio:</strong> ${formattedPrice}</p>
                    <p><strong>Disponibilidad:</strong> ${formattedAvailability}</p>
                    <div class="publication-actions">
                        <button class="publication-action-btn view" data-id="${publication.id}" ${viewDisabled}>Ver Detalles</button>
                        <button class="publication-action-btn contact" data-id="${publication.id}" ${contactDisabled}>Contactar Arrendador</button>
                        <button class="publication-action-btn report" data-id="${publication.id}" data-title="${publication.title}" ${reportDisabled}>Reportar</button>
                    </div>
                    ${rentalStatusMessage}
                `;
                publicationsList.appendChild(publicationCard);
                publicationCard.querySelector('.view').addEventListener('click', () => window.renderPublicationDetails(publication.id));
                if (!contactDisabled) {
                    publicationCard.querySelector('.contact').addEventListener('click', () => window.renderContactForm(publication.id));
                }
                if (!reportDisabled) {
                    publicationCard.querySelector('.report').addEventListener('click', () => window.showReportDialog(publication.id, publication.title));
                }
            });
            initializeReportButtons();
            initializeContactButtons();
            hideLoadingSpinner(elements);
        } catch (error) {
            hideLoadingSpinner(elements);
            publicationsList.innerHTML = `<p class="no-publications error">Error al cargar las propiedades: ${error.message}</p>`;
        }
    }
        
            // Render available publications with filter form
    async function renderAvailablePublications() {
        if (!mainContent) {
            showMessage('Error: No se encontró el contenedor principal.');
            return;
        }
        mainContent.innerHTML = `
            <div class="available-publications-section">
                <h1>Explorar Propiedades</h1>
                <div class="filter-section">
                    <div class="filter-form">
                        <div class="filter-group">
                            <label for="filter-title">Título:</label>
                            <input type="text" id="filter-title" placeholder="Buscar por título...">
                        </div>
                        <div class="filter-group">
                            <label for="filter-type">Tipo de Espacio:</label>
                            <select id="filter-type">
                                <option value="">Todos</option>
                                <option value="apartamento">Apartamento</option>
                                <option value="casa">Casa</option>
                                <option value="habitacion">Habitación</option>
                                <option value="parqueo">Parqueadero</option>
                                <option value="bodega">Bodega</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="filter-min-price">Precio Mínimo:</label>
                            <input type="number" id="filter-min-price" placeholder="Ej: 500000" min="0">
                        </div>
                        <div class="filter-group">
                            <label for="filter-max-price">Precio Máximo:</label>
                            <input type="number" id="filter-max-price" placeholder="Ej: 1000000" min="0">
                        </div>
                        <div class="filter-group">
                            <label for="filter-availability">Disponibilidad:</label>
                            <select id="filter-availability">
                                <option value="">Todas</option>
                                <option value="inmediata">Entrega Inmediata</option>
                                <option value="futura_1mes">Entrega Futura (1 mes)</option>
                                <option value="futura_3meses">Entrega Futura (3 meses)</option>
                            </select>
                        </div>
                        <button id="filter-btn">Filtrar</button>
                        <button id="reset-btn">Limpiar</button>
                    </div>
                </div>
                <div class="publications-list" id="publications-list"></div>
            </div>
        `;
        const style = document.createElement('style');
        style.innerHTML = `
            .available-publications-section { max-width: 1200px; margin: 2rem auto; padding: 0 1rem; }
            .available-publications-section h1 { font-family: 'Roboto', sans-serif; color: #2b6b6b; font-size: 2rem; margin-bottom: 1rem; text-align: center; }
            .filter-section { margin-bottom: 2rem; background: #f9fafb; padding: 1rem; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
            .filter-form { display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; justify-content: center; }
            .filter-group { display: flex; flex-direction: column; gap: 0.5rem; }
            .filter-group label { font-family: 'Roboto', sans-serif; font-size: 0.9rem; color: #333; font-weight: 500; }
            .filter-group select, .filter-group input { padding: 0.5rem; border: 1px solid #e5e7eb; border-radius: 6px; font-family: 'Roboto', sans-serif; font-size: 0.9rem; color: #333; background: #fff; outline: none; transition: border-color 0.3s ease; }
            .filter-group select:focus, .filter-group input:focus { border-color: #2b6b6b; }
            .filter-form button { background: linear-gradient(135deg, #2b6b6b, #4c9f9f); color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 6px; cursor: pointer; font-family: 'Roboto', sans-serif; font-size: 0.9rem; font-weight: 500; transition: background 0.3s ease; }
            .filter-form button:hover { background: linear-gradient(135deg, #4c9f9f, #2b6b6b); }
            #reset-btn { background: #e5e7eb; color: #374151; }
            #reset-btn:hover { background: #d1d5db; }
            .publications-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; padding: 1rem 0; }
            .publication-card { background: #fff; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); overflow: hidden; transition: transform 0.3s ease, box-shadow 0.3s ease; position: relative; border: 1px solid #e5e7eb; display: flex; flex-direction: column; }
            .publication-card:hover { transform: translateY(-5px); box-shadow: 0 6px 15px rgba(0,0,0,0.15); }
            .publication-image { width: 100%; height: 180px; object-fit: cover; }
            .publication-card h3 { font-family: 'Roboto', sans-serif; font-size: 1.25rem; font-weight: 600; color: #333; margin: 0.75rem 0; padding-left: 1rem; text-align: left; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; max-height: 3.2em; }
            .publication-card p { font-family: 'Roboto', sans-serif; font-size: 0.9rem; color: #666; margin: 0.3rem 0; padding-left: 1rem; }
            .publication-actions { display: flex; justify-content: space-between; padding: 0.75rem 1rem; border-top: 1px solid #e5e7eb; background: #f9fafb; gap: 0.5rem; margin-top: auto; }
            .publication-action-btn { background: #e5e7eb; color: #374151; border: none; padding: 0.5rem 0.75rem; border-radius: 6px; cursor: pointer; font-family: 'Roboto', sans-serif; font-size: 0.85rem; font-weight: 500; flex: 1; text-align: center; transition: background 0.3s ease, color 0.3s ease; }
            .publication-action-btn:hover:not(:disabled) { background: #d1d5db; }
            .publication-action-btn:disabled { background: #e5e7eb; color: #9ca3af; cursor: not-allowed; }
            .rental-status { font-family: 'Roboto', sans-serif; font-size: 0.9em; margin: 0.5rem 1rem 1rem 1rem; padding: 5px 10px; border-radius: 5px; text-align: center; }
            .rental-status.disponible { background-color: #e7f3e7; color: #2e7d32; }
            .rental-status.arrendado { background-color: #ffebee; color: #d32f2f; }
            .no-publications { text-align: center; padding: 2rem; font-family: 'Roboto', sans-serif; color: #555; }
            .no-publications span { font-size: 2rem; display: block; margin-bottom: 1rem; }
            .no-publications.error { color: #dc2626; }
            @media (max-width: 768px) { .publications-list { grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); } .filter-form { flex-direction: column; align-items: stretch; } .filter-form button { margin-top: 0.5rem; } }
            @media (max-width: 480px) { .publications-list { grid-template-columns: 1fr; } .publication-card h3 { font-size: 1.1rem; } .publication-actions { flex-direction: column; } .publication-action-btn { margin-bottom: 0.5rem; } .publication-action-btn:last-child { margin-bottom: 0; } }
        `;
        document.head.appendChild(style);
        const filterTitle = document.getElementById('filter-title');
        const filterType = document.getElementById('filter-type');
        const filterMinPrice = document.getElementById('filter-min-price');
        const filterMaxPrice = document.getElementById('filter-max-price');
        const filterAvailability = document.getElementById('filter-availability');
        const filterBtn = document.getElementById('filter-btn');
        const resetBtn = document.getElementById('reset-btn');
        async function fetchFilteredPublications() {
            const params = new URLSearchParams();
            params.append('status', 'available');
            if (filterTitle.value.trim()) params.append('title', filterTitle.value.trim());
            if (filterType.value) params.append('type', filterType.value);
            if (filterMinPrice.value.trim()) params.append('minPrice', filterMinPrice.value.trim());
            if (filterMaxPrice.value.trim()) params.append('maxPrice', filterMaxPrice.value.trim());
            if (filterAvailability.value) params.append('availability', filterAvailability.value);
            await fetchAvailablePublications(params.toString());
        }
        filterBtn.addEventListener('click', fetchFilteredPublications);
        [filterTitle, filterMinPrice, filterMaxPrice].forEach(input => {
            input.addEventListener('keypress', (e) => e.key === 'Enter' && fetchFilteredPublications());
        });
        resetBtn.addEventListener('click', () => {
            filterTitle.value = '';
            filterType.value = '';
            filterMinPrice.value = '';
            filterMaxPrice.value = '';
            filterAvailability.value = '';
            fetchAvailablePublications('status=available');
        });
        await fetchAvailablePublications('status=available');
    }



    // Función para obtener y actualizar las estadísticas del dashboard para arrendatario
    async function fetchTenantStats() {
        const userEmail = localStorage.getItem('currentUserEmail') || '';
        console.log('Fetching tenant stats for email:', userEmail); // Debug log
        if (!userEmail) {
            console.error('No se encontró el email del usuario en localStorage.');
            updateTenantStats(0, 0, 0);
            return;
        }

        try {
            // Fetch stats from the tenant endpoint
            const response = await fetch('/api/tenant/stats', {
                method: 'GET',
                headers: {
                    'x-user-email': userEmail
                }
            });

            if (!response.ok) {
                throw new Error(`Error al obtener estadísticas: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.message || 'Error al obtener las estadísticas');
            }

            // Extract stats
            const { availablePublications, newMessages, activeContracts } = data.stats;

            // Update DOM with stats
            updateTenantStats(availablePublications, newMessages, activeContracts);
        } catch (error) {
            console.error('Error al obtener estadísticas de arrendatario:', error.message);
            updateTenantStats(0, 0, 0);
        }
    }

    // Helper function to update DOM stats for tenant
    function updateTenantStats(availablePublications, newMessages, activeContracts) {
        const availableStat = document.querySelector('.stats-cards .card:nth-child(1) .stat');
        const messagesStat = document.querySelector('.stats-cards .card:nth-child(2) .stat');
        const contractsStat = document.querySelector('.stats-cards .card:nth-child(3) .stat');

        if (availableStat) availableStat.textContent = availablePublications;
        if (messagesStat) messagesStat.textContent = newMessages;
        if (contractsStat) contractsStat.textContent = activeContracts;
    }

        // Render publication details
    async function renderPublicationDetails(publicationId) {
        if (!mainContent) {
            showMessage('Error: No se encontró el contenedor principal.');
            return;
        }
        const elements = showLoadingSpinner();
        try {
            const userEmail = localStorage.getItem('currentUserEmail') || '';
            if (!userEmail) throw new Error('Por favor, inicia sesión nuevamente.');
            const response = await fetch(`/api/publications/tenant/${publicationId}`, {
                method: 'GET',
                headers: { 'x-user-email': userEmail }
            });
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            const data = await response.json();
            if (!data.success) throw new Error(data.message || 'Error al obtener la publicación');
            const publication = data.publication;
            const images = data.images || [];
            const address = publication.address || {};
            const coverImage = images.length > 0 ? images[0] : '/img/house_default.png';
            const galleryImages = images.length > 0 ? images : [];
            const formattedPrice = Number(publication.price).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
            const formattedType = publication.space_type.charAt(0).toUpperCase() + publication.space_type.slice(1);
            const ownerName = publication.full_name || 'Arrendador no especificado';
            const ownerProfilePicture = publication.profile_picture || '/img/default-profile.png';

            // Formatear la disponibilidad
            let formattedAvailability = '';
            switch (publication.availability) {
                case 'inmediata':
                    formattedAvailability = 'Entrega Inmediata';
                    break;
                case 'futura_1mes':
                    formattedAvailability = 'Entrega Futura (1 mes)';
                    break;
                case 'futura_3meses':
                    formattedAvailability = 'Entrega Futura (3 meses)';
                    break;
                default:
                    formattedAvailability = publication.availability.charAt(0).toUpperCase() + publication.availability.slice(1);
            }

            // Construir la dirección para mostrar
            let addressString = `${address.barrio || 'N/A'}, ${address.calle_carrera || 'N/A'} #${address.numero || 'N/A'}`;
            if (address.conjunto_torre) addressString += `, Conjunto/Torre: ${address.conjunto_torre}`;
            if (address.apartamento) addressString += `, Apartamento: ${address.apartamento}`;
            if (address.piso) addressString += `, Piso: ${address.piso}`;

            mainContent.innerHTML = `
                <div class="publication-details">
                    <button class="back-btn">Regresar al menú principal</button>
                    <h1>${publication.title}</h1>
                    <div class="publication-images">
                        <img src="${coverImage}" alt="Portada de ${publication.title}" class="cover-image">
                    </div>
                    <div class="publication-info">
                        <div class="info-field description"><strong>Descripción:</strong> <p>${publication.description}</p></div>
                        <div class="info-field"><strong>Dirección:</strong> <p>${addressString}</p></div>
                        <div class="info-field price"><strong>Precio:</strong> <p>${formattedPrice}</p></div>
                        <div class="info-field"><strong>Tipo:</strong> <p>${formattedType}</p></div>
                        <div class="info-field"><strong>Disponibilidad:</strong> <p>${formattedAvailability}</p></div>
                        <div class="info-field"><strong>Condiciones:</strong> <p>${publication.conditions || 'Se permite mascota pequeña. Contrato mínimo de 1 año.'}</p></div>
                        <div class="info-field"><strong>Fecha de Creación:</strong> <p>${new Date(publication.created_at).toLocaleDateString()}</p></div>
                    </div>
                    <div class="image-gallery">
                        <h3>Galería de la publicación</h3>
                        <div class="gallery-container">
                            ${galleryImages.map(img => `<img src="${img}" alt="Imagen de ${publication.title}" class="gallery-image" data-full="${img}">`).join('')}
                        </div>
                    </div>
                    <div class="owner-info">
                        <h3>Acerca del arrendador</h3>
                        <div class="owner-details">
                            <img src="${ownerProfilePicture}" alt="Imagen del usuario" class="owner-image">
                            <div class="owner-text">
                                <p><strong>Nombre del arrendador:</strong> ${ownerName}</p>
                                <p><strong>Fecha de creación de cuenta:</strong> ${new Date(publication.user_created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            const publicationStyles = document.createElement('style');
            publicationStyles.innerHTML = `
                .publication-details { max-width: 1200px; margin: 2rem auto; padding: 2rem; background: #fff; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); font-family: 'Roboto', sans-serif; color: #374151; }
                .back-btn { background: linear-gradient(135deg, #6b7280, #9ca3af); color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 500; margin-bottom: 1rem; }
                .back-btn:hover { background: linear-gradient(135deg, #9ca3af, #6b7280); }
                .publication-details h1 { font-size: 2rem; color: #2b6b6b; margin-bottom: 1.5rem; }
                .publication-images { margin-bottom: 2rem; }
                .cover-image { width: 100%; max-height: 400px; object-fit: cover; border-radius: 12px; }
                .publication-info { margin-bottom: 2rem; }
                .info-field { margin-bottom: 1rem; display: flex; align-items: flex-start; }
                .info-field strong { min-width: 150px; font-weight: 500; color: #2b6b6b; }
                .info-field p { margin: 0; flex: 1; color: #666; font-size: 0.9rem; }
                .image-gallery { margin-bottom: 2rem; }
                .image-gallery h3 { font-size: 1.5rem; color: #2b6b6b; margin-bottom: 1rem; }
                .gallery-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
                .gallery-image { width: 100%; height: 150px; object-fit: cover; border-radius: 8px; cursor: pointer; transition: transform 0.3s ease; }
                .gallery-image:hover { transform: scale(1.05); }
                .owner-info { margin-bottom: 2rem; }
                .owner-info h3 { font-size: 1.5rem; color: #2b6b6b; margin-bottom: 1rem; }
                .owner-details { display: flex; align-items: center; gap: 1.5rem; }
                .owner-image { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; }
                .owner-text p { margin: 0.5rem 0; color: #666; font-size: 0.9rem; }
                .publication-actions { display: flex; gap: 1rem; justify-content: center; }
                .action-btn { background: linear-gradient(135deg, #2b6b6b, #4c9f9f); color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 500; transition: background 0.3s ease; }
                .action-btn.report { background: linear-gradient(135deg, #dc2626, #f87171); }
                .action-btn:hover { background: linear-gradient(135deg, #4c9f9f, #2b6b6b); }
                .action-btn.report:hover { background: linear-gradient(135deg, #f87171, #dc2626); }
                @media (max-width: 768px) { .publication-details { padding: 1rem; margin: 1rem; } .cover-image { max-height: 300px; } .info-field { flex-direction: column; } .info-field strong { min-width: auto; margin-bottom: 0.5rem; } .gallery-container { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); } .gallery-image { height: 120px; } .owner-details { flex-direction: column; align-items: flex-start; } .publication-actions { flex-direction: column; align-items: stretch; } .action-btn { width: 100%; } }
                @media (max-width: 480px) { .publication-details h1 { font-size: 1.5rem; } .image-gallery h3, .owner-info h3 { font-size: 1.2rem; } .gallery-container { grid-template-columns: 1fr; } .gallery-image { height: 100px; } .owner-image { width: 60px; height: 60px; } }
            `;
            document.head.appendChild(publicationStyles);
            mainContent.querySelector('.back-btn').addEventListener('click', () => renderAvailablePublications());
            mainContent.querySelectorAll('.gallery-image').forEach(img => {
                img.addEventListener('click', () => showImageModal(img.getAttribute('data-full'), img.alt));
            });
            initializeReportButtons();
            initializeContactButtons();
            hideLoadingSpinner(elements);
            // Desplazar hacia arriba al cargar los detalles
            window.scrollTo(0, 0);
        } catch (error) {
            hideLoadingSpinner(elements);
            mainContent.innerHTML = `
                <div class="no-publications error">
                    <span>❌</span>
                    <p>Error al cargar la publicación: ${error.message}</p>
                    <button class="action-btn" onclick="window.renderAvailablePublications()">Volver a Propiedades</button>
                </div>
            `;
        }
    }
    
        // Show image modal
    function showImageModal(imageSrc, altText) {
            const modalOverlay = document.createElement('div');
            modalOverlay.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.8); z-index: 3000; display: flex;
                justify-content: center; align-items: center; opacity: 0;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(modalOverlay);
            const modalContent = document.createElement('div');
            modalContent.style.cssText = `
                background: #fff; border-radius: 12px; overflow: hidden; max-width: 90%;
                max-height: 90%; display: flex; flex-direction: column; opacity: 0;
                transition: opacity 0.3s ease;
            `;
            modalContent.innerHTML = `
                <img src="${imageSrc}" alt="${altText}" style="max-width: 100%; max-height: 80vh; object-fit: contain;">
                <button style="background: linear-gradient(135deg, #dc2626, #f87171); color: white; border: none; padding: 0.8rem; border-radius: 8px; cursor: pointer; margin: 1rem auto; width: 120px; font-weight: 500;">Cerrar</button>
            `;
            modalOverlay.appendChild(modalContent);
            setTimeout(() => {
                modalOverlay.style.opacity = '1';
                modalContent.style.opacity = '1';
            }, 10);
            modalContent.querySelector('button').addEventListener('click', () => {
                modalOverlay.style.opacity = '0';
                modalContent.style.opacity = '0';
                setTimeout(() => document.body.contains(modalOverlay) && document.body.removeChild(modalOverlay), 300);
            });
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    modalOverlay.style.opacity = '0';
                    modalContent.style.opacity = '0';
                    setTimeout(() => document.body.contains(modalOverlay) && document.body.removeChild(modalOverlay), 300);
                }
            });
        }

      
    // Restore dashboard
    async function restoreDashboard() {
        mainContent.innerHTML = originalDashboardContent;
        if (typeof fetchTenantStats === 'function') await fetchTenantStats();
        await fetchNotifications();
    }      
    
        // Exponer fetchTenantStats globalmente
    window.fetchTenantStats = fetchTenantStats;
    
        // Ejecutar fetchTenantStats al cargar la página si el dashboard está presente
    const dashboardContent = document.querySelector('.dashboard-content');
    if (dashboardContent) {
    fetchTenantStats();
    }


   // Parte de mensajería
    let SOCKET_URL = null;
    let socket = null;
    let currentConversationId = null;
    let landlordEmail = null;

    // Cargar Socket.IO desde CDN
    function loadSocketIO() {
        return new Promise((resolve, reject) => {
            if (window.io) return resolve();
            const script = document.createElement('script');
            script.src = 'https://cdn.socket.io/4.7.5/socket.io.min.js';
            script.async = true;
            script.timeout = 10000; // 10 segundos
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Error al cargar Socket.IO'));
            document.head.appendChild(script);
        });
    }

    // Función para obtener la URL del socket desde el servidor
    async function fetchSocketUrl() {
        try {
            const response = await fetch('/api/config', { timeout: 10000 });
            if (!response.ok) throw new Error(`Error al obtener la configuración del socket: ${response.status}`);
            const data = await response.json();
            SOCKET_URL = data.socketUrl.replace('http', 'ws').replace('https', 'wss');
            console.log('URL del socket obtenida:', SOCKET_URL);
            if (!SOCKET_URL.includes('wss') && data.socketUrl.includes('ngrok')) {
                console.warn('Advertencia: La URL del socket debería usar wss para ngrok:', SOCKET_URL);
            }
        } catch (error) {
            console.error('Error al obtener la URL del socket:', error.message);
            SOCKET_URL = null;
            showMessage('No se pudo conectar al servidor. Verifica tu red.', true);
            throw new Error('No se pudo obtener la URL del socket');
        }
    }

    // Llamar a fetchSocketUrl al cargar la página
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            await fetchSocketUrl();
            await loadSocketIO();
        } catch (error) {
            console.error('Error en la inicialización:', error.message);
            showMessage('Error al inicializar el chat. Verifica tu conexión.', true);
        }
    });

    // Initialize contact buttons
    function initializeContactButtons() {
        document.querySelectorAll('.publication-action-btn.contact, .action-btn.contact').forEach(button => {
            button.removeEventListener('click', button._clickHandler);
            button._clickHandler = () => initiateConversation(button.dataset.id);
            button.addEventListener('click', button._clickHandler);
        });
    }

    // Fetch conversations
    async function fetchConversations(searchQuery = '') {
        const conversationsList = document.getElementById('conversations-list');
        if (!conversationsList) {
            showMessage('Error: No se encontró el contenedor de conversaciones.');
            return;
        }
        const elements = showLoadingSpinner();
        try {
            const userEmail = localStorage.getItem('currentUserEmail') || '';
            if (!userEmail) throw new Error('Por favor, inicia sesión nuevamente.');
            const query = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
            const response = await fetch(`/api/conversations${query}`, {
                method: 'GET',
                headers: { 'x-user-email': userEmail }
            });
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            const data = await response.json();
            conversationsList.innerHTML = '';
            if (!data.success || !data.conversations || data.conversations.length === 0) {
                conversationsList.innerHTML = `
                    <div class="no-conversations">
                        <span>💬</span>
                        <p>No tienes conversaciones activas.</p>
                    </div>
                `;
                hideLoadingSpinner(elements);
                return;
            }
            data.conversations.forEach(conversation => {
                const conversationCard = document.createElement('div');
                conversationCard.className = 'conversation-card';
                const formattedDate = conversation.last_message.sent_at 
                    ? new Date(conversation.last_message.sent_at).toLocaleString('es-CO', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
                    : 'Sin mensajes';
                const lastMessageAuthor = conversation.last_message.sender_email === userEmail ? 'Tú' : conversation.landlord_name;
                conversationCard.innerHTML = `
                    <img src="${conversation.landlord_profile_picture || '/img/default-profile.png'}" alt="${conversation.landlord_name}" class="conversation-image">
                    <div class="conversation-info">
                        <h3>${conversation.landlord_name}</h3>
                        <p><strong>Publicación:</strong> ${conversation.publication_title}</p>
                        <p><strong>Último mensaje (${lastMessageAuthor}):</strong> ${conversation.last_message.content}</p>
                        <p><strong>Fecha:</strong> ${formattedDate}</p>
                    </div>
                    <button class="conversation-action-btn" data-conversation-id="${conversation.id}" data-publication-id="${conversation.publication_id}" data-landlord-email="${conversation.landlord_email}">Leer Conversación</button>
                `;
                conversationsList.appendChild(conversationCard);
                conversationCard.querySelector('.conversation-action-btn').addEventListener('click', () => {
                    openConversation(conversation.id, conversation.publication_id, {
                        full_name: conversation.landlord_name,
                        profile_picture: conversation.landlord_profile_picture,
                        email: conversation.landlord_email
                    }, { title: conversation.publication_title });
                });
            });
            hideLoadingSpinner(elements);
        } catch (error) {
            hideLoadingSpinner(elements);
            conversationsList.innerHTML = `<p class="no-conversations error">Error al cargar las conversaciones: ${error.message}</p>`;
        }
    }

    // Render conversations with search bar
    async function renderConversations() {
        if (!mainContent) {
            showMessage('Error: No se encontró el contenedor principal.');
            return;
        }
        mainContent.innerHTML = '';
        mainContent.innerHTML = `
            <div class="conversations-section">
                <h1>Mis Conversaciones</h1>
                <div class="search-section">
                    <input type="text" id="search-conversations" placeholder="Buscar por publicación o arrendador...">
                    <button id="load-conversations-btn" class="load-conversations-btn">Buscar</button>
                </div>
                <div class="conversations-list" id="conversations-list"></div>
            </div>
        `;
        const style = document.createElement('style');
        style.innerHTML = `
            .conversations-section { max-width: 1200px; margin: 2rem auto; padding: 0 1rem; }
            .conversations-section h1 { font-family: 'Roboto', sans-serif; color: #2b6b6b; font-size: 2rem; margin-bottom: 1rem; text-align: center; }
            .search-section { margin-bottom: 2rem; display: flex; justify-content: center; gap: 0.5rem; }
            .search-section input { width: 100%; max-width: 400px; padding: 0.8rem; border: 1px solid #e5e7eb; border-radius: 6px; font-family: 'Roboto', sans-serif; font-size: 1rem; color: #333; background: #fff; outline: none; transition: border-color 0.3s ease; }
            .search-section input:focus { border-color: #2b6b6b; }
            .load-conversations-btn { background: linear-gradient(135deg, #2b6b6b, #4c9f9f); color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 6px; cursor: pointer; font-family: 'Roboto', sans-serif; font-size: 1rem; font-weight: 500; transition: background 0.3s ease; }
            .load-conversations-btn:hover { background: linear-gradient(135deg, #4c9f9f, #2b6b6b); }
            .conversations-list { display: flex; flex-direction: column; gap: 1rem; }
            .conversation-card { display: flex; align-items: center; background: #fff; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); padding: 1rem; transition: transform 0.3s ease, box-shadow 0.3s ease; }
            .conversation-card:hover { transform: translateY(-5px); box-shadow: 0 6px 15px rgba(0,0,0,0.15); }
            .conversation-image { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; margin-right: 1rem; }
            .conversation-info { flex: 1; }
            .conversation-info h3 { font-family: 'Roboto', sans-serif; font-size: 1.25rem; font-weight: 600; color: #333; margin: 0 0 0.5rem 0; }
            .conversation-info p { font-family: 'Roboto', sans-serif; font-size: 0.9rem; color: #666; margin: 0.3rem 0; }
            .conversation-action-btn { background: linear-gradient(135deg, #2b6b6b, #4c9f9f); color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-family: 'Roboto', sans-serif; font-size: 0.85rem; font-weight: 500; transition: background 0.3s ease; }
            .conversation-action-btn:hover { background: linear-gradient(135deg, #4c9f9f, #2b6b6b); }
            .no-conversations { text-align: center; padding: 2rem; font-family: 'Roboto', sans-serif; color: #555; }
            .no-conversations span { font-size: 2rem; display: block; margin-bottom: 1rem; }
            .no-conversations.error { color: #dc2626; }
            @media (max-width: 768px) { 
                .conversation-card { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
                .conversation-image { width: 50px; height: 50px; }
                .conversation-action-btn { width: 100%; text-align: center; }
                .search-section { flex-direction: column; align-items: center; gap: 0.5rem; }
                .search-section input { max-width: 100%; }
                .load-conversations-btn { width: 100%; max-width: 400px; }
            }
            @media (max-width: 480px) { 
                .conversations-section h1 { font-size: 1.5rem; }
                .conversation-info h3 { font-size: 1.1rem; }
                .conversation-info p { font-size: 0.85rem; }
                .conversation-action-btn { padding: 0.4rem 0.8rem; font-size: 0.8rem; }
            }
        `;
        document.head.appendChild(style);
        const searchInput = document.getElementById('search-conversations');
        const loadButton = document.getElementById('load-conversations-btn');
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                fetchConversations(query);
            }
        });
        loadButton.addEventListener('click', () => {
            const query = searchInput.value.trim();
            fetchConversations(query);
        });
        fetchConversations();
    }

    // Open conversation 
    async function openConversation(conversationId, publicationId, landlord, publication) {
        const elements = showLoadingSpinner();
        try {
            const userEmail = localStorage.getItem('currentUserEmail');
            if (!userEmail) throw new Error('No se encontró el email del usuario.');
            if (!SOCKET_URL) await fetchSocketUrl(); // Asegurarse de que la URL del socket esté cargada
            currentConversationId = conversationId;
            landlordEmail = landlord.email;
            localStorage.setItem('currentConversationId', conversationId); // Persistir conversación
            await initializeSocket();
            socket.emit('join_conversation', { conversationId: currentConversationId, userEmail });
            renderChatInterface(publication, landlord);
            await loadMessages(currentConversationId);
            hideLoadingSpinner(elements);
        } catch (error) {
            hideLoadingSpinner(elements);
            showMessage(error.message || 'Error al abrir la conversación.', true);
        }
    }

    // Initialize Socket.io
    async function initializeSocket() {
        if (!SOCKET_URL) {
            console.error('URL del socket no está definida. Asegurarse de que fetchSocketUrl se haya ejecutado.');
            showMessage('Error al conectar al chat. Verifica tu conexión.', true);
            return;
        }
        if (socket) socket.disconnect();
        try {
            await loadSocketIO(); // Asegurar que Socket.IO esté cargado
            if (!window.io) throw new Error('Socket.IO no está disponible.');
            socket = io(SOCKET_URL, {
                auth: { userEmail: localStorage.getItem('currentUserEmail') },
                reconnection: true,
                reconnectionAttempts: 15,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 10000,
                transports: ['websocket', 'polling'], // Habilitar polling como fallback
                timeout: 30000
            });
            socket.on('connect', () => {
                console.log('Conectado a Socket.io:', socket.id);
                if (currentConversationId) {
                    socket.emit('join_conversation', { 
                        conversationId: currentConversationId, 
                        userEmail: localStorage.getItem('currentUserEmail') 
                    });
                }
            });
            socket.on('new_message', (message) => {
                const userEmail = localStorage.getItem('currentUserEmail');
                if (message.conversation_id === currentConversationId && message.sender_email !== userEmail) {
                    displayMessage(message);
                    scrollToLastMessage();
                }
            });
            socket.on('message_read', ({ conversationId }) => {
                if (conversationId === currentConversationId) updateMessageStatus();
            });
            socket.on('connect_error', (error) => {
                console.error('Error de conexión con Socket.IO:', error.message, 'URL:', SOCKET_URL);
                showMessage('Error de conexión con el chat. Intentando reconectar...', true);
            });
            socket.on('reconnect', (attempt) => {
                console.log(`Reconexión exitosa después de ${attempt} intentos`);
                if (currentConversationId) {
                    socket.emit('join_conversation', {
                        conversationId: currentConversationId,
                        userEmail: localStorage.getItem('currentUserEmail')
                    });
                }
            });
            socket.on('reconnect_failed', () => {
                console.error('Fallo al reconectar después de intentos.');
                showMessage('No se pudo conectar al chat. Verifica tu conexión.', true);
            });
        } catch (error) {
            console.error('Error al inicializar el socket:', error.message);
            socket = null;
            showMessage('Error al conectar al chat. Intenta de nuevo.', true);
        }
    }

    // Function to scroll to the last message
    function scrollToLastMessage() {
        const chatMessages = document.querySelector('.chat-messages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    // Render chat interface (Diseño acomodar)
    function renderChatInterface(publication, landlord) {
        const existingStyle = document.getElementById('chat-styles');
        if (existingStyle) existingStyle.remove();
    
        const menuToggle = document.getElementById('menu-toggle');
        if (menuToggle) menuToggle.style.display = 'none';
    
        const navbar = document.getElementById('navbar');
        if (navbar && !navbar.classList.contains('disabled')) {
            navbar.classList.add('disabled');
        }
    
        document.body.style.overflow = 'hidden';
    
        mainContent.innerHTML = `
            <div class="chat-container">
                <div class="chat-header">
                    <button class="back-btn" aria-label="Volver a conversaciones">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <div class="user-info">
                        <img src="${landlord.profile_picture || '/img/default-profile.png'}" 
                            alt="${landlord.full_name}" 
                            class="landlord-image">
                        <div class="chat-info">
                            <h2>${landlord.full_name}</h2>
                            <p>${publication.title}</p>
                        </div>
                    </div>
                </div>
                <div class="chat-messages" id="chat-messages"></div>
                <div class="chat-input-container">
                    <div class="chat-input">
                        <input type="text" id="message-input" placeholder="Escribe un mensaje...">
                        <button id="send-message-btn">
                            <i class="fas fa-paper-plane"></i> 
                        </button>
                    </div>
                </div>
            </div>
        `;
    
        const fontAwesome = document.createElement('link');
        fontAwesome.rel = 'stylesheet';
        fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
    
        const style = document.createElement('style');
        style.id = 'chat-styles';
        style.innerHTML = `
            :root {
                --primary-color: #2b6b6b;
                --primary-light: #4c9f9f;
                --background-light: #f8fafc;
                --background-white: #ffffff;
                --text-dark: #1e293b;
                --text-medium: #475569;
                --text-light: #64748b;
                --border-color: #e2e8f0;
                --shadow-light: 0 2px 4px rgba(0,0,0,0.05);
                --shadow-medium: 0 4px 6px rgba(0,0,0,0.1);
            }
    
            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }
    
            html, body {
                height: 100%;
                overflow: hidden;
            }
    
            .chat-container {
                display: flex;
                flex-direction: column;
                height: 100vh;
                background-color: var(--background-white);
                overflow: hidden;
                position: relative;
            }
    
            .chat-header {
                display: flex;
                align-items: center;
                padding: 1rem 1.5rem;
                background-color: var(--background-white);
                border-bottom: 1px solid var(--border-color);
                box-shadow: var(--shadow-light);
                z-index: 10;
                position: sticky;
                top: 0;
                height: auto;
                min-height: 70px;
            }
    
            .back-btn {
                background: none;
                border: none;
                font-size: 1.2rem;
                margin-right: 1rem;
                cursor: pointer;
                color: var(--text-medium);
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                flex-shrink: 0;
            }
    
            .back-btn:hover {
                background-color: var(--border-color);
            }
    
            .user-info {
                display: flex;
                align-items: center;
                flex: 1;
                overflow: hidden;
            }
    
            .landlord-image {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                object-fit: cover;
                margin-right: 1rem;
                border: 2px solid var(--border-color);
                flex-shrink: 0;
            }
    
            .chat-info {
                flex: 1;
                overflow: hidden;
            }
    
            .chat-info h2 {
                font-size: 1.1rem;
                color: var(--text-dark);
                margin: 0;
                font-weight: 600;
                line-height: 1.3;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
    
            .chat-info p {
                font-size: 0.85rem;
                color: var(--text-light);
                margin: 0;
                overflow-wrap: break-word;
                line-height: 1.3;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
    
            .chat-messages {
                flex: 1;
                padding: 0.5rem;
                overflow-y: auto;
                background-color: var(--background-light);
                display: flex;
                flex-direction: column;
                border-bottom: 1px solid rgba(0,0,0,0.05);
                max-height: calc(100vh - 170px);
                min-height: 200px;
            }
    
            .message {
                max-width: 70%;
                margin-bottom: 1rem;
                padding: 0.8rem 1.2rem;
                border-radius: 18px;
                font-size: 0.95rem;
                line-height: 1.4;
                position: relative;
                animation: fadeIn 0.3s ease-out;
                word-wrap: break-word;
            }
    
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
    
            .message.sent {
                background-color: var(--primary-color);
                color: white;
                align-self: flex-end;
                border-bottom-right-radius: 4px;
                margin-right: 10px;
            }
    
            .message.received {
                background-color: var(--background-white);
                color: var(--text-dark);
                align-self: flex-start;
                border-bottom-left-radius: 4px;
                margin-left: 10px;
                box-shadow: var(--shadow-light);
            }
    
            .message-timestamp {
                font-size: 0.7rem;
                margin-top: 0.4rem;
                display: flex;
                align-items: center;
            }
    
            .message.sent .message-timestamp {
                color: rgba(255,255,255,0.8);
                justify-content: flex-end;
            }
    
            .message.received .message-timestamp {
                color: var(--text-light);
                justify-content: flex-start;
            }
    
            .message.read .message-timestamp::after {
                content: '✓✓';
                color: var(--primary-light);
                margin-left: 0.3rem;
                font-size: 0.8rem;
            }
    
            .chat-input-container {
                padding: 0.8rem 1rem;
                background-color: var(--background-white);
                border-top: 1px solid var(--border-color);
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                z-index: 100;
                box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
                margin-left: 250px;
                width: calc(100% - 250px);
            }
    
            .chat-input {
                display: flex;
                gap: 0.8rem;
                align-items: center;
            }
    
            #message-input {
                flex: 1;
                padding: 0.9rem 1.2rem;
                border: 2px solid var(--border-color);
                border-radius: 24px;
                font-size: 0.95rem;
                outline: none;
                transition: all 0.2s ease;
                background-color: var(--background-light);
                min-height: 50px;
                resize: none;
            }
    
            #message-input:focus {
                border-color: var(--primary-color);
                background-color: var(--background-white);
                box-shadow: 0 0 0 3px rgba(43, 107, 107, 0.1);
            }
    
            #send-message-btn {
                background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
                color: white;
                border: none;
                padding: 0.9rem 1.5rem;
                border-radius: 24px;
                cursor: pointer;
                font-weight: 600;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                transition: all 0.2s ease;
                box-shadow: var(--shadow-light);
                flex-shrink: 0;
            }
    
            #send-message-btn:hover {
                background: linear-gradient(135deg, var(--primary-light), var(--primary-color));
                transform: translateY(-1px);
                box-shadow: var(--shadow-medium);
            }
    
            #send-message-btn:disabled {
                background: var(--border-color);
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }
    
            @media (max-width: 768px) {
                .chat-header { 
                    padding: 0.8rem; 
                    min-height: 60px;
                }
                
                .landlord-image {
                    width: 40px;
                    height: 40px;
                }
                
                .chat-info h2 { 
                    font-size: 1rem; 
                }
                
                .chat-info p { 
                    font-size: 0.75rem; 
                }
                
                .chat-messages {
                    max-height: calc(100vh - 160px);
                    padding-bottom: 70px;
                }
                
                .chat-input-container { 
                    padding: 0.7rem; 
                    margin-left: 0;
                    width: 100%;
                }
                
                #message-input { 
                    padding: 0.8rem 1rem; 
                    min-height: 45px; 
                }
                
                #send-message-btn { 
                    padding: 0.8rem 1.2rem; 
                }
                
                .message { 
                    max-width: 80%; 
                    font-size: 0.9rem; 
                }
            }
    
            @media (max-width: 576px) {
                .chat-container {
                    position: relative;
                    padding-bottom: 60px;
                    height: calc(var(--vh, 1vh) * 100);
                }
    
                .chat-header { 
                    padding: 0.6rem; 
                    min-height: 55px;
                }
                
                .landlord-image {
                    width: 36px;
                    height: 36px;
                    margin-right: 0.7rem;
                }
                
                .chat-info h2 { 
                    font-size: 0.9rem; 
                }
                
                .chat-info p { 
                    font-size: 0.7rem; 
                    max-width: 150px;
                }
                
                .chat-messages {
                    max-height: calc(var(--vh, 1vh) * 100 - 150px);
                    padding: 0.4rem;
                    padding-bottom: 80px;
                    margin-bottom: 0;
                }
                
                .chat-input-container { 
                    padding: 0.6rem; 
                    height: auto;
                    min-height: 60px;
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    margin-left: 0;
                    width: 100%;
                    background-color: var(--background-white);
                    border-top: 1px solid var(--border-color);
                }
                
                #message-input { 
                    padding: 0.7rem 0.9rem; 
                    min-height: 40px; 
                    font-size: 0.85rem;
                    width: calc(100% - 50px);
                }
                
                #send-message-btn { 
                    width: 40px; 
                    height: 40px; 
                    padding: 0; 
                    border-radius: 50%;
                    flex-shrink: 0;
                }
                
                #send-message-btn .fas { 
                    font-size: 1rem; 
                }
                
                .message { 
                    max-width: 85%; 
                    font-size: 0.85rem; 
                    margin-bottom: 0.8rem; 
                    padding: 0.6rem 1rem; 
                }
                
                .back-btn {
                    width: 32px;
                    height: 32px;
                    margin-right: 0.7rem;
                }
            }
    
            .navbar.disabled a {
                pointer-events: none;
                opacity: 0.5;
                cursor: not-allowed;
            }
        `;
        document.head.appendChild(fontAwesome);
        document.head.appendChild(style);
    
        function setVH() {
            let vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        }
        setVH();
        window.addEventListener('resize', setVH);
    
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    
        scrollToLastMessage();
    
        const backBtn = mainContent.querySelector('.back-btn');
        const sendMessageBtn = document.getElementById('send-message-btn');
        const messageInput = document.getElementById('message-input');
    
        function cleanupChat() {
            if (socket) {
                socket.disconnect();
                socket = null;
            }
            if (menuToggle) menuToggle.style.display = '';
    
            const navbar = document.getElementById('navbar');
            if (navbar && navbar.classList.contains('disabled')) {
                navbar.classList.remove('disabled');
            }
    
            landlordEmail = null;
            currentConversationId = null;
            localStorage.removeItem('currentConversationId');
            const chatStyle = document.getElementById('chat-styles');
            if (chatStyle) chatStyle.remove();
            const fontAwesomeLink = document.querySelector('link[href*="font-awesome"]');
            if (fontAwesomeLink) fontAwesomeLink.remove();
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
            window.removeEventListener('resize', setVH);
        }
    
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                cleanupChat();
                renderConversations();
            });
        }
    
        if (sendMessageBtn) {
            sendMessageBtn.addEventListener('click', sendMessage);
        }
    
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });
        }
    }

    // Send message
    function sendMessage() {
        const messageInput = document.getElementById('message-input');
        const content = messageInput.value.trim();
        if (!content || !socket || !socket.connected || !currentConversationId || !landlordEmail) return;
        const userEmail = localStorage.getItem('currentUserEmail');
        const sentAt = new Date().toISOString();
        const messageData = {
            conversationId: currentConversationId,
            content,
            senderEmail: userEmail,
            receiverEmail: landlordEmail,
            is_read: false,
            sent_at: sentAt
        };
        displayMessage({ ...messageData, sender_email: userEmail });
        scrollToLastMessage();
        socket.emit('send_message', messageData);
        messageInput.value = '';
    }

    // Display message in chat
    function displayMessage(message) {
        const messagesContainer = document.getElementById('chat-messages');
        const userEmail = localStorage.getItem('currentUserEmail');
        const isSent = message.sender_email === userEmail;
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isSent ? 'sent' : 'received'} ${message.is_read ? 'read' : ''}`;
        const localTime = new Date(message.sent_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
        messageDiv.innerHTML = `
            <p>${message.content}</p>
            <div class="message-timestamp">${localTime}</div>
        `;
        messagesContainer.appendChild(messageDiv);
        scrollToLastMessage();
    }

    // Update message status
    function updateMessageStatus() {
        document.querySelectorAll('.message.sent').forEach(message => {
            if (!message.classList.contains('read')) {
                message.classList.add('read');
            }
        });
    }

    // Load messages
    async function loadMessages(conversationId) {
        try {
            const response = await fetch(`/api/conversations/${conversationId}/messages`, {
                method: 'GET',
                headers: { 'x-user-email': localStorage.getItem('currentUserEmail') || '' }
            });
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            const data = await response.json();
            if (data.success) {
                const messagesContainer = document.getElementById('chat-messages');
                messagesContainer.innerHTML = '';
                data.messages.forEach(displayMessage);
                socket.emit('mark_as_read', { conversationId, userEmail: localStorage.getItem('currentUserEmail') });
            } else {
                showMessage(data.message || 'Error al cargar los mensajes.', true);
            }
        } catch (error) {
            showMessage(`Error al cargar los mensajes: ${error.message}`, true);
        }
    }

    // Initiate conversation
    async function initiateConversation(publicationId) {
        const elements = showLoadingSpinner();
        try {
            const userEmail = localStorage.getItem('currentUserEmail');
            if (!userEmail) throw new Error('No se encontró el email del usuario.');
            if (!SOCKET_URL) await fetchSocketUrl(); // Asegurarse de que la URL del socket esté cargada
            const publicationResponse = await fetch(`/api/publications/tenant/${publicationId}`, {
                method: 'GET',
                headers: { 'x-user-email': userEmail }
            });
            if (!publicationResponse.ok) throw new Error(`Error HTTP: ${publicationResponse.status}`);
            const publicationData = await publicationResponse.json();
            if (!publicationData.success) throw new Error(publicationData.message || 'Error al obtener la publicación');
            const publication = publicationData.publication;
            landlordEmail = publication.landlord_email || '';
            const conversationResponse = await fetch('/api/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': userEmail
                },
                body: JSON.stringify({ publicationId, landlordEmail })
            });
            if (!conversationResponse.ok) throw new Error(`Error HTTP: ${conversationResponse.status}`);
            const conversationData = await conversationResponse.json();
            if (!conversationData.success) throw new Error(conversationData.message || 'Error al iniciar la conversación');
            currentConversationId = conversationData.conversationId;
            localStorage.setItem('currentConversationId', currentConversationId);
            await initializeSocket();
            socket.emit('join_conversation', { conversationId: currentConversationId, userEmail });
            renderChatInterface(publication, {
                full_name: publication.full_name || 'Arrendador desconocido',
                profile_picture: publication.profile_picture || '/img/default-profile.png',
                email: publication.landlord_email
            });
            await loadMessages(currentConversationId);
            hideLoadingSpinner(elements);
        } catch (error) {
            hideLoadingSpinner(elements);
            showMessage(error.message || 'Error al iniciar la conversación.', true);
        }
    }



    // Navigation event listeners
    if (searchPropertiesLink) {
        searchPropertiesLink.addEventListener('click', (event) => {
            event.preventDefault();
            renderAvailablePublications();
        });
    }
    if (dashboardLink) {
        dashboardLink.addEventListener('click', (event) => {
            event.preventDefault();
            restoreDashboard();
        });
    }
    if (conversationsLink) {
        conversationsLink.addEventListener('click', (event) => {
            event.preventDefault();
            renderConversations();
        });
    }

    // Expose functions
    window.fetchNotifications = fetchNotifications;
    window.renderAvailablePublications = renderAvailablePublications;
    window.renderPublicationDetails = renderPublicationDetails;
    window.renderConversations = renderConversations;

    // Initialize
    initializeReportButtons();
    initializeContactButtons();
    fetchNotifications();
});

// Nuevo Bloque para Conocer los Acuerdos del Arrendatario
document.addEventListener('DOMContentLoaded', function () {
    // DOM Variables
    const mainContent = document.getElementById('main-content');
    const acuerdosLink = document.querySelector('a[href="acuerdos"]');
    const dashboardLink = document.querySelector('a[href="dashboard"]');
    const originalDashboardContent = mainContent ? mainContent.innerHTML : '';
    let loadingOverlay = null;
    let loadingSpinner = null;

    // Mostrar mensaje (error o éxito)
    function showMessage(message, isError = true) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background-color: rgba(0,0,0,0.5); z-index: 2999; opacity: 0;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(overlay);

        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background-color: #fff; padding: 2rem; border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 3000; text-align: center;
            font-family: 'Roboto', sans-serif; color: ${isError ? '#dc2626' : '#2b6b6b'};
            opacity: 0; transition: opacity 0.3s ease, transform 0.3s ease;
        `;
        messageDiv.innerHTML = `
            <h3 style="margin-bottom: 1rem;">${isError ? '¡Uy!' : '¡Éxito!'}</h3>
            <p>${message}</p>
            <button style="
                background: linear-gradient(135deg, #2b6b6b, #4c9f9f); color: white;
                border: none; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer;
                margin-top: 1rem; font-weight: 500;
            ">Aceptar</button>
        `;
        document.body.appendChild(messageDiv);

        setTimeout(() => {
            overlay.style.opacity = '1';
            messageDiv.style.opacity = '1';
        }, 10);

        messageDiv.querySelector('button').addEventListener('click', () => {
            overlay.style.opacity = '0';
            messageDiv.style.opacity = '0';
            messageDiv.style.transform = 'translate(-50%, -60%)';
            setTimeout(() => {
                document.body.removeChild(overlay);
                document.body.removeChild(messageDiv);
            }, 300);
        });
    }

    // Mostrar spinner de carga
    function showLoadingSpinner() {
        loadingOverlay = document.createElement('div');
        loadingOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background-color: rgba(0,0,0,0.5); z-index: 2998; opacity: 0;
            transition: opacity 0.3s ease; pointer-events: auto;
        `;
        document.body.appendChild(loadingOverlay);

        loadingSpinner = document.createElement('div');
        loadingSpinner.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background-color: #fff; padding: 2rem; border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 2999; text-align: center;
            font-family: 'Roboto', sans-serif; color: #2b6b6b; opacity: 0;
            transition: opacity 0.3s ease;
        `;
        loadingSpinner.innerHTML = `
            <div style="border: 4px solid #f3f3f3; border-top: 4px solid #2b6b6b; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
            <p style="margin-top: 1rem;">Cargando...</p>
        `;
        document.body.appendChild(loadingSpinner);

        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);

        setTimeout(() => {
            loadingOverlay.style.opacity = '1';
            loadingSpinner.style.opacity = '1';
        }, 10);
    }

    // Ocultar spinner de carga
    function hideLoadingSpinner() {
        if (loadingOverlay && loadingSpinner) {
            loadingOverlay.style.opacity = '0';
            loadingSpinner.style.opacity = '0';
            setTimeout(() => {
                if (loadingOverlay && document.body.contains(loadingOverlay)) {
                    document.body.removeChild(loadingOverlay);
                }
                if (loadingSpinner && document.body.contains(loadingSpinner)) {
                    document.body.removeChild(loadingSpinner);
                }
                loadingOverlay = null;
                loadingSpinner = null;
            }, 300);
        }
    }

    // Restaurar dashboard
    async function restoreDashboard() {
        if (!mainContent) {
            console.error('No se encontró #main-content');
            return;
        }
        mainContent.innerHTML = originalDashboardContent;
        if (typeof fetchStats === 'function') {
            await fetchStats();
        }
        if (typeof window.fetchNotifications === 'function') {
            await window.fetchNotifications();
        }
    }

    // Renderizar detalles del acuerdo para el arrendatario
    async function renderAcuerdoDetails(acuerdoId) {
        if (!mainContent) {
            console.error('No se encontró #main-content');
            showMessage('Error: No se encontró el contenedor principal.');
            return;
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
        showLoadingSpinner();

        try {
            const userEmail = localStorage.getItem('currentUserEmail') || '';
            if (!userEmail) {
                throw new Error('No se encontró el email del usuario en localStorage. Por favor, inicia sesión nuevamente.');
            }

            // Obtener detalles del acuerdo
            const response = await fetch(`/api/acuerdos/${acuerdoId}`, {
                headers: { 'x-user-email': userEmail }
            });
            if (!response.ok) {
                throw new Error('Error al obtener los detalles del acuerdo: ' + response.statusText);
            }
            const { acuerdo } = await response.json();
            if (!acuerdo) {
                throw new Error('Acuerdo no encontrado.');
            }

            // Formatear datos
            const formattedPrice = Number(acuerdo.price).toLocaleString('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });

            let formattedStatus = '';
            switch (acuerdo.status) {
                case 'pending':
                    formattedStatus = 'Pendiente';
                    break;
                case 'active':
                    formattedStatus = 'Activo';
                    break;
                case 'expired':
                    formattedStatus = 'Expirado';
                    break;
                case 'cancelled':
                    formattedStatus = 'Cancelado';
                    break;
                case 'en_proceso':
                    formattedStatus = 'En Proceso';
                    break;
                default:
                    formattedStatus = acuerdo.status;
            }

            const startDate = acuerdo.start_date_formatted || 'No especificada';
            const endDate = acuerdo.end_date_formatted || 'No especificada';
            const createdAt = acuerdo.created_at_formatted || 'No especificada';
            const updatedAt = acuerdo.updated_at_formatted || 'No especificada';

            mainContent.innerHTML = `
                <div class="acuerdo-details-section">
                    <h1>Detalles del Acuerdo</h1>
                    <div class="acuerdo-details">
                        <h2>${acuerdo.publication_title || 'Título no disponible'}</h2>
                        <p><strong>Número de Contrato:</strong> ${acuerdo.contract_id}</p>
                        <p><strong>Estado:</strong> ${formattedStatus}</p>
                        <p><strong>Arrendador:</strong> ${acuerdo.landlord_name || 'No disponible'}</p>
                        <p><strong>Arrendatario:</strong> ${acuerdo.tenant_name || 'No disponible'}</p>
                        <p><strong>Precio:</strong> ${formattedPrice}</p>
                        <p><strong>Duración:</strong> ${acuerdo.duration_months || 'No especificada'} meses</p>
                        <p><strong>Fecha de Inicio:</strong> ${startDate}</p>
                        <p><strong>Fecha de Finalización:</strong> ${endDate}</p>
                        <p><strong>Creación del Contrato:</strong> ${createdAt}</p>
                        <p><strong>Última Modificación:</strong> ${updatedAt}</p>
                        ${acuerdo.additional_notes ? `<p><strong>Notas Adicionales:</strong> ${acuerdo.additional_notes}</p>` : ''}
                    </div>
                    <div class="contract-preview">
                        <h3>Previsualización del Contrato Original</h3>
                        <iframe id="contract-preview" style="width: 100%; height: 400px; border: 1px solid #e5e7eb; border-radius: 6px;"></iframe>
                    </div>
                    <div class="signed-contract-section">
                        <h3>Contrato Firmado</h3>
                        ${acuerdo.signed_contract_file ? `
                            <iframe id="signed-contract-preview" style="width: 100%; height: 400px; border: 1px solid #e5e7eb; border-radius: 6px;"></iframe>
                        ` : `
                            <div class="upload-contract-area">
                                <p style="color: #666; text-align: center; margin-bottom: 1.5rem;">Hola, sube tu contrato firmado.</p>
                                <div class="upload-contract">
                                    <input type="file" id="contract-upload" accept="application/pdf" style="display: none;">
                                    <button id="upload-btn" class="action-btn upload">Subir Contrato Firmado</button>
                                </div>
                            </div>
                        `}
                    </div>
                    <div class="acuerdo-actions">
                        <button id="back-btn" class="action-btn back">Volver</button>
                    </div>
                </div>
            `;

            const style = document.createElement('style');
            style.innerHTML = `
                .acuerdo-details-section {
                    max-width: 800px;
                    margin: 2rem auto;
                    padding: 0 1rem;
                }
                .acuerdo-details-section h1 {
                    font-family: 'Roboto', sans-serif;
                    color: #2b6b6b;
                    font-size: 2rem;
                    margin-bottom: 1rem;
                    text-align: center;
                }
                .acuerdo-details {
                    background: #f9fafb;
                    padding: 1.5rem;
                    border-radius: 8px;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                    margin-bottom: 2rem;
                }
                .acuerdo-details h2 {
                    font-family: 'Roboto', sans-serif;
                    font-size: 1.5rem;
                    color: #333;
                    margin-bottom: 1rem;
                }
                .acuerdo-details p {
                    font-family: 'Roboto', sans-serif;
                    font-size: 0.9rem;
                    color: #666;
                    margin: 0.5rem 0;
                }
                .contract-preview, .signed-contract-section {
                    margin-bottom: 2rem;
                }
                .contract-preview h3, .signed-contract-section h3 {
                    font-family: 'Roboto', sans-serif;
                    font-size: 1.2rem;
                    color: #2b6b6b;
                    margin-bottom: 0.5rem;
                }
                .upload-contract-area {
                    background: #f9fafb;
                    padding: 2rem;
                    border-radius: 8px;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                    text-align: center;
                }
                .upload-contract {
                    margin-top: 1rem;
                }
                .acuerdo-actions {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                    margin-top: 1rem;
                }
                .action-btn {
                    background: linear-gradient(135deg, #2b6b6b, #4c9f9f);
                    color: white;
                    border: none;
                    padding: 0.8rem 1.5rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-family: 'Roboto', sans-serif;
                    font-size: 0.9rem;
                    font-weight: 500;
                }
                .action-btn:hover {
                    background: linear-gradient(135deg, #4c9f9f, #2b6b6b);
                }
                .action-btn.upload {
                    background: linear-gradient(135deg, #2b6b6b, #4c9f9f);
                }
                .action-btn.back {
                    background: #e5e7eb;
                    color: #374151;
                }
                .action-btn.back:hover {
                    background: #d1d5db;
                }
                @media (max-width: 480px) {
                    .acuerdo-actions {
                        flex-direction: column;
                    }
                    .action-btn {
                        width: 100%;
                    }
                }
            `;
            document.head.appendChild(style);

            const contractPreview = document.getElementById('contract-preview');
            const signedContractPreview = document.getElementById('signed-contract-preview');
            const uploadBtn = document.getElementById('upload-btn');
            const contractUploadInput = document.getElementById('contract-upload');

            // Intentar cargar el PDF pregenerado si existe
            const contractUrl = `/contracts/contrato_${acuerdo.contract_id}.pdf`;
            try {
                const pregeneratedResponse = await fetch(contractUrl, {
                    method: 'HEAD'
                });
                if (pregeneratedResponse.ok) {
                    contractPreview.src = contractUrl;
                } else {
                    const contractData = {
                        publication_id: acuerdo.publication_id || '',
                        tenant_email: acuerdo.tenant_email || userEmail,
                        price: Number(acuerdo.price) || 0,
                        duration_months: Number(acuerdo.duration_months) || 0,
                        start_date: acuerdo.start_date || '',
                        end_date: acuerdo.end_date || '',
                        additional_notes: acuerdo.additional_notes || '',
                        publication_title: acuerdo.publication_title || 'Desconocido',
                        tenant_name: acuerdo.tenant_name || acuerdo.tenant_email || 'Arrendatario Desconocido'
                    };

                    if (!contractData.publication_id || !contractData.tenant_email || !contractData.start_date || !contractData.end_date) {
                        const doc = contractPreview.contentDocument || contractPreview.contentWindow.document;
                        doc.open();
                        doc.write(`
                            <html>
                                <body style="font-family: 'Roboto', sans-serif; text-align: center; padding: 20px; color: #dc2626;">
                                    <h3>Error</h3>
                                    <p>No se pudo generar la previsualización del contrato: Faltan datos requeridos (ID de publicación, email del arrendatario, fechas).</p>
                                </body>
                            </html>
                        `);
                        doc.close();
                    } else {
                        try {
                            console.log('Datos enviados a la previsualización:', contractData);
                            const previewResponse = await fetch('/api/acuerdos/preview', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'x-user-email': userEmail
                                },
                                body: JSON.stringify(contractData)
                            });

                            if (!previewResponse.ok) {
                                const errorText = await previewResponse.text();
                                throw new Error(`Error al generar la previsualización: ${previewResponse.statusText} - ${errorText}`);
                            }

                            const pdfBlob = await previewResponse.blob();
                            const pdfUrl = URL.createObjectURL(pdfBlob);
                            contractPreview.src = pdfUrl;
                        } catch (error) {
                            console.error('Error al generar previsualización del contrato:', error);
                            const doc = contractPreview.contentDocument || contractPreview.contentWindow.document;
                            doc.open();
                            doc.write(`
                                <html>
                                    <body style="font-family: 'Roboto', sans-serif; text-align: center; padding: 20px; color: #dc2626;">
                                        <h3>Error</h3>
                                        <p>No se pudo generar la previsualización del contrato: ${error.message}</p>
                                    </body>
                                </html>
                            `);
                            doc.close();
                        }
                    }
                }
            } catch (error) {
                console.error('Error al verificar el PDF pregenerado:', error);
                const contractData = {
                    publication_id: acuerdo.publication_id || '',
                    tenant_email: acuerdo.tenant_email || userEmail,
                    price: Number(acuerdo.price) || 0,
                    duration_months: Number(acuerdo.duration_months) || 0,
                    start_date: acuerdo.start_date || '',
                    end_date: acuerdo.end_date || '',
                    additional_notes: acuerdo.additional_notes || '',
                    publication_title: acuerdo.publication_title || 'Desconocido',
                    tenant_name: acuerdo.tenant_name || acuerdo.tenant_email || 'Arrendatario Desconocido'
                };

                if (!contractData.publication_id || !contractData.tenant_email || !contractData.start_date || !contractData.end_date) {
                    const doc = contractPreview.contentDocument || contractPreview.contentWindow.document;
                    doc.open();
                    doc.write(`
                        <html>
                            <body style="font-family: 'Roboto', sans-serif; text-align: center; padding: 20px; color: #dc2626;">
                                <h3>Error</h3>
                                <p>No se pudo generar la previsualización del contrato: Faltan datos requeridos (ID de publicación, email del arrendatario, fechas).</p>
                            </body>
                        </html>
                    `);
                    doc.close();
                } else {
                    try {
                        console.log('Datos enviados a la previsualización:', contractData);
                        const previewResponse = await fetch('/api/acuerdos/preview', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'x-user-email': userEmail
                            },
                            body: JSON.stringify(contractData)
                        });

                        if (!previewResponse.ok) {
                            const errorText = await previewResponse.text();
                            throw new Error(`Error al generar la previsualización: ${previewResponse.statusText} - ${errorText}`);
                        }

                        const pdfBlob = await previewResponse.blob();
                        const pdfUrl = URL.createObjectURL(pdfBlob);
                        contractPreview.src = pdfUrl;
                    } catch (error) {
                        console.error('Error al generar previsualización del contrato:', error);
                        const doc = contractPreview.contentDocument || contractPreview.contentWindow.document;
                        doc.open();
                        doc.write(`
                            <html>
                                <body style="font-family: 'Roboto', sans-serif; text-align: center; padding: 20px; color: #dc2626;">
                                    <h3>Error</h3>
                                    <p>No se pudo generar la previsualización del contrato: ${error.message}</p>
                                </body>
                            </html>
                        `);
                        doc.close();
                    }
                }
            }

            // Previsualización del contrato firmado
            if (acuerdo.signed_contract_file) {
                const signedContractUrl = `/signed_contracts/signed_${acuerdo.contract_id}.pdf`;
                try {
                    const signedResponse = await fetch(signedContractUrl);
                    if (!signedResponse.ok) {
                        throw new Error('Error al cargar el contrato firmado: ' + signedResponse.statusText);
                    }
                    const signedBlob = await signedResponse.blob();
                    const signedUrl = URL.createObjectURL(signedBlob);
                    signedContractPreview.src = signedUrl;
                } catch (error) {
                    console.error('Error al cargar contrato firmado:', error);
                    const doc = signedContractPreview.contentDocument || signedContractPreview.contentWindow.document;
                    doc.open();
                    doc.write(`
                        <html>
                            <body style="font-family: 'Roboto', sans-serif; text-align: center; padding: 20px; color: #666;">
                                <p>No se encontró un contrato firmado subido por el arrendatario.</p>
                            </body>
                        </html>
                    `);
                    doc.close();
                }
            }

            // Manejar la subida del contrato
            if (uploadBtn && contractUploadInput) {
                uploadBtn.addEventListener('click', () => {
                    contractUploadInput.click();
                });

                contractUploadInput.addEventListener('change', async () => {
                    const file = contractUploadInput.files[0];
                    if (!file) {
                        showMessage('Por favor, selecciona un archivo PDF.');
                        return;
                    }

                    if (file.type !== 'application/pdf') {
                        showMessage('Solo se permiten archivos PDF.');
                        return;
                    }

                    showLoadingSpinner();

                    try {
                        const formData = new FormData();
                        formData.append('signed_contract', file);
                        formData.append('contract_id', acuerdo.contract_id);

                        const uploadResponse = await fetch(`/api/acuerdos/${acuerdoId}/upload-signed`, {
                            method: 'POST',
                            headers: {
                                'x-user-email': userEmail
                            },
                            body: formData
                        });

                        if (!uploadResponse.ok) {
                            const errorText = await uploadResponse.text();
                            throw new Error(errorText || 'Error al subir el contrato firmado.');
                        }

                        const result = await uploadResponse.json();
                        if (!result.success) {
                            throw new Error(result.message || 'Error al subir el contrato firmado.');
                        }

                        hideLoadingSpinner();
                        showMessage('Contrato firmado subido exitosamente.', false);
                        setTimeout(() => renderAcuerdoDetails(acuerdoId), 1500);
                    } catch (error) {
                        hideLoadingSpinner();
                        showMessage('Error al subir el contrato: ' + error.message);
                    }
                });
            }

            document.getElementById('back-btn').addEventListener('click', () => {
                renderMyAcuerdos();
            });

            hideLoadingSpinner();
        } catch (error) {
            hideLoadingSpinner();
            showMessage('Error al cargar los detalles del acuerdo: ' + error.message);
        }
    }

    // Renderizar la lista de acuerdos del arrendatario
    async function renderMyAcuerdos() {
        if (!mainContent) {
            console.error('No se encontró #main-content');
            showMessage('Error: No se encontró el contenedor principal.');
            return;
        }

        mainContent.innerHTML = `
            <div class="my-acuerdos-section">
                <h1>Mis Acuerdos de Arrendamiento</h1>
                <div class="filter-section">
                    <div class="filter-form">
                        <div class="filter-group">
                            <label for="filter-status">Estado:</label>
                            <select id="filter-status">
                                <option value="">Todos</option>
                                <option value="pending">Pendiente</option>
                                <option value="active">Activo</option>
                                <option value="expired">Expirado</option>
                                <option value="cancelled">Cancelado</option>
                                <option value="en_proceso">En Proceso</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="filter-title">Título de Publicación:</label>
                            <input type="text" id="filter-title" placeholder="Buscar por título...">
                        </div>
                        <div class="filter-group">
                            <label for="filter-contract-id">Número de Contrato:</label>
                            <input type="text" id="filter-contract-id" placeholder="Buscar por número...">
                        </div>
                        <div class="filter-actions">
                            <button id="filter-btn">Filtrar</button>
                            <button id="reset-btn">Limpiar</button>
                        </div>
                    </div>
                </div>
                <div class="acuerdos-list" id="acuerdos-list"></div>
            </div>
        `;

        const style = document.createElement('style');
        style.innerHTML = `
            .my-acuerdos-section {
                max-width: 1200px;
                margin: 2rem auto;
                padding: 0 1rem;
            }
            .my-acuerdos-section h1 {
                font-family: 'Roboto', sans-serif;
                color: #2b6b6b;
                font-size: 2rem;
                margin-bottom: 1.5rem;
                text-align: center;
            }
            .filter-section {
                margin-bottom: 2rem;
                background: #f9fafb;
                padding: 1rem;
                border-radius: 8px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            }
            .filter-form {
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
                align-items: flex-end;
                justify-content: center;
            }
            .filter-group {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                min-width: 200px;
                flex: 1;
            }
            .filter-group label {
                font-family: 'Roboto', sans-serif;
                font-size: 0.9rem;
                color: #333;
                font-weight: 500;
            }
            .filter-group select,
            .filter-group input {
                padding: 0.5rem;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                font-family: 'Roboto', sans-serif;
                font-size: 0.9rem;
                color: #333;
                background: #fff;
                outline: none;
                transition: border-color 0.3s ease;
                width: 100%;
            }
            .filter-group select:focus,
            .filter-group input:focus {
                border-color: #2b6b6b;
            }
            .filter-actions {
                display: flex;
                gap: 0.5rem;
                align-items: flex-end;
            }
            .filter-form button {
                background: linear-gradient(135deg, #2b6b6b, #4c9f9f);
                color: white;
                border: none;
                padding: 0.6rem 1.2rem;
                border-radius: 6px;
                cursor: pointer;
                font-family: 'Roboto', sans-serif;
                font-size: 0.9rem;
                font-weight: 500;
                transition: background 0.3s ease;
                min-width: 80px;
            }
            .filter-form button:hover {
                background: linear-gradient(135deg, #4c9f9f, #2b6b6b);
            }
            #reset-btn {
                background: #e5e7eb;
                color: #374151;
            }
            #reset-btn:hover {
                background: #d1d5db;
            }
            .acuerdos-list {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 1rem;
                padding: 1rem 0;
            }
            .acuerdo-card {
                background: #fff;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                overflow: hidden;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                border: 1px solid #e5e7eb;
                display: flex;
                flex-direction: column;
            }
            .acuerdo-card:hover {
                transform: translateY(-3px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
            .acuerdo-content {
                flex: 1;
                padding: 0.5rem 1rem;
            }
            .acuerdo-card h3 {
                font-family: 'Roboto', sans-serif;
                font-size: 1.1rem;
                font-weight: 600;
                color: #333;
                margin: 0.5rem 0;
                line-height: 1.3;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-overflow: ellipsis;
                max-height: 2.6em;
            }
            .acuerdo-card p {
                font-family: 'Roboto', sans-serif;
                font-size: 0.85rem;
                color: #666;
                margin: 0.2rem 0;
                line-height: 1.2;
            }
            .acuerdo-actions {
                display: flex;
                justify-content: space-between;
                padding: 0.5rem 1rem;
                border-top: 1px solid #e5e7eb;
                background: #f9fafb;
                gap: 0.5rem;
                margin-top: auto;
            }
            .acuerdo-action-btn {
                background: #e5e7eb;
                color: #374151;
                border: none;
                padding: 0.4rem 0.6rem;
                border-radius: 6px;
                cursor: pointer;
                font-family: 'Roboto', sans-serif;
                font-size: 0.8rem;
                font-weight: 500;
                flex: 1;
                text-align: center;
                transition: background 0.3s ease, color 0.3s ease;
            }
            .acuerdo-action-btn:hover:not(:disabled) {
                background: #d1d5db;
            }
            .acuerdo-action-btn:disabled {
                background: #e5e7eb;
                color: #9ca3af;
                cursor: not-allowed;
            }
            .no-acuerdos {
                text-align: center;
                padding: 2rem;
                font-family: 'Roboto', sans-serif;
                color: #555;
            }
            .no-acuerdos span {
                font-size: 2rem;
                display: block;
                margin-bottom: 1rem;
            }
            .no-acuerdos.error {
                color: #dc2626;
            }
            @media (max-width: 768px) {
                .filter-form {
                    flex-direction: column;
                    align-items: stretch;
                }
                .filter-group {
                    min-width: 100%;
                }
                .filter-actions {
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .filter-form button {
                    width: 100%;
                }
                .acuerdos-list {
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                }
            }
            @media (max-width: 480px) {
                .acuerdos-list {
                    grid-template-columns: 1fr;
                }
                .acuerdo-card h3 {
                    font-size: 1rem;
                }
                .acuerdo-actions {
                    flex-direction: column;
                }
                .acuerdo-action-btn {
                    margin-bottom: 0.5rem;
                }
                .acuerdo-action-btn:last-child {
                    margin-bottom: 0;
                }
            }
        `;
        document.head.appendChild(style);

        const filterStatus = document.getElementById('filter-status');
        const filterTitle = document.getElementById('filter-title');
        const filterContractId = document.getElementById('filter-contract-id');
        const filterBtn = document.getElementById('filter-btn');
        const resetBtn = document.getElementById('reset-btn');

        async function fetchFilteredAcuerdos() {
            const status = filterStatus.value;
            const title = filterTitle.value.trim();
            const contractId = filterContractId.value.trim();

            const params = new URLSearchParams();
            if (status) params.append('status', status);
            if (title) params.append('title', title);
            if (contractId) params.append('contract_id', contractId);

            await fetchMyAcuerdos(params.toString());
        }

        filterBtn.addEventListener('click', () => {
            fetchFilteredAcuerdos();
        });

        filterTitle.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                fetchFilteredAcuerdos();
            }
        });

        filterContractId.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                fetchFilteredAcuerdos();
            }
        });

        resetBtn.addEventListener('click', () => {
            filterStatus.value = '';
            filterTitle.value = '';
            filterContractId.value = '';
            fetchMyAcuerdos();
        });

        await fetchMyAcuerdos();
    }

// Obtener y mostrar los acuerdos del arrendatario
    async function fetchMyAcuerdos(queryString = '') {
        const acuerdosList = document.getElementById('acuerdos-list');
        if (!acuerdosList) {
            console.error('No se encontró #acuerdos-list');
            showMessage('Error: No se encontró el contenedor de acuerdos.');
            return;
        }

        showLoadingSpinner();

        try {
            const userEmail = localStorage.getItem('currentUserEmail') || '';
            if (!userEmail) {
                throw new Error('No se encontró el email del usuario en localStorage. Por favor, inicia sesión nuevamente.');
            }

            const url = queryString ? `/api/acuerdos?${queryString}` : '/api/acuerdos';
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'x-user-email': userEmail
                }
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            acuerdosList.innerHTML = '';

            if (!data.success) {
                throw new Error(data.message || 'Error al obtener los acuerdos');
            }

            if (!data.acuerdos || data.acuerdos.length === 0) {
                acuerdosList.innerHTML = `
                    <div class="no-acuerdos">
                        <span>📋</span>
                        <p>No se encontraron acuerdos con los criterios seleccionados.</p>
                    </div>
                `;
                hideLoadingSpinner();
                return;
            }

            data.acuerdos.forEach(acuerdo => {
                if (!acuerdo.id || !acuerdo.publication_title || !acuerdo.contract_id) {
                    console.warn('Acuerdo incompleto:', acuerdo);
                    return;
                }

                const acuerdoCard = document.createElement('div');
                acuerdoCard.className = 'acuerdo-card';

                let formattedStatus = '';
                switch (acuerdo.status) {
                    case 'pending':
                        formattedStatus = 'Pendiente';
                        break;
                    case 'active':
                        formattedStatus = 'Activo';
                        break;
                    case 'expired':
                        formattedStatus = 'Expirado';
                        break;
                    case 'cancelled':
                        formattedStatus = 'Cancelado';
                        break;
                    case 'en_proceso':
                        formattedStatus = 'En Proceso';
                        break;
                    default:
                        formattedStatus = acuerdo.status;
                }

                const startDate = acuerdo.start_date_formatted || 'No especificada';
                const endDate = acuerdo.end_date_formatted || 'No especificada';
                const createdAt = acuerdo.created_at_formatted || 'No especificada';
                const updatedAt = acuerdo.updated_at_formatted || 'No especificada';

                // Deshabilitar el botón "Ver Detalles" si el estado es 'cancelled' o 'expired'
                const isDisabled = ['cancelled', 'expired'].includes(acuerdo.status);

                acuerdoCard.innerHTML = `
                    <div class="acuerdo-content">
                        <h3>${acuerdo.publication_title}</h3>
                        <p><strong>Número de Contrato:</strong> ${acuerdo.contract_id}</p>
                        <p><strong>Estado:</strong> ${formattedStatus}</p>
                        <p><strong>Arrendador:</strong> ${acuerdo.landlord_name || 'No disponible'}</p>
                        <p><strong>Duración:</strong> ${acuerdo.duration_months || 'No especificada'} meses</p>
                        <p><strong>Inicio:</strong> ${startDate}</p>
                        <p><strong>Fin:</strong> ${endDate}</p>
                    </div>
                    <div class="acuerdo-actions">
                        <button class="acuerdo-action-btn view" data-id="${acuerdo.id}" ${isDisabled ? 'disabled' : ''}>Ver Detalles</button>
                    </div>
                `;

                acuerdosList.appendChild(acuerdoCard);

                const viewBtn = acuerdoCard.querySelector('.view');
                if (viewBtn) {
                    viewBtn.addEventListener('click', () => {
                        console.log(`Clic en "Ver Detalles" para el acuerdo ${acuerdo.id}`);
                        renderAcuerdoDetails(acuerdo.id);
                    });
                }
            });

            hideLoadingSpinner();
        } catch (error) {
            hideLoadingSpinner();
            console.error('Error obteniendo los acuerdos:', error);
            acuerdosList.innerHTML = `
                <p class="no-acuerdos error">Error al cargar tus acuerdos: ${error.message}</p>
            `;
        }
    }

    if (acuerdosLink) {
        acuerdosLink.addEventListener('click', (event) => {
            event.preventDefault();
            console.log('Clic en el enlace de "Mis Acuerdos"');
            renderMyAcuerdos();
        });
    } else {
        console.warn('No se encontró el enlace de "Mis Acuerdos" (a[href="acuerdos"])');
    }

    if (dashboardLink) {
        dashboardLink.addEventListener('click', (event) => {
            event.preventDefault();
            console.log('Clic en el enlace de "Dashboard"');
            restoreDashboard();
        });
    } else {
        console.warn('No se encontró el enlace de "Dashboard" (a[href="dashboard"])');
    }
});

//Nuevo Bloque para reseñar al arrendador
document.addEventListener('DOMContentLoaded', function () {
    const mainContent = document.getElementById('main-content');
    const comunidadLink = document.querySelector('a[href="comunidad"]');
    const dashboardLink = document.querySelector('a[href="dashboard"]');
    const originalDashboardContent = mainContent ? mainContent.innerHTML : '';

    let loadingOverlay = null;
    let loadingSpinner = null;

    // Mostrar mensaje (error o éxito)
    function showMessage(message, isError = true) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background-color: rgba(0,0,0,0.5); z-index: 2999; opacity: 0;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(overlay);

        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background-color: #fff; padding: 2rem; border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 3000; text-align: center;
            font-family: 'Roboto', sans-serif; color: ${isError ? '#dc2626' : '#2b6b6b'};
            opacity: 0; transition: opacity 0.3s ease, transform 0.3s ease;
        `;
        messageDiv.innerHTML = `
            <h3 style="margin-bottom: 1rem;">${isError ? '¡Uy!' : '¡Éxito!'}</h3>
            <p>${message}</p>
            <button style="
                background: linear-gradient(135deg, #2b6b6b, #4c9f9f); color: white;
                border: none; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer;
                margin-top: 1rem; font-weight: 500;
                transition: transform 0.2s ease;
            ">Aceptar</button>
        `;
        document.body.appendChild(messageDiv);

        setTimeout(() => {
            overlay.style.opacity = '1';
            messageDiv.style.opacity = '1';
        }, 10);

        const acceptBtn = messageDiv.querySelector('button');
        acceptBtn.addEventListener('click', () => {
            overlay.style.opacity = '0';
            messageDiv.style.opacity = '0';
            messageDiv.style.transform = 'translate(-50%, -60%)';
            setTimeout(() => {
                document.body.removeChild(overlay);
                document.body.removeChild(messageDiv);
            }, 300);
        });

        acceptBtn.addEventListener('mouseover', () => {
            acceptBtn.style.transform = 'scale(1.05)';
        });
        acceptBtn.addEventListener('mouseout', () => {
            acceptBtn.style.transform = 'scale(1)';
        });
    }

    // Mostrar spinner de carga dentro del modal
    function showLoadingSpinner(modalContent) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'modal-loading-overlay';
        loadingOverlay.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background-color: rgba(255,255,255,0.8); z-index: 3001; opacity: 0;
            transition: opacity 0.2s ease; display: flex; justify-content: center; align-items: center;
        `;
        modalContent.appendChild(loadingOverlay);

        loadingSpinner = document.createElement('div');
        loadingSpinner.className = 'modal-loading-spinner';
        loadingSpinner.style.cssText = `
            background-color: transparent; text-align: center;
            font-family: 'Roboto', sans-serif; color: #2b6b6b; opacity: 0;
            transition: opacity 0.2s ease;
        `;
        loadingSpinner.innerHTML = `
            <div style="border: 4px solid #f3f3f3; border-top: 4px solid #2b6b6b; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
            <p style="margin-top: 1rem;">Guardando...</p>
        `;
        loadingOverlay.appendChild(loadingSpinner);

        setTimeout(() => {
            loadingOverlay.style.opacity = '1';
            loadingSpinner.style.opacity = '1';
        }, 10);
    }

    // Mostrar spinner de pantalla completa
    function showFullScreenSpinner() {
        loadingOverlay = document.createElement('div');
        loadingOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background-color: rgba(0,0,0,0.5); z-index: 2998; opacity: 0;
            transition: opacity 0.2s ease; pointer-events: auto;
        `;
        document.body.appendChild(loadingOverlay);

        loadingSpinner = document.createElement('div');
        loadingSpinner.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background-color: #fff; padding: 1.5rem; border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 2999; text-align: center;
            font-family: 'Roboto', sans-serif; color: #2b6b6b; opacity: 0;
            transition: opacity 0.2s ease, transform 0.3s ease;
        `;
        loadingSpinner.innerHTML = `
            <div style="border: 4px solid #f3f3f3; border-top: 4px solid #2b6b6b; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
            <p style="margin-top: 1rem;">Cargando...</p>
        `;
        document.body.appendChild(loadingSpinner);

        setTimeout(() => {
            loadingOverlay.style.opacity = '1';
            loadingSpinner.style.opacity = '1';
            loadingSpinner.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 10);
    }

    // Ocultar spinner de carga
    function hideLoadingSpinner() {
        if (loadingOverlay && loadingSpinner) {
            loadingOverlay.style.opacity = '0';
            loadingSpinner.style.opacity = '0';
            loadingSpinner.style.transform = 'translate(-50%, -50%) scale(0.9)';
            setTimeout(() => {
                if (loadingOverlay && document.body.contains(loadingOverlay)) {
                    document.body.removeChild(loadingOverlay);
                }
                if (loadingSpinner && document.body.contains(loadingSpinner)) {
                    document.body.removeChild(loadingSpinner);
                }
                loadingOverlay = null;
                loadingSpinner = null;
            }, 200);
        }
    }

    // Restaurar dashboard
    async function restoreDashboard() {
        if (!mainContent) {
            console.error('No se encontró #main-content');
            return;
        }
        mainContent.innerHTML = originalDashboardContent;
        if (typeof fetchStats === 'function') {
            await fetchStats();
        }
        if (typeof window.fetchNotifications === 'function') {
            await window.fetchNotifications();
        }
    }

    // Renderizar la sección de reseñas de arrendatarios
    async function renderLandlordReviews() {
        if (!mainContent) {
            console.error('No se encontró #main-content');
            showMessage('Error: No se encontró el contenedor principal.');
            return;
        }

        showFullScreenSpinner();

        try {
            mainContent.innerHTML = `
                <div class="landlord-reviews-section" id="landlord-reviews-section">
                    <h1>Reseñas de Arrendadores</h1>
                    <div class="search-section">
                        <input type="text" id="landlordSearch" placeholder="Buscar por nombre...">
                        <button id="searchBtn">Buscar</button>
                        <button id="resetBtn">Limpiar</button>
                    </div>
                    <div class="info-section">
                        <p>¿Quieres conocer tus comentarios y calificación en ArrendFacil? Conócelo aquí.</p>
                        <button class="landlord-action-btn view-my-details">Conocer</button>
                    </div>
                    <div class="landlords-list" id="landlords-list"></div>
                    <div class="pagination" id="pagination"></div>
                </div>
            `;

            const style = document.createElement('style');
            style.innerHTML = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .landlord-reviews-section { max-width: 1200px; margin: 2rem auto; padding: 0 1rem; }
                .landlord-reviews-section h1 { font-family: 'Roboto', sans-serif; color: #2b6b6b; font-size: 2rem; margin-bottom: 1rem; text-align: center; }
                .search-section { margin-bottom: 2rem; display: flex; justify-content: center; gap: 0.5rem; }
                .search-section input { width: 100%; max-width: 400px; padding: 0.8rem; border: 1px solid #e5e7eb; border-radius: 6px; font-family: 'Roboto', sans-serif; font-size: 1rem; color: #333; background: #fff; outline: none; transition: border-color 0.3s ease, box-shadow 0.3s ease; }
                .search-section input:focus { border-color: #2b6b6b; box-shadow: 0 0 5px rgba(43, 107, 107, 0.3); }
                .search-section button { background: linear-gradient(135deg, #2b6b6b, #4c9f9f); color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 6px; cursor: pointer; font-family: 'Roboto', sans-serif; font-size: 1rem; font-weight: 500; transition: background 0.3s ease, transform 0.2s ease; }
                .search-section button:hover { background: linear-gradient(135deg, #4c9f9f, #2b6b6b); transform: translateY(-2px); }
                #resetBtn { background: #e5e7eb; color: #374151; }
                #resetBtn:hover { background: #d1d5db; }
                .info-section { margin-bottom: 2rem; display: flex; justify-content: center; align-items: center; gap: 1rem; background: #f0f9f9; padding: 1rem; border-radius: 8px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); }
                .info-section p { font-family: 'Roboto', sans-serif; color: #333; font-size: 1rem; margin: 0; }
                .info-section .landlord-action-btn { background: linear-gradient(135deg, #2b6b6b, #4c9f9f); color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-family: 'Roboto', sans-serif; font-size: 0.85rem; font-weight: 500; transition: background 0.3s ease, transform 0.2s ease; }
                .info-section .landlord-action-btn:hover { background: linear-gradient(135deg, #4c9f9f, #2b6b6b); transform: translateY(-2px); }
                .landlords-list { display: flex; flex-direction: column; gap: 1rem; }
                .landlord-card { display: flex; align-items: center; background: #fff; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); padding: 1rem; transition: transform 0.3s ease, box-shadow 0.3s ease; }
                .landlord-card:hover { transform: translateY(-5px); box-shadow: 0 6px 15px rgba(0,0,0,0.15); }
                .landlord-image { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; margin-right: 1rem; transition: transform 0.3s ease; }
                .landlord-card:hover .landlord-image { transform: scale(1.1); }
                .landlord-info { flex: 1; }
                .landlord-info h3 { font-family: 'Roboto', sans-serif; font-size: 1.25rem; font-weight: 600; color: #333; margin: 0 0 0.5rem 0; }
                .landlord-info p { font-family: 'Roboto', sans-serif; font-size: 0.9rem; color: #666; margin: 0.3rem 0; }
                .landlord-action-btn { background: linear-gradient(135deg, #2b6b6b, #4c9f9f); color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-family: 'Roboto', sans-serif; font-size: 0.85rem; font-weight: 500; transition: background 0.3s ease, transform 0.2s ease, opacity 0.3s ease; }
                .landlord-action-btn:hover { background: linear-gradient(135deg, #4c9f9f, #2b6b6b); transform: translateY(-2px); }
                .landlord-action-btn:disabled { background: #cccccc; cursor: not-allowed; opacity: 0.6; transform: none; }
                .no-landlords { text-align: center; padding: 2rem; font-family: 'Roboto', sans-serif; color: #555; }
                .no-landlords span { font-size: 2rem; display: block; margin-bottom: 1rem; }
                .no-landlords.error { color: #dc2626; }
                .pagination { display: flex; justify-content: center; gap: 10px; margin: 20px 0; }
                .pagination button { padding: 8px 12px; border: 1px solid #ccc; background-color: #fff; cursor: pointer; transition: background 0.3s ease, transform 0.2s ease; }
                .pagination button.active { background-color: #007bff; color: white; border-color: #007bff; }
                .pagination button:hover { background-color: #e6f0ff; transform: scale(1.05); }
                .landlord-details { max-width: 900px; margin: 2rem auto; padding: 2rem; background: linear-gradient(145deg, #ffffff, #f0f4f8); border-radius: 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.15); overflow-y: hidden; }
                .landlord-header { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem; }
                .landlord-profile-pic { width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 3px solid #2b6b6b; box-shadow: 0 4px 10px rgba(0,0,0,0.1); transition: transform 0.3s ease; }
                .landlord-header:hover .landlord-profile-pic { transform: rotate(5deg); }
                .landlord-header-info { flex: 1; }
                .landlord-header h2 { font-family: 'Roboto', sans-serif; color: #2b6b6b; font-size: 2.2rem; margin: 0; }
                .landlord-header p { font-family: 'Roboto', sans-serif; color: #666; font-size: 1rem; margin: 0.5rem 0 0; }
                .landlord-details-section { margin-bottom: 2rem; background: #fff; padding: 1.5rem; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
                .landlord-details-section h3 { font-family: 'Roboto', sans-serif; color: #333; font-size: 1.6rem; margin-bottom: 1rem; border-bottom: 2px solid #2b6b6b; padding-bottom: 0.5rem; }
                .landlord-details-section ul.active-contracts { max-height: 200px; overflow-y: auto; }
                .landlord-details-section ul.comments { max-height: 200px; overflow-y: auto; }
                .landlord-details-section ul { list-style-type: none; padding: 0; }
                .landlord-details-section li { padding: 0.75rem; background: #f9f9f9; border-radius: 8px; margin-bottom: 0.5rem; font-family: 'Roboto', sans-serif; font-size: 1rem; color: #444; transition: background 0.3s ease; }
                .landlord-details-section li:hover { background: #f0f0f0; }
                .comment-details { font-size: 0.9rem; color: #888; margin-top: 0.3rem; }
                .stars { color: #f5c518; font-size: 1.4em; margin-top: 0.5rem; }
                .landlord-actions { display: flex; justify-content: center; gap: 1rem; margin-top: 2rem; transition: opacity 0.4s ease; }
                .landlord-action-btn.review { background: linear-gradient(135deg, #ff6b6b, #ff8e8e); }
                .landlord-action-btn.review:hover { background: linear-gradient(135deg, #ff8e8e, #ff6b6b); }
                .landlord-action-btn.review:disabled:hover { background: #cccccc; transform: none; }
                @media (max-width: 768px) { 
                    .landlord-card { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
                    .landlord-image { width: 50px; height: 50px; }
                    .landlord-action-btn { width: 100%; text-align: center; }
                    .search-section { flex-direction: column; align-items: center; gap: 0.5rem; }
                    .search-section input { max-width: 100%; }
                    .search-section button { width: 100%; max-width: 400px; }
                    .landlord-details { padding: 1.5rem; }
                    .landlord-header { flex-direction: column; align-items: flex-start; }
                    .landlord-profile-pic { width: 100px; height: 100px; }
                    .landlord-header h2 { font-size: 1.8rem; }
                    .landlord-details-section h3 { font-size: 1.4rem; }
                    .landlord-details-section ul.active-contracts { max-height: 150px; }
                    .landlord-details-section ul.comments { max-height: 150px; }
                }
                @media (max-width: 480px) { 
                    .landlord-reviews-section h1 { font-size: 1.5rem; }
                    .landlord-info h3 { font-size: 1.1rem; }
                    .landlord-info p { font-size: 0.85rem; }
                    .landlord-action-btn { padding: 0.4rem 0.8rem; font-size: 0.8rem; }
                    .landlord-details { padding: 1rem; }
                    .landlord-header h2 { font-size: 1.5rem; }
                    .landlord-details-section h3 { font-size: 1.2rem; }
                    .landlord-details-section li { padding: 0.5rem; font-size: 0.9rem; }
                    .landlord-profile-pic { width: 80px; height: 80px; }
                    .landlord-details-section ul.active-contracts { max-height: 120px; }
                    .landlord-details-section ul.comments { max-height: 120px; }
                }
                .review-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 3000;
                    display: none;
                    justify-content: center;
                    align-items: center;
                    opacity: 0;
                    transition: opacity 0.4s ease;
                }
                .review-modal.active {
                    opacity: 1;
                    display: flex;
                }
                .review-modal-content {
                    background: #fff;
                    padding: 2rem;
                    border-radius: 10px;
                    width: 90%;
                    max-width: 500px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                    position: relative;
                    transform: scale(0.9);
                    opacity: 0;
                    transition: transform 0.4s ease, opacity 0.4s ease;
                }
                .review-modal-content.active {
                    transform: scale(1);
                    opacity: 1;
                }
                .review-modal-content h3 {
                    color: #2b6b6b;
                    margin-bottom: 1.5rem;
                    font-size: 1.8rem;
                }
                .review-modal-content .close-btn {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    font-size: 1.5rem;
                    border: none;
                    background: none;
                    cursor: pointer;
                    color: #dc2626;
                    transition: transform 0.3s ease, color 0.3s ease;
                }
                .review-modal-content .close-btn:hover {
                    color: #b91c1c;
                    transform: rotate(90deg);
                }
                .review-modal-content label {
                    display: block;
                    margin-bottom: 0.5rem;
                    color: #333;
                    font-size: 1rem;
                }
                .review-modal-content select,
                .review-modal-content textarea {
                    width: 100%;
                    padding: 0.8rem;
                    margin-bottom: 1rem;
                    border: 1px solid #e5e7eb;
                    border-radius: 6px;
                    font-size: 1rem;
                    resize: vertical;
                    transition: border-color 0.3s ease, box-shadow 0.3s ease;
                }
                .review-modal-content select:focus,
                .review-modal-content textarea:focus {
                    border-color: #2b6b6b;
                    box-shadow: 0 0 5px rgba(43, 107, 107, 0.3);
                }
                .review-modal-content select:disabled,
                .review-modal-content textarea:disabled {
                    background: #f0f0f0;
                    cursor: not-allowed;
                }
                .review-modal-content textarea {
                    height: 100px;
                }
                .review-modal-content button {
                    background: linear-gradient(135deg, #2b6b6b, #4c9f9f);
                    color: white;
                    border: none;
                    padding: 0.8rem 1.5rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 1rem;
                    font-weight: 500;
                    transition: background 0.3s ease, transform 0.2s ease;
                }
                .review-modal-content button:hover {
                    background: linear-gradient(135deg, #4c9f9f, #2b6b6b);
                    transform: translateY(-2px);
                }
                .review-modal-content button:disabled {
                    background: #cccccc;
                    cursor: not-allowed;
                    opacity: 0.6;
                    transform: none;
                }
            `;
            document.head.appendChild(style);

            let currentPage = 1;
            const limit = 10;
            let lastSearchQuery = '';

            async function loadLandlords(page = 1, searchQuery = '') {
                const landlordsList = document.getElementById('landlords-list');
                const pagination = document.getElementById('pagination');
                if (!landlordsList || !pagination) {
                    console.error('No se encontraron contenedores para landlords o paginación');
                    hideLoadingSpinner();
                    return;
                }

                lastSearchQuery = searchQuery;

                try {
                    const url = searchQuery
                        ? `/api/ratings/landlords/search?q=${encodeURIComponent(searchQuery)}&page=${page}&limit=${limit}`
                        : `/api/ratings/landlords?page=${page}&limit=${limit}`;
                    
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'x-user-email': localStorage.getItem('currentUserEmail') || ''
                        }
                    });

                    if (!response.ok) {
                        throw new Error('Error al cargar arrendadores');
                    }

                    const data = await response.json();
                    if (!data.success) {
                        throw new Error(data.message);
                    }

                    landlordsList.innerHTML = '';
                    data.landlords.forEach(landlord => {
                        const landlordCard = document.createElement('div');
                        landlordCard.className = 'landlord-card';
                        const hasActiveContracts = landlord.activeContractsWithMe ? 'Sí' : 'No';
                        landlordCard.innerHTML = `
                            <img src="${landlord.profile_picture || '/img/default-profile.png'}" alt="${landlord.full_name}" class="landlord-image">
                            <div class="landlord-info">
                                <h3>${landlord.full_name}</h3>
                                <p><strong>Contratos Activos conmigo:</strong> ${hasActiveContracts}</p>
                            </div>
                            <button class="landlord-action-btn view-details" data-email="${landlord.landlord_email}">Ver Detalles</button>
                        `;
                        landlordsList.appendChild(landlordCard);
                    });

                    pagination.innerHTML = '';
                    const { currentPage: pageNum, totalPages } = data.pagination;
                    if (totalPages > 1) {
                        for (let i = 1; i <= totalPages; i++) {
                            const pageBtn = document.createElement('button');
                            pageBtn.textContent = i;
                            pageBtn.className = i === pageNum ? 'active' : '';
                            pageBtn.addEventListener('click', () => {
                                currentPage = i;
                                loadLandlords(i, lastSearchQuery);
                            });
                            pagination.appendChild(pageBtn);
                        }
                    }

                    document.querySelectorAll('.view-details').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const email = btn.getAttribute('data-email');
                            loadLandlordDetails(email);
                        });
                    });

                    if (data.landlords.length === 0) {
                        landlordsList.innerHTML = `
                            <div class="no-landlords">
                                <span>📋</span>
                                <p>No se encontraron arrendadores con los criterios seleccionados.</p>
                            </div>
                        `;
                    }
                } catch (error) {
                    console.error('Error:', error.message);
                    landlordsList.innerHTML = `
                        <div class="no-landlords error">
                            <p>Error al cargar arrendadores: ${error.message}</p>
                        </div>
                    `;
                }
                hideLoadingSpinner();
            }

            async function loadLandlordDetails(email) {
                const reviewsSection = document.getElementById('landlord-reviews-section');
                if (!reviewsSection) {
                    console.error('No se encontró el contenedor de la sección de reseñas');
                    hideLoadingSpinner();
                    return;
                }

                showFullScreenSpinner();

                try {
                    const response = await fetch(`/api/ratings/landlords/${email}`, {
                        method: 'GET',
                        headers: {
                            'x-user-email': localStorage.getItem('currentUserEmail') || ''
                        }
                    });

                    if (!response.ok) {
                        throw new Error(`Error al cargar detalles: ${response.statusText}`);
                    }

                    const data = await response.json();
                    if (!data.success) {
                        throw new Error(data.message || 'Error desconocido');
                    }

                    const landlord = data.landlord;
                    const reviewableContracts = landlord.expiredContracts
                        ? landlord.expiredContracts.filter(contract =>
                            !landlord.recentComments.some(comment => comment.contract_id === contract.contract_id)
                        )
                        : [];
                    const canReview = reviewableContracts.length > 0;

                    reviewsSection.innerHTML = `
                        <div class="landlord-details">
                            <div class="landlord-header">
                                <img src="${landlord.profile_picture || '/img/default-profile.png'}" alt="${landlord.full_name}" class="landlord-profile-pic">
                                <div class="landlord-header-info">
                                    <h2>${landlord.full_name}</h2>
                                    <p>Email: ${landlord.email || email}</p>
                                </div>
                            </div>
                            <div class="landlord-details-section">
                                <h3>Contratos Activos</h3>
                                <ul class="active-contracts">
                                    ${landlord.activeContracts.length ? landlord.activeContracts.map(contract => `
                                        <li>Contrato #${contract.contract_id}: ${contract.title} (Inicio: ${new Date(contract.start_date).toLocaleDateString('es-CO')} - Fin: ${new Date(contract.end_date).toLocaleDateString('es-CO')})</li>
                                    `).join('') : '<li>No tiene contratos activos.</li>'}
                                </ul>
                            </div>
                            <div class="landlord-details-section rating-section">
                                <h3>Calificación Promedio</h3>
                                <p class="rating-text">Calificación: ${landlord.averageRating || 0} / 5 (${landlord.ratingCount || 0} reseñas)</p>
                                <div class="stars">${'★'.repeat(Math.round(landlord.averageRating || 0))}${'☆'.repeat(5 - Math.round(landlord.averageRating || 0))}</div>
                            </div>
                            <div class="landlord-details-section">
                                <h3>Últimos Comentarios</h3>
                                <ul class="comments">
                                    ${landlord.recentComments.length ? landlord.recentComments.map(comment => `
                                        <li><strong>${comment.tenant_name}</strong> (${new Date(comment.created_at).toLocaleDateString('es-CO')}): ${comment.comment || 'Sin comentario'}
                                            <div class="comment-details">Publicación: ${comment.publication_title || 'No disponible'} | Contrato: #${comment.contract_id || 'No disponible'}</div>
                                        </li>
                                    `).join('') : '<li>No hay comentarios.</li>'}
                                </ul>
                            </div>
                            <div class="landlord-actions">
                                <button class="landlord-action-btn back">Volver</button>
                                <button class="landlord-action-btn review" data-email="${landlord.email || email}" ${!canReview ? 'disabled' : ''} title="${!canReview ? 'No hay contratos finalizados sin reseñar' : 'Reseñar Arrendador'}">Reseñar Arrendador</button>
                            </div>
                            <div class="review-modal" id="reviewModal">
                                <div class="review-modal-content">
                                    <button class="close-btn">×</button>
                                    <h3>Reseñar Arrendador</h3>
                                    <form id="reviewForm">
                                        <label for="agreementId">Selecciona el Acuerdo Finalizado:</label>
                                        <select id="agreementId" name="agreementId" required>
                                            ${reviewableContracts.length ? reviewableContracts.map(contract => `
                                                <option value="${contract.id}">Contrato #${contract.contract_id} - ${contract.title}</option>
                                            `).join('') : '<option value="">No hay contratos finalizados sin reseñar</option>'}
                                        </select>
                                        <label for="rating">Calificación (1-5):</label>
                                        <select id="rating" name="rating" required>
                                            <option value="1">1</option>
                                            <option value="2">2</option>
                                            <option value="3">3</option>
                                            <option value="4">4</option>
                                            <option value="5">5</option>
                                        </select>
                                        <label for="comment">Comentario (Opcional):</label>
                                        <textarea id="comment" name="comment" maxlength="300" placeholder="Escribe tu comentario aquí..."></textarea>
                                        <button type="submit" ${!canReview ? 'disabled' : ''}>Enviar Reseña</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    `;

                    document.querySelector('.back').addEventListener('click', () => {
                        renderLandlordReviews();
                        loadLandlords(currentPage, lastSearchQuery);
                    });

                    const reviewBtn = document.querySelector('.review');
                    const modal = document.getElementById('reviewModal');
                    const modalContent = modal.querySelector('.review-modal-content');
                    const closeBtn = document.querySelector('.close-btn');
                    const reviewForm = document.getElementById('reviewForm');

                    if (canReview) {
                        reviewBtn.addEventListener('click', () => {
                            modal.classList.add('active');
                            modalContent.classList.add('active');
                        });

                        closeBtn.addEventListener('click', () => {
                            modal.classList.remove('active');
                            modalContent.classList.remove('active');
                            reviewForm.reset();
                        });

                        reviewForm.addEventListener('submit', async (e) => {
                            e.preventDefault();

                            const agreementSelect = reviewForm.querySelector('#agreementId');
                            const ratingSelect = reviewForm.querySelector('#rating');
                            const commentTextarea = reviewForm.querySelector('#comment');
                            const submitBtn = reviewForm.querySelector('button[type="submit"]');
                            agreementSelect.disabled = true;
                            ratingSelect.disabled = true;
                            commentTextarea.disabled = true;
                            submitBtn.disabled = true;

                            showLoadingSpinner(modalContent);

                            const agreementId = reviewForm.agreementId.value;
                            const rating = parseInt(reviewForm.rating.value);
                            const comment = reviewForm.comment.value;

                            try {
                                console.log('Enviando reseña:', { agreementId, rating, comment });
                                const response = await fetch(`/api/ratings/landlords/${landlord.email || email}/rate`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'x-user-email': localStorage.getItem('currentUserEmail') || ''
                                    },
                                    body: JSON.stringify({ agreement_id: agreementId, rating, comment })
                                });

                                const data = await response.json();

                                if (!response.ok || !data.success) {
                                    throw new Error(data.message || `Error del servidor: ${response.statusText}`);
                                }

                                hideLoadingSpinner();
                                showMessage('Reseña enviada correctamente.', false);

                                modal.classList.remove('active');
                                modalContent.classList.remove('active');
                                reviewForm.reset();

                                const updatedResponse = await fetch(`/api/ratings/landlords/${landlord.email || email}`, {
                                    method: 'GET',
                                    headers: {
                                        'x-user-email': localStorage.getItem('currentUserEmail') || ''
                                    }
                                });
                                const updatedData = await updatedResponse.json();
                                if (updatedData.success) {
                                    landlord.recentComments = updatedData.landlord.recentComments;
                                    landlord.averageRating = updatedData.landlord.averageRating;
                                    landlord.ratingCount = updatedData.landlord.ratingCount;
                                    landlord.expiredContracts = updatedData.landlord.expiredContracts;

                                    const commentsSection = document.querySelector('.landlord-details-section:nth-child(4) ul');
                                    if (commentsSection) {
                                        commentsSection.innerHTML = updatedData.landlord.recentComments.length ? updatedData.landlord.recentComments.map(comment => `
                                            <li><strong>${comment.tenant_name}</strong> (${new Date(comment.created_at).toLocaleDateString('es-CO')}): ${comment.comment || 'Sin comentario'}
                                                <div class="comment-details">Publicación: ${comment.publication_title || 'No disponible'} | Contrato: #${comment.contract_id || 'No disponible'}</div>
                                            </li>
                                        `).join('') : '<li>No hay comentarios.</li>';
                                    }

                                    const ratingSection = document.querySelector('.rating-section');
                                    if (ratingSection) {
                                        const newAverageRating = updatedData.landlord.averageRating || 0;
                                        const newRatingCount = updatedData.landlord.ratingCount || 0;
                                        ratingSection.querySelector('.rating-text').textContent = `Calificación: ${newAverageRating} / 5 (${newRatingCount} reseñas)`;
                                        ratingSection.querySelector('.stars').innerHTML = '★'.repeat(Math.round(newAverageRating)) + '☆'.repeat(5 - Math.round(newAverageRating));
                                    }

                                    const landlordActions = document.querySelector('.landlord-actions');
                                    if (landlordActions) {
                                        landlordActions.style.opacity = '0';
                                        setTimeout(() => {
                                            loadLandlordDetails(email);
                                            landlordActions.style.opacity = '1';
                                        }, 400);
                                    }
                                }
                            } catch (error) {
                                console.error('Error al enviar reseña:', error.message);
                                hideLoadingSpinner();
                                showMessage(`Error al enviar la reseña: ${error.message}`, true);
                                agreementSelect.disabled = false;
                                ratingSelect.disabled = false;
                                commentTextarea.disabled = false;
                                submitBtn.disabled = false;
                            }
                        });
                    }
                } catch (error) {
                    console.error('Error en loadLandlordDetails:', error.message);
                    reviewsSection.innerHTML = `
                        <div class="no-landlords error">
                            <p>Error al cargar detalles: ${error.message}</p>
                            <div class="landlord-actions">
                                <button class="landlord-action-btn back">Volver</button>
                            </div>
                        </div>
                    `;
                    document.querySelector('.back').addEventListener('click', () => {
                        renderLandlordReviews();
                        loadLandlords(currentPage, lastSearchQuery);
                    });
                }
                hideLoadingSpinner();
            }

            //Cargar los datos del arrendatario, comentarios y calificaciones
            async function loadMyLandlordDetails() {
                const reviewsSection = document.getElementById('landlord-reviews-section');
                if (!reviewsSection) {
                    console.error('No se encontró el contenedor de la sección de reseñas');
                    hideLoadingSpinner();
                    return;
                }

                showFullScreenSpinner();

                try {
                    const response = await fetch('/api/ratings/tenant/me', {
                        method: 'GET',
                        headers: {
                            'x-user-email': localStorage.getItem('currentUserEmail') || ''
                        }
                    });

                    if (!response.ok) {
                        throw new Error(`Error al cargar detalles: ${response.statusText}`);
                    }

                    const data = await response.json();

                    if (!data.success) {
                        throw new Error(data.message || 'Error desconocido');
                    }

                    const tenant = data.tenant;

                    reviewsSection.innerHTML = `
                        <div class="landlord-details">
                            <div class="landlord-header">
                                <img src="${tenant.profile_picture || '/img/default-profile.png'}" alt="${tenant.full_name}" class="landlord-profile-pic">
                                <div class="landlord-header-info">
                                    <h2>${tenant.full_name}</h2>
                                    <p>Email: ${tenant.email}</p>
                                </div>
                            </div>
                            <div class="landlord-details-section rating-section">
                                <h3>Calificación Promedio</h3>
                                <p class="rating-text">Calificación: ${tenant.averageRating || 0} / 5 (${tenant.ratingCount || 0} reseñas)</p>
                                <div class="stars">${'★'.repeat(Math.round(tenant.averageRating || 0))}${'☆'.repeat(5 - Math.round(tenant.averageRating || 0))}</div>
                            </div>
                            <div class="landlord-details-section">
                                <h3>Últimos Comentarios</h3>
                                <ul class="comments">
                                    ${tenant.recentComments.length 
                                        ? tenant.recentComments.map(comment => `
                                            <li>
                                                <strong>${comment.landlord_name || 'Desconocido'}</strong> 
                                                (${new Date(comment.created_at).toLocaleDateString('es-CO')}): 
                                                ${comment.comment || 'Sin comentario'}
                                                <div class="comment-details">
                                                    Publicación: ${comment.publication_title || 'No disponible'} | 
                                                    Contrato: #${comment.contract_id || 'No disponible'}
                                                </div>
                                            </li>`
                                        ).join('')
                                        : '<li>No hay comentarios.</li>'
                                    }
                                </ul>
                            </div>
                            <div class="landlord-actions">
                                <button class="landlord-action-btn back">Volver</button>
                            </div>
                        </div>
                    `;

                    document.querySelector('.back').addEventListener('click', () => {
                        renderLandlordReviews();
                        loadLandlords(currentPage, lastSearchQuery);
                    });

                } catch (error) {
                    console.error('Error en loadMyLandlordDetails:', error.message);
                    reviewsSection.innerHTML = `
                        <div class="no-landlords error">
                            <p>Error al cargar detalles: ${error.message}</p>
                            <div class="landlord-actions">
                                <button class="landlord-action-btn back">Volver</button>
                            </div>
                        </div>
                    `;
                    document.querySelector('.back').addEventListener('click', () => {
                        renderLandlordReviews();
                        loadLandlords(currentPage, lastSearchQuery);
                    });
                }

                hideLoadingSpinner();
            }

            const landlordSearch = document.getElementById('landlordSearch');
            const searchBtn = document.getElementById('searchBtn');
            const resetBtn = document.getElementById('resetBtn');
            const viewMyDetailsBtn = document.querySelector('.view-my-details');

            searchBtn.addEventListener('click', () => {
                currentPage = 1;
                loadLandlords(currentPage, landlordSearch.value);
            });

            landlordSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    currentPage = 1;
                    loadLandlords(currentPage, landlordSearch.value);
                }
            });

            resetBtn.addEventListener('click', () => {
                landlordSearch.value = '';
                currentPage = 1;
                loadLandlords(currentPage, '');
            });

            viewMyDetailsBtn.addEventListener('click', () => {
                loadMyLandlordDetails();
            });

            loadLandlords();
        } catch (error) {
            hideLoadingSpinner();
            showMessage('Error al cargar las reseñas: ' + error.message);
        }
    }

    if (comunidadLink) {
        comunidadLink.addEventListener('click', (event) => {
            event.preventDefault();
            console.log('Clic en el enlace de "Comunidad"');
            renderLandlordReviews();
        });
    } else {
        console.warn('No se encontró el enlace de "Comunidad" (a[href="comunidad"])');
    }

    if (dashboardLink) {
        dashboardLink.addEventListener('click', (event) => {
            event.preventDefault();
            console.log('Clic en el enlace de "Dashboard"');
            restoreDashboard();
        });
    } else {
        console.warn('No se encontró el enlace de "Dashboard" (a[href="dashboard"])');
    }
});

//Nuevo Bloque para cerrar Sesion 
document.addEventListener('DOMContentLoaded', function() {
    // Attach logout functionality to existing logout link
    const logoutLink = document.querySelector('nav a[href="logout"]');
    if (logoutLink) {
        logoutLink.addEventListener('click', async (e) => {
            e.preventDefault();
            showLogoutSpinner();

            try {
                const userEmail = localStorage.getItem('currentUserEmail');
                if (!userEmail) {
                    throw new Error('No se encontró el email del usuario');
                }

                const response = await fetch('/api/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-email': userEmail
                    }
                });

                const data = await response.json();
                if (data.success) {
                    // Clear localStorage and cookies
                    localStorage.removeItem('currentUserEmail');
                    localStorage.removeItem('rememberUser');
                    localStorage.removeItem('userEmail');
                    document.cookie = 'remember_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

                    // Ensure spinner is shown for at least 5 seconds
                    setTimeout(() => {
                        // Hide spinner and show success message
                        hideLogoutSpinner();
                        showMessage('¡Éxito!', 'Sesión cerrada', 'Aceptar', () => {
                            window.location.href = '/login';
                        });
                    }, 5000); // 5 seconds delay
                } else {
                    hideLogoutSpinner();
                    showMessage('¡Uy!', data.message || 'Error al cerrar la sesión');
                }
            } catch (error) {
                console.error('Error during logout:', error);
                hideLogoutSpinner();
                showMessage('¡Uy!', 'Error al cerrar la sesión. Por favor, intenta nuevamente.');
            }
        });
    }

    // Spinner animation
    function showLogoutSpinner() {
        const overlay = document.createElement('div');
        overlay.id = 'logout-spinner-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        overlay.style.zIndex = '9999';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';

        overlay.innerHTML = `
            <div style="
                background: white;
                padding: 2rem;
                border-radius: 12px;
                text-align: center;
                font-family: 'Roboto', sans-serif;
                color: #2b6b6b;
            ">
                <div style="
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #2b6b6b;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 1rem;
                "></div>
                <p>Cerrando sesión...</p>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        document.body.appendChild(overlay);
        setTimeout(() => overlay.style.opacity = '1', 10);
    }

    function hideLogoutSpinner() {
        const overlay = document.getElementById('logout-spinner-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 300);
        }
    }

    // Message display function (consistent with login.js)
    function showMessage(title, message, buttonText = 'Aceptar', callback = null) {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        overlay.style.zIndex = '9999';
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';
        document.body.appendChild(overlay);

        const messageDiv = document.createElement('div');
        messageDiv.style.position = 'fixed';
        messageDiv.style.top = '50%';
        messageDiv.style.left = '50%';
        messageDiv.style.transform = 'translate(-50%, -50%)';
        messageDiv.style.backgroundColor = '#fff';
        messageDiv.style.padding = '2rem';
        messageDiv.style.borderRadius = '12px';
        messageDiv.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
        messageDiv.style.zIndex = '10000';
        messageDiv.style.textAlign = 'center';
        messageDiv.style.fontFamily = "'Roboto', sans-serif";
        messageDiv.style.color = '#2b6b6b';
        messageDiv.innerHTML = `
            <h3 style="margin-bottom: 1rem;">${title}</h3>
            <p>${message}</p>
            <button style="
                background: linear-gradient(135deg, #2b6b6b, #4c9f9f);
                color: white;
                border: none;
                padding: 0.8rem 1.5rem;
                border-radius: 8px;
                cursor: pointer;
                margin-top: 1rem;
                font-weight: 500;
            ">${buttonText}</button>
        `;
        document.body.appendChild(messageDiv);

        setTimeout(() => overlay.style.opacity = '1', 10);

        const actionButton = messageDiv.querySelector('button');
        actionButton.addEventListener('click', () => {
            overlay.style.opacity = '0';
            messageDiv.style.opacity = '0';
            messageDiv.style.transform = 'translate(-50%, -60%)';
            setTimeout(() => {
                document.body.removeChild(overlay);
                document.body.removeChild(messageDiv);
                if (callback) callback();
            }, 300);
        });

        messageDiv.style.opacity = '0';
        messageDiv.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        setTimeout(() => {
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translate(-50%, -50%)';
        }, 10);
    }
});