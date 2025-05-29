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
    const isArrendadorPage = window.location.pathname.toLowerCase().endsWith('/administrador') || 
                            window.location.pathname.toLowerCase().endsWith('admin.html');
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

//Bloque para Notificaciones del Administrador
document.addEventListener('DOMContentLoaded', function initializeAdminNotifications() {
    const mainContent = document.getElementById('main-content');
    const dashboardLink = document.querySelector('a[href="dashboard"]');
    const originalDashboardContent = mainContent ? mainContent.innerHTML : '';

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

    let loadingOverlay = null;
    let loadingSpinner = null;

    function showLoadingSpinner(action = '') {
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
            <p style="margin-top: 1rem;">Procesando ${action}...</p>
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

    async function renderAllPublications() {
        if (!mainContent) {
            console.error('No se encontró #main-content');
            return;
        }

        mainContent.innerHTML = `
            <div class="all-publications-section">
                <h1>Todas las Publicaciones</h1>
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

        // Add CSS for publications and filter form
        const style = document.createElement('style');
        style.innerHTML = `
            .all-publications-section {
                max-width: 1200px;
                margin: 2rem auto;
                padding: 0 1rem;
            }

            .all-publications-section h1 {
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
                background: #4c9f9f;
                color: white;
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
                background: #2b6b6b;
            }

            .publication-action-btn:disabled {
                background: #e5e7eb;
                color: #9ca3af;
                cursor: not-allowed;
            }

            .status-tag {
                display: inline-flex;
                align-items: center;
                padding: 0.4rem 0.8rem;
                border-radius: 6px;
                font-size: 0.85rem;
                font-weight: 600;
                margin: 0.5rem 1rem;
                letter-spacing: 0.3px;
            }

            .status-pending {
                background-color: #fffbeb;
                color: #92400e;
            }

            .status-pending::before {
                content: "•";
                color: #f59e0b;
                margin-right: 0.4rem;
                font-size: 1.2rem;
                line-height: 0;
            }

            .status-available {
                background-color: #ecfdf5;
                color: #047857;
            }

            .status-available::before {
                content: "•";
                color: #10b981;
                margin-right: 0.4rem;
                font-size: 1.2rem;
                line-height: 0;
            }

            .status-rejected {
                background-color: #fef2f2;
                color: #b91c1c;
            }

            .status-rejected::before {
                content: "•";
                color: #ef4444;
                margin-right: 0.4rem;
                font-size: 1.2rem;
                line-height: 0;
            }

            .rejected-message {
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

            /* Media Queries for Responsive Design */
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

        // Add event listeners for the filter form
        const filterStatus = document.getElementById('filter-status');
        const filterTitle = document.getElementById('filter-title');
        const filterType = document.getElementById('filter-type');
        const filterBtn = document.getElementById('filter-btn');
        const resetBtn = document.getElementById('reset-btn');

        // Fetch publications with filters
        async function fetchFilteredPublications() {
            const status = filterStatus.value;
            const title = filterTitle.value.trim();
            const type = filterType.value;

            // Build query parameters
            const params = new URLSearchParams();
            if (status) params.append('status', status);
            if (title) params.append('title', title);
            if (type) params.append('type', type);

            await fetchAllPublications(params.toString());
        }

        // Event listener for filter button
        filterBtn.addEventListener('click', () => {
            fetchFilteredPublications();
        });

        // Event listener for Enter key in title input
        filterTitle.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                fetchFilteredPublications();
            }
        });

        // Event listener for reset button
        resetBtn.addEventListener('click', () => {
            filterStatus.value = '';
            filterTitle.value = '';
            filterType.value = '';
            fetchAllPublications(); // Fetch all publications without filters
        });

        // Initial fetch without filters
        await fetchAllPublications();
    }

    // Fetch and display all publications
    async function fetchAllPublications(queryString = '') {
        const publicationsList = document.getElementById('publications-list');
        if (!publicationsList) {
            console.error('No se encontró #publications-list');
            return;
        }

        showLoadingSpinner();

        try {
            const url = queryString ? `/api/publications/admin/all?${queryString}` : '/api/publications/admin/all';
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'x-user-email': localStorage.getItem('currentUserEmail') || ''
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            hideLoadingSpinner();

            publicationsList.innerHTML = '';

            if (!data.success || !data.publications || data.publications.length === 0) {
                publicationsList.innerHTML = `
                    <div class="no-publications">
                        <span>📋</span>
                        <p>No hay publicaciones registradas.</p>
                    </div>
                `;
                return;
            }

            data.publications.forEach(publication => {
                const publicationCard = document.createElement('div');
                publicationCard.className = 'publication-card';

                const formattedPrice = Number(publication.price).toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
                const isRejected = publication.status === 'rejected';
                const imageSrc = publication.image_url ? publication.image_url : '/img/house_default.png';
                const ownerName = publication.owner_name || 'Desconocido';

                // Mapear el estado a una etiqueta visual
                let statusLabel = '';
                switch (publication.status) {
                    case 'pending':
                        statusLabel = '<span class="status-tag status-pending">Pendiente</span>';
                        break;
                    case 'available':
                        statusLabel = '<span class="status-tag status-available">Aprobada</span>';
                        break;
                    case 'rejected':
                        statusLabel = '<span class="status-tag status-rejected">Rechazada</span>';
                        break;
                }

                publicationCard.innerHTML = `
                    <img src="${imageSrc}" alt="${publication.title}" class="publication-image">
                    <h3>${publication.title}</h3>
                    <p><strong>Precio:</strong> ${formattedPrice}</p>
                    <p><strong>Arrendador:</strong> ${ownerName}</p>
                    <p><strong>Estado:</strong> ${statusLabel}</p>
                    <div class="publication-actions">
                        <button class="publication-action-btn view" data-id="${publication.id}">Revisar Publicación</button>
                    </div>
                    ${isRejected ? '<p class="rejected-message">Usuario debe modificar su publicación</p>' : ''}
                `;

                publicationsList.appendChild(publicationCard);

                const viewBtn = publicationCard.querySelector('.view');
                viewBtn.addEventListener('click', () => {
                    window.renderPublicationDetails(publication.id);
                });
            });
        } catch (error) {
            hideLoadingSpinner();
            console.error('Error obteniendo las publicaciones:', error);
            publicationsList.innerHTML = `
                <p class="no-publications error">Error al cargar las publicaciones: ${error.message}</p>
            `;
        }
    }


    function showRejectionModal(report, onCloseReportModal) {
        onCloseReportModal();
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background-color: rgba(0,0,0,0.5); z-index: 3001; opacity: 0;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(overlay);

        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background-color: #fff; padding: 2rem; border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 3002;
            font-family: 'Roboto', sans-serif; max-width: 500px; width: 90%;
            opacity: 0; transition: opacity 0.3s ease, transform 0.3s ease;
        `;
        modal.innerHTML = `
            <h2 style="color: #dc2626; font-size: 1.5rem; margin-bottom: 1rem;">Rechazar Reporte #${report.case_number}</h2>
            <p style="color: #374151; margin-bottom: 1rem;">Por favor, indica la razón por la cual se rechaza este reporte:</p>
            <textarea id="rejection-reason" style="
                width: 100%; min-height: 100px; padding: 0.5rem; border: 1px solid #d1d5db;
                border-radius: 6px; font-family: 'Roboto', sans-serif; resize: vertical;
                margin-bottom: 1rem;" placeholder="Escribe la razón del rechazo..."></textarea>
            <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                <button class="cancel-btn" style="
                    background: #6b7280; color: white; border: none; padding: 0.8rem 1.5rem;
                    border-radius: 8px; cursor: pointer; font-weight: 500;
                ">Cancelar</button>
                <button class="confirm-reject-btn" style="
                    background: #dc2626; color: white; border: none; padding: 0.8rem 1.5rem;
                    border-radius: 8px; cursor: pointer; font-weight: 500;
                ">Confirmar Rechazo</button>
            </div>
            <button class="modal-close-btn" style="
                position: absolute; top: 1rem; right: 1rem; background: none; border: none;
                font-size: 1.5rem; cursor: pointer; color: #666;
            ">×</button>
        `;
        document.body.appendChild(modal);

        setTimeout(() => {
            overlay.style.opacity = '1';
            modal.style.opacity = '1';
        }, 10);

        const closeRejectionModal = () => {
            overlay.style.opacity = '0';
            modal.style.opacity = '0';
            modal.style.transform = 'translate(-50%, -60%)';
            setTimeout(() => {
                document.body.removeChild(overlay);
                document.body.removeChild(modal);
            }, 300);
        };

        modal.querySelector('.modal-close-btn').addEventListener('click', closeRejectionModal);
        modal.querySelector('.cancel-btn').addEventListener('click', closeRejectionModal);

        modal.querySelector('.confirm-reject-btn').addEventListener('click', async () => {
            const rejectionReason = modal.querySelector('#rejection-reason').value.trim();
            if (!rejectionReason) {
                showMessage('La razón del rechazo es obligatoria', true);
                return;
            }

            if (rejectionReason.length > 500) {
                showMessage('La razón del rechazo no debe exceder 500 caracteres', true);
                return;
            }

            try {
                closeRejectionModal();
                showLoadingSpinner('rechazo');
                const response = await fetch(`/api/publications/admin/reports/admin/${report.id}/reject`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-email': localStorage.getItem('currentUserEmail') || ''
                    },
                    body: JSON.stringify({ rejection_reason: rejectionReason })
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.message || 'Error al rechazar el reporte');
                }

                hideLoadingSpinner();
                showMessage('Reporte rechazado correctamente', false);
                await fetchAdminStats();
                await fetchAdminNotifications();
            } catch (error) {
                hideLoadingSpinner();
                showMessage(`Error: ${error.message}`, true);
            }
        });
    }

    async function deletePublication(publicationId, reason, deletionDetails, reportId) {
        try {
            showLoadingSpinner('eliminación');

            const response = await fetch(`/api/publications/admin/${publicationId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': localStorage.getItem('currentUserEmail') || ''
                },
                body: JSON.stringify({ reason, deletionDetails, reportId })
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('La respuesta no es un JSON válido');
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Error al eliminar la publicación');
            }

            hideLoadingSpinner();
            showMessage('Publicación eliminada con éxito.', false);
            setTimeout(() => {
                restoreDashboard();
            }, 1500);
        } catch (error) {
            hideLoadingSpinner();
            console.error('Error al eliminar la publicación:', error);
            showMessage(`Error al eliminar la publicación: ${error.message}`, true);
        }
    }

    function showDeletionForm(publicationId, report, callback) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background-color: rgba(0,0,0,0.5); z-index: 2999; opacity: 0;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(overlay);

        const formDiv = document.createElement('div');
        formDiv.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background-color: #fff; padding: 2rem; border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 3000; width: 90%; max-width: 500px;
            font-family: 'Roboto', sans-serif; color: #1f2937; opacity: 0;
            transition: opacity 0.3s ease, transform 0.3s ease;
        `;

        const reasonMap = {
            contenido_inapropiado: 'Contenido Inapropiado',
            informacion_falsa: 'Información Falsa',
            estafa: 'Contenido Inapropiado',
            otro: 'Otros'
        };
        const deletionReason = reasonMap[report.reason] || 'Otros';

        formDiv.innerHTML = `
            <h3 style="margin-bottom: 1.5rem; color: #b91c1c; font-size: 1.5rem;">Eliminar Publicación: ${report.publication_title || 'No disponible'}</h3>
            <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Motivo de la Eliminación:</label>
                <select id="deletion-reason" style="
                    width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px;
                    font-size: 1rem; color: #1f2937; background-color: #f9fafb;" disabled>
                    <option value="Incumplimiento de Normas" ${deletionReason === 'Incumplimiento de Normas' ? 'selected' : ''}>Incumplimiento de Normas</option>
                    <option value="Solicitud del Propietario" ${deletionReason === 'Solicitud del Propietario' ? 'selected' : ''}>Solicitud del Propietario</option>
                    <option value="Contenido Inapropiado" ${deletionReason === 'Contenido Inapropiado' ? 'selected' : ''}>Contenido Inapropiado</option>
                    <option value="Publicación Duplicada" ${deletionReason === 'Publicación Duplicada' ? 'selected' : ''}>Publicación Duplicada</option>
                    <option value="Otros" ${deletionReason === 'Otros' ? 'selected' : ''}>Otros</option>
                </select>
            </div>
            <div style="margin-bottom: 1.5rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Descripción de la Eliminación:</label>
                <textarea id="deletion-details" rows="4" style="
                    width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px;
                    font-size: 1rem; color: #1f2937; background-color: #f9fafb; resize: vertical;
                " placeholder="Explica los detalles de la eliminación..."></textarea>
            </div>
            <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                <button id="cancel-btn" style="
                    background-color: #f3f4ỏf6; color: #4b5563; border: none;
                    padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 500;
                ">Cancelar</button>
                <button id="submit-btn" style="
                    background: linear-gradient(135deg, #b91c1c, #ef4444); color: white;
                    border: none; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 500;
                ">Eliminar</button>
            </div>
        `;
        document.body.appendChild(formDiv);

        setTimeout(() => {
            overlay.style.opacity = '1';
            formDiv.style.opacity = '1';
        }, 10);

        formDiv.querySelector('#cancel-btn').addEventListener('click', () => {
            overlay.style.opacity = '0';
            formDiv.style.opacity = '0';
            formDiv.style.transform = 'translate(-50%, -60%)';
            setTimeout(() => {
                document.body.removeChild(overlay);
                document.body.removeChild(formDiv);
            }, 300);
        });

        formDiv.querySelector('#submit-btn').addEventListener('click', () => {
            const reason = formDiv.querySelector('#deletion-reason').value;
            const deletionDetails = formDiv.querySelector('#deletion-details').value.trim();

            if (!deletionDetails) {
                showMessage('Por favor, proporciona los detalles de la eliminación.', true);
                return;
            }

            overlay.style.opacity = '0';
            formDiv.style.opacity = '0';
            formDiv.style.transform = 'translate(-50%, -60%)';
            setTimeout(() => {
                document.body.removeChild(overlay);
                document.body.removeChild(formDiv);
            }, 300);

            callback(reason, deletionDetails);
        });
    }

    function showReportModal(report) {
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
            box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 3000;
            font-family: 'Roboto', sans-serif; max-width: 500px; width: 90%;
            opacity: 0; transition: opacity 0.3s ease, transform 0.3s ease;
        `;

        const reasonText = {
            contenido_inapropiado: 'Contenido Inapropiado',
            informacion_falsa: 'Información Falsa',
            estafa: 'Sospecha de Estafa',
            otro: 'Otro'
        }[report.reason] || 'Otro';

        const reportDate = new Date(report.created_at).toLocaleString('es-CO', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        const descriptionText = report.description || 'No se proporcionó descripción';

        modal.innerHTML = `
            <h2 style="color: #2b6b6b; font-size: 1.5rem; margin-bottom: 1rem;">Reporte #${report.case_number}</h2>
            <p><strong>Publicación reportada:</strong> ${report.publication_title || 'No disponible'}</p>
            <br>
            <p><strong>Usuario que realizó el reporte:</strong> ${report.tenant_name || report.tenant_email}</p>
            <br>
            <p><strong>Motivo del reporte:</strong> ${reasonText}</p>
            <br>
            <p><strong>Mensaje del reportante:</strong></p>
            <p style="margin-top: 0.5rem; color: #374151;">${descriptionText}</p>
            <br>
            <p><strong>Fecha del reporte:</strong> ${reportDate}</p>
            <div style="margin-top: 1.5rem; display: flex; gap: 1rem;">
                <button class="modal-action-btn accept-report" style="
                    background: #2b6b6b; color: white; border: none; padding: 0.8rem 1.5rem;
                    border-radius: 8px; cursor: pointer; font-weight: 500;
                ">Aceptar Reporte</button>
                <button class="modal-action-btn invalidate-report" style="
                    background: #dc2626; color: white; border: none; padding: 0.8rem 1.5rem;
                    border-radius: 8px; cursor: pointer; font-weight: 500;
                ">Invalidar Reporte</button>
            </div>
            <button class="modal-close-btn" style="
                position: absolute; top: 1rem; right: 1rem; background: none; border: none;
                font-size: 1.5rem; cursor: pointer; color: #666;
            ">×</button>
        `;
        document.body.appendChild(modal);

        setTimeout(() => {
            overlay.style.opacity = '1';
            modal.style.opacity = '1';
        }, 10);

        const closeReportModal = () => {
            overlay.style.opacity = '0';
            modal.style.opacity = '0';
            modal.style.transform = 'translate(-50%, -60%)';
            setTimeout(() => {
                document.body.removeChild(overlay);
                document.body.removeChild(modal);
            }, 300);
        };

        modal.querySelector('.modal-close-btn').addEventListener('click', closeReportModal);

        modal.querySelector('.accept-report').addEventListener('click', () => {
            closeReportModal();
            showDeletionForm(report.publication_id, report, (reason, deletionDetails) => {
                deletePublication(report.publication_id, reason, deletionDetails, report.id);
            });
        });

        modal.querySelector('.invalidate-report').addEventListener('click', () => {
            showRejectionModal(report, closeReportModal);
        });
    }

    async function fetchAdminStats() {
        try {
            // Fetch publications with status filter
            const [pendingResponse, activeResponse, reportsResponse] = await Promise.all([
                fetch('/api/publications/admin/all?status=pending', {
                    method: 'GET',
                    headers: {
                        'x-user-email': localStorage.getItem('currentUserEmail') || ''
                    }
                }),
                fetch('/api/publications/admin/all?status=available', {
                    method: 'GET',
                    headers: {
                        'x-user-email': localStorage.getItem('currentUserEmail') || ''
                    }
                }),
                fetch('/api/publications/admin/reports/admin/all?status=pending', {
                    method: 'GET',
                    headers: {
                        'x-user-email': localStorage.getItem('currentUserEmail') || ''
                    }
                })
            ]);
    
            // Process publications responses
            const pendingData = await processResponse(pendingResponse, 'Error al obtener publicaciones pendientes');
            const activeData = await processResponse(activeResponse, 'Error al obtener publicaciones activas');
            const reportsData = await processResponse(reportsResponse, 'Error al obtener reportes pendientes');
    
            // Calculate counts
            const pendingPublications = pendingData.publications?.length || 0;
            const activePublications = activeData.publications?.length || 0;
            const pendingReports = reportsData.reports?.length || 0;
    
            // Update DOM
            updateStats(pendingPublications, activePublications, pendingReports);
        } catch (error) {
            console.error('Error al obtener estadísticas:', error.message);
            updateStats(0, 0, 0);
        }
    }
    
    // Helper function to process API responses
    async function processResponse(response, errorMessage) {
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
    
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('La respuesta no es un JSON válido');
        }
    
        const data = await response.json();
    
        if (!data.success) {
            throw new Error(data.message || errorMessage);
        }
    
        return data;
    }
    
    // Helper function to update DOM
    function updateStats(pendingPublications, activePublications, pendingReports) {
        const pendingStat = document.querySelector('.stats-cards .card:nth-child(1) .stat');
        const activeStat = document.querySelector('.stats-cards .card:nth-child(2) .stat');
        const notificationsStat = document.querySelector('.stats-cards .card:nth-child(3) .stat');
    
        if (pendingStat) pendingStat.textContent = pendingPublications;
        if (activeStat) activeStat.textContent = activePublications;
        if (notificationsStat) notificationsStat.textContent = pendingReports;
    }
    
    // Call the function on page load
    document.addEventListener('DOMContentLoaded', fetchAdminStats);




    window.fetchAdminStats = fetchAdminStats;

    async function fetchAdminNotifications() {
        const notificationsList = document.getElementById('admin-notifications-list');
        if (!notificationsList) {
            console.error('No se encontró #admin-notifications-list');
            return;
        }

        notificationsList.innerHTML = '';

        document.querySelectorAll('.open-report').forEach(button => {
            button.removeEventListener('click', button._clickHandler);
            delete button._clickHandler;
        });

        try {
            const publicationsResponse = await fetch('/api/publications/admin/all', {
                method: 'GET',
                headers: {
                    'x-user-email': localStorage.getItem('currentUserEmail') || ''
                }
            });

            if (!publicationsResponse.ok) {
                throw new Error(`Error ${publicationsResponse.status}: ${publicationsResponse.statusText}`);
            }

            const publicationsData = await publicationsResponse.json();

            let reports = [];
            try {
                const reportsResponse = await fetch('/api/publications/admin/reports/admin/all', {
                    method: 'GET',
                    headers: {
                        'x-user-email': localStorage.getItem('currentUserEmail') || ''
                    }
                });

                if (!reportsResponse.ok) {
                    throw new Error(`Error ${reportsResponse.status}: ${reportsResponse.statusText}`);
                }

                const reportsData = await reportsResponse.json();
                if (reportsData.success && reportsData.reports) {
                    reports = reportsData.reports;
                }
            } catch (error) {
                console.warn('Error al obtener reportes para notificaciones:', error.message);
            }

            const pendingPublications = publicationsData.success && publicationsData.publications
                ? publicationsData.publications.filter(pub => pub.status === 'pending')
                : [];

            if (pendingPublications.length === 0 && reports.length === 0) {
                notificationsList.innerHTML = `
                    <div class="no-notifications">
                        <span>📢</span>
                        <p>No hay notificaciones pendientes.</p>
                    </div>
                `;
                return;
            }

            pendingPublications.forEach(pub => {
                const notificationCard = document.createElement('div');
                notificationCard.className = 'notification-card';

                let spaceIcon;
                switch (pub.type.toLowerCase()) {
                    case 'apartamento':
                        spaceIcon = '🏢';
                        break;
                    case 'casa':
                        spaceIcon = '🏡';
                        break;
                    case 'habitacion':
                        spaceIcon = '🛏️';
                        break;
                    case 'parqueo':
                        spaceIcon = '🚗';
                        break;
                    case 'bodega':
                        spaceIcon = '📦';
                        break;
                    default:
                        spaceIcon = '🏠';
                }

                const formattedPrice = Number(pub.price).toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
                const ownerName = pub.owner_name || 'Desconocido';

                notificationCard.innerHTML = `
                    <span class="space-icon">${spaceIcon}</span>
                    <div class="notification-content">
                        <h3>${pub.title}</h3>
                        <p><strong>Tipo:</strong> ${pub.type.charAt(0).toUpperCase() + pub.type.slice(1)}</p>
                        <p><strong>Precio:</strong> ${formattedPrice}</p>
                        <p><strong>Disponibilidad:</strong> ${pub.availability.replace(/_/g, ' ').charAt(0).toUpperCase() + pub.availability.replace(/_/g, ' ').slice(1)}</p>
                        <p><strong>Propietario:</strong> ${ownerName}</p>
                        <button class="notification-action-btn review" data-id="${pub.id}" onclick="window.renderPublicationDetails(${pub.id})">Revisar</button>
                    </div>
                `;

                notificationsList.appendChild(notificationCard);
            });

            reports.forEach(report => {
                const notificationCard = document.createElement('div');
                notificationCard.className = 'notification-card';

                const reasonText = {
                    contenido_inapropiado: 'Contenido Inapropiado',
                    informacion_falsa: 'Información Falsa',
                    estafa: 'Sospecha de Estafa',
                    otro: 'Otro'
                }[report.reason] || 'Otro';

                notificationCard.innerHTML = `
                    <span class="space-icon">🚨</span>
                    <div class="notification-content">
                        <h3>Reporte #${report.case_number}</h3>
                        <p><strong>Publicación:</strong> ${report.publication_title || 'No disponible'}</p>
                        <p><strong>Motivo:</strong> ${reasonText}</p>
                        <p><strong>Usuario:</strong> ${report.tenant_name || report.tenant_email}</p>
                        <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                            <button class="notification-action-btn view-publication" data-id="${report.publication_id}" onclick="window.renderPublicationDetails(${report.publication_id})">Ver la publicación</button>
                            <button class="notification-action-btn open-report" data-report='${JSON.stringify(report)}'>Abrir reporte</button>
                        </div>
                    </div>
                `;

                notificationsList.appendChild(notificationCard);
            });

            document.querySelectorAll('.open-report').forEach(button => {
                const handler = () => {
                    const report = JSON.parse(button.dataset.report);
                    showReportModal(report);
                };
                button.addEventListener('click', handler);
                button._clickHandler = handler;
            });
        } catch (error) {
            console.error('Error al cargar notificaciones:', error.message);
            notificationsList.innerHTML = `
                <p class="no-notifications error">Error al cargar las notificaciones.</p>
            `;
        }
    }

    window.fetchAdminNotifications = fetchAdminNotifications;

    async function restoreDashboard() {
        if (!mainContent) {
            console.error('No se encontró #main-content');
            return;
        }
        mainContent.innerHTML = '';
        mainContent.innerHTML = originalDashboardContent;
        await fetchAdminStats();
        await fetchAdminNotifications();
    }

    const existingStyle = document.querySelector('style[data-notifications]');
    if (!existingStyle) {
        const style = document.createElement('style');
        style.setAttribute('data-notifications', '');
        style.innerHTML = `
            .dashboard-columns {
                display: flex;
                flex-wrap: wrap;
                gap: 2rem;
                margin-top: 2rem;
            }
            .notifications-section {
                flex: 1;
                min-width: 300px;
            }
            .notifications-section h2 {
                font-family: 'Roboto', sans-serif;
                color: #2b6b6b;
                font-size: 1.5rem;
                margin-bottom: 1rem;
            }
            .notifications-list {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }
            .notification-card {
                display: flex;
                background: #fff;
                border-radius: 12px;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                padding: 1rem;
                align-items: center;
                gap: 1rem;
            }
            .space-icon {
                font-size: 2.5rem;
                width: 50px;
                height: 50px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .notification-content {
                flex: 1;
            }
            .notification-content h3 {
                font-family: 'Roboto', sans-serif;
                font-size: 1.2rem;
                color: #333;
                margin-bottom: 0.5rem;
            }
            .notification-content p {
                font-family: 'Roboto', sans-serif;
                font-size: 0.9rem;
                color: #666;
                margin: 0.2rem 0;
            }
            .notification-action-btn {
                background: #4c9f9f;
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 6px;
                cursor: pointer;
                font-family: 'Roboto', sans-serif;
                font-weight: 500;
                transition: background 0.3s ease;
            }
            .notification-action-btn:hover {
                opacity: 0.9;
            }
            .no-notifications {
                text-align: center;
                padding: 2rem;
                font-family: 'Roboto', sans-serif;
                color: #555;
            }
            .no-notifications span {
                font-size: 2rem;
                display: block;
                margin-bottom: 1rem;
            }
            .no-notifications.error {
                color: #dc2626;
            }
            .no-data-message {
                text-align: center;
                font-family: 'Roboto', sans-serif;
                color: #555;
                margin-top: 1rem;
            }
        `;
        document.head.appendChild(style);
    }

    const dashboardContent = document.querySelector('.dashboard-content');
    if (dashboardContent) {
        fetchAdminStats();
        fetchAdminNotifications();
    }

    if (dashboardLink) {
        dashboardLink.addEventListener('click', (event) => {
            event.preventDefault();
            restoreDashboard();
        });
    }
});

//Bloque para revisar las publicaciones
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
                background: #2b6b6b; color: white;
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

    // Función para mostrar el formulario de rechazo
    function showRejectionForm(publicationId, callback) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background-color: rgba(0,0,0,0.5); z-index: 2999; opacity: 0;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(overlay);

        const formDiv = document.createElement('div');
        formDiv.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background-color: #fff; padding: 2rem; border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 3000; width: 90%; max-width: 500px;
            font-family: 'Roboto', sans-serif; color: #1f2937; opacity: 0;
            transition: opacity 0.3s ease, transform 0.3s ease;
        `;
        formDiv.innerHTML = `
            <h3 style="margin-bottom: 1.5rem; color: #b91c1c; font-size: 1.5rem;">Rechazar Publicación</h3>
            <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Motivo del Rechazo:</label>
                <select id="rejection-reason" style="
                    width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px;
                    font-size: 1rem; color: #1f2937; background-color: #f9fafb;
                ">
                    <option value="Información Incompleta">Información Incompleta</option>
                    <option value="Fotos de Baja Calidad">Fotos de Baja Calidad</option>
                    <option value="Contenido Inapropiado">Contenido Inapropiado</option>
                    <option value="Precio No Razonable">Precio No Razonable</option>
                    <option value="Otros">Otros</option>
                </select>
            </div>
            <div style="margin-bottom: 1.5rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Descripción del Rechazo:</label>
                <textarea id="rejection-details" rows="4" style="
                    width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px;
                    font-size: 1rem; color: #1f2937; background-color: #f9fafb; resize: vertical;
                " placeholder="Explica los detalles del rechazo..."></textarea>
            </div>
            <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                <button id="cancel-btn" style="
                    background-color: #f3f4f6; color: #4b5563; border: none;
                    padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 500;
                ">Cancelar</button>
                <button id="submit-btn" style="
                    background: linear-gradient(135deg, #b91c1c, #ef4444); color: white;
                    border: none; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 500;
                ">Rechazar</button>
            </div>
        `;
        document.body.appendChild(formDiv);

        setTimeout(() => {
            overlay.style.opacity = '1';
            formDiv.style.opacity = '1';
        }, 10);

        formDiv.querySelector('#cancel-btn').addEventListener('click', () => {
            overlay.style.opacity = '0';
            formDiv.style.opacity = '0';
            formDiv.style.transform = 'translate(-50%, -60%)';
            setTimeout(() => {
                document.body.removeChild(overlay);
                document.body.removeChild(formDiv);
            }, 300);
        });

        formDiv.querySelector('#submit-btn').addEventListener('click', () => {
            const reason = formDiv.querySelector('#rejection-reason').value;
            const rejectionDetails = formDiv.querySelector('#rejection-details').value.trim();

            if (!rejectionDetails) {
                alert('Por favor, proporciona los detalles del rechazo.');
                return;
            }

            overlay.style.opacity = '0';
            formDiv.style.opacity = '0';
            formDiv.style.transform = 'translate(-50%, -60%)';
            setTimeout(() => {
                document.body.removeChild(overlay);
                document.body.removeChild(formDiv);
            }, 300);

            callback(reason, rejectionDetails);
        });
    }

    // Función para mostrar el loading spinner
    function showLoadingSpinner(action = 'aprobación') {
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
            <p style="margin-top: 1rem;">Procesando ${action}...</p>
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

    async function restoreDashboard() {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;
      
        // ✅ Limpia el contenido anterior antes de restaurar
        mainContent.innerHTML = ''; 
      
        // ✅ Restaura el contenido original del dashboard
        mainContent.innerHTML = originalDashboardContent;
      
        // ✅ Refresca estadísticas y notificaciones frescas
        await fetchAdminStats(); 
        await fetchAdminNotifications();
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

    // Función para mostrar los detalles de una publicación
    async function renderPublicationDetails(publicationId) {
        if (!mainContent) {
            console.error('No se encontró #main-content');
            return;
        }

        try {
            mainContent.innerHTML = `
                <div class="loading-spinner" style="opacity: 1;">
                    <div class="spinner"></div>
                    <p>Cargando publicación...</p>
                </div>
            `;

            const response = await fetch(`/api/publications/admin/${publicationId}`, {
                method: 'GET',
                headers: {
                    'x-user-email': localStorage.getItem('currentUserEmail') || ''
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('La respuesta no es un JSON válido');
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Error al obtener la publicación');
            }

            const publication = data.publication;
            const images = data.images || [];
            const address = publication.address || {};

            const coverImage = images.length > 0 ? images[0] : '/img/house_default.png';
            const galleryImages = images.length > 0 ? images : [];

            const formattedPrice = Number(publication.price).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

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
                    formattedAvailability = publication.availability.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            }

            const formattedType = publication.type.charAt(0).toUpperCase() + publication.type.slice(1);
            const ownerName = publication.owner_name || 'Desconocido';
            const ownerProfilePicture = publication.owner_profile_picture || '/img/default-profile.png';

            // Construir la dirección para mostrar
            let addressString = `${address.barrio || 'N/A'}, ${address.calle_carrera || 'N/A'} #${address.numero || 'N/A'}`;
            if (address.conjunto_torre) addressString += `, ${address.conjunto_torre}`;
            if (address.apartamento) addressString += `, Apartamento: ${address.apartamento}`;
            if (address.piso) addressString += `, Piso: ${address.piso}`;

            // Determinar qué botones mostrar según el estado de la publicación
            let actionButtons = '';
            if (publication.status === 'available') {
                actionButtons = `
                `;
            } else if (publication.status === 'rejected') {
                actionButtons = `
                `;
            } else {
                actionButtons = `
                    <button class="action-btn approve" data-id="${publication.id}">Aceptar</button>
                    <button class="action-btn reject" data-id="${publication.id}">Rechazar</button>
                `;
            }

            mainContent.innerHTML = `
                <div class="publication-details">
                    <button class="back-btn">Regresar al menú principal</button>
                    <h1>${publication.title}</h1>
                    <div class="publication-images">
                        <img src="${coverImage}" alt="Portada de ${publication.title}" class="cover-image">
                    </div>
                    <div class="publication-info">
                        <div class="info-row">
                            <p><strong>Descripción:</strong> ${publication.description}</p>
                        </div>
                        <div class="info-row">
                            <p><strong>Dirección:</strong> ${addressString}</p>
                        </div>
                        <div class="info-row">
                            <p><strong>Precio:</strong> ${formattedPrice}</p>
                        </div>
                        <div class="info-row">
                            <p><strong>Tipo:</strong> ${formattedType}</p>
                            <p><strong>Disponibilidad:</strong> ${formattedAvailability}</p>
                        </div>
                        <div class="info-row">
                            <p><strong>Condiciones:</strong> ${publication.conditions || 'Se permite mascota pequeña. Contrato mínimo de 1 año.'}</p>
                        </div>
                        <div class="info-row">
                            <p><strong>Fecha de Creación:</strong> ${new Date(publication.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div class="image-gallery">
                        <h3>Galería de la publicación</h3>
                        <div class="gallery-container">
                            ${galleryImages.map(img => `
                                <img src="${img}" alt="Imagen de ${publication.title}" class="gallery-image" data-full="${img}">
                            `).join('')}
                        </div>
                    </div>
                    <div class="owner-info">
                        <h3>Acerca del arrendador</h3>
                        <div class="owner-details">
                            <img src="${ownerProfilePicture}" alt="Imagen del usuario" class="owner-image">
                            <div class="owner-text">
                                <p><strong>Nombre del arrendador o propietario:</strong> ${ownerName}</p>
                                <p><strong>Fecha de creación de cuenta:</strong> ${new Date(publication.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                    <div class="publication-actions">
                        ${actionButtons}
                    </div>
                </div>
            `;

            // Añadir estilos CSS para mejorar la separación
            const style = document.createElement('style');
            style.innerHTML = `
                .publication-details {
                    max-width: 1200px;
                    margin: 2rem auto;
                    padding: 0 1rem;
                }

                .publication-details h1 {
                    font-family: 'Roboto', sans-serif;
                    color: #2b6b6b;
                    font-size: 2rem;
                    margin-bottom: 1.5rem;
                }

                .back-btn {
                    background: #e5e7eb;
                    color: #374151;
                    border: none;
                    padding: 0.6rem 1.2rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-family: 'Roboto', sans-serif;
                    font-size: 0.9rem;
                    font-weight: 500;
                    margin-bottom: 1rem;
                }

                .back-btn:hover {
                    background: #d1d5db;
                }

                .publication-images {
                    margin-bottom: 2rem;
                }

                .cover-image {
                    width: 100%;
                    max-height: 400px;
                    object-fit: cover;
                    border-radius: 8px;
                }

                .publication-info {
                    background: #f9fafb;
                    padding: 1.5rem;
                    border-radius: 8px;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                    margin-bottom: 2rem;
                }

                .info-row {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 2rem;
                    margin-bottom: 1.5rem;
                }

                .info-row p {
                    flex: 1;
                    min-width: 300px;
                    font-family: 'Roboto', sans-serif;
                    font-size: 1rem;
                    color: #333;
                    margin: 0;
                }

                .info-row p strong {
                    color: #2b6b6b;
                    font-weight: 600;
                }

                .image-gallery {
                    margin-bottom: 2rem;
                }

                .image-gallery h3 {
                    font-family: 'Roboto', sans-serif;
                    color: #2b6b6b;
                    font-size: 1.5rem;
                    margin-bottom: 1rem;
                }

                .gallery-container {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 1rem;
                }

                .gallery-image {
                    width: 100%;
                    height: 150px;
                    object-fit: cover;
                    border-radius: 6px;
                    cursor: pointer;
                }

                .owner-info {
                    background: #f9fafb;
                    padding: 1.5rem;
                    border-radius: 8px;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                    margin-bottom: 2rem;
                }

                .owner-info h3 {
                    font-family: 'Roboto', sans-serif;
                    color: #2b6b6b;
                    font-size: 1.5rem;
                    margin-bottom: 1rem;
                }

                .owner-details {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .owner-image {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    object-fit: cover;
                }

                .owner-text p {
                    font-family: 'Roboto', sans-serif;
                    font-size: 1rem;
                    color: #333;
                    margin: 0.5rem 0;
                }

                .owner-text p strong {
                    color: #2b6b6b;
                    font-weight: 600;
                }

                .publication-actions {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                }

                .action-btn {
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

                .action-btn:hover {
                    background: linear-gradient(135deg, #4c9f9f, #2b6b6b);
                }

                /* Media Queries para diseño responsivo */
                @media (max-width: 768px) {
                    .info-row {
                        flex-direction: column;
                        gap: 1rem;
                    }

                    .info-row p {
                        min-width: 100%;
                    }

                    .gallery-container {
                        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                    }
                }

                @media (max-width: 480px) {
                    .publication-details h1 {
                        font-size: 1.5rem;
                    }

                    .cover-image {
                        max-height: 300px;
                    }

                    .gallery-image {
                        height: 120px;
                    }

                    .owner-details {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .owner-image {
                        width: 60px;
                        height: 60px;
                    }

                    .publication-actions {
                        flex-direction: column;
                    }

                    .action-btn {
                        width: 100%;
                    }
                }
            `;
            document.head.appendChild(style);

            // Render "All Publications"
            async function renderAllPublications() {
                if (!mainContent) {
                    console.error('No se encontró #main-content');
                    return;
                }

                mainContent.innerHTML = `
                    <div class="all-publications-section">
                        <h1>Todas las Publicaciones</h1>
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

                // Add CSS for publications and filter form
                const style = document.createElement('style');
                style.innerHTML = `
                    .all-publications-section {
                        max-width: 1200px;
                        margin: 2rem auto;
                        padding: 0 1rem;
                    }

                    .all-publications-section h1 {
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
                        background: #4c9f9f;
                        color: white;
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
                        background: #2b6b6b;
                    }

                    .publication-action-btn:disabled {
                        background: #e5e7eb;
                        color: #9ca3af;
                        cursor: not-allowed;
                    }

                    .status-tag {
                        display: inline-flex;
                        align-items: center;
                        padding: 0.4rem 0.8rem;
                        border-radius: 6px;
                        font-size: 0.85rem;
                        font-weight: 600;
                        margin: 0.5rem 1rem;
                        letter-spacing: 0.3px;
                    }

                    .status-pending {
                        background-color: #fffbeb;
                        color: #92400e;
                    }

                    .status-pending::before {
                        content: "•";
                        color: #f59e0b;
                        margin-right: 0.4rem;
                        font-size: 1.2rem;
                        line-height: 0;
                    }

                    .status-available {
                        background-color: #ecfdf5;
                        color: #047857;
                    }

                    .status-available::before {
                        content: "•";
                        color: #10b981;
                        margin-right: 0.4rem;
                        font-size: 1.2rem;
                        line-height: 0;
                    }

                    .status-rejected {
                        background-color: #fef2f2;
                        color: #b91c1c;
                    }

                    .status-rejected::before {
                        content: "•";
                        color: #ef4444;
                        margin-right: 0.4rem;
                        font-size: 1.2rem;
                        line-height: 0;
                    }

                    .rejected-message {
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

                    /* Media Queries for Responsive Design */
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

                // Add event listeners for the filter form
                const filterStatus = document.getElementById('filter-status');
                const filterTitle = document.getElementById('filter-title');
                const filterType = document.getElementById('filter-type');
                const filterBtn = document.getElementById('filter-btn');
                const resetBtn = document.getElementById('reset-btn');

                // Fetch publications with filters
                async function fetchFilteredPublications() {
                    const status = filterStatus.value;
                    const title = filterTitle.value.trim();
                    const type = filterType.value;

                    // Build query parameters
                    const params = new URLSearchParams();
                    if (status) params.append('status', status);
                    if (title) params.append('title', title);
                    if (type) params.append('type', type);

                    await fetchAllPublications(params.toString());
                }

                // Event listener for filter button
                filterBtn.addEventListener('click', () => {
                    fetchFilteredPublications();
                });

                // Event listener for Enter key in title input
                filterTitle.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        fetchFilteredPublications();
                    }
                });

                // Event listener for reset button
                resetBtn.addEventListener('click', () => {
                    filterStatus.value = '';
                    filterTitle.value = '';
                    filterType.value = '';
                    fetchAllPublications(); // Fetch all publications without filters
                });

                // Initial fetch without filters
                await fetchAllPublications();
            }                

            // Fetch and display all publications
            async function fetchAllPublications(queryString = '') {
                const publicationsList = document.getElementById('publications-list');
                if (!publicationsList) {
                    console.error('No se encontró #publications-list');
                    return;
                }

                showLoadingSpinner();

                try {
                    const url = queryString ? `/api/publications/admin/all?${queryString}` : '/api/publications/admin/all';
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'x-user-email': localStorage.getItem('currentUserEmail') || ''
                        }
                    });

                    if (!response.ok) {
                        throw new Error(`Error ${response.status}: ${response.statusText}`);
                    }

                    const data = await response.json();

                    hideLoadingSpinner();

                    publicationsList.innerHTML = '';

                    if (!data.success || !data.publications || data.publications.length === 0) {
                        publicationsList.innerHTML = `
                            <div class="no-publications">
                                <span>📋</span>
                                <p>No hay publicaciones registradas.</p>
                            </div>
                        `;
                        return;
                    }

                    data.publications.forEach(publication => {
                        const publicationCard = document.createElement('div');
                        publicationCard.className = 'publication-card';

                        const formattedPrice = Number(publication.price).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
                        const isRejected = publication.status === 'rejected';
                        const imageSrc = publication.image_url ? publication.image_url : '/img/house_default.png';
                        const ownerName = publication.owner_name || 'Desconocido';

                        // Mapear el estado a una etiqueta visual
                        let statusLabel = '';
                        switch (publication.status) {
                            case 'pending':
                                statusLabel = '<span class="status-tag status-pending">Pendiente</span>';
                                break;
                            case 'available':
                                statusLabel = '<span class="status-tag status-available">Aprobada</span>';
                                break;
                            case 'rejected':
                                statusLabel = '<span class="status-tag status-rejected">Rechazada</span>';
                                break;
                        }

                        publicationCard.innerHTML = `
                            <img src="${imageSrc}" alt="${publication.title}" class="publication-image">
                            <h3>${publication.title}</h3>
                            <p><strong>Precio:</strong> ${formattedPrice}</p>
                            <p><strong>Arrendador:</strong> ${ownerName}</p>
                            <p><strong>Estado:</strong> ${statusLabel}</p>
                            <div class="publication-actions">
                                <button class="publication-action-btn view" data-id="${publication.id}">Revisar Publicación</button>
                            </div>
                            ${isRejected ? '<p class="rejected-message">Usuario debe modificar su publicación</p>' : ''}
                        `;

                        publicationsList.appendChild(publicationCard);

                        const viewBtn = publicationCard.querySelector('.view');
                        viewBtn.addEventListener('click', () => {
                            window.renderPublicationDetails(publication.id);
                        });
                    });
                } catch (error) {
                    hideLoadingSpinner();
                    console.error('Error obteniendo las publicaciones:', error);
                    publicationsList.innerHTML = `
                        <p class="no-publications error">Error al cargar las publicaciones: ${error.message}</p>
                    `;
                }
            }

            // Añadir eventos a los botones
            mainContent.querySelector('.back-btn').addEventListener('click', (event) => {
                event.preventDefault(); // Evita comportamiento por defecto si es un <a>
                renderAllPublications(); // Llama a la función que carga todas las publicaciones
            });

            const approveBtn = mainContent.querySelector('.action-btn.approve');
            const rejectBtn = mainContent.querySelector('.action-btn.reject');

            if (approveBtn) {
                approveBtn.addEventListener('click', async () => {
                    await updatePublicationStatus(publication.id, 'available');
                });
            }

            if (rejectBtn) {
                rejectBtn.addEventListener('click', () => {
                    showRejectionForm(publication.id, async (reason, rejectionDetails) => {
                        await updatePublicationStatus(publication.id, 'rejected', reason, rejectionDetails);
                    });
                });
            }

            // Añadir eventos a las imágenes de la galería
            const galleryImagesElements = mainContent.querySelectorAll('.gallery-image');
            galleryImagesElements.forEach(img => {
                img.addEventListener('click', () => {
                    const fullImageSrc = img.getAttribute('data-full');
                    showImageModal(fullImageSrc, img.alt);
                });
            });

        } catch (error) {
            console.error('Error al cargar los detalles de la publicación:', error);
            mainContent.innerHTML = `
                <div class="no-notifications error">
                    <span>❌</span>
                    <p>Error al cargar la publicación: ${error.message}</p>
                    <button class="action-btn" onclick="restoreDashboard()">Volver al Dashboard</button>
                </div>
            `;
        }
    }

        // Render "All Publications"
    async function renderAllPublications() {
            if (!mainContent) {
                console.error('No se encontró #main-content');
                return;
            }
    
            mainContent.innerHTML = `
                <div class="all-publications-section">
                    <h1>Todas las Publicaciones</h1>
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
    
            // Add CSS for publications and filter form
            const style = document.createElement('style');
            style.innerHTML = `
                .all-publications-section {
                    max-width: 1200px;
                    margin: 2rem auto;
                    padding: 0 1rem;
                }
    
                .all-publications-section h1 {
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
                    background: #4c9f9f;
                    color: white;
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
                    background: #2b6b6b;
                }
    
                .publication-action-btn:disabled {
                    background: #e5e7eb;
                    color: #9ca3af;
                    cursor: not-allowed;
                }
    
                .status-tag {
                    display: inline-flex;
                    align-items: center;
                    padding: 0.4rem 0.8rem;
                    border-radius: 6px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    margin: 0.5rem 1rem;
                    letter-spacing: 0.3px;
                }
    
                .status-pending {
                    background-color: #fffbeb;
                    color: #92400e;
                }
    
                .status-pending::before {
                    content: "•";
                    color: #f59e0b;
                    margin-right: 0.4rem;
                    font-size: 1.2rem;
                    line-height: 0;
                }
    
                .status-available {
                    background-color: #ecfdf5;
                    color: #047857;
                }
    
                .status-available::before {
                    content: "•";
                    color: #10b981;
                    margin-right: 0.4rem;
                    font-size: 1.2rem;
                    line-height: 0;
                }
    
                .status-rejected {
                    background-color: #fef2f2;
                    color: #b91c1c;
                }
    
                .status-rejected::before {
                    content: "•";
                    color: #ef4444;
                    margin-right: 0.4rem;
                    font-size: 1.2rem;
                    line-height: 0;
                }
    
                .rejected-message {
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
    
                /* Media Queries for Responsive Design */
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
    
            // Add event listeners for the filter form
            const filterStatus = document.getElementById('filter-status');
            const filterTitle = document.getElementById('filter-title');
            const filterType = document.getElementById('filter-type');
            const filterBtn = document.getElementById('filter-btn');
            const resetBtn = document.getElementById('reset-btn');
    
            // Fetch publications with filters
            async function fetchFilteredPublications() {
                const status = filterStatus.value;
                const title = filterTitle.value.trim();
                const type = filterType.value;
    
                // Build query parameters
                const params = new URLSearchParams();
                if (status) params.append('status', status);
                if (title) params.append('title', title);
                if (type) params.append('type', type);
    
                await fetchAllPublications(params.toString());
            }
    
            // Event listener for filter button
            filterBtn.addEventListener('click', () => {
                fetchFilteredPublications();
            });
    
            // Event listener for Enter key in title input
            filterTitle.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    fetchFilteredPublications();
                }
            });
    
            // Event listener for reset button
            resetBtn.addEventListener('click', () => {
                filterStatus.value = '';
                filterTitle.value = '';
                filterType.value = '';
                fetchAllPublications(); // Fetch all publications without filters
            });
    
            // Initial fetch without filters
            await fetchAllPublications();
    }
    
        // Fetch and display all publications
    async function fetchAllPublications(queryString = '') {
            const publicationsList = document.getElementById('publications-list');
            if (!publicationsList) {
                console.error('No se encontró #publications-list');
                return;
            }
    
            showLoadingSpinner();
    
            try {
                const url = queryString ? `/api/publications/admin/all?${queryString}` : '/api/publications/admin/all';
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'x-user-email': localStorage.getItem('currentUserEmail') || ''
                    }
                });
    
                if (!response.ok) {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
    
                const data = await response.json();
    
                hideLoadingSpinner();
    
                publicationsList.innerHTML = '';
    
                if (!data.success || !data.publications || data.publications.length === 0) {
                    publicationsList.innerHTML = `
                        <div class="no-publications">
                            <span>📋</span>
                            <p>No hay publicaciones registradas.</p>
                        </div>
                    `;
                    return;
                }
    
                data.publications.forEach(publication => {
                    const publicationCard = document.createElement('div');
                    publicationCard.className = 'publication-card';
    
                    const formattedPrice = Number(publication.price).toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
                    const isRejected = publication.status === 'rejected';
                    const imageSrc = publication.image_url ? publication.image_url : '/img/house_default.png';
                    const ownerName = publication.owner_name || 'Desconocido';
    
                    // Mapear el estado a una etiqueta visual
                    let statusLabel = '';
                    switch (publication.status) {
                        case 'pending':
                            statusLabel = '<span class="status-tag status-pending">Pendiente</span>';
                            break;
                        case 'available':
                            statusLabel = '<span class="status-tag status-available">Aprobada</span>';
                            break;
                        case 'rejected':
                            statusLabel = '<span class="status-tag status-rejected">Rechazada</span>';
                            break;
                    }
    
                    publicationCard.innerHTML = `
                        <img src="${imageSrc}" alt="${publication.title}" class="publication-image">
                        <h3>${publication.title}</h3>
                        <p><strong>Precio:</strong> ${formattedPrice}</p>
                        <p><strong>Arrendador:</strong> ${ownerName}</p>
                        <p><strong>Estado:</strong> ${statusLabel}</p>
                        <div class="publication-actions">
                            <button class="publication-action-btn view" data-id="${publication.id}">Revisar Publicación</button>
                        </div>
                        ${isRejected ? '<p class="rejected-message">Usuario debe modificar su publicación</p>' : ''}
                    `;
    
                    publicationsList.appendChild(publicationCard);
    
                    const viewBtn = publicationCard.querySelector('.view');
                    viewBtn.addEventListener('click', () => {
                        window.renderPublicationDetails(publication.id);
                    });
                });
            } catch (error) {
                hideLoadingSpinner();
                console.error('Error obteniendo las publicaciones:', error);
                publicationsList.innerHTML = `
                    <p class="no-publications error">Error al cargar las publicaciones: ${error.message}</p>
                `;
            }
    }
    
    // Función para actualizar el estado de la publicación
    async function updatePublicationStatus(publicationId, status, reason = null, rejectionDetails = null) {
        try {
            showLoadingSpinner(status === 'rejected' ? 'rechazo' : 'aprobación');

            const response = await fetch(`/api/publications/admin/${publicationId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': localStorage.getItem('currentUserEmail') || ''
                },
                body: JSON.stringify({ status, reason, rejectionDetails })
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('La respuesta no es un JSON válido');
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Error al actualizar el estado de la publicación');
            }

            hideLoadingSpinner();
            showMessage(`Publicación ${status === 'available' ? 'aprobada' : 'rechazada'} con éxito.`, false);
            setTimeout(() => {
                renderAllPublications();
            }, 1500);
        } catch (error) {
            hideLoadingSpinner();
            console.error('Error al actualizar el estado de la publicación:', error);
            showMessage(`Error al ${status === 'available' ? 'aprobar' : 'rechazar'} la publicación: ${error.message}`, true);
        }
    }

    // Exponer renderPublicationDetails globalmente
    window.renderPublicationDetails = renderPublicationDetails;

    // Añadir estilos para la vista de detalles de la publicación
    const publicationStyles = document.createElement('style');
    publicationStyles.innerHTML = `
        /* Estilos refinados para detalles de publicación */
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
            content: "←";
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
            grid-column: 1 / -1;
            margin-bottom: 1.5rem;
            position: relative;
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
            grid-column: 1 / -1;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
            background-color: #f8fafc;
            border-radius: 10px;
            padding: 1.5rem;
            border: 1px solid #e5eeff;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
        }

        .info-field {
            margin-bottom: 1rem;
        }

        .info-field strong {
            display: block;
            color: #475569;
            font-weight: 500;
            font-size: 0.85rem;
            letter-spacing: 0.5px;
            margin-bottom: 0.4rem;
        }

        .info-field p {
            color: #1f2937;
            font-weight: 400;
            line-height: 1.5;
            margin: 0;
            font-size: 1.05rem;
        }

        .info-field.price p {
            font-size: 1.6rem;
            font-weight: 700;
            color: #1e3a8a;
            display: flex;
            align-items: center;
        }

        .info-field.price p::before {
            content: "$";
            font-size: 1.2rem;
            margin-right: 4px;
            opacity: 0.8;
        }

        .info-field.description {
            grid-column: 1 / span 2;
            padding: 1rem;
            background-color: white;
            border-radius: 8px;
            border: 1px solid #f0f0f0;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .info-field.description p {
            line-height: 1.7;
        }

        .image-gallery {
            margin-top: 2rem;
            grid-column: 1 / -1;
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

        .owner-info {
            margin-top: 2rem;
            grid-column: 1 / -1;
            background-color: #f8faff;
            border-radius: 10px;
            padding: 1.5rem;
            border: 1px solid #e5eeff;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
        }

        .owner-info h3 {
            font-size: 1.2rem;
            margin-bottom: 1.25rem;
            color: #1e3a8a;
            font-weight: 600;
            display: flex;
            align-items: center;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid #e5eeff;
        }

        .owner-info h3::before {
            content: "•";
            margin-right: 0.5rem;
            color: #3b82f6;
            font-size: 1.5rem;
            line-height: 0;
        }

        .owner-details {
            display: flex;
            align-items: center;
            gap: 1.5rem;
        }

        .owner-image {
            width: 70px;
            height: 70px;
            border-radius: 50%;
            object-fit: cover;
            border: 3px solid white;
            box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
        }

        .owner-text {
            flex: 1;
        }

        .owner-text p {
            margin: 0.5rem 0;
            line-height: 1.5;
            font-size: 1rem;
        }

        .owner-text .owner-name {
            font-size: 1.15rem;
            font-weight: 600;
            color: #1e3a8a;
        }

        .owner-text strong {
            color: #64748b;
            font-weight: 500;
            font-size: 0.85rem;
            letter-spacing: 0.3px;
            margin-right: 0.3rem;
        }

        .publication-actions {
            display: flex;
            gap: 1rem;
            margin-top: 2rem;
            grid-column: 1 / -1;
            justify-content: center; /* Centrado para todos los botones */
        }

        .action-btn {
            padding: 0.8rem 1.8rem;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .approve {
            background-color: #ecfdf5;
            border: 1px solid #a7f3d0;
        }

        .approve:hover {
            background-color: #d1fae5;
            border-color: #6ee7b7;
            box-shadow: 0 3px 8px rgba(6, 95, 70, 0.1);
            color: rgb(63, 214, 16);
        }

        .approve::before {
            content: "✓";
            margin-right: 0.5rem;
            font-weight: bold;
        }

        .reject {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
        }

        .reject:hover {
            background-color: #fee2e2;
            border-color: #b91c1c;
            box-shadow: 0 3px 8px rgba(153, 27, 27, 0.1);
        }

        .reject::before {
            content: "✕";
            margin-right: 0.5rem;
            font-weight: bold;
        }

        .delete {
            background-color: #fee2e2;
            border: 1px solid #f87171;
            color: #b91c1c;
        }

        .delete:hover {
            background-color: #fecaca;
            border-color: #dc2626;
            box-shadow: 0 3px 8px rgba(153, 27, 27, 0.1);
        }

        .delete::before {
            content: "🗑️";
            margin-right: 0.5rem;
        }

        .status-tag {
            display: inline-flex;
            align-items: center;
            padding: 0.4rem 0.8rem;
            border-radius: 6px;
            font-size: 0.85rem;
            font-weight: 600;
            margin-top: 0.5rem;
            letter-spacing: 0.3px;
        }

        .status-available {
            background-color: #ecfdf5;
            color: #047857;
        }

        .status-available::before {
            content: "•";
            color: #10b981;
            margin-right: 0.4rem;
            font-size: 1.2rem;
            line-height: 0;
        }

        .status-pending {
            background-color: #fffbeb;
            color: #92400e;
        }

        .status-pending::before {
            content: "•";
            color: #f59e0b;
            margin-right: 0.4rem;
            font-size: 1.2rem;
            line-height: 0;
        }

        .status-unavailable {
            background-color: #fef2f2;
            color: #b91c1c;
        }

        .status-unavailable::before {
            content: "•";
            color: #ef4444;
            margin-right: 0.4rem;
            font-size: 1.2rem;
            line-height: 0;
        }

        /* Estilos para el modal de imagen */
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

        /* Media queries para responsividad */
        @media (max-width: 1024px) {
            .publication-info {
                grid-template-columns: 1fr;
                gap: 1rem;
                padding: 1.25rem;
            }

            .info-field.description {
                grid-column: 1;
                padding: 0.75rem;
            }

            .info-field.price p {
                font-size: 1.4rem;
            }

            .info-field p {
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

        @media (max-width: 768px) {
            .publication-info {
                padding: 1rem;
            }

            .info-field {
                margin-bottom: 0.75rem;
            }

            .info-field strong {
                font-size: 0.8rem;
            }

            .info-field p {
                font-size: 0.95rem;
            }

            .info-field.price p {
                font-size: 1.3rem;
            }

            .info-field.price p::before {
                font-size: 1rem;
            }

            .image-modal {
                max-width: 98vw;
                max-height: 90vh;
            }

            .image-modal img {
                max-height: 70vh;
            }

            .close-modal-btn {
                top: 10px;
                right: 10px;
                font-size: 2rem;
                padding: 0.3rem 0.5rem;
            }
        }

        @media (max-width: 480px) {
            .publication-info {
                padding: 0.75rem;
                border-radius: 8px;
            }

            .info-field {
                margin-bottom: 0.5rem;
            }

            .info-field.description {
                padding: 0.5rem;
            }

            .info-field strong {
                font-size: 0.75rem;
                margin-bottom: 0.3rem;
            }

            .info-field p {
                font-size: 0.9rem;
                line-height: 1.4;
            }

            .info-field.price p {
                font-size: 1.2rem;
            }

            .info-field.price p::before {
                font-size: 0.9rem;
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

// Bloque para conocer todas las publicaciones
document.addEventListener('DOMContentLoaded', function() {
    // DOM Variables
    const mainContent = document.getElementById('main-content');
    const allPublicationsLink = document.querySelector('a[href="revisar-publicaciones"]');
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
            <p style="margin-top: 1rem;">Cargando publicaciones...</p>
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
                document.body.removeChild(loadingOverlay);
                document.body.removeChild(loadingSpinner);
                loadingOverlay = null;
                loadingSpinner = null;
            }, 300);
        }
    }

    // Render "All Publications"
    async function renderAllPublications() {
        if (!mainContent) {
            console.error('No se encontró #main-content');
            return;
        }

        mainContent.innerHTML = `
            <div class="all-publications-section">
                <h1>Todas las Publicaciones</h1>
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

        // Add CSS for publications and filter form
        const style = document.createElement('style');
        style.innerHTML = `
            .all-publications-section {
                max-width: 1200px;
                margin: 2rem auto;
                padding: 0 1rem;
            }

            .all-publications-section h1 {
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
                background: #4c9f9f;
                color: white;
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
                background: #2b6b6b;
            }

            .publication-action-btn:disabled {
                background: #e5e7eb;
                color: #9ca3af;
                cursor: not-allowed;
            }

            .status-tag {
                display: inline-flex;
                align-items: center;
                padding: 0.4rem 0.8rem;
                border-radius: 6px;
                font-size: 0.85rem;
                font-weight: 600;
                margin: 0.5rem 1rem;
                letter-spacing: 0.3px;
            }

            .status-pending {
                background-color: #fffbeb;
                color: #92400e;
            }

            .status-pending::before {
                content: "•";
                color: #f59e0b;
                margin-right: 0.4rem;
                font-size: 1.2rem;
                line-height: 0;
            }

            .status-available {
                background-color: #ecfdf5;
                color: #047857;
            }

            .status-available::before {
                content: "•";
                color: #10b981;
                margin-right: 0.4rem;
                font-size: 1.2rem;
                line-height: 0;
            }

            .status-rejected {
                background-color: #fef2f2;
                color: #b91c1c;
            }

            .status-rejected::before {
                content: "•";
                color: #ef4444;
                margin-right: 0.4rem;
                font-size: 1.2rem;
                line-height: 0;
            }

            .rejected-message {
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

            /* Media Queries for Responsive Design */
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

        // Add event listeners for the filter form
        const filterStatus = document.getElementById('filter-status');
        const filterTitle = document.getElementById('filter-title');
        const filterType = document.getElementById('filter-type');
        const filterBtn = document.getElementById('filter-btn');
        const resetBtn = document.getElementById('reset-btn');

        // Fetch publications with filters
        async function fetchFilteredPublications() {
            const status = filterStatus.value;
            const title = filterTitle.value.trim();
            const type = filterType.value;

            // Build query parameters
            const params = new URLSearchParams();
            if (status) params.append('status', status);
            if (title) params.append('title', title);
            if (type) params.append('type', type);

            await fetchAllPublications(params.toString());
        }

        // Event listener for filter button
        filterBtn.addEventListener('click', () => {
            fetchFilteredPublications();
        });

        // Event listener for Enter key in title input
        filterTitle.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                fetchFilteredPublications();
            }
        });

        // Event listener for reset button
        resetBtn.addEventListener('click', () => {
            filterStatus.value = '';
            filterTitle.value = '';
            filterType.value = '';
            fetchAllPublications(); // Fetch all publications without filters
        });

        // Initial fetch without filters
        await fetchAllPublications();
    }

    // Fetch and display all publications
    async function fetchAllPublications(queryString = '') {
        const publicationsList = document.getElementById('publications-list');
        if (!publicationsList) {
            console.error('No se encontró #publications-list');
            return;
        }

        showLoadingSpinner();

        try {
            const url = queryString ? `/api/publications/admin/all?${queryString}` : '/api/publications/admin/all';
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'x-user-email': localStorage.getItem('currentUserEmail') || ''
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            hideLoadingSpinner();

            publicationsList.innerHTML = '';

            if (!data.success || !data.publications || data.publications.length === 0) {
                publicationsList.innerHTML = `
                    <div class="no-publications">
                        <span>📋</span>
                        <p>No hay publicaciones registradas.</p>
                    </div>
                `;
                return;
            }

            data.publications.forEach(publication => {
                const publicationCard = document.createElement('div');
                publicationCard.className = 'publication-card';

                const formattedPrice = Number(publication.price).toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
                const isRejected = publication.status === 'rejected';
                const imageSrc = publication.image_url ? publication.image_url : '/img/house_default.png';
                const ownerName = publication.owner_name || 'Desconocido';

                // Mapear el estado a una etiqueta visual
                let statusLabel = '';
                switch (publication.status) {
                    case 'pending':
                        statusLabel = '<span class="status-tag status-pending">Pendiente</span>';
                        break;
                    case 'available':
                        statusLabel = '<span class="status-tag status-available">Aprobada</span>';
                        break;
                    case 'rejected':
                        statusLabel = '<span class="status-tag status-rejected">Rechazada</span>';
                        break;
                }

                publicationCard.innerHTML = `
                    <img src="${imageSrc}" alt="${publication.title}" class="publication-image">
                    <h3>${publication.title}</h3>
                    <p><strong>Precio:</strong> ${formattedPrice}</p>
                    <p><strong>Arrendador:</strong> ${ownerName}</p>
                    <p><strong>Estado:</strong> ${statusLabel}</p>
                    <div class="publication-actions">
                        <button class="publication-action-btn view" data-id="${publication.id}">Revisar Publicación</button>
                    </div>
                    ${isRejected ? '<p class="rejected-message">Usuario debe modificar su publicación</p>' : ''}
                `;

                publicationsList.appendChild(publicationCard);

                const viewBtn = publicationCard.querySelector('.view');
                viewBtn.addEventListener('click', () => {
                    window.renderPublicationDetails(publication.id);
                });
            });
        } catch (error) {
            hideLoadingSpinner();
            console.error('Error obteniendo las publicaciones:', error);
            publicationsList.innerHTML = `
                <p class="no-publications error">Error al cargar las publicaciones: ${error.message}</p>
            `;
        }
    }

    // Navigation event listeners
    if (allPublicationsLink) {
        allPublicationsLink.addEventListener('click', (event) => {
            event.preventDefault();
            renderAllPublications();
        });
    }

    if (dashboardLink) {
        dashboardLink.addEventListener('click', (event) => {
            event.preventDefault()
        });
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