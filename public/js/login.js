document.addEventListener('DOMContentLoaded', function () {
    // Referencias al DOM
    const loginBtn = document.querySelector('.login-btn');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const googleSignInBtn = document.querySelector('.social-btn');
    const rememberUserCheckbox = document.getElementById('remember-user');
    const loginForm = document.querySelector('.login-form');
    const loginRight = document.querySelector('.login-right');
    const welcomeTitle = document.getElementById('welcome-title');
    const welcomeText = document.getElementById('welcome-text');
    const registerLink = document.getElementById('register-link');
    const divider = document.getElementById('divider');
    const recoverLink = document.getElementById('recover-link');

    // Función para mostrar mensaje de error o información
    const showMessage = (title, message, buttonText = 'Aceptar', callback = null) => {
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

        const messageDiv = document.createElement('div');
        messageDiv.style.position = 'fixed';
        messageDiv.style.top = '50%';
        messageDiv.style.left = '50%';
        messageDiv.style.transform = 'translate(-50%, -50%)';
        messageDiv.style.backgroundColor = '#fff';
        messageDiv.style.padding = '2rem';
        messageDiv.style.borderRadius = '12px';
        messageDiv.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
        messageDiv.style.zIndex = '3000';
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

        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 10);

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
    };

    // Función para obtener una cookie por su nombre
    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    };

    // Función para verificar si hay un token de "Recordarme" y autenticar automáticamente
    const checkRememberMeToken = async () => {
        const rememberToken = getCookie('remember_token');
        if (rememberToken) {
            try {
                const response = await fetch('/api/auth/verify-remember-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: rememberToken })
                });

                const data = await response.json();

                if (data.success) {
                    localStorage.setItem('currentUserEmail', data.email);
                    let redirectPage;
                    if (data.role === 'admin') {
                        redirectPage = '/Administrador';
                    } else {
                        redirectPage = data.role === 'arrendador' ? '/Arrendador' : '/Arrendatario';
                    }
                    window.location.href = redirectPage;
                } else {
                    document.cookie = 'remember_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                }
            } catch (error) {
                console.error('Error al verificar el token de "Recordarme":', error);
                document.cookie = 'remember_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            }
        }
    };

    checkRememberMeToken();

    if (localStorage.getItem('rememberUser') === 'true') {
        emailInput.value = localStorage.getItem('userEmail') || '';
        rememberUserCheckbox.checked = true;
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            if (!email || !password) {
                showMessage('¡Uy!', 'Por favor, ingresa tu correo y contraseña.');
                return;
            }

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, rememberMe: rememberUserCheckbox.checked })
                });

                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    throw new Error('La respuesta del servidor no es JSON');
                }

                const data = await response.json();

                if (!data.success) {
                    if (data.message.includes('bloqueada')) {
                        showMessage('¡Uy!', 'Tu cuenta ha sido bloqueada. Recupera tu cuenta para continuar.', 'Recuperar Cuenta', () => showRecoveryOptions(email));
                    } else {
                        showMessage('¡Uy!', data.message || 'Credenciales incorrectas');
                    }
                    return;
                }

                if (rememberUserCheckbox.checked) {
                    localStorage.setItem('rememberUser', 'true');
                    localStorage.setItem('userEmail', email);
                    if (data.rememberToken) {
                        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
                        document.cookie = `remember_token=${data.rememberToken}; expires=${expires.toUTCString()}; path=/`;
                    }
                } else {
                    localStorage.removeItem('rememberUser');
                    localStorage.removeItem('userEmail');
                    document.cookie = 'remember_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                }

                localStorage.setItem('currentUserEmail', data.email);

                let redirectPage;
                if (data.role === 'admin') {
                    redirectPage = '/Administrador';
                } else {
                    redirectPage = data.role === 'arrendador' ? '/Arrendador' : '/Arrendatario';
                }
                window.location.href = redirectPage;
            } catch (error) {
                console.error('Error al iniciar sesión:', error);
                showMessage('¡Uy!', 'Ocurrió un error al iniciar sesión. Por favor, intenta nuevamente.');
            }
        });
    }

    if (recoverLink) {
        recoverLink.addEventListener('click', (e) => {
            e.preventDefault();
            showPasswordResetRequestForm();
        });
    }

    const showPasswordResetRequestForm = () => {
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

        const requestDiv = document.createElement('div');
        requestDiv.id = 'requestDiv';
        requestDiv.style.position = 'fixed';
        requestDiv.style.top = '50%';
        requestDiv.style.left = '50%';
        requestDiv.style.transform = 'translate(-50%, -50%)';
        requestDiv.style.backgroundColor = '#fff';
        requestDiv.style.padding = '1.5rem';
        requestDiv.style.borderRadius = '12px';
        requestDiv.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
        requestDiv.style.zIndex = '3000';
        requestDiv.style.textAlign = 'center';
        requestDiv.style.fontFamily = "'Roboto', sans-serif";
        requestDiv.style.color = '#2b6b6b';
        requestDiv.style.maxWidth = '90%';
        requestDiv.style.width = '300px';
        requestDiv.innerHTML = `
            <h3 style="margin-bottom: 1rem; font-size: 1.2rem;">Recuperar Contraseña</h3>
            <p style="font-size: 0.9rem;">Ingresa tu correo electrónico para recibir un enlace de recuperación.</p>
            <input type="email" id="reset-email" placeholder="Correo electrónico" style="width: 100%; padding: 0.5rem; margin: 0.5rem 0; font-size: 0.9rem;">
            <div id="reset-message" style="margin: 0.5rem 0; min-height: 1.5rem; font-size: 0.8rem;"></div>
            <button id="submit-reset-btn" style="
                background: linear-gradient(135deg, #2b6b6b, #4c9f9f);
                color: white;
                border: none;
                padding: 0.6rem 1.2rem;
                border-radius: 8px;
                cursor: pointer;
                margin-right: 0.3rem;
                font-weight: 500;
                font-size: 0.9rem;
            ">Enviar</button>
            <button id="cancel-reset-btn" style="
                background: #ccc;
                color: #333;
                border: none;
                padding: 0.6rem 1.2rem;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
                font-size: 0.9rem;
            ">Cancelar</button>
        `;
        document.body.appendChild(requestDiv);

        // Crear y añadir estilos responsive mediante un elemento <style>
        const style = document.createElement('style');
        style.textContent = `
            @media screen and (max-width: 768px) {
                #requestDiv {
                    width: 280px;
                    padding: 1rem;
                }
                #requestDiv h3 {
                    font-size: 1.1rem;
                }
                #requestDiv p {
                    font-size: 0.85rem;
                }
                #reset-email {
                    font-size: 0.9rem;
                    padding: 0.4rem;
                }
                #submit-reset-btn, #cancel-reset-btn {
                    padding: 0.5rem 1rem;
                    font-size: 0.9rem;
                }
                #reset-message {
                    font-size: 0.8rem;
                }
            }
            @media screen and (max-width: 480px) {
                #requestDiv {
                    width: 80%;
                    padding: 1rem;
                }
                #requestDiv h3 {
                    font-size: 1rem;
                }
                #requestDiv p {
                    font-size: 0.8rem;
                }
                #reset-email {
                    font-size: 0.85rem;
                    padding: 0.3rem;
                }
                #submit-reset-btn, #cancel-reset-btn {
                    padding: 0.4rem 0.8rem;
                    font-size: 0.85rem;
                }
                #reset-message {
                    font-size: 0.7rem;
                }
            }
            @media screen and (max-width: 320px) {
                #requestDiv {
                    width: 90%;
                    padding: 0.8rem;
                }
                #requestDiv h3 {
                    font-size: 0.9rem;
                }
                #requestDiv p {
                    font-size: 0.7rem;
                }
                #reset-email {
                    font-size: 0.8rem;
                    padding: 0.2rem;
                }
                #submit-reset-btn, #cancel-reset-btn {
                    padding: 0.3rem 0.6rem;
                    font-size: 0.8rem;
                }
                #reset-message {
                    font-size: 0.6rem;
                }
            }
        `;
        document.head.appendChild(style);

        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 10);

        requestDiv.style.opacity = '0';
        requestDiv.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        setTimeout(() => {
            requestDiv.style.opacity = '1';
            requestDiv.style.transform = 'translate(-50%, -50%)';
        }, 10);

        const submitBtn = document.getElementById('submit-reset-btn');
        const cancelBtn = document.getElementById('cancel-reset-btn');
        const messageDiv = document.getElementById('reset-message');

        const closeWindow = () => {
            overlay.style.opacity = '0';
            requestDiv.style.opacity = '0';
            requestDiv.style.transform = 'translate(-50%, -60%)';
            setTimeout(() => {
                document.body.removeChild(overlay);
                document.body.removeChild(requestDiv);
                document.head.removeChild(style); // Limpiar el estilo al cerrar
            }, 300);
        };

        submitBtn.addEventListener('click', async () => {
            const email = document.getElementById('reset-email').value.trim();
        
            if (!email) {
                messageDiv.textContent = 'Por favor, ingresa tu correo electrónico.';
                messageDiv.style.color = '#e74c3c';
                return;
            }
        
            // Deshabilitar ambos botones inmediatamente después del primer clic
            submitBtn.disabled = true;
            submitBtn.style.background = '#ccc';
            submitBtn.style.cursor = 'not-allowed';
            submitBtn.textContent = 'Procesando...';
            cancelBtn.disabled = true;
            cancelBtn.style.background = '#ccc';
            cancelBtn.style.cursor = 'not-allowed';
            cancelBtn.textContent = 'Cancelar';
        
            try {
                // Verificar si el correo existe antes de enviar el enlace de recuperación
                const checkEmailResponse = await fetch('/api/auth/check-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
        
                const checkEmailContentType = checkEmailResponse.headers.get('content-type');
                if (!checkEmailContentType || !checkEmailContentType.includes('application/json')) {
                    throw new Error('La respuesta del servidor no es JSON');
                }
        
                const checkEmailData = await checkEmailResponse.json();
        
                if (!checkEmailData.exists) {
                    messageDiv.textContent = 'El correo electrónico no está registrado.';
                    messageDiv.style.color = '#e74c3c';
                    // Rehabilitar ambos botones si el correo no existe
                    submitBtn.disabled = false;
                    submitBtn.style.background = 'linear-gradient(135deg, #2b6b6b, #4c9f9f)';
                    submitBtn.style.cursor = 'pointer';
                    submitBtn.textContent = 'Enviar';
                    cancelBtn.disabled = false;
                    cancelBtn.style.background = '#ccc';
                    cancelBtn.style.cursor = 'pointer';
                    cancelBtn.textContent = 'Cancelar';
                    return;
                }
        
                // Si el correo existe, proceder con la solicitud de recuperación
                const response = await fetch('/api/auth/request-password-reset', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
        
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    throw new Error('La respuesta del servidor no es JSON');
                }
        
                const data = await response.json();
        
                if (!data.success) {
                    messageDiv.textContent = data.message || 'Error al solicitar recuperación.';
                    messageDiv.style.color = '#e74c3c';
                    // Rehabilitar ambos botones en caso de error
                    submitBtn.disabled = false;
                    submitBtn.style.background = 'linear-gradient(135deg, #2b6b6b, #4c9f9f)';
                    submitBtn.style.cursor = 'pointer';
                    submitBtn.textContent = 'Enviar';
                    cancelBtn.disabled = false;
                    cancelBtn.style.background = '#ccc';
                    cancelBtn.style.cursor = 'pointer';
                    cancelBtn.textContent = 'Cancelar';
                    return;
                }
        
                messageDiv.textContent = 'Se ha enviado un enlace de recuperación a tu correo.';
                messageDiv.style.color = '#2ecc71';
        
                // El botón ya está deshabilitado, no es necesario hacerlo de nuevo
                setTimeout(() => {
                    closeWindow();
                }, 2000);
            } catch (error) {
                console.error('Error al solicitar recuperación:', error);
                messageDiv.textContent = 'Error al solicitar recuperación. Por favor, intenta nuevamente.';
                messageDiv.style.color = '#e74c3c';
                // Rehabilitar ambos botones en caso de error
                submitBtn.disabled = false;
                submitBtn.style.background = 'linear-gradient(135deg, #2b6b6b, #4c9f9f)';
                submitBtn.style.cursor = 'pointer';
                submitBtn.textContent = 'Enviar';
                cancelBtn.disabled = false;
                cancelBtn.style.background = '#ccc';
                cancelBtn.style.cursor = 'pointer';
                cancelBtn.textContent = 'Cancelar';
            }
        });

        cancelBtn.addEventListener('click', () => {
            closeWindow();
        });
    };

    const showRecoveryOptions = (email) => {
        loginForm.style.display = 'none';
        if (googleSignInBtn) googleSignInBtn.style.display = 'none';
        if (divider) divider.style.display = 'none';
        if (registerLink) registerLink.style.display = 'none';
        if (recoverLink) recoverLink.style.display = 'none';

        if (welcomeTitle && welcomeText) {
            welcomeTitle.textContent = 'Desbloqueo de Cuenta';
            welcomeText.textContent = 'Utilice uno de los dos métodos para recuperar tu contraseña.';
        }

        const recoveryOptionsDiv = document.createElement('div');
        recoveryOptionsDiv.className = 'recovery-options';
        recoveryOptionsDiv.style.marginTop = '1rem';
        recoveryOptionsDiv.innerHTML = `
            <h3>Recuperar Cuenta</h3>
            <p>Tu cuenta está bloqueada. Selecciona un método para verificar tu identidad:</p>
            <button id="verify-code-btn" class="recovery-btn">Recibir Código por Correo</button>
            <button id="verify-security-btn" class="recovery-btn">Responder Pregunta de Seguridad</button>
        `;
        loginRight.appendChild(recoveryOptionsDiv);

        const style = document.createElement('style');
        style.textContent = `
            .recovery-btn {
                background: linear-gradient(135deg, #2b6b6b, #4c9f9f);
                color: white;
                border: none;
                padding: 0.8rem 1.5rem;
                border-radius: 8px;
                cursor: pointer;
                margin: 0.5rem;
                font-weight: 500;
                width: 100%;
            }
            .recovery-btn:hover {
                background: linear-gradient(135deg, #4c9f9f, #2b6b6b);
            }
            @media screen and (max-width: 768px) {
                .recovery-options h3 {
                    font-size: 1.1rem;
                }
                .recovery-options p {
                    font-size: 0.85rem;
                }
                .recovery-btn {
                    padding: 0.6rem 1rem;
                    font-size: 0.9rem;
                }
            }
            @media screen and (max-width: 480px) {
                .recovery-options h3 {
                    font-size: 1rem;
                }
                .recovery-options p {
                    font-size: 0.8rem;
                }
                .recovery-btn {
                    padding: 0.5rem 0.8rem;
                    font-size: 0.85rem;
                }
            }
            @media screen and (max-width: 320px) {
                .recovery-options h3 {
                    font-size: 0.9rem;
                }
                .recovery-options p {
                    font-size: 0.7rem;
                }
                .recovery-btn {
                    padding: 0.4rem 0.6rem;
                    font-size: 0.8rem;
                }
            }
        `;
        document.head.appendChild(style);

        document.getElementById('verify-code-btn').addEventListener('click', () => {
            requestVerificationCode(email, recoveryOptionsDiv);
        });

        document.getElementById('verify-security-btn').addEventListener('click', () => {
            requestSecurityQuestion(email, recoveryOptionsDiv);
        });

        recoveryOptionsDiv.addEventListener('remove', () => {
            document.head.removeChild(style);
        });
    };

    const requestVerificationCode = async (email, recoveryOptionsDiv) => {
        try {
            const response = await fetch('/api/auth/request-recovery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, method: 'code' })
            });

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('La respuesta del servidor no es JSON');
            }

            const data = await response.json();

            if (!data.success) {
                showMessage('¡Uy!', data.message || 'Error al solicitar recuperación');
                return;
            }

            recoveryOptionsDiv.innerHTML = `
                <h3>Verificar Código</h3>
                <p>Se ha enviado un código a ${email}. Ingresa el código a continuación:</p>
                <input type="text" id="verification-code" placeholder="Código de verificación" style="width: 100%; padding: 0.5rem; margin-bottom: 1rem; font-size: 0.9rem;">
                <button id="submit-code-btn" class="recovery-btn">Verificar Código</button>
            `;

            const style = document.createElement('style');
            style.textContent = `
                @media screen and (max-width: 768px) {
                    #verification-code {
                        font-size: 0.9rem;
                        padding: 0.4rem;
                    }
                }
                @media screen and (max-width: 480px) {
                    #verification-code {
                        font-size: 0.85rem;
                        padding: 0.3rem;
                    }
                }
                @media screen and (max-width: 320px) {
                    #verification-code {
                        font-size: 0.8rem;
                        padding: 0.2rem;
                    }
                }
            `;
            document.head.appendChild(style);

            document.getElementById('submit-code-btn').addEventListener('click', () => {
                const code = document.getElementById('verification-code').value.trim();
                if (!code) {
                    showMessage('¡Uy!', 'Por favor, ingresa el código de verificación.');
                    return;
                }
                verifyRecovery(email, 'code', { code }, recoveryOptionsDiv);
                document.head.removeChild(style);
            });
        } catch (error) {
            console.error('Error al solicitar código:', error);
            showMessage('¡Uy!', 'Error al solicitar código de verificación. Por favor, intenta nuevamente.');
        }
    };

    const requestSecurityQuestion = async (email, recoveryOptionsDiv) => {
        try {
            const response = await fetch('/api/auth/request-recovery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, method: 'security' })
            });

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('La respuesta del servidor no es JSON');
            }

            const data = await response.json();

            if (!data.success) {
                showMessage('¡Uy!', data.message || 'Error al solicitar recuperación');
                return;
            }

            const questionText = {
                'mascota': '¿Cuál es el nombre de tu primera mascota?',
                'escuela': '¿En qué escuela estudiaste primaria?',
                'ciudad': '¿En qué ciudad naciste?',
                'madre': '¿Cuál es el nombre de tu madre?'
            };

            const question = questionText[data.recoveryQuestion] || 'Pregunta no disponible';

            recoveryOptionsDiv.innerHTML = `
                <h3>Responder Pregunta de Seguridad</h3>
                <p>${question}</p>
                <input type="text" id="security-answer" placeholder="Tu respuesta" style="width: 100%; padding: 0.5rem; margin-bottom: 1rem; font-size: 0.9rem;">
                <button id="submit-answer-btn" class="recovery-btn">Verificar Respuesta</button>
            `;

            const style = document.createElement('style');
            style.textContent = `
                @media screen and (max-width: 768px) {
                    #security-answer {
                        font-size: 0.9rem;
                        padding: 0.4rem;
                    }
                }
                @media screen and (max-width: 480px) {
                    #security-answer {
                        font-size: 0.85rem;
                        padding: 0.3rem;
                    }
                }
                @media screen and (max-width: 320px) {
                    #security-answer {
                        font-size: 0.8rem;
                        padding: 0.2rem;
                    }
                }
            `;
            document.head.appendChild(style);

            document.getElementById('submit-answer-btn').addEventListener('click', () => {
                const securityAnswer = document.getElementById('security-answer').value.trim();
                if (!securityAnswer) {
                    showMessage('¡Uy!', 'Por favor, ingresa tu respuesta.');
                    return;
                }
                verifyRecovery(email, 'security', { securityAnswer }, recoveryOptionsDiv);
                document.head.removeChild(style);
            });
        } catch (error) {
            console.error('Error al solicitar pregunta de seguridad:', error);
            showMessage('¡Uy!', 'Error al solicitar pregunta de seguridad. Por favor, intenta nuevamente.');
        }
    };

    const verifyRecovery = async (email, method, data, recoveryOptionsDiv) => {
        try {
            const response = await fetch('/api/auth/verify-recovery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, method, ...data })
            });

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('La respuesta del servidor no es JSON');
            }

            const result = await response.json();

            if (!result.success) {
                showMessage('¡Uy!', result.message || 'Error al verificar recuperación');
                return;
            }

            recoveryOptionsDiv.innerHTML = `
                <h3>Cambiar Contraseña</h3>
                <div class="form-group">
                    <label for="new-password" style="font-size: 0.9rem;">Ingresa tu nueva contraseña:</label>
                    <input type="password" id="new-password" placeholder="Nueva contraseña" style="width: 100%; padding: 0.5rem; margin-bottom: 0.5rem; font-size: 0.9rem;">
                </div>
                <div class="form-group">
                    <label for="confirm-new-password" style="font-size: 0.9rem;">Confirmar nueva contraseña</label>
                    <input type="password" id="confirm-new-password" placeholder="Confirmar nueva contraseña" style="width: 100%; padding: 0.5rem; margin-bottom: 0.5rem; font-size: 0.9rem;">
                </div>
                <div class="error-message" id="confirm-error" style="display: none; color: #e74c3c; font-size: 0.8rem;"></div>
                <button id="submit-password-btn" class="recovery-btn">Cambiar Contraseña</button>
            `;

            const style = document.createElement('style');
            style.textContent = `
                @media screen and (max-width: 768px) {
                    #new-password, #confirm-new-password {
                        font-size: 0.9rem;
                        padding: 0.4rem;
                    }
                    .form-group label {
                        font-size: 0.85rem;
                    }
                    #confirm-error {
                        font-size: 0.75rem;
                    }
                }
                @media screen and (max-width: 480px) {
                    #new-password, #confirm-new-password {
                        font-size: 0.85rem;
                        padding: 0.3rem;
                    }
                    .form-group label {
                        font-size: 0.8rem;
                    }
                    #confirm-error {
                        font-size: 0.7rem;
                    }
                }
                @media screen and (max-width: 320px) {
                    #new-password, #confirm-new-password {
                        font-size: 0.8rem;
                        padding: 0.2rem;
                    }
                    .form-group label {
                        font-size: 0.75rem;
                    }
                    #confirm-error {
                        font-size: 0.65rem;
                    }
                }
            `;
            document.head.appendChild(style);

            const newPasswordInput = document.getElementById('new-password');
            const confirmNewPasswordInput = document.getElementById('confirm-new-password');
            const confirmError = document.getElementById('confirm-error');

            const updatePasswordMatch = () => {
                const newPassword = newPasswordInput.value;
                const confirmPassword = confirmNewPasswordInput.value;
                confirmError.style.display = newPassword !== confirmPassword ? 'block' : 'none';
                confirmError.textContent = newPassword !== confirmPassword ? 'Las contraseñas no coinciden' : '';
            };

            newPasswordInput.addEventListener('input', updatePasswordMatch);
            confirmNewPasswordInput.addEventListener('input', updatePasswordMatch);

            document.getElementById('submit-password-btn').addEventListener('click', () => {
                const newPassword = newPasswordInput.value.trim();
                const confirmNewPassword = confirmNewPasswordInput.value.trim();

                if (!newPassword || !confirmNewPassword) {
                    showMessage('¡Uy!', 'Por favor, completa ambos campos.');
                    return;
                }

                if (newPassword !== confirmNewPassword) {
                    showMessage('¡Uy!', 'Las contraseñas no coinciden.');
                    return;
                }

                resetPassword(email, newPassword, recoveryOptionsDiv);
                document.head.removeChild(style);
            });
        } catch (error) {
            console.error('Error al verificar recuperación:', error);
            showMessage('¡Uy!', 'Error al verificar recuperación. Por favor, intenta nuevamente.');
        }
    };

    const resetPassword = async (email, newPassword, recoveryOptionsDiv) => {
        try {
            const passwordRequirements = {
                minLength: newPassword.length >= 8,
                upperCase: /[A-Z]/.test(newPassword),
                lowerCase: /[a-z]/.test(newPassword),
                number: /[0-9]/.test(newPassword),
                specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
            };

            const allRequirementsMet = Object.values(passwordRequirements).every(req => req);
            if (!allRequirementsMet) {
                showMessage('¡Uy!', 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.');
                return;
            }

            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, newPassword })
            });

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('La respuesta del servidor no es JSON');
            }

            const result = await response.json();

            if (!result.success) {
                showMessage('¡Uy!', result.message || 'Error al cambiar contraseña');
                return;
            }

            if (welcomeTitle && welcomeText) {
                welcomeTitle.textContent = '¡Bienvenido de Nuevo!';
                welcomeText.textContent = 'Ingresa tus datos para acceder a todas las funciones de ArrendaFacil.';
            }
            if (googleSignInBtn) googleSignInBtn.style.display = 'block';
            if (divider) divider.style.display = 'block';
            if (registerLink) registerLink.style.display = 'block';
            if (recoverLink) recoverLink.style.display = 'block';

            showMessage('¡Éxito!', 'Contraseña actualizada exitosamente. Por favor, inicia sesión.', 'Iniciar Sesión', () => {
                recoveryOptionsDiv.remove();
                loginForm.style.display = 'block';
                emailInput.value = email;
                passwordInput.value = '';
            });
        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            showMessage('¡Uy!', 'Error al cambiar contraseña. Por favor, intenta nuevamente.');
        }
    };

    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', () => {
            window.location.href = '/api/auth/google/login';
        });
    }

    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success') === 'true';
    const email = urlParams.get('email');
    const error = urlParams.get('error');

    if (urlParams.has('success')) {
        if (success && email) {
            localStorage.setItem('currentUserEmail', email);
        } else {
            showMessage('¡Uy!', error || 'Ocurrió un error al iniciar sesión con Google. Por favor, intenta nuevamente.');
            window.history.replaceState({}, document.title, '/login');
        }
    }
});