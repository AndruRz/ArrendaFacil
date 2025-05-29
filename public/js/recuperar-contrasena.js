document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    let userEmail = null;

    // Referencias al DOM
    const loginBtn = document.querySelector('.login-btn');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-new-password');
    const toggleNewPasswordIcon = document.getElementById('toggle-new-password-icon');
    const toggleConfirmPasswordIcon = document.getElementById('toggle-confirm-new-password-icon');
    const strengthBar = document.getElementById('strength-bar');
    const strengthText = document.getElementById('strength-text');
    const strengthWrapper = document.querySelector('.password-strength-wrapper');
    const requirementsText = document.getElementById('requirements-text');
    const confirmError = document.getElementById('confirm-error');

    // Aplicar estilos para la barra de fortaleza
    const style = document.createElement('style');
    style.textContent = `
        .password-strength-wrapper {
            margin-bottom: 1rem;
            font-size: 0.85rem;
        }
        
        .strength-bar {
            height: 4px;
            background-color: #e0e0e0;
            border-radius: 2px;
            margin-bottom: 0.5rem;
            position: relative;
        }
        
        .strength-bar:before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            border-radius: 2px;
            transition: width 0.3s ease, background-color 0.3s ease;
        }
        
        .strength-bar.weak:before {
            width: 33%;
            background-color: #e74c3c;
        }
        
        .strength-bar.medium:before {
            width: 66%;
            background-color: #f39c12;
        }
        
        .strength-bar.strong:before {
            width: 100%;
            background-color: #2ecc71;
        }
        
        .strength-text {
            font-weight: 500;
            margin-bottom: 0.5rem;
        }
        
        .strength-text.weak {
            color: #e74c3c;
        }
        
        .strength-text.medium {
            color: #f39c12;
        }
        
        .strength-text.strong {
            color: #2ecc71;
        }
        
        .requirements-text {
            color: #666;
            font-size: 0.8rem;
        }
        
        .error-message {
            color: #e74c3c;
            font-size: 0.85rem;
            margin-bottom: 1rem;
        }
    `;
    document.head.appendChild(style);

    // Función para mostrar mensaje
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

    // Validar el token al cargar la página
    if (!token) {
        showMessage('¡Uy!', 'Enlace de recuperación inválido. Por favor, solicita un nuevo enlace.', 'Volver al inicio', () => {
            window.location.href = '/login';
        });
        return;
    }

    try {
        const response = await fetch('/api/auth/reset-password-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            showMessage('¡Uy!', data.message || 'El enlace de recuperación es inválido o ha expirado.', 'Volver al inicio', () => {
                window.location.href = '/login';
            });
            return;
        }

        userEmail = data.email;
    } catch (error) {
        console.error('Error al validar el token:', error);
        showMessage('¡Uy!', 'Error al validar el enlace de recuperación. Por favor, intenta nuevamente.', 'Volver al inicio', () => {
            window.location.href = '/login';
        });
        return;
    }

    // Función para alternar visibilidad de contraseña
    const setupPasswordToggle = (input, icon) => {
        icon.addEventListener('click', () => {
            const isPasswordVisible = input.type === 'password';
            input.type = isPasswordVisible ? 'text' : 'password';
            icon.classList.toggle('fa-eye', !isPasswordVisible);
            icon.classList.toggle('fa-eye-slash', isPasswordVisible);
        });
    };

    // Configurar alternar visibilidad para ambos campos
    setupPasswordToggle(newPasswordInput, toggleNewPasswordIcon);
    setupPasswordToggle(confirmPasswordInput, toggleConfirmPasswordIcon);

    // Función para calcular la fortaleza de la contraseña
    const calculateStrengthScore = (password) => {
        const requirements = {
            minLength: { test: password.length >= 8, text: 'Mínimo 8 caracteres' },
            upperCase: { test: /[A-Z]/.test(password), text: 'Una mayúscula' },
            lowerCase: { test: /[a-z]/.test(password), text: 'Una minúscula' },
            number: { test: /[0-9]/.test(password), text: 'Un número' },
            specialChar: { test: /[!@#$%^&*(),.?":{}|<>]/.test(password), text: 'Un carácter especial' },
        };

        let strengthScore = 0;
        for (const key in requirements) {
            if (requirements[key].test) strengthScore++;
        }

        return { strengthScore, requirements };
    };

    // Función para actualizar la barra de fortaleza
    const updatePasswordStrength = () => {
        const password = newPasswordInput.value;

        if (!password) {
            strengthWrapper.style.display = 'none';
            return;
        }

        strengthWrapper.style.display = 'block';
        const { strengthScore, requirements } = calculateStrengthScore(password);

        // Eliminar clases anteriores
        strengthBar.classList.remove('weak', 'medium', 'strong');
        strengthText.classList.remove('weak', 'medium', 'strong');

        // Aplicar clases según la puntuación
        if (strengthScore <= 2) {
            strengthBar.classList.add('weak');
            strengthText.classList.add('weak');
            strengthText.textContent = 'Fortaleza: Débil';
        } else if (strengthScore <= 4) {
            strengthBar.classList.add('medium');
            strengthText.classList.add('medium');
            strengthText.textContent = 'Fortaleza: Media';
        } else {
            strengthBar.classList.add('strong');
            strengthText.classList.add('strong');
            strengthText.textContent = 'Fortaleza: Fuerte';
        }

        // Mostrar requisitos no cumplidos
        const unmetRequirements = Object.values(requirements)
            .filter((req) => !req.test)
            .map((req) => req.text);

        requirementsText.textContent = unmetRequirements.length
            ? `Requisitos: ${unmetRequirements.join(', ')}.`
            : '¡Todos los requisitos cumplidos!';

        // Verificar coincidencia de contraseñas
        const confirmPassword = confirmPasswordInput.value;
        if (confirmPassword) {
            confirmError.style.display = password !== confirmPassword ? 'block' : 'none';
            confirmError.textContent = password !== confirmPassword ? 'Las contraseñas no coinciden' : '';
        } else {
            confirmError.style.display = 'none';
        }

        // Actualizar estado del botón de envío
        loginBtn.disabled = strengthScore < 5 || password !== confirmPassword || !confirmPassword;
        
        // Actualizar estilo del botón según estado
        if (loginBtn.disabled) {
            loginBtn.style.opacity = '0.7';
            loginBtn.style.cursor = 'not-allowed';
        } else {
            loginBtn.style.opacity = '1';
            loginBtn.style.cursor = 'pointer';
        }
    };

    // Agregar listeners para actualizar la barra de fortaleza
    newPasswordInput.addEventListener('input', updatePasswordStrength);
    confirmPasswordInput.addEventListener('input', updatePasswordStrength);

    // Llamar inicialmente para establecer estado inicial
    updatePasswordStrength();

    // Manejar el envío del formulario para cambiar la contraseña
    loginBtn.addEventListener('click', async () => {
        const newPassword = newPasswordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();

        // Validaciones en el cliente
        if (!newPassword) {
            showMessage('¡Uy!', 'Por favor, ingresa una nueva contraseña.');
            return;
        }

        if (!confirmPassword) {
            showMessage('¡Uy!', 'Por favor, confirma tu nueva contraseña.');
            return;
        }

        if (newPassword !== confirmPassword) {
            showMessage('¡Uy!', 'Las contraseñas no coinciden.');
            return;
        }

        const { strengthScore } = calculateStrengthScore(newPassword);
        if (strengthScore < 5) {
            showMessage('¡Uy!', 'La contraseña debe cumplir todos los requisitos: Mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.');
            return;
        }

        try {
            // Mostrar indicador de carga
            loginBtn.textContent = 'Procesando...';
            loginBtn.disabled = true;
            loginBtn.style.opacity = '0.7';
            loginBtn.style.cursor = 'not-allowed';

            const response = await fetch('/api/auth/reset-password-with-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                // Restaurar botón
                loginBtn.textContent = 'Cambiar Contraseña';
                loginBtn.disabled = false;
                loginBtn.style.opacity = '1';
                loginBtn.style.cursor = 'pointer';
                
                showMessage('¡Uy!', data.message || 'Error al cambiar la contraseña.');
                return;
            }

            showMessage('¡Éxito!', 'Contraseña actualizada exitosamente. Por favor, inicia sesión.', 'Iniciar Sesión', () => {
                window.location.href = '/login';
            });
        } catch (error) {
            console.error('Error al cambiar la contraseña:', error);
            
            // Restaurar botón
            loginBtn.textContent = 'Cambiar Contraseña';
            loginBtn.disabled = false;
            loginBtn.style.opacity = '1';
            loginBtn.style.cursor = 'pointer';
            
            showMessage('¡Uy!', 'Error al cambiar la contraseña. Por favor, intenta nuevamente.');
        }
    });
});