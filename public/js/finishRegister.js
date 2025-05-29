document.addEventListener('DOMContentLoaded', async function () {
    // --- Referencias al DOM ---
    const authAnimation = document.getElementById('authAnimation');
    const verificationForm = document.getElementById('verificationForm');
    const emailInput = document.getElementById('email');
    const verificationCodeInput = document.getElementById('verification-code');
    const finishRegisterBtn = document.querySelector('.finish-register-btn');
    const resendCodeBtn = document.getElementById('resend-code');
    const changeEmailBtn = document.getElementById('change-email');
    const codeError = document.getElementById('code-error');
  
    // --- Función para mostrar el mensaje de error con fondo oscuro ---
    function showErrorMessage(message) {
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
    }
  
    // --- Función para mostrar mensaje de éxito ---
    function showSuccessMessage(message, callback) {
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
  
      const successDiv = document.createElement('div');
      successDiv.style.position = 'fixed';
      successDiv.style.top = '50%';
      successDiv.style.left = '50%';
      successDiv.style.transform = 'translate(-50%, -50%)';
      successDiv.style.backgroundColor = '#fff';
      successDiv.style.padding = '2rem';
      successDiv.style.borderRadius = '12px';
      successDiv.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
      successDiv.style.zIndex = '3000';
      successDiv.style.textAlign = 'center';
      successDiv.style.fontFamily = "'Roboto', sans-serif";
      successDiv.style.color = '#2b6b6b';
      successDiv.innerHTML = `
        <h3 style="margin-bottom: 1rem;">¡Genial!</h3>
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
      document.body.appendChild(successDiv);
  
      setTimeout(() => {
        overlay.style.opacity = '1';
      }, 10);
  
      const acceptButton = successDiv.querySelector('button');
      acceptButton.addEventListener('click', () => {
        overlay.style.opacity = '0';
        successDiv.style.opacity = '0';
        successDiv.style.transform = 'translate(-50%, -60%)';
        setTimeout(() => {
          document.body.removeChild(overlay);
          document.body.removeChild(successDiv);
          if (callback) callback();
        }, 300);
      });
  
      successDiv.style.opacity = '0';
      successDiv.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      setTimeout(() => {
        successDiv.style.opacity = '1';
        successDiv.style.transform = 'translate(-50%, -50%)';
      }, 10);
    }
  
    // --- Función para mostrar modal de cambio de correo ---
    function showChangeEmailModal(currentEmail) {
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
  
      const modalDiv = document.createElement('div');
      modalDiv.style.position = 'fixed';
      modalDiv.style.top = '50%';
      modalDiv.style.left = '50%';
      modalDiv.style.transform = 'translate(-50%, -50%)';
      modalDiv.style.backgroundColor = '#fff';
      modalDiv.style.padding = '2rem';
      modalDiv.style.borderRadius = '12px';
      modalDiv.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
      modalDiv.style.zIndex = '3000';
      modalDiv.style.textAlign = 'center';
      modalDiv.style.fontFamily = "'Roboto', sans-serif";
      modalDiv.style.color = '#2b6b6b';
      modalDiv.innerHTML = `
        <h3 style="margin-bottom: 1rem;">Cambiar Correo Electrónico</h3>
        <p>Ingresa el nuevo correo electrónico:</p>
        <input type="email" id="new-email-input" style="
            width: 100%;
            padding: 0.8rem;
            margin: 1rem 0;
            border: 1px solid #ccc;
            border-radius: 8px;
            font-size: 1rem;
        " value="${currentEmail}" required>
        <div id="email-error" style="color: red; font-size: 0.9rem; display: none; margin-bottom: 1rem;"></div>
        <div style="display: flex; justify-content: space-between;">
            <button id="cancel-change-email" style="
                background: #ccc;
                color: #333;
                border: none;
                padding: 0.8rem 1.5rem;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
            ">Cancelar</button>
            <button id="confirm-change-email" style="
                background: linear-gradient(135deg, #2b6b6b, #4c9f9f);
                color: white;
                border: none;
                padding: 0.8rem 1.5rem;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
            ">Confirmar</button>
        </div>
      `;
      document.body.appendChild(modalDiv);
  
      setTimeout(() => {
        overlay.style.opacity = '1';
      }, 10);
  
      modalDiv.style.opacity = '0';
      modalDiv.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      setTimeout(() => {
        modalDiv.style.opacity = '1';
        modalDiv.style.transform = 'translate(-50%, -50%)';
      }, 10);
  
      const cancelButton = modalDiv.querySelector('#cancel-change-email');
      const confirmButton = modalDiv.querySelector('#confirm-change-email');
      const newEmailInput = modalDiv.querySelector('#new-email-input');
      const emailError = modalDiv.querySelector('#email-error');
  
      cancelButton.addEventListener('click', () => {
        overlay.style.opacity = '0';
        modalDiv.style.opacity = '0';
        modalDiv.style.transform = 'translate(-50%, -60%)';
        setTimeout(() => {
          document.body.removeChild(overlay);
          document.body.removeChild(modalDiv);
        }, 300);
      });
  
      confirmButton.addEventListener('click', async () => {
        const newEmail = newEmailInput.value.trim();
        if (!newEmail) {
          emailError.textContent = 'Por favor, ingresa un correo electrónico';
          emailError.style.display = 'block';
          return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
          emailError.textContent = 'Por favor, ingresa un correo electrónico válido';
          emailError.style.display = 'block';
          return;
        }
  
        try {
          // Verificar si el correo ya existe
          const checkResponse = await fetch('/api/auth/check-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: newEmail }),
          });
  
          if (!checkResponse.ok) {
            const errorText = await checkResponse.text();
            throw new Error(`HTTP error! status: ${checkResponse.status}, message: ${errorText}`);
          }
  
          const checkData = await checkResponse.json();
          console.log('Respuesta de verificación:', checkData); // Para depuración
          if (!checkData.success) {
            emailError.textContent = checkData.message || 'Error al verificar el correo';
            emailError.style.display = 'block';
            return;
          }
  
          if (checkData.exists) {
            emailError.textContent = 'Este correo ya está registrado. Por favor, usa otro correo.';
            emailError.style.display = 'block';
            return;
          }
  
          // Si el correo no existe, proceder a enviar el código de verificación
          const response = await fetch('/api/auth/send-verification-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: newEmail }),
          });
  
          const data = await response.json();
          if (data.success) {
            // Actualizar userData en sessionStorage
            userData.email = newEmail;
            sessionStorage.setItem('registerData', JSON.stringify(userData));
            // Actualizar campo de correo en el formulario
            emailInput.value = newEmail;
            emailInput.disabled = true;
            // Mostrar mensaje de éxito
            showSuccessMessage('Correo actualizado correctamente 😎, revisa tu nuevo código de verificación');
            // Cerrar modal
            overlay.style.opacity = '0';
            modalDiv.style.opacity = '0';
            modalDiv.style.transform = 'translate(-50%, -60%)';
            setTimeout(() => {
              document.body.removeChild(overlay);
              document.body.removeChild(modalDiv);
            }, 300);
          } else {
            emailError.textContent = 'Error al enviar el código: ' + data.message;
            emailError.style.display = 'block';
          }
        } catch (error) {
          console.error('Error al procesar el cambio de correo:', error);
          emailError.textContent = 'Ocurrió un error al procesar el cambio de correo. Por favor, intenta nuevamente.';
          emailError.style.display = 'block';
        }
      });
    }
  
    // --- Ocultar formulario inicialmente ---
    if (verificationForm) {
      verificationForm.style.display = 'none';
      verificationForm.style.opacity = '0';
    }
  
    // --- Animación inicial de carga y mostrar formulario ---
    setTimeout(function () {
      if (authAnimation) authAnimation.style.opacity = '0';
      setTimeout(function () {
        if (authAnimation) authAnimation.style.display = 'none';
        if (verificationForm) {
          verificationForm.style.display = 'block';
          setTimeout(() => {
            verificationForm.style.opacity = '1';
          }, 100);
        }
      }, 500);
    }, 4000);
  
    // --- Recuperar datos del registro desde sessionStorage ---
    const userData = JSON.parse(sessionStorage.getItem('registerData'));
    if (!userData || !userData.email) {
      showErrorMessage('Este movimiento no se puede hacer, termina tu registro :D');
      setTimeout(() => {
        window.location.href = 'FinishRegister';
      }, 1000);
      return;
    }
  
    emailInput.value = userData.email;
  
    // --- Enviar código de verificación automáticamente ---
    try {
      const response = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userData.email }),
      });
  
      const data = await response.json();
      if (!data.success) {
        showErrorMessage('Error al enviar el código de verificación: ' + data.message);
      }
    } catch (error) {
      console.error('Error al enviar código:', error);
      showErrorMessage('Ocurrió un error al enviar el código de verificación.');
    }
  
    // --- Verificar código ingresado ---
    finishRegisterBtn.addEventListener('click', async function (event) {
      event.preventDefault();
  
      const code = verificationCodeInput.value.trim();
  
      if (!code) {
        showCodeError('Por favor ingresa el código de verificación');
        return;
      }
  
      if (!/^[A-Za-z0-9]{6}$/.test(code)) {
        showCodeError('El código debe tener 6 caracteres alfanuméricos');
        return;
      }
  
      // Mostrar estado de carga
      finishRegisterBtn.disabled = true;
      finishRegisterBtn.textContent = 'Procesando...';
  
      try {
        const response = await fetch('/api/auth/verify-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userData.email, code }),
        });
  
        const data = await response.json();
        if (data.success) {
          await registerUser(userData);
        } else {
          showCodeError(data.message || 'Código de verificación incorrecto');
          finishRegisterBtn.disabled = false;
          finishRegisterBtn.textContent = 'Verificar y Completar Registro';
        }
      } catch (error) {
        console.error('Error durante la verificación:', error);
        showErrorMessage('Ocurrió un error durante la verificación. Por favor, intenta nuevamente.');
        finishRegisterBtn.disabled = false;
        finishRegisterBtn.textContent = 'Verificar y Completar Registro';
      }
    });
  
    // --- Reenviar código ---
    resendCodeBtn.addEventListener('click', async function () {
      try {
        const response = await fetch('/api/auth/send-verification-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userData.email }),
        });
  
        const data = await response.json();
        if (data.success) {
          showSuccessMessage('Hey hemos reenviado un código de verificación 😎, revisa su nuevo código de verificación');
        } else {
          showErrorMessage('Error al reenviar el código: ' + data.message);
        }
      } catch (error) {
        console.error('Error al reenviar código:', error);
        showErrorMessage('Ocurrió un error al reenviar el código de verificación.');
      }
    });
  
    // --- Cambio de correo ---
    changeEmailBtn.addEventListener('click', function () {
      showChangeEmailModal(userData.email);
    });
  
    // --- Prevenir retroceso del navegador ---
    history.pushState(null, null, location.href);
    window.onpopstate = function () {
      showErrorMessage('Este movimiento no se puede hacer, termina tu registro :D');
      history.pushState(null, null, location.href);
    };
  
    // --- Funciones auxiliares ---
    function showCodeError(message) {
      codeError.textContent = message;
      codeError.style.display = 'block';
    }
  
    async function registerUser(userData) {
      try {
        console.log('Iniciando registro para:', userData.email);
        const registerResponse = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
        });
  
        const registerData = await registerResponse.json();
        console.log('Respuesta de registro:', registerData);
  
        if (registerData.success) {
          sessionStorage.removeItem('registerData');
          localStorage.setItem('isRegistered', 'true');
          localStorage.setItem('currentUserEmail', userData.email);
  
          // Enviar solicitud de correo de bienvenida SIN esperar
          console.log('Enviando solicitud de correo de bienvenida para:', userData.email, 'Rol:', userData.role);
          fetch('/api/auth/send-welcome-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userData.email, role: userData.role }),
          })
            .then((response) => response.json())
            .then((welcomeData) => {
              if (!welcomeData.success) {
                console.error('Error al programar correo de bienvenida:', welcomeData.message);
              } else {
                console.log('Correo de bienvenida programado para:', userData.email);
              }
            })
            .catch((error) => {
              console.error('Error al programar correo de bienvenida:', error);
            });
  
          // Aplicar transición de salida antes de redirigir
          document.body.classList.add('fade-out');
          const redirectPage = userData.role === 'arrendador' ? '/Arrendador' : '/Arrendatario';
          setTimeout(() => {
            console.log('Redirigiendo a:', redirectPage);
            window.location.href = redirectPage;
          }, 500); // Coincide con la duración de la transición
        } else {
          showErrorMessage('Error al registrar usuario: ' + registerData.message);
          finishRegisterBtn.disabled = false;
          finishRegisterBtn.textContent = 'Verificar y Completar Registro';
        }
      } catch (error) {
        console.error('Error al registrar usuario:', error);
        showErrorMessage('Ocurrió un error durante el registro. Por favor, intenta nuevamente.');
        finishRegisterBtn.disabled = false;
        finishRegisterBtn.textContent = 'Verificar y Completar Registro';
      }
    }
  });