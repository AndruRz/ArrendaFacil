document.addEventListener('DOMContentLoaded', () => {
  // Seleccionar elementos
  const menuToggle = document.getElementById('menu-toggle');
  const navbar = document.getElementById('navbar');
  const menuOverlay = document.getElementById('menu-overlay');
  const mainContent = document.getElementById('main-content');

  // Guardar el contenido original de main-content
  const originalMainContent = mainContent.innerHTML;
  const originalNavbarContent = navbar.innerHTML;

  // Verificar si los elementos existen
  if (!menuToggle || !navbar || !menuOverlay || !mainContent) {
    console.error('Error: Faltan elementos esenciales en el DOM.');
    return;
  }

  // Objeto para almacenar los últimos parámetros de filtro
  let lastFilterParams = {
    type: '',
    minPrice: '',
    maxPrice: '',
    availability: ''
  };

  // Función para alternar el menú
  function toggleMenu() {
    console.log('Función toggleMenu ejecutada');
    const isOpen = menuToggle.classList.toggle('open');
    navbar.classList.toggle('active', isOpen);
    menuOverlay.classList.toggle('active', isOpen);
    console.log('Estado del menú:', isOpen ? 'Abierto' : 'Cerrado');
  }

  // Evento para el botón hamburguesa
  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    console.log('Clic en el botón hamburguesa');
    toggleMenu();
  });

  // Evento para cerrar el menú al hacer clic en el overlay
  menuOverlay.addEventListener('click', (e) => {
    e.stopPropagation();
    console.log('Clic en el overlay');
    if (navbar.classList.contains('active')) {
      toggleMenu();
    }
  });

  // Cerrar el menú al hacer clic en un enlace del menú
  navbar.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    e.stopPropagation();
    console.log('Clic en un enlace del navbar:', link.textContent);
    if (navbar.classList.contains('active')) {
      toggleMenu();
    }
  });

  // Cerrar el menú al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (navbar.classList.contains('active') && !navbar.contains(e.target) && !menuToggle.contains(e.target)) {
      console.log('Clic fuera del navbar, cerrando menú');
      toggleMenu();
    }
  });

  // Función para mostrar mensajes de error/exito
  function showMessage(message, isError = true) {
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

  // Función para mostrar el spinner de carga
  function showLoadingSpinner() {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.5); z-index: 2998; opacity: 0;
      transition: opacity 0.3s ease; pointer-events: auto;
    `;
    document.body.appendChild(loadingOverlay);
    const loadingSpinner = document.createElement('div');
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

  // Función para ocultar el spinner de carga
  function hideLoadingSpinner(elements) {
    if (elements?.overlay && elements?.spinner) {
      elements.overlay.style.opacity = '0';
      elements.spinner.style.opacity = '0';
      setTimeout(() => {
        document.body.contains(elements.overlay) && document.body.removeChild(elements.overlay);
        document.body.contains(elements.spinner) && document.body.removeChild(elements.spinner);
      }, 300);
    }
  }

  // Función para restaurar el contenido original
  function restoreHome() {
    mainContent.innerHTML = originalMainContent;
    navbar.innerHTML = originalNavbarContent;
    initializeFAQ();
    window.scrollTo(0, 0);
    // Resetear los parámetros de filtro
    lastFilterParams = { type: '', minPrice: '', maxPrice: '', availability: '' };
  }

  // Nueva función para ver los detalles de una publicación
  async function viewPublicationDetails(publicationId) {
    if (!mainContent) {
      showMessage('Error: No se encontró el contenedor principal.');
      return;
    }
    const elements = showLoadingSpinner();
    try {
      const response = await fetch(`/api/publications/public/${publicationId}`);
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      const data = await response.json();
      if (!data.success || !data.publication) {
        showMessage('No se encontraron detalles para esta publicación.', true);
        hideLoadingSpinner(elements);
        return;
      }
      const publication = data.publication;
      const formattedPrice = Number(publication.price).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
      const formattedAvailability = publication.availability.replace(/_/g, ' ').charAt(0).toUpperCase() + publication.availability.replace(/_/g, ' ').slice(1);
      const formattedType = publication.space_type.charAt(0).toUpperCase() + publication.space_type.slice(1);
      const coverImage = publication.images.length > 0 ? publication.images[0] : '/img/house_default.png';
      const galleryImages = publication.images.length > 0 ? publication.images : [];
      const description = publication.description || 'Sin descripción disponible.';
      const conditions = publication.conditions || 'Se permite mascota pequeña. Contrato mínimo de 1 año.';
      const createdAt = publication.created_at ? new Date(publication.created_at).toLocaleDateString() : 'Fecha no disponible';
      const ownerName = publication.full_name || 'Arrendador no especificado';
      const ownerProfilePicture = publication.profile_picture || '/img/default-profile.png';
      const userCreatedAt = publication.user_created_at ? new Date(publication.user_created_at).toLocaleDateString() : 'Fecha no disponible';
      const address = publication.address || {};

      // Construir la dirección para mostrar
      let addressString = `${address.barrio || 'N/A'}, ${address.calle_carrera || 'N/A'} #${address.numero || 'N/A'}`;
      if (address.conjunto_torre) addressString += `, Conjunto/Torre: ${address.conjunto_torre}`;
      if (address.apartamento) addressString += `, Apartamento: ${address.apartamento}`;
      if (address.piso) addressString += `, Piso: ${address.piso}`;

      // Renderizar vista detallada
      navbar.innerHTML = `
        <a href="#" onclick="window.restoreHome()">Inicio</a>
        <a href="/login">Iniciar Sesión</a>
      `;
      mainContent.innerHTML = `
        <div class="publication-details">
          <button class="back-btn" onclick="window.renderFilteredPublications()">Regresar</button>
          <h1>${publication.title}</h1>
          <div class="publication-images">
            <img src="${coverImage}" alt="Portada de ${publication.title}" class="cover-image">
          </div>
          <div class="publication-info">
            <div class="info-field description"><strong>Descripción:</strong> <p>${description}</p></div>
            <div class="info-field"><strong>Dirección:</strong> <p>${addressString}</p></div>
            <div class="info-field price"><strong>Precio:</strong> <p>${formattedPrice}</p></div>
            <div class="info-field"><strong>Tipo:</strong> <p>${formattedType}</p></div>
            <div class="info-field"><strong>Disponibilidad:</strong> <p>${formattedAvailability}</p></div>
            <div class="info-field"><strong>Condiciones:</strong> <p>${conditions}</p></div>
            <div class="info-field"><strong>Fecha de Creación:</strong> <p>${createdAt}</p></div>
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
                <p><strong>Fecha de creación de cuenta:</strong> ${userCreatedAt}</p>
              </div>
            </div>
          </div>
        </div>
      `;

      // Agrego estilos para la vista detallada
      const style = document.createElement('style');
      style.innerHTML = `
        .publication-details { max-width: 1200px; margin: 2rem auto; padding: 2rem; background: #fff; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); font-family: 'Roboto', sans-serif; color: #374151; }
        .back-btn { background: linear-gradient(135deg, #6b7280, #9ca3af); color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 500; margin-bottom: 1rem; }
        .back-btn:hover { background: linear-gradient(135deg, #9ca3af, #6b7280); }
        .publication-details h1 { font-size: 2rem; color: #2b6b6b; margin-bottom: 1.5rem; }
        .publication-images { margin-bottom: 2rem; }
        .cover-image { width: 100%; max-height: 400px; object-fit: cover; border-radius: 12px; }
        .publication-info { margin-bottom: 2rem; }
        .info-field { margin-bottom: 1rem; display: flex; align-items: flex-start; }
        .info-field strong { min-width: 150px; font-weight: 500; color: #2b6b6b; }
        .info-field p { margin: 0; flex: 1; }
        .image-gallery { margin-bottom: 2rem; }
        .image-gallery h3 { font-size: 1.5rem; color: #2b6b6b; margin-bottom: 1rem; }
        .gallery-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
        .gallery-image { width: 100%; height: 150px; object-fit: cover; border-radius: 8px; cursor: pointer; transition: transform 0.3s ease; }
        .gallery-image:hover { transform: scale(1.05); }
        .owner-info { margin-bottom: 2rem; }
        .owner-info h3 { font-size: 1.5rem; color: #2b6b6b; margin-bottom: 1rem; }
        .owner-details { display: flex; align-items: center; gap: 1.5rem; }
        .owner-image { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; }
        .owner-text p { margin: 0.5rem 0; }
        @media (max-width: 768px) {
          .publication-details { padding: 1rem; margin: 1rem; }
          .cover-image { max-height: 300px; }
          .info-field { flex-direction: column; }
          .info-field strong { min-width: auto; margin-bottom: 0.5rem; }
          .gallery-container { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
          .gallery-image { height: 120px; }
          .owner-details { flex-direction: column; align-items: flex-start; }
        }
        @media (max-width: 480px) {
          .publication-details h1 { font-size: 1.5rem; }
          .image-gallery h3, .owner-info h3 { font-size: 1.2rem; }
          .gallery-container { grid-template-columns: 1fr; }
          .gallery-image { height: 100px; }
          .owner-image { width: 60px; height: 60px; }
        }
      `;
      document.head.appendChild(style);

      // Agregar evento para ampliar imágenes (modal simple)
      mainContent.querySelectorAll('.gallery-image').forEach(img => {
        img.addEventListener('click', () => {
          const modal = document.createElement('div');
          modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); z-index: 3000; display: flex;
            justify-content: center; align-items: center; cursor: pointer;
          `;
          modal.innerHTML = `<img src="${img.getAttribute('data-full')}" style="max-width: 90%; max-height: 90%; object-fit: contain;">`;
          document.body.appendChild(modal);
          modal.addEventListener('click', () => document.body.removeChild(modal));
        });
      });

      hideLoadingSpinner(elements);
      // Desplazar hacia arriba al cargar los detalles
      window.scrollTo(0, 0);
    } catch (error) {
      hideLoadingSpinner(elements);
      mainContent.innerHTML = `
        <div class="no-publications error">
          <span>❌</span>
          <p>Error al cargar la publicación: ${error.message}</p>
          <button class="action-btn" onclick="window.renderFilteredPublications()">Volver a Propiedades</button>
        </div>
      `;
      const errorStyle = document.createElement('style');
      errorStyle.innerHTML = `
        .action-btn { background: linear-gradient(135deg, #2b6b6b, #4c9f9f); color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 500; }
        .action-btn:hover { background: linear-gradient(135deg, #4c9f9f, #2b6b6b); }
      `;
      document.head.appendChild(errorStyle);
    }
  }

  // Función para obtener publicaciones públicas
  async function fetchPublicPublications(queryString = 'status=available') {
    const publicationsList = document.getElementById('publications-list');
    if (!publicationsList) {
      showMessage('Error: No se encontró el contenedor de publicaciones.');
      return;
    }
    const elements = showLoadingSpinner();
    try {
      const response = await fetch(`/api/publications/public/available?${queryString}`);
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      const data = await response.json();
      publicationsList.innerHTML = '';
      if (!data.success || !data.publications || data.publications.length === 0) {
        publicationsList.innerHTML = `
          <div class="no-publications">
            <span>📋</span>
            <p>No se encontraron propiedades disponibles con los criterios seleccionados. Filtra de nuevo o limpia el formulario.</p>
          </div>
        `;
        hideLoadingSpinner(elements);
        return;
      }
      data.publications.forEach(publication => {
        const publicationCard = document.createElement('div');
        publicationCard.className = 'publication-card';
        const formattedPrice = Number(publication.price).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
        const imageSrc = publication.images.length > 0 ? publication.images[0] : '/img/house_default.png';
        const type = publication.space_type || 'Desconocido';
        publicationCard.innerHTML = `
          <img src="${imageSrc}" alt="${publication.title}" class="publication-image">
          <h3>${publication.title}</h3>
          <p><strong>Tipo de Espacio:</strong> ${type.charAt(0).toUpperCase() + type.slice(1)}</p>
          <p><strong>Precio:</strong> ${formattedPrice}</p>
          <p><strong>Disponibilidad:</strong> ${publication.availability.replace(/_/g, ' ').charAt(0).toUpperCase() + publication.availability.replace(/_/g, ' ').slice(1)}</p>
          <div class="publication-actions">
            <button class="publication-action-btn view" data-id="${publication.id}">Conocer Publicación</button>
          </div>
        `;
        publicationsList.appendChild(publicationCard);
        publicationCard.querySelector('.view').addEventListener('click', () => {
          viewPublicationDetails(publication.id);
        });
      });
      hideLoadingSpinner(elements);
    } catch (error) {
      hideLoadingSpinner(elements);
      publicationsList.innerHTML = `<p class="no-publications error">Error al cargar las propiedades: ${error.message}</p>`;
    }
  }

  // Función para renderizar publicaciones filtradas
  async function renderFilteredPublications() {
    // Cambiar el navbar
    navbar.innerHTML = `
      <a href="#" onclick="window.restoreHome()">Inicio</a>
      <a href="/login">Iniciar Sesión</a>
    `;
    // Reemplazar el contenido principal
    mainContent.innerHTML = `
      <div class="available-publications-section">
        <h1>Explorar Propiedades</h1>
        <div class="filter-section">
          <div class="filter-form">
            <div class="filter-group">
              <label for="tipoEspacio">Tipo de Espacio:</label>
              <select id="tipoEspacio">
                <option value="">Todos</option>
                <option value="casa">Casa</option>
                <option value="apartamento">Apartamento</option>
                <option value="habitacion">Habitación</option>
                <option value="parqueo">Parqueadero</option>
                <option value="bodega">Bodega</option>
              </select>
            </div>
            <div class="filter-group">
              <label for="precioMin">Precio Mínimo:</label>
              <input type="number" id="precioMin" placeholder="Ej: 500000" min="0">
            </div>
            <div class="filter-group">
              <label for="precioMax">Precio Máximo:</label>
              <input type="number" id="precioMax" placeholder="Ej: 1000000" min="0">
            </div>
            <div class="filter-group">
              <label for="disponibilidad">Disponibilidad:</label>
              <select id="disponibilidad">
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
    // Agregar estilos
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
      .publication-card { background: #fff; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); overflow: hidden; transition: transform 0.3s ease, box-shadow 0.3s ease; border: 1px solid #e5e7eb; display: flex; flex-direction: column; }
      .publication-card:hover { transform: translateY(-5px); box-shadow: 0 6px 15px rgba(0,0,0,0.15); }
      .publication-image { width: 100%; height: 180px; object-fit: cover; }
      .publication-card h3 { font-family: 'Roboto', sans-serif; font-size: 1.25rem; font-weight: 600; color: #333; margin: 0.75rem 0; padding-left: 1rem; text-align: left; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; max-height: 3.2em; }
      .publication-card p { font-family: 'Roboto', sans-serif; font-size: 0.9rem; color: #666; margin: 0.3rem 0; padding-left: 1rem; }
      .publication-actions { display: flex; justify-content: center; padding: 0.75rem 1rem; border-top: 1px solid #e5e7eb; background: #f9fafb; margin-top: auto; }
      .publication-action-btn { background: linear-gradient(135deg, #2b6b6b, #4c9f9f); color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-family: 'Roboto', sans-serif; font-size: 0.85rem; font-weight: 500; transition: background 0.3s ease; }
      .publication-action-btn:hover:not(:disabled) { background: linear-gradient(135deg, #4c9f9f, #2b6b6b); }
      .no-publications { text-align: center; padding: 2rem; font-family: 'Roboto', sans-serif; color: #555; }
      .no-publications span { font-size: 2rem; display: block; margin-bottom: 1rem; }
      .no-publications.error { color: #dc2626; }
      @media (max-width: 768px) { .publications-list { grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); } .filter-form { flex-direction: column; align-items: stretch; } .filter-form button { margin-top: 0.5rem; } }
      @media (max-width: 480px) { .publications-list { grid-template-columns: 1fr; } .publication-card h3 { font-size: 1.1rem; } .publication-action-btn { margin-bottom: 0.5rem; } }
    `;
    document.head.appendChild(style);

    // Pre-llenar los campos de filtro con los últimos parámetros
    const tipoEspacio = document.querySelector('.filter-section #tipoEspacio');
    const precioMin = document.querySelector('.filter-section #precioMin');
    const precioMax = document.querySelector('.filter-section #precioMax');
    const disponibilidad = document.querySelector('.filter-section #disponibilidad');

    if (tipoEspacio) tipoEspacio.value = lastFilterParams.type || '';
    if (precioMin) precioMin.value = lastFilterParams.minPrice || '';
    if (precioMax) precioMax.value = lastFilterParams.maxPrice || '';
    if (disponibilidad) disponibilidad.value = lastFilterParams.availability || '';

    // Configurar eventos de filtrado
    const filterBtn = document.getElementById('filter-btn');
    const resetBtn = document.getElementById('reset-btn');

    async function fetchFilteredPublications() {
      const params = new URLSearchParams();
      params.append('status', 'available');
      if (tipoEspacio.value) params.append('type', tipoEspacio.value);
      if (precioMin.value.trim()) params.append('minPrice', precioMin.value.trim());
      if (precioMax.value.trim()) params.append('maxPrice', precioMax.value.trim());
      if (disponibilidad.value) params.append('availability', disponibilidad.value);
      // Actualizar los últimos parámetros
      lastFilterParams = {
        type: tipoEspacio.value || '',
        minPrice: precioMin.value.trim() || '',
        maxPrice: precioMax.value.trim() || '',
        availability: disponibilidad.value || ''
      };
      await fetchPublicPublications(params.toString());
    }

    if (filterBtn && resetBtn) {
      filterBtn.addEventListener('click', fetchFilteredPublications);
      [precioMin, precioMax].forEach(input => {
        if (input) {
          input.addEventListener('keypress', (e) => e.key === 'Enter' && fetchFilteredPublications());
        }
      });
      resetBtn.addEventListener('click', () => {
        if (tipoEspacio) tipoEspacio.value = '';
        if (precioMin) precioMin.value = '';
        if (precioMax) precioMax.value = '';
        if (disponibilidad) disponibilidad.value = '';
        lastFilterParams = { type: '', minPrice: '', maxPrice: '', availability: '' };
        fetchPublicPublications('status=available');
      });
    }

    // Ejecutar la búsqueda con los parámetros actuales
    const params = new URLSearchParams();
    params.append('status', 'available');
    if (lastFilterParams.type) params.append('type', lastFilterParams.type);
    if (lastFilterParams.minPrice) params.append('minPrice', lastFilterParams.minPrice);
    if (lastFilterParams.maxPrice) params.append('maxPrice', lastFilterParams.maxPrice);
    if (lastFilterParams.availability) params.append('availability', lastFilterParams.availability);
    fetchPublicPublications(params.toString());
  }

  // Función para buscar espacios desde la sección hero
  window.buscarEspacios = async function() {
    console.log('Buscando espacios desde la sección hero...');
    const tipoEspacio = document.querySelector('.filter-box #tipoEspacio');
    const precioMin = document.querySelector('.filter-box #precioMin');
    const precioMax = document.querySelector('.filter-box #precioMax');
    const disponibilidad = document.querySelector('.filter-box #disponibilidad');

    if (!tipoEspacio || !precioMin || !precioMax || !disponibilidad) {
      showMessage('Error: No se encontraron los campos de filtro.');
      return;
    }

    // Almacenar los parámetros de filtro
    lastFilterParams = {
      type: tipoEspacio.value || '',
      minPrice: precioMin.value.trim() || '',
      maxPrice: precioMax.value.trim() || '',
      availability: disponibilidad.value || ''
    };

    const params = new URLSearchParams();
    params.append('status', 'available');
    if (lastFilterParams.type) params.append('type', lastFilterParams.type);
    if (lastFilterParams.minPrice) params.append('minPrice', lastFilterParams.minPrice);
    if (lastFilterParams.maxPrice) params.append('maxPrice', lastFilterParams.maxPrice);
    if (lastFilterParams.availability) params.append('availability', lastFilterParams.availability);

    await renderFilteredPublications();
  };

  // Funcionalidad para el acordeón de Preguntas Frecuentes
  function initializeFAQ() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    if (faqQuestions.length === 0) {
      console.error('Error: No se encontraron elementos con la clase "faq-question".');
      return;
    }
    faqQuestions.forEach(question => {
      question.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('Clic en una pregunta frecuente:', question.textContent);
        const answer = question.nextElementSibling;
        const isActive = question.classList.contains('active');
        faqQuestions.forEach(q => {
          const a = q.nextElementSibling;
          q.classList.remove('active');
          a.classList.remove('active');
        });
        if (!isActive) {
          question.classList.add('active');
          answer.classList.add('active');
        }
      });
    });
  }

  // Exponer la función de restauración y filtrado
  window.restoreHome = restoreHome;
  window.renderFilteredPublications = renderFilteredPublications;

  // Inicializar FAQ al cargar la página
  initializeFAQ();

  // Asegurarse de que el menú esté cerrado al cargar
  window.addEventListener('load', () => {
    if (navbar.classList.contains('active')) {
      console.log('Cerrando menú al cargar la página');
      toggleMenu();
    }
  });
});