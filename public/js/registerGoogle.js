document.addEventListener('DOMContentLoaded', function () {
    // --- Referencias al DOM ---
    const authAnimation = document.getElementById('authAnimation');
    const registerLeft = document.getElementById('registerLeft');
    const registerRight = document.getElementById('registerRight');
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    const googleForm = document.getElementById('googleForm');
    const registerGoogleForm = document.getElementById('registerGoogleForm');
    const googleError = document.getElementById('googleError');

    // --- Función para mostrar la animación ---
    const showAnimation = (callback) => {
        if (authAnimation) {
            authAnimation.style.display = 'flex';
            authAnimation.style.opacity = '1';
        }
        if (registerLeft) {
            registerLeft.style.display = 'none';
            registerLeft.style.opacity = '0';
        }
        if (registerRight) {
            registerRight.style.display = 'none';
            registerRight.style.opacity = '0';
        }
        setTimeout(() => {
            if (authAnimation) authAnimation.style.opacity = '0';
            setTimeout(() => {
                if (authAnimation) authAnimation.style.display = 'none';
                if (callback) callback();
            }, 500);
        }, 4000);
    };

    // --- Función para mostrar mensaje de error ---
    const showErrorMessage = (message) => {
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
        setTimeout(() => {
            errorDiv.style.opacity = '1';
            errorDiv.style.transform = 'translate(-50%, -50%)';
        }, 10);
    };

    // --- Prevenir retroceso del navegador ---
    history.pushState(null, null, location.href);
    window.onpopstate = function () {
        showErrorMessage('Uy, esto no se puede hacer :D');
        history.pushState(null, null, location.href);
    };

    // --- Tooltip para el Rol ---
    const helpIcon = document.getElementById('role-help-icon');
    const tooltip = document.getElementById('role-tooltip');
    let timeoutId = null;

    if (helpIcon && tooltip) {
        const hideTooltip = () => {
            tooltip.style.display = 'none';
            helpIcon.classList.remove('active');
        };

        const showTooltip = (event) => {
            event.stopPropagation();
            if (timeoutId) clearTimeout(timeoutId);
            tooltip.style.display = 'block';
            helpIcon.classList.add('active');
            timeoutId = setTimeout(hideTooltip, 3000);
        };

        helpIcon.addEventListener('click', showTooltip);
        helpIcon.addEventListener('touchstart', showTooltip);

        document.addEventListener('click', (event) => {
            if (!helpIcon.contains(event.target) && !tooltip.contains(event.target)) {
                hideTooltip();
                if (timeoutId) clearTimeout(timeoutId);
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                hideTooltip();
                if (timeoutId) clearTimeout(timeoutId);
            }
        });
    } else {
        console.error('Help icon or tooltip not found in DOM');
    }

    // --- Validación del Número de Teléfono ---
    const countryCodeSelect = document.getElementById('country-code');
    const phoneInput = document.getElementById('phone');
    const phoneError = document.getElementById('phone-error');

    if (countryCodeSelect && phoneInput && phoneError) {
        const updatePhoneInputLimit = () => {
            const selectedOption = countryCodeSelect.options[countryCodeSelect.selectedIndex];
            const maxDigits = parseInt(selectedOption.getAttribute('data-max-digits'), 10);
            phoneInput.setAttribute('maxlength', maxDigits);
            validatePhoneNumber();
        };

        const validatePhoneNumber = () => {
            const selectedOption = countryCodeSelect.options[countryCodeSelect.selectedIndex];
            const maxDigits = parseInt(selectedOption.getAttribute('data-max-digits'), 10);
            const phoneNumber = phoneInput.value.replace(/\D/g, '');
            const digitCount = phoneNumber.length;

            if (!phoneNumber) {
                phoneError.style.display = 'none';
                return;
            }

            phoneError.style.display =
                digitCount < maxDigits
                    ? 'block'
                    : digitCount > maxDigits
                    ? 'block'
                    : 'none';
            phoneError.textContent =
                digitCount < maxDigits
                    ? 'Faltan dígitos'
                    : digitCount > maxDigits
                    ? 'Te pasaste de dígitos'
                    : '';

            console.log(`Phone digits: ${digitCount}, Max digits: ${maxDigits}`);
        };

        countryCodeSelect.addEventListener('change', updatePhoneInputLimit);
        phoneInput.addEventListener('input', validatePhoneNumber);
        updatePhoneInputLimit();
    } else {
        console.error('Phone-related elements not found in DOM');
    }

    // --- Manejar el inicio de sesión con Google ---
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', () => {
            // Redirigir al endpoint del servidor para iniciar el flujo de OAuth con Google
            window.location.href = '/api/auth/google';
        });
    }

    // --- Verificar si hay datos de Google en la URL (callback de Google) ---
    const urlParams = new URLSearchParams(window.location.search);
    console.log('Query parameters:', Object.fromEntries(urlParams));
    const success = urlParams.get('success') === 'true';
    const email = urlParams.get('email');
    const googleId = urlParams.get('googleId');
    const error = urlParams.get('error');
    let googleUserData = null;

    if (urlParams.has('success')) {
        console.log('Processing callback with success:', success, 'email:', email, 'googleId:', googleId, 'error:', error);
        // Mostrar animación mientras se procesa el callback
        showAnimation(() => {
            if (success && email && googleId) {
                googleUserData = { email, googleId };

                // Verificar si el correo ya existe
                fetch('/api/auth/check-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: googleUserData.email })
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Error ${response.status}: ${response.statusText}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        if (!data.success) {
                            throw new Error(data.message || 'Error al verificar el correo');
                        }

                        if (data.exists) {
                            // Si el correo ya existe, mostrar el mensaje de error y el botón de Google
                            googleError.textContent = 'Este correo ya está registrado. Por favor, usa otro correo.';
                            googleError.style.display = 'block';
                            if (googleSignInBtn) googleSignInBtn.style.display = 'block'; // Mostrar el botón
                            if (googleForm) googleForm.style.display = 'none'; // Ocultar el formulario
                        } else {
                            // Si el correo no existe, ocultar el botón y mostrar el formulario
                            if (googleSignInBtn) googleSignInBtn.style.display = 'none'; // Ocultar el botón
                            if (googleForm) googleForm.style.display = 'block'; // Mostrar el formulario
                        }

                        // Mostrar las secciones izquierda y derecha
                        if (registerLeft) {
                            registerLeft.style.display = 'block';
                            registerLeft.style.opacity = '1';
                        }
                        if (registerRight) {
                            registerRight.style.display = 'flex';
                            registerRight.style.opacity = '1';
                        }

                        // Limpiar los query params de la URL
                        window.history.replaceState({}, document.title, '/registerGoogle');
                    })
                    .catch(error => {
                        console.error('Error durante la autenticación con Google:', error);
                        googleError.textContent = error.message || 'Ocurrió un error al autenticar con Google. Por favor, intenta nuevamente.';
                        googleError.style.display = 'block';
                        if (googleSignInBtn) googleSignInBtn.style.display = 'block'; // Mostrar el botón en caso de error
                        if (googleForm) googleForm.style.display = 'none'; // Ocultar el formulario
                        if (registerLeft) {
                            registerLeft.style.display = 'block';
                            registerLeft.style.opacity = '1';
                        }
                        if (registerRight) {
                            registerRight.style.display = 'flex';
                            registerRight.style.opacity = '1';
                        }
                    });
            } else {
                // Mostrar error si la autenticación con Google falló
                googleError.textContent = error || 'Ocurrió un error al autenticar con Google. Por favor, intenta nuevamente.';
                googleError.style.display = 'block';
                if (googleSignInBtn) googleSignInBtn.style.display = 'block'; // Mostrar el botón
                if (googleForm) googleForm.style.display = 'none'; // Ocultar el formulario
                if (registerLeft) {
                    registerLeft.style.display = 'block';
                    registerLeft.style.opacity = '1';
                }
                if (registerRight) {
                    registerRight.style.display = 'flex';
                    registerRight.style.opacity = '1';
                }

                // Limpiar los query params de la URL
                window.history.replaceState({}, document.title, '/registerGoogle');
            }
        });
    } else {
        // Si no hay callback (acceso directo a la página), mostrar el botón de Google
        showAnimation(() => {
            if (googleSignInBtn) googleSignInBtn.style.display = 'block'; // Mostrar el botón
            if (googleForm) googleForm.style.display = 'none'; // Ocultar el formulario
            if (registerLeft) {
                registerLeft.style.display = 'block';
                registerLeft.style.opacity = '1';
            }
            if (registerRight) {
                registerRight.style.display = 'flex';
                registerRight.style.opacity = '1';
            }
        });
    }

    // --- Validación y envío del formulario de registro con Google ---
    if (registerGoogleForm) {
        registerGoogleForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            let hasErrors = false;

            const elements = {
                fullName: document.getElementById('full-name'),
                phone: document.getElementById('phone'),
                countryCodeSelect: document.getElementById('country-code'),
                rol: document.getElementById('rol'),
            };

            const errors = {
                fullNameError: document.getElementById('full-name-error'),
                phoneError: document.getElementById('phone-error'),
                rolError: document.getElementById('rol-error'),
            };

            // Limpiar errores previos
            Object.values(errors).forEach((element) => {
                element.style.display = 'none';
                element.textContent = '';
            });

            // Validación de campos
            if (!elements.fullName.value.trim()) {
                errors.fullNameError.textContent = 'El nombre y apellido no puede estar vacío';
                errors.fullNameError.style.display = 'block';
                hasErrors = true;
            }

            const maxDigits = parseInt(
                elements.countryCodeSelect.options[elements.countryCodeSelect.selectedIndex].getAttribute(
                    'data-max-digits'
                ),
                10
            );
            const phoneNumber = elements.phone.value.replace(/\D/g, '');
            if (!phoneNumber) {
                errors.phoneError.textContent = 'El número de teléfono no puede estar vacío';
                errors.phoneError.style.display = 'block';
                hasErrors = true;
            } else if (phoneNumber.length !== maxDigits) {
                errors.phoneError.textContent = `El número debe tener ${maxDigits} dígitos`;
                errors.phoneError.style.display = 'block';
                hasErrors = true;
            }

            if (!elements.rol.value) {
                errors.rolError.textContent = 'Debes seleccionar un rol';
                errors.rolError.style.display = 'block';
                hasErrors = true;
            }

            if (!hasErrors && googleUserData) {
                try {
                    const userData = {
                        fullName: elements.fullName.value.trim(),
                        email: googleUserData.email,
                        role: elements.rol.value,
                        phoneNumber: elements.countryCodeSelect.value + elements.phone.value.trim(),
                        googleId: googleUserData.googleId,
                    };

                    // Enviar datos al servidor para registrar al usuario
                    const response = await fetch('/api/auth/register-google', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(userData)
                    });

                    const data = await response.json();
                    if (data.success) {
                        localStorage.setItem('isRegistered', 'true');
                        localStorage.setItem('currentUserEmail', userData.email);

                        // Enviar solicitud de correo de bienvenida (sin esperar)
                        fetch('/api/auth/send-welcome-email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: userData.email, role: userData.role })
                        })
                            .then(response => response.json())
                            .then(welcomeData => {
                                if (!welcomeData.success) {
                                    console.error('Error al programar correo de bienvenida:', welcomeData.message);
                                }
                            })
                            .catch(error => {
                                console.error('Error al programar correo de bienvenida:', error);
                            });

                        // Redirigir según el rol
                        const redirectPage = userData.role === 'arrendador' ? '/Arrendador' : '/Arrendatario';
                        window.location.href = redirectPage;
                    } else {
                        throw new Error(data.message || 'Error al registrar usuario');
                    }
                } catch (error) {
                    console.error('Error al registrar usuario:', error);
                    if (registerLeft) {
                        registerLeft.style.display = 'block';
                        registerLeft.style.opacity = '1';
                    }
                    if (registerRight) {
                        registerRight.style.display = 'flex';
                        registerRight.style.opacity = '1';
                    }
                    googleError.textContent = error.message || 'Ocurrió un error al registrar. Por favor, intenta nuevamente.';
                    googleError.style.display = 'block';
                }
            }
        });
    }
});