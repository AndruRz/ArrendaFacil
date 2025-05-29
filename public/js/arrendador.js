// Al inicio de arrendador.js
let loadingOverlay = null;
let loadingSpinner = null;

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

function showLoadingSpinner(message = 'Cargando...') {
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
        <p style="margin-top: 1rem;">${message}</p>
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

// Nuevo Bloque para Funcionalides en generar (Animaciones, Datos de Inicio de Seccion y eso)
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
    const isArrendadorPage = window.location.pathname.toLowerCase().endsWith('/arrendador') || 
                            window.location.pathname.toLowerCase().endsWith('arrendador.html');
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
        if (typeof fetchStats === 'function') {
            await fetchStats();
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
                <h2>Tu Rol como Arrendador</h2>
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
                <h1>Guía del Arrendador</h1>
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

//Nuevo Bloque para la funcionalidad de Crear Publicaciones y notificaciones
document.addEventListener('DOMContentLoaded', function() {
    const mainContent = document.getElementById('main-content');
    const createPostLink = document.querySelector('a[href="crear-publicacion"]');
    const dashboardLink = document.querySelector('a[href="dashboard"]');
    const menuLinks = document.querySelectorAll('.navbar a');
    const originalDashboardContent = mainContent ? mainContent.innerHTML : '';
    let loadingOverlay = null;
    let loadingSpinner = null;
    let hasUnsavedChanges = false;

    // Add CSS to disable navbar links
    const style = document.createElement('style');
    style.innerHTML = `
        .navbar a.disabled {
            pointer-events: none;
            opacity: 0.5;
            cursor: not-allowed;
        }
    `;
    document.head.appendChild(style);


        // Function to toggle navbar links
    function toggleNavbarLinks(disable) {
            menuLinks.forEach(link => {
                if (disable) {
                    link.classList.add('disabled');
                } else {
                    link.classList.remove('disabled');
                }
            });
    }

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

    function showUnsavedChangesWarning(callback) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background-color: rgba(0,0,0,0.5); z-index: 2999; opacity: 0;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(overlay);

        const warningDiv = document.createElement('div');
        warningDiv.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background-color: #fff; padding: 2rem; border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 3000; text-align: center;
            font-family: 'Roboto', sans-serif; color: #2b6b6b;
            opacity: 0; transition: opacity 0.3s ease, transform 0.3s ease;
        `;
        warningDiv.innerHTML = `
            <h3 style="margin-bottom: 1rem;">¡Atención!</h3>
            <p>¿Estás seguro de que deseas salir? Los cambios no guardados se perderán.</p>
            <div style="margin-top: 1rem; display: flex; gap: 1rem; justify-content: center;">
                <button id="exit-btn" style="
                    background: linear-gradient(135deg, #dc2626, #f87171);
                    color: white; border: none; padding: 0.8rem 1.5rem;
                    border-radius: 8px; cursor: pointer; font-weight: 500;
                ">Salir</button>
                <button id="cancel-btn" style="
                    background: linear-gradient(135deg, #2b6b6b, #4c9f9f);
                    color: white; border: none; padding: 0.8rem 1.5rem;
                    border-radius: 8px; cursor: pointer; font-weight: 500;
                ">Cancelar</button>
            </div>
        `;
        document.body.appendChild(warningDiv);

        setTimeout(() => {
            overlay.style.opacity = '1';
            warningDiv.style.opacity = '1';
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
    }

    window.addEventListener('beforeunload', (event) => {
        if (hasUnsavedChanges) {
            const message = '¿Estás seguro de que deseas salir? Los cambios no guardados se perderán.';
            event.preventDefault();
            event.returnValue = message;
            return message;
        }
    });


    let barrios = []; 
    let newImages = []; 
    let conjuntos = [];

    function renderCreatePostForm() {
        if (!mainContent) {
            console.error('No se encontró #main-content');
            showMessage('Error: No se encontró el contenedor principal.');
            return;
        }
        hasUnsavedChanges = false;
        mainContent.innerHTML = `
            <div class="create-post-section">
                <h1>Crear Nueva Publicación</h1>
                <div class="post-form-container">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="post-type">Tipo de Espacio</label>
                            <select id="post-type" required>
                                <option value="" disabled selected>Selecciona el tipo de espacio</option>
                                <option value="apartamento">Apartamento</option>
                                <option value="casa">Casa</option>
                                <option value="habitacion">Habitación</option>
                                <option value="parqueo">Parqueadero</option>
                                <option value="bodega">Bodega</option>
                            </select>
                            <p class="error-message" id="type-error"></p>
                        </div>
                        <div class="form-group">
                            <label for="post-title">Título de la Publicación</label>
                            <input type="text" id="post-title" placeholder="Ej. Apartamento en renta en Torre 1A 4Piso" required>
                            <p class="error-message" id="title-error"></p>
                        </div>
                    </div>
                    <div id="address-fields" class="address-fields"></div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="post-price">Precio Mensual (COL)</label>
                            <input type="number" id="post-price" placeholder="Ej. 500000" min="1" step="1" required>
                            <p class="error-message" id="price-error"></p>
                        </div>
                        <div class="form-group">
                            <label for="post-availability">Disponibilidad</label>
                            <select id="post-availability" required>
                                <option value="" disabled selected>Selecciona la disponibilidad</option>
                                <option value="inmediata">Entrega Inmediata</option>
                                <option value="futura_1mes">Entrega Futura (1 mes)</option>
                                <option value="futura_3meses">Entrega Futura (3 meses)</option>
                            </select>
                            <p class="error-message" id="availability-error"></p>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="post-description">Descripción del Espacio</label>
                        <textarea id="post-description" placeholder="Describe tu espacio..." required></textarea>
                        <p class="error-message" id="description-error"></p>
                    </div>
                    <div class="form-group">
                        <label for="post-conditions">Condiciones Adicionales</label>
                        <textarea id="post-conditions" placeholder="Ej. No se permiten mascotas, incluye servicios básicos..."></textarea>
                        <p class="error-message" id="conditions-error"></p>
                    </div>
                    <div class="form-group">
                        <label for="post-images">Imágenes Asociadas (máximo 10, PNG/JPG)</label>
                        <input type="file" id="post-images" multiple accept="image/png,image/jpeg,image/jpg">
                        <div id="image-preview" class="image-preview" style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;"></div>
                        <p class="error-message" id="images-error"></p>
                    </div>
                    <div class="form-actions">
                        <button type="button" id="back-btn" class="action-btn secondary">Volver</button>
                        <button type="button" id="submit-post-btn" class="action-btn">Publicar</button>
                    </div>
                </div>
            </div>
        `;
    

        window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
    });

        // Cargar barrios y conjuntos desde JSON
        Promise.all([
            fetch('/data/cali_neighborhoods.json').then(response => {
                if (!response.ok) throw new Error('Error al cargar los barrios');
                return response.json();
            }),
            fetch('/data/cali_conjuntos.json').then(response => {
                if (!response.ok) throw new Error('Error al cargar los conjuntos');
                return response.json();
            })
        ])
        .then(([barrioData, conjuntoData]) => {
            barrios = barrioData.neighborhoods.map(n => n.name);
            conjuntos = conjuntoData.conjuntos.map(c => c.name);
            const typeInput = document.getElementById('post-type');
            if (typeInput.value) renderAddressFields(typeInput.value);
        })
        .catch(error => {
            console.error('Error cargando datos:', error);
            showMessage('Error al cargar los datos. Por favor, intenta nuevamente.');
        });
    
        const style = document.createElement('style');
        style.innerHTML = `
            .create-post-section {
                padding: 2rem;
                max-width: 800px;
                margin: 0 auto;
            }
            .create-post-section h1 {
                color: #2b6b6b;
                text-align: center;
                margin-bottom: 2rem;
            }
            .form-row {
                display: flex;
                flex-wrap: wrap;
                gap: 1rem;
                margin-bottom: 1.5rem;
            }
            .form-group {
                flex: 1;
                min-width: 200px;
            }
            .form-group label {
                display: block;
                margin-bottom: 0.5rem;
                color: #2b6b6b;
                font-weight: 500;
            }
            .form-group input,
            .form-group textarea,
            .form-group select {
                width: 100%;
                padding: 0.8rem;
                border: 1px solid #ccc;
                border-radius: 8px;
                font-size: 1rem;
                font-family: 'Roboto', sans-serif;
            }
            .form-group textarea {
                height: 120px;
                resize: vertical;
            }
            .form-group input[type="file"] {
                padding: 0.3rem;
            }
            .form-group input[type="checkbox"] {
                width: auto;
                margin-right: 0.5rem;
            }
            .image-preview img {
                width: 100px;
                height: 100px;
                object-fit: cover;
                border-radius: 8px;
                border: 1px solid #ccc;
            }
            .remove-image-btn {
                position: absolute;
                top: 5px;
                right: 5px;
                background: #dc2626;
                color: white;
                border: none;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .remove-image-btn:hover {
                background: #f87171;
            }
            .error-message {
                color: #dc2626;
                font-size: 0.9rem;
                margin-top: 0.3rem;
                min-height: 1.2rem;
            }
            .form-actions {
                display: flex;
                gap: 1rem;
                justify-content: center;
                margin-top: 2rem;
            }
            .action-btn {
                background: linear-gradient(135deg, #2b6b6b, #4c9f9f);
                color: white;
                border: none;
                padding: 0.8rem 1.5rem;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
                transition: transform 0.1s ease;
            }
            .action-btn:hover {
                transform: scale(1.05);
            }
            .action-btn.secondary {
                background: linear-gradient(135deg, #6b7280, #9ca3af);
            }
            .form-group datalist {
                position: absolute;
                max-height: 120px;
                overflow-y: auto;
                border: 1px solid #ccc;
                border-radius: 8px;
                background: white;
                z-index: 10;
            }
            .form-group datalist option {
                padding: 0.5rem;
            }
            @media (max-width: 768px) {
                .form-row {
                    flex-direction: column;
                }
                .form-group {
                    min-width: 100%;
                }
                .form-group input,
                .form-group select,
                .form-group textarea {
                    font-size: 0.95rem;
                }
            }
        `;
        document.head.appendChild(style);
    
        const typeInput = document.getElementById('post-type');
        const titleInput = document.getElementById('post-title');
        const descriptionInput = document.getElementById('post-description');
        const priceInput = document.getElementById('post-price');
        const availabilityInput = document.getElementById('post-availability');
        const conditionsInput = document.getElementById('post-conditions');
        const imagesInput = document.getElementById('post-images');
        const imagePreview = document.getElementById('image-preview');
        const backBtn = document.getElementById('back-btn');
        const submitBtn = document.getElementById('submit-post-btn');
    
        typeInput.addEventListener('change', () => {
            hasUnsavedChanges = true;
            toggleNavbarLinks(true);
            validateType();
            renderAddressFields(typeInput.value);
        });
    
        priceInput.addEventListener('input', function() {
            if (!/^\d*$/.test(this.value)) {
                this.value = this.value.replace(/[^0-9]/g, '');
            }
            hasUnsavedChanges = true;
            toggleNavbarLinks(true);
        });
    
        titleInput.addEventListener('input', () => {
            hasUnsavedChanges = true;
            toggleNavbarLinks(true);
            validateTitle();
        });
    
        descriptionInput.addEventListener('input', () => {
            hasUnsavedChanges = true;
            toggleNavbarLinks(true);
            validateDescription();
        });
    
        priceInput.addEventListener('input', () => {
            hasUnsavedChanges = true;
            toggleNavbarLinks(true);
            validatePrice();
        });
    
        availabilityInput.addEventListener('change', () => {
            hasUnsavedChanges = true;
            toggleNavbarLinks(true);
            validateAvailability();
        });
    
        conditionsInput.addEventListener('input', () => {
            hasUnsavedChanges = true;
            toggleNavbarLinks(true);
            validateConditions();
        });
    
        imagesInput.addEventListener('change', (event) => {
            hasUnsavedChanges = true;
            toggleNavbarLinks(true);
            handleImageUpload(event);
        });
    
        imagePreview.addEventListener('click', (event) => {
            if (event.target.classList.contains('remove-image-btn')) {
                const fileName = event.target.getAttribute('data-file');
                newImages = newImages.filter(file => file.name !== fileName);
                event.target.parentElement.remove();
                hasUnsavedChanges = true;
                toggleNavbarLinks(true);
            }
        });
    
        backBtn.addEventListener('click', () => {
            if (hasUnsavedChanges) {
                showUnsavedChangesWarning(() => {
                    hasUnsavedChanges = false;
                    toggleNavbarLinks(false);
                    renderMyPublications();
                });
            } else {
                renderMyPublications();
                toggleNavbarLinks(false);
            }
        });
    
        submitBtn.addEventListener('click', () => submitPost());
    
        function renderAddressFields(type) {
            const addressFields = document.getElementById('address-fields');
            addressFields.innerHTML = '';
    
            if (!type) return;
    
            let html = `
                <div class="form-row">
                    <div class="form-group">
                        <label for="post-barrio">Barrio</label>
                        <input type="text" id="post-barrio" list="barrio-list" placeholder="Escribe para buscar..." required>
                        <datalist id="barrio-list">
                            ${barrios.map(barrio => `<option value="${barrio}">${barrio}</option>`).join('')}
                        </datalist>
                        <p class="error-message" id="post-barrio-error"></p>
                    </div>
                    <div class="form-group">
                        <label for="post-calle-carrera">Calle o Carrera</label>
                        <input type="text" id="post-calle-carrera" placeholder="Ej. Calle 5" required>
                        <p class="error-message" id="post-calle-carrera-error"></p>
                    </div>
                    <div class="form-group">
                        <label for="post-numero">Número</label>
                        <input type="text" id="post-numero" placeholder="Ej. 41E3-84, 45-67" required>
                        <p class="error-message" id="post-numero-error"></p>
                    </div>
            `;
    
            // Añadir el checkbox "¿Está en un edificio?" dentro del form-row para el tipo "habitacion"
            if (type === 'habitacion') {
                html += `
                    <div class="form-group">
                        <label for="post-en-edificio">
                            <input type="checkbox" id="post-en-edificio"> ¿Está en un edificio?
                        </label>
                        <p class="error-message" id="post-en-edificio-error"></p>
                    </div>
                `;
            }
    
            html += `</div>`; // Cerrar el form-row inicial
    
            if (type === 'apartamento') {
                html += `
                    <div class="form-row">
                        <div class="form-group">
                            <label for="post-conjunto-torre">Conjunto o Torre</label>
                            <input type="text" id="post-conjunto-torre" list="conjunto-list" placeholder="Escribe para buscar..." required>
                            <datalist id="conjunto-list">
                                ${conjuntos.map(conjunto => `<option value="${conjunto}">${conjunto}</option>`).join('')}
                            </datalist>
                            <p class="error-message" id="post-conjunto-torre-error"></p>
                        </div>
                        <div class="form-group">
                            <label for="post-apartamento">Apartamento</label>
                            <input type="text" id="post-apartamento" placeholder="Ej. 301" required>
                            <p class="error-message" id="post-apartamento-error"></p>
                        </div>
                        <div class="form-group">
                            <label for="post-piso">Piso</label>
                            <input type="number" id="post-piso" placeholder="Ej. 3" min="1" step="1" required>
                            <p class="error-message" id="post-piso-error"></p>
                        </div>
                    </div>
                `;
            } else if (type === 'casa') {
                // No se agrega ningún campo adicional para Casa
            } else if (type === 'habitacion') {
                html += `
                    <div id="habitacion-edificio-fields" style="display: none;">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="post-conjunto-torre">Conjunto o Torre</label>
                                <input type="text" id="post-conjunto-torre" list="conjunto-list" placeholder="Escribe para buscar...">
                                <datalist id="conjunto-list">
                                    ${conjuntos.map(conjunto => `<option value="${conjunto}">${conjunto}</option>`).join('')}
                                </datalist>
                                <p class="error-message" id="post-conjunto-torre-error"></p>
                            </div>
                            <div class="form-group">
                                <label for="post-piso">Piso</label>
                                <input type="number" id="post-piso" placeholder="Ej. 3" min="1" step="1">
                                <p class="error-message" id="post-piso-error"></p>
                            </div>
                        </div>
                    </div>
                `;
            } else if (type === 'parqueo') {
                html += `
                    <div class="form-row">
                        <div class="form-group">
                            <label for="post-conjunto-edificio">Conjunto o Edificio (opcional)</label>
                            <input type="text" id="post-conjunto-edificio" list="conjunto-list" placeholder="Escribe para buscar...">
                            <datalist id="conjunto-list">
                                ${conjuntos.map(conjunto => `<option value="${conjunto}">${conjunto}</option>`).join('')}
                            </datalist>
                            <p class="error-message" id="post-conjunto-edificio-error"></p>
                        </div>
                    </div>
                `;
            } else if (type === 'bodega') {
                html += `
                    <div class="form-row">
                        <div class="form-group">
                            <label for="post-conjunto-edificio">Conjunto o Edificio (opcional)</label>
                            <input type="text" id="post-conjunto-edificio" list="conjunto-list" placeholder="Escribe para buscar...">
                            <datalist id="conjunto-list">
                                ${conjuntos.map(conjunto => `<option value="${conjunto}">${conjunto}</option>`).join('')}
                            </datalist>
                            <p class="error-message" id="post-conjunto-edificio-error"></p>
                        </div>
                    </div>
                `;
            }
    
            addressFields.innerHTML = html;
    
            if (type === 'habitacion') {
                const enEdificioCheckbox = document.getElementById('post-en-edificio');
                const edificioFields = document.getElementById('habitacion-edificio-fields');
                enEdificioCheckbox.addEventListener('change', () => {
                    edificioFields.style.display = enEdificioCheckbox.checked ? 'block' : 'none';
                    hasUnsavedChanges = true;
                    toggleNavbarLinks(true);
                    // Validar los campos adicionales si están visibles
                    if (enEdificioCheckbox.checked) {
                        validateAddressField('post-conjunto-torre');
                        validateAddressField('post-piso');
                    }
                });
            }
    
            const inputs = addressFields.querySelectorAll('input');
            inputs.forEach(input => {
                input.addEventListener('input', () => {
                    hasUnsavedChanges = true;
                    toggleNavbarLinks(true);
                    validateAddressField(input.id);
                });
            });
        }
    
        function validateType() {
            const typeError = document.getElementById('type-error');
            if (!typeInput.value) {
                typeError.textContent = 'El tipo de espacio es obligatorio';
                return false;
            }
            typeError.textContent = '';
            return true;
        }
    
        function validateTitle() {
            const title = titleInput.value.trim();
            const titleError = document.getElementById('title-error');
            if (!title) {
                titleError.textContent = 'El título es obligatorio';
                return false;
            }
            if (title.length > 100) {
                titleError.textContent = 'El título no debe exceder 100 caracteres';
                return false;
            }
            titleError.textContent = '';
            return true;
        }
    
        function validateDescription() {
            const description = descriptionInput.value.trim();
            const descriptionError = document.getElementById('description-error');
            if (!description) {
                descriptionError.textContent = 'La descripción es obligatoria';
                return false;
            }
            if (description.length > 500) {
                descriptionError.textContent = 'La descripción no debe exceder 500 caracteres';
                return false;
            }
            descriptionError.textContent = '';
            return true;
        }
    
        function validatePrice() {
            const price = priceInput.value;
            const priceError = document.getElementById('price-error');
            if (!price) {
                priceError.textContent = 'El precio es obligatorio';
                return false;
            }
            if (price <= 0 || !Number.isInteger(Number(price))) {
                priceError.textContent = 'El precio debe ser un número entero positivo mayor a 0';
                return false;
            }
            priceError.textContent = '';
            return true;
        }
    
        function validateAvailability() {
            const availabilityError = document.getElementById('availability-error');
            if (!availabilityInput.value) {
                availabilityError.textContent = 'La disponibilidad es obligatoria';
                return false;
            }
            availabilityError.textContent = '';
            return true;
        }
    
        function validateConditions() {
            const conditions = conditionsInput.value.trim();
            const conditionsError = document.getElementById('conditions-error');
            if (conditions.length > 500) {
                conditionsError.textContent = 'Las condiciones no deben exceder 500 caracteres';
                return false;
            }
            conditionsError.textContent = '';
            return true;
        }
    
        function validateImages(files) {
            const imagesError = document.getElementById('images-error');
            const allowedFormats = ['image/png', 'image/jpeg', 'image/jpg'];
            const maxSize = 5 * 1024 * 1024;
            const maxImages = 10;
    
            if (files.length === 0) {
                imagesError.textContent = 'Al menos una imagen es obligatoria.';
                return false;
            }
    
            if (files.length > maxImages) {
                imagesError.textContent = `Solo puedes subir un máximo de ${maxImages} imágenes`;
                return false;
            }
    
            for (let file of files) {
                if (!allowedFormats.includes(file.type)) {
                    imagesError.textContent = 'Solo se permiten archivos PNG, JPG o JPEG';
                    return false;
                }
                if (file.size > maxSize) {
                    imagesError.textContent = 'Cada imagen no debe exceder 5MB';
                    return false;
                }
            }
    
            imagesError.textContent = '';
            return true;
        }
    
        function validateAddressFields() {
            const type = typeInput.value;
            if (!type) return true;
    
            const fields = [
                'post-barrio',
                'post-calle-carrera',
                'post-numero'
            ];
    
            let addressData = {
                barrio: document.getElementById('post-barrio')?.value || '',
                calle_carrera: document.getElementById('post-calle-carrera')?.value || '',
                numero: document.getElementById('post-numero')?.value || '',
                conjunto_torre: null,
                apartamento: null,
                piso: null
            };
    
            if (type === 'apartamento') {
                fields.push('post-conjunto-torre', 'post-apartamento', 'post-piso');
                addressData.conjunto_torre = document.getElementById('post-conjunto-torre')?.value || '';
                addressData.apartamento = document.getElementById('post-apartamento')?.value || '';
                addressData.piso = document.getElementById('post-piso')?.value || '';
            } else if (type === 'habitacion') {
                if (document.getElementById('post-en-edificio')?.checked) {
                    fields.push('post-conjunto-torre', 'post-piso');
                    addressData.conjunto_torre = document.getElementById('post-conjunto-torre')?.value || '';
                    addressData.piso = document.getElementById('post-piso')?.value || '';
                }
            } else if (type === 'parqueo' || type === 'bodega') {
                addressData.conjunto_torre = document.getElementById('post-conjunto-edificio')?.value || '';
            }
    
            return fields.every(id => validateAddressField(id));
        }
    
        function validateAddressField(id) {
            const value = document.getElementById(id)?.value?.trim();
            const errorElement = document.getElementById(`${id}-error`);
            const type = typeInput.value;
    
            if (!errorElement) {
                console.warn(`Elemento de error no encontrado para el ID: ${id}-error`);
                return true;
            }
    
            if (id === 'post-barrio') {
                if (!value) {
                    errorElement.textContent = 'El barrio es obligatorio';
                    return false;
                }
                if (!barrios.includes(value)) {
                    errorElement.textContent = 'Aún no has seleccionado un barrio de forma correcta';
                    return false;
                }
                errorElement.textContent = '';
                return true;
            }
    
            if (id === 'post-calle-carrera') {
                if (!value) {
                    errorElement.textContent = 'La calle o carrera es obligatoria';
                    return false;
                }
                if (!/^Calle|Carrera\s\d+[A-Z]?$/.test(value)) {
                    errorElement.textContent = 'Formato inválido (ej. Calle 5, Carrera 100A)';
                    return false;
                }
                errorElement.textContent = '';
                return true;
            }
    
            if (id === 'post-numero') {
                if (!value) {
                    errorElement.textContent = 'El número es obligatorio';
                    return false;
                }
                if (!/^[0-9]+[A-Z0-9]*-[0-9]+[A-Z]?$/.test(value)) {
                    errorElement.textContent = 'Formato inválido (ej. 41E3-84, 45-67, 45A-12)';
                    return false;
                }
                errorElement.textContent = '';
                return true;
            }
    
            if (id === 'post-conjunto-torre' && type === 'apartamento') {
                if (!value) {
                    errorElement.textContent = 'El conjunto o torre es obligatorio';
                    return false;
                }
                if (!conjuntos.includes(value)) {
                    errorElement.textContent = 'Aún no has seleccionado un conjunto de forma correcta';
                    return false;
                }
                if (value.length > 100) {
                    errorElement.textContent = 'No debe exceder 100 caracteres';
                    return false;
                }
                errorElement.textContent = '';
                return true;
            }
    
            if (id === 'post-apartamento' && type === 'apartamento') {
                if (!value) {
                    errorElement.textContent = 'El número de apartamento es obligatorio';
                    return false;
                }
                if (value.length > 20) {
                    errorElement.textContent = 'No debe exceder 20 caracteres';
                    return false;
                }
                errorElement.textContent = '';
                return true;
            }
    
            if (id === 'post-piso' && type === 'apartamento') {
                if (!value) {
                    errorElement.textContent = 'El piso es obligatorio';
                    return false;
                }
                if (value <= 0) {
                    errorElement.textContent = 'El piso debe ser un número positivo';
                    return false;
                }
                errorElement.textContent = '';
                return true;
            }
    
            if (id === 'post-conjunto-torre' && type === 'habitacion') {
                const enEdificio = document.getElementById('post-en-edificio')?.checked;
                if (enEdificio && !value) {
                    errorElement.textContent = 'El conjunto o torre es obligatorio si está en un edificio';
                    return false;
                }
                if (enEdificio && value && !conjuntos.includes(value)) {
                    errorElement.textContent = 'Aún no has seleccionado un conjunto de forma correcta';
                    return false;
                }
                if (value && value.length > 100) {
                    errorElement.textContent = 'No debe exceder 100 caracteres';
                    return false;
                }
                errorElement.textContent = '';
                return true;
            }
    
            if (id === 'post-piso' && type === 'habitacion') {
                const enEdificio = document.getElementById('post-en-edificio')?.checked;
                if (enEdificio && !value) {
                    errorElement.textContent = 'El piso es obligatorio si está en un edificio';
                    return false;
                }
                if (value && value <= 0) {
                    errorElement.textContent = 'El piso debe ser un número positivo';
                    return false;
                }
                errorElement.textContent = '';
                return true;
            }
    
            if (id === 'post-conjunto-edificio' && (type === 'parqueo' || type === 'bodega')) {
                if (value && !conjuntos.includes(value)) {
                    errorElement.textContent = 'Aún no has seleccionado un conjunto de forma correcta';
                    return false;
                }
                if (value && value.length > 100) {
                    errorElement.textContent = 'No debe exceder 100 caracteres';
                    return false;
                }
                errorElement.textContent = '';
                return true;
            }
    
            errorElement.textContent = '';
            return true;
        }
    
        function validateForm() {
            return validateType() && validateTitle() && validateDescription() &&
                   validatePrice() && validateAvailability() && validateConditions() &&
                   validateImages(imagesInput.files) && validateAddressFields();
        }
    
        function handleImageUpload(event) {
            const files = event.target.files;
            imagePreview.innerHTML = '';
    
            if (!validateImages(files)) {
                imagesInput.value = '';
                newImages = [];
                return;
            }
    
            newImages = [];
            const compressPromises = Array.from(files).map(file => {
                return new Promise((resolve, reject) => {
                    new Compressor(file, {
                        quality: 0.6,
                        maxWidth: 1024,
                        maxHeight: 1024,
                        mimeType: file.type,
                        success(compressedFile) {
                            resolve(compressedFile);
                        },
                        error(err) {
                            console.error('Error compressing image:', err);
                            reject(err);
                        }
                    });
                });
            });
    
            Promise.all(compressPromises)
                .then(compressedFiles => {
                    newImages = compressedFiles;
                    compressedFiles.forEach(file => {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const imgDiv = document.createElement('div');
                            imgDiv.className = 'image-preview-item';
                            imgDiv.style.position = 'relative';
                            imgDiv.innerHTML = `
                                <img src="${e.target.result}" alt="Nueva imagen" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; border: 1px solid #ccc;">
                                <button type="button" class="remove-image-btn" data-file="${file.name}" style="
                                    position: absolute; top: 5px; right: 5px; background: #dc2626; color: white;
                                    border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer;
                                    display: flex; align-items: center; justify-content: center;
                                ">×</button>
                            `;
                            imagePreview.appendChild(imgDiv);
                        };
                        reader.readAsDataURL(file);
                    });
                })
                .catch(error => {
                    showMessage('Error al comprimir las imágenes. Por favor, intenta nuevamente.');
                    imagesInput.value = '';
                    newImages = [];
                });
        }
    
        async function submitPost() {
            if (!validateForm()) {
                showMessage('Por favor, corrige los errores en el formulario.');
                return;
            }
    
            showLoadingSpinner();
    
            const formData = new FormData();
            formData.append('type', typeInput.value);
            formData.append('title', titleInput.value.trim());
            formData.append('description', descriptionInput.value.trim());
            formData.append('price', priceInput.value);
            formData.append('availability', availabilityInput.value);
            formData.append('conditions', conditionsInput.value.trim() || '');
            formData.append('email', localStorage.getItem('currentUserEmail') || '');
    
            formData.append('barrio', document.getElementById('post-barrio')?.value || '');
            formData.append('calle_carrera', document.getElementById('post-calle-carrera')?.value || '');
            formData.append('numero', document.getElementById('post-numero')?.value || '');
    
            if (typeInput.value === 'apartamento') {
                formData.append('conjunto_torre', document.getElementById('post-conjunto-torre')?.value || '');
                formData.append('apartamento', document.getElementById('post-apartamento')?.value || '');
                formData.append('piso', document.getElementById('post-piso')?.value || '');
            } else if (typeInput.value === 'habitacion') {
                const enEdificio = document.getElementById('post-en-edificio')?.checked;
                formData.append('en_edificio', enEdificio ? 'true' : 'false');
                if (enEdificio) {
                    formData.append('conjunto_torre', document.getElementById('post-conjunto-torre')?.value || '');
                    formData.append('piso', document.getElementById('post-piso')?.value || '');
                }
            } else if (typeInput.value === 'parqueo') {
                formData.append('conjunto_edificio', document.getElementById('post-conjunto-edificio')?.value || '');
            } else if (typeInput.value === 'bodega') {
                formData.append('conjunto_edificio', document.getElementById('post-conjunto-edificio')?.value || '');
            }
    
            newImages.forEach(file => {
                formData.append('images', file);
            });
    
            const maxRetries = 3;
            let attempt = 0;
    
            while (attempt < maxRetries) {
                try {
                    const response = await fetch('/api/publications/landlord/create', {
                        method: 'POST',
                        headers: {
                            'x-user-email': localStorage.getItem('currentUserEmail') || ''
                        },
                        body: formData
                    });
                    const data = await response.json();
    
                    hideLoadingSpinner();
    
                    if (data.success) {
                        hasUnsavedChanges = false;
                        toggleNavbarLinks(false);
                        showMessage('Publicación creada exitosamente.', false);
                        typeInput.value = '';
                        titleInput.value = '';
                        descriptionInput.value = '';
                        priceInput.value = '';
                        availabilityInput.value = '';
                        conditionsInput.value = '';
                        imagesInput.value = '';
                        imagePreview.innerHTML = '';
                        document.getElementById('address-fields').innerHTML = '';
                        newImages = [];
                        setTimeout(renderMyPublications, 1000);
                        return;
                    } else {
                        showMessage(data.message || 'Error al crear la publicación.');
                        return;
                    }
                } catch (error) {
                    attempt++;
                    console.error(`Intento ${attempt} fallido:`, error);
                    if (attempt === maxRetries) {
                        hideLoadingSpinner();
                        showMessage('Error al crear la publicación. Por favor, intenta nuevamente más tarde.');
                        return;
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
            }
        }
     }

    async function renderMyPublications() {
        if (!mainContent) {
            console.error('No se encontró #main-content');
            showMessage('Error: No se encontró el contenedor principal.');
            return;
        }

        mainContent.innerHTML = `
            <div class="my-publications-section">
                <h1>Mis Publicaciones</h1>
                <div class="filter-section">
                    <div class="filter-form">
                        <div class="filter-group">
                            <label for="filter-status">Estado:</label>
                            <select id="filter-status">
                                <option value="">Todos</option>
                                <option value="pending">Pendiente</option>
                                <option value="rejected">Rechazado</option>
                                <option value="available">Disponible</option>
                            </select>
                        </div>
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
                        <button id="filter-btn">Filtrar</button>
                        <button id="reset-btn">Limpiar</button>
                    </div>
                </div>
                <div class="publications-list" id="publications-list"></div>
            </div>
        `;

        const style = document.createElement('style');
        style.innerHTML = `
            .my-publications-section {
                max-width: 1200px;
                margin: 2rem auto;
                padding: 0 1rem;
            }
            .my-publications-section h1 {
                font-family: 'Roboto', sans-serif;
                color: #2b6b6b;
                font-size: 2rem;
                margin-bottom: 1rem;
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
                align-items: center;
                justify-content: center;
            }
            .filter-group {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
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
            }
            .filter-group select:focus,
            .filter-group input:focus {
                border-color: #2b6b6b;
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
            .publications-list {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 1.5rem;
                padding: 1rem 0;
            }
            .publication-card {
                background: #fff;
                border-radius: 12px;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                overflow: hidden;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                position: relative;
                border: 1px solid #e5e7eb;
                display: flex;
                flex-direction: column;
            }
            .publication-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
            }
            .publication-image {
                width: 100%;
                height: 180px;
                object-fit: cover;
            }
            .publication-content {
                flex: 1;
                padding: 0.75rem 0;
            }
            .publication-card h3 {
                font-family: 'Roboto', sans-serif;
                font-size: 1.25rem;
                font-weight: 600;
                color: #333;
                margin: 0.75rem 0;
                padding-left: 1rem;
                text-align: left;
                line-height: 1.3;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-overflow: ellipsis;
                max-height: 3.2em;
            }
            .publication-card p {
                font-family: 'Roboto', sans-serif;
                font-size: 0.9rem;
                color: #666;
                margin: 0.3rem 0;
                padding-left: 1rem;
            }
            .publication-actions {
                display: flex;
                justify-content: space-between;
                padding: 0.75rem 1rem;
                border-top: 1px solid #e5e7eb;
                background: #f9fafb;
                gap: 0.5rem;
                margin-top: auto;
            }
            .publication-action-btn {
                background: #e5e7eb;
                color: #374151;
                border: none;
                padding: 0.5rem 0.75rem;
                border-radius: 6px;
                cursor: pointer;
                font-family: 'Roboto', sans-serif;
                font-size: 0.85rem;
                font-weight: 500;
                flex: 1;
                text-align: center;
                transition: background 0.3s ease, color 0.3s ease;
            }
            .publication-action-btn:hover:not(:disabled) {
                background: #d1d5db;
            }
            .publication-action-btn:disabled {
                background: #e5e7eb;
                color: #9ca3af;
                cursor: not-allowed;
            }
            .pending-message {
                font-family: 'Roboto', sans-serif;
                font-size: 0.85rem;
                color: #dc2626;
                text-align: center;
                margin: 0.5rem 1rem;
                font-weight: 500;
                background: #fef2f2;
                padding: 0.5rem;
                border-radius: 6px;
            }
            .rental-status {
                font-family: 'Roboto', sans-serif;
                font-size: 0.9em;
                margin: 0.5rem 1rem 1rem 1rem;
                padding: 5px 10px;
                border-radius: 5px;
                text-align: center;
            }
            .rental-status.disponible {
                background-color: #e7f3e7;
                color: #2e7d32;
            }
            .rental-status.en-proceso {
                background-color: #fff3e0;
                color: #f57c00;
            }
            .rental-status.arrendado {
                background-color: #e3f2fd;
                color: #1976d2;
            }
            .rental-status.inactivo {
                background-color: #f5f5f5;
                color: #616161;
            }
            .rental-status.desconocido {
                background-color: #ffebee;
                color: #d32f2f;
            }
            .no-publications {
                text-align: center;
                padding: 2rem;
                font-family: 'Roboto', sans-serif;
                color: #555;
            }
            .no-publications span {
                font-size: 2rem;
                display: block;
                margin-bottom: 1rem;
            }
            .no-publications.error {
                color: #dc2626;
            }
            @media (max-width: 768px) {
                .publications-list {
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                }
                .filter-form {
                    flex-direction: column;
                    align-items: stretch;
                }
                .filter-form button {
                    margin-top: 0.5rem;
                }
            }
            @media (max-width: 480px) {
                .publications-list {
                    grid-template-columns: 1fr;
                }
                .publication-card h3 {
                    font-size: 1.1rem;
                }
                .publication-actions {
                    flex-direction: column;
                }
                .publication-action-btn {
                    margin-bottom: 0.5rem;
                }
                .publication-action-btn:last-child {
                    margin-bottom: 0;
                }
            }
        `;
        document.head.appendChild(style);

        const filterStatus = document.getElementById('filter-status');
        const filterTitle = document.getElementById('filter-title');
        const filterType = document.getElementById('filter-type');
        const filterBtn = document.getElementById('filter-btn');
        const resetBtn = document.getElementById('reset-btn');

        async function fetchFilteredPublications() {
            const status = filterStatus.value;
            const title = filterTitle.value.trim();
            const type = filterType.value;

            const params = new URLSearchParams();
            if (status) params.append('status', status);
            if (title) params.append('title', title);
            if (type) params.append('type', type);

            await fetchMyPublications(params.toString());
        }

        filterBtn.addEventListener('click', () => {
            fetchFilteredPublications();
        });

        filterTitle.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                fetchFilteredPublications();
            }
        });

        resetBtn.addEventListener('click', () => {
            filterStatus.value = '';
            filterTitle.value = '';
            filterType.value = '';
            fetchMyPublications();
        });

        await fetchMyPublications();
    }

     //Agregar mensajes de Disponible para arriendo, En Proceso de Arrendamiento, Arrendado
    async function fetchMyPublications(queryString = '') {
        const publicationsList = document.getElementById('publications-list');
        if (!publicationsList) {
            console.error('No se encontró #publications-list');
            showMessage('Error: No se encontró el contenedor de publicaciones.');
            return;
        }

        showLoadingSpinner();

        try {
            const userEmail = localStorage.getItem('currentUserEmail') || '';
            if (!userEmail) {
                throw new Error('No se encontró el email del usuario en localStorage. Por favor, inicia sesión nuevamente.');
            }

            console.log('Solicitando publicaciones para el usuario:', userEmail);

            const url = queryString ? `/api/publications/landlord/my-publications?${queryString}` : '/api/publications/landlord/my-publications';
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
            console.log('Datos recibidos del backend:', data);

            publicationsList.innerHTML = '';

            if (!data.success) {
                throw new Error(data.message || 'Error al obtener las publicaciones');
            }

            if (!data.publications || data.publications.length === 0) {
                publicationsList.innerHTML = `
                    <div class="no-publications">
                        <span>📋</span>
                        <p>No se encontraron publicaciones con los criterios seleccionados.</p>
                    </div>
                `;
                hideLoadingSpinner();
                return;
            }

            data.publications.forEach(publication => {
                if (!publication.id || !publication.title || !publication.price || !publication.availability || !publication.status || !publication.rental_status) {
                    console.warn('Publicación incompleta:', publication);
                    return;
                }

                const publicationCard = document.createElement('div');
                publicationCard.className = 'publication-card';

                const formattedPrice = Number(publication.price).toLocaleString('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                });
                const imageSrc = publication.image_url || '/img/house_default.png';
                const type = publication.type || 'Desconocido';

                let formattedType = '';
                switch (type.toLowerCase()) {
                    case 'apartamento':
                        formattedType = 'Apartamento';
                        break;
                    case 'casa':
                        formattedType = 'Casa';
                        break;
                    case 'habitacion':
                        formattedType = 'Habitación';
                        break;
                    case 'parqueo':
                        formattedType = 'Parqueadero';
                        break;
                    case 'bodega':
                        formattedType = 'Bodega';
                        break;
                    default:
                        formattedType = type.charAt(0).toUpperCase() + type.slice(1);
                }

                let address = '';
                if (publication.barrio || publication.calle_carrera || publication.numero) {
                    const addressParts = [];
                    if (publication.barrio) addressParts.push(publication.barrio);
                    if (publication.calle_carrera) addressParts.push(publication.calle_carrera);
                    if (publication.numero) addressParts.push(`#${publication.numero}`);
                    
                    if (['apartamento', 'habitacion'].includes(type.toLowerCase())) {
                        if (publication.conjunto_torre) addressParts.push(`${publication.conjunto_torre}`);
                        if (publication.apartamento) addressParts.push(`Apto: ${publication.apartamento}`);
                        if (publication.piso) addressParts.push(`Piso: ${publication.piso}`);
                    }
                    
                    address = addressParts.join(', ');
                } else {
                    address = 'Dirección no disponible';
                }

                let formattedAvailability = '';
                switch (publication.availability) {
                    case 'inmediata':
                        formattedAvailability = 'Inmediata';
                        break;
                    case 'futura_1mes':
                        formattedAvailability = 'Futura (1 mes)';
                        break;
                    case 'futura_3meses':
                        formattedAvailability = 'Futura (3 meses)';
                        break;
                    default:
                        formattedAvailability = publication.availability;
                }

                let rentalStatusMessage = '';
                // Mostrar el mensaje de rental_status SOLO si status es 'available'
                if (publication.status === 'available') {
                    switch (publication.rental_status) {
                        case 'disponible':
                            rentalStatusMessage = '<p class="rental-status disponible">Disponible para arriendo</p>';
                            break;
                        case 'en_proceso_arrendamiento':
                            rentalStatusMessage = '<p class="rental-status en-proceso">En Proceso de Arrendamiento</p>';
                            break;
                        case 'arrendado':
                            rentalStatusMessage = '<p class="rental-status arrendado">Arrendado</p>';
                            break;
                        case 'inactivo':
                            rentalStatusMessage = '<p class="rental-status inactivo">Inactivo</p>';
                            break;
                        default:
                            rentalStatusMessage = '<p class="rental-status desconocido">Estado de renta desconocido...</p>';
                            console.warn(`rental_status desconocido para la publicación ${publication.id}: ${publication.rental_status}`);
                    }
                }

                let viewDisabled = '';
                let editDisabled = '';
                let deleteDisabled = '';
                let statusMessage = '';

                if (publication.status === 'pending') {
                    viewDisabled = 'disabled';
                    editDisabled = 'disabled';
                    deleteDisabled = 'disabled';
                    statusMessage = '<p class="pending-message">En espera de Revisión...</p>';
                } else if (publication.status === 'rejected') {
                    viewDisabled = 'disabled';
                    editDisabled = '';
                    deleteDisabled = '';
                    statusMessage = '<p class="pending-message">En espera de modificación...</p>';
                } else if (publication.status === 'available') {
                    viewDisabled = '';
                    if (publication.rental_status === 'en_proceso_arrendamiento' || publication.rental_status === 'arrendado') {
                        editDisabled = 'disabled';
                        deleteDisabled = 'disabled';
                    } else {
                        editDisabled = '';
                        deleteDisabled = '';
                    }
                    statusMessage = '';
                } else {
                    console.warn(`Estado desconocido para la publicación ${publication.id}: ${publication.status}`);
                    viewDisabled = 'disabled';
                    editDisabled = 'disabled';
                    deleteDisabled = 'disabled';
                    statusMessage = '<p class="pending-message">Estado desconocido...</p>';
                }

                publicationCard.innerHTML = `
                    <img src="${imageSrc}" alt="${publication.title}" class="publication-image">
                    <h3>${publication.title}</h3>
                    <p><strong>Tipo:</strong> ${formattedType}</p>
                    <p><strong>Precio:</strong> ${formattedPrice}</p>
                    <p><strong>Disponibilidad:</strong> ${formattedAvailability}</p>
                    <p><strong>Dirección:</strong> ${address}</p>
                    <div class="publication-actions">
                        <button class="publication-action-btn view" data-id="${publication.id}" ${viewDisabled}>Conocer Publicación</button>
                        <button class="publication-action-btn edit" data-id="${publication.id}" ${editDisabled}>Editar Publicación</button>
                        <button class="publication-action-btn delete" data-id="${publication.id}" ${deleteDisabled}>Eliminar Publicación</button>
                    </div>
                    ${statusMessage}
                    ${rentalStatusMessage}
                `;

                publicationsList.appendChild(publicationCard);

                const viewBtn = publicationCard.querySelector('.view');
                const editBtn = publicationCard.querySelector('.edit');
                const deleteBtn = publicationCard.querySelector('.delete');

                if (!viewBtn || !editBtn || !deleteBtn) {
                    console.error(`No se encontraron los botones para la publicación ${publication.id}`);
                    return;
                }

                if (!viewDisabled) {
                    viewBtn.addEventListener('click', () => {
                        console.log(`Clic en "Conocer Publicación" para la publicación ${publication.id}`);
                        window.renderMyPublicationDetails(publication.id);
                    });
                }

                if (!editDisabled) {
                    editBtn.addEventListener('click', () => {
                        console.log(`Clic en "Editar Publicación" para la publicación ${publication.id}`);
                        window.renderEditPublicationForm(publication.id);
                    });
                }

                if (!deleteDisabled) {
                    deleteBtn.addEventListener('click', () => {
                        showConfirmationDialog(
                            '¿Estás seguro de que deseas eliminar esta publicación? Esta acción no se puede deshacer.',
                            async () => {
                                await deletePublication(publication.id);
                                setTimeout(async () => {
                                    await renderMyPublications();
                                }, 1500);
                            },
                            () => {
                                console.log('Eliminación cancelada');
                            }
                        );
                    });
                }
            });

            hideLoadingSpinner();
        } catch (error) {
            hideLoadingSpinner();
            console.error('Error obteniendo las publicaciones:', error);
            publicationsList.innerHTML = `
                <p class="no-publications error">Error al cargar tus publicaciones: ${error.message}</p>
            `;
        }
    }


    if (createPostLink) {
        createPostLink.addEventListener('click', (event) => {
            event.preventDefault();
            if (hasUnsavedChanges) {
                showUnsavedChangesWarning(() => {
                    hasUnsavedChanges = false;
                    toggleNavbarLinks(false);
                    renderCreatePostForm();
                });
            } else {
                renderCreatePostForm();
            }
        });
    }

    if (dashboardLink) {
        dashboardLink.addEventListener('click', (event) => {
            event.preventDefault();
            if (hasUnsavedChanges) {
                showUnsavedChangesWarning(() => {
                    hasUnsavedChanges = false;
                    toggleNavbarLinks(false);
                    renderMyPublications();
                });
            } else {
                renderMyPublications();
            }
        });
    }

    menuLinks.forEach(link => {
        if (link.getAttribute('href') !== 'crear-publicacion' && link.getAttribute('href') !== 'dashboard') {
            link.addEventListener('click', (event) => {
                if (hasUnsavedChanges) {
                    event.preventDefault();
                    showUnsavedChangesWarning(() => {
                        hasUnsavedChanges = false;
                        toggleNavbarLinks(false);
                        window.location.href = link.getAttribute('href');
                    });
                }
            });
        }
    });

    async function fetchNotifications() {
        const notificationsList = document.getElementById('notifications-list');
        if (!notificationsList) {
            console.log('No se encontró #notifications-list');
            return;
        }
    
        console.log('Solicitando notificaciones para:', localStorage.getItem('currentUserEmail'));
    
        try {
            const response = await fetch('/api/publications/landlord/notifications', {
                method: 'GET',
                headers: {
                    'x-user-email': localStorage.getItem('currentUserEmail') || ''
                }
            });
    
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
            }
    
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
    
            const unreadNotifications = data.notifications.filter(notification => !notification.read);
    
            if (unreadNotifications.length === 0) {
                notificationsList.innerHTML = `
                    <div class="no-notifications">
                        <span>🔔</span>
                        <p>Aún no tienes notificaciones nuevas.</p>
                    </div>
                `;
                return;
            }
    
            unreadNotifications.forEach(notification => {
                const notificationCard = document.createElement('div');
                notificationCard.className = `notification-card ${notification.read ? '' : 'unread'}`;
    
                let icon = '🔔';
                let actionText = 'Ok';
                switch (notification.type) {
                    case '':
                        icon = '❌';
                        actionText = 'Ok';
                        break;
                    case 'publication_status':
                        if (notification.message.includes('aprobada')) {
                            icon = '✅';
                            actionText = 'Ok';
                        } else if (notification.message.includes('rechazada')) {
                            icon = '🚫';
                            actionText = 'Ok';
                        } else {
                            icon = '⏳';
                            actionText = 'Ok';
                        }
                        break;
                    case 'message':
                        icon = '✉️';
                        actionText = 'Responder';
                        break;
                    case 'publication_deleted':
                        icon = '🗑️';
                        actionText = 'Ok';
                        break;
                    case 'agreement_created':
                        icon = '🤝🏼';
                        actionText = 'Ok';
                        break;   
                    case 'contract_uploaded':
                        icon = '📤';
                        actionText = 'Ok';
                        break;    
                    case 'contract_accepted':
                        icon = '👍';
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
                    <button class="notification-action-btn" data-id="${notification.id}" data-action="${notification.action_url || '#'}" data-type="${notification.type}">${actionText}</button>
                `;
    
                notificationsList.appendChild(notificationCard);
    
                const actionBtn = notificationCard.querySelector('.notification-action-btn');
                actionBtn.addEventListener('click', async () => {
                    const elements = showLoadingSpinner('Cargando conversación...');
                    try {
                        if (notification.type === 'message') {
                            // Validar la URL de la notificación
                            if (!notification.action_url || !notification.action_url.includes('/conversations/')) {
                                throw new Error('La URL de la notificación no contiene un ID de conversación válido');
                            }
                
                            // Extraer el ID de la conversación
                            const match = notification.action_url.match(/\/conversations\/(\d+)/);
                            if (!match) {
                                throw new Error('Formato de URL inválido para la conversación');
                            }
                            const conversationId = match[1];
                            console.log(`Intentando abrir conversación con ID: ${conversationId}`);
                
                            // Obtener detalles de la conversación
                            const conversationResponse = await fetch(`/api/conversations/${conversationId}`, {
                                method: 'GET',
                                headers: {
                                    'x-user-email': localStorage.getItem('currentUserEmail') || ''
                                }
                            });
                
                            if (!conversationResponse.ok) {
                                const errorData = await conversationResponse.json().catch(() => ({}));
                                if (conversationResponse.status === 404) {
                                    throw new Error('La conversación no existe o no tienes acceso a ella');
                                }
                                throw new Error(errorData.message || `Error al obtener la conversación: ${conversationResponse.status}`);
                            }
                
                            const conversationData = await conversationResponse.json();
                            if (!conversationData.success || !conversationData.conversation) {
                                throw new Error(conversationData.message || 'No se encontraron detalles de la conversación');
                            }
                
                            const conversation = conversationData.conversation;
                
                            // Validar datos necesarios para abrir la conversación
                            if (!conversation.id || !conversation.publication_id || !conversation.tenant_email || !conversation.tenant_name || !conversation.publication_title) {
                                throw new Error('Datos de la conversación incompletos');
                            }
                
                            // Preparar objetos tenant y publication
                            const tenant = {
                                full_name: conversation.tenant_name,
                                profile_picture: conversation.tenant_profile_picture || '/img/default-profile.png',
                                email: conversation.tenant_email
                            };
                            const publication = {
                                title: conversation.publication_title
                            };
                
                            // Verificar que window.openConversation exista
                            if (typeof window.openConversation !== 'function') {
                                throw new Error('No se puede abrir la conversación: la función openConversation no está disponible. Por favor, recarga la página.');
                            }
                
                            // Abrir la conversación
                            await window.openConversation(
                                conversation.id,
                                conversation.publication_id,
                                tenant,
                                publication
                            );
                
                            // Marcar como leídas todas las notificaciones relacionadas con esta conversación
                            const relatedNotifications = unreadNotifications.filter(n =>
                                n.type === 'message' && n.action_url.includes(`/conversations/${conversationId}`)
                            );
                
                            for (const relatedNotification of relatedNotifications) {
                                try {
                                    await markNotificationAsRead(relatedNotification.id);
                                    console.log(`Notificación ${relatedNotification.id} marcada como leída`);
                                } catch (readError) {
                                    console.error(`Error al marcar notificación ${relatedNotification.id} como leída:`, readError);
                                }
                            }
                
                            // Eliminar las tarjetas de notificaciones relacionadas del DOM
                            relatedNotifications.forEach(n => {
                                const card = notificationsList.querySelector(`.notification-action-btn[data-id="${n.id}"]`)?.parentElement;
                                if (card) {
                                    card.remove();
                                    console.log(`Notificación ${n.id} eliminada del DOM`);
                                }
                            });
                
                            // Verificar si quedan notificaciones
                            const remainingNotifications = notificationsList.querySelectorAll('.notification-card');
                            if (remainingNotifications.length === 0) {
                                notificationsList.innerHTML = `
                                    <div class="no-notifications">
                                        <span>🔔</span>
                                        <p>Aún no tienes notificaciones nuevas.</p>
                                    </div>
                                `;
                            }
                        } else {
                            // Para notificaciones que no son de mensajes
                            await markNotificationAsRead(notification.id);
                            notificationCard.remove();
                            console.log(`Notificación ${notification.id} marcada como leída y eliminada`);
                
                            const remainingNotifications = notificationsList.querySelectorAll('.notification-card');
                            if (remainingNotifications.length === 0) {
                                notificationsList.innerHTML = `
                                    <div class="no-notifications">
                                        <span>🔔</span>
                                        <p>Aún no tienes notificaciones nuevas.</p>
                                    </div>
                                `;
                            }
                        }
                    } catch (error) {
                        console.error('Error al procesar la notificación:', error.message, error.stack);
                        showMessage(`Error: ${error.message || 'No se pudo procesar la notificación'}`, true);
                    } finally {
                        hideLoadingSpinner(elements);
                    }
                });
            });
        } catch (error) {
            console.error('Error obteniendo notificaciones:', error.message, error.stack);
            notificationsList.innerHTML = `
                <p class="no-notifications error">Error al cargar notificaciones: ${error.message}</p>
            `;
        }
    }

    async function markNotificationAsRead(notificationId) {
        try {
            const response = await fetch(`/api/publications/landlord/notifications/${notificationId}/read`, {
                method: 'PATCH',
                headers: {
                    'x-user-email': localStorage.getItem('currentUserEmail') || ''
                }
            });
            console.log('Respuesta al marcar como leída:', response.status, response.statusText);
            const data = await response.json();

            if (data.success) {
                console.log(`Notificación ${notificationId} marcada como leída.`);
            } else {
                console.error('Error al marcar la notificación como leída:', data.message);
            }
        } catch (error) {
            console.error('Error marcando notificación como leída:', error);
        }
    }

    window.fetchNotifications = fetchNotifications;

    fetchNotifications();
});

//Nuevo bloque para poder ver mis publicaciones Conocer, Editar, Filtrar publicaiones, Eliminar
document.addEventListener('DOMContentLoaded', function() {
    // DOM Variables
    const mainContent = document.getElementById('main-content');
    const myPublicationsLink = document.querySelector('a[href="publicaciones"]');
    const dashboardLink = document.querySelector('a[href="dashboard"]');
    const originalDashboardContent = mainContent ? mainContent.innerHTML : '';
    let loadingOverlay = null;
    let loadingSpinner = null;

    // Show message (error or success)
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

    // Show loading spinner
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

    // Hide loading spinner
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

    async function deletePublication(publicationId) {
        showLoadingSpinner();
        try {
            const userEmail = localStorage.getItem('currentUserEmail') || '';
            if (!userEmail) {
                throw new Error('No se encontró el email del usuario en localStorage. Por favor, inicia sesión nuevamente.');
            }

            console.log(`Eliminando publicación ${publicationId} para el usuario ${userEmail}`);

            const response = await fetch(`/api/publications/landlord/${publicationId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': userEmail
                },
                body: JSON.stringify({
                    reason: 'Eliminación solicitada por el arrendador',
                    deletionDetails: 'El arrendador decidió eliminar la publicación.'
                })
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Respuesta al eliminar publicación:', data);

            hideLoadingSpinner();

            if (!data.success) {
                throw new Error(data.message || 'Error al eliminar la publicación');
            }

            showMessage('Publicación eliminada exitosamente.', false);
        } catch (error) {
            hideLoadingSpinner();
            console.error('Error eliminando la publicación:', error);
            showMessage('Error al eliminar la publicación: ' + error.message);
        }
    }

    // Show confirmation dialog
    function showConfirmationDialog(message, onConfirm, onCancel) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background-color: rgba(0,0,0,0.5); z-index: 2999; opacity: 0;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(overlay);

        const dialogDiv = document.createElement('div');
        dialogDiv.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background-color: #fff; padding: 2rem; border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 3000; text-align: center;
            font-family: 'Roboto', sans-serif; color: #333; opacity: 0;
            transition: opacity 0.3s ease, transform 0.3s ease; max-width: 400px;
        `;
        dialogDiv.innerHTML = `
            <h3 style="margin-bottom: 1rem; font-size: 1.25rem;">Confirmar Eliminación</h3>
            <p style="margin-bottom: 1.5rem;">${message}</p>
            <div style="display: flex; gap: 1rem; justify-content: center;">
                <button class="confirm-btn" style="
                    background: linear-gradient(135deg, #dc2626, #f87171); color: white;
                    border: none; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer;
                    font-weight: 500;
                ">Eliminar</button>
                <button class="cancel-btn" style="
                    background: #e5e7eb; color: #374151;
                    border: none; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer;
                    font-weight: 500;
                ">Cancelar</button>
            </div>
        `;
        document.body.appendChild(dialogDiv);

        setTimeout(() => {
            overlay.style.opacity = '1';
            dialogDiv.style.opacity = '1';
        }, 10);

        const confirmBtn = dialogDiv.querySelector('.confirm-btn');
        const cancelBtn = dialogDiv.querySelector('.cancel-btn');

        confirmBtn.addEventListener('click', () => {
            onConfirm();
            overlay.style.opacity = '0';
            dialogDiv.style.opacity = '0';
            dialogDiv.style.transform = 'translate(-50%, -60%)';
            setTimeout(() => {
                document.body.removeChild(overlay);
                document.body.removeChild(dialogDiv);
            }, 300);
        });

        cancelBtn.addEventListener('click', () => {
            if (onCancel) onCancel();
            overlay.style.opacity = '0';
            dialogDiv.style.opacity = '0';
            dialogDiv.style.transform = 'translate(-50%, -60%)';
            setTimeout(() => {
                document.body.removeChild(overlay);
                document.body.removeChild(dialogDiv);
            }, 300);
        });
    }

    // Restore dashboard
    async function restoreDashboard() {
        if (!mainContent) {
            console.error('No se encontró #main-content');
            return;
        }
        mainContent.innerHTML = originalDashboardContent;
        // Recargar estadísticas y notificaciones
        if (typeof fetchStats === 'function') {
            await fetchStats();
        }
        if (typeof window.fetchNotifications === 'function') {
            await window.fetchNotifications();
        }
    }

    // Render "My Publications" with filter form 
    async function renderMyPublications() {
        if (!mainContent) {
            console.error('No se encontró #main-content');
            showMessage('Error: No se encontró el contenedor principal.');
            return;
        }

        mainContent.innerHTML = `
            <div class="my-publications-section">
                <h1>Mis Publicaciones</h1>
                <div class="filter-section">
                    <div class="filter-form">
                        <div class="filter-group">
                            <label for="filter-status">Estado:</label>
                            <select id="filter-status">
                                <option value="">Todos</option>
                                <option value="pending">Pendiente</option>
                                <option value="rejected">Rechazado</option>
                                <option value="available">Disponible</option>
                            </select>
                        </div>
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
                        <button id="filter-btn">Filtrar</button>
                        <button id="reset-btn">Limpiar</button>
                    </div>
                </div>
                <div class="publications-list" id="publications-list"></div>
            </div>
        `;

        const style = document.createElement('style');
        style.innerHTML = `
            .my-publications-section {
                max-width: 1200px;
                margin: 2rem auto;
                padding: 0 1rem;
            }
            .my-publications-section h1 {
                font-family: 'Roboto', sans-serif;
                color: #2b6b6b;
                font-size: 2rem;
                margin-bottom: 1rem;
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
                align-items: center;
                justify-content: center;
            }
            .filter-group {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
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
            }
            .filter-group select:focus,
            .filter-group input:focus {
                border-color: #2b6b6b;
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
            .publications-list {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 1.5rem;
                padding: 1rem 0;
            }
            .publication-card {
                background: #fff;
                border-radius: 12px;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                overflow: hidden;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                position: relative;
                border: 1px solid #e5e7eb;
                display: flex;
                flex-direction: column;
            }
            .publication-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
            }
            .publication-image {
                width: 100%;
                height: 180px;
                object-fit: cover;
            }
            .publication-content {
                flex: 1;
                padding: 0.75rem 0;
            }
            .publication-card h3 {
                font-family: 'Roboto', sans-serif;
                font-size: 1.25rem;
                font-weight: 600;
                color: #333;
                margin: 0.75rem 0;
                padding-left: 1rem;
                text-align: left;
                line-height: 1.3;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-overflow: ellipsis;
                max-height: 3.2em;
            }
            .publication-card p {
                font-family: 'Roboto', sans-serif;
                font-size: 0.9rem;
                color: #666;
                margin: 0.3rem 0;
                padding-left: 1rem;
            }
            .publication-actions {
                display: flex;
                justify-content: space-between;
                padding: 0.75rem 1rem;
                border-top: 1px solid #e5e7eb;
                background: #f9fafb;
                gap: 0.5rem;
                margin-top: auto;
            }
            .publication-action-btn {
                background: #e5e7eb;
                color: #374151;
                border: none;
                padding: 0.5rem 0.75rem;
                border-radius: 6px;
                cursor: pointer;
                font-family: 'Roboto', sans-serif;
                font-size: 0.85rem;
                font-weight: 500;
                flex: 1;
                text-align: center;
                transition: background 0.3s ease, color 0.3s ease;
            }
            .publication-action-btn:hover:not(:disabled) {
                background: #d1d5db;
            }
            .publication-action-btn:disabled {
                background: #e5e7eb;
                color: #9ca3af;
                cursor: not-allowed;
            }
            .pending-message {
                font-family: 'Roboto', sans-serif;
                font-size: 0.85rem;
                color: #dc2626;
                text-align: center;
                margin: 0.5rem 1rem;
                font-weight: 500;
                background: #fef2f2;
                padding: 0.5rem;
                border-radius: 6px;
            }
            .rental-status {
                font-family: 'Roboto', sans-serif;
                font-size: 0.9em;
                margin: 0.5rem 1rem 1rem 1rem;
                padding: 5px 10px;
                border-radius: 5px;
                text-align: center;
            }
            .rental-status.disponible {
                background-color: #e7f3e7;
                color: #2e7d32;
            }
            .rental-status.en-proceso {
                background-color: #fff3e0;
                color: #f57c00;
            }
            .rental-status.arrendado {
                background-color: #e3f2fd;
                color: #1976d2;
            }
            .rental-status.inactivo {
                background-color: #f5f5f5;
                color: #616161;
            }
            .rental-status.desconocido {
                background-color: #ffebee;
                color: #d32f2f;
            }
            .no-publications {
                text-align: center;
                padding: 2rem;
                font-family: 'Roboto', sans-serif;
                color: #555;
            }
            .no-publications span {
                font-size: 2rem;
                display: block;
                margin-bottom: 1rem;
            }
            .no-publications.error {
                color: #dc2626;
            }
            @media (max-width: 768px) {
                .publications-list {
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                }
                .filter-form {
                    flex-direction: column;
                    align-items: stretch;
                }
                .filter-form button {
                    margin-top: 0.5rem;
                }
            }
            @media (max-width: 480px) {
                .publications-list {
                    grid-template-columns: 1fr;
                }
                .publication-card h3 {
                    font-size: 1.1rem;
                }
                .publication-actions {
                    flex-direction: column;
                }
                .publication-action-btn {
                    margin-bottom: 0.5rem;
                }
                .publication-action-btn:last-child {
                    margin-bottom: 0;
                }
            }
        `;
        document.head.appendChild(style);

        const filterStatus = document.getElementById('filter-status');
        const filterTitle = document.getElementById('filter-title');
        const filterType = document.getElementById('filter-type');
        const filterBtn = document.getElementById('filter-btn');
        const resetBtn = document.getElementById('reset-btn');

        async function fetchFilteredPublications() {
            const status = filterStatus.value;
            const title = filterTitle.value.trim();
            const type = filterType.value;

            const params = new URLSearchParams();
            if (status) params.append('status', status);
            if (title) params.append('title', title);
            if (type) params.append('type', type);

            await fetchMyPublications(params.toString());
        }

        filterBtn.addEventListener('click', () => {
            fetchFilteredPublications();
        });

        filterTitle.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                fetchFilteredPublications();
            }
        });

        resetBtn.addEventListener('click', () => {
            filterStatus.value = '';
            filterTitle.value = '';
            filterType.value = '';
            fetchMyPublications();
        });

        await fetchMyPublications();
    }

    // Fetch and display user's publications (with optional query parameters) (ACOMODAR)
    async function fetchMyPublications(queryString = '') {
        const publicationsList = document.getElementById('publications-list');
        if (!publicationsList) {
            console.error('No se encontró #publications-list');
            showMessage('Error: No se encontró el contenedor de publicaciones.');
            return;
        }

        showLoadingSpinner();

        try {
            const userEmail = localStorage.getItem('currentUserEmail') || '';
            if (!userEmail) {
                throw new Error('No se encontró el email del usuario en localStorage. Por favor, inicia sesión nuevamente.');
            }

            console.log('Solicitando publicaciones para el usuario:', userEmail);

            const url = queryString ? `/api/publications/landlord/my-publications?${queryString}` : '/api/publications/landlord/my-publications';
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
            console.log('Datos recibidos del backend:', data);

            publicationsList.innerHTML = '';

            if (!data.success) {
                throw new Error(data.message || 'Error al obtener las publicaciones');
            }

            if (!data.publications || data.publications.length === 0) {
                publicationsList.innerHTML = `
                    <div class="no-publications">
                        <span>📋</span>
                        <p>No se encontraron publicaciones con los criterios seleccionados.</p>
                    </div>
                `;
                hideLoadingSpinner();
                return;
            }

            data.publications.forEach(publication => {
                if (!publication.id || !publication.title || !publication.price || !publication.availability || !publication.status || !publication.rental_status) {
                    console.warn('Publicación incompleta:', publication);
                    return;
                }

                const publicationCard = document.createElement('div');
                publicationCard.className = 'publication-card';

                const formattedPrice = Number(publication.price).toLocaleString('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                });
                const imageSrc = publication.image_url || '/img/house_default.png';
                const type = publication.type || 'Desconocido';

                let formattedType = '';
                switch (type.toLowerCase()) {
                    case 'apartamento':
                        formattedType = 'Apartamento';
                        break;
                    case 'casa':
                        formattedType = 'Casa';
                        break;
                    case 'habitacion':
                        formattedType = 'Habitación';
                        break;
                    case 'parqueo':
                        formattedType = 'Parqueadero';
                        break;
                    case 'bodega':
                        formattedType = 'Bodega';
                        break;
                    default:
                        formattedType = type.charAt(0).toUpperCase() + type.slice(1);
                }

                let address = '';
                if (publication.barrio || publication.calle_carrera || publication.numero) {
                    const addressParts = [];
                    if (publication.barrio) addressParts.push(publication.barrio);
                    if (publication.calle_carrera) addressParts.push(publication.calle_carrera);
                    if (publication.numero) addressParts.push(`#${publication.numero}`);
                    
                    if (['apartamento', 'habitacion'].includes(type.toLowerCase())) {
                        if (publication.conjunto_torre) addressParts.push(`${publication.conjunto_torre}`);
                        if (publication.apartamento) addressParts.push(`Apto: ${publication.apartamento}`);
                        if (publication.piso) addressParts.push(`Piso: ${publication.piso}`);
                    }
                    
                    address = addressParts.join(', ');
                } else {
                    address = 'Dirección no disponible';
                }

                let formattedAvailability = '';
                switch (publication.availability) {
                    case 'inmediata':
                        formattedAvailability = 'Inmediata';
                        break;
                    case 'futura_1mes':
                        formattedAvailability = 'Futura (1 mes)';
                        break;
                    case 'futura_3meses':
                        formattedAvailability = 'Futura (3 meses)';
                        break;
                    default:
                        formattedAvailability = publication.availability;
                }

                let rentalStatusMessage = '';
                // Mostrar el mensaje de rental_status SOLO si status es 'available'
                if (publication.status === 'available') {
                    switch (publication.rental_status) {
                        case 'disponible':
                            rentalStatusMessage = '<p class="rental-status disponible">Disponible para arriendo</p>';
                            break;
                        case 'en_proceso_arrendamiento':
                            rentalStatusMessage = '<p class="rental-status en-proceso">En Proceso de Arrendamiento</p>';
                            break;
                        case 'arrendado':
                            rentalStatusMessage = '<p class="rental-status arrendado">Arrendado</p>';
                            break;
                        case 'inactivo':
                            rentalStatusMessage = '<p class="rental-status inactivo">Inactivo</p>';
                            break;
                        default:
                            rentalStatusMessage = '<p class="rental-status desconocido">Estado de renta desconocido...</p>';
                            console.warn(`rental_status desconocido para la publicación ${publication.id}: ${publication.rental_status}`);
                    }
                }

                let viewDisabled = '';
                let editDisabled = '';
                let deleteDisabled = '';
                let statusMessage = '';

                if (publication.status === 'pending') {
                    viewDisabled = 'disabled';
                    editDisabled = 'disabled';
                    deleteDisabled = 'disabled';
                    statusMessage = '<p class="pending-message">En espera de Revisión...</p>';
                } else if (publication.status === 'rejected') {
                    viewDisabled = 'disabled';
                    editDisabled = '';
                    deleteDisabled = '';
                    statusMessage = '<p class="pending-message">En espera de modificación...</p>';
                } else if (publication.status === 'available') {
                    viewDisabled = '';
                    if (publication.rental_status === 'en_proceso_arrendamiento' || publication.rental_status === 'arrendado') {
                        editDisabled = 'disabled';
                        deleteDisabled = 'disabled';
                    } else {
                        editDisabled = '';
                        deleteDisabled = '';
                    }
                    statusMessage = '';
                } else {
                    console.warn(`Estado desconocido para la publicación ${publication.id}: ${publication.status}`);
                    viewDisabled = 'disabled';
                    editDisabled = 'disabled';
                    deleteDisabled = 'disabled';
                    statusMessage = '<p class="pending-message">Estado desconocido...</p>';
                }

                publicationCard.innerHTML = `
                    <img src="${imageSrc}" alt="${publication.title}" class="publication-image">
                    <h3>${publication.title}</h3>
                    <p><strong>Tipo:</strong> ${formattedType}</p>
                    <p><strong>Precio:</strong> ${formattedPrice}</p>
                    <p><strong>Disponibilidad:</strong> ${formattedAvailability}</p>
                    <p><strong>Dirección:</strong> ${address}</p>
                    <div class="publication-actions">
                        <button class="publication-action-btn view" data-id="${publication.id}" ${viewDisabled}>Conocer Publicación</button>
                        <button class="publication-action-btn edit" data-id="${publication.id}" ${editDisabled}>Editar Publicación</button>
                        <button class="publication-action-btn delete" data-id="${publication.id}" ${deleteDisabled}>Eliminar Publicación</button>
                    </div>
                    ${statusMessage}
                    ${rentalStatusMessage}
                `;

                publicationsList.appendChild(publicationCard);

                const viewBtn = publicationCard.querySelector('.view');
                const editBtn = publicationCard.querySelector('.edit');
                const deleteBtn = publicationCard.querySelector('.delete');

                if (!viewBtn || !editBtn || !deleteBtn) {
                    console.error(`No se encontraron los botones para la publicación ${publication.id}`);
                    return;
                }

                if (!viewDisabled) {
                    viewBtn.addEventListener('click', () => {
                        console.log(`Clic en "Conocer Publicación" para la publicación ${publication.id}`);
                        window.renderMyPublicationDetails(publication.id);
                    });
                }

                if (!editDisabled) {
                    editBtn.addEventListener('click', () => {
                        console.log(`Clic en "Editar Publicación" para la publicación ${publication.id}`);
                        window.renderEditPublicationForm(publication.id);
                    });
                }

                if (!deleteDisabled) {
                    deleteBtn.addEventListener('click', () => {
                        showConfirmationDialog(
                            '¿Estás seguro de que deseas eliminar esta publicación? Esta acción no se puede deshacer.',
                            async () => {
                                await deletePublication(publication.id);
                                setTimeout(async () => {
                                    await renderMyPublications();
                                }, 1500);
                            },
                            () => {
                                console.log('Eliminación cancelada');
                            }
                        );
                    });
                }
            });

            hideLoadingSpinner();
        } catch (error) {
            hideLoadingSpinner();
            console.error('Error obteniendo las publicaciones:', error);
            publicationsList.innerHTML = `
                <p class="no-publications error">Error al cargar tus publicaciones: ${error.message}</p>
            `;
        }
    }

    // Delete a publication
    async function deletePublication(publicationId) {
        showLoadingSpinner();
        try {
            const userEmail = localStorage.getItem('currentUserEmail') || '';
            if (!userEmail) {
                throw new Error('No se encontró el email del usuario en localStorage. Por favor, inicia sesión nuevamente.');
            }

            console.log(`Eliminando publicación ${publicationId} para el usuario ${userEmail}`);

            const response = await fetch(`/api/publications/landlord/${publicationId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': userEmail
                },
                body: JSON.stringify({
                    reason: 'Eliminación solicitada por el arrendador',
                    deletionDetails: 'El arrendador decidió eliminar la publicación.'
                })
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Respuesta al eliminar publicación:', data);

            hideLoadingSpinner();

            if (!data.success) {
                throw new Error(data.message || 'Error al eliminar la publicación');
            }

            showMessage('Publicación eliminada exitosamente.', false);
        } catch (error) {
            hideLoadingSpinner();
            console.error('Error eliminando la publicación:', error);
            showMessage('Error al eliminar la publicación: ' + error.message);
        }
    }

    // Navigation event listeners
    if (myPublicationsLink) {
        myPublicationsLink.addEventListener('click', (event) => {
            event.preventDefault();
            console.log('Clic en el enlace de "Mis Publicaciones"');
            renderMyPublications();
        });
    } else {
        console.warn('No se encontró el enlace de "Mis Publicaciones" (a[href="publicaciones"])');
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

//Nuevo bloque para poder conocer mis publicaciones (Arrendador)
document.addEventListener('DOMContentLoaded', function() {
    // DOM Variables
    const mainContent = document.getElementById('main-content');
    const originalDashboardContent = mainContent ? mainContent.innerHTML : '';
    let loadingOverlay = null;
    let loadingSpinner = null;

    // Función para mostrar mensajes (éxito o error)
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

    // Función para mostrar el diálogo de confirmación
    function showConfirmationDialog(message, onConfirm, onCancel) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background-color: rgba(0,0,0,0.5); z-index: 2999; opacity: 0;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(overlay);

        const dialogDiv = document.createElement('div');
        dialogDiv.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background-color: #fff; padding: 2rem; border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 3000; text-align: center;
            font-family: 'Roboto', sans-serif; color: #2b6b6b;
            opacity: 0; transition: opacity 0.3s ease, transform 0.3s ease;
        `;
        dialogDiv.innerHTML = `
            <h3 style="margin-bottom: 1rem;">¡Atención!</h3>
            <p>${message}</p>
            <div style="margin-top: 1rem; display: flex; gap: 1rem; justify-content: center;">
                <button id="confirm-btn" style="
                    background: linear-gradient(135deg, #dc2626, #f87171);
                    color: white; border: none; padding: 0.8rem 1.5rem;
                    border-radius: 8px; cursor: pointer; font-weight: 500;
                ">Confirmar</button>
                <button id="cancel-btn" style="
                    background: linear-gradient(135deg, #2b6b6b, #4c9f9f);
                    color: white; border: none; padding: 0.8rem 1.5rem;
                    border-radius: 8px; cursor: pointer; font-weight: 500;
                ">Cancelar</button>
            </div>
        `;
        document.body.appendChild(dialogDiv);

        setTimeout(() => {
            overlay.style.opacity = '1';
            dialogDiv.style.opacity = '1';
        }, 10);

        const confirmButton = dialogDiv.querySelector('#confirm-btn');
        const cancelButton = dialogDiv.querySelector('#cancel-btn');

        confirmButton.addEventListener('click', () => {
            overlay.style.opacity = '0';
            dialogDiv.style.opacity = '0';
            dialogDiv.style.transform = 'translate(-50%, -60%)';
            setTimeout(() => {
                document.body.removeChild(overlay);
                document.body.removeChild(dialogDiv);
                onConfirm();
            }, 300);
        });

        cancelButton.addEventListener('click', () => {
            overlay.style.opacity = '0';
            dialogDiv.style.opacity = '0';
            dialogDiv.style.transform = 'translate(-50%, -60%)';
            setTimeout(() => {
                document.body.removeChild(overlay);
                document.body.removeChild(dialogDiv);
                onCancel();
            }, 300);
        });
    }

    async function deletePublication(publicationId) {
        showLoadingSpinner();
        try {
            const userEmail = localStorage.getItem('currentUserEmail') || '';
            if (!userEmail) {
                throw new Error('No se encontró el email del usuario en localStorage. Por favor, inicia sesión nuevamente.');
            }

            console.log(`Eliminando publicación ${publicationId} para el usuario ${userEmail}`);

            const response = await fetch(`/api/publications/landlord/${publicationId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': userEmail
                },
                body: JSON.stringify({
                    reason: 'Eliminación solicitada por el arrendador',
                    deletionDetails: 'El arrendador decidió eliminar la publicación.'
                })
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Respuesta al eliminar publicación:', data);

            hideLoadingSpinner();

            if (!data.success) {
                throw new Error(data.message || 'Error al eliminar la publicación');
            }

            showMessage('Publicación eliminada exitosamente.', false);
        } catch (error) {
            hideLoadingSpinner();
            console.error('Error eliminando la publicación:', error);
            showMessage('Error al eliminar la publicación: ' + error.message);
        }
    }

    // Función para mostrar el loading spinner
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

    // Función para ocultar el loading spinner
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

    // Restaurar el dashboard
    async function restoreDashboard() {
        if (!mainContent) {
            console.error('No se encontró #main-content');
            return;
        }
        mainContent.innerHTML = originalDashboardContent;
        // Recargar estadísticas y notificaciones
        if (typeof fetchStats === 'function') {
            await fetchStats();
        }
        if (typeof window.fetchNotifications === 'function') {
            await window.fetchNotifications();
        }
    }

    // Función para mostrar la imagen ampliada
    function showImageModal(imageSrc, altText) {
        const overlay = document.createElement('div');
        overlay.className = 'image-modal-overlay';
        document.body.appendChild(overlay);

        const modalDiv = document.createElement('div');
        modalDiv.className = 'image-modal';
        modalDiv.innerHTML = `
            <button class="close-modal-btn">×</button>
            <img src="${imageSrc}" alt="${altText}">
        `;
        overlay.appendChild(modalDiv);

        setTimeout(() => {
            overlay.style.opacity = '1';
            modalDiv.style.opacity = '1';
        }, 10);

        const closeModal = () => {
            overlay.style.opacity = '0';
            modalDiv.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(overlay);
            }, 300);
        };

        modalDiv.querySelector('.close-modal-btn').addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal();
            }
        });
    }







    // Render "My Publications" with filter form (ACOMODAR)
    async function renderMyPublications() {
        if (!mainContent) {
            console.error('No se encontró #main-content');
            showMessage('Error: No se encontró el contenedor principal.');
            return;
        }

        mainContent.innerHTML = `
            <div class="my-publications-section">
                <h1>Mis Publicaciones</h1>
                <div class="filter-section">
                    <div class="filter-form">
                        <div class="filter-group">
                            <label for="filter-status">Estado:</label>
                            <select id="filter-status">
                                <option value="">Todos</option>
                                <option value="pending">Pendiente</option>
                                <option value="rejected">Rechazado</option>
                                <option value="available">Disponible</option>
                            </select>
                        </div>
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
                        <button id="filter-btn">Filtrar</button>
                        <button id="reset-btn">Limpiar</button>
                    </div>
                </div>
                <div class="publications-list" id="publications-list"></div>
            </div>
        `;

        const style = document.createElement('style');
        style.innerHTML = `
            .my-publications-section {
                max-width: 1200px;
                margin: 2rem auto;
                padding: 0 1rem;
            }
            .my-publications-section h1 {
                font-family: 'Roboto', sans-serif;
                color: #2b6b6b;
                font-size: 2rem;
                margin-bottom: 1rem;
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
                align-items: center;
                justify-content: center;
            }
            .filter-group {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
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
            }
            .filter-group select:focus,
            .filter-group input:focus {
                border-color: #2b6b6b;
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
            .publications-list {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 1.5rem;
                padding: 1rem 0;
            }
            .publication-card {
                background: #fff;
                border-radius: 12px;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                overflow: hidden;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                position: relative;
                border: 1px solid #e5e7eb;
                display: flex;
                flex-direction: column;
            }
            .publication-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
            }
            .publication-image {
                width: 100%;
                height: 180px;
                object-fit: cover;
            }
            .publication-content {
                flex: 1;
                padding: 0.75rem 0;
            }
            .publication-card h3 {
                font-family: 'Roboto', sans-serif;
                font-size: 1.25rem;
                font-weight: 600;
                color: #333;
                margin: 0.75rem 0;
                padding-left: 1rem;
                text-align: left;
                line-height: 1.3;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-overflow: ellipsis;
                max-height: 3.2em;
            }
            .publication-card p {
                font-family: 'Roboto', sans-serif;
                font-size: 0.9rem;
                color: #666;
                margin: 0.3rem 0;
                padding-left: 1rem;
            }
            .publication-actions {
                display: flex;
                justify-content: space-between;
                padding: 0.75rem 1rem;
                border-top: 1px solid #e5e7eb;
                background: #f9fafb;
                gap: 0.5rem;
                margin-top: auto;
            }
            .publication-action-btn {
                background: #e5e7eb;
                color: #374151;
                border: none;
                padding: 0.5rem 0.75rem;
                border-radius: 6px;
                cursor: pointer;
                font-family: 'Roboto', sans-serif;
                font-size: 0.85rem;
                font-weight: 500;
                flex: 1;
                text-align: center;
                transition: background 0.3s ease, color 0.3s ease;
            }
            .publication-action-btn:hover:not(:disabled) {
                background: #d1d5db;
            }
            .publication-action-btn:disabled {
                background: #e5e7eb;
                color: #9ca3af;
                cursor: not-allowed;
            }
            .pending-message {
                font-family: 'Roboto', sans-serif;
                font-size: 0.85rem;
                color: #dc2626;
                text-align: center;
                margin: 0.5rem 1rem;
                font-weight: 500;
                background: #fef2f2;
                padding: 0.5rem;
                border-radius: 6px;
            }
            .rental-status {
                font-family: 'Roboto', sans-serif;
                font-size: 0.9em;
                margin: 0.5rem 1rem 1rem 1rem;
                padding: 5px 10px;
                border-radius: 5px;
                text-align: center;
            }
            .rental-status.disponible {
                background-color: #e7f3e7;
                color: #2e7d32;
            }
            .rental-status.en-proceso {
                background-color: #fff3e0;
                color: #f57c00;
            }
            .rental-status.arrendado {
                background-color: #e3f2fd;
                color: #1976d2;
            }
            .rental-status.inactivo {
                background-color: #f5f5f5;
                color: #616161;
            }
            .rental-status.desconocido {
                background-color: #ffebee;
                color: #d32f2f;
            }
            .no-publications {
                text-align: center;
                padding: 2rem;
                font-family: 'Roboto', sans-serif;
                color: #555;
            }
            .no-publications span {
                font-size: 2rem;
                display: block;
                margin-bottom: 1rem;
            }
            .no-publications.error {
                color: #dc2626;
            }
            @media (max-width: 768px) {
                .publications-list {
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                }
                .filter-form {
                    flex-direction: column;
                    align-items: stretch;
                }
                .filter-form button {
                    margin-top: 0.5rem;
                }
            }
            @media (max-width: 480px) {
                .publications-list {
                    grid-template-columns: 1fr;
                }
                .publication-card h3 {
                    font-size: 1.1rem;
                }
                .publication-actions {
                    flex-direction: column;
                }
                .publication-action-btn {
                    margin-bottom: 0.5rem;
                }
                .publication-action-btn:last-child {
                    margin-bottom: 0;
                }
            }
        `;
        document.head.appendChild(style);

        const filterStatus = document.getElementById('filter-status');
        const filterTitle = document.getElementById('filter-title');
        const filterType = document.getElementById('filter-type');
        const filterBtn = document.getElementById('filter-btn');
        const resetBtn = document.getElementById('reset-btn');

        async function fetchFilteredPublications() {
            const status = filterStatus.value;
            const title = filterTitle.value.trim();
            const type = filterType.value;

            const params = new URLSearchParams();
            if (status) params.append('status', status);
            if (title) params.append('title', title);
            if (type) params.append('type', type);

            await fetchMyPublications(params.toString());
        }

        filterBtn.addEventListener('click', () => {
            fetchFilteredPublications();
        });

        filterTitle.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                fetchFilteredPublications();
            }
        });

        resetBtn.addEventListener('click', () => {
            filterStatus.value = '';
            filterTitle.value = '';
            filterType.value = '';
            fetchMyPublications();
        });

        await fetchMyPublications();
    }

    // Fetch and display user's publications (with optional query parameters) (ACOMODAR)
    async function fetchMyPublications(queryString = '') {
        const publicationsList = document.getElementById('publications-list');
        if (!publicationsList) {
            console.error('No se encontró #publications-list');
            showMessage('Error: No se encontró el contenedor de publicaciones.');
            return;
        }

        showLoadingSpinner();

        try {
            const userEmail = localStorage.getItem('currentUserEmail') || '';
            if (!userEmail) {
                throw new Error('No se encontró el email del usuario en localStorage. Por favor, inicia sesión nuevamente.');
            }

            console.log('Solicitando publicaciones para el usuario:', userEmail);

            const url = queryString ? `/api/publications/landlord/my-publications?${queryString}` : '/api/publications/landlord/my-publications';
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
            console.log('Datos recibidos del backend:', data);

            publicationsList.innerHTML = '';

            if (!data.success) {
                throw new Error(data.message || 'Error al obtener las publicaciones');
            }

            if (!data.publications || data.publications.length === 0) {
                publicationsList.innerHTML = `
                    <div class="no-publications">
                        <span>📋</span>
                        <p>No se encontraron publicaciones con los criterios seleccionados.</p>
                    </div>
                `;
                hideLoadingSpinner();
                return;
            }

            data.publications.forEach(publication => {
                if (!publication.id || !publication.title || !publication.price || !publication.availability || !publication.status || !publication.rental_status) {
                    console.warn('Publicación incompleta:', publication);
                    return;
                }

                const publicationCard = document.createElement('div');
                publicationCard.className = 'publication-card';

                const formattedPrice = Number(publication.price).toLocaleString('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                });
                const imageSrc = publication.image_url || '/img/house_default.png';
                const type = publication.type || 'Desconocido';

                let formattedType = '';
                switch (type.toLowerCase()) {
                    case 'apartamento':
                        formattedType = 'Apartamento';
                        break;
                    case 'casa':
                        formattedType = 'Casa';
                        break;
                    case 'habitacion':
                        formattedType = 'Habitación';
                        break;
                    case 'parqueo':
                        formattedType = 'Parqueadero';
                        break;
                    case 'bodega':
                        formattedType = 'Bodega';
                        break;
                    default:
                        formattedType = type.charAt(0).toUpperCase() + type.slice(1);
                }

                let address = '';
                if (publication.barrio || publication.calle_carrera || publication.numero) {
                    const addressParts = [];
                    if (publication.barrio) addressParts.push(publication.barrio);
                    if (publication.calle_carrera) addressParts.push(publication.calle_carrera);
                    if (publication.numero) addressParts.push(`#${publication.numero}`);
                    
                    if (['apartamento', 'habitacion'].includes(type.toLowerCase())) {
                        if (publication.conjunto_torre) addressParts.push(`${publication.conjunto_torre}`);
                        if (publication.apartamento) addressParts.push(`Apto: ${publication.apartamento}`);
                        if (publication.piso) addressParts.push(`Piso: ${publication.piso}`);
                    }
                    
                    address = addressParts.join(', ');
                } else {
                    address = 'Dirección no disponible';
                }

                let formattedAvailability = '';
                switch (publication.availability) {
                    case 'inmediata':
                        formattedAvailability = 'Inmediata';
                        break;
                    case 'futura_1mes':
                        formattedAvailability = 'Futura (1 mes)';
                        break;
                    case 'futura_3meses':
                        formattedAvailability = 'Futura (3 meses)';
                        break;
                    default:
                        formattedAvailability = publication.availability;
                }

                let rentalStatusMessage = '';
                // Mostrar el mensaje de rental_status SOLO si status es 'available'
                if (publication.status === 'available') {
                    switch (publication.rental_status) {
                        case 'disponible':
                            rentalStatusMessage = '<p class="rental-status disponible">Disponible para arriendo</p>';
                            break;
                        case 'en_proceso_arrendamiento':
                            rentalStatusMessage = '<p class="rental-status en-proceso">En Proceso de Arrendamiento</p>';
                            break;
                        case 'arrendado':
                            rentalStatusMessage = '<p class="rental-status arrendado">Arrendado</p>';
                            break;
                        case 'inactivo':
                            rentalStatusMessage = '<p class="rental-status inactivo">Inactivo</p>';
                            break;
                        default:
                            rentalStatusMessage = '<p class="rental-status desconocido">Estado de renta desconocido...</p>';
                            console.warn(`rental_status desconocido para la publicación ${publication.id}: ${publication.rental_status}`);
                    }
                }

                let viewDisabled = '';
                let editDisabled = '';
                let deleteDisabled = '';
                let statusMessage = '';

                if (publication.status === 'pending') {
                    viewDisabled = 'disabled';
                    editDisabled = 'disabled';
                    deleteDisabled = 'disabled';
                    statusMessage = '<p class="pending-message">En espera de Revisión...</p>';
                } else if (publication.status === 'rejected') {
                    viewDisabled = 'disabled';
                    editDisabled = '';
                    deleteDisabled = '';
                    statusMessage = '<p class="pending-message">En espera de modificación...</p>';
                } else if (publication.status === 'available') {
                    viewDisabled = '';
                    if (publication.rental_status === 'en_proceso_arrendamiento' || publication.rental_status === 'arrendado') {
                        editDisabled = 'disabled';
                        deleteDisabled = 'disabled';
                    } else {
                        editDisabled = '';
                        deleteDisabled = '';
                    }
                    statusMessage = '';
                } else {
                    console.warn(`Estado desconocido para la publicación ${publication.id}: ${publication.status}`);
                    viewDisabled = 'disabled';
                    editDisabled = 'disabled';
                    deleteDisabled = 'disabled';
                    statusMessage = '<p class="pending-message">Estado desconocido...</p>';
                }

                publicationCard.innerHTML = `
                    <img src="${imageSrc}" alt="${publication.title}" class="publication-image">
                    <h3>${publication.title}</h3>
                    <p><strong>Tipo:</strong> ${formattedType}</p>
                    <p><strong>Precio:</strong> ${formattedPrice}</p>
                    <p><strong>Disponibilidad:</strong> ${formattedAvailability}</p>
                    <p><strong>Dirección:</strong> ${address}</p>
                    <div class="publication-actions">
                        <button class="publication-action-btn view" data-id="${publication.id}" ${viewDisabled}>Conocer Publicación</button>
                        <button class="publication-action-btn edit" data-id="${publication.id}" ${editDisabled}>Editar Publicación</button>
                        <button class="publication-action-btn delete" data-id="${publication.id}" ${deleteDisabled}>Eliminar Publicación</button>
                    </div>
                    ${statusMessage}
                    ${rentalStatusMessage}
                `;

                publicationsList.appendChild(publicationCard);

                const viewBtn = publicationCard.querySelector('.view');
                const editBtn = publicationCard.querySelector('.edit');
                const deleteBtn = publicationCard.querySelector('.delete');

                if (!viewBtn || !editBtn || !deleteBtn) {
                    console.error(`No se encontraron los botones para la publicación ${publication.id}`);
                    return;
                }

                if (!viewDisabled) {
                    viewBtn.addEventListener('click', () => {
                        console.log(`Clic en "Conocer Publicación" para la publicación ${publication.id}`);
                        window.renderMyPublicationDetails(publication.id);
                    });
                }

                if (!editDisabled) {
                    editBtn.addEventListener('click', () => {
                        console.log(`Clic en "Editar Publicación" para la publicación ${publication.id}`);
                        window.renderEditPublicationForm(publication.id);
                    });
                }

                if (!deleteDisabled) {
                    deleteBtn.addEventListener('click', () => {
                        showConfirmationDialog(
                            '¿Estás seguro de que deseas eliminar esta publicación? Esta acción no se puede deshacer.',
                            async () => {
                                await deletePublication(publication.id);
                                setTimeout(async () => {
                                    await renderMyPublications();
                                }, 1500);
                            },
                            () => {
                                console.log('Eliminación cancelada');
                            }
                        );
                    });
                }
            });

            hideLoadingSpinner();
        } catch (error) {
            hideLoadingSpinner();
            console.error('Error obteniendo las publicaciones:', error);
            publicationsList.innerHTML = `
                <p class="no-publications error">Error al cargar tus publicaciones: ${error.message}</p>
            `;
        }
    }


    // Función para mostrar los detalles de una publicación (solo visualización para el arrendador)  (ACOMODAR)
    async function renderMyPublicationDetails(publicationId) {
        if (!mainContent) {
            console.error('No se encontró #main-content');
            showMessage('Error: No se encontró el contenedor principal.');
            return;
        }
    
        // Limpiar el contenido previo para iniciar desde el principio
        mainContent.innerHTML = '';
        showLoadingSpinner();
    
        try {
            const userEmail = localStorage.getItem('currentUserEmail') || '';
            if (!userEmail) {
                throw new Error('No se encontró el email del usuario en localStorage. Por favor, inicia sesión nuevamente.');
            }
    
            const response = await fetch(`/api/publications/landlord/${publicationId}`, {
                method: 'GET',
                headers: {
                    'x-user-email': userEmail
                }
            });
    
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
            }
    
            const data = await response.json();
            console.log('Datos de la publicación:', data);
    
            if (!data.success) {
                throw new Error(data.message || 'Error al obtener la publicación');
            }
    
            const publication = data.publication;
            const images = data.images || [];
    
            const coverImage = images.length > 0 ? images[0] : '/img/house_default.png';
            const galleryImages = images.length > 0 ? images : [];
    
            // Formatear el precio sin decimales si son cero
            const formattedPrice = Number(publication.price).toLocaleString('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
            const formattedAvailability = publication.availability.replace(/_/g, ' ').charAt(0).toUpperCase() + publication.availability.replace(/_/g, ' ').slice(1);
            const formattedType = publication.space_type.charAt(0).toUpperCase() + publication.space_type.slice(1);
    
            // Construir dirección dinámicamente según el tipo de espacio
            let fullAddress = '';
            const address = publication.address || {};
            if (address.barrio || address.calle_carrera || address.numero) {
                const addressParts = [];
                if (address.barrio) addressParts.push(address.barrio);
                if (address.calle_carrera) addressParts.push(address.calle_carrera);
                if (address.numero) addressParts.push(`#${address.numero}`);
    
                if (['apartamento', 'habitacion'].includes(publication.space_type)) {
                    if (address.conjunto_torre) addressParts.push(`Conjunto: ${address.conjunto_torre}`);
                    if (address.apartamento) addressParts.push(`Apto: ${address.apartamento}`);
                    if (address.piso) addressParts.push(`Piso: ${address.piso}`);
                }
    
                fullAddress = addressParts.join(', ');
            } else {
                fullAddress = 'Dirección no disponible';
            }
    
            // Usar rental_status en lugar de status
            const rentalStatus = publication.rental_status.charAt(0).toUpperCase() + publication.rental_status.slice(1);
    
            mainContent.innerHTML = `
                <div class="publication-details">
                    <button class="back-btn">Regresar a Mis Publicaciones</button>
                    <h1>${publication.title}</h1>
                    <div class="publication-images">
                        <img src="${coverImage}" alt="Portada de ${publication.title}" class="cover-image">
                    </div>
                    <div class="publication-info">
                        <p><strong>Descripción:</strong> ${publication.description}</p>
                        <p><strong>Precio:</strong> ${formattedPrice}</p>
                        <p><strong>Tipo:</strong> ${formattedType}</p>
                        <p><strong>Disponibilidad:</strong> ${formattedAvailability}</p>
                        <p><strong>Condiciones:</strong> ${publication.conditions || 'No especificado'}</p>
                        <p><strong>Dirección:</strong> ${fullAddress}</p>
                        <p><strong>Fecha de Creación:</strong> ${new Date(publication.created_at).toLocaleDateString()}</p>
                        <p><strong>Estado de arriendo:</strong> ${rentalStatus}</p>
                    </div>
                    <div class="image-gallery">
                        <h3>Galería de la publicación</h3>
                        <div class="gallery-container">
                            ${galleryImages.map(img => `
                                <img src="${img}" alt="Imagen de ${publication.title}" class="gallery-image" data-full="${img}">
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
    
            // Añadir evento al botón "Regresar"
            mainContent.querySelector('.back-btn').addEventListener('click', () => {
                renderMyPublications();
            });
    
            // Añadir eventos a las imágenes de la galería
            const galleryImagesElements = mainContent.querySelectorAll('.gallery-image');
            galleryImagesElements.forEach(img => {
                img.addEventListener('click', () => {
                    const fullImageSrc = img.getAttribute('data-full');
                    showImageModal(fullImageSrc, img.alt);
                });
            });
    
            hideLoadingSpinner();
        } catch (error) {
            hideLoadingSpinner();
            console.error('Error al cargar los detalles de la publicación:', error);
            mainContent.innerHTML = `
                <div class="no-publications error">
                    <span>❌</span>
                    <p>Error al cargar la publicación: ${error.message}</p>
                    <button class="action-btn" onclick="window.renderMyPublications()">Volver a Mis Publicaciones</button>
                </div>
            `;
        }
    }





    // Exponer renderMyPublicationDetails globalmente
    window.renderMyPublicationDetails = renderMyPublicationDetails;

    // Añadir estilos para la vista de detalles de la publicación
    const publicationStyles = document.createElement('style');
    publicationStyles.innerHTML = `
        .publication-details {
            border-radius: 12px;
            padding: 1.75rem;
            max-width: 1100px;
            margin: 0 auto;
            font-family: 'Roboto', sans-serif;
            color: #1f2937;
            position: relative;
        }

        .back-btn {
            background-color: white;
            color: #1e3a8a;
            border: 1px solid #e5e7eb;
            padding: 0.6rem 1.2rem;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s ease;
            margin-bottom: 1.25rem;
            display: inline-flex;
            align-items: center;
            font-size: 0.9rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .back-btn:hover {
            background-color: #f9fafb;
            color: #3b82f6;
            border-color: #3b82f6;
        }

        .back-btn::before {
            margin-right: 0.5rem;
            font-size: 1rem;
        }

        .publication-details h1 {
            font-size: 1.8rem;
            margin-bottom: 1.5rem;
            color: #1e3a8a;
            font-weight: 600;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 0.75rem;
            letter-spacing: 0.3px;
        }

        .publication-images {
            margin-bottom: 1.5rem;
        }

        .cover-image {
            width: 100%;
            height: 400px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            object-fit: cover;
            transition: transform 0.3s ease;
            border: 1px solid #f0f0f0;
            display: block;
        }

        .cover-image:hover {
            transform: scale(1.01);
        }

        .publication-info {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
            background-color: #f8fafc;
            border-radius: 10px;
            padding: 1.5rem;
            border: 1px solid #e5eeff;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
        }

        .publication-info p {
            margin-bottom: 1rem;
        }

        .publication-info strong {
            display: block;
            color: #475569;
            font-weight: 500;
            font-size: 0.85rem;
            letter-spacing: 0.5px;
            margin-bottom: 0.4rem;
        }

        .publication-info p {
            color: #1f2937;
            font-weight: 400;
            line-height: 1.5;
            margin: 0;
            font-size: 1.05rem;
        }

        .publication-info p:nth-child(1) {
            grid-column: 1 / span 2;
            padding: 1rem;
            background-color: white;
            border-radius: 8px;
            border: 1px solid #f0f0f0;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .image-gallery {
            margin-top: 2rem;
        }

        .image-gallery h3 {
            font-size: 1.2rem;
            margin-bottom: 1rem;
            color: #1e3a8a;
            font-weight: 600;
            display: flex;
            align-items: center;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid #e5e7eb;
        }

        .image-gallery h3::before {
            content: "•";
            margin-right: 0.5rem;
            color: #3b82f6;
            font-size: 1.5rem;
            line-height: 0;
        }

        .gallery-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 1rem;
        }

        .gallery-image {
            width: 100%;
            height: 110px;
            object-fit: cover;
            border-radius: 6px;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            border: 1px solid #f0f0f0;
            cursor: pointer;
        }

        .gallery-image:hover {
            transform: translateY(-4px);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
        }

        .image-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.9);
            z-index: 3000;
            opacity: 0;
            transition: opacity 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: auto;
            -webkit-backdrop-filter: blur(3px);
            backdrop-filter: blur(3px);
        }

        .image-modal {
            position: relative;
            max-width: 90vw;
            max-height: 90vh;
            opacity: 0;
            transition: opacity 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .image-modal img {
            max-width: 100%;
            max-height: 80vh;
            border-radius: 8px;
            object-fit: contain;
            border: 2px solid #fff;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .close-modal-btn {
            position: absolute;
            top: 15px;
            right: 15px;
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            font-size: 2.5rem;
            font-weight: 300;
            cursor: pointer;
            padding: 0.3rem 0.6rem;
            border-radius: 50%;
            transition: background 0.2s ease, transform 0.2s ease;
            line-height: 1;
        }

        .close-modal-btn:hover {
            background: rgba(255, 255, 255, 0.4);
            transform: scale(1.1);
        }

        .no-publications.error {
            text-align: center;
            padding: 2rem;
            font-family: 'Roboto', sans-serif;
            color: #dc2626;
        }

        .no-publications.error span {
            font-size: 2rem;
            display: block;
            margin-bottom: 1rem;
        }

        .action-btn {
            padding: 0.8rem 1.8rem;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 1rem;
            background: linear-gradient(135deg, #2b6b6b, #4c9f9f);
            color: white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .action-btn:hover {
            background: linear-gradient(135deg, #4c9f9f, #2b6b6b);
        }

        /* Media queries para responsividad */
        @media (max-width: 1024px) {
            .publication-info {
                grid-template-columns: 1fr;
                gap: 1rem;
                padding: 1.25rem;
            }

            .publication-info p:nth-child(1) {
                grid-column: 1;
                padding: 0.75rem;
            }
        }

        @media (max-width: 768px) {
            .publication-info {
                padding: 1rem;
            }

            .publication-info p {
                font-size: 1rem;
            }

            .image-modal {
                max-width: 95vw;
                max-height: 85vh;
            }

            .image-modal img {
                max-height: 75vh;
            }
        }

        @media (max-width: 480px) {
            .publication-info {
                padding: 0.75rem;
                border-radius: 8px;
            }

            .publication-info p {
                font-size: 0.9rem;
                line-height: 1.4;
            }

            .image-modal {
                max-width: 100vw;
                max-height: 95vh;
            }

            .image-modal img {
                max-height: 65vh;
                border: 1px solid #fff;
            }

            .close-modal-btn {
                top: 8px;
                right: 8px;
                font-size: 1.75rem;
                padding: 0.2rem 0.4rem;
            }
        }
    `;
    document.head.appendChild(publicationStyles);
});

// Nuevo bloque para poder editar mis publicaciones
document.addEventListener('DOMContentLoaded', function() {
    // Variables del DOM
    const mainContent = document.getElementById('main-content');
    const menuLinks = document.querySelectorAll('.navbar a');
    const originalDashboardContent = mainContent ? mainContent.innerHTML : '';
    let loadingOverlay = null;
    let loadingSpinner = null;
    let hasUnsavedChanges = false;
    let originalPublicationData = null;
    let isSubmitting = false; // Prevent multiple submissions

    // Add CSS to disable navbar links
    const style = document.createElement('style');
    style.innerHTML = `
        .navbar a.disabled {
            pointer-events: none;
            opacity: 0.5;
            cursor: not-allowed;
        }
    `;
    document.head.appendChild(style);

    // Function to toggle navbar links
    function toggleNavbarLinks(disable) {
        menuLinks.forEach(link => {
            if (disable) {
                link.classList.add('disabled');
            } else {
                link.classList.remove('disabled');
            }
        });
    }

    // Función para mostrar el mensaje de error o éxito
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

    // Función para mostrar el diálogo de confirmación
    function showConfirmationDialog(message, onConfirm, onCancel) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background-color: rgba(0,0,0,0.5); z-index: 2999; opacity: 0;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(overlay);

        const dialogDiv = document.createElement('div');
        dialogDiv.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background-color: #fff; padding: 2rem; border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 3000; text-align: center;
            font-family: 'Roboto', sans-serif; color: #2b6b6b;
            opacity: 0; transition: opacity 0.3s ease, transform 0.3s ease;
        `;
        dialogDiv.innerHTML = `
            <h3 style="margin-bottom: 1rem;">¡Atención!</h3>
            <p>${message}</p>
            <div style="margin-top: 1rem; display: flex; gap: 1rem; justify-content: center;">
                <button id="confirm-btn" style="
                    background: linear-gradient(135deg, #dc2626, #f87171);
                    color: white; border: none; padding: 0.8rem 1.5rem;
                    border-radius: 8px; cursor: pointer; font-weight: 500;
                ">Confirmar</button>
                <button id="cancel-btn" style="
                    background: linear-gradient(135deg, #2b6b6b, #4c9f9f);
                    color: white; border: none; padding: 0.8rem 1.5rem;
                    border-radius: 8px; cursor: pointer; font-weight: 500;
                ">Cancelar</button>
            </div>
        `;
        document.body.appendChild(dialogDiv);

        setTimeout(() => {
            overlay.style.opacity = '1';
            dialogDiv.style.opacity = '1';
        }, 10);

        const confirmButton = dialogDiv.querySelector('#confirm-btn');
        const cancelButton = dialogDiv.querySelector('#cancel-btn');

        confirmButton.addEventListener('click', () => {
            overlay.style.opacity = '0';
            dialogDiv.style.opacity = '0';
            dialogDiv.style.transform = 'translate(-50%, -60%)';
            setTimeout(() => {
                document.body.removeChild(overlay);
                document.body.removeChild(dialogDiv);
                onConfirm();
            }, 300);
        });

        cancelButton.addEventListener('click', () => {
            overlay.style.opacity = '0';
            dialogDiv.style.opacity = '0';
            dialogDiv.style.transform = 'translate(-50%, -60%)';
            setTimeout(() => {
                document.body.removeChild(overlay);
                document.body.removeChild(dialogDiv);
                onCancel();
            }, 300);
        });
    }

    // Función para mostrar el loading spinner
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
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        document.body.appendChild(loadingSpinner);

        setTimeout(() => {
            loadingOverlay.style.opacity = '1';
            loadingSpinner.style.opacity = '1';
        }, 10);
    }

    // Función para ocultar el loading spinner
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

    // Función para eliminar una publicación
    async function deletePublication(publicationId) {
        showLoadingSpinner();
        try {
            const userEmail = localStorage.getItem('currentUserEmail') || '';
            if (!userEmail) {
                throw new Error('No se encontró el email del usuario en localStorage. Por favor, inicia sesión nuevamente.');
            }

            console.log(`Eliminando publicación ${publicationId} para el usuario ${userEmail}`);

            const response = await fetch(`/api/publications/landlord/${publicationId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': userEmail
                },
                body: JSON.stringify({
                    reason: 'Eliminación solicitada por el arrendador',
                    deletionDetails: 'El arrendador decidió eliminar la publicación.'
                })
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Respuesta al eliminar publicación:', data);

            hideLoadingSpinner();

            if (!data.success) {
                throw new Error(data.message || 'Error al eliminar la publicación');
            }

            showMessage('Publicación eliminada exitosamente.', false);
        } catch (error) {
            hideLoadingSpinner();
            console.error('Error eliminando la publicación:', error);
            showMessage('Error al eliminar la publicación: ' + error.message);
        }
    }

    // Función para renderizar el formulario de edición de publicaciones
    async function renderEditPublicationForm(publicationId) {
        if (!mainContent) {
            console.error('No se encontró #main-content');
            showMessage('Error: No se encontró el contenedor principal.');
            return;
        }

        showLoadingSpinner();

        try {
            const userEmail = localStorage.getItem('currentUserEmail') || '';
            if (!userEmail) {
                throw new Error('No se encontró el email del usuario en localStorage. Por favor, inicia sesión nuevamente.');
            }

            // Obtener los datos actuales de la publicación
            const response = await fetch(`/api/publications/landlord/${publicationId}`, {
                method: 'GET',
                headers: {
                    'x-user-email': userEmail
                }
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.message || 'Error al obtener la publicación');
            }

            const publication = data.publication;
            const images = data.images || [];
            const address = publication.address || {};

            // Almacenar los datos originales para comparar cambios
            originalPublicationData = {
                type: publication.space_type,
                title: publication.title,
                description: publication.description,
                price: publication.price,
                conditions: publication.conditions || '',
                availability: publication.availability || 'inmediata',
                images: images,
                address: address
            };

            // Cargar barrios y conjuntos desde JSON
            let barrios = [];
            let conjuntos = [];
            await Promise.all([
                fetch('/data/cali_neighborhoods.json').then(response => {
                    if (!response.ok) throw new Error('Error al cargar los barrios');
                    return response.json();
                }).then(data => barrios = data.neighborhoods.map(n => n.name)),
                fetch('/data/cali_conjuntos.json').then(response => {
                    if (!response.ok) throw new Error('Error al cargar los conjuntos');
                    return response.json();
                }).then(data => conjuntos = data.conjuntos.map(c => c.name))
            ]).catch(error => {
                console.error('Error cargando datos:', error);
                showMessage('Error al cargar los datos. Por favor, intenta nuevamente.');
                return;
            });

            mainContent.innerHTML = `
                <div class="edit-post-section">
                    <h1>Editar Publicación</h1>
                    <div class="post-form-container">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="post-type">Tipo de Espacio</label>
                                <input type="text" id="post-type" value="${publication.space_type.charAt(0).toUpperCase() + publication.space_type.slice(1)}" readonly>
                                <p class="error-message" id="type-error"></p>
                            </div>
                            <div class="form-group">
                                <label for="post-title">Título de la Publicación</label>
                                <input type="text" id="post-title" value="${publication.title}" required>
                                <p class="error-message" id="title-error"></p>
                            </div>
                        </div>
                        <div id="address-fields" class="address-fields"></div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="post-price">Precio Mensual (COL)</label>
                                <input type="number" id="post-price" value="${publication.price}" min="1" step="1" required>
                                <p class="error-message" id="price-error"></p>
                            </div>
                            <div class="form-group">
                                <label for="post-availability">Disponibilidad</label>
                                <select id="post-availability" required>
                                    <option value="" disabled>Selecciona la disponibilidad</option>
                                    <option value="inmediata" ${publication.availability === 'inmediata' ? 'selected' : ''}>Entrega Inmediata</option>
                                    <option value="futura_1mes" ${publication.availability === 'futura_1mes' ? 'selected' : ''}>Entrega Futura (1 mes)</option>
                                    <option value="futura_3meses" ${publication.availability === 'futura_3meses' ? 'selected' : ''}>Entrega Futura (3 meses)</option>
                                </select>
                                <p class="error-message" id="availability-error"></p>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="post-description">Descripción del Espacio</label>
                            <textarea id="post-description" required>${publication.description}</textarea>
                            <p class="error-message" id="description-error"></p>
                        </div>
                        <div class="form-group">
                            <label for="post-conditions">Condiciones Adicionales</label>
                            <textarea id="post-conditions">${publication.conditions || ''}</textarea>
                            <p class="error-message" id="conditions-error"></p>
                        </div>
                        <div class="form-group">
                            <label for="post-images">Imágenes Asociadas (máximo 10, PNG/JPG)</label>
                            <input type="file" id="post-images" multiple accept="image/png,image/jpeg,image/jpg">
                            <div id="image-preview" class="image-preview" style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;">
                                ${images.map(img => `
                                    <div class="image-preview-item" style="position: relative;">
                                        <img src="${img}" alt="Imagen de la publicación" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; border: 1px solid #ccc;">
                                        <button type="button" class="remove-image-btn" data-url="${img}" style="
                                            position: absolute; top: 5px; right: 5px; background: #dc2626; color: white;
                                            border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer;
                                            display: flex; align-items: center; justify-content: center;
                                        ">×</button>
                                    </div>
                                `).join('')}
                            </div>
                            <p class="error-message" id="images-error"></p>
                        </div>
                        <div class="form-actions">
                            <button type="button" id="back-btn" class="action-btn secondary">Volver a Mis Publicaciones</button>
                            <button type="button" id="submit-post-btn" class="action-btn">Guardar Cambios</button>
                        </div>
                    </div>
                `;

            // Agregar CSS inline para estilizar el formulario
            const style = document.createElement('style');
            style.innerHTML = `
                .edit-post-section {
                    padding: 2rem;
                    max-width: 800px;
                    margin: 0 auto;
                }
                .edit-post-section h1 {
                    color: #2b6b6b;
                    text-align: center;
                    margin-bottom: 2rem;
                }
                .form-row {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }
                .form-group {
                    flex: 1;
                    min-width: 200px;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    color: #2b6b6b;
                    font-weight: 500;
                }
                .form-group input,
                .form-group textarea,
                .form-group select {
                    width: 100%;
                    padding: 0.8rem;
                    border: 1px solid #ccc;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-family: 'Roboto', sans-serif;
                }
                .form-group textarea {
                    height: 120px;
                    resize: vertical;
                }
                .form-group input[type="file"] {
                    padding: 0.3rem;
                }
                .image-preview img {
                    width: 100px;
                    height: 100px;
                    object-fit: cover;
                    border-radius: 8px;
                    border: 1px solid #ccc;
                }
                .remove-image-btn {
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    background: #dc2626;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .remove-image-btn:hover {
                    background: #f87171;
                }
                .error-message {
                    color: #dc2626;
                    font-size: 0.9rem;
                    margin-top: 0.3rem;
                    min-height: 1.2rem;
                }
                .form-actions {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                    margin-top: 2rem;
                }
                .action-btn {
                    background: linear-gradient(135deg, #2b6b6b, #4c9f9f);
                    color: white;
                    border: none;
                    padding: 0.8rem 1.5rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: transform 0.1s ease;
                }
                .action-btn:hover {
                    transform: scale(1.05);
                }
                .action-btn.secondary {
                    background: linear-gradient(135deg, #6b7280, #9ca3af);
                }
                @media (max-width: 768px) {
                    .form-row {
                        flex-direction: column;
                    }
                    .form-group {
                        min-width: 100%;
                    }
                }
            `;
            document.head.appendChild(style);

            // Renderizar campos de dirección dinámicos
            function renderAddressFields(type) {
                const addressFields = document.getElementById('address-fields');
                addressFields.innerHTML = '';

                let html = `
                    <div class="form-row">
                        <div class="form-group">
                            <label for="post-barrio">Barrio</label>
                            <input type="text" id="post-barrio" value="${address.barrio || ''}" readonly>
                            <p class="error-message" id="post-barrio-error"></p>
                        </div>
                        <div class="form-group">
                            <label for="post-calle-carrera">Calle o Carrera</label>
                            <input type="text" id="post-calle-carrera" value="${address.calle_carrera || ''}" readonly>
                            <p class="error-message" id="post-calle-carrera-error"></p>
                        </div>
                        <div class="form-group">
                            <label for="post-numero">Número</label>
                            <input type="text" id="post-numero" value="${address.numero || ''}" readonly>
                            <p class="error-message" id="post-numero-error"></p>
                        </div>
                `;

                if (type === 'habitacion') {
                    const isInBuilding = address.conjunto_torre || address.piso;
                    html += `
                        <div class="form-group">
                            <label for="post-en-edificio">
                                <input type="checkbox" id="post-en-edificio" ${isInBuilding ? 'checked' : ''} disabled> ¿Está en un edificio?
                            </label>
                            <p class="error-message" id="post-en-edificio-error"></p>
                        </div>
                    `;
                }

                html += `</div>`; // Cerrar el form-row inicial

                if (type === 'apartamento') {
                    html += `
                        <div class="form-row">
                            <div class="form-group">
                                <label for="post-conjunto-torre">Conjunto o Torre</label>
                                <input type="text" id="post-conjunto-torre" value="${address.conjunto_torre || ''}" readonly>
                                <p class="error-message" id="post-conjunto-torre-error"></p>
                            </div>
                            <div class="form-group">
                                <label for="post-apartamento">Apartamento</label>
                                <input type="text" id="post-apartamento" value="${address.apartamento || ''}" readonly>
                                <p class="error-message" id="post-apartamento-error"></p>
                            </div>
                            <div class="form-group">
                                <label for="post-piso">Piso</label>
                                <input type="number" id="post-piso" value="${address.piso || ''}" readonly>
                                <p class="error-message" id="post-piso-error"></p>
                            </div>
                        </div>
                    `;
                } else if (type === 'casa') {
                    // No se agregan campos adicionales para casas
                } else if (type === 'habitacion') {
                    // Mostrar los campos solo si hay datos en conjunto_torre o piso
                    html += `
                        <div id="habitacion-edificio-fields" style="display: ${address.conjunto_torre || address.piso ? 'block' : 'none'};">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="post-conjunto-torre">Conjunto o Torre</label>
                                    <input type="text" id="post-conjunto-torre" value="${address.conjunto_torre || ''}" placeholder="Escribe para buscar..." disabled>
                                    <p class="error-message" id="post-conjunto-torre-error"></p>
                                </div>
                                <div class="form-group">
                                    <label for="post-piso">Piso</label>
                                    <input type="number" id="post-piso" value="${address.piso || ''}" placeholder="Ej. 3" min="1" step="1" disabled>
                                    <p class="error-message" id="post-piso-error"></p>
                                </div>
                            </div>
                        </div>
                    `;
                } else if (type === 'parqueo' || type === 'bodega') {
                    html += `
                        <div class="form-row">
                            <div class="form-group">
                                <label for="post-conjunto-edificio">Conjunto o Edificio (opcional)</label>
                                <input type="text" id="post-conjunto-edificio" value="${address.conjunto_torre || ''}" placeholder="Escribe para buscar..." disabled>
                                <p class="error-message" id="post-conjunto-edificio-error"></p>
                            </div>
                        </div>
                    `;
                }

                addressFields.innerHTML = html;

                if (publication.space_type === 'habitacion') {
                    const enEdificioCheckbox = document.getElementById('post-en-edificio');
                    const edificioFields = document.getElementById('habitacion-edificio-fields');
                    // No se añade el evento de cambio ya que el checkbox está deshabilitado
                }
            }

            // Variables del formulario
            const typeInput = document.getElementById('post-type');
            const titleInput = document.getElementById('post-title');
            const descriptionInput = document.getElementById('post-description');
            const priceInput = document.getElementById('post-price');
            const availabilityInput = document.getElementById('post-availability');
            const conditionsInput = document.getElementById('post-conditions');
            const imagesInput = document.getElementById('post-images');
            const imagePreview = document.getElementById('image-preview');
            const backBtn = document.getElementById('back-btn');
            const submitBtn = document.getElementById('submit-post-btn');

            // Lista de imágenes actuales y nuevas
            let currentImages = [...images];
            let newImages = [];
            let removedImages = [];

            // Evitar entrada de cualquier carácter no numérico en el precio
            priceInput.addEventListener('input', function() {
                if (!/^\d*$/.test(this.value)) {
                    this.value = this.value.replace(/[^0-9]/g, '');
                }
                hasUnsavedChanges = true;
                toggleNavbarLinks(true);
            });

            // Validaciones y eventos en tiempo real
            titleInput.addEventListener('input', () => {
                hasUnsavedChanges = true;
                toggleNavbarLinks(true);
                validateTitle();
            });
            descriptionInput.addEventListener('input', () => {
                hasUnsavedChanges = true;
                toggleNavbarLinks(true);
                validateDescription();
            });
            priceInput.addEventListener('input', () => {
                hasUnsavedChanges = true;
                toggleNavbarLinks(true);
                validatePrice();
            });
            availabilityInput.addEventListener('change', () => {
                hasUnsavedChanges = true;
                toggleNavbarLinks(true);
                validateAvailability();
            });
            conditionsInput.addEventListener('input', () => {
                hasUnsavedChanges = true;
                toggleNavbarLinks(true);
                validateConditions();
            });
            imagesInput.addEventListener('change', (event) => {
                hasUnsavedChanges = true;
                toggleNavbarLinks(true);
                handleImageUpload(event);
            });

            // Manejar eliminación de imágenes existentes
            imagePreview.addEventListener('click', (event) => {
                if (event.target.classList.contains('remove-image-btn')) {
                    const url = event.target.getAttribute('data-url');
                    currentImages = currentImages.filter(img => img !== url);
                    removedImages.push(url);
                    event.target.parentElement.remove();
                    hasUnsavedChanges = true;
                    toggleNavbarLinks(true);
                }
            });

            // Botón "Volver"
            backBtn.addEventListener('click', () => {
                if (hasUnsavedChanges) {
                    showUnsavedChangesWarning(() => {
                        hasUnsavedChanges = false;
                        toggleNavbarLinks(false);
                        renderMyPublications();
                    });
                } else {
                    renderMyPublications();
                    toggleNavbarLinks(false);
                }
            });

            // Botón "Guardar Cambios"
            submitBtn.addEventListener('click', () => {
                if (!isSubmitting) {
                    submitPost(publicationId, currentImages, newImages, removedImages);
                }
            });

            // Renderizar campos de dirección iniciales
            renderAddressFields(publication.space_type);

            // Validaciones
            function validateType() {
                const typeError = document.getElementById('type-error');
                typeError.textContent = ''; // No se valida, solo se muestra
                return true;
            }

            function validateTitle() {
                const title = titleInput.value.trim();
                const titleError = document.getElementById('title-error');
                if (!title) {
                    titleError.textContent = 'El título es obligatorio';
                    return false;
                }
                if (title.length > 100) {
                    titleError.textContent = 'El título no debe exceder 100 caracteres';
                    return false;
                }
                titleError.textContent = '';
                return true;
            }

            function validateDescription() {
                const description = descriptionInput.value.trim();
                const descriptionError = document.getElementById('description-error');
                if (!description) {
                    descriptionError.textContent = 'La descripción es obligatoria';
                    return false;
                }
                if (description.length > 500) {
                    descriptionError.textContent = 'La descripción no debe exceder 500 caracteres';
                    return false;
                }
                descriptionError.textContent = '';
                return true;
            }

            function validatePrice() {
                const price = priceInput.value;
                const priceError = document.getElementById('price-error');
                if (!price) {
                    priceError.textContent = 'El precio es obligatorio';
                    return false;
                }
                if (price <= 0 || !Number.isInteger(Number(price))) {
                    priceError.textContent = 'El precio debe ser un número entero positivo mayor a 0';
                    return false;
                }
                priceError.textContent = '';
                return true;
            }

            function validateAvailability() {
                const availability = availabilityInput.value;
                const availabilityError = document.getElementById('availability-error');
                const validAvailabilities = ['inmediata', 'futura_1mes', 'futura_3meses', 'no_disponible'];
                if (!availability || !validAvailabilities.includes(availability)) {
                    availabilityError.textContent = 'Debes seleccionar una disponibilidad válida';
                    return false;
                }
                availabilityError.textContent = '';
                return true;
            }

            function validateConditions() {
                const conditions = conditionsInput.value.trim();
                const conditionsError = document.getElementById('conditions-error');
                if (conditions.length > 500) {
                    conditionsError.textContent = 'Las condiciones no deben exceder 500 caracteres';
                    return false;
                }
                conditionsError.textContent = '';
                return true;
            }

            function validateImages(files) {
                const imagesError = document.getElementById('images-error');
                const allowedFormats = ['image/png', 'image/jpeg', 'image/jpg'];
                const maxSize = 5 * 1024 * 1024; // 5MB por imagen
                const maxImages = 10;
                const totalImages = currentImages.length + files.length;

                if (totalImages > maxImages) {
                    imagesError.textContent = `Solo puedes tener un máximo de ${maxImages} imágenes`;
                    return false;
                }

                for (let file of files) {
                    if (!allowedFormats.includes(file.type)) {
                        imagesError.textContent = 'Solo se permiten archivos PNG, JPG o JPEG';
                        return false;
                    }
                    if (file.size > maxSize) {
                        imagesError.textContent = 'Cada imagen no debe exceder 5MB';
                        return false;
                    }
                }

                imagesError.textContent = '';
                return true;
            }

            function handleImageUpload(event) {
                const files = event.target.files;
                if (!validateImages(files)) {
                    imagesInput.value = '';
                    newImages = [];
                    return;
                }

                newImages = Array.from(files);
                Array.from(files).forEach(file => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const imgDiv = document.createElement('div');
                        imgDiv.className = 'image-preview-item';
                        imgDiv.style.position = 'relative';
                        imgDiv.innerHTML = `
                            <img src="${e.target.result}" alt="Nueva imagen" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; border: 1px solid #ccc;">
                            <button type="button" class="remove-image-btn" style="
                                position: absolute; top: 5px; right: 5px; background: #dc2626; color: white;
                                border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer;
                                display: flex; align-items: center; justify-content: center;
                            ">×</button>
                        `;
                        imagePreview.appendChild(imgDiv);

                        imgDiv.querySelector('.remove-image-btn').addEventListener('click', () => {
                            newImages = newImages.filter(f => f !== file);
                            imgDiv.remove();
                            hasUnsavedChanges = true;
                            toggleNavbarLinks(true);
                        });
                    };
                    reader.readAsDataURL(file);
                });
            }

            function validateAddressFields() {
                const type = typeInput.value;
                const fields = ['post-barrio', 'post-calle-carrera', 'post-numero'];
                let addressData = {
                    barrio: document.getElementById('post-barrio')?.value || '',
                    calle_carrera: document.getElementById('post-calle-carrera')?.value || '',
                    numero: document.getElementById('post-numero')?.value || '',
                    conjunto_torre: null,
                    apartamento: null,
                    piso: null
                };

                if (type === 'apartamento') {
                    fields.push('post-conjunto-torre', 'post-apartamento', 'post-piso');
                    addressData.conjunto_torre = document.getElementById('post-conjunto-torre')?.value || '';
                    addressData.apartamento = document.getElementById('post-apartamento')?.value || '';
                    addressData.piso = document.getElementById('post-piso')?.value || '';
                } else if (type === 'habitacion') {
                    const enEdificio = document.getElementById('post-en-edificio')?.checked;
                    if (enEdificio) {
                        fields.push('post-conjunto-torre', 'post-piso');
                        addressData.conjunto_torre = document.getElementById('post-conjunto-torre')?.value || '';
                        addressData.piso = document.getElementById('post-piso')?.value || '';
                    }
                } else if (type === 'parqueo' || type === 'bodega') {
                    addressData.conjunto_torre = document.getElementById('post-conjunto-edificio')?.value || '';
                }

                return fields.every(id => validateAddressField(id));
            }

            function validateAddressField(id) {
                const value = document.getElementById(id)?.value?.trim();
                const errorElement = document.getElementById(`${id}-error`);
                const type = typeInput.value;

                if (!errorElement) return true;

                if (id === 'post-barrio') {
                    errorElement.textContent = ''; // No se valida, solo se muestra
                    return true;
                }

                if (id === 'post-calle-carrera') {
                    errorElement.textContent = ''; // No se valida, solo se muestra
                    return true;
                }

                if (id === 'post-numero') {
                    errorElement.textContent = ''; // No se valida, solo se muestra
                    return true;
                }

                if (id === 'post-conjunto-torre' && type === 'apartamento') {
                    errorElement.textContent = ''; // No se valida, solo se muestra
                    return true;
                }

                if (id === 'post-apartamento' && type === 'apartamento') {
                    errorElement.textContent = ''; // No se valida, solo se muestra
                    return true;
                }

                if (id === 'post-piso' && type === 'apartamento') {
                    errorElement.textContent = ''; // No se valida, solo se muestra
                    return true;
                }

                if (id === 'post-conjunto-torre' && type === 'habitacion') {
                    errorElement.textContent = ''; // No se valida, solo se muestra si está deshabilitado
                    return true;
                }

                if (id === 'post-piso' && type === 'habitacion') {
                    errorElement.textContent = ''; // No se valida, solo se muestra si está deshabilitado
                    return true;
                }

                if (id === 'post-conjunto-edificio' && (type === 'parqueo' || type === 'bodega')) {
                    if (value && !conjuntos.includes(value)) {
                        errorElement.textContent = 'Aún no has seleccionado un conjunto de forma correcta';
                        return false;
                    }
                    if (value && value.length > 100) {
                        errorElement.textContent = 'No debe exceder 100 caracteres';
                        return false;
                    }
                    errorElement.textContent = '';
                    return true;
                }

                errorElement.textContent = '';
                return true;
            }

            function validateForm() {
                return validateTitle() && validateDescription() && validatePrice() && validateAvailability() && validateConditions() && validateImages(imagesInput.files) && validateAddressFields();
            }

            async function submitPost(publicationId, currentImages, newImages, removedImages) {
                if (isSubmitting) return;
                isSubmitting = true;

                if (!validateForm()) {
                    showMessage('Por favor, corrige los errores en el formulario.');
                    isSubmitting = false;
                    return;
                }

                showLoadingSpinner();

                const formData = new FormData();
                formData.append('title', titleInput.value.trim());
                formData.append('description', descriptionInput.value.trim());
                formData.append('price', priceInput.value);
                formData.append('availability', availabilityInput.value);
                formData.append('conditions', conditionsInput.value.trim() || '');
                formData.append('email', localStorage.getItem('currentUserEmail') || '');
                currentImages.forEach(img => formData.append('existingImages', img));
                removedImages.forEach(img => formData.append('removedImages', img));
                newImages.forEach(file => formData.append('images', file));

                // Agregar datos de dirección al formData
                formData.append('barrio', document.getElementById('post-barrio')?.value || '');
                formData.append('calle_carrera', document.getElementById('post-calle-carrera')?.value || '');
                formData.append('numero', document.getElementById('post-numero')?.value || '');
                if (typeInput.value === 'apartamento') {
                    formData.append('conjunto_torre', document.getElementById('post-conjunto-torre')?.value || '');
                    formData.append('apartamento', document.getElementById('post-apartamento')?.value || '');
                    formData.append('piso', document.getElementById('post-piso')?.value || '');
                } else if (typeInput.value === 'habitacion') {
                    const enEdificio = address.conjunto_torre || address.piso; // Determinar si está en un edificio según los datos existentes
                    formData.append('en_edificio', enEdificio ? 'true' : 'false');
                    formData.append('conjunto_torre', address.conjunto_torre || '');
                    formData.append('piso', address.piso || '');
                } else if (typeInput.value === 'parqueo' || typeInput.value === 'bodega') {
                    formData.append('conjunto_edificio', document.getElementById('post-conjunto-edificio')?.value || '');
                }

                try {
                    const response = await fetch(`/api/publications/landlord/${publicationId}`, {
                        method: 'PUT',
                        headers: {
                            'x-user-email': localStorage.getItem('currentUserEmail') || ''
                        },
                        body: formData
                    });

                    const data = await response.json();

                    hideLoadingSpinner();

                    if (data.success) {
                        hasUnsavedChanges = false;
                        toggleNavbarLinks(false);
                        showMessage('Publicación actualizada exitosamente.', false);
                        setTimeout(() => {
                            renderMyPublications();
                            isSubmitting = false;
                        }, 500);
                    } else {
                        showMessage(data.message || 'Error al actualizar la publicación.');
                        isSubmitting = false;
                    }
                } catch (error) {
                    hideLoadingSpinner();
                    console.error('Error al actualizar la publicación:', error);
                    showMessage('Error al actualizar la publicación. Por favor, intenta nuevamente.');
                    isSubmitting = false;
                }
            }

            hideLoadingSpinner();
        } catch (error) {
            hideLoadingSpinner();
            console.error('Error al cargar la publicación:', error);
            mainContent.innerHTML = `
                <div class="no-publications error">
                    <span>❌</span>
                    <p>Error al cargar la publicación: ${error.message}</p>
                    <button class="action-btn" onclick="renderMyPublications()">Volver a Mis Publicaciones</button>
                </div>
            `;
        }
    }



    // Función para renderizar "Mis Publicaciones"
    async function renderMyPublications() {
        if (!mainContent) {
            console.error('No se encontró #main-content');
            showMessage('Error: No se encontró el contenedor principal.');
            return;
        }

        mainContent.innerHTML = `
            <div class="my-publications-section">
                <h1>Mis Publicaciones</h1>
                <div class="filter-section">
                    <div class="filter-form">
                        <div class="filter-group">
                            <label for="filter-status">Estado:</label>
                            <select id="filter-status">
                                <option value="">Todos</option>
                                <option value="pending">Pendiente</option>
                                <option value="rejected">Rechazado</option>
                                <option value="available">Disponible</option>
                            </select>
                        </div>
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
                        <button id="filter-btn">Filtrar</button>
                        <button id="reset-btn">Limpiar</button>
                    </div>
                </div>
                <div class="publications-list" id="publications-list"></div>
            </div>
        `;

        const style = document.createElement('style');
        style.innerHTML = `
            .my-publications-section {
                max-width: 1200px;
                margin: 2rem auto;
                padding: 0 1rem;
            }
            .my-publications-section h1 {
                font-family: 'Roboto', sans-serif;
                color: #2b6b6b;
                font-size: 2rem;
                margin-bottom: 1rem;
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
                align-items: center;
                justify-content: center;
            }
            .filter-group {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
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
            }
            .filter-group select:focus,
            .filter-group input:focus {
                border-color: #2b6b6b;
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
            .publications-list {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 1.5rem;
                padding: 1rem 0;
            }
            .publication-card {
                background: #fff;
                border-radius: 12px;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                overflow: hidden;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                position: relative;
                border: 1px solid #e5e7eb;
                display: flex;
                flex-direction: column;
            }
            .publication-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
            }
            .publication-image {
                width: 100%;
                height: 180px;
                object-fit: cover;
            }
            .publication-content {
                flex: 1;
                padding: 0.75rem 0;
            }
            .publication-card h3 {
                font-family: 'Roboto', sans-serif;
                font-size: 1.25rem;
                font-weight: 600;
                color: #333;
                margin: 0.75rem 0;
                padding-left: 1rem;
                text-align: left;
                line-height: 1.3;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-overflow: ellipsis;
                max-height: 3.2em;
            }
            .publication-card p {
                font-family: 'Roboto', sans-serif;
                font-size: 0.9rem;
                color: #666;
                margin: 0.3rem 0;
                padding-left: 1rem;
            }
            .publication-actions {
                display: flex;
                justify-content: space-between;
                padding: 0.75rem 1rem;
                border-top: 1px solid #e5e7eb;
                background: #f9fafb;
                gap: 0.5rem;
                margin-top: auto;
            }
            .publication-action-btn {
                background: #e5e7eb;
                color: #374151;
                border: none;
                padding: 0.5rem 0.75rem;
                border-radius: 6px;
                cursor: pointer;
                font-family: 'Roboto', sans-serif;
                font-size: 0.85rem;
                font-weight: 500;
                flex: 1;
                text-align: center;
                transition: background 0.3s ease, color 0.3s ease;
            }
            .publication-action-btn:hover:not(:disabled) {
                background: #d1d5db;
            }
            .publication-action-btn:disabled {
                background: #e5e7eb;
                color: #9ca3af;
                cursor: not-allowed;
            }
            .pending-message {
                font-family: 'Roboto', sans-serif;
                font-size: 0.85rem;
                color: #dc2626;
                text-align: center;
                margin: 0.5rem 1rem;
                font-weight: 500;
                background: #fef2f2;
                padding: 0.5rem;
                border-radius: 6px;
            }
            .rental-status {
                font-family: 'Roboto', sans-serif;
                font-size: 0.9em;
                margin: 0.5rem 1rem 1rem 1rem;
                padding: 5px 10px;
                border-radius: 5px;
                text-align: center;
            }
            .rental-status.disponible {
                background-color: #e7f3e7;
                color: #2e7d32;
            }
            .rental-status.en-proceso {
                background-color: #fff3e0;
                color: #f57c00;
            }
            .rental-status.arrendado {
                background-color: #e3f2fd;
                color: #1976d2;
            }
            .rental-status.inactivo {
                background-color: #f5f5f5;
                color: #616161;
            }
            .rental-status.desconocido {
                background-color: #ffebee;
                color: #d32f2f;
            }
            .no-publications {
                text-align: center;
                padding: 2rem;
                font-family: 'Roboto', sans-serif;
                color: #555;
            }
            .no-publications span {
                font-size: 2rem;
                display: block;
                margin-bottom: 1rem;
            }
            .no-publications.error {
                color: #dc2626;
            }
            @media (max-width: 768px) {
                .publications-list {
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                }
                .filter-form {
                    flex-direction: column;
                    align-items: stretch;
                }
                .filter-form button {
                    margin-top: 0.5rem;
                }
            }
            @media (max-width: 480px) {
                .publications-list {
                    grid-template-columns: 1fr;
                }
                .publication-card h3 {
                    font-size: 1.1rem;
                }
                .publication-actions {
                    flex-direction: column;
                }
                .publication-action-btn {
                    margin-bottom: 0.5rem;
                }
                .publication-action-btn:last-child {
                    margin-bottom: 0;
                }
            }
        `;
        document.head.appendChild(style);

        const filterStatus = document.getElementById('filter-status');
        const filterTitle = document.getElementById('filter-title');
        const filterType = document.getElementById('filter-type');
        const filterBtn = document.getElementById('filter-btn');
        const resetBtn = document.getElementById('reset-btn');

        async function fetchFilteredPublications() {
            const status = filterStatus.value;
            const title = filterTitle.value.trim();
            const type = filterType.value;

            const params = new URLSearchParams();
            if (status) params.append('status', status);
            if (title) params.append('title', title);
            if (type) params.append('type', type);

            await fetchMyPublications(params.toString());
        }

        filterBtn.addEventListener('click', () => {
            fetchFilteredPublications();
        });

        filterTitle.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                fetchFilteredPublications();
            }
        });

        resetBtn.addEventListener('click', () => {
            filterStatus.value = '';
            filterTitle.value = '';
            filterType.value = '';
            fetchMyPublications();
        });

        await fetchMyPublications();
    }

    // Función para obtener y renderizar las publicaciones
    async function fetchMyPublications(queryString = '') {
        const publicationsList = document.getElementById('publications-list');
        if (!publicationsList) {
            console.error('No se encontró #publications-list');
            showMessage('Error: No se encontró el contenedor de publicaciones.');
            return;
        }

        showLoadingSpinner();

        try {
            const userEmail = localStorage.getItem('currentUserEmail') || '';
            if (!userEmail) {
                throw new Error('No se encontró el email del usuario en localStorage. Por favor, inicia sesión nuevamente.');
            }

            console.log('Solicitando publicaciones para el usuario:', userEmail);

            const url = queryString ? `/api/publications/landlord/my-publications?${queryString}` : '/api/publications/landlord/my-publications';
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
            console.log('Datos recibidos del backend:', data);

            publicationsList.innerHTML = '';

            if (!data.success) {
                throw new Error(data.message || 'Error al obtener las publicaciones');
            }

            if (!data.publications || data.publications.length === 0) {
                publicationsList.innerHTML = `
                    <div class="no-publications">
                        <span>📋</span>
                        <p>No se encontraron publicaciones con los criterios seleccionados.</p>
                    </div>
                `;
                hideLoadingSpinner();
                return;
            }

            data.publications.forEach(publication => {
                if (!publication.id || !publication.title || !publication.price || !publication.availability || !publication.status || !publication.rental_status) {
                    console.warn('Publicación incompleta:', publication);
                    return;
                }

                const publicationCard = document.createElement('div');
                publicationCard.className = 'publication-card';

                const formattedPrice = Number(publication.price).toLocaleString('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                });
                const imageSrc = publication.image_url || '/img/house_default.png';
                const type = publication.type || 'Desconocido';

                let formattedType = '';
                switch (type.toLowerCase()) {
                    case 'apartamento':
                        formattedType = 'Apartamento';
                        break;
                    case 'casa':
                        formattedType = 'Casa';
                        break;
                    case 'habitacion':
                        formattedType = 'Habitación';
                        break;
                    case 'parqueo':
                        formattedType = 'Parqueadero';
                        break;
                    case 'bodega':
                        formattedType = 'Bodega';
                        break;
                    default:
                        formattedType = type.charAt(0).toUpperCase() + type.slice(1);
                }

                let address = '';
                if (publication.barrio || publication.calle_carrera || publication.numero) {
                    const addressParts = [];
                    if (publication.barrio) addressParts.push(publication.barrio);
                    if (publication.calle_carrera) addressParts.push(publication.calle_carrera);
                    if (publication.numero) addressParts.push(`#${publication.numero}`);
                    
                    if (['apartamento', 'habitacion'].includes(type.toLowerCase())) {
                        if (publication.conjunto_torre) addressParts.push(`${publication.conjunto_torre}`);
                        if (publication.apartamento) addressParts.push(`Apto: ${publication.apartamento}`);
                        if (publication.piso) addressParts.push(`Piso: ${publication.piso}`);
                    }
                    
                    address = addressParts.join(', ');
                } else {
                    address = 'Dirección no disponible';
                }

                let formattedAvailability = '';
                switch (publication.availability) {
                    case 'inmediata':
                        formattedAvailability = 'Inmediata';
                        break;
                    case 'futura_1mes':
                        formattedAvailability = 'Futura (1 mes)';
                        break;
                    case 'futura_3meses':
                        formattedAvailability = 'Futura (3 meses)';
                        break;
                    default:
                        formattedAvailability = publication.availability;
                }

                let rentalStatusMessage = '';
                // Mostrar el mensaje de rental_status SOLO si status es 'available'
                if (publication.status === 'available') {
                    switch (publication.rental_status) {
                        case 'disponible':
                            rentalStatusMessage = '<p class="rental-status disponible">Disponible para arriendo</p>';
                            break;
                        case 'en_proceso_arrendamiento':
                            rentalStatusMessage = '<p class="rental-status en-proceso">En Proceso de Arrendamiento</p>';
                            break;
                        case 'arrendado':
                            rentalStatusMessage = '<p class="rental-status arrendado">Arrendado</p>';
                            break;
                        case 'inactivo':
                            rentalStatusMessage = '<p class="rental-status inactivo">Inactivo</p>';
                            break;
                        default:
                            rentalStatusMessage = '<p class="rental-status desconocido">Estado de renta desconocido...</p>';
                            console.warn(`rental_status desconocido para la publicación ${publication.id}: ${publication.rental_status}`);
                    }
                }

                let viewDisabled = '';
                let editDisabled = '';
                let deleteDisabled = '';
                let statusMessage = '';

                if (publication.status === 'pending') {
                    viewDisabled = 'disabled';
                    editDisabled = 'disabled';
                    deleteDisabled = 'disabled';
                    statusMessage = '<p class="pending-message">En espera de Revisión...</p>';
                } else if (publication.status === 'rejected') {
                    viewDisabled = 'disabled';
                    editDisabled = '';
                    deleteDisabled = '';
                    statusMessage = '<p class="pending-message">En espera de modificación...</p>';
                } else if (publication.status === 'available') {
                    viewDisabled = '';
                    if (publication.rental_status === 'en_proceso_arrendamiento' || publication.rental_status === 'arrendado') {
                        editDisabled = 'disabled';
                        deleteDisabled = 'disabled';
                    } else {
                        editDisabled = '';
                        deleteDisabled = '';
                    }
                    statusMessage = '';
                } else {
                    console.warn(`Estado desconocido para la publicación ${publication.id}: ${publication.status}`);
                    viewDisabled = 'disabled';
                    editDisabled = 'disabled';
                    deleteDisabled = 'disabled';
                    statusMessage = '<p class="pending-message">Estado desconocido...</p>';
                }

                publicationCard.innerHTML = `
                    <img src="${imageSrc}" alt="${publication.title}" class="publication-image">
                    <h3>${publication.title}</h3>
                    <p><strong>Tipo:</strong> ${formattedType}</p>
                    <p><strong>Precio:</strong> ${formattedPrice}</p>
                    <p><strong>Disponibilidad:</strong> ${formattedAvailability}</p>
                    <p><strong>Dirección:</strong> ${address}</p>
                    <div class="publication-actions">
                        <button class="publication-action-btn view" data-id="${publication.id}" ${viewDisabled}>Conocer Publicación</button>
                        <button class="publication-action-btn edit" data-id="${publication.id}" ${editDisabled}>Editar Publicación</button>
                        <button class="publication-action-btn delete" data-id="${publication.id}" ${deleteDisabled}>Eliminar Publicación</button>
                    </div>
                    ${statusMessage}
                    ${rentalStatusMessage}
                `;

                publicationsList.appendChild(publicationCard);

                const viewBtn = publicationCard.querySelector('.view');
                const editBtn = publicationCard.querySelector('.edit');
                const deleteBtn = publicationCard.querySelector('.delete');

                if (!viewBtn || !editBtn || !deleteBtn) {
                    console.error(`No se encontraron los botones para la publicación ${publication.id}`);
                    return;
                }

                if (!viewDisabled) {
                    viewBtn.addEventListener('click', () => {
                        console.log(`Clic en "Conocer Publicación" para la publicación ${publication.id}`);
                        window.renderMyPublicationDetails(publication.id);
                    });
                }

                if (!editDisabled) {
                    editBtn.addEventListener('click', () => {
                        console.log(`Clic en "Editar Publicación" para la publicación ${publication.id}`);
                        window.renderEditPublicationForm(publication.id);
                    });
                }

                if (!deleteDisabled) {
                    deleteBtn.addEventListener('click', () => {
                        showConfirmationDialog(
                            '¿Estás seguro de que deseas eliminar esta publicación? Esta acción no se puede deshacer.',
                            async () => {
                                await deletePublication(publication.id);
                                setTimeout(async () => {
                                    await renderMyPublications();
                                }, 1500);
                            },
                            () => {
                                console.log('Eliminación cancelada');
                            }
                        );
                    });
                }
            });

            hideLoadingSpinner();
        } catch (error) {
            hideLoadingSpinner();
            console.error('Error obteniendo las publicaciones:', error);
            publicationsList.innerHTML = `
                <p class="no-publications error">Error al cargar tus publicaciones: ${error.message}</p>
            `;
        }
    }

    // Función para mostrar la advertencia de cambios no guardados
    function showUnsavedChangesWarning(callback) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background-color: rgba(0,0,0,0.5); z-index: 2999; opacity: 0;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(overlay);

        const warningDiv = document.createElement('div');
        warningDiv.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background-color: #fff; padding: 2rem; border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 3000; text-align: center;
            font-family: 'Roboto', sans-serif; color: #2b6b6b;
            opacity: 0; transition: opacity 0.3s ease, transform 0.3s ease;
        `;
        warningDiv.innerHTML = `
            <h3 style="margin-bottom: 1rem;">¡Atención!</h3>
            <p>¿Estás seguro de que deseas salir? Los cambios no guardados se perderán.</p>
            <div style="margin-top: 1rem; display: flex; gap: 1rem; justify-content: center;">
                <button id="exit-btn" style="
                    background: linear-gradient(135deg, #dc2626, #f87171);
                    color: white; border: none; padding: 0.8rem 1.5rem;
                    border-radius: 8px; cursor: pointer; font-weight: 500;
                ">Salir</button>
                <button id="cancel-btn" style="
                    background: linear-gradient(135deg, #2b6b6b, #4c9f9f);
                    color: white; border: none; padding: 0.8rem 1.5rem;
                    border-radius: 8px; cursor: pointer; font-weight: 500;
                ">Cancelar</button>
            </div>
        `;
        document.body.appendChild(warningDiv);

        setTimeout(() => {
            overlay.style.opacity = '1';
            warningDiv.style.opacity = '1';
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
    }

    // Advertencia al intentar recargar o cerrar la página
    window.addEventListener('beforeunload', (event) => {
        if (hasUnsavedChanges) {
            const message = '¿Estás seguro de que deseas salir? Los cambios no guardados se perderán.';
            event.preventDefault();
            event.returnValue = message;
            return message;
        }
    });

    // Prevent navigation if there are unsaved changes
    menuLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            if (hasUnsavedChanges) {
                event.preventDefault();
                showUnsavedChangesWarning(() => {
                    hasUnsavedChanges = false;
                    toggleNavbarLinks(false);
                    window.location.href = link.getAttribute('href');
                });
            }
        });
    });

    // Exponer funciones globalmente
    window.renderEditPublicationForm = renderEditPublicationForm;
    window.renderMyPublications = renderMyPublications;
});

//Nuevo bloque para las conversaciones
document.addEventListener('DOMContentLoaded', function() {
    // DOM Variables
    const mainContent = document.getElementById('main-content');
    const conversationsLink = document.querySelector('a[href="mensajes"]');
    let socket = null;
    let currentConversationId = null;
    let tenantEmail = null;
    let SOCKET_URL = null;

    // Load Socket.IO from CDN
    function loadSocketIO() {
        return new Promise((resolve, reject) => {
            if (window.io) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://cdn.socket.io/4.7.5/socket.io.min.js';
            script.async = true;
            script.timeout = 10000; // 10 segundos
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Error al cargar Socket.IO'));
            document.head.appendChild(script);
        });
    }

    // Fetch socket URL from server
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
            throw error; // Cambiado para permitir manejo en initializeOnLoad
        }
    }

    // Initialize Socket.IO on page load
    async function initializeOnLoad() {
        try {
            await fetchSocketUrl();
            await loadSocketIO();
            console.log('Inicialización de Socket.IO completada');
        } catch (error) {
            console.error('Error en la inicialización:', error.message);
            showMessage('Error al inicializar el chat. Verifica tu conexión.', true);
        }
    }

    // Ejecutar inicialización al cargar la página
    initializeOnLoad();

    // Fetch conversations for landlord
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
            const response = await fetch(`/api/conversations/landlord${query}`, {
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
                const lastMessageAuthor = conversation.last_message.sender_email === userEmail ? 'Tú' : conversation.tenant_name;
                conversationCard.innerHTML = `
                    <img src="${conversation.tenant_profile_picture || '/img/default-profile.png'}" alt="${conversation.tenant_name}" class="conversation-image">
                    <div class="conversation-info">
                        <h3>${conversation.tenant_name}</h3>
                        <p><strong>Publicación:</strong> ${conversation.publication_title}</p>
                        <p><strong>Último mensaje (${lastMessageAuthor}):</strong> ${conversation.last_message.content}</p>
                        <p><strong>Fecha:</strong> ${formattedDate}</p>
                    </div>
                    <button class="conversation-action-btn" data-conversation-id="${conversation.id}" data-publication-id="${conversation.publication_id}" data-tenant-email="${conversation.tenant_email}">Leer Conversación</button>
                `;
                conversationsList.appendChild(conversationCard);
                conversationCard.querySelector('.conversation-action-btn').addEventListener('click', () => {
                    openConversation(conversation.id, conversation.publication_id, {
                        full_name: conversation.tenant_name,
                        profile_picture: conversation.tenant_profile_picture,
                        email: conversation.tenant_email
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
        mainContent.innerHTML = `
            <div class="conversations-section">
                <h1>Mis Conversaciones</h1>
                <div class="search-section">
                    <input type="text" id="search-conversations" placeholder="Buscar por publicación o arrendatario...">
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

    // Initialize Socket.io
    async function initializeSocket() {
        if (!SOCKET_URL) {
            console.error('URL del socket no está definida. Asegurarse de que fetchSocketUrl se haya ejecutado.');
            showMessage('Error al conectar al chat. Verifica tu conexión.', true);
            return;
        }
        if (socket) socket.disconnect();
        try {
            await loadSocketIO();
            if (!window.io) throw new Error('Socket.IO no está disponible.');
            socket = io(SOCKET_URL, {
                auth: { userEmail: localStorage.getItem('currentUserEmail') },
                reconnection: true,
                reconnectionAttempts: 15,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 10000,
                transports: ['websocket', 'polling'],
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
                const retryBtn = document.getElementById('retry-connect-btn');
                if (retryBtn) retryBtn.style.display = 'block';
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
                const retryBtn = document.getElementById('retry-connect-btn');
                if (retryBtn) retryBtn.style.display = 'block';
            });
        } catch (error) {
            console.error('Error al inicializar el socket:', error.message);
            socket = null;
            showMessage('Error al conectar al chat. Intenta de nuevo.', true);
        }
    }

    // Open conversation
    async function openConversation(conversationId, publicationId, tenant, publication) {
        const elements = showLoadingSpinner('Cargando conversación...');
        try {
            const userEmail = localStorage.getItem('currentUserEmail');
            if (!userEmail) throw new Error('No se encontró el email del usuario.');
            if (!SOCKET_URL) await fetchSocketUrl();
            currentConversationId = conversationId;
            tenantEmail = tenant.email;
            localStorage.setItem('currentConversationId', conversationId);
            await initializeSocket();
            if (!socket) throw new Error('No se pudo conectar al chat.');
            socket.emit('join_conversation', { conversationId: currentConversationId, userEmail });
            renderChatInterface(publication, tenant);
            await loadMessages(currentConversationId);
            hideLoadingSpinner(elements);
        } catch (error) {
            hideLoadingSpinner(elements);
            showMessage(error.message || 'Error al abrir la conversación.', true);
        }
    }

    // Render chat interface
    function renderChatInterface(publication, tenant) {
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
                        <img src="${tenant.profile_picture || '/img/default-profile.png'}" 
                            alt="${tenant.full_name}" 
                            class="landlord-image">
                        <div class="chat-info">
                            <h2>${tenant.full_name}</h2>
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
                        <button id="retry-connect-btn" style="display: none;">Reintentar Conexión</button>
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

            #retry-connect-btn {
                background: linear-gradient(135deg, #dc2626, #f87171);
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 24px;
                cursor: pointer;
                font-weight: 600;
                margin-left: 0.5rem;
                transition: all 0.2s ease;
            }

            #retry-connect-btn:hover {
                background: linear-gradient(135deg, #f87171, #dc2626);
            }

            @media (max-width: 768px) {
                .chat-header { padding: 0.8rem; min-height: 60px; }
                .landlord-image { width: 40px; height: 40px; }
                .chat-info h2 { font-size: 1rem; }
                .chat-info p { font-size: 0.75rem; }
                .chat-messages { max-height: calc(100vh - 160px); padding-bottom: 70px; }
                .chat-input-container { padding: 0.7rem; margin-left: 0; width: 100%; }
                #message-input { padding: 0.8rem 1rem; min-height: 45px; }
                #send-message-btn { padding: 0.8rem 1.2rem; }
                .message { max-width: 80%; font-size: 0.9rem; }
            }

            @media (max-width: 576px) {
                .chat-container { position: relative; padding-bottom: 60px; height: calc(var(--vh, 1vh) * 100); }
                .chat-header { padding: 0.6rem; min-height: 55px; }
                .landlord-image { width: 36px; height: 36px; margin-right: 0.7rem; }
                .chat-info h2 { font-size: 0.9rem; }
                .chat-info p { font-size: 0.7rem; max-width: 150px; }
                .chat-messages { max-height: calc(var(--vh, 1vh) * 100 - 150px); padding: 0.4rem; padding-bottom: 80px; margin-bottom: 0; }
                .chat-input-container { padding: 0.6rem; height: auto; min-height: 60px; position: fixed; bottom: 0; left: 0; right: 0; margin-left: 0; width: 100%; background-color: var(--background-white); border-top: 1px solid var(--border-color); }
                #message-input { padding: 0.7rem 0.9rem; min-height: 40px; font-size: 0.85rem; width: calc(100% - 50px); }
                #send-message-btn { width: 40px; height: 40px; padding: 0; border-radius: 50%; flex-shrink: 0; }
                #send-message-btn .fas { font-size: 1rem; }
                .message { max-width: 85%; font-size: 0.85rem; margin-bottom: 0.8rem; padding: 0.6rem 1rem; }
                .back-btn { width: 32px; height: 32px; margin-right: 0.7rem; }
            }

            .navbar.disabled a { pointer-events: none; opacity: 0.5; cursor: not-allowed; }
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
        const retryBtn = document.getElementById('retry-connect-btn');

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

            tenantEmail = null;
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

        if (retryBtn) {
            retryBtn.addEventListener('click', async () => {
                retryBtn.style.display = 'none';
                await initializeSocket();
            });
        }
    }

    // Send message
    function sendMessage() {
        const messageInput = document.getElementById('message-input');
        const content = messageInput.value.trim();
        if (!content || !socket || !socket.connected || !currentConversationId || !tenantEmail) return;
        const userEmail = localStorage.getItem('currentUserEmail');
        const sentAt = new Date().toISOString();
        const messageData = {
            conversationId: currentConversationId,
            content,
            senderEmail: userEmail,
            receiverEmail: tenantEmail,
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

    // Function to scroll to the last message
    function scrollToLastMessage() {
        const chatMessages = document.querySelector('.chat-messages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    // Navigation event listener
    if (conversationsLink) {
        conversationsLink.addEventListener('click', (event) => {
            event.preventDefault();
            renderConversations();
        });
    }

    // Expose functions globally
    window.renderConversations = renderConversations;
    window.openConversation = openConversation;
});

//Nuevo Bloque para mostras Estadisticas en el dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Función para obtener y actualizar las estadísticas del dashboard
    async function fetchStats() {
        const userEmail = localStorage.getItem('currentUserEmail') || '';
        console.log('Fetching stats for email:', userEmail); // Debug log
        if (!userEmail) {
            console.error('No se encontró el email del usuario en localStorage.');
            updateStats(0, 0, 0);
            return;
        }

        try {
            // Fetch stats from the new endpoint
            const response = await fetch('/api/stats', {
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
            const { activePublications, pendingPublications, newMessages } = data.stats;

            // Update DOM with stats
            updateStats(activePublications, pendingPublications, newMessages);
        } catch (error) {
            console.error('Error al obtener estadísticas:', error.message);
            updateStats(0, 0, 0);
        }
    }

    // Helper function to update DOM stats
    function updateStats(active, pending, messages) {
        const activeStat = document.querySelector('.stats-cards .card:nth-child(1) .stat');
        const pendingStat = document.querySelector('.stats-cards .card:nth-child(2) .stat');
        const messagesStat = document.querySelector('.stats-cards .card:nth-child(3) .stat');

        if (activeStat) activeStat.textContent = active;
        if (pendingStat) pendingStat.textContent = pending;
        if (messagesStat) messagesStat.textContent = messages;
    }

    // Exponer fetchStats globalmente
    window.fetchStats = fetchStats;

    // Ejecutar fetchStats al cargar la página si el dashboard está presente
    const dashboardContent = document.querySelector('.dashboard-content');
    if (dashboardContent) {
        fetchStats();
    }
});

// Nuevo Bloque para Acuerdos de Arrendamiento
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

    // Deshabilitar navbar cuando hay cambios no guardados
    function toggleNavbarLinks(disable) {
        const navbarLinks = document.querySelectorAll('.navbar a');
        navbarLinks.forEach(link => {
            if (disable) {
                link.classList.add('disabled');
            } else {
                link.classList.remove('disabled');
            }
        });
    }

    // Renderizar formulario de creación de acuerdo
    function debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // Renderizar detalles del acuerdo
    async function renderAcuerdoDetails(acuerdoId) {
        if (!mainContent) {
            console.error('No se encontró #main-content');
            showMessage('Error: No se encontró el contenedor principal.');
            return;
        }

        showLoadingSpinner();

        try {
            const userEmail = localStorage.getItem('currentUserEmail') || '';
            if (!userEmail) {
                throw new Error('No se encontró el email del usuario en localStorage. Por favor, inicia sesión nuevamente.');
            }

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
            const isEnProceso = acuerdo.status === 'en_proceso';

            mainContent.innerHTML = `
                <div class="acuerdo-details-section">
                    <h1>Detalles del Acuerdo</h1>
                    <div class="acuerdo-details">
                        <h2>${acuerdo.publication_title}</h2>
                        <p><strong>Número de Contrato:</strong> ${acuerdo.contract_id}</p>
                        <p><strong>Estado:</strong> ${formattedStatus}</p>
                        <p><strong>Arrendador:</strong> ${acuerdo.landlord_name || 'No disponible'}</p>
                        <p><strong>Arrendatario:</strong> ${acuerdo.tenant_name || 'No disponible'}</p>
                        <p><strong>Precio:</strong> ${formattedPrice}</p>
                        <p><strong>Duración:</strong> ${acuerdo.duration_months || 'No especificada'} meses</p>
                        <p><strong>Fecha de Inicio:</strong> ${startDate}</p>
                        <p><strong>Fecha de Finalización:</strong> ${endDate}</p>
                        <p><strong>Fecha de Creación de Contrato:</strong> ${acuerdo.created_at_formatted || 'No disponible'}</p>
                        <p><strong>Última Actualización del Contrato:</strong> ${acuerdo.updated_at_formatted || 'No disponible'}</p>
                        ${acuerdo.additional_notes ? `<p><strong>Notas Adicionales:</strong> ${acuerdo.additional_notes}</p>` : ''}
                    </div>
                    <div class="contract-preview">
                        <h3>Previsualización del Contrato Original</h3>
                        <iframe id="contract-preview" style="width: 100%; height: 400px; border: 1px solid #e5e7eb; border-radius: 6px;"></iframe>
                    </div>
                    <div class="signed-contract-preview">
                        <h3>Contrato Firmado (Arrendatario)</h3>
                        <iframe id="signed-contract-preview" style="width: 100%; height: 400px; border: 1px solid #e5e7eb; border-radius: 6px;"></iframe>
                    </div>
                    <div class="acuerdo-actions">
                        <button id="accept-btn" class="action-btn accept" ${!isEnProceso ? 'disabled' : ''}>Aceptar Acuerdo</button>
                        <button id="reject-btn" class="action-btn reject" ${!isEnProceso ? 'disabled' : ''}>Rechazar Acuerdo</button>
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

                .contract-preview, .signed-contract-preview {
                    margin-bottom: 2rem;
                }

                .contract-preview h3, .signed-contract-preview h3 {
                    font-family: 'Roboto', sans-serif;
                    font-size: 1.2rem;
                    color: #2b6b6b;
                    margin-bottom: 0.5rem;
                }

                .acuerdo-actions {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
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

                .action-btn:hover:not(:disabled) {
                    background: linear-gradient(135deg, #4c9f9f, #2b6b6b);
                }

                .action-btn.accept {
                    background: linear-gradient(135deg, #2b6b6b, #4c9f9f);
                }

                .action-btn.reject {
                    background: linear-gradient(135deg, #dc2626, #f87171);
                }

                .action-btn.reject:hover:not(:disabled) {
                    background: linear-gradient(135deg, #f87171, #dc2626);
                }

                .action-btn.back {
                    background: #e5e7eb;
                    color: #374151;
                }

                .action-btn.back:hover {
                    background: #d1d5db;
                }

                .action-btn:disabled {
                    background: #e5e7eb;
                    color: #9ca3af;
                    cursor: not-allowed;
                    opacity: 0.6;
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

            // Previsualización del contrato original - Cargar el archivo PDF almacenado
            if (acuerdo.contract_file) {
                try {
                    const contractUrl = acuerdo.contract_file; // Por ejemplo, "/contracts/contrato_CONBI817T.pdf"
                    const response = await fetch(contractUrl, {
                        headers: { 'x-user-email': userEmail }
                    });
                    if (!response.ok) {
                        throw new Error('Error al cargar el contrato original: ' + response.statusText);
                    }
                    const pdfBlob = await response.blob();
                    const pdfUrl = URL.createObjectURL(pdfBlob);
                    contractPreview.src = pdfUrl;
                } catch (error) {
                    console.error('Error al cargar el contrato original:', error);
                    const doc = contractPreview.contentDocument || contractPreview.contentWindow.document;
                    doc.open();
                    doc.write(`
                        <html>
                            <body style="font-family: 'Roboto', sans-serif; text-align: center; padding: 20px; color: #dc2626;">
                                <h3>Error</h3>
                                <p>No se pudo cargar el contrato original: ${error.message}</p>
                            </body>
                        </html>
                    `);
                    doc.close();
                }
            } else {
                const doc = contractPreview.contentDocument || contractPreview.contentWindow.document;
                doc.open();
                doc.write(`
                    <html>
                        <body style="font-family: 'Roboto', sans-serif; text-align: center; padding: 20px; color: #666;">
                            <p>No se encontró el contrato original.</p>
                        </body>
                    </html>
                `);
                doc.close();
            }

            // Previsualización del contrato firmado - Cargar el archivo subido por el arrendatario
            if (acuerdo.signed_contract_file) {
                try {
                    const signedContractUrl = acuerdo.signed_contract_file; // Por ejemplo, "/signed_contracts/signed_CONBI817T.pdf"
                    const signedResponse = await fetch(signedContractUrl, {
                        headers: { 'x-user-email': userEmail }
                    });
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
                                <p>No se pudo cargar el contrato firmado: ${error.message}</p>
                            </body>
                        </html>
                    `);
                    doc.close();
                }
            } else {
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

            // Manejar clics en los botones
            const acceptBtn = document.getElementById('accept-btn');
            const rejectBtn = document.getElementById('reject-btn');
            const backBtn = document.getElementById('back-btn');

            if (isEnProceso) {
                acceptBtn.addEventListener('click', async () => {
                    showLoadingSpinner();
                    try {
                        const response = await fetch(`/api/acuerdos/${acuerdoId}/action`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'x-user-email': userEmail
                            },
                            body: JSON.stringify({ action: 'accept' })
                        });

                        if (!response.ok) {
                            throw new Error('Error al aceptar el acuerdo: ' + response.statusText);
                        }

                        const result = await response.json();
                        if (!result.success) {
                            throw new Error(result.message || 'Error al aceptar el acuerdo');
                        }

                        hideLoadingSpinner();
                        showMessage('Acuerdo aceptado exitosamente. Se han enviado notificaciones y correos a las partes.', false);
                        setTimeout(() => renderAcuerdoDetails(acuerdoId), 1000);
                    } catch (error) {
                        hideLoadingSpinner();
                        showMessage('Error al aceptar el acuerdo: ' + error.message);
                    }
                });

                rejectBtn.addEventListener('click', async () => {
                    showLoadingSpinner();
                    try {
                        const response = await fetch(`/api/acuerdos/${acuerdoId}/action`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'x-user-email': userEmail
                            },
                            body: JSON.stringify({ action: 'reject' })
                        });

                        if (!response.ok) {
                            throw new Error('Error al rechazar el acuerdo: ' + response.statusText);
                        }

                        const result = await response.json();
                        if (!result.success) {
                            throw new Error(result.message || 'Error al rechazar el acuerdo');
                        }

                        // Limpiar el iframe del contrato firmado
                        const signedContractPreview = document.getElementById('signed-contract-preview');
                        const doc = signedContractPreview.contentDocument || signedContractPreview.contentWindow.document;
                        doc.open();
                        doc.write(`
                            <html>
                                <body style="font-family: 'Roboto', sans-serif; text-align: center; padding: 20px; color: #666;">
                                    <p>Contrato rechazado. Por favor, sube un nuevo contrato.</p>
                                </body>
                            </html>
                        `);
                        doc.close();

                        hideLoadingSpinner();
                        showMessage('Acuerdo rechazado exitosamente. Se han enviado notificaciones y un correo al arrendatario.', false);
                        setTimeout(() => renderAcuerdoDetails(acuerdoId), 1000);
                    } catch (error) {
                        hideLoadingSpinner();
                        showMessage('Error al rechazar el acuerdo: ' + error.message);
                    }
                });
            }

            backBtn.addEventListener('click', () => {
                renderMyAcuerdos();
            });

            hideLoadingSpinner();
        } catch (error) {
            hideLoadingSpinner();
            showMessage('Error al cargar los detalles del acuerdo: ' + error.message);
        }
    }

    // Renderizar formulario de creación de acuerdo
    async function renderCreateAcuerdoForm() {
        if (!mainContent) {
            console.error('No se encontró #main-content');
            showMessage('Error: No se encontró el contenedor principal.');
            return;
        }

        showLoadingSpinner();

        try {
            const userEmail = localStorage.getItem('currentUserEmail') || '';
            if (!userEmail) {
                throw new Error('No se encontró el email del usuario en localStorage. Por favor, inicia sesión nuevamente.');
            }

            // Obtener publicaciones disponibles
            const publicationsResponse = await fetch('/api/publications/landlord/my-publications?status=available', {
                headers: { 'x-user-email': userEmail }
            });
            if (!publicationsResponse.ok) {
                throw new Error('Error al obtener publicaciones: ' + publicationsResponse.statusText);
            }
            const { publications } = await publicationsResponse.json();

            // Obtener todas las conversaciones
            const conversationsResponse = await fetch('/api/acuerdos/conversations', {
                headers: { 'x-user-email': userEmail }
            });
            if (!conversationsResponse.ok) {
                throw new Error('Error al obtener conversaciones: ' + conversationsResponse.statusText);
            }
            const { conversations } = await conversationsResponse.json();
            console.log('Conversaciones obtenidas:', conversations);

            mainContent.innerHTML = `
                <div class="create-acuerdo-section">
                    <h1>Crear Nuevo Acuerdo de Arrendamiento</h1>
                    <form id="create-acuerdo-form" class="acuerdo-form">
                        <div class="form-group">
                            <label for="publication">Publicación:</label>
                            <select id="publication" name="publication_id" required>
                                <option value="">Selecciona una publicación</option>
                                ${publications.map(pub => `<option value="${pub.id}" data-price="${pub.price}" data-availability="${pub.availability}">${pub.title}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="tenant">Arrendatario:</label>
                            <select id="tenant" name="tenant_email" required disabled>
                                <option value="">Primero selecciona una publicación</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="start_date">Fecha de Inicio:</label>
                            <input type="date" id="start_date" name="start_date" required>
                        </div>
                        <div class="form-group">
                            <label for="end_date">Fecha de Finalización:</label>
                            <input type="date" id="end_date" name="end_date" required>
                        </div>
                        <div class="form-group">
                            <label for="duration_months">Duración (meses):</label>
                            <input type="number" id="duration_months" name="duration_months" readonly>
                        </div>
                        <div class="form-group">
                            <label for="price">Monto Mensual (COP):</label>
                            <input type="number" id="price" name="price" readonly>
                        </div>
                        <div class="form-group">
                            <label for="additional_notes">Notas Adicionales:</label>
                            <textarea id="additional_notes" name="additional_notes" rows="4" placeholder="Escribe cualquier detalle adicional sobre el acuerdo..."></textarea>
                        </div>
                        <div class="form-group">
                            <label>Previsualización del Contrato:</label>
                            <iframe id="contract_preview" style="width: 100%; height: 400px; border: 1px solid #e5e7eb; border-radius: 6px;"></iframe>
                        </div>
                        <div class="form-actions">
                            <button type="submit">Crear Acuerdo</button>
                            <button type="button" id="cancel-btn">Cancelar</button>
                        </div>
                    </form>
                </div>
            `;

            const style = document.createElement('style');
            style.innerHTML = `
                .create-acuerdo-section {
                    max-width: 800px;
                    margin: 2rem auto;
                    padding: 0 1rem;
                }

                .create-acuerdo-section h1 {
                    font-family: 'Roboto', sans-serif;
                    color: #2b6b6b;
                    font-size: 2rem;
                    margin-bottom: 1rem;
                    text-align: center;
                }

                .acuerdo-form {
                    background: #f9fafb;
                    padding: 2rem;
                    border-radius: 8px;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                }

                .form-group {
                    margin-bottom: 1.5rem;
                }

                .form-group label {
                    font-family: 'Roboto', sans-serif;
                    font-size: 0.9rem;
                    color: #333;
                    font-weight: 500;
                    display: block;
                    margin-bottom: 0.5rem;
                }

                .form-group select,
                .form-group input,
                .form-group textarea {
                    width: 100%;
                    padding: 0.5rem;
                    border: 1px solid #e5e7eb;
                    border-radius: 6px;
                    font-family: 'Roboto', sans-serif;
                    font-size: 0.9rem;
                    color: #333;
                    background: #fff;
                    outline: none;
                    transition: border-color 0.3s ease;
                }

                .form-group select:focus,
                .form-group input:focus,
                .form-group textarea:focus {
                    border-color: #2b6b6b;
                }

                .form-group input[readonly],
                .form-group select:disabled {
                    background: #e5e7eb;
                    cursor: not-allowed;
                }

                .form-actions {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                }

                .form-actions button {
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

                .form-actions button:hover {
                    background: linear-gradient(135deg, #4c9f9f, #2b6b6b);
                }

                #cancel-btn {
                    background: #e5e7eb;
                    color: #374151;
                }

                #cancel-btn:hover {
                    background: #d1d5db;
                }

                .navbar a.disabled {
                    pointer-events: none;
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                @media (max-width: 480px) {
                    .form-actions {
                        flex-direction: column;
                    }

                    .form-actions button {
                        width: 100%;
                    }
                }
            `;
            document.head.appendChild(style);

            const form = document.getElementById('create-acuerdo-form');
            const publicationSelect = document.getElementById('publication');
            const tenantSelect = document.getElementById('tenant');
            const startDateInput = document.getElementById('start_date');
            const endDateInput = document.getElementById('end_date');
            const durationInput = document.getElementById('duration_months');
            const priceInput = document.getElementById('price');
            const additionalNotes = document.getElementById('additional_notes');
            const cancelBtn = document.getElementById('cancel-btn');
            const contractPreview = document.getElementById('contract_preview');

            let hasUnsavedChanges = false;

            const doc = contractPreview.contentDocument || contractPreview.contentWindow.document;
            doc.open();
            doc.write(`
                <html>
                    <body style="font-family: 'Roboto', sans-serif; text-align: center; padding: 20px; color: #666;">
                        <h3 style="color: #2b6b6b;">Previsualización del Contrato</h3>
                        <p>Por favor, selecciona una publicación, un arrendatario y completa las fechas para previsualizar el contrato.</p>
                    </body>
                </html>
            `);
            doc.close();

            function updateNavbarState() {
                toggleNavbarLinks(hasUnsavedChanges);
            }

            async function updateTenants(publicationId) {
                if (!publicationId) {
                    tenantSelect.innerHTML = '<option value="">Primero selecciona una publicación</option>';
                    tenantSelect.disabled = true;
                    return;
                }

                try {
                    const filteredConversations = conversations.filter(conv => conv.publication_id == publicationId);
                    const tenantEmails = [...new Set(filteredConversations.map(conv => conv.tenant_email))].filter(email => email !== userEmail);
                    const tenants = tenantEmails.map(email => {
                        const conv = filteredConversations.find(c => c.tenant_email === email);
                        return { email: conv.tenant_email, name: conv.tenant_name || conv.tenant_email };
                    });

                    if (tenants.length === 0) {
                        tenantSelect.innerHTML = '<option value="">No hay arrendatarios disponibles para esta publicación</option>';
                        tenantSelect.disabled = true;
                    } else {
                        tenantSelect.innerHTML = `
                            <option value="">Selecciona un arrendatario</option>
                            ${tenants.map(tenant => `<option value="${tenant.email}">${tenant.name}</option>`).join('')}
                        `;
                        tenantSelect.disabled = false;
                    }

                    await updateContractPreview();
                } catch (error) {
                    console.error('Error al actualizar arrendatarios:', error);
                    tenantSelect.innerHTML = '<option value="">Error al cargar arrendatarios</option>';
                    tenantSelect.disabled = true;
                }
            }

            publicationSelect.addEventListener('change', async () => {
                hasUnsavedChanges = true;
                updateNavbarState();
                const selectedOption = publicationSelect.options[publicationSelect.selectedIndex];
                const publicationId = selectedOption.value;
                const availability = selectedOption.dataset.availability;
                const price = selectedOption.dataset.price;
                priceInput.value = price || '';

                const today = new Date('2025-05-10');
                let minDate = today;

                if (availability === 'futura_1mes') {
                    minDate = new Date(today.setMonth(today.getMonth() + 1));
                } else if (availability === 'futura_3meses') {
                    minDate = new Date(today.setMonth(today.getMonth() + 3));
                }

                startDateInput.value = minDate.toISOString().split('T')[0];
                startDateInput.min = minDate.toISOString().split('T')[0];
                endDateInput.min = new Date(minDate.setMonth(minDate.getMonth() + 1)).toISOString().split('T')[0];
                endDateInput.value = '';

                await updateTenants(publicationId);
            });

            function calculateDuration() {
                const start = new Date(startDateInput.value);
                const end = new Date(endDateInput.value);
                if (start && end && end > start) {
                    const months = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
                    if (months < 1) {
                        endDateInput.value = '';
                        durationInput.value = '';
                        showMessage('La fecha de finalización debe ser al menos un mes después de la fecha de inicio.');
                        return;
                    }
                    durationInput.value = months;
                    hasUnsavedChanges = true;
                    updateNavbarState();
                } else {
                    durationInput.value = '';
                }
            }

            startDateInput.addEventListener('change', async () => {
                const start = new Date(startDateInput.value);
                const minEndDate = new Date(start);
                minEndDate.setMonth(minEndDate.getMonth() + 1);
                endDateInput.min = minEndDate.toISOString().split('T')[0];
                if (endDateInput.value && new Date(endDateInput.value) < minEndDate) {
                    endDateInput.value = minEndDate.toISOString().split('T')[0];
                }
                calculateDuration();
                await updateContractPreview();
            });

            endDateInput.addEventListener('change', async () => {
                calculateDuration();
                await updateContractPreview();
            });

            tenantSelect.addEventListener('change', async () => {
                hasUnsavedChanges = true;
                updateNavbarState();
                await updateContractPreview();
            });

            additionalNotes.addEventListener('input', debounce(async () => {
                hasUnsavedChanges = true;
                updateNavbarState();
                await updateContractPreview();
            }, 500));


            //No tocar
            async function updateContractPreview() {
                const formData = new FormData(form);
                const data = Object.fromEntries(formData);
                if (data.publication_id && data.tenant_email && data.start_date && data.end_date) {
                    const publication = publications.find(p => p.id == data.publication_id);
                    const conversation = conversations.find(c => c.tenant_email === data.tenant_email && c.publication_id == data.publication_id);
                    const tenantName = conversation ? conversation.tenant_name : data.tenant_email;

                    const contractData = {
                        publication_id: data.publication_id,
                        tenant_email: data.tenant_email,
                        price: publication?.price || 0,
                        duration_months: durationInput.value || 0,
                        start_date: data.start_date,
                        end_date: data.end_date,
                        additional_notes: data.additional_notes || '',
                        publication_title: publication?.title || 'Desconocido',
                        tenant_name: tenantName
                    };

                    console.log('Datos enviados a la previsualización:', contractData);

                    try {
                        const response = await fetch('/api/acuerdos/preview', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'x-user-email': userEmail
                            },
                            body: JSON.stringify(contractData)
                        });

                        if (!response.ok) {
                            throw new Error('Error al generar la previsualización: ' + response.statusText);
                        }

                        const pdfBlob = await response.blob();
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
                } else {
                    const doc = contractPreview.contentDocument || contractPreview.contentWindow.document;
                    doc.open();
                    doc.write(`
                        <html>
                            <body style="font-family: 'Roboto', sans-serif; text-align: center; padding: 20px; color: #666;">
                                <h3 style="color: #2b6b6b;">Previsualización del Contrato</h3>
                                <p>Por favor, selecciona una publicación, un arrendatario y completa las fechas para previsualizar el contrato.</p>
                            </body>
                        </html>
                    `);
                    doc.close();
                }
            }

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                showLoadingSpinner();

                try {
                    const formData = new FormData(form);
                    const data = Object.fromEntries(formData);
                    data.duration_months = durationInput.value;
                    console.log('Datos enviados al crear acuerdo:', data);

                    const response = await fetch('/api/acuerdos', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-user-email': userEmail
                        },
                        body: JSON.stringify(data)
                    });

                    const result = await response.json();
                    hideLoadingSpinner();

                    if (!result.success) {
                        throw new Error(result.message || 'Error al crear el acuerdo');
                    }

                    hasUnsavedChanges = false;
                    updateNavbarState();
                    showMessage('Acuerdo creado exitosamente.', false);
                    setTimeout(() => renderMyAcuerdos(), 1500);
                } catch (error) {
                    hideLoadingSpinner();
                    showMessage('Error al crear el acuerdo: ' + error.message);
                }
            });

            cancelBtn.addEventListener('click', () => {
                if (hasUnsavedChanges) {
                    showUnsavedChangesWarning(() => {
                        hasUnsavedChanges = false;
                        updateNavbarState();
                        renderMyAcuerdos();
                    });
                } else {
                    renderMyAcuerdos();
                }
            });

            function showUnsavedChangesWarning(callback) {
                const overlay = document.createElement('div');
                overlay.style.cssText = `
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background-color: rgba(0,0,0,0.5); z-index: 2999; opacity: 0;
                    transition: opacity 0.3s ease;
                `;
                document.body.appendChild(overlay);

                const warningDiv = document.createElement('div');
                warningDiv.style.cssText = `
                    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                    background-color: #fff; padding: 2rem; border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 3000; text-align: center;
                    font-family: 'Roboto', sans-serif; color: #2b6b6b;
                    opacity: 0; transition: opacity 0.3s ease, transform 0.3s ease;
                `;
                warningDiv.innerHTML = `
                    <h3 style="margin-bottom: 1rem;">¡Atención!</h3>
                    <p>¿Estás seguro de que deseas salir? Los cambios no guardados se perderán.</p>
                    <div style="margin-top: 1rem; display: flex; gap: 1rem; justify-content: center;">
                        <button id="exit-btn" style="
                            background: linear-gradient(135deg, #dc2626, #f87171); color: white;
                            border: none; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer;
                            font-weight: 500;
                        ">Salir</button>
                        <button id="cancel-btn-warning" style="
                            background: linear-gradient(135deg, #2b6b6b, #4c9f9f); color: white;
                            border: none; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer;
                            font-weight: 500;
                        ">Cancelar</button>
                    </div>
                `;
                document.body.appendChild(warningDiv);

                setTimeout(() => {
                    overlay.style.opacity = '1';
                    warningDiv.style.opacity = '1';
                }, 10);

                const exitButton = warningDiv.querySelector('#exit-btn');
                const cancelButton = warningDiv.querySelector('#cancel-btn-warning');

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
            }

            window.addEventListener('beforeunload', (event) => {
                if (hasUnsavedChanges) {
                    const message = '¿Estás seguro de que deseas salir? Los cambios no guardados se perderán.';
                    event.preventDefault();
                    event.returnValue = message;
                    return message;
                }
            });

            hideLoadingSpinner();
        } catch (error) {
            hideLoadingSpinner();
            showMessage('Error al cargar el formulario: ' + error.message);
        }
    }

    // Renderizar Formulario para editar el acuerdo
    async function renderEditAcuerdoForm(acuerdoId) {
        if (!mainContent) {
            console.error('No se encontró #main-content');
            showMessage('Error: No se encontró el contenedor principal.');
            return;
        }

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
                throw new Error('Error al obtener el acuerdo: ' + response.statusText);
            }
            const { acuerdo } = await response.json();
            if (!acuerdo) {
                throw new Error('Acuerdo no encontrado.');
            }

            // Función para formatear fechas
            function formatDateForInput(dateString) {
                if (!dateString) return '';
                const date = new Date(dateString);
                if (isNaN(date.getTime())) return '';
                return date.toISOString().split('T')[0];
            }

            mainContent.innerHTML = `
                <div class="edit-acuerdo-section">
                    <h1>Editar Acuerdo de Arrendamiento</h1>
                    <form id="edit-acuerdo-form" class="acuerdo-form">
                        <div class="form-group">
                            <label for="publication">Publicación:</label>
                            <input type="text" id="publication" value="${acuerdo.publication_title}" readonly>
                            <input type="hidden" name="publication_id" value="${acuerdo.publication_id}">
                        </div>
                        <div class="form-group">
                            <label for="tenant">Arrendatario:</label>
                            <input type="text" id="tenant" value="${acuerdo.tenant_name || acuerdo.tenant_email}" readonly>
                            <input type="hidden" name="tenant_email" value="${acuerdo.tenant_email}">
                        </div>
                        <div class="form-group">
                            <label for="start_date">Fecha de Inicio:</label>
                            <input type="date" id="start_date" name="start_date" value="${formatDateForInput(acuerdo.start_date)}" readonly>
                        </div>
                        <div class="form-group">
                            <label for="end_date">Fecha de Finalización:</label>
                            <input type="date" id="end_date" name="end_date" required min="${new Date().toISOString().split('T')[0]}" value="${formatDateForInput(acuerdo.end_date)}">
                        </div>
                        <div class="form-group">
                            <label for="duration_months">Duración (meses):</label>
                            <input type="number" id="duration_months" name="duration_months" value="${acuerdo.duration_months}" readonly>
                        </div>
                        <div class="form-group">
                            <label for="price">Monto Mensual (COP):</label>
                            <input type="number" id="price" name="price" value="${acuerdo.price}" readonly>
                        </div>
                        <div class="form-group">
                            <label for="additional_notes">Notas Adicionales:</label>
                            <textarea id="additional_notes" name="additional_notes" rows="4" placeholder="Escribe cualquier detalle adicional...">${acuerdo.additional_notes || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Previsualización del Contrato:</label>
                            <iframe id="contract_preview" style="width: 100%; height: 400px; border: 1px solid #e5e7eb; border-radius: 6px;"></iframe>
                        </div>
                        <div class="form-actions">
                            <button type="submit">Guardar Cambios</button>
                            <button type="button" id="cancel-btn">Cancelar</button>
                        </div>
                    </form>
                </div>
            `;

            const style = document.createElement('style');
            style.innerHTML = `
                .edit-acuerdo-section {
                    max-width: 800px; margin: 2rem auto; padding: 0 1rem;
                }
                .edit-acuerdo-section h1 {
                    font-family: 'Roboto', sans-serif; color: #2b6b6b; font-size: 2rem; margin-bottom: 1rem; text-align: center;
                }
                .acuerdo-form {
                    background: #f9fafb; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                }
                .form-group {
                    margin-bottom: 1.5rem;
                }
                .form-group label {
                    font-family: 'Roboto', sans-serif; font-size: 0.9rem; color: #333; font-weight: 500; display: block; margin-bottom: 0.5rem;
                }
                .form-group input, .form-group textarea {
                    width: 100%; padding: 0.5rem; border: 1px solid #e5e7eb; border-radius: 6px; font-family: 'Roboto', sans-serif; font-size: 0.9rem; color: #333; background: #fff; outline: none; transition: border-color 0.3s ease;
                }
                .form-group input:focus, .form-group textarea:focus {
                    border-color: #2b6b6b;
                }
                .form-group input[readonly] {
                    background: #e5e7eb; cursor: not-allowed;
                }
                .form-actions {
                    display: flex; gap: 1rem; justify-content: center;
                }
                .form-actions button {
                    background: linear-gradient(135deg, #2b6b6b, #4c9f9f); color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 6px; cursor: pointer; font-family: 'Roboto', sans-serif; font-size: 0.9rem; font-weight: 500;
                }
                .form-actions button:hover {
                    background: linear-gradient(135deg, #4c9f9f, #2b6b6b);
                }
                #cancel-btn {
                    background: #e5e7eb; color: #374151;
                }
                #cancel-btn:hover {
                    background: #d1d5db;
                }
                @media (max-width: 480px) {
                    .form-actions { flex-direction: column; }
                    .form-actions button { width: 100%; }
                }
            `;
            document.head.appendChild(style);

            const form = document.getElementById('edit-acuerdo-form');
            const endDateInput = document.getElementById('end_date');
            const durationInput = document.getElementById('duration_months');
            const additionalNotes = document.getElementById('additional_notes');
            const cancelBtn = document.getElementById('cancel-btn');
            const contractPreview = document.getElementById('contract_preview');

            let hasUnsavedChanges = false;

            // Asegurarse de que userEmail esté definido
            const userEmailValue = localStorage.getItem('currentUserEmail') || '';
            if (!userEmailValue) {
                throw new Error('No se encontró el email del usuario en localStorage.');
            }

            // Función para actualizar la previsualización
            const updateContractPreview = async () => {
                const formData = new FormData(form);
                const data = Object.fromEntries(formData);
                if (data.end_date) {
                    const originalData = {
                        publication_id: acuerdo.publication_id,
                        tenant_email: acuerdo.tenant_email,
                        price: acuerdo.price,
                        duration_months: acuerdo.duration_months,
                        start_date: acuerdo.start_date,
                        end_date: acuerdo.end_date,
                        additional_notes: acuerdo.additional_notes || '',
                        publication_title: acuerdo.publication_title,
                        tenant_name: acuerdo.tenant_name || acuerdo.tenant_email,
                        landlord_name: acuerdo.landlord_name || 'Nombre no disponible',
                        contract_id: acuerdo.contract_id || 'CON' + Math.floor(Math.random() * 1000000)
                    };
                    const contractData = {
                        publication_id: acuerdo.publication_id,
                        tenant_email: acuerdo.tenant_email,
                        price: acuerdo.price,
                        duration_months: parseInt(durationInput.value) || acuerdo.duration_months,
                        start_date: acuerdo.start_date,
                        end_date: data.end_date,
                        additional_notes: data.additional_notes || acuerdo.additional_notes,
                        publication_title: acuerdo.publication_title,
                        tenant_name: acuerdo.tenant_name || acuerdo.tenant_email,
                        landlord_name: acuerdo.landlord_name || 'Nombre no disponible',
                        contract_id: acuerdo.contract_id || 'CON' + Math.floor(Math.random() * 1000000) // Eliminamos el sufijo _EDIT1
                    };

                    console.log('Datos enviados a /preview-edit:', { originalData, contractData });

                    try {
                        const response = await fetch('/api/acuerdos/preview-edit', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'x-user-email': userEmailValue
                            },
                            body: JSON.stringify({ originalData, contractData })
                        });

                        if (!response.ok) {
                            throw new Error('Error al generar la previsualización: ' + response.statusText);
                        }

                        const pdfBlob = await response.blob();
                        const pdfUrl = URL.createObjectURL(pdfBlob);
                        contractPreview.src = pdfUrl;
                    } catch (error) {
                        console.error('Error al generar previsualización:', error);
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
            };

            function calculateDuration() {
                const start = new Date(acuerdo.start_date);
                const end = new Date(endDateInput.value);
                if (start && end && end > start) {
                    const months = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
                    if (months < 1) {
                        endDateInput.value = '';
                        durationInput.value = '';
                        showMessage('La fecha de finalización debe ser al menos un mes después de la fecha de inicio.');
                        return;
                    }
                    durationInput.value = months;
                    hasUnsavedChanges = true;
                    toggleNavbarLinks(true);
                } else {
                    durationInput.value = '';
                }
            }

            endDateInput.addEventListener('change', async () => {
                calculateDuration();
                await updateContractPreview();
            });

            additionalNotes.addEventListener('input', debounce(async () => {
                hasUnsavedChanges = true;
                toggleNavbarLinks(true);
                await updateContractPreview();
            }, 500));

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                showLoadingSpinner();

                try {
                    const formData = new FormData(form);
                    const data = Object.fromEntries(formData);
                    data.duration_months = durationInput.value;

                    const response = await fetch(`/api/acuerdos/${acuerdoId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-user-email': userEmailValue
                        },
                        body: JSON.stringify(data)
                    });

                    const result = await response.json();
                    hideLoadingSpinner();

                    if (!result.success) {
                        throw new Error(result.message || 'Error al actualizar el acuerdo');
                    }

                    hasUnsavedChanges = false;
                    toggleNavbarLinks(false);
                    showMessage('Acuerdo actualizado exitosamente.', false);
                    setTimeout(() => renderMyAcuerdos(), 1500);
                } catch (error) {
                    hideLoadingSpinner();
                    showMessage('Error al actualizar el acuerdo: ' + error.message);
                }
            });

            cancelBtn.addEventListener('click', () => {
                if (hasUnsavedChanges) {
                    showUnsavedChangesWarning(() => {
                        hasUnsavedChanges = false;
                        toggleNavbarLinks(false);
                        renderMyAcuerdos();
                    });
                } else {
                    renderMyAcuerdos();
                }
            });

            window.addEventListener('beforeunload', (event) => {
                if (hasUnsavedChanges) {
                    const message = '¿Estás seguro de que deseas salir? Los cambios no guardados se perderán.';
                    event.preventDefault();
                    event.returnValue = message;
                    return message;
                }
            });

            await updateContractPreview();
            hideLoadingSpinner();
        } catch (error) {
            hideLoadingSpinner();
            showMessage('Error al cargar el formulario: ' + error.message);
        }
    }

    // Renderizar Modal Para cancelar un acuerdo
    function showCancelAgreementModal(acuerdoId, status, publicationId, landlordEmail, tenantEmail, contractId, publicationTitle, startDate, endDate) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background-color: rgba(0,0,0,0.5); z-index: 2999; opacity: 0;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(overlay);

        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background-color: #fff; padding: 2rem; border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 3000; text-align: center;
            font-family: 'Roboto', sans-serif; color: #2b6b6b; max-width: 500px;
            width: 90%; opacity: 0; transition: opacity 0.3s ease, transform 0.3s ease;
        `;
        modal.innerHTML = `
            <h2 style="margin-bottom: 1rem;">Cancelar Acuerdo</h2>
            <p>Por favor, ingresa el motivo de la cancelación (mínimo 20 caracteres):</p>
            <textarea id="cancellation-reason" rows="4" placeholder="Escribe el motivo de cancelación..." style="width: 100%; padding: 0.5rem; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 1rem; resize: vertical;"></textarea>
            <div style="display: flex; gap: 1rem; justify-content: center;">
                <button id="confirm-cancel-btn" style="
                    background: linear-gradient(135deg, #dc2626, #f87171); color: white;
                    border: none; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer;
                    font-weight: 500;
                ">Confirmar Cancelación</button>
                <button id="cancel-modal-btn" style="
                    background: linear-gradient(135deg, #2b6b6b, #4c9f9f); color: white;
                    border: none; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer;
                    font-weight: 500;
                ">Cancelar</button>
            </div>
        `;
        document.body.appendChild(modal);

        setTimeout(() => {
            overlay.style.opacity = '1';
            modal.style.opacity = '1';
        }, 10);

        const confirmBtn = modal.querySelector('#confirm-cancel-btn');
        const cancelBtn = modal.querySelector('#cancel-modal-btn');
        const reasonInput = modal.querySelector('#cancellation-reason');

        confirmBtn.addEventListener('click', async () => {
            const reason = reasonInput.value.trim();
            if (reason.length < 20) {
                showMessage('El motivo de cancelación debe tener al menos 20 caracteres.', true);
                return;
            }

            // Cerrar el modal primero con animación
            overlay.style.opacity = '0';
            modal.style.opacity = '0';
            modal.style.transform = 'translate(-50%, -60%)';

            // Esperar a que la animación de cierre termine (300ms) antes de continuar
            setTimeout(async () => {
                // Eliminar el modal y el overlay del DOM
                document.body.removeChild(overlay);
                document.body.removeChild(modal);

                // Mostrar el spinner de carga
                showLoadingSpinner();

                try {
                    const userEmail = localStorage.getItem('currentUserEmail') || '';
                    const response = await fetch(`/api/acuerdos/${acuerdoId}/cancel`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-user-email': userEmail
                        },
                        body: JSON.stringify({ reason, publicationId, landlordEmail, tenantEmail, contractId, publicationTitle, startDate, endDate })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Error al cancelar el acuerdo.');
                    }

                    const result = await response.json();
                    hideLoadingSpinner();
                    showMessage('Acuerdo cancelado exitosamente.', false);
                    setTimeout(() => renderMyAcuerdos(), 1500); // Refrescar la lista de acuerdos después de mostrar el mensaje
                } catch (error) {
                    hideLoadingSpinner();
                    showMessage('Error al cancelar el acuerdo: ' + error.message, true);
                }
            }, 300); // Coincide con la duración de la transición (0.3s)
        });

        cancelBtn.addEventListener('click', () => {
            overlay.style.opacity = '0';
            modal.style.opacity = '0';
            modal.style.transform = 'translate(-50%, -60%)';
            setTimeout(() => {
                document.body.removeChild(overlay);
                document.body.removeChild(modal);
            }, 300);
        });
    }

    function showUnsavedChangesWarning(callback) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background-color: rgba(0,0,0,0.5); z-index: 2999; opacity: 0;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(overlay);
    
        const warningDiv = document.createElement('div');
        warningDiv.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background-color: #fff; padding: 2rem; border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 3000; text-align: center;
            font-family: 'Roboto', sans-serif; color: #2b6b6b;
            opacity: 0; transition: opacity 0.3s ease, transform 0.3s ease;
        `;
        warningDiv.innerHTML = `
            <h3 style="margin-bottom: 1rem;">¡Atención!</h3>
            <p>¿Estás seguro de que deseas salir? Los cambios no guardados se perderán.</p>
            <div style="margin-top: 1rem; display: flex; gap: 1rem; justify-content: center;">
                <button id="exit-btn" style="
                    background: linear-gradient(135deg, #dc2626, #f87171); color: white;
                    border: none; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer;
                    font-weight: 500;
                ">Salir</button>
                <button id="cancel-btn-warning" style="
                    background: linear-gradient(135deg, #2b6b6b, #4c9f9f); color: white;
                    border: none; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer;
                    font-weight: 500;
                ">Cancelar</button>
            </div>
        `;
        document.body.appendChild(warningDiv);
    
        setTimeout(() => {
            overlay.style.opacity = '1';
            warningDiv.style.opacity = '1';
        }, 10);
    
        const exitButton = warningDiv.querySelector('#exit-btn');
        const cancelButton = warningDiv.querySelector('#cancel-btn-warning');
    
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
    }

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
                <div class="create-acuerdo-intro">
                    <p>Sigue creando tus acuerdos de arrendamiento para gestionar tus propiedades de manera eficiente.</p>
                    <button id="create-acuerdo-btn" class="create-acuerdo-btn">Crear Nuevo Acuerdo</button>
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

            .create-acuerdo-intro {
                text-align: center;
                margin-bottom: 2rem;
                background: #f0f9f9;
                padding: 1rem;
                border-radius: 8px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            }

            .create-acuerdo-intro p {
                font-family: 'Roboto', sans-serif;
                font-size: 1rem;
                color: #333;
                margin-bottom: 1rem;
            }

            .create-acuerdo-btn {
                background: linear-gradient(135deg, #2b6b6b, #4c9f9f);
                color: white;
                border: none;
                padding: 0.8rem 1.5rem;
                border-radius: 8px;
                cursor: pointer;
                font-family: 'Roboto', sans-serif;
                font-size: 1rem;
                font-weight: 500;
                transition: background 0.3s ease, transform 0.2s ease;
            }

            .create-acuerdo-btn:hover {
                background: linear-gradient(135deg, #4c9f9f, #2b6b6b);
                transform: translateY(-2px);
            }

            .create-acuerdo-btn:active {
                transform: translateY(0);
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

        const createBtn = document.getElementById('create-acuerdo-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                console.log('Create Acuerdo Button Clicked');
                renderCreateAcuerdoForm();
            });
        }

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

                // Determinar qué botones habilitar/deshabilitar según el estado
                const isAllDisabled = ['expired', 'cancelled'].includes(acuerdo.status); // Desactivar todos si expired o cancelled
                const isViewOnly = ['pending', 'en_proceso'].includes(acuerdo.status); // Solo Ver Detalles si pending o en_proceso
                const isEditable = acuerdo.status === 'active'; // Todos habilitados si active

                acuerdoCard.innerHTML = `
                    <div class="acuerdo-content">
                        <h3>${acuerdo.publication_title}</h3>
                        <p><strong>Número de Contrato:</strong> ${acuerdo.contract_id}</p>
                        <p><strong>Estado del Contrato:</strong> ${formattedStatus}</p>
                        <p><strong>Arrendatario:</strong> ${acuerdo.tenant_name || 'No disponible'}</p>
                        <p><strong>Duración:</strong> ${acuerdo.duration_months || 'No especificada'} meses</p>
                        <p><strong>Inicio:</strong> ${startDate}</p>
                        <p><strong>Fin:</strong> ${endDate}</p>
                    </div>
                    <div class="acuerdo-actions">
                        <button class="acuerdo-action-btn view" data-id="${acuerdo.id}" ${isAllDisabled ? 'disabled' : ''}>Ver Detalles</button>
                        <button class="acuerdo-action-btn edit" data-id="${acuerdo.id}" ${isAllDisabled || isViewOnly ? 'disabled' : ''}>Editar Acuerdo</button>
                        <button class="acuerdo-action-btn delete" data-id="${acuerdo.id}" ${isAllDisabled || isViewOnly ? 'disabled' : ''}>Eliminar Acuerdo</button>
                    </div>
                `;

                acuerdosList.appendChild(acuerdoCard);

                // Botón Ver Detalles
                const viewBtn = acuerdoCard.querySelector('.view');
                if (viewBtn) {
                    viewBtn.addEventListener('click', () => {
                        console.log(`Clic en "Ver Detalles" para el acuerdo ${acuerdo.id}`);
                        renderAcuerdoDetails(acuerdo.id);
                    });
                }

                // Botón Editar
                const editBtn = acuerdoCard.querySelector('.edit');
                if (editBtn) {
                    editBtn.addEventListener('click', () => {
                        console.log(`Clic en "Editar Acuerdo" para el acuerdo ${acuerdo.id}`);
                        renderEditAcuerdoForm(acuerdo.id);
                    });
                }

                // Botón Eliminar
        const deleteBtn = acuerdoCard.querySelector('.delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                console.log(`Clic en "Eliminar Acuerdo" para el acuerdo ${acuerdo.id}`);
                showCancelAgreementModal(acuerdo.id, acuerdo.status, acuerdo.publication_id, acuerdo.landlord_email, acuerdo.tenant_email, acuerdo.contract_id, acuerdo.publication_title, acuerdo.start_date_formatted, acuerdo.end_date_formatted);
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

// Nuevo Bloque para reseñar a Arrendatarios.
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
    async function renderTenantReviews() {
        if (!mainContent) {
            console.error('No se encontró #main-content');
            showMessage('Error: No se encontró el contenedor principal.');
            return;
        }

        showFullScreenSpinner();

        try {
            mainContent.innerHTML = `
                <div class="tenant-reviews-section" id="tenant-reviews-section">
                    <h1>Reseñas de Arrendatarios</h1>
                    <div class="search-section">
                        <input type="text" id="tenantSearch" placeholder="Buscar por nombre...">
                        <button id="searchBtn">Buscar</button>
                        <button id="resetBtn">Limpiar</button>
                    </div>
                    <div class="info-section">
                        <p>¿Quieres conocer tus comentarios y calificación en ArrendFacil? Conócelo aquí.</p>
                        <button class="tenant-action-btn view-my-details">Conocer</button>
                    </div>
                    <div class="tenants-list" id="tenants-list"></div>
                    <div class="pagination" id="pagination"></div>
                </div>
            `;

            const style = document.createElement('style');
            style.innerHTML = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .tenant-reviews-section { max-width: 1200px; margin: 2rem auto; padding: 0 1rem; }
                .tenant-reviews-section h1 { font-family: 'Roboto', sans-serif; color: #2b6b6b; font-size: 2rem; margin-bottom: 1rem; text-align: center; }
                .search-section { margin-bottom: 2rem; display: flex; justify-content: center; gap: 0.5rem; }
                .search-section input { width: 100%; max-width: 400px; padding: 0.8rem; border: 1px solid #e5e7eb; border-radius: 6px; font-family: 'Roboto', sans-serif; font-size: 1rem; color: #333; background: #fff; outline: none; transition: border-color 0.3s ease, box-shadow 0.3s ease; }
                .search-section input:focus { border-color: #2b6b6b; box-shadow: 0 0 5px rgba(43, 107, 107, 0.3); }
                .search-section button { background: linear-gradient(135deg, #2b6b6b, #4c9f9f); color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 6px; cursor: pointer; font-family: 'Roboto', sans-serif; font-size: 1rem; font-weight: 500; transition: background 0.3s ease, transform 0.2s ease; }
                .search-section button:hover { background: linear-gradient(135deg, #4c9f9f, #2b6b6b); transform: translateY(-2px); }
                #resetBtn { background: #e5e7eb; color: #374151; }
                #resetBtn:hover { background: #d1d5db; }
                .info-section { margin-bottom: 2rem; display: flex; justify-content: center; align-items: center; gap: 1rem; background: #f0f9f9; padding: 1rem; border-radius: 8px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); }
                .info-section p { font-family: 'Roboto', sans-serif; color: #333; font-size: 1rem; margin: 0; }
                .info-section .tenant-action-btn { background: linear-gradient(135deg, #2b6b6b, #4c9f9f); color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-family: 'Roboto', sans-serif; font-size: 0.85rem; font-weight: 500; transition: background 0.3s ease, transform 0.2s ease; }
                .info-section .tenant-action-btn:hover { background: linear-gradient(135deg, #4c9f9f, #2b6b6b); transform: translateY(-2px); }
                .tenants-list { display: flex; flex-direction: column; gap: 1rem; }
                .tenant-card { display: flex; align-items: center; background: #fff; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); padding: 1rem; transition: transform 0.3s ease, box-shadow 0.3s ease; }
                .tenant-card:hover { transform: translateY(-5px); box-shadow: 0 6px 15px rgba(0,0,0,0.15); }
                .tenant-image { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; margin-right: 1rem; transition: transform 0.3s ease; }
                .tenant-card:hover .tenant-image { transform: scale(1.1); }
                .tenant-info { flex: 1; }
                .tenant-info h3 { font-family: 'Roboto', sans-serif; font-size: 1.25rem; font-weight: 600; color: #333; margin: 0 0 0.5rem 0; }
                .tenant-info p { font-family: 'Roboto', sans-serif; font-size: 0.9rem; color: #666; margin: 0.3rem 0; }
                .tenant-action-btn { background: linear-gradient(135deg, #2b6b6b, #4c9f9f); color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-family: 'Roboto', sans-serif; font-size: 0.85rem; font-weight: 500; transition: background 0.3s ease, transform 0.2s ease, opacity 0.3s ease; }
                .tenant-action-btn:hover { background: linear-gradient(135deg, #4c9f9f, #2b6b6b); transform: translateY(-2px); }
                .tenant-action-btn:disabled { background: #cccccc; cursor: not-allowed; opacity: 0.6; transform: none; }
                .no-tenants { text-align: center; padding: 2rem; font-family: 'Roboto', sans-serif; color: #555; }
                .no-tenants span { font-size: 2rem; display: block; margin-bottom: 1rem; }
                .no-tenants.error { color: #dc2626; }
                .pagination { display: flex; justify-content: center; gap: 10px; margin: 20px 0; }
                .pagination button { padding: 8px 12px; border: 1px solid #ccc; background-color: #fff; cursor: pointer; transition: background 0.3s ease, transform 0.2s ease; }
                .pagination button.active { background-color: #007bff; color: white; border-color: #007bff; }
                .pagination button:hover { background-color: #e6f0ff; transform: scale(1.05); }
                .tenant-details { max-width: 900px; margin: 2rem auto; padding: 2rem; background: linear-gradient(145deg, #ffffff, #f0f4f8); border-radius: 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.15); overflow-y: hidden; }
                .tenant-header { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem; }
                .tenant-profile-pic { width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 3px solid #2b6b6b; box-shadow: 0 4px 10px rgba(0,0,0,0.1); transition: transform 0.3s ease; }
                .tenant-header:hover .tenant-profile-pic { transform: rotate(5deg); }
                .tenant-header-info { flex: 1; }
                .tenant-header h2 { font-family: 'Roboto', sans-serif; color: #2b6b6b; font-size: 2.2rem; margin: 0; }
                .tenant-header p { font-family: 'Roboto', sans-serif; color: #666; font-size: 1rem; margin: 0.5rem 0 0; }
                .tenant-details-section { margin-bottom: 2rem; background: #fff; padding: 1.5rem; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
                .tenant-details-section h3 { font-family: 'Roboto', sans-serif; color: #333; font-size: 1.6rem; margin-bottom: 1rem; border-bottom: 2px solid #2b6b6b; padding-bottom: 0.5rem; }
                .tenant-details-section ul.active-contracts { max-height: 200px; overflow-y: auto; }
                .tenant-details-section ul.comments { max-height: 200px; overflow-y: auto; }
                .tenant-details-section ul { list-style-type: none; padding: 0; }
                .tenant-details-section li { padding: 0.75rem; background: #f9f9f9; border-radius: 8px; margin-bottom: 0.5rem; font-family: 'Roboto', sans-serif; font-size: 1rem; color: #444; transition: background 0.3s ease; }
                .tenant-details-section li:hover { background: #f0f0f0; }
                .comment-details { font-size: 0.9rem; color: #888; margin-top: 0.3rem; }
                .stars { color: #f5c518; font-size: 1.4em; margin-top: 0.5rem; }
                .tenant-actions { display: flex; justify-content: center; gap: 1rem; margin-top: 2rem; transition: opacity 0.4s ease; }
                .tenant-action-btn.review { background: linear-gradient(135deg, #ff6b6b, #ff8e8e); }
                .tenant-action-btn.review:hover { background: linear-gradient(135deg, #ff8e8e, #ff6b6b); }
                .tenant-action-btn.review:disabled:hover { background: #cccccc; transform: none; }
                @media (max-width: 768px) { 
                    .tenant-card { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
                    .tenant-image { width: 50px; height: 50px; }
                    .tenant-action-btn { width: 100%; text-align: center; }
                    .search-section { flex-direction: column; align-items: center; gap: 0.5rem; }
                    .search-section input { max-width: 100%; }
                    .search-section button { width: 100%; max-width: 400px; }
                    .tenant-details { padding: 1.5rem; }
                    .tenant-header { flex-direction: column; align-items: flex-start; }
                    .tenant-profile-pic { width: 100px; height: 100px; }
                    .tenant-header h2 { font-size: 1.8rem; }
                    .tenant-details-section h3 { font-size: 1.4rem; }
                    .tenant-details-section ul.active-contracts { max-height: 150px; }
                    .tenant-details-section ul.comments { max-height: 150px; }
                }
                @media (max-width: 480px) { 
                    .tenant-reviews-section h1 { font-size: 1.5rem; }
                    .tenant-info h3 { font-size: 1.1rem; }
                    .tenant-info p { font-size: 0.85rem; }
                    .tenant-action-btn { padding: 0.4rem 0.8rem; font-size: 0.8rem; }
                    .tenant-details { padding: 1rem; }
                    .tenant-header h2 { font-size: 1.5rem; }
                    .tenant-details-section h3 { font-size: 1.2rem; }
                    .tenant-details-section li { padding: 0.5rem; font-size: 0.9rem; }
                    .tenant-profile-pic { width: 80px; height: 80px; }
                    .tenant-details-section ul.active-contracts { max-height: 120px; }
                    .tenant-details-section ul.comments { max-height: 120px; }
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

            async function loadTenants(page = 1, searchQuery = '') {
                const tenantsList = document.getElementById('tenants-list');
                const pagination = document.getElementById('pagination');
                if (!tenantsList || !pagination) {
                    console.error('No se encontraron contenedores para tenants o paginación');
                    hideLoadingSpinner();
                    return;
                }

                lastSearchQuery = searchQuery;

                try {
                    const url = searchQuery
                        ? `/api/ratings/tenants/search?q=${encodeURIComponent(searchQuery)}&page=${page}&limit=${limit}`
                        : `/api/ratings/tenants?page=${page}&limit=${limit}`;
                    
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'x-user-email': localStorage.getItem('currentUserEmail') || ''
                        }
                    });

                    if (!response.ok) {
                        throw new Error('Error al cargar arrendatarios');
                    }

                    const data = await response.json();
                    if (!data.success) {
                        throw new Error(data.message);
                    }

                    tenantsList.innerHTML = '';
                    data.tenants.forEach(tenant => {
                        const tenantCard = document.createElement('div');
                        tenantCard.className = 'tenant-card';
                        const hasActiveContracts = tenant.activeContractsWithMe ? 'Sí' : 'No';
                        tenantCard.innerHTML = `
                            <img src="${tenant.profile_picture || '/img/default-profile.png'}" alt="${tenant.full_name}" class="tenant-image">
                            <div class="tenant-info">
                                <h3>${tenant.full_name}</h3>
                                <p><strong>Contratos Activos conmigo:</strong> ${hasActiveContracts}</p>
                            </div>
                            <button class="tenant-action-btn view-details" data-email="${tenant.tenant_email}">Ver Detalles</button>
                        `;
                        tenantsList.appendChild(tenantCard);
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
                                loadTenants(i, lastSearchQuery);
                            });
                            pagination.appendChild(pageBtn);
                        }
                    }

                    document.querySelectorAll('.view-details').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const email = btn.getAttribute('data-email');
                            loadTenantDetails(email);
                        });
                    });

                    if (data.tenants.length === 0) {
                        tenantsList.innerHTML = `
                            <div class="no-tenants">
                                <span>📋</span>
                                <p>No se encontraron arrendatarios con los criterios seleccionados.</p>
                            </div>
                        `;
                    }
                } catch (error) {
                    console.error('Error:', error.message);
                    tenantsList.innerHTML = `
                        <div class="no-tenants error">
                            <p>Error al cargar arrendatarios: ${error.message}</p>
                        </div>
                    `;
                }
                hideLoadingSpinner();
            }

            async function loadTenantDetails(email) {
                const reviewsSection = document.getElementById('tenant-reviews-section');
                if (!reviewsSection) {
                    console.error('No se encontró el contenedor de la sección de reseñas');
                    hideLoadingSpinner();
                    return;
                }

                showFullScreenSpinner();

                try {
                    const response = await fetch(`/api/ratings/tenants/${email}`, {
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
                    const reviewableContracts = tenant.expiredContracts
                        ? tenant.expiredContracts.filter(contract =>
                            !tenant.recentComments.some(comment => comment.contract_id === contract.contract_id)
                        )
                        : [];
                    const canReview = reviewableContracts.length > 0;

                    reviewsSection.innerHTML = `
                        <div class="tenant-details">
                            <div class="tenant-header">
                                <img src="${tenant.profile_picture || '/img/default-profile.png'}" alt="${tenant.full_name}" class="tenant-profile-pic">
                                <div class="tenant-header-info">
                                    <h2>${tenant.full_name}</h2>
                                    <p>Email: ${tenant.email || email}</p>
                                </div>
                            </div>
                            <div class="tenant-details-section">
                                <h3>Contratos Activos</h3>
                                <ul class="active-contracts">
                                    ${tenant.activeContracts.length ? tenant.activeContracts.map(contract => `
                                        <li>Contrato #${contract.contract_id}: ${contract.title} (Inicio: ${new Date(contract.start_date).toLocaleDateString('es-CO')} - Fin: ${new Date(contract.end_date).toLocaleDateString('es-CO')})</li>
                                    `).join('') : '<li>No tiene contratos activos.</li>'}
                                </ul>
                            </div>
                            <div class="tenant-details-section rating-section">
                                <h3>Calificación Promedio</h3>
                                <p class="rating-text">Calificación: ${tenant.averageRating || 0} / 5 (${tenant.ratingCount || 0} reseñas)</p>
                                <div class="stars">${'★'.repeat(Math.round(tenant.averageRating || 0))}${'☆'.repeat(5 - Math.round(tenant.averageRating || 0))}</div>
                            </div>
                            <div class="tenant-details-section">
                                <h3>Últimos Comentarios</h3>
                                <ul class="comments">
                                    ${tenant.recentComments.length ? tenant.recentComments.map(comment => `
                                        <li><strong>${comment.landlord_name}</strong> (${new Date(comment.created_at).toLocaleDateString('es-CO')}): ${comment.comment || 'Sin comentario'}
                                            <div class="comment-details">Publicación: ${comment.publication_title || 'No disponible'} | Contrato: #${comment.contract_id || 'No disponible'}</div>
                                        </li>
                                    `).join('') : '<li>No hay comentarios.</li>'}
                                </ul>
                            </div>
                            <div class="tenant-actions">
                                <button class="tenant-action-btn back">Volver</button>
                                <button class="tenant-action-btn review" data-email="${tenant.email || email}" ${!canReview ? 'disabled' : ''} title="${!canReview ? 'No hay contratos finalizados sin reseñar' : 'Reseñar Arrendatario'}">Reseñar Arrendatario</button>
                            </div>
                            <div class="review-modal" id="reviewModal">
                                <div class="review-modal-content">
                                    <button class="close-btn">×</button>
                                    <h3>Reseñar Arrendatario</h3>
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
                        renderTenantReviews();
                        loadTenants(currentPage, lastSearchQuery);
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
                                const response = await fetch(`/api/ratings/tenants/${tenant.email || email}/rate`, {
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

                                const updatedResponse = await fetch(`/api/ratings/tenants/${tenant.email || email}`, {
                                    method: 'GET',
                                    headers: {
                                        'x-user-email': localStorage.getItem('currentUserEmail') || ''
                                    }
                                });
                                const updatedData = await updatedResponse.json();
                                if (updatedData.success) {
                                    tenant.recentComments = updatedData.tenant.recentComments;
                                    tenant.averageRating = updatedData.tenant.averageRating;
                                    tenant.ratingCount = updatedData.tenant.ratingCount;
                                    tenant.expiredContracts = updatedData.tenant.expiredContracts;

                                    const commentsSection = document.querySelector('.tenant-details-section:nth-child(4) ul');
                                    if (commentsSection) {
                                        commentsSection.innerHTML = updatedData.tenant.recentComments.length ? updatedData.tenant.recentComments.map(comment => `
                                            <li><strong>${comment.landlord_name}</strong> (${new Date(comment.created_at).toLocaleDateString('es-CO')}): ${comment.comment || 'Sin comentario'}
                                                <div class="comment-details">Publicación: ${comment.publication_title || 'No disponible'} | Contrato: #${comment.contract_id || 'No disponible'}</div>
                                            </li>
                                        `).join('') : '<li>No hay comentarios.</li>';
                                    }

                                    const ratingSection = document.querySelector('.rating-section');
                                    if (ratingSection) {
                                        const newAverageRating = updatedData.tenant.averageRating || 0;
                                        const newRatingCount = updatedData.tenant.ratingCount || 0;
                                        ratingSection.querySelector('.rating-text').textContent = `Calificación: ${newAverageRating} / 5 (${newRatingCount} reseñas)`;
                                        ratingSection.querySelector('.stars').innerHTML = '★'.repeat(Math.round(newAverageRating)) + '☆'.repeat(5 - Math.round(newAverageRating));
                                    }

                                    const tenantActions = document.querySelector('.tenant-actions');
                                    if (tenantActions) {
                                        tenantActions.style.opacity = '0';
                                        setTimeout(() => {
                                            loadTenantDetails(email);
                                            tenantActions.style.opacity = '1';
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
                    console.error('Error en loadTenantDetails:', error.message);
                    reviewsSection.innerHTML = `
                        <div class="no-tenants error">
                            <p>Error al cargar detalles: ${error.message}</p>
                            <div class="tenant-actions">
                                <button class="tenant-action-btn back">Volver</button>
                            </div>
                        </div>
                    `;
                    document.querySelector('.back').addEventListener('click', () => {
                        renderTenantReviews();
                        loadTenants(currentPage, lastSearchQuery);
                    });
                }
                hideLoadingSpinner();
            }

            const tenantSearch = document.getElementById('tenantSearch');
            const searchBtn = document.getElementById('searchBtn');
            const resetBtn = document.getElementById('resetBtn');

            searchBtn.addEventListener('click', () => {
                currentPage = 1;
                loadTenants(currentPage, tenantSearch.value);
            });

            tenantSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    currentPage = 1;
                    loadTenants(currentPage, tenantSearch.value);
                }
            });

            resetBtn.addEventListener('click', () => {
                tenantSearch.value = '';
                currentPage = 1;
                loadTenants(currentPage, '');
            });

            const viewMyDetailsBtn = document.querySelector('.view-my-details');
            viewMyDetailsBtn.addEventListener('click', () => {
                loadLandlordDetails();
            });

            async function loadLandlordDetails() {
                const reviewsSection = document.getElementById('tenant-reviews-section');
                if (!reviewsSection) {
                    console.error('No se encontró el contenedor de la sección de reseñas');
                    hideLoadingSpinner();
                    return;
                }

                showFullScreenSpinner();

                try {
                    const response = await fetch(`/api/ratings/landlord/me`, {
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

                    reviewsSection.innerHTML = `
                        <div class="tenant-details">
                            <div class="tenant-header">
                                <img src="${landlord.profile_picture || '/img/default-profile.png'}" alt="${landlord.full_name}" class="tenant-profile-pic">
                                <div class="tenant-header-info">
                                    <h2>${landlord.full_name}</h2>
                                    <p>Email: ${landlord.email}</p>
                                </div>
                            </div>
                            <div class="tenant-details-section rating-section">
                                <h3>Calificación Promedio</h3>
                                <p class="rating-text">Calificación: ${landlord.averageRating || 0} / 5 (${landlord.ratingCount || 0} reseñas)</p>
                                <div class="stars">${'★'.repeat(Math.round(landlord.averageRating || 0))}${'☆'.repeat(5 - Math.round(landlord.averageRating || 0))}</div>
                            </div>
                            <div class="tenant-details-section">
                                <h3>Últimos Comentarios</h3>
                                <ul class="comments">
                                    ${landlord.recentComments.length ? landlord.recentComments.map(comment => `
                                        <li><strong>${comment.tenant_name}</strong> (${new Date(comment.created_at).toLocaleDateString('es-CO')}): ${comment.comment || 'Sin comentario'}
                                            <div class="comment-details">Publicación: ${comment.publication_title || 'No disponible'} | Contrato: #${comment.contract_id || 'No disponible'}</div>
                                        </li>
                                    `).join('') : '<li>No hay comentarios.</li>'}
                                </ul>
                            </div>
                            <div class="tenant-actions">
                                <button class="tenant-action-btn back">Volver</button>
                            </div>
                        </div>
                    `;

                    document.querySelector('.back').addEventListener('click', () => {
                        renderTenantReviews();
                        loadTenants(currentPage, lastSearchQuery);
                    });
                } catch (error) {
                    console.error('Error en loadLandlordDetails:', error.message);
                    reviewsSection.innerHTML = `
                        <div class="no-tenants error">
                            <p>Error al cargar detalles: ${error.message}</p>
                            <div class="tenant-actions">
                                <button class="tenant-action-btn back">Volver</button>
                            </div>
                        </div>
                    `;
                    document.querySelector('.back').addEventListener('click', () => {
                        renderTenantReviews();
                        loadTenants(currentPage, lastSearchQuery);
                    });
                }
                hideLoadingSpinner();
            }

            loadTenants();
        } catch (error) {
            hideLoadingSpinner();
            showMessage('Error al cargar las reseñas: ' + error.message);
        }
    }

    if (comunidadLink) {
        comunidadLink.addEventListener('click', (event) => {
            event.preventDefault();
            console.log('Clic en el enlace de "Comunidad"');
            renderTenantReviews();
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
    // Check if user is authenticated on page load
    const userEmail = localStorage.getItem('currentUserEmail');
    if (!userEmail) {
        window.location.replace('/login');
        return; // Stop further execution
    }

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