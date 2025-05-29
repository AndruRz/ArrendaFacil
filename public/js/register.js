document.addEventListener('DOMContentLoaded', function () {
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

  // --- Alternar Visibilidad de Contraseña ---
  const setupPasswordToggle = (inputId, iconId) => {
    const passwordInput = document.getElementById(inputId);
    const togglePasswordIcon = document.getElementById(iconId);

    if (passwordInput && togglePasswordIcon) {
      togglePasswordIcon.addEventListener('click', () => {
        const isPasswordVisible = passwordInput.type === 'password';
        passwordInput.type = isPasswordVisible ? 'text' : 'password';
        togglePasswordIcon.classList.toggle('fa-eye', !isPasswordVisible);
        togglePasswordIcon.classList.toggle('fa-eye-slash', isPasswordVisible);
        console.log(`${inputId} visibility toggled: ${passwordInput.type}`);
      });
    } else {
      console.error(`Input (${inputId}) or toggle icon (${iconId}) not found`);
    }
  };

  setupPasswordToggle('password', 'toggle-password-icon');
  setupPasswordToggle('confirm-password', 'toggle-confirm-password-icon');

  // --- Validación de Fortaleza de Contraseña ---
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const strengthBar = document.getElementById('strength-bar');
  const strengthText = document.getElementById('strength-text');
  const strengthWrapper = document.querySelector('.password-strength-wrapper');
  const requirementsText = document.getElementById('requirements-text');
  const confirmError = document.getElementById('confirm-error');
  const passwordError = document.getElementById('password-error');

  if (
    passwordInput &&
    confirmPasswordInput &&
    strengthBar &&
    strengthText &&
    strengthWrapper &&
    requirementsText &&
    confirmError &&
    passwordError
  ) {
    const calculateStrengthScore = (password) => {
      const requirements = {
        minLength: { test: password.length >= 8, text: 'Mínimo 8 caracteres' },
        upperCase: { test: /[A-Z]/.test(password), text: 'Una mayúscula' },
        lowerCase: { test: /[a-z]/.test(password), text: 'Una minúscula' },
        number: { test: /[0-9]/.test(password), text: 'Un número' },
        specialChar: {
          test: /[!@#$%^&*(),.?":{}|<>]/.test(password),
          text: 'Un carácter especial',
        },
      };

      let strengthScore = 0;
      for (const key in requirements) {
        if (requirements[key].test) strengthScore++;
      }

      return { strengthScore, requirements };
    };

    const updatePasswordStrength = () => {
      const password = passwordInput.value;

      if (!password || !/[a-zA-Z0-9]/.test(password)) {
        strengthWrapper.style.display = 'none';
        passwordError.style.display = 'none';
        return;
      }

      strengthWrapper.style.display = 'block';
      const { strengthScore, requirements } = calculateStrengthScore(password);

      strengthBar.classList.remove('weak', 'medium', 'strong');
      strengthText.classList.remove('weak', 'medium', 'strong');

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

      const unmetRequirements = Object.values(requirements)
        .filter((req) => !req.test)
        .map((req) => req.text);

      requirementsText.textContent = unmetRequirements.length
        ? `Requisitos: ${unmetRequirements.join(', ')}.`
        : '¡Todos los requisitos cumplidos!';

      const confirmPassword = confirmPasswordInput.value;
      if (confirmPassword) {
        confirmError.style.display =
          password !== confirmPassword ? 'block' : 'none';
        if (password === confirmPassword && strengthScore === 5) {
          strengthWrapper.style.display = 'none';
        }
      } else {
        confirmError.style.display = 'none';
      }

      if (passwordError.style.display === 'block' && strengthScore > 2) {
        passwordError.style.display = 'none';
      }

      console.log(`Password strength score: ${strengthScore}`);
    };

    passwordInput.addEventListener('input', updatePasswordStrength);
    confirmPasswordInput.addEventListener('input', updatePasswordStrength);
  } else {
    console.error('Password-related elements not found in DOM');
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

  // --- Validación del Formulario al Enviar ---
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      let hasErrors = false;

      const elements = {
        fullName: document.getElementById('full-name'),
        email: document.getElementById('email'),
        rol: document.getElementById('rol'),
        phone: document.getElementById('phone'),
        countryCodeSelect: document.getElementById('country-code'),
        recoveryQuestion: document.getElementById('recovery-question'),
        recoveryAnswer: document.getElementById('recovery-answer'),
        password: document.getElementById('password'),
        confirmPassword: document.getElementById('confirm-password'),
        terms: document.getElementById('terms'),
      };

      const errors = {
        fullNameError: document.getElementById('full-name-error'),
        emailError: document.getElementById('email-error'),
        rolError: document.getElementById('rol-error'),
        phoneError: document.getElementById('phone-error'),
        recoveryQuestionError: document.getElementById('recovery-question-error'),
        recoveryAnswerError: document.getElementById('recovery-answer-error'),
        passwordError: document.getElementById('password-error'),
        confirmError: document.getElementById('confirm-error'),
        termsError: document.getElementById('terms-error'),
      };

      // Verificar que todos los elementos existen
      for (const [key, element] of Object.entries(elements)) {
        if (!element) {
          console.error(`${key} element not found in DOM`);
          alert('Error en el formulario. Por favor, contacta al soporte.');
          return;
        }
      }

      // Verificar que todos los elementos de error existen
      for (const [key, element] of Object.entries(errors)) {
        if (!element) {
          console.error(`${key} element not found in DOM`);
          alert('Error en el formulario. Por favor, contacta al soporte.');
          return;
        }
      }

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

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!elements.email.value.trim()) {
        errors.emailError.textContent = 'El correo electrónico no puede estar vacío';
        errors.emailError.style.display = 'block';
        hasErrors = true;
      } else if (!emailPattern.test(elements.email.value.trim())) {
        errors.emailError.textContent = 'Ingresa un correo electrónico válido';
        errors.emailError.style.display = 'block';
        hasErrors = true;
      }

      if (!elements.rol.value) {
        errors.rolError.textContent = 'Debes seleccionar un rol';
        errors.rolError.style.display = 'block';
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

      if (!elements.recoveryQuestion.value) {
        errors.recoveryQuestionError.textContent = 'Debes seleccionar una pregunta';
        errors.recoveryQuestionError.style.display = 'block';
        hasErrors = true;
      }

      if (!elements.recoveryAnswer.value.trim()) {
        errors.recoveryAnswerError.textContent = 'La respuesta no puede estar vacía';
        errors.recoveryAnswerError.style.display = 'block';
        hasErrors = true;
      }

      if (!elements.password.value) {
        errors.passwordError.textContent = 'La contraseña no puede estar vacía';
        errors.passwordError.style.display = 'block';
        hasErrors = true;
      } else {
        const requirements = {
          minLength: { test: elements.password.value.length >= 8 },
          upperCase: { test: /[A-Z]/.test(elements.password.value) },
          lowerCase: { test: /[a-z]/.test(elements.password.value) },
          number: { test: /[0-9]/.test(elements.password.value) },
          specialChar: { test: /[!@#$%^&*(),.?":{}|<>]/.test(elements.password.value) },
        };

        let strengthScore = 0;
        for (const key in requirements) {
          if (requirements[key].test) strengthScore++;
        }

        if (strengthScore < 5) {
          errors.passwordError.textContent = 'La contraseña debe ser fuerte (cumplir todos los criterios)';
          errors.passwordError.style.display = 'block';
          hasErrors = true;
        }
      }

      if (!elements.confirmPassword.value) {
        errors.confirmError.textContent = 'La confirmación de contraseña no puede estar vacía';
        errors.confirmError.style.display = 'block';
        hasErrors = true;
      } else if (elements.password.value !== elements.confirmPassword.value) {
        errors.confirmError.textContent = 'Las contraseñas no coinciden';
        errors.confirmError.style.display = 'block';
        hasErrors = true;
      }

      if (!elements.terms.checked) {
        errors.termsError.textContent = 'Debes aceptar los términos y condiciones';
        errors.termsError.style.display = 'block';
        hasErrors = true;
      }

      if (!hasErrors) {
        try {
          // Verificar si el correo ya existe en la base de datos
          const checkResponse = await fetch('/api/auth/check-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: elements.email.value.trim() }),
          });

          if (!checkResponse.ok) {
            const errorText = await checkResponse.text();
            throw new Error(`HTTP error! status: ${checkResponse.status}, message: ${errorText}`);
          }

          const data = await checkResponse.json();

          if (!data.success) {
            errors.emailError.textContent = data.message || 'Error al verificar el correo';
            errors.emailError.style.display = 'block';
            return;
          }

          if (data.exists) {
            errors.emailError.textContent = 'Este correo electrónico ya está registrado';
            errors.emailError.style.display = 'block';
          } else {
            // Guardar datos en sessionStorage
            const userData = {
              fullName: elements.fullName.value.trim(),
              email: elements.email.value.trim(),
              role: elements.rol.value,
              phoneNumber: elements.countryCodeSelect.value + elements.phone.value.trim(),
              recoveryQuestion: elements.recoveryQuestion.value,
              recoveryAnswer: elements.recoveryAnswer.value.trim(),
              password: elements.password.value,
              googleId: '',
            };

            sessionStorage.setItem('registerData', JSON.stringify(userData));

            // Redirigir a FinishRegister
            window.location.href = '/FinishRegister';
          }
        } catch (error) {
          console.error('Error al verificar el correo:', error);
          errors.emailError.textContent =
            'Ocurrió un error al verificar el correo. Por favor, intenta nuevamente.';
          errors.emailError.style.display = 'block';
        }
      }
    });
  } else {
    console.error('Register form not found in DOM');
  }

  // --- Manejar el Registro con Google ---
  const googleSignInBtn = document.getElementById('googleSignInBtn');
  if (googleSignInBtn) {
    googleSignInBtn.addEventListener('click', () => {
      console.log('Initiating Google Sign-In'); // Debug log
      window.location.href = '/api/auth/google';
    });
  } else {
    console.error('Google Sign-In button not found in DOM');
  }
});