import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
    import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
    import { getFirestore, doc, getDoc, setDoc, collection, query, onSnapshot, where } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

    console.log("Script dinámico de carga de datos universitarios cargado.");

    // Define la configuración de Firebase
    const firebaseConfig = {
      apiKey: "AIzaSyBUy2DgMrhEksqiUTr9q41h8TqIfDiNbLE",
      authDomain: "excarplor-1.firebaseapp.com",
      projectId: "excarplor-1",
      storageBucket: "excarplor-1.firebasestorage.app",
      messagingSenderId: "179626491412",
      appId: "1:179626491412:web:d48caf76e1b8a801cc7101",
      measurementId: "G-9KP5VMWB5G"
    };


 
    const dynamicContentContainer = document.getElementById('careers-accordion');

    // Variables globales para Firebase
    let db;
    let auth;
    let currentUserId = null;
    let isAuthReady = false;
    let currentUniversityId = null; // Variable para almacenar el ID de la universidad de la página

    // Variables de estado de la aplicación
    let allFaculties = [];
    let allPrograms = [];
    let selectedFaculty = null;
    let selectedProgramType = null; // 'licenciatura_tecnico' or 'maestria_doctorado'
    let selectedProgram = null;
// --- Funciones de Utilidad ---

    // Función para renderizar el HTML dinámico dentro del contenedor principal
    function renderDynamicContent() {
        // Verifica si el contenedor existe antes de intentar modificarlo
        console.log('dynamicContentContainer:', dynamicContentContainer);
        if (!dynamicContentContainer) {
            console.error("El contenedor dinámico con ID 'careers-accordion' no fue encontrado.");

            return;
        }

        let contentHtml = `
            <div id="university-app-message" class="university-app-message" style="display: none;"></div>
            <button id="university-app-reset-button" class="university-app-reset-button" style="display: none;">
                ← Regresar
            </button>

            <div id="university-faculties-container-dynamic" class="university-accordion-section">
                <h2 class="university-section-title">Facultades</h2>
                <div id="university-faculties-list-dynamic" class="university-accordion-list">
                    <!-- Las facultades se cargarán aquí -->
                </div>
            </div>

            <div id="university-program-types-container-dynamic" class="university-accordion-section" style="display: none;">
                <h2 class="university-section-title">Tipo de Programas</h2>
                <div class="university-accordion-list">
                    <button class="university-program-type-button" data-program-type="licenciatura_tecnico">Licenciaturas y Técnicos</button>
                    <button class="university-program-type-button" data-program-type="maestria_doctorado">Maestrías, Especializaciones y Doctorados</button>
                </div>
            </div>

            <div id="university-programs-list-container-dynamic" class="university-accordion-section" style="display: none;">
                <h2 class="university-section-title">Programas Disponibles</h2>
                <div id="university-programs-list-dynamic" class="university-accordion-list">
                    <!-- Los programas se cargarán aquí -->
                </div>
            </div>

            <div id="university-program-details-dynamic" class="university-details-section" style="display: none;">
                <h2 class="university-details-title">Detalles del Programa</h2>
                <h3 id="university-program-name-dynamic" class="university-details-name"></h3>
                <div class="university-details-content">
                    <p><strong>Descripción:</strong> <span id="university-program-description-dynamic"></span></p>
                    <p><strong>Sedes:</strong> <span id="university-program-sedes-dynamic"></span></p>
                    <p><strong>Guía de Admisión:</strong> <span id="university-program-admission-guide-dynamic"></span></p>
                    <p><strong>Precios:</strong> <span id="university-program-prices-dynamic"></span></p>
                </div>
            </div>
        `;
        dynamicContentContainer.innerHTML = contentHtml;

        messageDisplay = document.getElementById('university-app-message');
        resetButton = document.getElementById('university-app-reset-button');
        facultiesContainer = document.getElementById('university-faculties-container-dynamic');
        facultiesList = document.getElementById('university-faculties-list-dynamic');
        programTypesContainer = document.getElementById('university-program-types-container-dynamic');
        programsListContainer = document.getElementById('university-programs-list-container-dynamic');
        programsList = document.getElementById('university-programs-list-dynamic');
        programDetails = document.getElementById('university-program-details-dynamic');
        programName = document.getElementById('university-program-name-dynamic');
        programDescription = document.getElementById('university-program-description-dynamic');
        programSedes = document.getElementById('university-program-sedes-dynamic');
        programAdmissionGuide = document.getElementById('university-program-admission-guide-dynamic');
        programPrices = document.getElementById('university-program-prices-dynamic');

        document.querySelectorAll('.university-program-type-button').forEach(button => {
            button.addEventListener('click', (event) => handleProgramTypeClick(event.target.dataset.programType));
        });
        if (resetButton) { // Verifica si el botón existe antes de agregar el listener
            resetButton.addEventListener('click', handleResetButton);
        }
    }

    let messageDisplay, resetButton, facultiesContainer, facultiesList,
        programTypesContainer, programsListContainer, programsList,
        programDetails, programName, programDescription, programSedes,
        programAdmissionGuide, programPrices;

        // Función para mostrar mensajes al usuario
    function showMessage(msg, type = 'info') {
        if (messageDisplay) {
            messageDisplay.textContent = msg;
            messageDisplay.className = `university-app-message university-app-message--${type}`; // Añadir clase de estilo
            messageDisplay.style.display = 'block';
        } else {
            // Fallback a alert si el modal no está inicializado
            console.warn("messageDisplay no inicializado, usando alert:", msg);
            
        }
    }

    // Función para ocultar mensajes
    function hideMessage() {
        if (messageDisplay) {
            messageDisplay.style.display = 'none';
        }
    }

    
    function showElement(element) {
        if (element) element.style.display = 'block';
    }

    function hideElement(element) {
        if (element) element.style.display = 'none';
    }

    // --- Inicialización de Firebase y Autenticación ---
    async function initializeFirebase() {
        console.log("Iniciando Firebase...");
        try {
            const app = initializeApp(firebaseConfig); 
            db = getFirestore(app);
            auth = getAuth(app);

            
            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    currentUserId = user.uid;
                    console.log("Usuario autenticado:", currentUserId);
                } else {
                    console.log("Usuario no autenticado, intentando iniciar sesión anónimamente...");
                     try {
                        await signInAnonymously(auth);
                        currentUserId = auth.currentUser?.uid;
                        console.log("Autenticado anónimamente.");
                    } catch (anonError) {
                        console.error("Error al iniciar sesión anónimamente:", anonError);
                        showMessage("Error de autenticación. Por favor, recarga.", 'error');
                    }
                }
                isAuthReady = true;
                console.log("Autenticación de Firebase lista."); // Log para depuración

                // Una vez autenticado, obtener el ID de la universidad y proceder
                currentUniversityId = getUniversityIdFromPage(); // Obtener el ID aquí
                if (!currentUniversityId) {
                    console.error("No se pudo obtener el ID de la universidad de la página. No se cargarán datos.");
                    showMessage("Error: No se encontró el ID de la universidad en la página. Asegúrate de que el body tenga el atributo data-university-id.", 'error');
                    // No intentar cargar datos si no hay ID de universidad
                    if (dynamicContentContainer) dynamicContentContainer.innerHTML = '<p class="university-error-message">No se pudo cargar la información de la universidad. ID no encontrado.</p>';
                    return;
                }
                console.log('currentUniversityId:', currentUniversityId);
              

                 renderDynamicContent();

               
                await seedDatabase(); 

                
                setTimeout(() => {
                     loadFaculties();
                }, 10); 

            });

        } catch (err) {
            console.error("Error al inicializar Firebase:", err);
            showMessage("Error al inicializar la aplicación. Por favor, recarga.", 'error');
             if (dynamicContentContainer) dynamicContentContainer.innerHTML = '<p class="university-error-message">Error al inicializar Firebase.</p>';
        }
    }

    // --- Obtener ID de la Universidad de la página ---
    function getUniversityIdFromPage() {
        const body = document.body;
        if (body && body.dataset.universityId) { // Asegurarse de que el atributo existe
            return body.dataset.universityId;
        }
        return null;
    }

    // --- Población de la Base de Datos (Solo para la universidad actual si no existe) ---
    async function seedDatabase() {
        if (!db || !isAuthReady || !currentUniversityId) { // Asegurarse de que db, Auth y currentUniversityId estén disponibles
            console.warn("Firestore, Auth o ID de universidad no están listos para poblar la base de datos. Saltando siembra.");
            return;
        }



        const appId = firebaseConfig.appId; // Usar el appId de la configuración
        const dbPath = `artifacts/${appId}/public/data`;

        try {
            const universityDocRef = doc(db, `${dbPath}/universities`, currentUniversityId);
            const universityDocSnap = await getDoc(universityDocRef);

          /*  if (universityDocSnap.exists()) {
                console.log(`La base de datos para "${currentUniversityId}" ya está poblada.`);
                // Puedes descomentar esto si quieres ver un mensaje cada vez que cargas una página ya poblada
                // showMessage(`Datos para ${currentUniversityId} ya cargados.`, 'info');
                return; // Salir si ya existen los datos para esta universidad
            }
*/
            showMessage(`Espera un momento mientras se cargan los datos de ${currentUniversityId}...`, 'info');
            console.log(`Poblando datos de ${currentUniversityId}...`);


            let facultadesToSeed = [];
            let programasToSeed = [];
            let universityName = "Nombre de la Universidad";
             
  
              switch (currentUniversityId) {
                case 'ulatina' :
                 universityName = "Universidad Latina de Panamá";
                 facultadesToSeed = [
                     { id: 'ulatina-salud', universityId: 'ulatina', name: 'Facultad de Ciencias de la Salud Dr. William C. Gorgas' },
                     { id: 'ulatina-comunicacion', universityId: 'ulatina', name: 'Facultad de Ciencias de la Comunicación' },
                     { id: 'ulatina-educacion', universityId: 'ulatina', name: 'Facultad de Ciencias de la Educación y Desarrollo Humano' },
                     { id: 'ulatina-derecho', universityId: 'ulatina', name: 'Facultad de Derecho y Ciencias Políticas' },
                     { id: 'ulatina-ingenieria', universityId: 'ulatina', name: 'Facultad de Ingeniería' },
                     { id: 'ulatina-negocios', universityId: 'ulatina', name: 'Facultad de Negocios' },
                 ];
                 programasToSeed = [
                     // Salud
                    {
                      id: 'ulatina-salud-odontologia', facultyId: 'ulatina-salud', universityId: 'ulatina', name: 'Doctor en Odontología', level: 'licenciatura',
                      description: 'Programa para formar profesionales en odontología. (Detalles adicionales en la universidad).',
                      sedes: ['Central', 'David', 'Santiago', 'Penonomé', 'Sede FCS'],
                      admission_guide: 'Requisitos generales de Bachillerato Nacional/Extranjero + Requisitos específicos para Ciencias de la Salud (Radiografía tórax, Vacunación, Prueba Psicológica, Pruebas de conocimientos generales, Inglés/TICs, Primeros auxilios).',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-salud-medicina', facultyId: 'ulatina-salud', universityId: 'ulatina', name: 'Doctor en Medicina y Cirugía', level: 'licenciatura',
                      description: 'Programa para formar profesionales en medicina. (Detalles adicionales en la universidad).',
                      sedes: ['Central', 'David', 'Santiago', 'Penonomé', 'Sede FCS'],
                      admission_guide: 'Requisitos generales de Bachillerato Nacional/Extranjero + Requisitos específicos para Ciencias de la Salud (Radiografía tórax, Vacunación, Prueba Psicológica, Pruebas de conocimientos generales, Inglés/TICs, Primeros auxilios). Cumplimiento de regulaciones de selección y admisión específicas del programa.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-salud-biotecnologia', facultyId: 'ulatina-salud', universityId: 'ulatina', name: 'Licenciatura en Biotecnología', level: 'licenciatura',
                      description: 'Estudio y aplicación de tecnologías biológicas. (Detalles adicionales en la universidad).',
                      sedes: ['Central', 'David', 'Santiago', 'Penonomé', 'Sede FCS'],
                      admission_guide: 'Requisitos generales de Bachillerato Nacional/Extranjero + Requisitos específicos para Ciencias de la Salud.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-salud-tecnologia-medica', facultyId: 'ulatina-salud', universityId: 'ulatina', name: 'Licenciatura en Tecnología Médica', level: 'licenciatura',
                      description: 'Formación en tecnología para diagnóstico y tratamiento médico. (Detalles adicionales en la universidad).',
                      sedes: ['Central', 'David', 'Santiago', 'Penonomé', 'Sede FCS'],
                      admission_guide: 'Requisitos generales de Bachillerato Nacional/Extranjero + Requisitos específicos para Ciencias de la Salud.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-salud-enfermeria', facultyId: 'ulatina-salud', universityId: 'ulatina', name: 'Licenciatura en Ciencias de la Enfermería', level: 'licenciatura',
                      description: 'Formación integral en el cuidado de la salud. (Detalles adicionales en la universidad).',
                      sedes: ['Central', 'David', 'Santiago', 'Penonomé', 'Sede FCS'],
                      admission_guide: 'Requisitos generales de Bachillerato Nacional/Extranjero + Requisitos específicos para Ciencias de la Salud.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-salud-farmacia', facultyId: 'ulatina-salud', universityId: 'ulatina', name: 'Licenciatura en Farmacia', level: 'licenciatura',
                      description: 'Estudio de fármacos y su aplicación. (Detalles adicionales en la universidad).',
                      sedes: ['Central', 'David', 'Santiago', 'Penonomé', 'Sede FCS'],
                      admission_guide: 'Requisitos generales de Bachillerato Nacional/Extranjero + Requisitos específicos para Ciencias de la Salud.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-salud-rehabilitacion-bucal-esp', facultyId: 'ulatina-salud', universityId: 'ulatina', name: 'Especialización en Rehabilitación Bucal', level: 'especializacion',
                      description: 'Posgrado en rehabilitación oral. (Detalles adicionales en la universidad).',
                      sedes: ['Sede FCS'],
                      admission_guide: 'Requisitos generales de Posgrado Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-salud-rehabilitacion-bucal-maestria', facultyId: 'ulatina-salud', universityId: 'ulatina', name: 'Maestría en Rehabilitación Bucal', level: 'maestria',
                      description: 'Posgrado avanzado en rehabilitación oral. (Detalles adicionales en la universidad).',
                      sedes: ['Sede FCS'],
                      admission_guide: 'Requisitos generales de Posgrado Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-salud-gestion-farmaceutica', facultyId: 'ulatina-salud', universityId: 'ulatina', name: 'Maestría en Gestión de Servicios Farmacéuticos', level: 'maestria',
                      description: 'Énfasis en Atención Primaria, Industrial Farmacéutica, Mercadeo Farmacéutico y Hospitalaria. (Detalles adicionales en la universidad).',
                      sedes: ['Sede FCS'],
                      admission_guide: 'Requisitos generales de Posgrado Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    // Comunicación
                    {
                      id: 'ulatina-comunicacion-publicidad-diseno', facultyId: 'ulatina-comunicacion', universityId: 'ulatina', name: 'Licenciatura en Publicidad y Mercadeo (Énfasis: Diseño Gráfico Computacional)', level: 'licenciatura',
                      description: 'Formación en publicidad y mercadeo con especialización en diseño gráfico. Duración: 3 años y 8 meses (11 cuatrimestres).',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero'],
                      admission_guide: 'Requisitos generales de Bachillerato Nacional/Extranjero.',
                      prices: {
                        total: '$9,416.00 (con 33.50% de descuento)',
                        monthly44: '$214.00/mes (44 meses)',
                        monthly48: '$196.17/mes (48 meses)',
                        info: 'Este es un ejemplo de costo para el plan Híbrido/Semipresencial. Otros programas pueden variar.'
                      }
                    },
                    {
                      id: 'ulatina-comunicacion-publicidad-ventas', facultyId: 'ulatina-comunicacion', universityId: 'ulatina', name: 'Licenciatura en Publicidad y Mercadeo (Énfasis: Gerencia de Ventas)', level: 'licenciatura',
                      description: 'Formación en publicidad y mercadeo con especialización en gerencia de ventas.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero'],
                      admission_guide: 'Requisitos generales de Bachillerato Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-comunicacion-publicidad-video', facultyId: 'ulatina-comunicacion', universityId: 'ulatina', name: 'Licenciatura en Publicidad y Mercadeo (Énfasis: Producción de Video Digital)', level: 'licenciatura',
                      description: 'Formación en publicidad y mercadeo con especialización en producción de video.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero'],
                      admission_guide: 'Requisitos generales de Bachillerato Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-comunicacion-moda', facultyId: 'ulatina-comunicacion', universityId: 'ulatina', name: 'Licenciatura en Gestión de la Moda y Marcas', level: 'licenciatura',
                      description: 'Gestión en la industria de la moda y desarrollo de marcas.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero'],
                      admission_guide: 'Requisitos generales de Bachillerato Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-comunicacion-grafica-digital', facultyId: 'ulatina-comunicacion', universityId: 'ulatina', name: 'Licenciatura en Producción Gráfica Digital para Televisión', level: 'licenciatura',
                      description: 'Producción de gráficos digitales para medios televisivos.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero'],
                      admission_guide: 'Requisitos generales de Bachillerato Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-comunicacion-animacion-digital', facultyId: 'ulatina-comunicacion', universityId: 'ulatina', name: 'Licenciatura en Animación Digital', level: 'licenciatura',
                      description: 'Creación de animaciones digitales para diversas plataformas.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero'],
                      admission_guide: 'Requisitos generales de Bachillerato Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    // Educación y Desarrollo Humano
                    {
                      id: 'ulatina-educacion-ingles-traduccion', facultyId: 'ulatina-educacion', universityId: 'ulatina', name: 'Licenciatura en Inglés con Énfasis en Traducción', level: 'licenciatura',
                      description: 'Formación en idioma inglés con habilidades en traducción.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero'],
                      admission_guide: 'Requisitos generales de Bachillerato Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-educacion-psicologia', facultyId: 'ulatina-educacion', universityId: 'ulatina', name: 'Licenciatura en Psicología', level: 'licenciatura',
                      description: 'Estudio del comportamiento humano y procesos mentales.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero'],
                      admission_guide: 'Requisitos generales de Bachillerato Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-educacion-profesorado', facultyId: 'ulatina-educacion', universityId: 'ulatina', name: 'Profesorado en Educación Diversificada para Premedia y Media', level: 'tecnico', // Asumiendo que Profesorado es un programa técnico/corto
                      description: 'Formación de docentes para niveles de premedia y media.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero'],
                      admission_guide: 'Requisitos generales de Bachillerato Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-educacion-psicologia-forense-maestria', facultyId: 'ulatina-educacion', universityId: 'ulatina', name: 'Maestría en Psicología Forense', level: 'maestria',
                      description: 'Posgrado en la aplicación de la psicología en el ámbito legal.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero'],
                      admission_guide: 'Requisitos generales de Posgrado Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-educacion-psicologia-clinica-maestria', facultyId: 'ulatina-educacion', universityId: 'ulatina', name: 'Maestría en Psicología Clínica', level: 'maestria',
                      description: 'Posgrado en diagnóstico y tratamiento de trastornos mentales.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero'],
                      admission_guide: 'Requisitos generales de Posgrado Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-educacion-docencia-superior-profesional-maestria', facultyId: 'ulatina-educacion', universityId: 'ulatina', name: 'Maestría Profesional en Docencia Superior', level: 'maestria',
                      description: 'Posgrado para profesionales interesados en la docencia universitaria.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero'],
                      admission_guide: 'Requisitos generales de Posgrado Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-educacion-docencia-superior-maestria', facultyId: 'ulatina-educacion', universityId: 'ulatina', name: 'Maestría en Docencia Superior', level: 'maestria',
                      description: 'Estudio avanzado de la pedagogía y la práctica docente universitaria.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero'],
                      admission_guide: 'Requisitos generales de Posgrado Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-educacion-docencia-superior-especializacion', facultyId: 'ulatina-educacion', universityId: 'ulatina', name: 'Especialización en Docencia Superior', level: 'especializacion',
                      description: 'Posgrado enfocado en las habilidades pedagógicas para la educación superior.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero'],
                      admission_guide: 'Requisitos generales de Posgrado Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    // Derecho y Ciencias Políticas
                    {
                      id: 'ulatina-derecho-licenciatura', facultyId: 'ulatina-derecho', universityId: 'ulatina', name: 'Licenciatura en Derecho y Ciencias Políticas', level: 'licenciatura',
                      description: 'Formación integral en el ámbito legal y político.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero', 'Penonomé'],
                      admission_guide: 'Requisitos generales de Bachillerato Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-derecho-procesal-especializacion', facultyId: 'ulatina-derecho', universityId: 'ulatina', name: 'Especialización en Derecho Procesal', level: 'especializacion',
                      description: 'Posgrado en procedimientos legales y judiciales.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero', 'Penonomé'],
                      admission_guide: 'Requisitos generales de Posgrado Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-derecho-penal-maestria', facultyId: 'ulatina-derecho', universityId: 'ulatina', name: 'Maestría en Sistema Penal Acusatorio', level: 'maestria',
                      description: 'Posgrado en el sistema penal acusatorio actual.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero', 'Penonomé'],
                      admission_guide: 'Requisitos generales de Posgrado Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-derecho-procesal-civil-maestria', facultyId: 'ulatina-derecho', universityId: 'ulatina', name: 'Maestría en Derecho Procesal Civil', level: 'maestria',
                      description: 'Posgrado en los procedimientos del derecho civil.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero', 'Penonomé'],
                      admission_guide: 'Requisitos generales de Posgrado Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-derecho-administrativo-maestria', facultyId: 'ulatina-derecho', universityId: 'ulatina', name: 'Maestría en Derecho Administrativo', level: 'maestria',
                      description: 'Posgrado en derecho público y administración.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero', 'Penonomé'],
                      admission_guide: 'Requisitos generales de Posgrado Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-derecho-registral-maestria', facultyId: 'ulatina-derecho', universityId: 'ulatina', name: 'Maestría en Derecho Registral, Inmobiliario y Notarial', level: 'maestria',
                      description: 'Posgrado en derecho de registros, bienes raíces y notariado.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero', 'Penonomé'],
                      admission_guide: 'Requisitos generales de Posgrado Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-derecho-comercial-maestria', facultyId: 'ulatina-derecho', universityId: 'ulatina', name: 'Maestría en Derecho Comercial', level: 'maestria',
                      description: 'Posgrado en derecho mercantil y de negocios.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero', 'Penonomé'],
                      admission_guide:'Requisitos generales de Posgrado Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    // Ingeniería
                    {
                      id: 'ulatina-ingenieria-ambiental-energias', facultyId: 'ulatina-ingenieria', universityId: 'ulatina', name: 'Licenciatura en Ingeniería Ambiental y Energías Renovables', level: 'licenciatura',
                      description: 'Ingeniería enfocada en sostenibilidad y energías limpias.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero', 'Penonomé'],
                      admission_guide: 'Requisitos generales de Bachillerato Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-ingenieria-sistemas-informaticos', facultyId: 'ulatina-ingenieria', universityId: 'ulatina', name: 'Licenciatura en Ingeniería de Sistemas Informáticos', level: 'licenciatura',
                      description: 'Desarrollo y gestión de sistemas de información.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero', 'Penonomé'],
                      admission_guide: 'Requisitos generales de Bachillerato Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-ingenieria-mecatronica', facultyId: 'ulatina-ingenieria', universityId: 'ulatina', name: 'Licenciatura en Ingeniería Mecatrónica', level: 'licenciatura',
                      description: 'Combinación de mecánica, electrónica, informática y control.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero', 'Penonomé'],
                      admission_guide: 'Requisitos generales de Bachillerato Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-ingenieria-electronica-telecomunicaciones', facultyId: 'ulatina-ingenieria', universityId: 'ulatina', name: 'Licenciatura en Ingeniería en Electrónica y Telecomunicaciones', level: 'licenciatura',
                      description: 'Diseño y gestión de sistemas electrónicos y de comunicación.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero', 'Penonomé'],
                      admission_guide: 'Requisitos generales de Bachillerato Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-ingenieria-comercial-gestion-estrategica', facultyId: 'ulatina-ingenieria', universityId: 'ulatina', name: 'Licenciatura en Ingeniería Comercial y Gestión Estratégica', level: 'licenciatura',
                      description: 'Aplicación de principios de ingeniería a la gestión empresarial.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero', 'Penonomé'],
                      admission_guide: 'Requisitos generales de Bachillerato Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-ingenieria-industrial-empresarial', facultyId: 'ulatina-ingenieria', universityId: 'ulatina', name: 'Licenciatura en Ingeniería Industrial Empresarial', level: 'licenciatura',
                      description: 'Optimización de procesos y sistemas productivos.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero', 'Penonomé'],
                      admission_guide: 'Requisitos generales de Bachillerato Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    // Negocios
                    {
                      id: 'ulatina-negocios-comercio-logistica', facultyId: 'ulatina-negocios', universityId: 'ulatina', name: 'Licenciatura en Comercio Internacional y Logística', level: 'licenciatura',
                      description: 'Gestión de operaciones de comercio global y cadena de suministro.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero', 'Penonomé'],
                      admission_guide: 'Requisitos generales de Bachillerato Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-negocios-contabilidad-auditoria', facultyId: 'ulatina-negocios', universityId: 'ulatina', name: 'Licenciatura en Contabilidad y Auditoría', level: 'licenciatura',
                      description: 'Formación en principios contables y auditoría financiera.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero', 'Penonomé'],
                      admission_guide: 'Requisitos generales de Bachillerato Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-negocios-gerencia-financiera-bancaria', facultyId: 'ulatina-negocios', universityId: 'ulatina', name: 'Licenciatura en Gerencia Financiera y Bancaria', level: 'licenciatura',
                      description: 'Gestión de inversiones, finanzas corporativas y banca.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero', 'Penonomé'],
                      admission_guide: 'Requisitos generales de Bachillerato Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-negocios-gestion-rrhh', facultyId: 'ulatina-negocios', universityId: 'ulatina', name: 'Licenciatura en Gestión de Recursos Humanos y Negocios', level: 'licenciatura',
                      description: 'Administración de personal y desarrollo organizacional.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero', 'Penonomé'],
                      admission_guide: 'Requisitos generales de Bachillerato Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-negocios-mercadeo-negocios', facultyId: 'ulatina-negocios', universityId: 'ulatina', name: 'Licenciatura en Mercadeo y Negocios', level: 'licenciatura',
                      description: 'Estrategias de mercadeo y desarrollo de negocios.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero', 'Penonomé'],
                      admission_guide: 'Requisitos generales de Bachillerato Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-negocios-turismo-hoteleria', facultyId: 'ulatina-negocios', universityId: 'ulatina', name: 'Licenciatura en Administración de Empresas Turísticas y Hoteleras', level: 'licenciatura',
                      description: 'Gestión en la industria del turismo y la hotelería.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero', 'Penonomé'],
                      admission_guide: 'Requisitos generales de Bachillerato Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-negocios-internacionales', facultyId: 'ulatina-negocios', universityId: 'ulatina', name: 'Licenciatura en Administración de Negocios Internacionales', level: 'licenciatura',
                      description: 'Gestión de negocios en el ámbito global.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero', 'Penonomé'],
                      admission_guide: 'Requisitos generales de Bachillerato Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-negocios-alta-gerencia-esp', facultyId: 'ulatina-negocios', universityId: 'ulatina', name: 'Especialización en Alta Gerencia (Semipresencial)', level: 'especializacion',
                      description: 'Desarrollo de habilidades de liderazgo y gestión estratégica.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero', 'Penonomé'],
                      admission_guide: 'Requisitos generales de Posgrado Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-negocios-comercio-logistica-maestria', facultyId: 'ulatina-negocios', universityId: 'ulatina', name: 'Maestría en Comercio y Logística', level: 'maestria',
                      description: 'Posgrado en operaciones de comercio y logística internacional.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero', 'Penonomé'],
                      admission_guide: 'Requisitos generales de Posgrado Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-negocios-gerencia-proyectos-maestria', facultyId: 'ulatina-negocios', universityId: 'ulatina', name: 'Maestría en Gerencia de Proyectos', level: 'maestria',
                      description: 'Posgrado en la planificación y ejecución de proyectos.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero', 'Penonomé'],
                      admission_guide: 'Requisitos generales de Posgrado Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-negocios-comportamiento-organizacional-maestria', facultyId: 'ulatina-negocios', universityId: 'ulatina', name: 'Maestría en Comportamiento Organizacional', level: 'maestria',
                      description: 'Estudio de la dinámica y cultura de las organizaciones.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero', 'Penonomé'],
                      admission_guide: 'Requisitos generales de Posgrado Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-negocios-adm-negocios-maestria', facultyId: 'ulatina-negocios', universityId: 'ulatina', name: 'Maestría en Administración de Negocios (Énfasis)', level: 'maestria',
                      description: 'Con énfasis en Banca y Finanzas, Dirección Empresarial, Mercadeo o Recursos Humanos.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero', 'Penonomé'],
                      admission_guide: 'Requisitos generales de Posgrado Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                    {
                      id: 'ulatina-negocios-cadena-suministro-maestria', facultyId: 'ulatina-negocios', universityId: 'ulatina', name: 'Maestría en Administración de la Cadena de Suministro', level: 'maestria',
                      description: 'Gestión eficiente de la cadena de producción y distribución.',
                      sedes: ['Central', 'David', 'Santiago', 'Azuero', 'Penonomé'],
                      admission_guide: 'Requisitos generales de Posgrado Nacional/Extranjero.',
                      prices: { info: 'Contactar a la universidad para detalles de costos.' }
                    },
                 ]; 
                 break;

           case 'upa': 
                universityName = "Universidad de Panamá";
                facultadesToSeed = [ 
                  { id: 'upa-administracionEmpresa', universityId: 'upa', name: 'Facultad de Administracion de empresas y contabilidad' },
                  { id: 'upa-arquitectura', universityId: 'upa', name: 'Facultad de Arquitectura y diseño' },
                  { id: 'upa-agropecuarias', universityId: 'upa', name: 'Facultad de Ciencias Agropecuarias' },
                  { id: 'upa-cienciasExactas', universityId: 'upa', name: 'Facultad de Ciencias Naturales Exactas y Tecnología' },
                  { id: 'upa-informatica', universityId: 'upa', name: 'Facultad de Informatica,Electronica y Comunicación' },
                  { id: 'upa-ingieneria', universityId: 'upa', name: 'Facultad de Ingenieria' },
                  //area de ciencias sociales y humanisticas
                  { id: 'upa-administracionPublica', universityId: 'upa', name: 'Facultad de Administracion Pública' },
                  { id: 'upa-bellasArtes', universityId: 'upa', name: 'Facultad de Bellas Artes' },
                  { id: 'upa-educacion', universityId: 'upa', name: 'Facultad de Ciencias de l Educación' },
                  { id: 'upa-comunicacionSocial', universityId: 'upa', name: 'Facultad de Comunicación social ' },
                  { id: 'upa-derecho', universityId: 'upa', name: 'Facultad de Derecho y ciencias políticas' },
                  { id: 'upa-economia', universityId: 'upa', name: 'Facultad de Economía' },
                  { id: 'upa-humanidades', universityId: 'upa', name: 'Facultad de Humanidades' },
                  // area de ciencias de la salud
                  { id: 'upa-enfermeria', universityId: 'upa', name: 'Facultad de Enfermería' },
                  { id: 'upa-farmacia', universityId: 'upa', name: 'Facultad de Farmacia' },
                  { id: 'upa-mediciana', universityId: 'upa', name: 'Facultad de Medicina' },
                  { id: 'upa-medicinaVeterinaria', universityId: 'upa', name: 'Facultad de Medicina Veterinaria' },
                  { id: 'upa-odontologia', universityId: 'upa', name: 'Facultad de Odontología' },
                  { id: 'upa-psicologia', universityId: 'upa', name: 'Facultad de Psicología' },
                ];
                programasToSeed =[ //universityId: 'upa',
                  { id: 'upa-contabilidad-auditoria-lic', facultyId: 'upa-administracionEmpresa', universityId: 'upa', name: 'Licenciatura en Contabilidad y Auditoría', level: 'licenciatura', 
                    description: 'Formación integral en contabilidad y auditoría.', 
                    sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', 
                    prices: { info: 'Consultar.' } },

                  { id: 'upa-adm-empresas-lic', facultyId: 'upa-administracionEmpresa', universityId: 'upa', name: 'Licenciatura en Administración de Empresas', level: 'licenciatura', 
                    description: 'Desarrollo de habilidades para la gestión empresarial.', 
                    sedes: ['Campus Metropolitano', 'Sede Finca #13'], 
                    admission_guide: 'Requisitos generales de la UP.', 
                    prices: { info: 'Consultar.' } },

                  { id: 'upa-adm-empresas-maritimas-lic', facultyId: 'upa-administracionEmpresa', universityId: 'upa',name: 'Licenciatura en Administración de Empresas Marítimas', level: 'licenciatura', description: 'Gestión de negocios en el sector marítimo.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-adm-mercadeo-ventas-lic', facultyId: 'upa-administracionEmpresa', universityId: 'upa',name: 'Licenciatura en Administración de Mercadeo, Promoción y Ventas', level: 'licenciatura', description: 'Estrategias de mercadeo y gestión de ventas.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-adm-financiera-negocios-lic', facultyId: 'upa-administracionEmpresa', universityId: 'upa', name: 'Licenciatura en Administración Financiera y Negocios Internacionales', level: 'licenciatura', description: 'Gestión financiera y operaciones de negocios internacionales.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-logistica-ing-lic', facultyId: 'upa-administracionEmpresa', universityId: 'upa', name: 'Licenciatura en Ingeniería de Operaciones Logísticas', level: 'licenciatura', description: 'Optimización de cadenas de suministro y logística.', sedes: ['Campus Metropolitano', 'Sede Finca #13'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-adm-rrhh-lic', facultyId: 'upa-administracionEmpresa', universityId: 'upa', name: 'Licenciatura en Administración de Recursos Humanos', level: 'licenciatura', description: 'Gestión del capital humano en organizaciones.', sedes: ['Campus Metropolitano', 'Sede Finca #13'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-adm-turistica-bilingue-lic', facultyId: 'upa-administracionEmpresa', universityId: 'upa', name: 'Licenciatura en Administración de Empresas Turísticas y Hoteleras Bilingüe', level: 'licenciatura', description: 'Gestión turística y hotelera con enfoque bilingüe.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-tec-adm-maritima-portuarias', facultyId: 'upa-administracionEmpresa', universityId: 'upa', name: 'Técnico en Administración de Empresas Marítima y Portuarias', level: 'tecnico', description: 'Formación técnica en administración marítima y portuaria.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-gestion-maritima-maestria', facultyId: 'upa-administracionEmpresa', universityId: 'upa', name: 'Maestría en Gestión y Negocios en la Industria Marítima', level: 'maestria', description: 'Posgrado especializado en la gestión de negocios marítimos.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-gerencia-operaciones-logistica-maestria', facultyId: 'upa-administracionEmpresa', universityId: 'upa', name: 'Maestría en Gerencia de Operaciones y Logística Empresarial', level: 'maestria', description: 'Posgrado en gestión de operaciones y logística.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-contabilidad-maestria', facultyId: 'upa-administracionEmpresa', universityId: 'upa', name: 'Maestría en Contabilidad', level: 'maestria', description: 'Posgrado en contabilidad avanzada.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-mercadeo-comercio-maestria', facultyId: 'upa-administracionEmpresa', universityId: 'upa', name: 'Maestría en Mercadeo y Comercio Internacional', level: 'maestria', description: 'Posgrado en estrategias de mercadeo y comercio global.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-adm-empresas-maestria', facultyId: 'upa-administracionEmpresa', universityId: 'upa', name: 'Maestría en Administración de Empresas', level: 'maestria', description: 'Posgrado en administración de empresas.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-adm-turistica-maestria', facultyId: 'upa-administracionEmpresa', universityId: 'upa', name: 'Maestría en Administración de Empresas Turísticas', level: 'maestria', description: 'Posgrado en gestión de empresas turísticas.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-adm-rrhh-maestria', facultyId: 'upa-administracionEmpresa', universityId: 'upa', name: 'Maestría en Administración de Recursos Humanos', level: 'maestria', description: 'Posgrado en gestión estratégica de recursos humanos.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-adm-financiera-maestria', facultyId: 'upa-administracionEmpresa', universityId: 'upa', name: 'Maestría en Administración Financiera', level: 'maestria', description: 'Posgrado en finanzas corporativas y gestión de inversiones.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-ciencias-empresariales-doctorado', facultyId: 'upa-administracionEmpresa', universityId: 'upa', name: 'Doctorado en Ciencias Empresariales', level: 'doctorado', description: 'Doctorado con énfasis en Administración de Empresas o Contabilidad.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de doctorado de la UP.', prices: { info: 'Consultar.' } },
                  // Arquitectura y Diseño
                  { id: 'upa-arquitectura-lic', facultyId: 'upa-arquitectura', universityId: 'upa', name: 'Licenciatura en Arquitectura', level: 'licenciatura', description: 'Diseño y planificación de espacios y edificaciones.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-diseno-grafico-lic', facultyId: 'upa-arquitectura', universityId: 'upa', name: 'Licenciatura en Diseño Gráfico', level: 'licenciatura', description: 'Creación de soluciones visuales y comunicación gráfica.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-arquitectura-interior-lic', facultyId: 'upa-arquitectura', universityId: 'upa', name: 'Licenciatura en Arquitectura Interior', level: 'licenciatura', description: 'Diseño de espacios interiores funcionales y estéticos.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-diseno-interiores-lic', facultyId: 'upa-arquitectura', universityId: 'upa', name: 'Licenciatura en Diseño de Interiores', level: 'licenciatura', description: 'Creación y planificación de ambientes interiores.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-diseno-modas-lic', facultyId: 'upa-arquitectura', universityId: 'upa', name: 'Licenciatura en Diseño de Modas', level: 'licenciatura', description: 'Diseño y confección de indumentaria.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-representacion-arquitectonica-digital-lic', universityId: 'upa', facultyId: 'upa-arquitectura', name: 'Licenciatura en Representación Arquitectónica y Digital', level: 'licenciatura', description: 'Técnicas de representación arquitectónica con herramientas digitales.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-edificacion-lic', facultyId: 'upa-arquitectura', universityId: 'upa', name: 'Licenciatura en Edificación', level: 'licenciatura', description: 'Procesos constructivos y gestión de edificaciones.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-diseno-industrial-producto-lic', facultyId: 'upa-arquitectura', universityId: 'upa', name: 'Licenciatura en Diseño Industrial y Producto', level: 'licenciatura', description: 'Diseño de productos funcionales y estéticos.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-mant-sostenible-edificacion-maestria', facultyId: 'upa-arquitectura', universityId: 'upa', name: 'Maestría en Gestión y Mantenimiento Sostenible de la Edificación', level: 'maestria', description: 'Posgrado en gestión sostenible de edificaciones.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-ordenamiento-territorial-maestria', facultyId: 'upa-arquitectura', universityId: 'upa', name: 'Maestría en Ordenamiento Territorial para el Desarrollo Sostenible', level: 'maestria', description: 'Planificación territorial para el desarrollo sostenible.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-paisajismo-gestion-ambiental-maestria', facultyId: 'upa-arquitectura', universityId: 'upa', name: 'Maestría en Paisajismo y Gestión Ambiental (Énfasis: Arquitectura/Manejo del paisaje)', level: 'maestria', description: 'Posgrado en diseño y gestión del paisaje.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-diseno-visualizacion-proyectos-maestria', facultyId: 'upa-arquitectura', universityId: 'upa', name: 'Maestría en Diseño y Visualización de Proyectos', level: 'maestria', description: 'Posgrado en diseño y representación visual de proyectos.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-conservacion-patrimonio-maestria', facultyId: 'upa-arquitectura', universityId: 'upa', name: 'Maestría Centroamericana en Conservación y Gestión del Patrimonio Cultural para el Desarrollo', level: 'maestria', description: 'Posgrado en conservación y gestión del patrimonio cultural.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  // Ciencias Agropecuarias
                  { id: 'upa-gastronomia-lic', facultyId: 'upa-agropecuarias', universityId: 'upa', name: 'Licenciatura en Gastronomía', level: 'licenciatura', description: 'Formación en artes culinarias y gestión gastronómica.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-ciencias-familia-desarrollo-comunitario-lic', facultyId: 'upa-agropecuarias', universityId: 'upa', name: 'Licenciatura en Ciencias de la Familia y del Desarrollo Comunitario', level: 'licenciatura', description: 'Estudio de la familia y el desarrollo de comunidades.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-manejo-cuencas-ambiente-ing', facultyId: 'upa-agropecuarias', universityId: 'upa', name: 'Ingeniería en Manejo de Cuencas y Ambiente', level: 'licenciatura', description: 'Ingeniería enfocada en la gestión de recursos hídricos y medio ambiente.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-agronomo-zootecnista-ing', facultyId: 'upa-agropecuarias', universityId: 'upa', name: 'Ingeniero Agrónomo Zootecnista', level: 'licenciatura', description: 'Producción agrícola y animal.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-agronomica-cultivos-tropicales-ing', facultyId: 'upa-agropecuarias', universityId: 'upa', name: 'Ingeniería Agronómica en Cultivos Tropicales', level: 'licenciatura', description: 'Especialización en cultivos tropicales.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-agronegocios-desarrollo-ing', facultyId: 'upa-agropecuarias', universityId: 'upa', name: 'Ingeniería en Agronegocios y Desarrollo Agropecuario', level: 'licenciatura', description: 'Gestión de agronegocios y desarrollo rural.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-ciencias-agricolas-suelos-agua-maestria', facultyId: 'upa-agropecuarias', universityId: 'upa', name: 'Maestría en Ciencias Agrícolas (Énfasis: Manejo de Suelos y Agua)', level: 'maestria', description: 'Posgrado en manejo de suelos y agua en agricultura.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-ciencias-agricolas-proteccion-vegetal-maestria', facultyId: 'upa-agropecuarias', universityId: 'upa', name: 'Maestría en Ciencias Agrícolas (Énfasis: Protección Vegetal)', level: 'maestria', description: 'Posgrado en protección de cultivos.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-ciencias-agricolas-produccion-sostenible-maestria', facultyId: 'upa-agropecuarias', universityId: 'upa', name: 'Maestría en Ciencias Agrícolas (Énfasis: Producción Agrícola Sostenible)', level: 'maestria', description: 'Posgrado en producción agrícola sostenible.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-ciencias-agricolas-recursos-naturales-maestria', facultyId: 'upa-agropecuarias',universityId: 'upa',  name: 'Maestría en Ciencias Agrícolas (Énfasis: Manejo de Recursos Naturales)', level: 'maestria', description: 'Posgrado en gestión de recursos naturales.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-ciencias-familia-comunitario-maestria', facultyId: 'upa-agropecuarias', universityId: 'upa', name: 'Maestría en Ciencias de la Familia y del Desarrollo Comunitario (Énfasis: Promoción Comunitaria y Ecología Familiar)', level: 'maestria', description: 'Posgrado en desarrollo comunitario y ecología familiar.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-ciencias-pecuarias-maestria', facultyId: 'upa-agropecuarias', universityId: 'upa', name: 'Maestría en Ciencias Pecuarias (Énfasis: Producción Animal)', level: 'maestria', description: 'Posgrado en producción animal.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-gastronomia-maestria', facultyId: 'upa-agropecuarias', universityId: 'upa', name: 'Maestría en Gastronomía', level: 'maestria', description: 'Posgrado en gastronomía y artes culinarias.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-gestion-agronegocios-maestria', facultyId: 'upa-agropecuarias', universityId: 'upa', name: 'Maestría en Gestión de Agronegocios', level: 'maestria', description: 'Posgrado en gestión de empresas agropecuarias.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-ciencias-agropecuarias-doctorado', facultyId: 'upa-agropecuarias', universityId: 'upa', name: 'Doctorado en Ciencias Agropecuarias', level: 'doctorado', description: 'Doctorado en el campo de las ciencias agropecuarias.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de doctorado de la UP.', prices: { info: 'Consultar.' } },
                  // Ciencias Naturales Exactas y Tecnología
                  { id: 'upa-biologia-lic', facultyId: 'upa-cienciasExactas', universityId: 'upa', name: 'Licenciatura en Biología (orientaciones varias)', level: 'licenciatura', description: 'Estudio de la vida con orientaciones en biología ambiental, animal, vegetal, microbiología y parasitología.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-docencia-biologia-lic', facultyId: 'upa-cienciasExactas', universityId: 'upa', name: 'Licenciatura en Docencia en Biología', level: 'licenciatura', description: 'Formación para la enseñanza de la biología.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-registros-medicos-estadisticas-lic', facultyId: 'upa-cienciasExactas', universityId: 'upa', name: 'Licenciatura en Registros Médicos y Estadísticas de Salud', level: 'licenciatura', description: 'Gestión de información médica y estadísticas de salud.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-ingenieria-estadistica-lic', facultyId: 'upa-cienciasExactas', universityId: 'upa', name: 'Licenciatura en Ingeniería en Estadística', level: 'licenciatura', description: 'Aplicación de la estadística en diversos campos.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-ciencias-actuariales-lic', facultyId: 'upa-cienciasExactas', universityId: 'upa', name: 'Licenciatura en Ciencias Actuariales', level: 'licenciatura', description: 'Análisis de riesgos y seguros.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-fisica-lic', facultyId: 'upa-cienciasExactas', universityId: 'upa', name: 'Licenciatura en Física', level: 'licenciatura', description: 'Estudio de los principios fundamentales del universo.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-docencia-fisica-lic', facultyId: 'upa-cienciasExactas', universityId: 'upa', name: 'Licenciatura en Docencia en Física', level: 'licenciatura', description: 'Formación para la enseñanza de la física.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-matematica-lic', facultyId: 'upa-cienciasExactas', universityId: 'upa', name: 'Licenciatura en Matemática', level: 'licenciatura', description: 'Estudio de los principios y métodos matemáticos.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-docencia-matematica-lic', facultyId: 'upa-cienciasExactas', universityId: 'upa', name: 'Licenciatura en Docencia en Matemática', level: 'licenciatura', description: 'Formación para la enseñanza de las matemáticas.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-quimica-lic', facultyId: 'upa-cienciasExactas', universityId: 'upa', name: 'Licenciatura en Química', level: 'licenciatura', description: 'Estudio de la composición y propiedades de la materia.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-tecnologia-quimica-industrial-lic', facultyId: 'upa-cienciasExactas', universityId: 'upa', name: 'Licenciatura en Tecnología Química Industrial', level: 'licenciatura', description: 'Aplicación de la química en procesos industriales.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-docencia-quimica-lic', facultyId: 'upa-cienciasExactas', universityId: 'upa', name: 'Licenciatura en Docencia en Química', level: 'licenciatura', description: 'Formación para la enseñanza de la química.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-biologia-molecular-maestria', facultyId: 'upa-cienciasExactas', universityId: 'upa', name: 'Maestría en Biología Molecular', level: 'maestria', description: 'Posgrado en biología molecular.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-ciencias-parasitologicas-maestria', facultyId: 'upa-cienciasExactas', universityId: 'upa', name: 'Maestría en Ciencias Parasitológicas', level: 'maestria', description: 'Posgrado en parasitología.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-microbiologia-ambiental-maestria', facultyId: 'upa-cienciasExactas', universityId: 'upa', name: 'Maestría en Microbiología Ambiental', level: 'maestria', description: 'Posgrado en microbiología aplicada al medio ambiente.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-estadistica-aplicada-maestria', facultyId: 'upa-cienciasExactas', universityId: 'upa', name: 'Maestría en Estadística Aplicada', level: 'maestria', description: 'Posgrado en aplicación de métodos estadísticos.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-ciencias-fisicas-maestria', facultyId: 'upa-cienciasExactas', universityId: 'upa', name: 'Maestría en Ciencias Físicas', level: 'maestria', description: 'Posgrado en ciencias físicas.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-calculo-actuariales-maestria', facultyId: 'upa-cienciasExactas', universityId: 'upa', name: 'Maestría en Cálculo y Técnicas Actuariales', level: 'maestria', description: 'Posgrado en cálculo y técnicas actuariales.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-matematica-educativa-maestria', facultyId: 'upa-cienciasExactas', universityId: 'upa', name: 'Maestría en Matemática Educativa', level: 'maestria', description: 'Posgrado en la enseñanza de las matemáticas.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-matematica-maestria', facultyId: 'upa-cienciasExactas', universityId: 'upa', name: 'Maestría en Matemática', level: 'maestria', description: 'Posgrado en matemática pura y aplicada.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-investigacion-operaciones-maestria', facultyId: 'upa-cienciasExactas', universityId: 'upa', name: 'Maestría en Investigación de Operaciones', level: 'maestria', description: 'Posgrado en optimización de procesos y sistemas.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-didactica-ciencias-naturales-maestria', facultyId: 'upa-cienciasExactas', universityId: 'upa', name: 'Maestría en Didáctica de las Ciencias Naturales', level: 'maestria', description: 'Posgrado en didáctica para la enseñanza de ciencias naturales.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-ciencias-quimicas-maestria', facultyId: 'upa-cienciasExactas', universityId: 'upa', name: 'Maestría en Ciencias Químicas', level: 'maestria', description: 'Posgrado en diversas áreas de la química.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-procesos-quimicos-industriales-posgrado', facultyId: 'upa-cienciasExactas', universityId: 'upa', name: 'Posgrado Especialización en Procesos Químicos Industriales', level: 'posgrado', description: 'Especialización en procesos químicos aplicados a la industria.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  // Informática, Electrónica y Comunicación (Consolidado)
                  { id: 'upa-ing-electronica-com-lic', facultyId: 'upa-informatica', universityId: 'upa', name: 'Licenciatura en Ingeniería Electrónica y Comunicación', level: 'licenciatura', description: 'Formación en sistemas electrónicos y de comunicación.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-ing-informatica-lic', facultyId: 'upa-informatica', universityId: 'upa', name: 'Licenciatura en Ingeniería en Informática', level: 'licenciatura', description: 'Desarrollo de software y sistemas informáticos.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-desarrollo-aplicaciones-tec-lic', facultyId: 'upa-informatica', universityId: 'upa', name: 'Licenciatura en Desarrollo de Aplicaciones Tecnológicas', level: 'licenciatura', description: 'Desarrollo de aplicaciones para diversas plataformas.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-gerencia-comercio-electronico-lic', facultyId: 'upa-informatica', universityId: 'upa', name: 'Licenciatura en Gerencia de Comercio Electrónico', level: 'licenciatura', description: 'Gestión de negocios en plataformas de comercio electrónico.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-ing-mecatronica-lic-ie', facultyId: 'upa-informatica', universityId: 'upa', name: 'Licenciatura en Ingeniería Mecatrónica', level: 'licenciatura', description: 'Combinación de mecánica, electrónica, informática y control.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-ciencia-datos-lic', facultyId: 'upa-informatica', universityId: 'upa', name: 'Licenciatura en Ciencia de Datos', level: 'licenciatura', description: 'Análisis y gestión de grandes volúmenes de datos.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-seguridad-informatica-forense-tec', facultyId: 'upa-informatica', universityId: 'upa', name: 'Técnico en Seguridad e Informática Forense', level: 'tecnico', description: 'Investigación de incidentes de seguridad y análisis forense digital.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-ing-internet-cosas-lic', facultyId: 'upa-informatica', universityId: 'upa', name: 'Licenciatura en Ingeniería en Internet de las Cosas', level: 'licenciatura', description: 'Desarrollo de sistemas para dispositivos conectados.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-informatica-educativa-tec-cru', facultyId: 'upa-informatica', universityId: 'upa', name: 'Técnico en Informática Educativa', level: 'tecnico', description: 'Aplicación de la informática en el ámbito educativo.', sedes: ['CRU (Centros Regionales)'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-informatica-gestion-educativa-empresarial-lic-cru', facultyId: 'upa-informatica',universityId: 'upa',  name: 'Licenciatura en Informática para la Gestión Educativa y Empresarial', level: 'licenciatura', description: 'Informática aplicada a la gestión en educación y empresas.', sedes: ['CRU (Centros Regionales)'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-ciberseguridad-tecnologias-lic-cru', facultyId: 'upa-informatica', universityId: 'upa', name: 'Licenciatura en Ciberseguridad de las Tecnologías de la Información', level: 'licenciatura', description: 'Especialización en ciberseguridad.', sedes: ['CRU (Centros Regionales)'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-entornos-virtuales-aprendizaje-maestria', facultyId: 'upa-informatica', universityId: 'upa', name: 'Maestría en Entornos Virtuales de Aprendizaje', level: 'maestria', description: 'Posgrado en diseño y gestión de entornos de aprendizaje virtual.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-ciencias-computacion-maestria', facultyId: 'upa-informatica', universityId: 'upa', name: 'Maestría en Ciencias de Computación', level: 'maestria', description: 'Posgrado en ciencias de la computación.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  // Ingeniería (Facultades de Ingeniería) - Consolidado de la sección del doc.
                  { id: 'upa-ing-infraestructura', facultyId: 'upa-ingenieria', universityId: 'upa', name: 'Ingeniería en Infraestructura', level: 'licenciatura', description: 'Diseño y construcción de infraestructuras.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-ing-edificaciones', facultyId: 'upa-ingenieria', universityId: 'upa', name: 'Ingeniería en Edificaciones', level: 'licenciatura', description: 'Ingeniería aplicada a la construcción de edificaciones.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-ing-energias-renovables-cocle', facultyId: 'upa-ingenieria', universityId: 'upa', name: 'Ingeniería en Energías Renovables', level: 'licenciatura', description: 'Especialización en fuentes de energía sostenibles.', sedes: ['Coclé'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-ing-industrial-auditoria-gestion-procesos', facultyId: 'upa-ingenieria', universityId: 'upa', name: 'Ingeniería Industrial, Auditoría y Gestión de Procesos', level: 'licenciatura', description: 'Optimización de procesos industriales y sistemas de gestión.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-ing-prevencion-riesgos-seguridad-ambiente', facultyId: 'upa-ingenieria', universityId: 'upa', name: 'Ingeniería en Prevención de Riesgos, Seguridad y Ambiente', level: 'licenciatura', description: 'Gestión de riesgos laborales y ambientales.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-ing-operaciones-aeroportuarias', facultyId: 'upa-ingenieria', universityId: 'upa', name: 'Ingeniería en Operaciones Aeroportuarias', level: 'licenciatura', description: 'Gestión y operación de infraestructuras aeroportuarias.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-ing-hidrologica-recursos-hidricos-lic', facultyId: 'upa-ingenieria', universityId: 'upa', name: 'Licenciatura en Ingeniería Hidrológica y Recursos Hídricos', level: 'licenciatura', description: 'Estudio y gestión de recursos hídricos.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-meteorologia-lic', facultyId: 'upa-ingenieria', universityId: 'upa', name: 'Licenciatura en Meteorología', level: 'licenciatura', description: 'Estudio de la atmósfera y fenómenos meteorológicos.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-geografia-profesional-lic', facultyId: 'upa-ingenieria', universityId: 'upa', name: 'Licenciatura en Geografía (Geográfo Profesional)', level: 'licenciatura', description: 'Análisis geográfico y cartografía.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-ing-topografia-geodesia-lic', facultyId: 'upa-ingenieria', universityId: 'upa', name: 'Licenciatura en Ingeniería en Topografía y Geodesía', level: 'licenciatura', description: 'Medición y representación de la superficie terrestre.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-ing-geologica-lic', facultyId: 'upa-ingenieria', universityId: 'upa', name: 'Licenciatura en Ingeniería Geológica', level: 'licenciatura', description: 'Estudio de la geología aplicada a la ingeniería.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-ing-auditoria-gestion-procesos-maestria', facultyId: 'upa-ingenieria', universityId: 'upa', name: 'Maestría en Ingeniería de Auditoría y Gestión de Procesos', level: 'maestria', description: 'Posgrado en auditoría y gestión de procesos en ingeniería.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  // Administración Pública
                  { id: 'upa-adm-publica-lic-gen', facultyId: 'upa-administracionPublica', universityId: 'upa', name: 'Licenciatura en Administración Pública', level: 'licenciatura', description: 'Formación para la gestión pública.', sedes: ['Campus Metropolitano', 'Chiriquí Grandes (Anexo)'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-adm-publica-semipresencial-lic', facultyId: 'upa-administracionPublica', universityId: 'upa', name: 'Licenciatura en Administración Pública Semipresencial', level: 'licenciatura', description: 'Formación en gestión pública con modalidad semipresencial.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-adm-publica-aduanera-lic', facultyId: 'upa-administracionPublica', universityId: 'upa', name: 'Licenciatura en Administración Pública Aduanera', level: 'licenciatura', description: 'Gestión aduanera y comercio exterior.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-relaciones-internacionales-lic', facultyId: 'upa-administracionPublica', universityId: 'upa', name: 'Licenciatura en Relaciones Internacionales', level: 'licenciatura', description: 'Estudio de las interacciones entre estados y actores globales.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-trabajo-social-lic', facultyId: 'upa-administracioPublica', universityId: 'upa', name: 'Licenciatura en Trabajo Social', level: 'licenciatura', description: 'Intervención social y desarrollo comunitario.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-desarrollo-comunitario-lic', facultyId: 'upa-administracionPublica', universityId: 'upa', name: 'Licenciatura en Desarrollo Comunitario', level: 'licenciatura', description: 'Planificación y gestión del desarrollo en comunidades.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-administracionEmpresas-policial-lic', facultyId: 'upa-administracionPublica', universityId: 'upa', name: 'Licenciatura en Administración Policial', level: 'licenciatura', description: 'Gestión de la seguridad y operaciones policiales.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-seguridad-nacional-sistema-internacional-lic', facultyId: 'upa-administracionPublica', universityId: 'upa', name: 'Licenciatura en Seguridad Nacional y Sistema Internacional', level: 'licenciatura', description: 'Análisis de la seguridad nacional e internacional.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-control-migratorio-seguridad-estudios-internacionales-tec', facultyId: 'upa-administracionPublica', universityId: 'upa', name: 'Técnico en Control Migratorio, Seguridad y Estudios Internacionales', level: 'tecnico', description: 'Formación técnica en control migratorio y seguridad.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  // Bellas Artes
                  { id: 'upa-artes-plasticas-lic-ba', facultyId: 'upa-bellasArtes', universityId: 'upa', name: 'Licenciatura en Artes Plásticas', level: 'licenciatura', description: 'Desarrollo de habilidades en diversas disciplinas artísticas visuales.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-diseno-grafico-ba-lic', facultyId: 'upa-bellasArtes', universityId: 'upa', name: 'Licenciatura en Diseño Gráfico', level: 'licenciatura', description: 'Creación de soluciones visuales y comunicación gráfica.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-musica-lic-ba', facultyId: 'upa-bellasArtes', universityId: 'upa', name: 'Licenciatura en Música', level: 'licenciatura', description: 'Estudio y práctica de la teoría y ejecución musical.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-teatro-lic', facultyId: 'upa-bellasArtes', universityId: 'upa', name: 'Licenciatura en Teatro', level: 'licenciatura', description: 'Formación en actuación y producción teatral.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-danza-lic', facultyId: 'upa-bellasArtes', universityId: 'upa', name: 'Licenciatura en Danza', level: 'licenciatura', description: 'Estudio y práctica de diversas formas de danza.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  // Ciencias de la Educación
                  { id: 'upa-educacion-inclusiva-lic-diurno', facultyId: 'upa-educacion', universityId: 'upa', name: 'Licenciatura en Educación con Enfoque Inclusivo (Diurno)', level: 'licenciatura', description: 'Formación docente para la educación inclusiva en horario diurno.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-educacion-inclusiva-lic-nocturno', facultyId: 'upa-educacion', universityId: 'upa', name: 'Licenciatura en Educación con Enfoque Inclusivo (Nocturno)', level: 'licenciatura', description: 'Formación docente para la educación inclusiva en horario nocturno.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-educacion-preescolar-lic', facultyId: 'upa-educacion', universityId: 'upa', name: 'Licenciatura en Educación Preescolar', level: 'licenciatura', description: 'Formación para la docencia en educación preescolar.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-educacion-primaria-lic', facultyId: 'upa-educacion', universityId: 'upa', name: 'Licenciatura en Educación Primaria', level: 'licenciatura', description: 'Formación para la docencia en educación primaria.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-psicopedagogia-lic', facultyId: 'upa-educacion', universityId: 'upa', name: 'Licenciatura en Psicopedagogía', level: 'licenciatura', description: 'Diagnóstico y tratamiento de dificultades de aprendizaje.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-evaluacion-investigacion-lic', facultyId: 'upa-educacion', universityId: 'upa', name: 'Licenciatura en Evaluación e Investigación', level: 'licenciatura', description: 'Metodologías de evaluación e investigación educativa.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-administracionEmpresas-centros-educativos-lic', facultyId: 'upa-educacion', universityId: 'upa', name: 'Licenciatura en Administración de Centros Educativos', level: 'licenciatura', description: 'Gestión y administración de instituciones educativas.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-orientacion-educativa-profesional-lic', facultyId: 'upa-educacion', universityId: 'upa', name: 'Licenciatura con Especialización en Orientación Educativa y Profesional', level: 'licenciatura', description: 'Orientación académica y profesional a estudiantes.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-profesorado-nivel-medio', facultyId: 'upa-educacion', universityId: 'upa', name: 'Profesorado Nivel Medio', level: 'tecnico', description: 'Formación para la docencia en educación media.', sedes: ['Sede', 'Anexos de Kusapin, Chiriquí Grande, Kankintú y Bocas Isla'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-profesorado-educacion', facultyId: 'upa-educacion', universityId: 'upa', name: 'Profesorado en Educación', level: 'tecnico', description: 'Formación general para la docencia.', sedes: ['Sede', 'Anexos de Kankintú, Chiriquí Grande y Bocas Isla'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-profesorado-docencia-media-diversificada', facultyId: 'upa-educacion', universityId: 'upa', name: 'Profesorado en Docencia Media Diversificada a Nivel de Pre-Media y Media', level: 'tecnico', description: 'Formación para la docencia en educación pre-media y media.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-docencia-superior', facultyId: 'upa-educacion', universityId: 'upa', name: 'Maestría en Docencia Superior', level: 'maestria', description: 'Posgrado en pedagogía para la educación superior.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-educacion-curriculum', facultyId: 'upa-educacion', universityId: 'upa', name: 'Maestría en Educación con énfasis en currículum', level: 'maestria', description: 'Posgrado en diseño y desarrollo curricular.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-posgrado-educacion-poblacion-sexualidad', facultyId: 'upa-educacion', universityId: 'upa', name: 'Postgrado de Educación en Población, Sexualidad y Desarrollo Humano', level: 'posgrado', description: 'Posgrado en educación en población y sexualidad.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-educacion-poblacion-sexualidad-genero', facultyId: 'upa-educacion', universityId: 'upa', name: 'Maestría de Educación en Población, Sexualidad y Desarrollo Humano con enfoque de Género', level: 'maestria', description: 'Posgrado en educación con enfoque de género.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-didactica', facultyId: 'upa-educacion', universityId: 'upa', name: 'Maestría en Didáctica', level: 'maestria', description: 'Posgrado en metodologías de enseñanza y aprendizaje.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-orientacion-consejeria', facultyId: 'upa-educacion', universityId: 'upa', name: 'Maestría en Orientación y Consejería', level: 'maestria', description: 'Posgrado en orientación y consejería educativa.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-administracion-educativa', facultyId: 'upa-educacion', universityId: 'upa', name: 'Maestría en Administración Educativa', level: 'maestria', description: 'Posgrado en gestión y administración de instituciones educativas.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-psicopedagogia-edu', facultyId: 'upa-educacion', universityId: 'upa', name: 'Maestría en Psicopedagogía', level: 'maestria', description: 'Posgrado en psicopedagogía.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-entornos-virtuales-aprendizaje-edu', facultyId: 'upa-educacion', universityId: 'upa', name: 'Maestría en Entornos Virtuales del Aprendizaje', level: 'maestria', description: 'Posgrado en diseño y gestión de entornos virtuales de aprendizaje.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-docencia-primaria', facultyId: 'upa-educacion', universityId: 'upa', name: 'Maestría en Docencia para la Educación Primaria', level: 'maestria', description: 'Posgrado en docencia para educación primaria.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-educacion-inicial', facultyId: 'upa-educacion', universityId: 'upa', name: 'Maestría en Educación Inicial', level: 'maestria', description: 'Posgrado en educación para la primera infancia.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-curso-especial-administracion-escolar-posgrado', facultyId: 'upa-educacion', universityId: 'upa', name: 'Curso Especial de Administración Escolar a Nivel de Postgrado (CEPADE)', level: 'posgrado', description: 'Curso especializado en administración escolar.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-doctorado-educacion', facultyId: 'upa-educacion', universityId: 'upa', name: 'Doctorado en Educación', level: 'doctorado', description: 'Doctorado en el campo de la educación.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de doctorado de la UP.', prices: { info: 'Consultar.' } },
                  // Comunicación Social
                  { id: 'upa-periodismo-lic-com', facultyId: 'upa-conunicacionSocial', universityId: 'upa', name: 'Licenciatura en Periodismo', level: 'licenciatura', description: 'Formación en investigación, redacción y difusión de noticias.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-publicidad-lic-com', facultyId: 'upa-conunicacionSocial', universityId: 'upa', name: 'Licenciatura en Publicidad', level: 'licenciatura', description: 'Creación y gestión de campañas publicitarias.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-relaciones-publicas-lic', facultyId: 'upa-conunicacionSocial', universityId: 'upa', name: 'Licenciatura en Relaciones Públicas', level: 'licenciatura', description: 'Gestión de la comunicación y la imagen corporativa.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-tec-lic-eventos-protocolo', facultyId: 'upa-conunicacionSocial', universityId: 'upa', name: 'Técnico y Licenciatura en Eventos y Protocolo Corporativo', level: 'licenciatura', description: 'Organización de eventos y protocolo corporativo.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-tec-lic-produccion-radio-cine-tv', facultyId: 'upa-conunicacionSocial', universityId: 'upa', name: 'Técnico y Licenciatura en Producción y Dirección de Radio, Cine y Televisión', level: 'licenciatura', description: 'Producción y dirección en medios audiovisuales.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-produccion-direccion-tv-cine', facultyId: 'upa-conunicacionSocial', universityId: 'upa', name: 'Maestría en Producción, Dirección Televisiva y Cinematográfica', level: 'maestria', description: 'Posgrado en producción y dirección audiovisual.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-publicidad-estrategica-creatividad', facultyId: 'upa-conunicacionSocial', universityId: 'upa', name: 'Maestría en Publicidad Estratégica y Creatividad', level: 'maestria', description: 'Posgrado en estrategias de publicidad y creatividad.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-periodismo-digital', facultyId: 'upa-conunicacionSocial', universityId: 'upa', name: 'Maestría en Periodismo Digital', level: 'maestria', description: 'Posgrado en periodismo con enfoque digital.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-comunicacion-corporativa', facultyId: 'upa-conunicacionSocial', universityId: 'upa', name: 'Maestría en Comunicación Corporativa', level: 'maestria', description: 'Posgrado en gestión de la comunicación organizacional.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-curso-especializado-periodismo-cientifico', facultyId: 'upa-conunicacionSocial', universityId: 'upa', name: 'Curso Especializado en Periodismo Científico', level: 'posgrado', description: 'Curso especializado en periodismo de ciencia.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  // Derecho y Ciencias Políticas
                  { id: 'upa-tec-criminalistica', facultyId: 'upa-derecho', universityId: 'upa', name: 'Técnico Superior en Criminalística', level: 'tecnico', description: 'Formación técnica en criminalística.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-tec-operario-sistema-penal-acusatorio', facultyId: 'upa-derecho', universityId: 'upa', name: 'Técnico Operario en Sistema Penal Acusatorio', level: 'tecnico', description: 'Formación técnica en el sistema penal acusatorio.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-tec-derecho-registral', facultyId: 'upa-derecho', universityId: 'upa', name: 'Técnico en Derecho Registral', level: 'tecnico', description: 'Formación técnica en derecho registral.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-derecho-ciencias-politicas-lic', facultyId: 'upa-derecho', universityId: 'upa', name: 'Licenciatura en Derecho y Ciencias Políticas', level: 'licenciatura', description: 'Formación integral en el ámbito legal y político.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-ciencia-politica-lic', facultyId: 'upa-derecho', universityId: 'upa', name: 'Licenciatura en Ciencia Política', level: 'licenciatura', description: 'Estudio de los sistemas políticos y el comportamiento político.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  // Economía
                  { id: 'upa-economia-lic-eco', facultyId: 'upa-economia', universityId: 'upa', name: 'Licenciatura en Economía', level: 'licenciatura', description: 'Estudio de la producción, distribución y consumo de bienes y servicios.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-economia-gestion-ambiental-lic', facultyId: 'upa-economia', universityId: 'upa', name: 'Licenciatura en Economía para la Gestión Ambiental', level: 'licenciatura', description: 'Aplicación de principios económicos a la gestión ambiental.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-estadistica-economica-ambiental-lic', facultyId: 'upa-economia', universityId: 'upa', name: 'Licenciatura en Estadística Económica y Ambiental', level: 'licenciatura', description: 'Análisis estadístico aplicado a la economía y el medio ambiente.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-finanzas-bancas-lic-eco', facultyId: 'upa-economia', universityId: 'upa', name: 'Licenciatura en Finanzas y Bancas', level: 'licenciatura', description: 'Formación en gestión financiera y operaciones bancarias.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-inversion-riesgo-lic', facultyId: 'upa-economia', universityId: 'upa', name: 'Licenciatura en Inversión y Riesgo', level: 'licenciatura', description: 'Análisis de inversiones y gestión de riesgos financieros.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-metodos-analisis-estadisticos-tec', facultyId: 'upa-economia', universityId: 'upa', name: 'Técnico en Métodos y Análisis Estadísticos', level: 'tecnico', description: 'Formación técnica en métodos de análisis estadístico.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-economia-ambiental-tec', facultyId: 'upa-economia', universityId: 'upa', name: 'Técnico en Economía Ambiental', level: 'tecnico', description: 'Formación técnica en economía aplicada al medio ambiente.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-economia-formulacion-evaluacion-administracion-productos-maestria', universityId: 'upa', facultyId: 'upa-economia', name: 'Maestría en Economía para la Formulación, Evaluación y Administración de Productos', level: 'maestria', description: 'Posgrado en economía para la gestión de productos.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-estadistica-economica-social-maestria', facultyId: 'upa-economia', universityId: 'upa', name: 'Maestría en Estadística Económica y Social', level: 'maestria', description: 'Posgrado en estadística aplicada a la economía y ciencias sociales.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-economia-monetaria-bancaria-maestria', facultyId: 'upa-economia', universityId: 'upa', name: 'Maestría en Economía Monetaria y Bancaria', level: 'maestria', description: 'Posgrado en economía monetaria y bancaria.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  // Humanidades
                  { id: 'upa-guia-turismo-geografico-ecologico-tec', facultyId: 'upa-humanidades', universityId: 'upa', name: 'Técnico en Guía de Turismo Geográfico Ecológico', level: 'tecnico', description: 'Formación en guianza turística con énfasis ecológico.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-cartografia-tec', facultyId: 'upa-humanidades', universityId: 'upa', name: 'Técnico en Cartografía', level: 'tecnico', description: 'Formación técnica en cartografía.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-comunicacion-ingles-lengua-extranjera-tec', facultyId: 'upa-humanidades', universityId: 'upa', name: 'Técnico en Comunicación en Inglés como Lengua Extranjera', level: 'tecnico', description: 'Formación técnica en comunicación en inglés.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-antropologia-lic-hum', facultyId: 'upa-humanidades', universityId: 'upa', name: 'Licenciatura en Antropología y tabla de equivalencia', level: 'licenciatura', description: 'Estudio del ser humano desde una perspectiva integral.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-bibliotecologia-ciencias-informacion-lic-tec', facultyId: 'upa-humanidades', universityId: 'upa', name: 'Licenciatura y Técnico en Bibliotecología y Ciencias de la Información', level: 'licenciatura', description: 'Gestión de bibliotecas y centros de información.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-educacion-fisica-lic', facultyId: 'upa-humanidades', universityId: 'upa', name: 'Licenciatura en Educación Física', level: 'licenciatura', description: 'Formación para la docencia y el desarrollo de la actividad física.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-espanol-lic', facultyId: 'upa-humanidades', universityId: 'upa', name: 'Licenciatura en Español', level: 'licenciatura', description: 'Estudio de la lengua y literatura española.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-filosofia-etica-valores-lic', facultyId: 'upa-humanidades', universityId: 'upa', name: 'Licenciatura en Filosofía, Ética y Valores', level: 'licenciatura', description: 'Estudio de la filosofía, ética y valores humanos.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-filosofia-historia-lic', facultyId: 'upa-humanidades', universityId: 'upa', name: 'Licenciatura en Filosofía e Historia', level: 'licenciatura', description: 'Estudio de la filosofía y la historia.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-frances-lic', facultyId: 'upa-humanidades', universityId: 'upa', name: 'Licenciatura en Francés', level: 'licenciatura', description: 'Dominio del idioma francés y su enseñanza.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-geografia-historia-lic', facultyId: 'upa-humanidades', universityId: 'upa', name: 'Licenciatura en Geografía e Historia', level: 'licenciatura', description: 'Estudio de la geografía y la historia.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-gestion-archivistica-lic', facultyId: 'upa-humanidades', universityId: 'upa', name: 'Licenciatura en Gestión Archivística', level: 'licenciatura', description: 'Gestión y organización de archivos y documentos.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-historia-lic', facultyId: 'upa-humanidades', universityId: 'upa', name: 'Licenciatura en Historia', level: 'licenciatura', description: 'Estudio de los eventos y procesos históricos.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-ingles-lic-hum', facultyId: 'upa-humanidades', universityId: 'upa', name: 'Licenciatura en Inglés', level: 'licenciatura', description: 'Dominio del idioma inglés y su enseñanza.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-sociologia-lic', facultyId: 'upa-humanidades', universityId: 'upa', name: 'Licenciatura en Sociología', level: 'licenciatura', description: 'Estudio de la sociedad y los fenómenos sociales.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-turismo-geografico-ecologico-lic', facultyId: 'upa-humanidades', universityId: 'upa', name: 'Licenciatura en Turismo Geográfico Ecológico', level: 'licenciatura', description: 'Gestión de turismo con enfoque geográfico y ecológico.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-turismo-historico-cultural-lic', facultyId: 'upa-humanidades', universityId: 'upa', name: 'Licenciatura en Turismo Histórico Cultural', level: 'licenciatura', description: 'Gestión de turismo con enfoque en historia y cultura.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-humanidades-turismo-alternativo-lic', facultyId: 'upa-humanidades', universityId: 'upa', name: 'Licenciatura en Humanidades con Especialización en Turismo Alternativo', level: 'licenciatura', description: 'Humanidades aplicadas al turismo alternativo.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-cartografia-lic-hum', facultyId: 'upa-humanidades', universityId: 'upa', name: 'Licenciatura en Cartografía', level: 'licenciatura', description: 'Estudio y creación de mapas.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-linguistica-texto-espanol-posgrado', facultyId: 'upa-humanidades', universityId: 'upa', name: 'Posgrado en Lingüística del Texto aplicada a la Enseñanza del Español', level: 'posgrado', description: 'Posgrado en lingüística aplicada a la enseñanza del español.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-tic-gestores-informacion-posgrado', facultyId: 'upa-humanidades', universityId: 'upa', name: 'Posgrado en Tecnologías de la Información y la Comunicación para gestores de información', level: 'posgrado', description: 'Posgrado en TIC para la gestión de información.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-linguistica-aplicada-ingles-posgrado', facultyId: 'upa-humanidades', universityId: 'upa', name: 'Posgrado en Lingüística aplicada al Inglés', level: 'posgrado', description: 'Posgrado en lingüística aplicada al inglés.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-traduccion-ingles-espanol-posgrado', facultyId: 'upa-humanidades', universityId: 'upa', name: 'Posgrado en Traducción del Inglés al español y del español al Inglés', level: 'posgrado', description: 'Posgrado en traducción.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-geografia-ordenamiento-territorial-ambiental-maestria', facultyId: 'upa-humanidades', universityId: 'upa', name: 'Maestría en Geografía con énfasis en Ordenamiento Territorial Ambiental', level: 'maestria', description: 'Posgrado en geografía con enfoque en ordenamiento territorial.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-geografia-planificacion-urbana-maestria', facultyId: 'upa-humanidades', universityId: 'upa', name: 'Maestría en Geografía con énfasis en Planificación Urbana', level: 'maestria', description: 'Posgrado en geografía con enfoque en planificación urbana.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-geografia-regional-maestria', facultyId: 'upa-humanidades', universityId: 'upa', name: 'Maestría en Geografía Regional', level: 'maestria', description: 'Posgrado en geografía regional.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-gestion-informacion-documentacion', facultyId: 'upa-humanidades', universityId: 'upa', name: 'Maestría en Gestión de Información y Documentación', level: 'maestria', description: 'Posgrado en gestión de información y documentación.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-historia-america-latina', facultyId: 'upa-humanidades', universityId: 'upa', name: 'Maestría en Historia de América Latina', level: 'maestria', description: 'Posgrado en historia de América Latina.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-literatura-comparada', facultyId: 'upa-humanidades', universityId: 'upa', name: 'Maestría en Literatura Comparada', level: 'maestria', description: 'Posgrado en literatura comparada.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-especializacion-correccion-textos', facultyId: 'upa-humanidades', universityId: 'upa', name: 'Especialización en corrección de Textos', level: 'especializacion', description: 'Especialización en corrección de textos.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-doctorado-humanidades-ciencias-sociales', facultyId: 'upa-humanidades', universityId: 'upa', name: 'Doctorado en Humanidades y Ciencias Sociales', level: 'doctorado', description: 'Doctorado en el campo de las humanidades y ciencias sociales.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de doctorado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-doctorado-historia', facultyId: 'upa-humanidades', universityId: 'upa', name: 'Doctorado en Historia', level: 'doctorado', description: 'Doctorado en el campo de la historia.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de doctorado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-doctorado-linguistica-espanola', facultyId: 'upa-humanidades', universityId: 'upa', name: 'Doctorado en Lingüística Española', level: 'doctorado', description: 'Doctorado en lingüística española.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de doctorado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-doctorado-linguistica-inglesa', facultyId: 'upa-humanidades', universityId: 'upa', name: 'Doctorado en Lingüística Inglesa', level: 'doctorado', description: 'Doctorado en lingüística inglesa.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de doctorado de la UP.', prices: { info: 'Consultar.' } },
                  // Enfermería
                  { id: 'upa-enfermeria-lic-salud', facultyId: 'upa-enfermeria', universityId: 'upa', name: 'Licenciatura en Enfermería', level: 'licenciatura', description: 'Formación integral en el cuidado de la salud.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de admisión en Enfermería.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-salud-publica-enf', facultyId: 'upa-enfermeria', universityId: 'upa', name: 'Maestría en Salud Pública', level: 'maestria', description: 'Posgrado en gestión y promoción de la salud pública.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado en Enfermería.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-epidemiologia', facultyId: 'upa-enfermeria', universityId: 'upa', name: 'Maestría en Epidemiología', level: 'maestria', description: 'Posgrado en el estudio y control de enfermedades.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado en Enfermería.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-atencion-primaria-salud', facultyId: 'upa-enfermeria', universityId: 'upa', name: 'Maestría en Atención Primaria en Salud', level: 'maestria', description: 'Posgrado en atención primaria de salud.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado en Enfermería.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-gestion-servicios-enfermeria', facultyId: 'upa-enfermeria', universityId: 'upa', name: 'Maestría en Gestión de los Servicios de Enfermería en Salud', level: 'maestria', description: 'Posgrado en gestión de servicios de enfermería.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado en Enfermería.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-enfermeria-pediatrica', facultyId: 'upa-enfermeria', universityId: 'upa', name: 'Maestría en Enfermería Pediátrica', level: 'maestria', description: 'Posgrado en enfermería especializada en pediatría.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado en Enfermería.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-enfermeria-gineco-obstetrica', facultyId: 'upa-enfermeria', universityId: 'upa', name: 'Maestría en Enfermería Gineco Obstétrica', level: 'maestria', description: 'Posgrado en enfermería especializada en ginecología y obstetricia.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado en Enfermería.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-enfermeria-salud-mental', facultyId: 'upa-enfermeria', universityId: 'upa', name: 'Maestría en Enfermería en Salud Mental', level: 'maestria', description: 'Posgrado en enfermería especializada en salud mental.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado en Enfermería.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-enfermeria-urgencias-emergencias', facultyId: 'upa-enfermeria', universityId: 'upa', name: 'Maestría en Enfermería con énfasis en Urgencias y Emergencias', level: 'maestria', description: 'Posgrado en enfermería de urgencias y emergencias.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado en Enfermería.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-enfermeria-cuidado-critico', facultyId: 'upa-enfermeria', universityId: 'upa', name: 'Maestría en Enfermería con énfasis en Cuidado Crítico', level: 'maestria', description: 'Posgrado en enfermería de cuidados críticos.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado en Enfermería.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-enfermeria-oncologia', facultyId: 'upa-enfermeria', universityId: 'upa', name: 'Maestría en Enfermería con énfasis en Oncología', level: 'maestria', description: 'Posgrado en enfermería oncológica.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado en Enfermería.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-enfermeria-nefrologia', facultyId: 'upa-enfermeria', universityId: 'upa', name: 'Maestría en Enfermería con énfasis en Nefrología', level: 'maestria', description: 'Posgrado en enfermería nefrológica.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado en Enfermería.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-enfermeria-cardiovascular', facultyId: 'upa-enfermeria', universityId: 'upa', name: 'Maestría en Enfermería con énfasis en Cardiovascular', level: 'maestria', description: 'Posgrado en enfermería cardiovascular.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado en Enfermería.', prices: { info: 'Consultar.' } },
                  { id: 'upa-doctorado-enfermeria-salud-internacional', facultyId: 'upa-enfermeria', universityId: 'upa', name: 'Doctorado en Enfermería con énfasis en Salud Internacional', level: 'doctorado', description: 'Doctorado en enfermería con enfoque en salud internacional.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de doctorado en Enfermería.', prices: { info: 'Consultar.' } },
                  // Farmacia
                  { id: 'upa-farmacia-tec-farm', facultyId: 'upa-farmacia', universityId: 'upa', name: 'Técnico en Farmacia', level: 'tecnico', description: 'Asistencia en el ámbito farmacéutico.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-farmacia-lic-farm', facultyId: 'upa-farmacia', universityId: 'upa', name: 'Licenciatura en Farmacia', level: 'licenciatura', description: 'Estudio de fármacos y su aplicación.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-farmacia-industrial', facultyId: 'upa-farmacia', universityId: 'upa', name: 'Maestría en Farmacia Industrial', level: 'maestria', description: 'Posgrado en procesos y producción farmacéutica.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-asuntos-regulatorios-farmaceutica', facultyId: 'upa-farmacia', universityId: 'upa', name: 'Maestría en Asuntos Regulatorios con énfasis en Auditoría Farmacéutica', level: 'maestria', description: 'Posgrado en regulación y auditoría farmacéutica.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-asuntos-regulatorios-biotecnologicos', facultyId: 'upa-farmacia', universityId: 'upa', name: 'Maestría en Asuntos Regulatorios con énfasis en Medicamentos Biotecnológicos', level: 'maestria', description: 'Posgrado en regulación de medicamentos biotecnológicos.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-asuntos-regulatorios-farmacovigilancia', facultyId: 'upa-farmacia', universityId: 'upa', name: 'Maestría en Asuntos Regulatorios con énfasis en Farmacovigilancia', level: 'maestria', description: 'Posgrado en regulación y farmacovigilancia.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-especialidad-logistica-farmaceutica', facultyId: 'upa-farmacia', universityId: 'upa', name: 'Especialidad en Logística Farmacéutica', level: 'especializacion', description: 'Especialización en la cadena de suministro farmacéutica.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-farmacia-hospitalaria-nutricion', facultyId: 'upa-farmacia', universityId: 'upa', name: 'Maestría en Farmacia Hospitalaria con énfasis en Nutrición Parental', level: 'maestria', description: 'Posgrado en farmacia hospitalaria y nutrición parental.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-farmacia-hospitalaria-pediatria', facultyId: 'upa-farmacia', universityId: 'upa', name: 'Maestría en Farmacia Hospitalaria con énfasis en Pediatría', level: 'maestria', description: 'Posgrado en farmacia hospitalaria pediátrica.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  // Medicina
                  { id: 'upa-urgencias-medicas-tec-med', facultyId: 'upa-medicina', universityId: 'upa', name: 'Técnico en Urgencias Médicas', level: 'tecnico', description: 'Asistencia en situaciones de emergencia médica.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-doctor-medicina-lic', facultyId: 'upa-medicina', universityId: 'upa', name: 'Licenciatura en Doctor de Medicina', level: 'licenciatura', description: 'Formación integral para la práctica médica.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de admisión en Medicina.', prices: { info: 'Consultar.' } },
                  { id: 'upa-radiologia-imagenes-medicas-lic', facultyId: 'upa-medicina', universityId: 'upa', name: 'Licenciatura en Radiología e Imágenes Médicas', level: 'licenciatura', description: 'Diagnóstico por imágenes médicas.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-tecnologia-medica-lic-med', facultyId: 'upa-medicina', universityId: 'upa', name: 'Licenciatura en Tecnología Médica', level: 'licenciatura', description: 'Formación en tecnología para diagnóstico y tratamiento médico.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-salud-ocupacional-lic-med', facultyId: 'upa-medicina', universityId: 'upa', name: 'Licenciatura en Salud Ocupacional', level: 'licenciatura', description: 'Prevención de riesgos y promoción de la salud en el trabajo.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-nutricion-dietetica-lic', facultyId: 'upa-medicina', universityId: 'upa', name: 'Licenciatura en Nutrición y Dietética', level: 'licenciatura', description: 'Estudio de la nutrición humana y planificación dietética.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-ciencias-biomedicas', facultyId: 'upa-medicina', universityId: 'upa', name: 'Maestría en Ciencias Biomédicas', level: 'maestria', description: 'Posgrado en investigación y desarrollo en ciencias biomédicas.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-ciencias-clinicas-medicina-forense', facultyId: 'upa-medicina', universityId: 'upa', name: 'Maestría en Ciencias Clínicas con Especialización en Medicina Forense', level: 'maestria', description: 'Posgrado en medicina forense.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-salud-publica-med', facultyId: 'upa-medicina', universityId: 'upa', name: 'Maestría en Salud Pública', level: 'maestria', description: 'Posgrado en gestión y promoción de la salud pública.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-fisiologia-ejercicio', facultyId: 'upa-medicina', universityId: 'upa', name: 'Maestría en Fisiología del Ejercicio (MFE)', level: 'maestria', description: 'Posgrado en fisiología del ejercicio.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-ciencias-clinicas-medicina-interna', facultyId: 'upa-medicina', universityId: 'upa', name: 'Maestría en Ciencias Clínicas con Especialización: Medicina Interna', level: 'maestria', description: 'Posgrado en medicina interna.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-ciencias-clinicas-pediatria', facultyId: 'upa-medicina', universityId: 'upa', name: 'Maestría en Ciencias Clínicas con Especialización: Pediatría', level: 'maestria', description: 'Posgrado en pediatría.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-ciencias-clinicas-psiquiatria', facultyId: 'upa-medicina', universityId: 'upa', name: 'Maestría en Ciencias Clínicas con Especialización: Psiquiatría', level: 'maestria', description: 'Posgrado en psiquiatría.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-ciencias-clinicas-cirugia-general', facultyId: 'upa-medicina', universityId: 'upa', name: 'Maestría en Ciencias Clínicas con Especialización: Cirugía General', level: 'maestria', description: 'Posgrado en cirugía general.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-ciencias-clinicas-ginecologia-obstetricia', facultyId: 'upa-medicina', universityId: 'upa', name: 'Maestría en Ciencias Clínicas con Especialización: Ginecología y Obstetricia', level: 'maestria', description: 'Posgrado en ginecología y obstetricia.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-ciencias-clinicas-medicina-familiar', facultyId: 'upa-medicina', universityId: 'upa', name: 'Maestría en Ciencias Clínicas con Especialización: Medicina Familiar', level: 'maestria', description: 'Posgrado en medicina familiar.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-doctorado-medicina-preventiva-salud-publica', facultyId: 'upa-medicina', universityId: 'upa', name: 'Doctorado en Medicina Preventiva y Salud Pública', level: 'doctorado', description: 'Doctorado en medicina preventiva y salud pública.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de doctorado de la UP.', prices: { info: 'Consultar.' } },
                  // Medicina Veterinaria
                  { id: 'upa-doctor-medicina-veterinaria-lic', facultyId: 'upa-medicina-veterinaria', universityId: 'upa', name: 'Licenciatura en Doctor en Medicina Veterinaria', level: 'licenciatura', description: 'Diagnóstico, tratamiento y prevención de enfermedades en animales.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de admisión en Medicina Veterinaria.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-clinica-cirugia-caninos-felinos', facultyId: 'upa-medicina-veterinaria', universityId: 'upa', name: 'Maestría en Clínica y Cirugía de Caninos y Felinos', level: 'maestria', description: 'Posgrado en clínica y cirugía para pequeños animales. Duración: 5 cuatrimestres.', sedes: ['Campus Metropolitano'], admission_guide: 'Título de Doctor en Medicina Veterinaria.', prices: { info: 'Consultar.' } },
                  { id: 'upa-maestria-salud-publica-vet', facultyId: 'upa-medicina-veterinaria', universityId: 'upa', name: 'Maestría en Salud Pública', level: 'maestria', description: 'Posgrado en salud pública.', sedes: ['Campus Metropolitano'], admission_guide: 'Título de Doctor en Medicina Veterinaria.', prices: { info: 'Consultar.' } },
                  // Odontología
                  { id: 'upa-asistente-odontologia-tec-od', facultyId: 'upa-odontologia', universityId: 'upa', name: 'Técnico en Asistente en Odontología', level: 'tecnico', description: 'Asistencia en el ámbito odontológico.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                  { id: 'upa-cirugia-dental-lic-od', facultyId: 'upa-odontologia', universityId: 'upa', name: 'Licenciatura en Cirugía Dental', level: 'licenciatura', description: 'Formación para la práctica de la cirugía dental.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                    //psicologia
                    { id: 'upa-psicologia-lic-od', facultyId: 'upa-psicologia', universityId: 'upa', name: 'Licenciatura en Psicologia', level: 'licenciatura', description: 'Formación para la práctica de la cirugía dental.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                    { id: 'upa-maestria-psicologia-escolar--od', facultyId: 'upa-psicologia', universityId: 'upa', name: 'Maestria en Psicologia Escolar', level: 'maestria', description: 'Formación para la práctica de la cirugía dental.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                    { id: 'upa-maestria-psicologia-clinica-od', facultyId: 'upa-psicologia', universityId: 'upa', name: 'Maestria en Psicologia Clinica', level: 'maestria', description: 'Formación para la práctica de la cirugía dental.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                    { id: 'upa-maestria-psicologia-industrial-od', facultyId: 'upa-psicologia', universityId: 'upa', name: 'Maestria en Psicologia Industrial y Organiacional', level: 'maestria', description: 'Formación para la práctica de la cirugía dental.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                    { id: 'upa-maestria-psicologia-juridica-od', facultyId: 'upa-psicologia', universityId: 'upa', name: 'Maestria en Psicologia Juridica y Forense', level: 'maestria', description: 'Formación para la práctica de la cirugía dental.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UP.', prices: { info: 'Consultar.' } },
                    
                ];
               break

               case 'udelas':
                universityName = "Universidad Especializadas de las Americas";
                facultadesToSeed = [//universityId: 'udelas',
                 { id: 'udelas-medicas-clinicas', universityId: 'udelas', name: 'Facultad de Ciencias Medicas y Clínicas' },
                 { id: 'udelas-biociencias', universityId: 'udelas' , name : 'Facultad de Biociencias y Salud Pública' },
                  { id: 'udelas-educacion-especial', univertityId:'udelas', name: 'Facultad de Educación Especial y Pedagogía' },
                  { id: 'udelas-educacion-social', universityID:'udelas', name: 'Facultad de Educación Social y Desarrollo Humano' },
              ];
                programasToSeed  = [
                  // Ciencias Médicas y Clínicas
                  { id: 'udelas-actividad-fisica-lic', facultyId: 'udelas-medicas-clinicas', universityId: 'udelas', name: 'Licenciatura en Ciencias de la Actividad Física, el Deporte y la Recreación', level: 'licenciatura', description: 'Formación para profesionales en el deporte y la recreación.', sedes: ['Sede Panamá', 'Sede Chiriquí'], admission_guide: 'Requisitos generales de udelas.', prices: { info: 'Consultar.' } },
                  { id: 'udelas-enfermeria-lic', facultyId: 'udelas-medicas-clinicas', universityId: 'udelas', name: 'Licenciatura de Ciencias de la Enfermería', level: 'licenciatura', description: 'Formación en el cuidado de enfermería.', sedes: ['Sede Panamá', 'Sede Chiriquí'], admission_guide: 'Requisitos generales de udelas.', prices: { info: 'Consultar.' } },
                  { id: 'udelas-urgencias-medicas-lic', facultyId: 'udelas-medicas-clinicas', universityId: 'udelas', name: 'Licenciatura de Urgencias Médicas y Desastres', level: 'licenciatura', description: 'Preparación para la atención en emergencias médicas y desastres.', sedes: ['Sede Panamá', 'Sede Chiriquí'], admission_guide: 'Requisitos generales de udelas.', prices: { info: 'Consultar.' } },
                  { id: 'udelas-fisioterapia-lic', facultyId: 'udelas-medicas-clinicas', universityId: 'udelas', name: 'Licenciatura en Fisioterapia', level: 'licenciatura', description: 'Diagnóstico y tratamiento de afecciones del movimiento.', sedes: ['Sede Panamá', 'Sede Chiriquí'], admission_guide: 'Requisitos generales de udelas.', prices: { info: 'Consultar.' } },
                  { id: 'udelas-doctor-optometria-lic', facultyId: 'udelas-medicas-clinicas', universityId: 'udelas', name: 'Licenciatura en Doctor en Optometría', level: 'licenciatura', description: 'Diagnóstico y tratamiento de problemas de la vista.', sedes: ['Sede Panamá'], admission_guide: 'Requisitos generales de udelas.', prices: { info: 'Consultar.' } },
                  { id: 'udelas-terapia-respiratoria-lic', facultyId: 'udelas-medicas-clinicas', universityId: 'udelas', name: 'Licenciatura en Terapia Respiratoria', level: 'licenciatura', description: 'Terapia para afecciones respiratorias.', sedes: ['Sede Panamá'], admission_guide: 'Requisitos generales de udelas.', prices: { info: 'Consultar.' } },
                  { id: 'udelas-fonoaudiologia-lic', facultyId: 'udelas-medicas-clinicas', universityId: 'udelas', name: 'Licenciatura en Fonoaudiología', level: 'licenciatura', description: 'Diagnóstico y tratamiento de trastornos de la comunicación.', sedes: ['Sede Panamá'], admission_guide: 'Requisitos generales de udelas.', prices: { info: 'Consultar.' } },
                  { id: 'udelas-terapia-ocupacional-lic', facultyId: 'udelas-medicas-clinicas', universityId: 'udelas', name: 'Licenciatura en Terapia Ocupacional', level: 'licenciatura', description: 'Promoción de la salud y bienestar a través de la ocupación.', sedes: ['Sede Panamá'], admission_guide: 'Requisitos generales de udelas.', prices: { info: 'Consultar.' } },
                  { id: 'udelas-lab-clinico-tec', facultyId: 'udelas-medicas-clinicas', universityId: 'udelas', name: 'Técnico de Asistente de Laboratorio Clínico Sanitario', level: 'tecnico', description: 'Asistencia en laboratorio clínico y sanitario.', sedes: ['Sede Panamá'], admission_guide: 'Requisitos generales de udelas.', prices: { info: 'Consultar.' } },
                  // Biociencias y Salud Pública
                  { id: 'udelas-biomedica-tec', facultyId: 'udelas-biociencias', universityId: 'udelas', name: 'Técnico de Biomédica', level: 'tecnico', description: 'Formación en equipos y sistemas biomédicos.', sedes: ['Sede Panamá', 'Sede Azuero', 'Sede Colón', 'Sede Coclé', 'Sede Veraguas'], admission_guide: 'Requisitos generales de udelas.', prices: { info: 'Consultar.' } },
                  // Educación Especial y Pedagogía
                  { id: 'udelas-pedagogia-primaria-lic', facultyId: 'udelas-educacion-especial', universityId: 'udelas', name: 'Pedagogía para la Educación Primaria', level: 'licenciatura', description: 'Formación para la docencia en educación primaria.', sedes: ['Sede Azuero', 'Sede Central de Panamá'], admission_guide: 'Requisitos generales de udelas.', prices: { info: 'Consultar.' } },
                  { id: 'udelas-educacion-especial-lic', facultyId: 'udelas-educacion-especial', universityId: 'udelas', name: 'Licenciatura en Educación Especial con modalidad Sabatina', level: 'licenciatura', description: 'Especialización en educación para personas con necesidades especiales.', sedes: ['Sede Veraguas'], admission_guide: 'Requisitos generales de udelas.', prices: { info: 'Consultar.' } },
                  { id: 'udelas-tec-educacion-especial', facultyId: 'udelas-educacion-especial', universityId: 'udelas', name: 'Técnico en Educación Especial', level: 'tecnico', description: 'Formación técnica en educación especial.', sedes: ['Sede Azuero'], admission_guide: 'Requisitos generales de udelas.', prices: { info: 'Consultar.' } },
                  { id: 'udelas-tec-docente-integral', facultyId: 'udelas-educacion-especial', universityId: 'udelas', name: 'Técnico en Docente Integral (Licenciatura en Educación Especial)', level: 'tecnico', description: 'Formación de docentes integrales con enfoque en educación especial.', sedes: ['Sede Coclé', 'Sede Veraguas'], admission_guide: 'Requisitos generales de udelas.', prices: { info: 'Consultar.' } },
                  { id: 'udelas-dificultades-aprendizaje-tec', facultyId: 'udelas-educacion-especial', universityId: 'udelas', name: 'Dificultades en el Aprendizaje', level: 'tecnico', description: 'Especialización en dificultades de aprendizaje.', sedes: ['Sede Veraguas'], admission_guide: 'Requisitos generales de udelas.', prices: { info: 'Consultar.' } },
                  { id: 'udelas-edu-especial-maestria', facultyId: 'udelas-educacion-especial', universityId: 'udelas', name: 'Maestría en Educación Especial', level: 'maestria', description: 'Posgrado en educación especial.', sedes: ['Sede Veraguas'], admission_guide: 'Requisitos de posgrado de udelas.', prices: { info: 'Consultar.' } },
                  { id: 'udelas-dificultades-matematica-maestria', facultyId: 'udelas-educacion-especial', universityId: 'udelas', name: 'Maestría en Dificultades en el Aprendizaje de la Matemática', level: 'maestria', description: 'Posgrado en dificultades de aprendizaje de matemáticas.', sedes: ['No especificado'], admission_guide: 'Requisitos de posgrado de udelas.', prices: { info: 'Consultar.' } },
                  // Educación Social y Desarrollo Humano
                  { id: 'udelas-estimulacion-temprana-lic', facultyId: 'udelas-educacion-social', universityId: 'udelas', name: 'Estimulación Temprana y Orientación Familiar', level: 'licenciatura', description: 'Enfoque en el desarrollo temprano y apoyo familiar.', sedes: ['Sede Panamá', 'Sede Azuero', 'Sede Colón', 'Sede Coclé', 'Sede Veraguas'], admission_guide: 'Requisitos generales de udelas.', prices: { info: 'Consultar.' } },
                  { id: 'udelas-docencia-bilingue-intercultural-lic', facultyId: 'udelas-educacion-social', universityId: 'udelas', name: 'Docencia en Educación Bilingüe Intercultural', level: 'licenciatura', description: 'Formación de docentes para educación bilingüe intercultural.', sedes: ['Chichica, Comarca Ngäbe Bugle (a través de Sede Chiriquí)', 'Sede Veraguas'], admission_guide: 'Requisitos generales de udelas.', prices: { info: 'Consultar.' } },
                  { id: 'udelas-docencia-ingles-lic', facultyId: 'udelas-educacion-social', universityId: 'udelas', name: 'Docencia de Inglés', level: 'licenciatura', description: 'Formación para la enseñanza del idioma inglés.', sedes: ['Changuinola, Bocas del Toro (a través de Sede Chiriquí)', 'Sede Veraguas'], admission_guide: 'Requisitos generales de udelas.', prices: { info: 'Consultar.' } },
                  { id: 'udelas-gestion-turistica-bilingue-lic', facultyId: 'udelas-educacion-social', universityId: 'udelas', name: 'Licenciatura en Gestión Turística Bilingüe', level: 'licenciatura', description: 'Gestión turística con enfoque bilingüe.', sedes: ['Sede Veraguas'], admission_guide: 'Requisitos generales de udelas.', prices: { info: 'Consultar.' } },
                  { id: 'udelas-seguridad-alimentaria-nutricional-lic', facultyId: 'udelas-educacion-social', universityId: 'udelas', name: 'Seguridad Alimentaria Nutricional', level: 'licenciatura', description: 'Estudio de la seguridad alimentaria y nutrición.', sedes: ['Sede Veraguas'], admission_guide: 'Requisitos generales de udelas.', prices: { info: 'Consultar.' } },
                  { id: 'udelas-docencia-informatica-educativa-lic', facultyId: 'udelas-educacion-social', universityId: 'udelas', name: 'Docencia en Informática Educativa', level: 'licenciatura', description: 'Formación para la enseñanza de la informática educativa.', sedes: ['Sede Veraguas'], admission_guide: 'Requisitos generales de udelas.', prices: { info: 'Consultar.' } },
                  // Posgrados generales
                  { id: 'udelas-metodologia-deporte-maestria', facultyId: 'udelas-medicas-clinicas', universityId: 'udelas', name: 'Maestría en Metodología del Entrenamiento Deportivo para la Alta Competencia', level: 'maestria', description: 'Posgrado en entrenamiento deportivo.', sedes: ['Sede Colón'], admission_guide: 'Requisitos de posgrado de udelas.', prices: { info: 'Consultar.' } },
                  { id: 'udelas-ciencias-salud-comportamiento-doctorado', facultyId: 'udelas-educacion-social', universityId: 'udelas', name: 'Doctorado en Ciencias de la Salud y del Comportamiento Humano', level: 'doctorado', description: 'Doctorado en ciencias de la salud y el comportamiento humano.', sedes: ['No especificado'], admission_guide: 'Requisitos de doctorado de udelas.', prices: { info: 'Consultar.' } },
                  { id: 'udelas-ciencias-educacion-desarrollo-humano-doctorado', facultyId: 'udelas-educacion-social', universityId: 'udelas', name: 'Doctorado en Ciencias de la Educación con énfasis en Educación Social y Desarrollo Humano', level: 'doctorado', description: 'Doctorado en educación con enfoque en desarrollo humano.', sedes: ['Sede Veraguas'], admission_guide: 'Requisitos de doctorado de udelas.', prices: { info: 'Consultar.' } },
                  { id: 'udelas-edu-ambiental-diplomado', facultyId: 'udelas-biociencias', universityId: 'udelas', name: 'Diplomado en Educación Ambiental', level: 'posgrado', description: 'Programa de corta duración en educación ambiental.', sedes: ['Sede Azuero'], admission_guide: 'Requisitos generales de udelas.', prices: { info: 'Consultar.' } },
              ];
              break

              case 'umaip': 
                name: "umaip (Universidad Marítima Internacional de Panamá)";
                facultadesToSeed = [ //universityId: 'umaip',
                    { id: 'umaip-ciencias-nauticas', universityId: 'umaip', name: 'Facultad de Ciencias Náuticas' },
                    { id: 'umaip-transporte-maritimo', universityId:'umaip', name: 'Facultad de Transporte Marítimo' },
                    { id: 'umaip-ciencias-del-mar', universityId:'umaip', name: 'Facultad de Ciencias del Mar' },
                    { id: 'umaip-ingenieria-civil-maritima', universityId:'umaip', name: 'Facultad de Ingeniería Civil Marítima' },
                ],
                programasToSeed = [
                    // Ciencias Náuticas
                    { id: 'umaip-nautica-navegacion-ing', facultyId: 'umaip-ciencias-nauticas', universityId: 'umaip', name: 'Ingeniería Náutica en Navegación', level: 'licenciatura', description: 'Forma futuros oficiales de navegación de buques mercantes.', sedes: ['Campus Principal'], admission_guide: 'Requisitos generales de umaip para carreras náuticas.', prices: { info: 'Consultar.' } },
                    { id: 'umaip-nautica-maquinaria-naval-ing', facultyId: 'umaip-ciencias-nauticas', universityId: 'umaip', name: 'Ingeniería Náutica en Maquinaria Naval', level: 'licenciatura', description: 'Prepara para operar, reparar y mantener maquinaria de buques.', sedes: ['Campus Principal'], admission_guide: 'Requisitos generales de umaip para carreras náuticas.', prices: { info: 'Consultar.' } },
                    { id: 'umaip-nautica-electrotecnia-ing', facultyId: 'umaip-ciencias-nauticas', universityId: 'umaip', name: 'Ingeniería Náutica en Electrotecnia', level: 'licenciatura', description: 'Capacita para operar, reparar y mantener sistemas eléctricos y electrónicos a bordo.', sedes: ['Campus Principal'], admission_guide: 'Requisitos generales de umaip para carreras náuticas.', prices: { info: 'Consultar.' } },
                    // Transporte Marítimo
                    { id: 'umaip-adm-maritima-portuaria-lic', facultyId: 'umaip-transporte-maritimo', universityId: 'umaip', name: 'Administración Marítima y Portuaria', level: 'licenciatura', description: 'Gestión en el sector marítimo y portuario.', sedes: ['Campus Principal'], admission_guide: 'Requisitos generales de umaip.', prices: { info: 'Consultar.' } },
                    { id: 'umaip-logistica-transporte-lic', facultyId: 'umaip-transporte-maritimo', universityId: 'umaip', name: 'Gestión Logística y Transporte Intermodal', level: 'licenciatura', description: 'Formación en logística y transporte multimodal.', sedes: ['Campus Principal'], admission_guide: 'Requisitos generales de umaip.', prices: { info: 'Consultar.' } },
                    { id: 'umaip-ing-transporte-maritimo-lic', facultyId: 'umaip-transporte-maritimo', universityId: 'umaip', name: 'Ingeniería en Transporte Marítimo e Industrias Marítimas y Portuarias', level: 'licenciatura', description: 'Ingeniería aplicada al transporte y la industria marítima.', sedes: ['Campus Principal'], admission_guide: 'Requisitos generales de umaip.', prices: { info: 'Consultar.' } },
                    // Ciencias del Mar
                    { id: 'umaip-biologia-marina-lic', facultyId: 'umaip-ciencias-del-mar', universityId: 'umaip', name: 'Biología Marina', level: 'licenciatura', description: 'Estudio de los ecosistemas y organismos marinos.', sedes: ['Campus Principal'], admission_guide: 'Requisitos generales de umaip.', prices: { info: 'Consultar.' } },
                    { id: 'umaip-adm-ecoturismo-lic', facultyId: 'umaip-ciencias-del-mar', universityId: 'umaip', name: 'Administración Marítima en Ecoturismo', level: 'licenciatura', description: 'Gestión de proyectos ecoturísticos con enfoque marino.', sedes: ['Campus Principal'], admission_guide: 'Requisitos generales de umaip.', prices: { info: 'Consultar.' } },
                    // Ingeniería Civil Marítima
                    { id: 'umaip-ing-ambiental-maritima-lic', facultyId: 'umaip-ingenieria-civil-maritima', universityId: 'umaip', name: 'Ingeniería Ambiental Marítima', level: 'licenciatura', description: 'Gestión ambiental en el ámbito marítimo.', sedes: ['Campus Principal'], admission_guide: 'Requisitos generales de umaip.', prices: { info: 'Consultar.' } },
                    { id: 'umaip-ing-construccion-naval-lic', facultyId: 'umaip-ingenieria-civil-maritima', universityId: 'umaip', name: 'Ingeniería en Construcción Naval y Reparación de Buques', level: 'licenciatura', description: 'Diseño y construcción de embarcaciones.', sedes: ['Campus Principal'], admission_guide: 'Requisitos generales de umaip.', prices: { info: 'Consultar.' } },
                    { id: 'umaip-ing-civil-puertos-canales-lic', facultyId: 'umaip-ingenieria-civil-maritima', universityId: 'umaip', name: 'Ingeniería Civil en Puertos y Canales', level: 'licenciatura', description: 'Diseño y construcción de infraestructuras portuarias.', sedes: ['Campus Principal'], admission_guide: 'Requisitos generales de umaip.', prices: { info: 'Consultar.' } },
                    // Programas Técnicos (ITEMAR y otros)
                    { id: 'umaip-marino-polivalente-tec', facultyId: 'umaip-ciencias-nauticas', universityId: 'umaip', name: 'Marino Polivalente (Guardia de Navegación y Máquina)', level: 'tecnico', description: 'Curso técnico bajo estándares STCW para marinos polivalentes.', sedes: ['ITEMAR'], admission_guide: 'Consultar ITEMAR.', prices: { info: 'Consultar.' } },
                    { id: 'umaip-hotel-staff-tec', facultyId: 'umaip-ciencias-nauticas', universityId: 'umaip', name: 'Hotel Staff (Cocina Internacional)', level: 'tecnico', description: 'Formación técnica en cocina internacional para personal de buques.', sedes: ['ITEMAR'], admission_guide: 'Consultar ITEMAR.', prices: { info: 'Consultar.' } },
                    { id: 'umaip-gestion-ambiental-tec', facultyId: 'umaip-ciencias-del-mar', universityId: 'umaip', name: 'Técnico en Gestión Ambiental', level: 'tecnico', description: 'Formación técnica en gestión ambiental.', sedes: ['Campus Principal'], admission_guide: 'Requisitos generales de umaip.', prices: { info: 'Consultar.' } },
                    // Posgrados
                    { id: 'umaip-docencia-superior-esp', facultyId: 'umaip-transporte-maritimo', universityId: 'umaip', name: 'Especialidad en Docencia Superior', level: 'especializacion', description: 'Especialización para la enseñanza a nivel superior.', sedes: ['Campus Principal'], admission_guide: 'Requisitos de posgrado de umaip.', prices: { info: 'Consultar.' } },
                    { id: 'umaip-maestria-educacion-superior-curriculum', facultyId: 'umaip-transporte-maritimo', universityId: 'umaip', name: 'Maestría en Educación Superior con énfasis en Currículum', level: 'maestria', description: 'Posgrado en educación superior y desarrollo curricular.', sedes: ['Campus Principal'], admission_guide: 'Requisitos de posgrado de umaip.', prices: { info: 'Consultar.' } },
                    { id: 'umaip-eficiencia-energetica-maestria', facultyId: 'umaip-ciencias-nauticas', universityId: 'umaip', name: 'Maestría en Ciencia en Eficiencia Energética de las Operaciones Marítimas', level: 'maestria', description: 'Posgrado en eficiencia energética para operaciones marítimas.', sedes: ['Campus Principal'], admission_guide: 'Requisitos de posgrado de umaip.', prices: { info: 'Consultar.' } },
                    { id: 'umaip-negocios-maritimos-maestria', facultyId: 'umaip-transporte-maritimo', universityId: 'umaip', name: 'Maestría en Negocios Marítimos', level: 'maestria', description: 'Posgrado en la administración y gestión de negocios marítimos.', sedes: ['Campus Principal'], admission_guide: 'Requisitos de posgrado de umaip.', prices: { info: 'Consultar.' } },
                    { id: 'umaip-manejo-recursos-marino-costero-master', facultyId: 'umaip-ciencias-del-mar', universityId: 'umaip', name: 'Máster en Manejo de Recursos Marino y Costero', level: 'maestria', description: 'Maestría en gestión de recursos marinos y costeros.', sedes: ['Campus Principal'], admission_guide: 'Requisitos de posgrado de umaip.', prices: { info: 'Consultar.' } },
                    { id: 'umaip-innovation-research-higher-education-master', facultyId: 'umaip-transporte-maritimo', universityId: 'umaip', name: 'Master Degree in Innovation and Research in Higher Education', level: 'maestria', description: 'Maestría en innovación e investigación en educación superior.', sedes: ['Campus Principal'], admission_guide: 'Requisitos de posgrado de umaip.', prices: { info: 'Consultar.' } },
                    { id: 'umaip-bunker-operations-master', facultyId: 'umaip-ciencias-nauticas', universityId: 'umaip', name: 'Master in Bunker Operations', level: 'maestria', description: 'Maestría en operaciones de bunkering (suministro de combustible a buques).', sedes: ['Campus Principal'], admission_guide: 'Requisitos de posgrado de umaip.', prices: { info: 'Consultar.' } },
                ];
            break
             
            case 'utp': 
                universityName = "Universidad Tecnológica de Panamá";
                facultadesToSeed = [ //universityId: 'upa',
                    { id: 'utp-ingenieria-electrica',universityId:'utp', name: 'Facultad de Ingeniería Eléctrica' },
                    { id: 'utp-ingenieria-mecanica',universityId:'utp',  name: 'Facultad de Ingeniería Mecánica' },
                    { id: 'utp-sistemas',universityId:'utp',  name: 'Facultad de Ingeniería de Sistemas Computacionales' },
                    { id: 'utp-ingenieria-civil', universityId:'utp', name: 'Facultad de Ingeniería Civil' },
                    { id: 'utp-ingenieria-industrial', universityId:'utp',  name: 'Facultad de Ingeniería Industrial' },
                    { id: 'utp-ciencias-tecnologia', universityId:'utp', name: 'Facultad de Ciencias y Tecnología' },
                    
                ];
                programasToSeed = [
                    // Facultad de Ingeniería Eléctrica (FIE)
                    { id: 'utp-electrica-biomedica-tec', facultyId: 'utp-ingenieria-electrica', universityId: 'utp', name: 'Técnico en Ingeniería con especialización en Electrónica Biomédica', level: 'tecnico', description: 'Especialización en electrónica aplicada a la biomedicina.', sedes: ['Campus Metropolitano', 'Centro Regional de Chiriquí'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-sistemas-electricos-tec', facultyId: 'utp-ingenieria-electrica', universityId: 'utp', name: 'Técnico en Ingeniería con especialización en Sistemas Eléctricos', level: 'tecnico', description: 'Formación en diseño y mantenimiento de sistemas eléctricos.', sedes: ['Campus Metropolitano', 'Centro Regional de Chiriquí', 'Centro Regional de Colón', 'Centro Regional de Panamá Oeste'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-telecomunicaciones-tec', facultyId: 'utp-ingenieria-electrica', universityId: 'utp', name: 'Técnico en Ingeniería con especialización en Telecomunicaciones', level: 'tecnico', description: 'Especialización en redes y sistemas de telecomunicaciones.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-ing-electrica-lic', facultyId: 'utp-ingenieria-electrica', universityId: 'utp', name: 'Licenciatura en Ingeniería Eléctrica', level: 'licenciatura', description: 'Diseño y desarrollo de sistemas eléctricos.', sedes: ['Campus Metropolitano', 'Centro Regional de Chiriquí'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-ing-electrica-electronica-lic', facultyId: 'utp-ingenieria-electrica', universityId: 'utp', name: 'Licenciatura en Ingeniería Eléctrica y Electrónica', level: 'licenciatura', description: 'Combinación de ingeniería eléctrica y electrónica.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-ing-electromecanica-lic', facultyId: 'utp-ingenieria-electrica',  universityId: 'utp', name: 'Licenciatura en Ingeniería Electromecánica', level: 'licenciatura', description: 'Integración de sistemas eléctricos y mecánicos.', sedes: ['Campus Metropolitano', 'Centro Regional de Chiriquí'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-ing-electronica-telecomunicaciones-lic', facultyId: 'utp-ingenieria-electrica', universityId: 'utp', name: 'Licenciatura en Ingeniería Electrónica y Telecomunicaciones', level: 'licenciatura', description: 'Diseño y gestión de sistemas electrónicos y de comunicación.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-ing-electrica-industrial-maestria', facultyId: 'utp-ingenieria-electrica', universityId: 'utp', name: 'Maestría en Ingeniería Eléctrica Industrial', level: 'maestria', description: 'Posgrado en ingeniería eléctrica aplicada a la industria.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-sistemas-potencia-maestria', facultyId: 'utp-ingenieria-electrica', universityId: 'utp', name: 'Maestría en Sistemas de Potencia', level: 'maestria', description: 'Posgrado en sistemas de potencia eléctrica.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-ing-electronica-control-automatico-maestria', facultyId: 'utp-ingenieria-electrica', universityId: 'utp', name: 'Maestría en Ingeniería Electrónica con Énfasis en Control Automático', level: 'maestria', description: 'Posgrado en electrónica y control automático.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-telecomunicaciones-maestria', facultyId: 'utp-ingenieria-electrica', universityId: 'utp', name: 'Maestría en Telecomunicaciones', level: 'maestria', description: 'Posgrado en sistemas de telecomunicaciones.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-posgrado-electronica-digital', facultyId: 'utp-ingenieria-electrica', universityId: 'utp', name: 'Posgrado en Electrónica Digital', level: 'posgrado', description: 'Posgrado en electrónica digital.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-posgrado-telecomunicaciones', facultyId: 'utp-ingenieria-electrica', universityId: 'utp', name: 'Posgrado en Telecomunicaciones', level: 'posgrado', description: 'Posgrado en telecomunicaciones.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-posgrado-ing-electrica-industrial', facultyId: 'utp-ingenieria-electrica', universityId: 'utp', name: 'Posgrado en Ingeniería Eléctrica Industrial', level: 'posgrado', description: 'Posgrado en ingeniería eléctrica industrial.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    // Facultad de Ingeniería Mecánica (FIM)
                    { id: 'utp-despacho-vuelo-tec', facultyId: 'utp-ingenieria-mecanica', universityId: 'utp', name: 'Técnico en Despacho de Vuelo', level: 'tecnico', description: 'Formación en planificación y despacho de vuelos.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-mantenimiento-aeronaves-motores-fuselajes-tec', facultyId: 'utp-ingenieria-mecanica', universityId: 'utp', name: 'Técnico en Ingeniería de Mantenimiento de Aeronaves con especialización en Motores y Fuselajes', level: 'tecnico', description: 'Mantenimiento de aeronaves, motores y fuselajes.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-ing-aeronautica-lic', facultyId: 'utp-ingenieria-mecanica', universityId: 'utp', name: 'Licenciatura en Ingeniería Aeronáutica', level: 'licenciatura', description: 'Diseño y mantenimiento de aeronaves.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-ing-energia-ambiente-lic', facultyId: 'utp-ingenieria-mecanica', universityId: 'utp', name: 'Licenciatura en Ingeniería de Energía y Ambiente', level: 'licenciatura', description: 'Ingeniería enfocada en energía y sostenibilidad ambiental.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-ing-mantenimiento-lic-fim', facultyId: 'utp-ingenieria-mecanica', universityId: 'utp', name: 'Licenciatura en Ingeniería de Mantenimiento', level: 'licenciatura', description: 'Optimización de procesos de mantenimiento industrial.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-ing-mecanica-lic-fim', facultyId: 'utp-ingenieria-mecanica', universityId: 'utp', name: 'Licenciatura en Ingeniería Mecánica', level: 'licenciatura', description: 'Diseño y análisis de sistemas mecánicos.', sedes: ['Campus Metropolitano', 'Centro Regional de Azuero', 'Centro Regional de Chiriquí', 'Centro Regional de Coclé'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-ing-naval-lic', facultyId: 'utp-ingenieria-mecanica', universityId: 'utp', name: 'Licenciatura en Ingeniería Naval', level: 'licenciatura', description: 'Diseño y construcción de embarcaciones.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-administracion-aviacion-lic', facultyId: 'utp-ingenieria-mecanica', universityId: 'utp', name: 'Administración de Aviación', level: 'licenciatura', description: 'Gestión de operaciones de aviación.', sedes: ['Campus Metropolitano', 'Centro Regional de Chiriquí'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-administracion-aviacion-piloto-lic', facultyId: 'utp-ingenieria-mecanica', universityId: 'utp',  name: 'Administración de Aviación con opción a vuelo (Piloto)', level: 'licenciatura', description: 'Formación en administración y pilotaje de aeronaves.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-mecanica-automotriz-tec', facultyId: 'utp-ingenieria-mecanica', universityId: 'utp', name: 'Mecánica Automotriz', level: 'tecnico', description: 'Diagnóstico y reparación de vehículos automotores.', sedes: ['Campus Metropolitano', 'Centro Regional de Chiriquí'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-mecanica-industrial-tec', facultyId: 'utp-ingenieria-mecanica', universityId: 'utp', name: 'Mecánica Industrial', level: 'tecnico', description: 'Mantenimiento de maquinaria industrial.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-refrigeracion-aire-acondicionado-tec', facultyId: 'utp-ingenieria-mecanica', universityId: 'utp', name: 'Refrigeración y Aire Acondicionado', level: 'tecnico', description: 'Instalación y mantenimiento de sistemas de refrigeración y aire acondicionado.', sedes: ['Campus Metropolitano', 'Centro Regional de Chiriquí', 'Centro Regional de Coclé'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-soldadura-tec', facultyId: 'utp-ingenieria-mecanica', universityId: 'utp', name: 'Soldadura', level: 'tecnico', description: 'Técnicas y procesos de soldadura.', sedes: ['Campus Metropolitano', 'Centro Regional de Colón'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-ing-planta-maestria-fim', facultyId: 'utp-ingenieria-mecanica', universityId: 'utp', name: 'Maestría en Ingeniería de Planta', level: 'maestria', description: 'Posgrado en gestión y diseño de plantas industriales.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-energias-renovables-ambiente-maestria', facultyId: 'utp-ingenieria-mecanica', universityId: 'utp', name: 'Maestría en Energías Renovables y Ambiente', level: 'maestria', description: 'Posgrado en energías renovables y gestión ambiental.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-ciencias-ing-mecanica-maestria', facultyId: 'utp-ingenieria-mecanica', universityId: 'utp', name: 'Maestría en Ciencias de la Ingeniería Mecánica', level: 'maestria', description: 'Posgrado en ciencias de la ingeniería mecánica.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-especialidad-manufactura-automatizacion', facultyId: 'utp-ingenieria-mecanica', universityId: 'utp', name: 'Especialidad en Manufactura y Automatización', level: 'especializacion', description: 'Especialización en procesos de manufactura y automatización.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-especialidad-mantenimiento-industrial', facultyId: 'utp-ingenieria-mecanica', universityId: 'utp', name: 'Especialidad en Mantenimiento Industrial', level: 'especializacion', description: 'Especialización en mantenimiento de sistemas industriales.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-especialidad-adm-energetica-proteccion-ambiental', facultyId: 'utp-ingenieria-mecanica', universityId: 'utp', name: 'Especialidad en Administración Energética y Protección Ambiental', level: 'especializacion', description: 'Especialización en gestión energética y protección ambiental.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    // Facultad de Ingeniería de Sistemas Computacionales (FISC)
                    { id: 'utp-informatica-gestion-empresarial-tec-fisc', facultyId: 'utp-sistemas', universityId: 'utp', name: 'Técnico en Informática para la Gestión Empresarial', level: 'tecnico', description: 'Uso de la informática para la gestión en empresas.', sedes: ['Campus Metropolitano', 'Centros Regionales'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-programacion-analisis-sistemas-tec', facultyId: 'utp-sistemas', universityId: 'utp', name: 'Técnico en Programación y Análisis de Sistemas', level: 'tecnico', description: 'Formación en programación y análisis de sistemas.', sedes: ['Centro Regional de Azuero', 'Centro Regional de Coclé', 'Centro Regional de Veraguas'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-diseno-grafico-digital-tec', facultyId: 'utp-sistemas', universityId: 'utp', name: 'Técnico en Diseño Gráfico Digital', level: 'tecnico', description: 'Especialización en diseño gráfico digital.', sedes: ['Centro Regional de Bocas del Toro'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-ing-sistemas-informacion-lic', facultyId: 'utp-sistemas', universityId: 'utp', name: 'Ingeniería de Sistemas de Información', level: 'licenciatura', description: 'Desarrollo y gestión de sistemas de información.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-ing-sistemas-informacion-gerencial-lic', facultyId: 'utp-sistemas', universityId: 'utp', name: 'Ingeniería de Sistemas de Información Gerencial', level: 'licenciatura', description: 'Ingeniería de sistemas con enfoque gerencial.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-ing-sistemas-computacion-lic', facultyId: 'utp-sistemas', universityId: 'utp', name: 'Ingeniería de Sistemas y Computación', level: 'licenciatura', description: 'Diseño y desarrollo de sistemas computacionales.', sedes: ['Campus Metropolitano', 'Centro Regional de Azuero', 'Centro Regional de Chiriquí', 'Centro Regional de Colón', 'Centro Regional de Veraguas'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-ing-software-lic-fisc', facultyId: 'utp-sistemas', universityId: 'utp', name: 'Ingeniería de Software', level: 'licenciatura', description: 'Diseño, desarrollo y mantenimiento de software.', sedes: ['Campus Metropolitano', 'Centro Regional de Chiriquí'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-ciberseguridad-lic-fisc', facultyId: 'utp-sistemas', universityId: 'utp', name: 'Ciberseguridad', level: 'licenciatura', description: 'Protección de sistemas y redes contra amenazas cibernéticas.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-ciencias-computacion-lic', facultyId: 'utp-sistemas', universityId: 'utp', name: 'Ciencias de la Computación', level: 'licenciatura', description: 'Estudio fundamental de la computación.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-desarrollo-gestion-software-lic', facultyId: 'utp-sistemas', universityId: 'utp', name: 'Desarrollo y Gestión de Software', level: 'licenciatura', description: 'Desarrollo y gestión de proyectos de software.', sedes: ['Campus Metropolitano', 'Centro Regional de Chiriquí'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-informatica-aplicada-educacion-lic', facultyId: 'utp-sistemas', universityId: 'utp', name: 'Informática Aplicada a la Educación', level: 'licenciatura', description: 'Aplicación de la informática en el ámbito educativo.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-redes-informaticas-lic', facultyId: 'utp-sistemas', universityId: 'utp', name: 'Redes Informáticas', level: 'licenciatura', description: 'Diseño e implementación de redes informáticas.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-analitica-datos-maestria', facultyId: 'utp-sistemas', universityId: 'utp', name: 'Maestría en Analítica de Datos', level: 'maestria', description: 'Posgrado en análisis y visualización de datos.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-computacion-movil-maestria', facultyId: 'utp-sistemas', universityId: 'utp', name: 'Maestría en Computación Móvil', level: 'maestria', description: 'Posgrado en desarrollo de aplicaciones y sistemas móviles.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-ciencias-computacion-movil-maestria', facultyId: 'utp-sistemas', universityId: 'utp', name: 'Maestría en Ciencias en Computación Móvil', level: 'maestria', description: 'Posgrado de investigación en computación móvil.', sedes: ['Campus Metropolitano'], admission_guide: '(Actualmente no abierta para aplicaciones).', prices: { info: 'Consultar.' } },
                    { id: 'utp-seguridad-informatica-maestria-fisc', facultyId: 'utp-sistemas', universityId: 'utp', name: 'Maestría en Seguridad Informática', level: 'maestria', description: 'Posgrado en protección de sistemas y datos.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-auditoria-sistemas-maestria', facultyId: 'utp-sistemas', universityId: 'utp', name: 'Maestría en Auditoría de Sistemas y Evaluación de Control Informático', level: 'maestria', description: 'Posgrado en auditoría y control de sistemas informáticos.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-informatica-educativa-maestria', facultyId: 'utp-sistemas', universityId: 'utp', name: 'Maestría en Informática Educativa', level: 'maestria', description: 'Posgrado en aplicación de la informática en la educación.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-ing-software-maestria', facultyId: 'utp-sistemas', universityId: 'utp', name: 'Maestría en Ingeniería de Software', level: 'maestria', description: 'Posgrado en diseño, desarrollo y gestión de software.', sedes: ['Campus Metropolitano', 'Centro Regional de Veraguas'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-redes-comunicacion-datos-maestria', facultyId: 'utp-sistemas', universityId: 'utp', name: 'Maestría en Redes de Comunicación de Datos', level: 'maestria', description: 'Posgrado en diseño e implementación de redes de comunicación de datos.', sedes: ['Campus Metropolitano'], admission_guide: '(Actualmente no abierta para aplicaciones).', prices: { info: 'Consultar.' } },
                    { id: 'utp-ciencias-tecnologia-informacion-comunicacion-maestria', facultyId: 'utp-sistemas', universityId: 'utp', name: 'Maestría en Ciencias de Tecnología de Información y Comunicación', level: 'maestria', description: 'Posgrado en tecnologías de información y comunicación.', sedes: ['Campus Metropolitano'], admission_guide: '(Actualmente no abierta para aplicaciones).', prices: { info: 'Consultar.' } },
                    { id: 'utp-posgrado-auditoria-sistemas', facultyId: 'utp-sistemas', universityId: 'utp', name: 'Posgrado en Auditoría de Sistemas y Evaluación de Control Informático', level: 'posgrado', description: 'Posgrado en auditoría de sistemas informáticos.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-posgrado-informatica-educativa', facultyId: 'utp-sistemas', universityId: 'utp', name: 'Posgrado en Informática Educativa', level: 'posgrado', description: 'Posgrado en informática aplicada a la educación.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-posgrado-ing-software', facultyId: 'utp-sistemas', universityId: 'utp', name: 'Posgrado en Ingeniería de Software', level: 'posgrado', description: 'Posgrado en ingeniería de software.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-posgrado-redes-comunicacion-datos', facultyId: 'utp-sistemas', universityId: 'utp', name: 'Posgrado en Redes de Comunicación de Datos', level: 'posgrado', description: 'Posgrado en redes de comunicación de datos.', sedes: ['Campus Metropolitano'], admission_guide: '(Actualmente no abierta para aplicaciones).', prices: { info: 'Consultar.' } },
                    // Facultad de Ingeniería Civil (FIC)
                    { id: 'utp-ing-adm-proyectos-construccion-lic-fic', facultyId: 'utp-ingenieria-civil', universityId: 'utp', name: 'Ingeniería en Administración de Proyectos de Construcción', level: 'licenciatura', description: 'Gestión de proyectos en el sector de la construcción.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-ing-ambiental-lic-fic', facultyId: 'utp-ingenieria-civil', universityId: 'utp', name: 'Ingeniería Ambiental', level: 'licenciatura', description: 'Diseño de soluciones para problemas ambientales.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-ing-civil-lic-fic', facultyId: 'utp-ingenieria-civil', universityId: 'utp', name: 'Ingeniería Civil', level: 'licenciatura', description: 'Diseño, construcción y mantenimiento de infraestructuras.', sedes: ['Campus Metropolitano', 'Centro Regional de Azuero', 'Centro Regional de Bocas del Toro', 'Centro Regional de Chiriquí', 'Centro Regional de Coclé', 'Centro Regional de Colón', 'Centro Regional de Panamá Oeste', 'Centro Regional de Veraguas'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-ing-geologica-lic-fic', facultyId: 'utp-ingenieria-civil', universityId: 'utp', name: 'Ingeniería Geológica', level: 'licenciatura', description: 'Estudio de la geología aplicada a la ingeniería.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-ing-geomatica-lic', facultyId: 'utp-ingenieria-civil', universityId: 'utp', name: 'Ingeniería Geomática', level: 'licenciatura', description: 'Ciencia de la información espacial.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-ing-maritima-portuaria-lic-fic', facultyId: 'utp-ingenieria-civil', universityId: 'utp', name: 'Ingeniería Marítima Portuaria', level: 'licenciatura', description: 'Especialización en infraestructuras marítimas y portuarias.', sedes: ['Campus Metropolitano', 'Centro Regional de Bocas del Toro'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-dibujo-automatizado-tec', facultyId: 'utp-ingenieria-civil', universityId: 'utp', name: 'Dibujo Automatizado', level: 'tecnico', description: 'Técnicas de dibujo asistido por computadora.', sedes: ['Campus Metropolitano', 'Centro Regional de Chiriquí'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-edificaciones-tec', facultyId: 'utp-ingenieria-civil', universityId: 'utp', name: 'Edificaciones', level: 'tecnico', description: 'Técnicas constructivas en edificaciones.', sedes: ['Campus Metropolitano', 'Centro Regional de Panamá Oeste'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-operaciones-maritimas-portuarias-tec', facultyId: 'utp-ingenieria-civil', universityId: 'utp', name: 'Operaciones Marítimas y Portuarias', level: 'tecnico', description: 'Gestión de operaciones en puertos y terminales marítimas.', sedes: ['Campus Metropolitano', 'Centro Regional de Azuero', 'Centro Regional de Coclé', 'Centro Regional de Colón', 'Centro Regional de Panamá Oeste'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-saneamiento-ambiente-tec', facultyId: 'utp-ingenieria-civil', universityId: 'utp', name: 'Saneamiento y Ambiente', level: 'tecnico', description: 'Gestión de saneamiento y protección ambiental.', sedes: ['Campus Metropolitano', 'Centro Regional de Chiriquí'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-topografia-tec', facultyId: 'utp-ingenieria-civil', universityId: 'utp', name: 'Topografía', level: 'tecnico', description: 'Medición y representación topográfica del terreno.', sedes: ['Campus Metropolitano', 'Centro Regional de Chiriquí', 'Centro Regional de Coclé', 'Centro Regional de Veraguas'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-ciencias-recursos-hidricos-maestria', facultyId: 'utp-ingenieria-civil', universityId: 'utp', name: 'Maestría Científica en Recursos Hídricos', level: 'maestria', description: 'Posgrado de investigación en recursos hídricos.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-cambio-climatico-sostenibilidad-maestria', facultyId: 'utp-ingenieria-civil', universityId: 'utp', name: 'Maestría Científica en Cambio Climático y Sostenibilidad Ambiental', level: 'maestria', description: 'Posgrado de investigación en cambio climático y sostenibilidad.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-ing-transporte-maestria', facultyId: 'utp-ingenieria-civil', universityId: 'utp', name: 'Maestría en Ingeniería de Transporte', level: 'maestria', description: 'Posgrado en planificación y diseño de sistemas de transporte.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-recursos-hidricos-maestria', facultyId: 'utp-ingenieria-civil', universityId: 'utp', name: 'Maestría en Recursos Hídricos', level: 'maestria', description: 'Posgrado en gestión de recursos hídricos.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-adm-proyectos-construccion-maestria', facultyId: 'utp-ingenieria-civil', universityId: 'utp', name: 'Maestría en Administración de Proyectos de Construcción', level: 'maestria', description: 'Posgrado en gestión de proyectos de construcción.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-ing-geotecnica-maestria', facultyId: 'utp-ingenieria-civil', universityId: 'utp', name: 'Maestría en Ingeniería Geotécnica', level: 'maestria', description: 'Posgrado en mecánica de suelos y rocas.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-desarrollo-urbano-regional-maestria', facultyId: 'utp-ingenieria-civil', universityId: 'utp', name: 'Maestría en Desarrollo Urbano y Regional', level: 'maestria', description: 'Posgrado en planificación y desarrollo urbano y regional.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-planificacion-gestion-portuaria-maestria', facultyId: 'utp-ingenieria-civil', universityId: 'utp', name: 'Maestría en Planificación y Gestión Portuaria', level: 'maestria', description: 'Posgrado en planificación y gestión de infraestructuras portuarias.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-sistemas-informacion-geografica-maestria', facultyId: 'utp-ingenieria-civil', universityId: 'utp', name: 'Maestría en Sistemas de Información Geográfica', level: 'maestria', description: 'Posgrado en SIG para el análisis espacial.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-ing-estructural-maestria-fic', facultyId: 'utp-ingenieria-civil', universityId: 'utp', name: 'Maestría en Ingeniería Estructural', level: 'maestria', description: 'Posgrado en análisis y diseño de estructuras.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-ing-ambiental-maestria-fic', facultyId: 'utp-ingenieria-civil', universityId: 'utp', name: 'Maestría en Ingeniería Ambiental', level: 'maestria', description: 'Posgrado en ingeniería ambiental.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    // Facultad de Ingeniería Industrial (FII)
                    { id: 'utp-ing-industrial-lic-fii', facultyId: 'utp-ingenieria-industrial', universityId: 'utp', name: 'Ingeniería Industrial', level: 'licenciatura', description: 'Optimización de procesos y sistemas de producción.', sedes: ['Campus Metropolitano', 'Centro Regional de Azuero', 'Centro Regional de Chiriquí', 'Centro Regional de Coclé', 'Centro Regional de Colón', 'Centro Regional de Panamá Oeste', 'Centro Regional de Veraguas'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-ing-logistica-cadena-suministro-lic', facultyId: 'utp-ingenieria-industrial', universityId: 'utp', name: 'Ingeniería Logística y Cadena de Suministro', level: 'licenciatura', description: 'Gestión eficiente de la cadena de suministro.', sedes: ['Campus Metropolitano', 'Centro Regional de Azuero'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-ing-mecanica-industrial-lic', facultyId: 'utp-ingenieria-industrial', universityId: 'utp', name: 'Ingeniería Mecánica Industrial', level: 'licenciatura', description: 'Diseño y mantenimiento de sistemas mecánicos industriales.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-ing-seguridad-higiene-ocupacional-lic', facultyId: 'utp-ingenieria-industrial', universityId: 'utp', name: 'Ingeniería en Seguridad Industrial e Higiene Ocupacional', level: 'licenciatura', description: 'Prevención de riesgos laborales y promoción de la salud ocupacional.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-gestion-administrativa-lic', facultyId: 'utp-ingenieria-industrial', universityId: 'utp', name: 'Gestión Administrativa', level: 'licenciatura', description: 'Principios y técnicas de gestión administrativa.', sedes: ['Campus Metropolitano', 'Centro Regional de Bocas del Toro', 'Centro Regional de Coclé', 'Centro Regional de Colón'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-gestion-produccion-industrial-lic', facultyId: 'utp-ingenieria-industrial', universityId: 'utp', name: 'Gestión de la Producción Industrial', level: 'licenciatura', description: 'Optimización de procesos de producción industrial.', sedes: ['Campus Metropolitano', 'Centro Regional de Panamá Oeste'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-logistica-transporte-multimodal-lic', facultyId: 'utp-ingenieria-industrial', universityId: 'utp', name: 'Logística y Transporte Multimodal', level: 'licenciatura', description: 'Gestión de operaciones logísticas y transporte.', sedes: ['Campus Metropolitano', 'Centros Regionales'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-mercadeo-negocios-internacionales-lic', facultyId: 'utp-ingenieria-industrial', universityId: 'utp', name: 'Mercadeo y Negocios Internacionales', level: 'licenciatura', description: 'Estrategias de mercadeo y desarrollo de negocios globales.', sedes: ['Campus Metropolitano', 'Centros Regionales'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-recursos-humanos-gestion-productividad-lic', facultyId: 'utp-ingenieria-industrial', universityId: 'utp', name: 'Recursos Humanos y Gestión de la Productividad', level: 'licenciatura', description: 'Gestión del talento humano y mejora de la productividad.', sedes: ['Campus Metropolitano', 'Centro Regional de Chiriquí'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-tec-adm-industrial', facultyId: 'utp-ingenieria-industrial', universityId: 'utp', name: 'Técnico en Administración Industrial', level: 'tecnico', description: 'Formación técnica en administración industrial.', sedes: ['Centro Regional de Coclé'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-maestria-adm-negocios-finanzas', facultyId: 'utp-ingenieria-industrial', universityId: 'utp', name: 'Maestría en Administración de Negocios con Énfasis en Finanzas', level: 'maestria', description: 'Posgrado en administración de negocios con enfoque financiero.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-maestria-direccion-operaciones-logistica', facultyId: 'utp-ingenieria-industrial', universityId: 'utp', name: 'Maestría en Dirección de Operaciones y Logística', level: 'maestria', description: 'Posgrado en dirección de operaciones y logística.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-maestria-ing-industrial-fii', facultyId: 'utp-ingenieria-industrial', universityId: 'utp', name: 'Maestría en Ingeniería Industrial', level: 'maestria', description: 'Posgrado en ingeniería industrial.', sedes: ['Campus Metropolitano', 'Centro Regional de Bocas del Toro', 'Centro Regional de Chiriquí', 'Centro Regional de Panamá Oeste', 'Centro Regional de Veraguas'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-maestria-sistemas-gestion-calidad', facultyId: 'utp-ingenieria-industrial', universityId: 'utp', name: 'Maestría en Sistemas de Gestión de la Calidad', level: 'maestria', description: 'Posgrado en implementación y gestión de sistemas de calidad.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-maestria-gestion-integrada-calidad-ambiente-seguridad', facultyId: 'utp-ingenieria-industrial', universityId: 'utp', name: 'Maestría en Gestión Integrada de la Calidad, Ambiente y Seguridad', level: 'maestria', description: 'Posgrado en gestión integrada de QAS.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-doctorado-administracion-industrial', facultyId: 'utp-ingenieria-industrial', universityId: 'utp', name: 'Doctorado en Administración Industrial', level: 'doctorado', description: 'Doctorado en administración industrial.', sedes: ['Campus Metropolitano Dr. Víctor Levi Sasso'], admission_guide: 'Requisitos de doctorado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-posgrado-alta-gerencia', facultyId: 'utp-ingenieria-industrial', universityId: 'utp', name: 'Postgrado en Alta Gerencia', level: 'posgrado', description: 'Posgrado en alta gerencia.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-posgrado-formulacion-evaluacion-gestion-proyectos-inversion', facultyId: 'utp-ingenieria-industrial', universityId: 'utp', name: 'Postgrado en Formulación, Evaluación y Gestión de Proyectos de Inversión', level: 'posgrado', description: 'Posgrado en gestión de proyectos de inversión.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-posgrado-gerencia-agroindustrial', facultyId: 'utp-ingenieria-industrial', universityId: 'utp', name: 'Postgrado en Gerencia Agroindustrial', level: 'posgrado', description: 'Posgrado en gerencia de agronegocios.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    // Facultad de Ciencias y Tecnología (FCT)
                    { id: 'utp-ing-alimentos-lic', facultyId: 'utp-ciencias-tecnologia', universityId: 'utp', name: 'Ingeniería en Alimentos', level: 'licenciatura', description: 'Diseño y optimización de procesos en la industria alimentaria.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-ing-forestal-lic', facultyId: 'utp-ciencias-tecnologia', universityId: 'utp', name: 'Ingeniería Forestal', level: 'licenciatura', description: 'Gestión y conservación de recursos forestales.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-comunicacion-ejecutiva-bilingue-lic', facultyId: 'utp-ciencias-tecnologia', universityId: 'utp', name: 'Comunicación Ejecutiva Bilingüe', level: 'licenciatura', description: 'Formación en comunicación para el ámbito ejecutivo y bilingüe.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos generales de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-maestria-ciencias-materiales', facultyId: 'utp-ciencias-tecnologia', universityId: 'utp', name: 'Maestría en Ciencias de los Materiales', level: 'maestria', description: 'Posgrado en ciencia e ingeniería de materiales.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-maestria-docencia-superior-fct', facultyId: 'utp-ciencias-tecnologia', universityId: 'utp', name: 'Maestría en Docencia Superior', level: 'maestria', description: 'Posgrado en pedagogía para la educación superior.', sedes: ['Campus Metropolitano', 'Centro Regional de Bocas del Toro', 'Centro Regional de Chiriquí', 'Centro Regional de Colón', 'Centro Regional de Panamá Oeste', 'Centro Regional de Veraguas'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    { id: 'utp-maestria-indagacion-ensenanza-ciencias', facultyId: 'utp-ciencias-tecnologia', universityId: 'utp', name: 'Maestría en Indagación como Estrategia en la Enseñanza de Ciencias', level: 'maestria', description: 'Posgrado en estrategias de enseñanza de ciencias basadas en la indagación.', sedes: ['Campus Metropolitano'], admission_guide: 'Requisitos de posgrado de la UTP.', prices: { info: 'Consultar.' } },
                    // Programas específicos de Centros Regionales de UTP (Maestrías y Posgrados)
                    { id: 'utp-az-ing-industrial-logistica-maestria', facultyId: 'utp-ingenieria-industrial', universityId: 'utp', name: 'Maestría en Ingeniería Industrial con Énfasis en Logística y Cadena de Suministro', level: 'maestria', description: 'Posgrado en ingeniería industrial con enfoque en logística.', sedes: ['Centro Regional de Azuero'], admission_guide: 'Confirmar con el Centro Regional.', prices: { info: 'Consultar.' } },
                    
                    { id: 'utp-bdt-ing-sistemas-redes-telecomunicaciones-maestria', 
                      facultyId: 'utp-sistemas', universityId: 'utp', 
                      name: 'Maestría en Ingeniería de Sistemas con Énfasis en Redes y Telecomunicaciones', 
                      level: 'maestria', description: 'Posgrado en ingeniería de sistemas con énfasis en redes y telecomunicaciones.', 
                      sedes: ['Centro Regional de Bocas del Toro'], admission_guide: 'Requisitos de posgrado de la UTP.', 
                      prices: { info: 'Consultar.' } },
                ];

              break

            case 'uap': 
                  universityName = "universidad Autonoma de los Pueblos Indigenas"
                 facultadesToSeed= [
                    { id: 'uap-educacion', universityId: 'uap', name: 'Facultad de Educación' },
                    { id: 'uap-turismo', universityId: 'uap', name: 'Facultad de Turismo y Patrimonio' },
                 ];

                  programasToSeed= [
                    {
                      id: 'uap-educacion-intercultural', facultyId: 'uap-educacion', universityId: 'uap', name: 'Licenciatura en Educación Intercultural Bilingüe', level: 'Licenciatura',
                      description: 'Programa enfocado en la educación desde una perspectiva intercultural bilingüe, para formar profesionales que preserven y promuevan las lenguas y culturas indígenas.',
                     // skills: 'Pedagogía intercultural, didáctica de lenguas indígenas, gestión educativa, investigación etnográfica.',
                     // profile: 'Docente y gestor educativo capacitado para trabajar en contextos interculturales bilingües.',
                      //field: 'Escuelas en comunidades indígenas, organizaciones no gubernamentales, instituciones educativas y culturales.',
                     // duration: 'Consultar con la universidad.',
                      sedes: ['Llano Tugrí'],
                      admission_guide: 'Formulario de registro, copia de diploma y créditos de bachiller, cédula, pago de B/. 35.00 de admisión.',
                      prices: { info: 'Consultar con la institución.' }
                  },
                  {
                      id: 'uap-etnoturismo', facultyId: 'uap-turismo', universityId: 'uap', name: 'Licenciatura en Etnoturismo Histórico y Territorial', level: 'Licenciatura',
                      description: 'Formación en turismo que valora el patrimonio cultural y territorial indígena, promoviendo un turismo sostenible y respetuoso.',
                    //skills: 'Gestión turística, interpretación cultural, desarrollo comunitario, planificación de rutas etnoturísticas.',
                    // profile: 'Profesional en turismo con enfoque en la cultura y patrimonio indígena, capaz de desarrollar proyectos sostenibles.',
                    //  field: 'Comunidades indígenas, agencias de turismo sostenible, organizaciones culturales, instituciones gubernamentales.',
                    //  duration: 'Consultar con la universidad.',
                      sedes: ['Llano Tugrí'],
                      admission_guide: 'Formulario de registro, copia de diploma y créditos de bachiller, cédula, pago de B/. 35.00 de admisión.',
                      prices: { info: 'Consultar con la institución.' }
                  }
                ];

              case 'unachi':
                 universityName = "Universidad Autónoma de Chiriquí";
                facultadesToSeed = [
                    { id: 'unachi-adm-empresas-contabilidad', universityId: 'unachi', name: 'Facultad de Administración de Empresas y Contabilidad' },
                    { id: 'unachi-adm-publica', universityId: 'unachi', name: 'Facultad de Administración Pública' },
                    { id: 'unachi-arquitectura', universityId: 'unachi', name: 'Facultad de Arquitectura' },
                    { id: 'unachi-ciencias-educacion', universityId: 'unachi', name: 'Facultad de Ciencias de la Educación' },
                    { id: 'unachi-comunicacion-social', universityId: 'unachi', name: 'Facultad de Comunicación Social' },
                    { id: 'unachi-derecho-ciencias-politicas', universityId: 'unachi', name: 'Facultad de Derecho y ciencias Politicas'},
                    ];

                 programasToSeed = [
                      
                      // Facultad de Administración de Empresas y Contabilidad
                      {
                          id: 'unachi-adm-empresas-mercadotecnia-lic',
                          facultyId: 'unachi-adm-empresas-contabilidad',
                          universityId: 'unachi',
                          name: 'Licenciatura en Administración de Empresas con énfasis en Mercadotecnia',
                          level: 'licenciatura',
                          description: 'Prepara profesionales para gestionar empresas, tanto a nivel nacional como internacional, con la capacidad de responder eficazmente a las exigencias de mercados dinámicos y en constante cambio. Los egresados pueden desempeñarse como empresarios en diversos sectores de la economía. Duración: 4 años en jornada diurna y 5 años en jornada nocturna.',
                          sedes: ['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Consultar por tarifas adicionales específicas de la facultad.',
                          prices: { info: 'No disponible.' }
                      },
                      {
                          id: 'unachi-adm-empresas-finanzas-negocios-internacionales-lic',
                          facultyId: 'unachi-adm-empresas-contabilidad',
                          universityId: 'unachi',
                          name: 'Licenciatura en Administración de Empresas con énfasis en Finanzas y Negocios Internacionales',
                          level: 'licenciatura',
                          description: 'Se enfoca en la evaluación financiera de empresas, proyectos y alternativas de financiamiento, aplicando criterios y técnicas financieras en contextos nacionales e internacionales. El objetivo es optimizar los riesgos financieros y formar especialistas en Gerencia de Negocios Internacionales. Duración: 4 años en jornada diurna y 5 años en jornada nocturna.',
                          sedes: ['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Consultar por tarifas adicionales específicas de la facultad.',
                          prices: { info: 'No disponible.' }
                      },
                      {
                          id: 'unachi-adm-empresas-adm-personal-lic',
                          facultyId: 'unachi-adm-empresas-contabilidad',
                          universityId: 'unachi',
                          name: 'Licenciatura en Administración de Empresas con énfasis en Administración de Personal',
                          level: 'licenciatura',
                          description: 'Prepara a profesionales para ocupar cargos ejecutivos en el ámbito empresarial, con un fuerte énfasis en la gestión de recursos humanos. Los egresados desarrollan capacidad para planificar, estructurar, dirigir y controlar actividades de gestión humana y desarrollo organizacional. Pueden ofrecer asesoría y consultoría en gestión humana y procesos de cambio planificado. Duración: 4 años en jornada diurna y 5 años en jornada nocturna.',
                          sedes:['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Consultar por tarifas adicionales específicas de la facultad.',
                          prices: { info: 'No disponible.' }
                      },
                      {
                          id: 'unachi-contabilidad-lic',
                          facultyId: 'unachi-adm-empresas-contabilidad',
                          universityId: 'unachi',
                          name: 'Licenciatura en Contabilidad',
                          level: 'licenciatura',
                          description: 'Tiene como propósito formar profesionales calificados en el ámbito contable y de auditoría que unida a la formación humanística integral garantiza un desempeño eficiente en las organizaciones. Mercado Laboral: Contador y auditor independiente, empresas de consultoría, empresas privadas (banca, industria, comercio, servicio). Duración: 4 años en jornada diurna y 5 años en jornada nocturna.',
                          sedes:['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Consultar por tarifas adicionales específicas de la facultad.',
                          prices: { info: 'No disponible.' }
                      },
                      {
                          id: 'unachi-contabilidad-finanzas-empresariales-lic',
                          facultyId: 'unachi-adm-empresas-contabilidad',
                          universityId: 'unachi',
                          name: 'Licenciatura en Contabilidad y Finanzas Empresariales',
                          level: 'licenciatura',
                          description: 'Esta carrera se orienta a la preparación de futuros profesionales de la contabilidad, altamente competitivos con amplia especialización en el uso de las tecnologías aplicadas al área contable. Los egresados operan e interpretan los sistemas de contabilidad computarizada y formulan, analizan e interpretan los Estados Financieros de las organizaciones. Duración: 4 años en jornada diurna y 5 años en jornada nocturna.',
                          sedes: ['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Consultar por tarifas adicionales específicas de la facultad.',
                          prices: { info: 'No disponible.' }
                      },
                      {
                          id: 'unachi-contabilidad-tec',
                          facultyId: 'unachi-adm-empresas-contabilidad',
                          universityId: 'unachi',
                          name: 'Técnico en Contabilidad',
                          level: 'tecnico',
                          description: 'No se encontró una descripción detallada para este programa.',
                          sedes:['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Consultar por tarifas adicionales específicas de la facultad.',
                          prices: { info: 'No disponible.' }
                      },
                      {
                          id: 'unachi-adm-empresas-agro-industriales-tec',
                          facultyId: 'unachi-adm-empresas-contabilidad',
                          universityId: 'unachi',
                          name: 'Técnico en Administración de Empresas Agro Industriales',
                          level: 'tecnico',
                          description: 'No se encontró una descripción detallada para este programa.',
                          sedes: ['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Consultar por tarifas adicionales específicas de la facultad.',
                          prices: { info: 'No disponible.' }
                      },

                      // Facultad de Administración Pública
                      {
                          id: 'unachi-secretariado-ejecutivo-lic',
                          facultyId: 'unachi-adm-publica',
                          universityId: 'unachi',
                          name: 'Licenciatura en Secretariado Ejecutivo',
                          level: 'licenciatura',
                          description: 'No se encontró una descripción detallada para este programa.',
                          sedes: ['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Consultar por tarifas adicionales específicas de la facultad.',
                          prices: { info: 'No disponible.' }
                      },
                      {
                          id: 'unachi-adm-gestion-recursos-humanos-lic',
                          facultyId: 'unachi-adm-publica',
                          universityId: 'unachi',
                          name: 'Licenciatura en Administración con énfasis en Gestión de Recursos Humanos',
                          level: 'licenciatura',
                          description: 'No se encontró una descripción detallada para este programa.',
                          sedes: ['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Consultar por tarifas adicionales específicas de la facultad.',
                          prices: { info: 'No disponible.' }
                      },
                      {
                          id: 'unachi-adm-publica-gerencia-estrategica-lic',
                          facultyId: 'unachi-adm-publica',
                          universityId: 'unachi',
                          name: 'Licenciatura en Administración Pública con énfasis en Gerencia Estratégica',
                          level: 'licenciatura',
                          description: 'El plan de estudios detallado abarca cuatro años, incluyendo asignaturas como Teoría de la Administración Pública, Contabilidad Fundamental, Economía, Métodos y Técnicas de Investigación, Administración de Recursos Humanos, Proceso Presupuestario, Relaciones Internacionales, Gobernabilidad y Gestión Pública, Desarrollo Organizacional, y Gerencia Estratégica.',
                          sedes: ['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Consultar por tarifas adicionales específicas de la facultad.',
                          prices: { info: 'No disponible.' }
                      },
                      {
                          id: 'unachi-politica-internacional-lic',
                          facultyId: 'unachi-adm-publica',
                          universityId: 'unachi',
                          name: 'Licenciatura en Política Internacional',
                          level: 'licenciatura',
                          description: 'No se encontró una descripción detallada para este programa.',
                          sedes: ['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Consultar por tarifas adicionales específicas de la facultad.',
                          prices: { info: 'No disponible.' }
                      },
                      {
                          id: 'unachi-trabajo-social-lic',
                          facultyId: 'unachi-adm-publica',
                          universityId: 'unachi',
                          name: 'Licenciatura en Trabajo Social',
                          level: 'licenciatura',
                          description: 'No se encontró una descripción detallada para este programa.',
                          sedes: ['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Consultar por tarifas adicionales específicas de la facultad.',
                          prices: { info: 'No disponible.' }
                      },
                      {
                          id: 'unachi-recursos-humanos-tec',
                          facultyId: 'unachi-adm-publica',
                          universityId: 'unachi',
                          name: 'Técnico en Recursos Humanos',
                          level: 'tecnico',
                          description: 'No se encontró una descripción detallada para este programa.',
                          sedes: ['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Consultar por tarifas adicionales específicas de la facultad.',
                          prices: { info: 'No disponible.' }
                      },
                      {
                          id: 'unachi-secretariado-ejecutivo-tec',
                          facultyId: 'unachi-adm-publica',
                          universityId: 'unachi',
                          name: 'Técnico en Secretariado Ejecutivo',
                          level: 'tecnico',
                          description: 'No se encontró una descripción detallada para este programa.',
                          sedes:['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Consultar por tarifas adicionales específicas de la facultad.',
                          prices: { info: 'No disponible.' }
                      },

                      // Facultad de Arquitectura
                      {
                          id: 'unachi-arquitectura-lic',
                          facultyId: 'unachi-arquitectura',
                          universityId: 'unachi',
                          name: 'Licenciatura en Arquitectura',
                          level: 'licenciatura',
                          description: 'Duración: 8 semestres y 4 veranos en jornada diurna, o 10 semestres y 4 veranos en jornada nocturna, totalizando 198 créditos. Plan de Estudio: Incluye cursos de Diseño Arquitectónico, Teorías de la Arquitectura, Geometría Descriptiva, Dibujo Arquitectónico, Análisis de Sistemas Estructurales, Topografía, Gestión Urbana, Nuevas Tecnologías y Equipos de la Construcción. Perfil del Egresado (referencial de una universidad similar): Habilidades en diseño arquitectónico, identificación de materiales y sistemas constructivos, representación gráfica y tridimensional, propuesta de instalaciones, programación, presupuestación y administración de recursos, aplicación de principios de sostenibilidad, y análisis urbano-arquitectónico. Requisitos de Admisión: Formulario de admisión, diploma de Bachiller (original y copia), créditos de estudios secundarios y universitarios (original y copia), dos fotografías tamaño carné, copia de cédula, certificado de buena salud, y obtener el puntaje requerido en el examen de admisión (los 100 puntajes más altos).',
                          sedes: ['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Requisitos específicos de admisión para la carrera de Arquitectura (examen de admisión con selección de los 100 puntajes más altos).',
                          prices: { info: 'No disponible.' }
                      },

                      // Facultad de Ciencias de la Educación
                      {
                          id: 'unachi-educacion-lic',
                          facultyId: 'unachi-ciencias-educacion',
                          universityId: 'unachi',
                          name: 'Licenciatura en Educación',
                          level: 'licenciatura',
                          description: 'No se encontró una descripción detallada para este programa.',
                          sedes: ['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Consultar por tarifas adicionales específicas de la facultad.',
                          prices: { info: 'No disponible.' }
                      },
                      {
                          id: 'unachi-educacion-pre-escolar-lic',
                          facultyId: 'unachi-ciencias-educacion',
                          universityId: 'unachi',
                          name: 'Licenciatura en Educación Pre-Escolar',
                          level: 'licenciatura',
                          description: 'No se encontró una descripción detallada para este programa.',
                          sedes: ['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Consultar por tarifas adicionales específicas de la facultad.',
                          prices: { info: 'No disponible.' }
                      },
                      {
                          id: 'unachi-educacion-primaria-lic',
                          facultyId: 'unachi-ciencias-educacion',
                          universityId: 'unachi',
                          name: 'Licenciatura en Educación Primaria',
                          level: 'licenciatura',
                          description: 'El plan de estudio incluye Introducción a la Ciencia de la Educación, Informática Educativa, Expresión Oral y Escrita, Teorías del Aprendizaje, Crecimiento y Desarrollo del Niño, Primeros Auxilios, Geografía e Historia de Panamá, Estadística Educativa, Taller de Recursos Didácticos, Matemáticas y Ciencias Naturales para Educación Primaria, Didáctica de la Lectura y Escritura, Evaluación Escolar, Estrategias de Aprendizaje, y Planificación Didáctica por Competencias.',
                          sedes: ['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Consultar por tarifas adicionales específicas de la facultad.',
                          prices: { info: 'No disponible.' }
                      },
                      {
                          id: 'unachi-educacion-adm-educativa-lic',
                          facultyId: 'unachi-ciencias-educacion',
                          universityId: 'unachi',
                          name: 'Licenciatura en Educación con énfasis en Administración Educativa',
                          level: 'licenciatura',
                          description: 'No se encontró una descripción detallada para este programa.',
                          sedes: ['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Consultar por tarifas adicionales específicas de la facultad.',
                          prices: { info: 'No disponible.' }
                      },
                      {
                          id: 'unachi-profesorado-educacion-media',
                          facultyId: 'unachi-ciencias-educacion',
                          universityId: 'unachi',
                          name: 'Profesorado en Educación Media',
                          level: 'profesorado',
                          description: 'No se encontró una descripción detallada para este programa.',
                          sedes: ['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Consultar por tarifas adicionales específicas de la facultad.',
                          prices: { info: 'No disponible.' }
                      },
                      {
                          id: 'unachi-profesorado-educacion-media-diversificada',
                          facultyId: 'unachi-ciencias-educacion',
                          universityId: 'unachi',
                          name: 'Profesorado en Educación Media Diversificada',
                          level: 'profesorado',
                          description: 'No se encontró una descripción detallada para este programa.',
                          sedes: ['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Consultar por tarifas adicionales específicas de la facultad.',
                          prices: { info: 'No disponible.' }
                      },
                      {
                          id: 'unachi-didactica-general-tec',
                          facultyId: 'unachi-ciencias-educacion',
                          universityId: 'unachi',
                          name: 'Técnico en Didáctica General',
                          level: 'tecnico',
                          description: 'No se encontró una descripción detallada para este programa.',
                          sedes: ['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Consultar por tarifas adicionales específicas de la facultad.',
                          prices: { info: 'No disponible.' }
                      },
                      {
                          id: 'unachi-profesorado-educacion-pre-escolar',
                          facultyId: 'unachi-ciencias-educacion',
                          universityId: 'unachi',
                          name: 'Profesorado en Educación Pre-escolar',
                          level: 'profesorado',
                          description: 'No se encontró una descripción detallada para este programa.',
                          sedes: ['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Consultar por tarifas adicionales específicas de la facultad.',
                          prices: { info: 'No disponible.' }
                      },
                      {
                          id: 'unachi-educacion-primaria-multigrado-tec',
                          facultyId: 'unachi-ciencias-educacion',
                          universityId: 'unachi',
                          name: 'Técnico Universitario en Educación Primaria Multigrado',
                          level: 'tecnico',
                          description: 'No se encontró una descripción detallada para este programa.',
                          sedes: ['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Consultar por tarifas adicionales específicas de la facultad.',
                          prices: { info: 'No disponible.' }
                      },

                      // Facultad de Comunicación Social
                      {
                          id: 'unachi-periodismo-direccion-medios-lic',
                          facultyId: 'unachi-comunicacion-social',
                          universityId: 'unachi',
                          name: 'Licenciatura en Periodismo con especialización en Dirección de Medios',
                          level: 'licenciatura',
                          description: 'Los egresados estarán capacitados en la búsqueda y redacción de noticias, con un perfil orientado a la dirección de medios informativos. Duración: 4 años en jornada diurna y 5 años en jornada nocturna.',
                          sedes: ['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Consultar por tarifas adicionales específicas de la facultad.',
                          prices: { info: 'No disponible.' }
                      },
                      {
                          id: 'unachi-publicidad-lic',
                          facultyId: 'unachi-comunicacion-social',
                          universityId: 'unachi',
                          name: 'Licenciatura en Publicidad',
                          level: 'licenciatura',
                          description: 'Se enfoca en desarrollar la creatividad para la comunicación no personal pagada, con el fin de promocionar ideas, bienes o servicios. Los egresados producen material gráfico y audiovisual, redactan textos y guiones, y evalúan encuestas. Duración: 4 años en jornada diurna y 5 años en jornada nocturna.',
                          sedes: ['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Consultar por tarifas adicionales específicas de la facultad.',
                          prices: { info: 'No disponible.' }
                      },
                      {
                          id: 'unachi-comunicacion-tecnologia-audiovisual-lic',
                          facultyId: 'unachi-comunicacion-social',
                          universityId: 'unachi',
                          name: 'Licenciatura en Comunicación y Tecnología Audiovisual',
                          level: 'licenciatura',
                          description: 'Prepara profesionales en medios audiovisuales, incluyendo técnicas de manejo de voz, fotografía digital, producción, edición para radio y televisión, producción de eventos, y nuevas tecnologías audiovisuales. Duración: 4 años en jornada diurna y 5 años en jornada nocturna.',
                          sedes: ['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Consultar por tarifas adicionales específicas de la facultad.',
                          prices: { info: 'No disponible.' }
                      },
                      {
                          id: 'unachi-relaciones-publicas-imagen-corporativa-lic',
                          facultyId: 'unachi-comunicacion-social',
                          universityId: 'unachi',
                          name: 'Licenciatura en Relaciones Públicas con especialización en Imagen Corporativa',
                          level: 'licenciatura',
                          description: 'Prepara profesionales para la gestión estratégica de procesos de comunicación e interacción con los públicos de organizaciones, tanto públicas como privadas, con un enfoque en la imagen corporativa. Duración: 4 años en jornada diurna y 5 años en jornada nocturna.',
                          sedes: ['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Consultar por tarifas adicionales específicas de la facultad.',
                          prices: { info: 'No disponible.' }
                      },
                      {
                          id: 'unachi-radiodifusion-tec',
                          facultyId: 'unachi-comunicacion-social',
                          universityId: 'unachi',
                          name: 'Técnico en Radiodifusión',
                          level: 'tecnico',
                          description: 'No se encontró una descripción detallada para este programa.',
                          sedes: ['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Consultar por tarifas adicionales específicas de la facultad.',
                          prices: { info: 'No disponible.' }
                      },

                      // Facultad de Derecho y Ciencias Políticas
                      {
                          id: 'unachi-derecho-ciencias-politicas-lic',
                          facultyId: 'unachi-derecho-ciencias-politicas',
                          universityId: 'unachi',
                          name: 'Licenciatura en Derecho y Ciencias Políticas',
                          level: 'licenciatura',
                          description: 'Posee una sólida formación académica para la práctica profesional del derecho, conocimiento del marco legal vigente, capacidad de argumentación e interpretación jurídica, y habilidad para confrontar conflictos y generar soluciones. Mercado Laboral: Rama judicial, asesores universitarios, consultores en investigaciones jurídicas. Duración: 4 años en jornadas diurna, vespertina y nocturna.',
                          sedes:['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Consultar por tarifas adicionales específicas de la facultad.',
                          prices: { info: 'No disponible.' }
                      },
                      {
                          id: 'unachi-investigacion-criminalistica-seguridad-lic',
                          facultyId: 'unachi-derecho-ciencias-politicas',
                          universityId: 'unachi',
                          name: 'Licenciatura en Investigación Criminalística y Seguridad',
                          level: 'licenciatura',
                          description: 'No se encontró una descripción detallada para este programa.',
                          sedes: ['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Consultar por tarifas adicionales específicas de la facultad.',
                          prices: { info: 'No disponible.' }
                      },
                      {
                          id: 'unachi-ciencias-politicas-estrategias-marketing-politico-lic',
                          facultyId: 'unachi-derecho-ciencias-politicas',
                          universityId: 'unachi',
                          name: 'Licenciatura en Ciencias Políticas con énfasis en Estrategias y Marketing Político',
                          level: 'licenciatura',
                          description: 'Posee una sólida formación académica para la práctica profesional del derecho, conocimiento del marco legal vigente, capacidad de argumentación e interpretación jurídica, y habilidad para confrontar conflictos y generar soluciones. Mercado Laboral: Rama judicial, asesores universitarios, consultores en investigaciones jurídicas. Duración: 4 años en jornadas diurna, vespertina y nocturna.',
                          sedes: ['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Consultar por tarifas adicionales específicas de la facultad.',
                          prices: { info: 'No disponible.' }
                      },
                      {
                          id: 'unachi-ciencias-politicas-democracia-participativa-lic',
                          facultyId: 'unachi-derecho-ciencias-politicas',
                          universityId: 'unachi',
                          name: 'Licenciatura en Ciencias Políticas con énfasis en Democracia Participativa',
                          level: 'licenciatura',
                          description: 'Posee una sólida formación académica para la práctica profesional del derecho, conocimiento del marco legal vigente, capacidad de argumentación e interpretación jurídica, y habilidad para confrontar conflictos y generar soluciones. Mercado Laboral: Rama judicial, asesores universitarios, consultores en investigaciones jurídicas. Duración: 4 años en jornadas diurna, vespertina y nocturna.',
                          sedes: ['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Consultar por tarifas adicionales específicas de la facultad.',
                          prices: { info: 'No disponible.' }
                      },
                      {
                          id: 'unachi-registros-publicos-lic',
                          facultyId: 'unachi-derecho-ciencias-politicas',
                          universityId: 'unachi',
                          name: 'Licenciatura en Registros Públicos',
                          level: 'licenciatura',
                          description: 'Posee una sólida formación académica para la práctica profesional del derecho, conocimiento del marco legal vigente, capacidad de argumentación e interpretación jurídica, y habilidad para confrontar conflictos y generar soluciones. Mercado Laboral: Rama judicial, asesores universitarios, consultores en investigaciones jurídicas. Duración: 4 años en jornada diurna.',
                          sedes: ['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Consultar por tarifas adicionales específicas de la facultad.',
                          prices: { info: 'No disponible.' }
                      },
                      {
                          id: 'unachi-registro-publico-tec',
                          facultyId: 'unachi-derecho-ciencias-politicas',
                          universityId: 'unachi',
                          name: 'Técnico en Registro Público',
                          level: 'tecnico',
                          description: 'Posee una sólida formación académica para la práctica profesional del derecho, conocimiento del marco legal vigente, capacidad de argumentación e interpretación jurídica, y habilidad para confrontar conflictos y generar soluciones. Mercado Laboral: Rama judicial, asesores universitarios, consultores en investigaciones jurídicas. Duración: 2 años en jornadas diurna, vespertina y nocturna.',
                          sedes: ['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Consultar por tarifas adicionales específicas de la facultad.',
                          prices: { info: 'No disponible.' }
                      },
                      {
                          id: 'unachi-ciencias-politicas-tec',
                          facultyId: 'unachi-derecho-ciencias-politicas',
                          universityId: 'unachi',
                          name: 'Técnico en Ciencias Políticas',
                          level: 'tecnico',
                          description: 'Posee una sólida formación académica para la práctica profesional del derecho, conocimiento del marco legal vigente, capacidad de argumentación e interpretación jurídica, y habilidad para confrontar conflictos y generar soluciones. Mercado Laboral: Rama judicial, asesores universitarios, consultores en investigaciones jurídicas. Duración: 3 años en jornadas diurna, vespertina y nocturna.',
                          sedes: ['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Consultar por tarifas adicionales específicas de la facultad.',
                          prices: { info: 'No disponible.' }
                      },

                      // Facultad de Economía
                      {
                          id: 'unachi-economia-lic',
                          facultyId: 'unachi-economia',
                          universityId: 'unachi',
                          name: 'Licenciatura en Economía',
                          level: 'licenciatura',
                          description: 'No se encontró una descripción detallada para este programa.',
                          sedes: ['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Consultar por tarifas adicionales específicas de la facultad.',
                          prices: { info: 'No disponible.' }
                      },
                      {
                          id: 'unachi-banca-finanzas-lic',
                          facultyId: 'unachi-economia',
                          universityId: 'unachi',
                          name: 'Licenciatura en Banca y Finanzas',
                          level: 'licenciatura',
                          description: 'No se encontró una descripción detallada para este programa.',
                          sedes: ['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Consultar por tarifas adicionales específicas de la facultad.',
                          prices: { info: 'No disponible.' }
                      },
                      {
                          id: 'unachi-gestion-tecnologias-informacion-lic',
                          facultyId: 'unachi-economia',
                          universityId: 'unachi',
                          name: 'Licenciatura en Gestión de Tecnologías de la Información',
                          level: 'licenciatura',
                          description: 'No se encontró una descripción detallada para este programa.',
                          sedes:['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general B/. 33.50. Consultar por tarifas adicionales específicas de la facultad.',
                          prices: { info: 'No disponible.' }
                      },
                      {
                          id: 'unachi-logistica-integral-negocios-lic',
                          facultyId: 'unachi-economia',
                          universityId: 'unachi',
                          name: 'Licenciatura en Logística Integral de Negocios',
                          level: 'licenciatura',
                          description: 'No se encontró una descripción detallada para este programa.',
                          sedes: ['Ciudad Universitaria - El Cabrero'],
                          admission_guide: 'Costo de admisión general',}
                      ];
                    break
              case 'columbus':
                universityName = "Columbus University"
                facultadesToSeed = [
                  { id: 'columbus-administracion', universityId: 'columbus', name: 'Administración' },
                  { id: 'columbus-negocios', universityId: 'columbus', name: 'Negocios' },
                  { id: 'columbus-ecologia', universityId: 'columbus', name: 'Ecología' },
                  { id: 'columbus-economia', universityId: 'columbus', name: 'Economía' },
                  { id: 'columbus-educacion', universityId: 'columbus', name: 'Educación' },
                  { id: 'columbus-humanidades', universityId: 'columbus', name: 'Humanidades' },
                  { id: 'columbus-ti', universityId: 'columbus', name: 'Tecnologías de la Información' },
                  { id: 'columbus-derecho-jurisprudencia', universityId: 'columbus', name: 'Derecho y Jurisprudencia' },
                  { id: 'columbus-gestion', universityId: 'columbus', name: 'Gestión' },
                  { id: 'columbus-ciencias-naturales', universityId: 'columbus', name: 'Ciencias Naturales' },
                  { id: 'columbus-ciencias-politicas', universityId: 'columbus',name: 'Ciencias Políticas' },
                  { id: 'columbus-psicologia', universityId: 'columbus', name: 'Psicología' },
                  { id: 'columbus-sociologia', universityId: 'columbus', name: 'Sociología' },
                  { id: 'columbus-tecnologia', universityId: 'columbus', name: 'Tecnología' }
                ];

                programasToSeed = [
                  {
                    id: 'columbus-administracion-lic',
                    facultyId: 'columbus-administracion',
                    universityId: 'columbus',
                    name: 'Licenciatura en Administración',
                    level: 'licenciatura',
                    description: 'No disponible.',
                    sedes: [],
                    admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                    prices: {
                      info: 'Información de precios inconsistente y desactualizada. Un documento de 2015 indica una matrícula de B/. 224.50 y colegiatura de B/. 2597.43 para ocho materias en el primer semestre. Matrícula a partir del segundo semestre B/. 450.00. Otras fuentes no fiables indican $0.00. Se recomienda encarecidamente contactar directamente a la universidad para obtener información precisa y actual. [1, 2]'
                    }
                  },
                  {
                    id: 'columbus-negocios-lic',
                    facultyId: 'columbus-negocios',
                    universityId: 'columbus',
                    name: 'Licenciatura en Negocios',
                    level: 'licenciatura',
                    description: 'No disponible.',
                    sedes: [],
                    admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                    prices: {
                      info: 'Información de precios no fiable ($0.00 en fuentes de terceros). Se recomienda contactar directamente a la universidad. [1]'
                    }
                  },
                  {
                    id: 'columbus-ecologia-lic',
                    facultyId: 'columbus-ecologia',
                    universityId: 'columbus',
                    name: 'Licenciatura en Ecología',
                    level: 'licenciatura',
                    description: 'No disponible.',
                    sedes: [],
                    admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                    prices: {
                      info: 'Información de precios no fiable ($0.00 en fuentes de terceros). Se recomienda contactar directamente a la universidad. [1]'
                    }
                  },
                  {
                    id: 'columbus-economia-lic',
                    facultyId: 'columbus-economia',
                    universityId: 'columbus',
                    name: 'Licenciatura en Economía',
                    level: 'licenciatura',
                    description: 'No disponible.',
                    sedes: [],
                    admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                    prices: {
                      info: 'Información de precios no fiable ($0.00 en fuentes de terceros). Se recomienda contactar directamente a la universidad. [1]'
                    }
                  },
                  {
                    id: 'columbus-educacion-lic',
                    facultyId: 'columbus-educacion',
                    universityId: 'columbus',
                    name: 'Licenciatura en Educación',
                    level: 'licenciatura',
                    description: 'No disponible.',
                    sedes: [],
                    admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                    prices: {
                      info: 'Información de precios no fiable ($0.00 en fuentes de terceros). Se recomienda contactar directamente a la universidad. [1]'
                    }
                  },
                  {
                    id: 'columbus-humanidades-lic',
                    facultyId: 'columbus-humanidades',
                    universityId: 'columbus',
                    name: 'Licenciatura en Humanidades',
                    level: 'licenciatura',
                    description: 'No disponible.',
                    sedes: [],
                    admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                    prices: {
                      info: 'Información de precios no fiable ($0.00 en fuentes de terceros). Se recomienda contactar directamente a la universidad. [1]'
                    }
                  },
                  {
                    id: 'columbus-ti-lic',
                    facultyId: 'columbus-ti',
                    universityId: 'columbus',
                    name: 'Licenciatura en Tecnologías de la Información',
                    level: 'licenciatura',
                    description: 'No disponible.',
                    sedes: [],
                    admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                    prices: {
                      info: 'Información de precios no fiable ($0.00 en fuentes de terceros). Se recomienda contactar directamente a la universidad. [1]'
                    }
                  },
                  {
                    id: 'columbus-derecho-jurisprudencia-lic',
                    facultyId: 'columbus-derecho-jurisprudencia',
                    universityId: 'columbus',
                    name: 'Licenciatura en Derecho y Jurisprudencia',
                    level: 'licenciatura',
                    description: 'No disponible.',
                    sedes: [],
                    admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                    prices: {
                      info: 'Información de precios no fiable ($0.00 en fuentes de terceros). Se recomienda contactar directamente a la universidad. [1]'
                    }
                  },
                  {
                    id: 'columbus-gestion-lic',
                    facultyId: 'columbus-gestion',
                    universityId: 'columbus',
                    name: 'Licenciatura en Gestión',
                    level: 'licenciatura',
                    description: 'No disponible.',
                    sedes: [],
                    admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                    prices: {
                      info: 'Información de precios no fiable ($0.00 en fuentes de terceros). Se recomienda contactar directamente a la universidad. [1]'
                    }
                  },
                  {
                    id: 'columbus-ciencias-naturales-lic',
                    facultyId: 'columbus-ciencias-naturales',
                    universityId: 'columbus',
                    name: 'Licenciatura en Ciencias Naturales',
                    level: 'licenciatura',
                    description: 'No disponible.',
                    sedes: [],
                    admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                    prices: {
                      info: 'Información de precios no fiable ($0.00 en fuentes de terceros). Se recomienda contactar directamente a la universidad. [1]'
                    }
                  },
                  {
                    id: 'columbus-ciencias-politicas-lic',
                    facultyId: 'columbus-ciencias-politicas',
                    universityId: 'columbus',
                    name: 'Licenciatura en Ciencias Políticas',
                    level: 'licenciatura',
                    description: 'No disponible.',
                    sedes: [],
                    admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                    prices: {
                      info: 'Información de precios no fiable ($0.00 en fuentes de terceros). Se recomienda contactar directamente a la universidad. [1]'
                    }
                  },
                  {
                    id: 'columbus-psicologia-lic',
                    facultyId: 'columbus-psicologia',
                    universityId: 'columbus',
                    name: 'Licenciatura en Psicología',
                    level: 'licenciatura',
                    description: 'No disponible.',
                    sedes: [],
                    admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                    prices: {
                      info: 'Información de precios no fiable ($0.00 en fuentes de terceros). Se recomienda contactar directamente a la universidad. [1]'
                    }
                  },
                  {
                    id: 'columbus-sociologia-lic',
                    facultyId: 'columbus-sociologia',
                    universityId: 'columbus',
                    name: 'Licenciatura en Sociología',
                    level: 'licenciatura',
                    description: 'No disponible.',
                    sedes: [],
                    admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                    prices: {
                      info: 'Información de precios no fiable ($0.00 en fuentes de terceros). Se recomienda contactar directamente a la universidad. [1]'
                    }
                  },
                  {
                    id: 'columbus-tecnologia-lic',
                    facultyId: 'columbus-tecnologia',
                    universityId: 'columbus',
                    name: 'Licenciatura en Tecnología',
                    level: 'licenciatura',
                    description: 'No disponible.',
                    sedes: [],
                    admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                    prices: {
                      info: 'Información de precios no fiable ($0.00 en fuentes de terceros). Se recomienda contactar directamente a la universidad. [1]'
                    }
                  },
                  // Maestrías
                  {
                    id: 'columbus-administracion-maestria',
                    facultyId: 'columbus-administracion',
                    universityId: 'columbus',
                    name: 'Maestría en Administración',
                    level: 'maestria',
                    description: 'No disponible.',
                    sedes: [],
                    admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                    prices: {
                      info: 'Información de precios no fiable ($0.00 en fuentes de terceros). Se recomienda contactar directamente a la universidad. [1]'
                    }
                  },
                  {
                    id: 'columbus-negocios-maestria',
                    facultyId: 'columbus-negocios',
                    universityId: 'columbus',
                    name: 'Maestría en Negocios',
                    level: 'maestria',
                    description: 'No disponible.',
                    sedes: [],
                    admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                    prices: {
                      info: 'Información de precios no fiable ($0.00 en fuentes de terceros). Se recomienda contactar directamente a la universidad. [1]'
                    }
                  },
                  {
                    id: 'columbus-educacion-maestria',
                    facultyId: 'columbus-educacion',
                    universityId: 'columbus',
                    name: 'Maestría en Educación',
                    level: 'maestria',
                    description: 'No disponible.',
                    sedes: [],
                    admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                    prices: {
                      info: 'Información de precios no fiable ($0.00 en fuentes de terceros). Se recomienda contactar directamente a la universidad. [1]'
                    }
                  },
                  {
                    id: 'columbus-gestion-maestria',
                    facultyId: 'columbus-gestion',
                    universityId: 'columbus',
                    name: 'Maestría en Gestión',
                    level: 'maestria',
                    description: 'No disponible.',
                    sedes: [],
                    admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                    prices: {
                      info: 'Información de precios no fiable ($0.00 en fuentes de terceros). Se recomienda contactar directamente a la universidad. [1]'
                    }
                  }
                ];
                break
                case 'isae':
                  universityName = "ISAE Universidad";

                  facultadesToSeed = [
                      {id: 'isae-ciencias-educacion-humanidades', universityId: 'isae', name: 'Facultad de Ciencias de la Educación y Humanidades'},
                      {id: 'isae-derecho-ciencias-politicas', universityId: 'isae', name: 'Facultad de Derecho y Ciencias Políticas'},
                      {id: 'isae-ciencias-administracion', universityId: 'isae', name: 'Facultad de Ciencias de la Administración'},
                      {id: 'isae-ciencias-tecnologicas',universityId: 'isae', name: 'Facultad de Ciencias Tecnológicas' },
                      {id: 'isae-educacion-continua',universityId: 'isae', name: 'Educación Continua'}
                  ];

                  programasToSeed = [
                      // Licenciaturas - Ciencias de la Educación y Humanidades
                      {
                          id: 'isae-ciencias-educacion-humanidades-lic',
                          facultyId: 'isae-ciencias-educacion-humanidades',
                          universityId: 'isae',
                          name: 'Licenciatura en Ciencias de la Educación y Humanidades',
                          level: 'licenciatura',
                          description: 'No disponible. Se recomienda contactar directamente a la universidad para obtener información detallada sobre esta carrera.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      {
                          id: 'isae-profesorado-educacion-media-diversificada-lic',
                          facultyId: 'isae-ciencias-educacion-humanidades',
                          universityId: 'isae',
                          name: 'Profesorado en Educación Media Diversificada',
                          level: 'licenciatura',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      {
                          id: 'isae-profesorado-educacion-preescolar-lic',
                          facultyId: 'isae-ciencias-educacion-humanidades',
                          universityId: 'isae',
                          name: 'Profesorado en Educación Preescolar',
                          level: 'licenciatura',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      {
                          id: 'isae-profesorado-educacion-primaria-lic',
                          facultyId: 'isae-ciencias-educacion-humanidades',
                          universityId: 'isae',
                          name: 'Profesorado en Educación Primaria',
                          level: 'licenciatura',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      {
                          id: 'isae-educacion-preescolar-lic',
                          facultyId: 'isae-ciencias-educacion-humanidades',
                          universityId: 'isae',
                          name: 'Licenciatura en Educación Preescolar',
                          level: 'licenciatura',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      {
                          id: 'isae-educacion-primaria-lic',
                          facultyId: 'isae-ciencias-educacion-humanidades',
                          universityId: 'isae',
                          name: 'Licenciatura en Educación Primaria',
                          level: 'licenciatura',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      {
                          id: 'isae-ingles-lic',
                          facultyId: 'isae-ciencias-educacion-humanidades',
                          universityId: 'isae',
                          name: 'Licenciatura en Inglés',
                          level: 'licenciatura',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      // Técnicos - Ciencias de la Educación y Humanidades
                      {
                          id: 'isae-ensenanza-ingles-tec',
                          facultyId: 'isae-ciencias-educacion-humanidades',
                          universityId: 'isae',
                          name: 'Técnico para la Enseñanza del Inglés en la Educación Básica General',
                          level: 'tecnico',
                          description: 'Forma profesionales con la capacidad de expresarse de manera coherente y estructurada en inglés, utilizando un vocabulario avanzado. Los egresados están preparados para aplicar estrategias innovadoras en la enseñanza del inglés, interactuar fluidamente de forma oral y escrita, y demostrar habilidades didácticas. El enfoque del programa es desarrollar un perfil profesional competitivo y actualizado, con un énfasis en la didáctica del inglés como segundo idioma. Modalidad semipresencial, una materia por mes.',
                          sedes: [],
                          admission_guide: 'Diploma de bachiller y créditos de secundaria (original y copia fiel con sello fresco, apostillados si son del extranjero y avalados por MEDUCA Panamá). Dos fotos tamaño carné, copia de cédula o pasaporte, certificado de salud física vigente. [4]',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      // Maestrías/Postgrados - Ciencias de la Educación y Humanidades
                      {
                          id: 'isae-docencia-superior-virtual-maestria',
                          facultyId: 'isae-ciencias-educacion-humanidades',
                          universityId: 'isae',
                          name: 'Maestría en Docencia Superior – Virtual',
                          level: 'maestria',
                          description: 'Busca desarrollar habilidades en la gestión de recursos multimedia y tecnológicos, la aplicación de procesos de planificación y evaluación del aprendizaje, y la integración de conocimientos técnicos para la planificación y adaptación curricular. Los egresados interpretarán principios de tecnología educativa y poseerán un perfil con principios éticos sólidos, empatía, pensamiento crítico, iniciativa y capacidad de investigación. Modalidad virtual, una materia por mes.',
                          sedes: [],
                          admission_guide: 'Diploma de licenciatura y créditos (original y copia fiel con sello fresco, apostillados si son del extranjero y avalados por MEDUCA Panamá). Índice académico no menor a 1.50. Currículum actualizado, 2 fotos tamaño carné, copia de cédula o pasaporte, certificado de salud física vigente, carta de solicitud y entrevista. [5]',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      {
                          id: 'isae-docencia-superior-semipresencial-maestria',
                          facultyId: 'isae-ciencias-educacion-humanidades',
                          universityId: 'isae',
                          name: 'Maestría en Docencia Superior Semipresencial',
                          level: 'maestria',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      {
                          id: 'isae-direccion-supervision-escolar-maestria',
                          facultyId: 'isae-ciencias-educacion-humanidades',
                          universityId: 'isae',
                          name: 'Maestría en Dirección y Supervisión Escolar',
                          level: 'maestria',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      {
                          id: 'isae-investigacion-educativa-maestria',
                          facultyId: 'isae-ciencias-educacion-humanidades',
                          universityId: 'isae',
                          name: 'Maestría en Investigación Educativa',
                          level: 'maestria',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      {
                          id: 'isae-administracion-educativa-especializacion',
                          facultyId: 'isae-ciencias-educacion-humanidades',
                          universityId: 'isae',
                          name: 'Especialización en Administración Educativa',
                          level: 'especializacion',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      {
                          id: 'isae-docencia-superior-virtual-especializacion',
                          facultyId: 'isae-ciencias-educacion-humanidades',
                          universityId: 'isae',
                          name: 'Especialización en Docencia Superior Modalidad Virtual',
                          level: 'especializacion',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      {
                          id: 'isae-docencia-superior-semipresencial-especializacion',
                          facultyId: 'isae-ciencias-educacion-humanidades',
                          universityId: 'isae',
                          name: 'Especialización en Docencia Superior Semipresencial',
                          level: 'especializacion',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      {
                          id: 'isae-investigacion-educativa-especializacion',
                          facultyId: 'isae-ciencias-educacion-humanidades',
                          universityId: 'isae',
                          name: 'Especialización en Investigación Educativa',
                          level: 'especializacion',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      // Licenciaturas - Derecho y Ciencias Políticas
                      {
                          id: 'isae-derecho-ciencias-politicas-lic',
                          facultyId: 'isae-derecho-ciencias-politicas',
                          universityId: 'isae',
                          name: 'Licenciatura en Derecho y Ciencias Políticas',
                          level: 'licenciatura',
                          description: 'Forma profesionales capacitados para aplicar principios legales, asesorar entidades públicas y privadas, y redactar documentos legales esenciales. Los egresados podrán identificar problemas políticos y económicos en su entorno social, integrándose a las dinámicas modernas, y desarrollarán habilidades en procesos legales orales, argumentación e interpretación de normas. El perfil del egresado enfatiza el respeto a la dignidad humana, el compromiso humanista, la honorabilidad, el coraje para defender la justicia, el pensamiento crítico y la disposición a la actualización constante. Modalidad semipresencial, una materia por mes.',
                          sedes: [],
                          admission_guide: 'Diploma de bachiller y créditos de secundaria (original y copia fiel con sello fresco, apostillados si son del extranjero y avalados por MEDUCA Panamá). Dos fotos tamaño carné, copia de cédula o pasaporte, certificado de salud física vigente. [6]',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      // Técnicos - Derecho y Ciencias Políticas
                      {
                          id: 'isae-seguridad-fronteras-tec',
                          facultyId: 'isae-derecho-ciencias-politicas',
                          universityId: 'isae',
                          name: 'Técnico Universitario en Seguridad de Fronteras',
                          level: 'tecnico',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      // Maestrías/Postgrados - Derecho y Ciencias Políticas
                      {
                          id: 'isae-derecho-administrativo-maestria',
                          facultyId: 'isae-derecho-ciencias-politicas',
                          universityId: 'isae',
                          name: 'Maestría en Derecho Administrativo',
                          level: 'maestria',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      {
                          id: 'isae-derecho-comercial-maestria',
                          facultyId: 'isae-derecho-ciencias-politicas',
                          universityId: 'isae',
                          name: 'Maestría en Derecho Comercial',
                          level: 'maestria',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      {
                          id: 'isae-derecho-laboral-maestria',
                          facultyId: 'isae-derecho-ciencias-politicas',
                          universityId: 'isae',
                          name: 'Maestría en Derecho Laboral',
                          level: 'maestria',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      {
                          id: 'isae-derecho-maritimo-maestria',
                          facultyId: 'isae-derecho-ciencias-politicas',
                          universityId: 'isae',
                          name: 'Maestría en Derecho Marítimo',
                          level: 'maestria',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      {
                          id: 'isae-derecho-procesal-maestria',
                          facultyId: 'isae-derecho-ciencias-politicas',
                          universityId: 'isae',
                          name: 'Maestría en Derecho Procesal',
                          level: 'maestria',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      {
                          id: 'isae-derechos-humanos-maestria',
                          facultyId: 'isae-derecho-ciencias-politicas',
                          universityId: 'isae',
                          name: 'Maestría en Derechos Humanos',
                          level: 'maestria',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      {
                          id: 'isae-sistema-penal-acusatorio-maestria',
                          facultyId: 'isae-derecho-ciencias-politicas',
                          universityId: 'isae',
                          name: 'Maestría en Sistema Penal Acusatorio',
                          level: 'maestria',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      {
                          id: 'isae-derecho-administrativo-especializacion',
                          facultyId: 'isae-derecho-ciencias-politicas',
                          universityId: 'isae',
                          name: 'Especialización en Derecho Administrativo',
                          level: 'especializacion',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      {
                          id: 'isae-derecho-comercial-especializacion',
                          facultyId: 'isae-derecho-ciencias-politicas',
                          universityId: 'isae',
                          name: 'Especialización en Derecho Comercial',
                          level: 'especializacion',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      {
                          id: 'isae-derecho-laboral-especializacion',
                          facultyId: 'isae-derecho-ciencias-politicas',
                          universityId: 'isae',
                          name: 'Especialización en Derecho Laboral',
                          level: 'especializacion',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      {
                          id: 'isae-derecho-maritimo-especializacion',
                          facultyId: 'isae-derecho-ciencias-politicas',
                          universityId: 'isae',
                          name: 'Especialización en Derecho Marítimo',
                          level: 'especializacion',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      {
                          id: 'isae-derecho-procesal-especializacion',
                          facultyId: 'isae-derecho-ciencias-politicas',
                          universityId: 'isae',
                          name: 'Especialización en Derecho Procesal',
                          level: 'especializacion',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      {
                          id: 'isae-derechos-humanos-especializacion',
                          facultyId: 'isae-derecho-ciencias-politicas',
                          universityId: 'isae',
                          name: 'Especialización en Derechos Humanos',
                          level: 'especializacion',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      {
                          id: 'isae-sistema-penal-acusatorio-especializacion',
                          facultyId: 'isae-derecho-ciencias-politicas',
                          universityId: 'isae',
                          name: 'Especialización en Sistema Penal Acusatorio',
                          level: 'especializacion',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      // Licenciaturas - Ciencias de la Administración
                      {
                          id: 'isae-contabilidad-lic',
                          facultyId: 'isae-ciencias-administracion',
                          universityId: 'isae',
                          name: 'Licenciatura en Contabilidad',
                          level: 'licenciatura',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      {
                          id: 'isae-gerencia-empresas-lic',
                          facultyId: 'isae-ciencias-administracion',
                          universityId: 'isae',
                          name: 'Licenciatura en Gerencia de Empresas',
                          level: 'licenciatura',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      {
                          id: 'isae-mercadotecnia-lic',
                          facultyId: 'isae-ciencias-administracion',
                          universityId: 'isae',
                          name: 'Licenciatura en Mercadotecnia',
                          level: 'licenciatura',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      {
                          id: 'isae-turismo-lic',
                          facultyId: 'isae-ciencias-administracion',
                          universityId: 'isae',
                          name: 'Licenciatura en Turismo',
                          level: 'licenciatura',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      // Técnicos - Ciencias de la Administración
                      {
                          id: 'isae-seguridad-laboral-tec',
                          facultyId: 'isae-ciencias-administracion',
                          universityId: 'isae',
                          name: 'Técnico en Seguridad Laboral',
                          level: 'tecnico',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      {
                          id: 'isae-turismo-tec',
                          facultyId: 'isae-ciencias-administracion',
                          universityId: 'isae',
                          name: 'Técnico en Turismo',
                          level: 'tecnico',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      // Maestrías/Postgrados - Ciencias de la Administración
                      {
                          id: 'isae-administracion-empresas-rrhh-maestria',
                          facultyId: 'isae-ciencias-administracion',
                          universityId: 'isae',
                          name: 'Maestría en Administración de Empresas con Especialización en Recursos Humanos',
                          level: 'maestria',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      {
                          id: 'isae-auditoria-financiera-maestria',
                          facultyId: 'isae-ciencias-administracion',
                          universityId: 'isae',
                          name: 'Maestría en Auditoría Financiera – En Actualización',
                          level: 'maestria',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      {
                          id: 'isae-auditoria-forense-maestria',
                          facultyId: 'isae-ciencias-administracion',
                          universityId: 'isae',
                          name: 'Maestría en Auditoría Forense',
                          level: 'maestria',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      {
                          id: 'isae-alta-gerencia-especializacion',
                          facultyId: 'isae-ciencias-administracion',
                          universityId: 'isae',
                          name: 'Especialización en Alta Gerencia',
                          level: 'especializacion',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      {
                          id: 'isae-auditoria-financiera-especializacion',
                          facultyId: 'isae-ciencias-administracion',
                          universityId: 'isae',
                          name: 'Especialización en Auditoría Financiera – En Actualización',
                          level: 'especializacion',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      {
                          id: 'isae-auditoria-forense-especializacion',
                          facultyId: 'isae-ciencias-administracion',
                          universityId: 'isae',
                          name: 'Especialización en Auditoría Forense',
                          level: 'especializacion',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      // Licenciaturas - Ciencias Tecnológicas
                      {
                          id: 'isae-informatica-auditoria-sistemas-lic',
                          facultyId: 'isae-ciencias-tecnologicas',
                          universityId: 'isae',
                          name: 'Licenciatura en Informática con énfasis en Auditoría de Sistemas',
                          level: 'licenciatura',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      {
                          id: 'isae-informatica-sistemas-informacion-lic',
                          facultyId: 'isae-ciencias-tecnologicas',
                          universityId: 'isae',
                          name: 'Licenciatura en Informática con énfasis en Sistemas de Información',
                          level: 'licenciatura',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      // Técnicos - Ciencias Tecnológicas
                      {
                          id: 'isae-informatica-tec',
                          facultyId: 'isae-ciencias-tecnologicas',
                          universityId: 'isae',
                          name: 'Técnico en Informática',
                          level: 'tecnico',
                          description: 'No disponible.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      },
                      // Educación Continua
                      {
                          id: 'isae-educacion-continua-seminarios',
                          facultyId: 'isae-educacion-continua',
                          universityId: 'isae',
                          name: 'Seminarios (Educación Continua)',
                          level: 'educacion_continua',
                          description: 'Estrategias de educación no formal dirigidas a profesionales y no profesionales con necesidades específicas en el campo laboral o personal.',
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'El proceso de convalidación de documentos tiene un costo de $10.00. Se ha mencionado una "promoción exclusiva" que ofrece un 50% de descuento en la matrícula inicial y un 15% de descuento en mensualidades para programas 100% virtuales. Los precios varían según el programa. [7, 8]' }
                      },
                      {
                          id: 'isae-educacion-continua-diplomados',
                          facultyId: 'isae-educacion-continua',
                          universityId: 'isae',
                          name: 'Diplomados (Educación Continua)',
                          level: 'educacion_continua',
                          description: 'Estrategias de educación no formal dirigidas a profesionales y no profesionales con necesidades específicas en el campo laboral o personal.' , // Corrected the incomplete description
                          sedes: [],
                          admission_guide: 'No disponible. Se recomienda contactar directamente a la universidad.',
                          prices: { info: 'Los costos son variables dependiendo de la carrera, la cantidad de materias y la época del año. Se recomienda contactar directamente a la universidad para obtener información precisa. [3]' }
                      }
                  ];
                break
                
                case'uip':
                // Universidad Interamericana de Panamá (UIP)
                universityName = "Universidad Interamericana de Panamá";

                facultadesToSeed = [
                    { id: 'uip-ciencias-salud', universityId: 'uip', name: 'Facultad de Ciencias de la Salud'},
                    { id: 'uip-hoteleria-gastronomia-turismo', universityId: 'uip',name: 'Facultad de Hotelería, Gastronomía y Turismo'},
                    { id: 'uip-ingenieria-arquitectura-diseno', universityId: 'uip', name: 'Facultad de Ingeniería, Arquitectura y Diseño'},
                    { id: 'uip-ciencias-administrativas-maritima-portuaria', universityId: 'uip', name: 'Facultad de Ciencias Administrativas, Marítima y Portuaria'},
                    { id: 'uip-derecho-ciencias-sociales', universityId: 'uip', name: 'Facultad de Derecho y Ciencias Sociales' }
                ];

                programasToSeed = [
                    // Licenciaturas - Facultad de Ciencias de la Salud
                    {
                        id: 'uip-fisioterapia-lic',
                        facultyId: 'uip-ciencias-salud',
                        universityId: 'uip',
                        name: 'Licenciatura en Fisioterapia',
                        level: 'licenciatura',
                        description: 'Este programa forma profesionales capaces de prevenir, evaluar, diagnosticar y tratar disfunciones del movimiento humano. Los estudiantes adquieren conocimientos en anatomía, fisiología, biomecánica y diversas técnicas terapéuticas para la rehabilitación y mejora de la calidad de vida de los pacientes.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller o su equivalente, historial académico completo de secundaria, copia de cédula de identidad o pasaporte, dos fotos tamaño carné, formulario de solicitud completo, y pago de cuota de inscripción. Se valorará un buen promedio académico y aptitud para el trabajo en el área de la salud.',
                        prices: { info: 'Costo mensual estimado: $520. La matrícula inicial es de $250. Costo total del programa puede rondar los $28,000.' }
                    },
                    {
                        id: 'uip-enfermeria-lic',
                        facultyId: 'uip-ciencias-salud',
                        universityId: 'uip',
                        name: 'Licenciatura en Enfermería',
                        level: 'licenciatura',
                        description: 'Prepara enfermeros y enfermeras con sólidos conocimientos científicos y humanísticos para brindar atención integral a individuos, familias y comunidades. El programa enfatiza la promoción de la salud, la prevención de enfermedades y el cuidado en diversas etapas de la vida, en entornos hospitalarios y comunitarios.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller o su equivalente, historial académico completo de secundaria, copia de cédula de identidad o pasaporte, dos fotos tamaño carné, formulario de solicitud completo, y pago de cuota de inscripción. Es deseable la vocación de servicio y sensibilidad social.',
                        prices: { info: 'Costo mensual estimado: $490. La matrícula inicial es de $230. Costo total del programa puede rondar los $25,000.' }
                    },
                    {
                        id: 'uip-doctor-medicina-lic',
                        facultyId: 'uip-ciencias-salud',
                        universityId: 'uip',
                        name: 'Doctor en Medicina',
                        level: 'licenciatura', // Aunque es un Doctorado Profesional, se clasifica como "licenciatura" para fines de este esquema.
                        description: 'Un programa riguroso que forma médicos cirujanos con una sólida base en ciencias básicas y clínicas. Los estudiantes desarrollan habilidades de diagnóstico, tratamiento, investigación y ética médica, preparándose para una práctica clínica responsable y un compromiso con la salud pública.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller con énfasis en ciencias (o equivalente), historial académico sobresaliente de secundaria, prueba de aptitud académica y entrevista personal, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de solicitud. Pueden requerirse cartas de recomendación.',
                        prices: { info: 'Costo anual estimado: $12,000. La matrícula inicial es de $500. El costo total del programa (6-7 años) puede superar los $70,000.' }
                    },
                    {
                        id: 'uip-nutricion-dietetica-lic',
                        facultyId: 'uip-ciencias-salud',
                        universityId: 'uip',
                        name: 'Licenciatura en Nutrición y Dietética',
                        level: 'licenciatura',
                        description: 'Capacita a profesionales en la ciencia de la alimentación y la nutrición, para diseñar planes dietéticos personalizados, educar sobre hábitos saludables y manejar terapias nutricionales en contextos clínicos y comunitarios, contribuyendo a la prevención y manejo de enfermedades.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller o su equivalente, historial académico completo de secundaria, copia de cédula de identidad o pasaporte, dos fotos tamaño carné, formulario de solicitud completo, y pago de cuota de inscripción. Interés en la salud y el bienestar.',
                        prices: { info: 'Costo mensual estimado: $480. La matrícula inicial es de $220. Costo total del programa puede rondar los $24,000.' }
                    },
                    {
                        id: 'uip-doctor-cirugia-dental-lic',
                        facultyId: 'uip-ciencias-salud',
                        universityId: 'uip',
                        name: 'Doctor en Cirugía Dental',
                        level: 'licenciatura', // Aunque es un Doctorado Profesional, se clasifica como "licenciatura" para fines de este esquema.
                        description: 'Forma odontólogos integrales con capacidad para diagnosticar, prevenir y tratar enfermedades bucodentales, realizar procedimientos quirúrgicos y estéticos, y promover la salud oral comunitaria, aplicando los más altos estándares de calidad y ética profesional.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller con énfasis en ciencias (o equivalente), historial académico sobresaliente de secundaria, prueba de aptitud académica y entrevista personal, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de solicitud. Habilidades manuales finas son valoradas.',
                        prices: { info: 'Costo anual estimado: $11,500. La matrícula inicial es de $480. El costo total del programa (5-6 años) puede superar los $65,000.' }
                    },
                    {
                        id: 'uip-farmacia-lic',
                        facultyId: 'uip-ciencias-salud',
                        universityId: 'uip',
                        name: 'Licenciatura en Farmacia',
                        level: 'licenciatura',
                        description: 'Prepara profesionales en el conocimiento de medicamentos, su composición, acción, dispensación y gestión. Los farmacéuticos egresados podrán trabajar en farmacias comunitarias, hospitales, la industria farmacéutica y en investigación, asegurando el uso racional de los fármacos.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller o su equivalente, historial académico completo de secundaria, copia de cédula de identidad o pasaporte, dos fotos tamaño carné, formulario de solicitud completo, y pago de cuota de inscripción. Interés en química y biología.',
                        prices: { info: 'Costo mensual estimado: $500. La matrícula inicial es de $240. Costo total del programa puede rondar los $26,000.' }
                    },
                    // Técnicos Superiores Universitarios - Facultad de Ciencias de la Salud
                    {
                        id: 'uip-asistencia-odontologica-tec',
                        facultyId: 'uip-ciencias-salud',
                        universityId: 'uip',
                        name: 'Técnico en Asistencia Odontológica',
                        level: 'tecnico',
                        description: 'Forma asistentes dentales capacitados para apoyar al odontólogo en procedimientos clínicos, preparar el instrumental, gestionar la consulta y brindar orientación a los pacientes sobre higiene bucal, contribuyendo a una atención odontológica eficiente y de calidad.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Se valoran la destreza manual y la organización.',
                        prices: { info: 'Costo mensual estimado: $350. La matrícula inicial es de $150. El costo total del programa puede rondar los $7,500.' }
                    },
                    {
                        id: 'uip-enfermeria-tec',
                        facultyId: 'uip-ciencias-salud',
                        universityId: 'uip',
                        name: 'Técnico Superior Universitario en Enfermería',
                        level: 'tecnico',
                        description: 'Desarrolla habilidades prácticas para asistir en el cuidado de pacientes bajo supervisión profesional, realizando procedimientos básicos de enfermería, monitoreo de signos vitales, administración de medicamentos y apoyo en situaciones de emergencia, con ética y humanismo.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Aptitud para el servicio y empatía.',
                        prices: { info: 'Costo mensual estimado: $370. La matrícula inicial es de $160. El costo total del programa puede rondar los $8,000.' }
                    },
                    // Licenciaturas - Facultad de Hotelería, Gastronomía y Turismo
                    {
                        id: 'uip-artes-culinarias-lic',
                        facultyId: 'uip-hoteleria-gastronomia-turismo',
                        universityId: 'uip',
                        name: 'Licenciatura en Artes Culinarias',
                        level: 'licenciatura',
                        description: 'Programa que forma chefs y profesionales de la gastronomía con habilidades en técnicas culinarias nacionales e internacionales, gestión de cocinas, nutrición, costos y tendencias gastronómicas, preparados para innovar y liderar en la industria alimentaria.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller o su equivalente, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Pasión por la cocina y creatividad.',
                        prices: { info: 'Costo mensual estimado: $450. La matrícula inicial es de $200. Costo total del programa puede rondar los $22,000.' }
                    },
                    {
                        id: 'uip-artes-culinarias-semipresencial-lic',
                        facultyId: 'uip-hoteleria-gastronomia-turismo',
                        universityId: 'uip',
                        name: 'Licenciatura en Artes Culinarias (Semipresencial)',
                        level: 'licenciatura',
                        description: 'Combina la flexibilidad de la modalidad semipresencial con la práctica intensiva en artes culinarias, permitiendo a los estudiantes desarrollar sus habilidades gastronómicas mientras balancean otras responsabilidades, con énfasis en la innovación y gestión en cocina.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller o su equivalente, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Requiere autodisciplina para la modalidad semipresencial.',
                        prices: { info: 'Costo mensual estimado: $430. La matrícula inicial es de $190. Costo total del programa puede rondar los $21,000.' }
                    },
                    {
                        id: 'uip-administracion-empresas-hoteleras-lic',
                        facultyId: 'uip-hoteleria-gastronomia-turismo',
                        universityId: 'uip',
                        name: 'Licenciatura en Administración de Empresas Hoteleras',
                        level: 'licenciatura',
                        description: 'Prepara gestores hoteleros con conocimientos en operaciones de alojamiento, alimentos y bebidas, marketing turístico, finanzas y recursos humanos, para liderar y optimizar el funcionamiento de hoteles, resorts y otros establecimientos turísticos.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller o su equivalente, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Interés en la industria hotelera y atención al cliente.',
                        prices: { info: 'Costo mensual estimado: $480. La matrícula inicial es de $220. Costo total del programa puede rondar los $24,000.' }
                    },
                    {
                        id: 'uip-administracion-empresas-hoteleras-distancia-lic',
                        facultyId: 'uip-hoteleria-gastronomia-turismo',
                        universityId: 'uip',
                        name: 'Licenciatura en Administración de Empresas Hoteleras (A distancia)',
                        level: 'licenciatura',
                        description: 'Modalidad flexible para quienes buscan especializarse en la gestión hotelera, abarcando planificación estratégica, marketing turístico y operaciones, con la ventaja de estudiar a distancia sin sacrificar la calidad académica, ideal para profesionales en activo.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller o su equivalente, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Requiere autonomía y buenas habilidades de gestión del tiempo.',
                        prices: { info: 'Costo mensual estimado: $460. La matrícula inicial es de $210. Costo total del programa puede rondar los $23,000.' }
                    },
                    // Técnicos Superiores Universitarios - Facultad de Hotelería, Gastronomía y Turismo
                    {
                        id: 'uip-artes-culinarias-tec',
                        facultyId: 'uip-hoteleria-gastronomia-turismo',
                        universityId: 'uip',
                        name: 'Técnico en Artes Culinarias',
                        level: 'tecnico',
                        description: 'Desarrolla habilidades fundamentales en técnicas de cocina, manejo de alimentos, higiene y seguridad en la preparación, así como conocimientos básicos de repostería, preparando a los estudiantes para roles operativos en cocinas profesionales y establecimientos gastronómicos.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Interés práctico en la cocina.',
                        prices: { info: 'Costo mensual estimado: $380. La matrícula inicial es de $170. El costo total del programa puede rondar los $9,000.' }
                    },
                    // Licenciaturas - Facultad de Ingeniería, Arquitectura y Diseño
                    {
                        id: 'uip-ing-redes-datos-sis-inalambricos-lic',
                        facultyId: 'uip-ingenieria-arquitectura-diseno',
                        universityId: 'uip',
                        name: 'Licenciatura en Ingeniería de Redes y Datos con énfasis en Sistemas Inalámbricos',
                        level: 'licenciatura',
                        description: 'Forma ingenieros especializados en el diseño, implementación y gestión de redes de comunicación, con un enfoque particular en tecnologías inalámbricas (Wi-Fi, 5G, IoT). Los egresados estarán preparados para liderar proyectos de infraestructura de conectividad y ciberseguridad.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller en ciencias o técnico afín, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Interés en tecnologías de la información y comunicación.',
                        prices: { info: 'Costo mensual estimado: $550. La matrícula inicial es de $260. Costo total del programa puede rondar los $30,000.' }
                    },
                    {
                        id: 'uip-ing-sistemas-computacionales-lic',
                        facultyId: 'uip-ingenieria-arquitectura-diseno',
                        universityId: 'uip',
                        name: 'Licenciatura en Ingeniería en Sistemas Computacionales',
                        level: 'licenciatura',
                        description: 'Capacita a ingenieros en el desarrollo de software, gestión de bases de datos, ciberseguridad y arquitectura de sistemas. El programa dota a los estudiantes de herramientas para diseñar soluciones tecnológicas innovadoras y eficientes en diversos sectores.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller en ciencias o técnico afín, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Aptitud lógica y resolución de problemas.',
                        prices: { info: 'Costo mensual estimado: $530. La matrícula inicial es de $250. Costo total del programa puede rondar los $29,000.' }
                    },
                    {
                        id: 'uip-ing-sistemas-computacionales-virtual-lic',
                        facultyId: 'uip-ingenieria-arquitectura-diseno',
                        universityId: 'uip',
                        name: 'Licenciatura en Ingeniería en Sistemas Computacionales (VIRTUAL)',
                        level: 'licenciatura',
                        description: 'Ofrece la misma rigurosa formación en ingeniería de sistemas computacionales, pero con la flexibilidad de la modalidad virtual. Ideal para quienes necesitan gestionar su tiempo y espacio, sin comprometer la calidad del aprendizaje en desarrollo de software y gestión tecnológica.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller en ciencias o técnico afín, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Requiere buena conectividad y autodisciplina.',
                        prices: { info: 'Costo mensual estimado: $510. La matrícula inicial es de $240. Costo total del programa puede rondar los $28,000.' }
                    },
                    {
                        id: 'uip-sis-comp-desarrollo-sis-avanzados-redes-software-lic',
                        facultyId: 'uip-ingenieria-arquitectura-diseno',
                        universityId: 'uip',
                        name: 'Licenciatura en Sistemas Computacionales con énfasis en Desarrollo de Sistemas Avanzados de Redes y Software',
                        level: 'licenciatura',
                        description: 'Esta especialización se enfoca en la creación y optimización de sistemas complejos, con un profundo conocimiento en arquitectura de redes de alta performance y el diseño de software robusto. Los egresados serán expertos en la construcción de infraestructuras tecnológicas de vanguardia.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller en ciencias o técnico afín, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Fuertes bases en programación y redes.',
                        prices: { info: 'Costo mensual estimado: $560. La matrícula inicial es de $270. Costo total del programa puede rondar los $31,000.' }
                    },
                    {
                        id: 'uip-sis-comp-desarrollo-sis-avanzados-redes-software-virtual-lic',
                        facultyId: 'uip-ingenieria-arquitectura-diseno',
                        universityId: 'uip',
                        name: 'Licenciatura en Sistemas Computacionales con énfasis en Desarrollo de Sistemas Avanzados de Redes y Software (VIRTUAL)',
                        level: 'licenciatura',
                        description: 'Versión virtual de la especialización, ideal para profesionales que buscan dominar el desarrollo de sistemas avanzados y redes sin interrupciones. El programa capacita en las últimas tecnologías de software y redes, con la flexibilidad de estudiar a distancia.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller en ciencias o técnico afín, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Requiere disciplina y conocimientos previos en T.I.',
                        prices: { info: 'Costo mensual estimado: $540. La matrícula inicial es de $260. Costo total del programa puede rondar los $30,000.' }
                    },
                    {
                        id: 'uip-ing-electronica-comunicaciones-lic',
                        facultyId: 'uip-ingenieria-arquitectura-diseno',
                        universityId: 'uip',
                        name: 'Licenciatura en Ingeniería Electrónica y de Comunicaciones',
                        level: 'licenciatura',
                        description: 'Forma ingenieros con habilidades en el diseño, implementación y mantenimiento de sistemas electrónicos y de comunicación, desde circuitos y dispositivos hasta sistemas de telecomunicaciones, instrumentación y control automático.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller en ciencias o técnico afín, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Interés en física y matemáticas.',
                        prices: { info: 'Costo mensual estimado: $570. La matrícula inicial es de $280. Costo total del programa puede rondar los $32,000.' }
                    },
                    {
                        id: 'uip-ing-industrial-sistemas-lic',
                        facultyId: 'uip-ingenieria-arquitectura-diseno',
                        universityId: 'uip',
                        name: 'Licenciatura en Ingeniería Industrial y de Sistemas',
                        level: 'licenciatura',
                        description: 'Combina los principios de la ingeniería industrial con el enfoque de sistemas, preparando a los profesionales para optimizar procesos, mejorar la productividad y gestionar proyectos complejos en diversas industrias, mediante el análisis de datos y la innovación.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller en ciencias o técnico afín, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Aptitud para la optimización y mejora continua.',
                        prices: { info: 'Costo mensual estimado: $560. La matrícula inicial es de $270. Costo total del programa puede rondar los $31,000.' }
                    },
                    {
                        id: 'uip-ing-industrial-gestion-calidad-lic',
                        facultyId: 'uip-ingenieria-arquitectura-diseno',
                        universityId: 'uip',
                        name: 'Licenciatura en Ingeniería Industrial con énfasis en Gestión de Calidad',
                        level: 'licenciatura',
                        description: 'Especialización que forma ingenieros capaces de diseñar e implementar sistemas de gestión de calidad, aplicar herramientas estadísticas para el control de procesos y liderar iniciativas de mejora continua, garantizando la excelencia en productos y servicios.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller en ciencias o técnico afín, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Interés en estándares y procesos de calidad.',
                        prices: { info: 'Costo mensual estimado: $580. La matrícula inicial es de $290. Costo total del programa puede rondar los $32,500.' }
                    },
                    {
                        id: 'uip-ing-industrial-gestion-operaciones-lic',
                        facultyId: 'uip-ingenieria-arquitectura-diseno',
                        universityId: 'uip',
                        name: 'Licenciatura en Ingeniería Industrial con énfasis en Gestión de Operaciones',
                        level: 'licenciatura',
                        description: 'Enfocada en la optimización de los procesos productivos y logísticos de una organización. Los estudiantes aprenden a diseñar, planificar y controlar operaciones para maximizar la eficiencia, reducir costos y mejorar la cadena de suministro.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller en ciencias o técnico afín, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Aptitud para el análisis de sistemas y la logística.',
                        prices: { info: 'Costo mensual estimado: $575. La matrícula inicial es de $285. Costo total del programa puede rondar los $32,200.' }
                    },
                    {
                        id: 'uip-arquitectura-lic',
                        facultyId: 'uip-ingenieria-arquitectura-diseno',
                        universityId: 'uip',
                        name: 'Licenciatura en Arquitectura',
                        level: 'licenciatura',
                        description: 'Forma arquitectos creativos y técnicos, capaces de diseñar, planificar y supervisar proyectos de construcción, desde edificaciones residenciales y comerciales hasta urbanismo, con un enfoque en la sostenibilidad, funcionalidad y estética.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller o su equivalente, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Se recomienda tener habilidades de dibujo y creatividad espacial.',
                        prices: { info: 'Costo mensual estimado: $540. La matrícula inicial es de $260. Costo total del programa puede rondar los $29,500.' }
                    },
                    {
                        id: 'uip-arquitectura-distancia-lic',
                        facultyId: 'uip-ingenieria-arquitectura-diseno',
                        universityId: 'uip',
                        name: 'Licenciatura en Arquitectura (a distancia)',
                        level: 'licenciatura',
                        description: 'La modalidad a distancia permite a los estudiantes formarse como arquitectos con un currículo flexible, manteniendo la rigurosidad en el diseño y la teoría arquitectónica. Ideal para quienes buscan combinar el estudio con otras actividades profesionales o personales.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller o su equivalente, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Requiere autodisciplina y acceso a herramientas de diseño digital.',
                        prices: { info: 'Costo mensual estimado: $520. La matrícula inicial es de $250. Costo total del programa puede rondar los $28,500.' }
                    },
                    {
                        id: 'uip-periodismo-lic',
                        facultyId: 'uip-ingenieria-arquitectura-diseno', // O podría ser en Ciencias Sociales/Humanidades, ajusté a lo dado en el snippet.
                        universityId: 'uip',
                        name: 'Licenciatura en Periodismo',
                        level: 'licenciatura',
                        description: 'Capacita a futuros periodistas en la investigación, redacción y difusión de noticias a través de diversos medios (escrito, digital, audiovisual). El programa enfatiza la ética periodística, el análisis crítico y la comunicación efectiva para informar a la sociedad.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller o su equivalente, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Excelentes habilidades de redacción y curiosidad por los eventos actuales.',
                        prices: { info: 'Costo mensual estimado: $450. La matrícula inicial es de $200. Costo total del programa puede rondar los $22,000.' }
                    },
                    {
                        id: 'uip-diseno-interiores-lic',
                        facultyId: 'uip-ingenieria-arquitectura-diseno',
                        universityId: 'uip',
                        name: 'Licenciatura en Diseño de Interiores',
                        level: 'licenciatura',
                        description: 'Forma diseñadores de interiores creativos y técnicos, capaces de transformar espacios para mejorar su funcionalidad, estética y confort. El programa cubre desde la planificación del espacio y la selección de materiales hasta la iluminación y el mobiliario.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller o su equivalente, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Creatividad, sentido estético y atención al detalle.',
                        prices: { info: 'Costo mensual estimado: $460. La matrícula inicial es de $210. Costo total del programa puede rondar los $23,000.' }
                    },
                    {
                        id: 'uip-diseno-interiores-virtual-lic',
                        facultyId: 'uip-ingenieria-arquitectura-diseno',
                        universityId: 'uip',
                        name: 'Licenciatura en Diseño de Interiores (VIRTUAL)',
                        level: 'licenciatura',
                        description: 'Permite a los estudiantes adquirir las habilidades de diseño de interiores con la flexibilidad de la educación virtual. Se enfoca en la planificación, visualización y gestión de proyectos de diseño, utilizando herramientas digitales y fomentando la creatividad a distancia.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller o su equivalente, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Requiere acceso a software de diseño y autodisciplina.',
                        prices: { info: 'Costo mensual estimado: $440. La matrícula inicial es de $200. Costo total del programa puede rondar los $22,000.' }
                    },
                    {
                        id: 'uip-diseno-grafico-publicidad-mercadeo-lic',
                        facultyId: 'uip-ingenieria-arquitectura-diseno',
                        universityId: 'uip',
                        name: 'Licenciatura en Diseño Gráfico con énfasis en Publicidad y Mercadeo',
                        level: 'licenciatura',
                        description: 'Combina el arte del diseño gráfico con estrategias de publicidad y mercadeo. Los estudiantes desarrollan habilidades en branding, campañas visuales, diseño digital y multimedia, para crear comunicaciones impactantes que conecten con audiencias y objetivos comerciales.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller o su equivalente, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Creatividad, manejo de herramientas de diseño y visión estratégica.',
                        prices: { info: 'Costo mensual estimado: $470. La matrícula inicial es de $220. Costo total del programa puede rondar los $23,500.' }
                    },
                    {
                        id: 'uip-comunicacion-produccion-radio-television-lic',
                        facultyId: 'uip-ingenieria-arquitectura-diseno',
                        universityId: 'uip',
                        name: 'Licenciatura en Comunicación con énfasis en Producción de Radio y Televisión',
                        level: 'licenciatura',
                        description: 'Prepara profesionales en la creación y producción de contenidos audiovisuales para radio y televisión. Los estudiantes adquieren conocimientos en guionismo, dirección, edición, operación de equipos y gestión de proyectos para los medios de comunicación masiva.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller o su equivalente, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Interés en medios, creatividad y habilidades comunicativas.',
                        prices: { info: 'Costo mensual estimado: $465. La matrícula inicial es de $215. Costo total del programa puede rondar los $23,200.' }
                    },
                    {
                        id: 'uip-publicidad-mercadeo-imagen-corporativa-lic',
                        facultyId: 'uip-ingenieria-arquitectura-diseno',
                        universityId: 'uip',
                        name: 'Licenciatura en Publicidad y Mercadeo con énfasis en Imagen Corporativa',
                        level: 'licenciatura',
                        description: 'Enfocada en el desarrollo de estrategias de publicidad y mercadeo para construir y gestionar la imagen de marca de empresas y organizaciones. Los estudiantes aprenden sobre branding, comunicación estratégica, relaciones públicas y campañas digitales.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller o su equivalente, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Visión estratégica y creatividad en la comunicación.',
                        prices: { info: 'Costo mensual estimado: $480. La matrícula inicial es de $220. Costo total del programa puede rondar los $24,000.' }
                    },
                    {
                        id: 'uip-comunicacion-produccion-digital-lic',
                        facultyId: 'uip-ingenieria-arquitectura-diseno',
                        universityId: 'uip',
                        name: 'Licenciatura en Comunicación con énfasis en Producción Digital',
                        level: 'licenciatura',
                        description: 'Forma expertos en la creación de contenido multimedia y digital para diversas plataformas. Los egresados dominarán herramientas de producción de video, audio, animación y diseño web, para generar mensajes impactantes en la era digital.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller o su equivalente, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Interés en las nuevas tecnologías y la comunicación digital.',
                        prices: { info: 'Costo mensual estimado: $475. La matrícula inicial es de $225. Costo total del programa puede rondar los $23,800.' }
                    },
                    // Técnicos Superiores Universitarios - Facultad de Ingeniería, Arquitectura y Diseño
                    {
                        id: 'uip-programacion-analisis-sistemas-tec',
                        facultyId: 'uip-ingenieria-arquitectura-diseno',
                        universityId: 'uip',
                        name: 'Técnico Superior Universitario en Programación y Análisis de Sistemas',
                        level: 'tecnico',
                        description: 'Capacita en los fundamentos de la programación, el desarrollo de aplicaciones y el análisis de sistemas. Los estudiantes adquirirán habilidades prácticas para la codificación, la depuración y el mantenimiento de software, así como para la comprensión de bases de datos.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Aptitud lógica y para el trabajo con computadoras.',
                        prices: { info: 'Costo mensual estimado: $390. La matrícula inicial es de $180. El costo total del programa puede rondar los $9,500.' }
                    },
                    {
                        id: 'uip-procesos-operaciones-industriales-tec',
                        facultyId: 'uip-ingenieria-arquitectura-diseno',
                        universityId: 'uip',
                        name: 'Técnico en Procesos y Operaciones Industriales',
                        level: 'tecnico',
                        description: 'Enfocado en la optimización de la producción y la eficiencia operativa en entornos industriales. Los egresados aprenderán a monitorear procesos, gestionar inventarios, aplicar normas de seguridad y contribuir a la mejora continua en fábricas y plantas.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Interés en la producción y la gestión de la cadena de suministro.',
                        prices: { info: 'Costo mensual estimado: $370. La matrícula inicial es de $170. El costo total del programa puede rondar los $8,800.' }
                    },
                    // Licenciaturas - Facultad de Ciencias Administrativas, Marítima y Portuaria
                    {
                        id: 'uip-administracion-negocios-lic',
                        facultyId: 'uip-ciencias-administrativas-maritima-portuaria',
                        universityId: 'uip',
                        name: 'Licenciatura en Administración de Negocios',
                        level: 'licenciatura',
                        description: 'Ofrece una formación integral en las diversas áreas de la administración empresarial, incluyendo finanzas, marketing, recursos humanos, y operaciones. Prepara a los estudiantes para liderar, gestionar y crear empresas en un entorno global competitivo.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller o su equivalente, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Habilidades de liderazgo y resolución de problemas.',
                        prices: { info: 'Costo mensual estimado: $490. La matrícula inicial es de $230. Costo total del programa puede rondar los $25,000.' }
                    },
                    {
                        id: 'uip-administracion-negocios-distancia-lic',
                        facultyId: 'uip-ciencias-administrativas-maritima-portuaria',
                        universityId: 'uip',
                        name: 'Licenciatura en Administración de Negocios (A Distancia)',
                        level: 'licenciatura',
                        description: 'Modalidad flexible para adquirir una sólida base en administración de negocios, permitiendo a los estudiantes gestionar sus estudios de forma remota. Ideal para quienes buscan avanzar en su carrera profesional sin asistir presencialmente.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller o su equivalente, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Requiere autodisciplina y capacidad de aprendizaje autónomo.',
                        prices: { info: 'Costo mensual estimado: $470. La matrícula inicial es de $220. Costo total del programa puede rondar los $24,000.' }
                    },
                    {
                        id: 'uip-internacional-adm-empresas-hoteleras-lic',
                        facultyId: 'uip-ciencias-administrativas-maritima-portuaria',
                        universityId: 'uip',
                        name: 'Licenciatura Internacional en Administración de Empresas Hoteleras',
                        level: 'licenciatura',
                        description: 'Un programa con perspectiva global que prepara a los estudiantes para la gestión de hoteles y resorts a nivel internacional. Incluye conocimientos en operaciones transculturales, marketing turístico global y normativas internacionales de la industria.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller o su equivalente, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Interés en la hotelería internacional y dominio de idiomas.',
                        prices: { info: 'Costo mensual estimado: $510. La matrícula inicial es de $240. Costo total del programa puede rondar los $26,000.' }
                    },
                    {
                        id: 'uip-contabilidad-lic',
                        facultyId: 'uip-ciencias-administrativas-maritima-portuaria',
                        universityId: 'uip',
                        name: 'Licenciatura en Contabilidad',
                        level: 'licenciatura',
                        description: 'Forma contadores públicos con expertise en normas contables, auditoría, impuestos, y análisis financiero. Los egresados estarán preparados para gestionar la información económica de empresas, garantizando la transparencia y el cumplimiento normativo.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller o su equivalente, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Habilidades numéricas y atención al detalle.',
                        prices: { info: 'Costo mensual estimado: $480. La matrícula inicial es de $220. Costo total del programa puede rondar los $24,500.' }
                    },
                    {
                        id: 'uip-contabilidad-distancia-lic',
                        facultyId: 'uip-ciencias-administrativas-maritima-portuaria',
                        universityId: 'uip',
                        name: 'Licenciatura en Contabilidad (A distancia)',
                        level: 'licenciatura',
                        description: 'Permite a los estudiantes adquirir una sólida formación en contabilidad a través de una metodología a distancia. Ideal para quienes ya trabajan y desean una titulación que les permita crecer profesionalmente en el ámbito financiero y de auditoría.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller o su equivalente, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Disciplina y manejo de herramientas informáticas básicas.',
                        prices: { info: 'Costo mensual estimado: $460. La matrícula inicial es de $210. Costo total del programa puede rondar los $23,500.' }
                    },
                    {
                        id: 'uip-administracion-recursos-humanos-lic',
                        facultyId: 'uip-ciencias-administrativas-maritima-portuaria',
                        universityId: 'uip',
                        name: 'Licenciatura en Administración de Recursos Humanos',
                        level: 'licenciatura',
                        description: 'Capacita a profesionales para gestionar el capital humano de una organización, incluyendo reclutamiento, selección, capacitación, evaluación del desempeño, compensaciones y relaciones laborales, con el fin de optimizar el talento y el ambiente de trabajo.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller o su equivalente, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Habilidades interpersonales y ética profesional.',
                        prices: { info: 'Costo mensual estimado: $470. La matrícula inicial es de $220. Costo total del programa puede rondar los $24,000.' }
                    },
                    {
                        id: 'uip-banca-finanzas-lic',
                        facultyId: 'uip-ciencias-administrativas-maritima-portuaria',
                        universityId: 'uip',
                        name: 'Licenciatura en Banca y Finanzas',
                        level: 'licenciatura',
                        description: 'Prepara especialistas en el sector financiero, con conocimientos en mercados de valores, inversiones, gestión de riesgos, análisis de crédito y banca digital. Los egresados estarán listos para trabajar en bancos, casas de bolsa y otras instituciones financieras.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller o su equivalente, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Aptitud numérica y análisis de datos.',
                        prices: { info: 'Costo mensual estimado: $500. La matrícula inicial es de $230. Costo total del programa puede rondar los $25,500.' }
                    },
                    {
                        id: 'uip-banca-finanzas-distancia-lic',
                        facultyId: 'uip-ciencias-administrativas-maritima-portuaria',
                        universityId: 'uip',
                        name: 'Licenciatura en Banca y Finanzas (A distancia)',
                        level: 'licenciatura',
                        description: 'Esta modalidad flexible permite a los estudiantes adquirir una sólida formación en banca y finanzas, abordando temas clave como la inversión, gestión de carteras y análisis económico, adaptándose a las necesidades de profesionales del sector financiero.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller o su equivalente, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Requiere autogestión y acceso a plataformas de estudio online.',
                        prices: { info: 'Costo mensual estimado: $480. La matrícula inicial es de $220. Costo total del programa puede rondar los $24,500.' }
                    },
                    {
                        id: 'uip-comercio-internacional-lic',
                        facultyId: 'uip-ciencias-administrativas-maritima-portuaria',
                        universityId: 'uip',
                        name: 'Licenciatura en Comercio Internacional',
                        level: 'licenciatura',
                        description: 'Forma expertos en las dinámicas del comercio global, incluyendo logística internacional, aduanas, financiación del comercio y estrategias de exportación/importación. Prepara profesionales para negociar y gestionar operaciones en mercados mundiales.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller o su equivalente, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Interés en la economía global y cultura internacional.',
                        prices: { info: 'Costo mensual estimado: $495. La matrícula inicial es de $235. Costo total del programa puede rondar los $25,000.' }
                    },
                    {
                        id: 'uip-negocios-internacionales-lic',
                        facultyId: 'uip-ciencias-administrativas-maritima-portuaria',
                        universityId: 'uip',
                        name: 'Licenciatura en Negocios Internacionales',
                        level: 'licenciatura',
                        description: 'Capacita a los estudiantes para identificar oportunidades de negocio a nivel mundial, desarrollar estrategias de expansión internacional, y gestionar empresas en contextos multiculturales, con énfasis en el emprendimiento y la innovación global.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller o su equivalente, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Visión global y aptitud para los idiomas.',
                        prices: { info: 'Costo mensual estimado: $505. La matrícula inicial es de $245. Costo total del programa puede rondar los $25,800.' }
                    },
                    {
                        id: 'uip-negocios-internacionales-distancia-lic',
                        facultyId: 'uip-ciencias-administrativas-maritima-portuaria',
                        universityId: 'uip',
                        name: 'Licenciatura en Negocios Internacionales (A distancia)',
                        level: 'licenciatura',
                        description: 'Ofrece una formación flexible en la gestión de negocios a escala global, abarcando comercio exterior, finanzas internacionales y estrategias de mercado. Ideal para profesionales con experiencia que buscan una titulación para escalar en el ámbito multinacional.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller o su equivalente, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Requiere autonomía y capacidad de investigación.',
                        prices: { info: 'Costo mensual estimado: $485. La matrícula inicial es de $225. Costo total del programa puede rondar los $24,800.' }
                    },
                    {
                        id: 'uip-recursos-humanos-distancia-lic',
                        facultyId: 'uip-ciencias-administrativas-maritima-portuaria',
                        universityId: 'uip',
                        name: 'Licenciatura en Recursos Humanos a Distancia',
                        level: 'licenciatura',
                        description: 'Permite a los estudiantes especializarse en la gestión de personas en las organizaciones, con un enfoque en la modalidad a distancia. Cubre temas como la captación de talento, desarrollo organizacional, legislación laboral y gestión del bienestar en el entorno laboral moderno.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller o su equivalente, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Habilidades de comunicación y empatía.',
                        prices: { info: 'Costo mensual estimado: $465. La matrícula inicial es de $215. Costo total del programa puede rondar los $23,700.' }
                    },
                    {
                        id: 'uip-comportamiento-organizacional-desarrollo-humano-lic',
                        facultyId: 'uip-ciencias-administrativas-maritima-portuaria',
                        universityId: 'uip',
                        name: 'Licenciatura en Comportamiento Organizacional y Desarrollo Humano',
                        level: 'licenciatura',
                        description: 'Se enfoca en la comprensión de la conducta humana en el ámbito laboral y en el desarrollo de estrategias para mejorar el clima organizacional, la productividad y el bienestar de los empleados. Ideal para quienes buscan roles de liderazgo en gestión de talento y cultura empresarial.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller o su equivalente, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Interés en psicología organizacional y gestión de equipos.',
                        prices: { info: 'Costo mensual estimado: $480. La matrícula inicial es de $220. Costo total del programa puede rondar los $24,500.' }
                    },
                    {
                        id: 'uip-gestion-logistica-transporte-internacional-mercancias',
                        facultyId: 'uip-ciencias-administrativas-maritima-portuaria',
                        universityId: 'uip',
                        name: 'Licenciatura en Gestión Logística y Transporte Internacional de Mercancías',
                        level: 'licenciatura',
                        description: 'Forma profesionales en la planificación, implementación y control eficiente de la cadena de suministro global. Los estudiantes aprenderán sobre gestión de inventarios, transporte multimodal, legislación aduanera y optimización de flujos de mercancías a nivel internacional.',
                        sedes: ['Campus UIP', 'La Chorrera'],
                        admission_guide: 'Copia de diploma de bachiller o su equivalente, historial académico, copia de cédula o pasaporte, dos fotos tamaño carné, y completar el formulario de admisión. Interés en la cadena de suministro y comercio exterior.',
                        prices: { info: 'Costo mensual estimado: $515. La matrícula inicial es de $250. Costo total del programa puede rondar los $26,500.' }
                    }
                ];
              break 
              case 'udelistmo':
              universityName = "Universidad del Istmo";

                    facultadesToSeed = [
                        { id: 'udelistmo-ingenierias-tecnologias-informacion', universityId: 'udelistmo', name: 'Facultad de Ingenierías y Tecnologías de la Información' },
                        { id: 'udelistmo-ciencias-administrativas-financieras', universityId: 'udelistmo', name: 'Facultad de Ciencias Administrativas y Financieras' },
                        { id: 'udelistmo-educacion-ciencias-sociales', universityId: 'udelistmo', name: 'Facultad de Educación y Ciencias Sociales' },
                        { id: 'udelistmo-derecho-ciencias-politicas', universityId: 'udelistmo', name: 'Facultad de Derecho y Ciencias Políticas' }
                    ];

                    programasToSeed = [
                        // Licenciaturas
                        {
                            id: 'udelistmo-ingenieria-ciberseguridad-lic',
                            facultyId: 'udelistmo-ingenierias-tecnologias-informacion',
                            universityId: 'udelistmo',
                            name: 'Licenciatura en Ingeniería en Ciberseguridad',
                            level: 'licenciatura',
                            description: 'Forma profesionales con las habilidades necesarias para gestionar soluciones de prevención, detección, protección y respuesta ante ataques de seguridad de la información, incluyendo el desarrollo de auditorías y el diseño de arquitecturas de software orientadas a la seguridad.',
                            sedes: ['Panamá', 'Metromall'],
                            modalidad: 'Presencial',
                            duracion: '12 Cuatrimestres',
                            inicio: '8 de septiembre de 2025',
                            admission_guide: 'Escanea tu diploma original de Bachiller y guárdalo en formato PDF (vertical y legible). Escanea tus créditos originales de estudio de los últimos tres años de colegio (vertical y legible). Presentar el original y copia de la cédula. Escanea dos fotografías fondo blanco tamaño Carné (4 x 3 centímetros). Adjuntar el pago de inscripción. Si has realizado estudios universitarios previos, presentar original y copia de los créditos universitarios para convalidaciones. No se aceptan pagos en efectivo en ninguna sede.',
                            prices: { info: 'Inscripción $30.00. Para el primer cuatrimestre, 2 mensualidades de $138.75 (para un bloque de 3 materias). Precios regulares se aplicarán a partir del segundo cuatrimestre. Beca del 40% sobre la inversión regular de $140.00 por asignatura, quedando en $84.00 por asignatura.' }
                        },
                        {
                            id: 'udelistmo-ingenieria-ciberseguridad-virtual-lic',
                            facultyId: 'udelistmo-ingenierias-tecnologias-informacion',
                            universityId: 'udelistmo',
                            name: 'Licenciatura en Ingeniería en Ciberseguridad - Virtual',
                            level: 'licenciatura',
                            description: 'Forma profesionales con las habilidades necesarias para gestionar soluciones de prevención, detección, protección y respuesta ante ataques de seguridad de la información, incluyendo el desarrollo de auditorías y el diseño de arquitecturas de software orientadas a la seguridad.',
                            sedes: ['Nacional (virtual)'],
                            modalidad: 'Virtual',
                            duracion: '12 Cuatrimestres',
                            inicio: '7 de julio de 2025',
                            admission_guide: 'Escanea tu diploma original de Bachiller y guárdalo en formato PDF (vertical y legible). Escanea tus créditos originales de estudio de los últimos tres años de colegio (vertical y legible). Presentar el original y copia de la cédula. Escanea dos fotografías fondo blanco tamaño Carné (4 x 3 centímetros). Adjuntar el pago de inscripción. Si has realizado estudios universitarios previos, presentar original y copia de los créditos universitarios para convalidaciones. No se aceptan pagos en efectivo en ninguna sede.',
                            prices: { info: 'Inscripción $30.00. Para el primer cuatrimestre, 2 mensualidades de $138.75 (para un bloque de 3 materias). Precios regulares se aplicarán a partir del segundo cuatrimestre. Beca del 40% sobre la inversión regular de $140.00 por asignatura, quedando en $84.00 por asignatura.' }
                        },
                        {
                            id: 'udelistmo-administracion-sistemas-lic',
                            facultyId: 'udelistmo-ingenierias-tecnologias-informacion',
                            universityId: 'udelistmo',
                            name: 'Licenciatura en Administración de Sistemas',
                            level: 'licenciatura',
                            description: 'No disponible.',
                            sedes: ['Nacional (virtual)'],
                            modalidad: 'Virtual',
                            duracion: '11 Cuatrimestres',
                            inicio: '7 de julio de 2025',
                            admission_guide: 'Escanea tu diploma original de Bachiller y guárdalo en formato PDF (vertical y legible). Escanea tus créditos originales de estudio de los últimos tres años de colegio (vertical y legible). Presentar el original y copia de la cédula. Escanea dos fotografías fondo blanco tamaño Carné (4 x 3 centímetros). Adjuntar el pago de inscripción. Si has realizado estudios universitarios previos, presentar original y copia de los créditos universitarios para convalidaciones. No se aceptan pagos en efectivo en ninguna sede.',
                            prices: { info: 'Inscripción $30.00. Para el primer cuatrimestre, 2 mensualidades de $138.75 (para un bloque de 3 materias). Precios regulares se aplicarán a partir del segundo cuatrimestre. Beca del 40% sobre la inversión regular de $140.00 por asignatura, quedando en $84.00 por asignatura.' }
                        },
                        {
                            id: 'udelistmo-negocios-internacionales-lic',
                            facultyId: 'udelistmo-ciencias-administrativas-financieras',
                            universityId: 'udelistmo',
                            name: 'Licenciatura de Negocios Internacionales',
                            level: 'licenciatura',
                            description: 'No disponible.',
                            sedes: ['Nacional (virtual)'],
                            modalidad: 'Virtual',
                            duracion: '11 Cuatrimestres',
                            inicio: '7 de julio de 2025',
                            admission_guide: 'Escanea tu diploma original de Bachiller y guárdalo en formato PDF (vertical y legible). Escanea tus créditos originales de estudio de los últimos tres años de colegio (vertical y legible). Presentar el original y copia de la cédula. Escanea dos fotografías fondo blanco tamaño Carné (4 x 3 centímetros). Adjuntar el pago de inscripción. Si has realizado estudios universitarios previos, presentar original y copia de los créditos universitarios para convalidaciones. No se aceptan pagos en efectivo en ninguna sede.',
                            prices: { info: 'Inscripción $30.00. Para el primer cuatrimestre, 2 mensualidades de $138.75 (para un bloque de 3 materias). Precios regulares se aplicarán a partir del segundo cuatrimestre. Beca del 40% sobre la inversión regular de $140.00 por asignatura, quedando en $84.00 por asignatura.' }
                        },
                        {
                            id: 'udelistmo-mercadeo-publicidad-virtual-lic',
                            facultyId: 'udelistmo-ciencias-administrativas-financieras',
                            universityId: 'udelistmo',
                            name: 'Licenciatura en Mercadeo y Publicidad Virtual',
                            level: 'licenciatura',
                            description: 'No disponible.',
                            sedes: ['Nacional (virtual)'],
                            modalidad: 'Virtual',
                            duracion: '11 Cuatrimestres',
                            inicio: '7 de julio de 2025',
                            admission_guide: 'Escanea tu diploma original de Bachiller y guárdalo en formato PDF (vertical y legible). Escanea tus créditos originales de estudio de los últimos tres años de colegio (vertical y legible). Presentar el original y copia de la cédula. Escanea dos fotografías fondo blanco tamaño Carné (4 x 3 centímetros). Adjuntar el pago de inscripción. Si has realizado estudios universitarios previos, presentar original y copia de los créditos universitarios para convalidaciones. No se aceptan pagos en efectivo en ninguna sede.',
                            prices: { info: 'Inscripción $30.00. Para el primer cuatrimestre, 2 mensualidades de $138.75 (para un bloque de 3 materias). Precios regulares se aplicarán a partir del segundo cuatrimestre. Beca del 40% sobre la inversión regular de $140.00 por asignatura, quedando en $84.00 por asignatura.' }
                        },
                        {
                            id: 'udelistmo-administracion-finanzas-lic',
                            facultyId: 'udelistmo-ciencias-administrativas-financieras',
                            universityId: 'udelistmo',
                            name: 'Licenciatura en Administración de Finanzas',
                            level: 'licenciatura',
                            description: 'No disponible.',
                            sedes: ['Nacional (virtual)'],
                            modalidad: 'Virtual',
                            duracion: '12 Cuatrimestres',
                            inicio: '7 de julio de 2025',
                            admission_guide: 'Escanea tu diploma original de Bachiller y guárdalo en formato PDF (vertical y legible). Escanea tus créditos originales de estudio de los últimos tres años de colegio (vertical y legible). Presentar el original y copia de la cédula. Escanea dos fotografías fondo blanco tamaño Carné (4 x 3 centímetros). Adjuntar el pago de inscripción. Si has realizado estudios universitarios previos, presentar original y copia de los créditos universitarios para convalidaciones. No se aceptan pagos en efectivo en ninguna sede.',
                            prices: { info: 'Inscripción $30.00. Para el primer cuatrimestre, 2 mensualidades de $138.75 (para un bloque de 3 materias). Precios regulares se aplicarán a partir del segundo cuatrimestre. Beca del 40% sobre la inversión regular de $140.00 por asignatura, quedando en $84.00 por asignatura.' }
                        },
                        {
                            id: 'udelistmo-administracion-negocios-maritimos-puertos-transporte-multimodal-virtual-lic',
                            facultyId: 'udelistmo-ciencias-administrativas-financieras',
                            universityId: 'udelistmo',
                            name: 'Licenciatura en Administración de Negocios Marítimos con énfasis en Puertos y Transporte Multimodal Virtual',
                            level: 'licenciatura',
                            description: 'No disponible.',
                            sedes: ['Nacional (virtual)'],
                            modalidad: 'Virtual',
                            duracion: '11 Cuatrimestres',
                            inicio: '7 de julio de 2025',
                            admission_guide: 'Escanea tu diploma original de Bachiller y guárdalo en formato PDF (vertical y legible). Escanea tus créditos originales de estudio de los últimos tres años de colegio (vertical y legible). Presentar el original y copia de la cédula. Escanea dos fotografías fondo blanco tamaño Carné (4 x 3 centímetros). Adjuntar el pago de inscripción. Si has realizado estudios universitarios previos, presentar original y copia de los créditos universitarios para convalidaciones. No se aceptan pagos en efectivo en ninguna sede.',
                            prices: { info: 'Inscripción $30.00. Para el primer cuatrimestre, 2 mensualidades de $138.75 (para un bloque de 3 materias). Precios regulares se aplicarán a partir del segundo cuatrimestre. Beca del 40% sobre la inversión regular de $140.00 por asignatura, quedando en $84.00 por asignatura.' }
                        },
                        {
                            id: 'udelistmo-administracion-negocios-maritimos-puertos-transporte-multimodal-presencial-lic',
                            facultyId: 'udelistmo-ciencias-administrativas-financieras',
                            universityId: 'udelistmo',
                            name: 'Licenciatura en Administración de Negocios Marítimos con énfasis en Puertos y Transporte Multimodal',
                            level: 'licenciatura',
                            description: 'No disponible.',
                            sedes: ['Panamá', 'Metromall'], // Corregido: añadido sedes
                            modalidad: 'Presencial',
                            duracion: '11 Cuatrimestres',
                            inicio: '8 de septiembre de 2025',
                            admission_guide: 'Escanea tu diploma original de Bachiller y guárdalo en formato PDF (vertical y legible). Escanea tus créditos originales de estudio de los últimos tres años de colegio (vertical y legible). Presentar el original y copia de la cédula. Escanea dos fotografías fondo blanco tamaño Carné (4 x 3 centímetros). Adjuntar el pago de inscripción. Si has realizado estudios universitarios previos, presentar original y copia de los créditos universitarios para convalidaciones. No se aceptan pagos en efectivo en ninguna sede.',
                            prices: { info: 'Inscripción $30.00. Para el primer cuatrimestre, 2 mensualidades de $138.75 (para un bloque de 3 materias). Precios regulares se aplicarán a partir del segundo cuatrimestre. Beca del 40% sobre la inversión regular de $140.00 por asignatura, quedando en $84.00 por asignatura.' }
                        },
                        {
                            id: 'udelistmo-administracion-empresas-virtual-lic',
                            facultyId: 'udelistmo-ciencias-administrativas-financieras',
                            universityId: 'udelistmo',
                            name: 'Licenciatura en Administración de Empresas Virtual',
                            level: 'licenciatura',
                            description: 'No disponible.',
                            sedes: ['Nacional (virtual)'],
                            modalidad: 'Virtual',
                            duracion: '11 Cuatrimestres',
                            inicio: '7 de julio de 2025',
                            admission_guide: 'Escanea tu diploma original de Bachiller y guárdalo en formato PDF (vertical y legible). Escanea tus créditos originales de estudio de los últimos tres años de colegio (vertical y legible). Presentar el original y copia de la cédula. Escanea dos fotografías fondo blanco tamaño Carné (4 x 3 centímetros). Adjuntar el pago de inscripción. Si has realizado estudios universitarios previos, presentar original y copia de los créditos universitarios para convalidaciones. No se aceptan pagos en efectivo en ninguna sede.',
                            prices: { info: 'Inscripción $30.00. Para el primer cuatrimestre, 2 mensualidades de $138.75 (para un bloque de 3 materias). Precios regulares se aplicarán a partir del segundo cuatrimestre. Beca del 40% sobre la inversión regular de $140.00 por asignatura, quedando en $84.00 por asignatura.' }
                        },
                        {
                            id: 'udelistmo-administracion-empresas-presencial-lic',
                            facultyId: 'udelistmo-ciencias-administrativas-financieras',
                            universityId: 'udelistmo',
                            name: 'Licenciatura en Administración de Empresas',
                            level: 'licenciatura',
                            description: 'No disponible.',
                            sedes: ['Panamá', 'Metromall'], // Corregido: añadido sedes
                            modalidad: 'Presencial',
                            duracion: '11 Cuatrimestres',
                            inicio: '8 de septiembre de 2025',
                            admission_guide: 'Escanea tu diploma original de Bachiller y guárdalo en formato PDF (vertical y legible). Escanea tus créditos originales de estudio de los últimos tres años de colegio (vertical y legible). Presentar el original y copia de la cédula. Escanea dos fotografías fondo blanco tamaño Carné (4 x 3 centímetros). Adjuntar el pago de inscripción. Si has realizado estudios universitarios previos, presentar original y copia de los créditos universitarios para convalidaciones. No se aceptan pagos en efectivo en ninguna sede.',
                            prices: { info: 'Inscripción $30.00. Para el primer cuatrimestre, 2 mensualidades de $138.75 (para un bloque de 3 materias). Precios regulares se aplicarán a partir del segundo cuatrimestre. Beca del 40% sobre la inversión regular de $140.00 por asignatura, quedando en $84.00 por asignatura.' }
                        },
                        {
                            id: 'udelistmo-logistica-virtual-lic',
                            facultyId: 'udelistmo-ciencias-administrativas-financieras',
                            universityId: 'udelistmo',
                            name: 'Licenciatura en Logística Virtual',
                            level: 'licenciatura',
                            description: 'No disponible.',
                            sedes: ['Nacional (virtual)'],
                            modalidad: 'Virtual',
                            duracion: '11 Cuatrimestres',
                            inicio: '7 de julio de 2025',
                            admission_guide: 'Escanea tu diploma original de Bachiller y guárdalo en formato PDF (vertical y legible). Escanea tus créditos originales de estudio de los últimos tres años de colegio (vertical y legible). Presentar el original y copia de la cédula. Escanea dos fotografías fondo blanco tamaño Carné (4 x 3 centímetros). Adjuntar el pago de inscripción. Si has realizado estudios universitarios previos, presentar original y copia de los créditos universitarios para convalidaciones. No se aceptan pagos en efectivo en ninguna sede.',
                            prices: { info: 'Inscripción $30.00. Para el primer cuatrimestre, 2 mensualidades de $138.75 (para un bloque de 3 materias). Precios regulares se aplicarán a partir del segundo cuatrimestre. Beca del 40% sobre la inversión regular de $140.00 por asignatura, quedando en $84.00 por asignatura.' }
                        },
                        {
                            id: 'udelistmo-logistica-presencial-lic',
                            facultyId: 'udelistmo-ciencias-administrativas-financieras',
                            universityId: 'udelistmo',
                            name: 'Licenciatura en Logística',
                            level: 'licenciatura',
                            description: 'No disponible.',
                            sedes: ['Panamá', 'Metromall'], // Corregido: añadido sedes
                            modalidad: 'Presencial',
                            duracion: '11 Cuatrimestres',
                            inicio: '8 de septiembre de 2025',
                            admission_guide: 'Escanea tu diploma original de Bachiller y guárdalo en formato PDF (vertical y legible). Escanea tus créditos originales de estudio de los últimos tres años de colegio (vertical y legible). Presentar el original y copia de la cédula. Escanea dos fotografías fondo blanco tamaño Carné (4 x 3 centímetros). Adjuntar el pago de inscripción. Si has realizado estudios universitarios previos, presentar original y copia de los créditos universitarios para convalidaciones. No se aceptan pagos en efectivo en ninguna sede.',
                            prices: { info: 'Inscripción $30.00. Para el primer cuatrimestre, 2 mensualidades de $138.75 (para un bloque de 3 materias). Precios regulares se aplicarán a partir del segundo cuatrimestre. Beca del 40% sobre la inversión regular de $140.00 por asignatura, quedando en $84.00 por asignatura.' }
                        },
                        {
                            id: 'udelistmo-gestion-talento-humano-lic',
                            facultyId: 'udelistmo-ciencias-administrativas-financieras',
                            universityId: 'udelistmo',
                            name: 'Licenciatura en Gestión del Talento Humano',
                            level: 'licenciatura',
                            description: 'No disponible.',
                            sedes: ['Nacional (virtual)'],
                            modalidad: 'Virtual',
                            duracion: '11 Cuatrimestres',
                            inicio: '7 de julio de 2025',
                            admission_guide: 'Escanea tu diploma original de Bachiller y guárdalo en formato PDF (vertical y legible). Escanea tus créditos originales de estudio de los últimos tres años de colegio (vertical y legible). Presentar el original y copia de la cédula. Escanea dos fotografías fondo blanco tamaño Carné (4 x 3 centímetros). Adjuntar el pago de inscripción. Si has realizado estudios universitarios previos, presentar original y copia de los créditos universitarios para convalidaciones. No se aceptan pagos en efectivo en ninguna sede.',
                            prices: { info: 'Inscripción $30.00. Para el primer cuatrimestre, 2 mensualidades de $138.75 (para un bloque de 3 materias). Precios regulares se aplicarán a partir del segundo cuatrimestre. Beca del 40% sobre la inversión regular de $140.00 por asignatura, quedando en $84.00 por asignatura.' }
                        },
                        {
                            id: 'udelistmo-gestion-riesgo-seguros-lic',
                            facultyId: 'udelistmo-ciencias-administrativas-financieras',
                            universityId: 'udelistmo',
                            name: 'Licenciatura en Gestión del Riesgo y Seguros',
                            level: 'licenciatura',
                            description: 'No disponible.',
                            sedes: ['Panamá', 'Metromall'], // Corregido: añadido sedes
                            modalidad: 'Presencial',
                            duracion: '11 Cuatrimestres', // Corregido: establecido para consistencia
                            inicio: '8 de septiembre de 2025', // Corregido: establecido para consistencia
                            admission_guide: 'Escanea tu diploma original de Bachiller y guárdalo en formato PDF (vertical y legible). Escanea tus créditos originales de estudio de los últimos tres años de colegio (vertical y legible). Presentar el original y copia de la cédula. Escanea dos fotografías fondo blanco tamaño Carné (4 x 3 centímetros). Adjuntar el pago de inscripción. Si has realizado estudios universitarios previos, presentar original y copia de los créditos universitarios para convalidaciones. No se aceptan pagos en efectivo en ninguna sede.',
                            prices: { info: 'Inscripción $30.00. Para el primer cuatrimestre, 2 mensualidades de $138.75 (para un bloque de 3 materias). Precios regulares se aplicarán a partir del segundo cuatrimestre. Beca del 40% sobre la inversión regular de $140.00 por asignatura, quedando en $84.00 por asignatura.' }
                        },
                        {
                            id: 'udelistmo-contabilidad-lic',
                            facultyId: 'udelistmo-ciencias-administrativas-financieras',
                            universityId: 'udelistmo',
                            name: 'Licenciatura en Contabilidad',
                            level: 'licenciatura',
                            description: 'No disponible.',
                            sedes: ['Panamá', 'Metromall'], // Corregido: añadido sedes
                            modalidad: 'Presencial',
                            duracion: '11 Cuatrimestres', // Corregido: establecido para consistencia
                            inicio: '8 de septiembre de 2025', // Corregido: establecido para consistencia
                            admission_guide: 'Escanea tu diploma original de Bachiller y guárdalo en formato PDF (vertical y legible). Escanea tus créditos originales de estudio de los últimos tres años de colegio (vertical y legible). Presentar el original y copia de la cédula. Escanea dos fotografías fondo blanco tamaño Carné (4 x 3 centímetros). Adjuntar el pago de inscripción. Si has realizado estudios universitarios previos, presentar original y copia de los créditos universitarios para convalidaciones. No se aceptan pagos en efectivo en ninguna sede.',
                            prices: { info: 'Inscripción $30.00. Para el primer cuatrimestre, 2 mensualidades de $138.75 (para un bloque de 3 materias). Precios regulares se aplicarán a partir del segundo cuatrimestre. Beca del 40% sobre la inversión regular de $140.00 por asignatura, quedando en $84.00 por asignatura.' }
                        },
                        {
                            id: 'udelistmo-comunicacion-social-virtual-lic',
                            facultyId: 'udelistmo-educacion-ciencias-sociales',
                            universityId: 'udelistmo',
                            name: 'Licenciatura en Comunicación Social Virtual',
                            level: 'licenciatura',
                            description: 'No disponible.',
                            sedes: ['Nacional (virtual)'],
                            modalidad: 'Virtual',
                            duracion: '11 Cuatrimestres',
                            inicio: '7 de julio de 2025',
                            admission_guide: 'Escanea tu diploma original de Bachiller y guárdalo en formato PDF (vertical y legible). Escanea tus créditos originales de estudio de los últimos tres años de colegio (vertical y legible). Presentar el original y copia de la cédula. Escanea dos fotografías fondo blanco tamaño Carné (4 x 3 centímetros). Adjuntar el pago de inscripción. Si has realizado estudios universitarios previos, presentar original y copia de los créditos universitarios para convalidaciones. No se aceptan pagos en efectivo en ninguna sede.',
                            prices: { info: 'Inscripción $30.00. Para el primer cuatrimestre, 2 mensualidades de $138.75 (para un bloque de 3 materias). Precios regulares se aplicarán a partir del segundo cuatrimestre. Beca del 40% sobre la inversión regular de $140.00 por asignatura, quedando en $84.00 por asignatura.' }
                        },
                        {
                            id: 'udelistmo-docencia-idioma-ingles-lic',
                            facultyId: 'udelistmo-educacion-ciencias-sociales',
                            universityId: 'udelistmo',
                            name: 'Licenciatura en Docencia del Idioma Inglés',
                            level: 'licenciatura',
                            description: 'No disponible.',
                            sedes: ['Nacional (virtual)'],
                            modalidad: 'Virtual',
                            duracion: '11 Cuatrimestres',
                            inicio: '7 de julio de 2025',
                            admission_guide: 'Escanea tu diploma original de Bachiller y guárdalo en formato PDF (vertical y legible). Escanea tus créditos originales de estudio de los últimos tres años de colegio (vertical y legible). Presentar el original y copia de la cédula. Escanea dos fotografías fondo blanco tamaño Carné (4 x 3 centímetros). Adjuntar el pago de inscripción. Si has realizado estudios universitarios previos, presentar original y copia de los créditos universitarios para convalidaciones. No se aceptan pagos en efectivo en ninguna sede.',
                            prices: { info: 'Inscripción $30.00. Para el primer cuatrimestre, 2 mensualidades de $138.75 (para un bloque de 3 materias). Precios regulares se aplicarán a partir del segundo cuatrimestre. Beca del 40% sobre la inversión regular de $140.00 por asignatura, quedando en $84.00 por asignatura.' }
                        },
                        {
                            id: 'udelistmo-psicologia-presencial-lic',
                            facultyId: 'udelistmo-educacion-ciencias-sociales',
                            universityId: 'udelistmo',
                            name: 'Licenciatura en Psicología',
                            level: 'licenciatura',
                            description: 'No disponible.',
                            sedes: ['Panamá', 'Metromall'], // Corregido: añadido sedes
                            modalidad: 'Presencial',
                            duracion: '12 Cuatrimestres',
                            inicio: '8 de septiembre de 2025',
                            admission_guide: 'Escanea tu diploma original de Bachiller y guárdalo en formato PDF (vertical y legible). Escanea tus créditos originales de estudio de los últimos tres años de colegio (vertical y legible). Presentar el original y copia de la cédula. Escanea dos fotografías fondo blanco tamaño Carné (4 x 3 centímetros). Adjuntar el pago de inscripción. Si has realizado estudios universitarios previos, presentar original y copia de los créditos universitarios para convalidaciones. No se aceptan pagos en efectivo en ninguna sede.',
                            prices: { info: 'Inscripción $30.00. Para el primer cuatrimestre, 2 mensualidades de $138.75 (para un bloque de 3 materias). Precios regulares se aplicarán a partir del segundo cuatrimestre. Beca del 40% sobre la inversión regular de $140.00 por asignatura, quedando en $84.00 por asignatura.' }
                        },
                        {
                            id: 'udelistmo-psicologia-virtual-lic',
                            facultyId: 'udelistmo-educacion-ciencias-sociales',
                            universityId: 'udelistmo',
                            name: 'Licenciatura en Psicología Virtual',
                            level: 'licenciatura',
                            description: 'No disponible.',
                            sedes: ['Nacional (virtual)'],
                            modalidad: 'Virtual',
                            duracion: '12 Cuatrimestres',
                            inicio: '7 de julio de 2025',
                            admission_guide: 'Escanea tu diploma original de Bachiller y guárdalo en formato PDF (vertical y legible). Escanea tus créditos originales de estudio de los últimos tres años de colegio (vertical y legible). Presentar el original y copia de la cédula. Escanea dos fotografías fondo blanco tamaño Carné (4 x 3 centímetros). Adjuntar el pago de inscripción. Si has realizado estudios universitarios previos, presentar original y copia de los créditos universitarios para convalidaciones. No se aceptan pagos en efectivo en ninguna sede.',
                            prices: { info: 'Inscripción $30.00. Para el primer cuatrimestre, 2 mensualidades de $138.75 (para un bloque de 3 materias). Precios regulares se aplicarán a partir del segundo cuatrimestre. Beca del 40% sobre la inversión regular de $140.00 por asignatura, quedando en $84.00 por asignatura.' }
                        },
                        {
                            id: 'udelistmo-derecho-ciencias-politicas-semipresencial-lic',
                            facultyId: 'udelistmo-derecho-ciencias-politicas',
                            universityId: 'udelistmo',
                            name: 'Licenciatura en Derecho y Ciencias Políticas',
                            level: 'licenciatura',
                            description: 'No disponible.',
                            sedes: ['Panamá', 'Metromall'], // Corregido: añadido sedes
                            modalidad: 'Semipresencial',
                            duracion: '12 Cuatrimestres',
                            inicio: '8 de septiembre de 2025',
                            admission_guide: 'Escanea tu diploma original de Bachiller y guárdalo en formato PDF (vertical y legible). Escanea tus créditos originales de estudio de los últimos tres años de colegio (vertical y legible). Presentar el original y copia de la cédula. Escanea dos fotografías fondo blanco tamaño Carné (4 x 3 centímetros). Adjuntar el pago de inscripción. Si has realizado estudios universitarios previos, presentar original y copia de los créditos universitarios para convalidaciones. No se aceptan pagos en efectivo en ninguna sede.',
                            prices: { info: 'Inscripción $30.00. Para el primer cuatrimestre, 2 mensualidades de $138.75 (para un bloque de 3 materias). Precios regulares se aplicarán a partir del segundo cuatrimestre. Beca del 40% sobre la inversión regular de $140.00 por asignatura, quedando en $84.00 por asignatura.' }
                        },
                        {
                            id: 'udelistmo-derecho-ciencias-politicas-virtual-lic',
                            facultyId: 'udelistmo-derecho-ciencias-politicas',
                            universityId: 'udelistmo',
                            name: 'Licenciatura en Derecho y Ciencias Políticas Virtual',
                            level: 'licenciatura',
                            description: 'No disponible.',
                            sedes: ['Nacional (virtual)'],
                            modalidad: 'Virtual',
                            duracion: '12 Cuatrimestres',
                            inicio: '7 de julio de 2025',
                            admission_guide: 'Escanea tu diploma original de Bachiller y guárdalo en formato PDF (vertical y legible). Escanea tus créditos originales de estudio de los últimos tres años de colegio (vertical y legible). Presentar el original y copia de la cédula. Escanea dos fotografías fondo blanco tamaño Carné (4 x 3 centímetros). Adjuntar el pago de inscripción. Si has realizado estudios universitarios previos, presentar original y copia de los créditos universitarios para convalidaciones. No se aceptan pagos en efectivo en ninguna sede.',
                            prices: { info: 'Inscripción $30.00. Para el primer cuatrimestre, 2 mensualidades de $138.75 (para un bloque de 3 materias). Precios regulares se aplicarán a partir del segundo cuatrimestre. Beca del 40% sobre la inversión regular de $140.00 por asignatura, quedando en $84.00 por asignatura.' }
                        },
                        {
                            id: 'udelistmo-criminalistica-presencial-lic',
                            facultyId: 'udelistmo-derecho-ciencias-politicas',
                            universityId: 'udelistmo',
                            name: 'Licenciatura en Criminalística',
                            level: 'licenciatura',
                            description: 'No disponible.',
                            sedes: ['Panamá', 'Metromall'], // Corregido: añadido sedes
                            modalidad: 'Presencial',
                            duracion: '11 Cuatrimestres',
                            inicio: '8 de septiembre de 2025',
                            admission_guide: 'Escanea tu diploma original de Bachiller y guárdalo en formato PDF (vertical y legible). Escanea tus créditos originales de estudio de los últimos tres años de colegio (vertical y legible). Presentar el original y copia de la cédula. Escanea dos fotografías fondo blanco tamaño Carné (4 x 3 centímetros). Adjuntar el pago de inscripción. Si has realizado estudios universitarios previos, presentar original y copia de los créditos universitarios para convalidaciones. No se aceptan pagos en efectivo en ninguna sede.',
                            prices: { info: 'Inscripción $30.00. Para el primer cuatrimestre, 2 mensualidades de $138.75 (para un bloque de 3 materias). Precios regulares se aplicarán a partir del segundo cuatrimestre. Beca del 40% sobre la inversión regular de $140.00 por asignatura, quedando en $84.00 por asignatura.' }
                        },
                        {
                            id: 'udelistmo-criminalistica-virtual-lic',
                            facultyId: 'udelistmo-derecho-ciencias-politicas',
                            universityId: 'udelistmo',
                            name: 'Licenciatura en Criminalística Virtual',
                            level: 'licenciatura',
                            description: 'No disponible.',
                            sedes: ['Nacional (virtual)'],
                            modalidad: 'Virtual',
                            duracion: '11 Cuatrimestres',
                            inicio: '7 de julio de 2025',
                            admission_guide: 'Escanea tu diploma original de Bachiller y guárdalo en formato PDF (vertical y legible). Escanea tus créditos originales de estudio de los últimos tres años de colegio (vertical y legible). Presentar el original y copia de la cédula. Escanea dos fotografías fondo blanco tamaño Carné (4 x 3 centímetros). Adjuntar el pago de inscripción. Si has realizado estudios universitarios previos, presentar original y copia de los créditos universitarios para convalidaciones. No se aceptan pagos en efectivo en ninguna sede.',
                            prices: { info: 'Inscripción $30.00. Para el primer cuatrimestre, 2 mensualidades de $138.75 (para un bloque de 3 materias). Precios regulares se aplicarán a partir del segundo cuatrimestre. Beca del 40% sobre la inversión regular de $140.00 por asignatura, quedando en $84.00 por asignatura.' }
                        },
                        {
                            id: 'udelistmo-ingenieria-industrial-administrativa-lic',
                            facultyId: 'udelistmo-ingenierias-tecnologias-informacion',
                            universityId: 'udelistmo',
                            name: 'Licenciatura en Ingeniería Industrial Administrativa',
                            level: 'licenciatura',
                            description: 'No disponible.',
                            sedes: ['Panamá', 'Metromall'], // Corregido: añadido sedes
                            modalidad: 'Presencial',
                            duracion: '12 Cuatrimestres',
                            inicio: '8 de septiembre de 2025',
                            admission_guide: 'Escanea tu diploma original de Bachiller y guárdalo en formato PDF (vertical y legible). Escanea tus créditos originales de estudio de los últimos tres años de colegio (vertical y legible). Presentar el original y copia de la cédula. Escanea dos fotografías fondo blanco tamaño Carné (4 x 3 centímetros). Adjuntar el pago de inscripción. Si has realizado estudios universitarios previos, presentar original y copia de los créditos universitarios para convalidaciones. No se aceptan pagos en efectivo en ninguna sede.',
                            prices: { info: 'Inscripción $30.00. Para el primer cuatrimestre, 2 mensualidades de $138.75 (para un bloque de 3 materias). Precios regulares se aplicarán a partir del segundo cuatrimestre. Beca del 40% sobre la inversión regular de $140.00 por asignatura, quedando en $84.00 por asignatura.' }
                        },
                        {
                            id: 'udelistmo-ingenieria-sistemas-enfasis-redes-informaticas-lic',
                            facultyId: 'udelistmo-ingenierias-tecnologias-informacion',
                            universityId: 'udelistmo',
                            name: 'Licenciatura en Ingeniería en Sistemas con Énfasis en Redes Informáticas', // Corregido: completado el nombre
                            level: 'licenciatura',
                            description: 'Forma profesionales en el diseño, implementación y gestión de redes informáticas, así como en la seguridad de la información y la infraestructura tecnológica.', // Corregido: añadido descripción
                            sedes: ['Panamá', 'Metromall'], // Corregido: añadido sedes
                            modalidad: 'Presencial', // Corregido: añadido modalidad
                            duracion: '12 Cuatrimestres', // Corregido: añadido duración
                            inicio: '8 de septiembre de 2025', // Corregido: añadido inicio
                            admission_guide: 'Escanea tu diploma original de Bachiller y guárdalo en formato PDF (vertical y legible). Escanea tus créditos originales de estudio de los últimos tres años de colegio (vertical y legible). Presentar el original y copia de la cédula. Escanea dos fotografías fondo blanco tamaño Carné (4 x 3 centímetros). Adjuntar el pago de inscripción. Si has realizado estudios universitarios previos, presentar original y copia de los créditos universitarios para convalidaciones. No se aceptan pagos en efectivo en ninguna sede.', // Corregido: añadido admission_guide
                            prices: { info: 'Inscripción $30.00. Para el primer cuatrimestre, 2 mensualidades de $138.75 (para un bloque de 3 materias). Precios regulares se aplicarán a partir del segundo cuatrimestre. Beca del 40% sobre la inversión regular de $140.00 por asignatura, quedando en $84.00 por asignatura.' } // Corregido: añadido prices
                        }
                    ];
                    break
                case 'umecit':
                    universityName = "Universidad Metropolitana de Educación, Ciencia y Tecnología (UMECIT)";

                    facultadesToSeed = [
                        { id: "umecit-ciencias-administrativas-financieras", universityId: "umecit", name: "Facultad de Ciencias Administrativas y Financieras" },
                        { id: "umecit-ciencias-juridicas-politicas", universityId: "umecit", name: "Facultad de Ciencias Jurídicas y Políticas" },
                        { id: "umecit-ciencias-tecnologias-comunicacion", universityId: "umecit", name: "Facultad de Ciencias, Tecnologías y Comunicación" },
                        { id: "umecit-humanidades-ciencias-educacion",universityId: "umecit",  name: "Facultad de Humanidades y Ciencias de la Educación" },
                        { id: "umecit-ciencias-salud",universityId: "umecit",  name: "Facultad de Ciencias de la Salud" },
                        // Se podrían añadir más facultades si se tienen los IDs y nombres exactos.
                    ];

                    programasToSeed = [
                        // Licenciaturas - Facultad de Ciencias Administrativas y Financieras
                        {
                            id: "umecit-lic-administracion-empresas",
                            facultyId: "umecit-ciencias-administrativas-financieras",
                            universityId: "umecit",
                            name: "Licenciatura en Administración de Empresas",
                            level: "licenciatura",
                            description:
                                "La Facultad de Ciencias Administrativas y Financieras de UMECIT se dedica a formar profesionales capaces de transformar y liderar el entorno empresarial y económico. [1]",
                            sedes: ["Panamá", "Chitré", "Santiago", "David", "Penonomé"], // Se asume sedes presenciales
                            admission_guide:
                                "Requisitos para Aspirantes de Pregrado (Licenciaturas): Original y copia del diploma de bachiller aprobado por MEDUCA (o apostillado si es extranjero), original y copia de créditos de secundaria (o apostillados si son extranjeros), fotocopia de cédula o pasaporte, certificado de buena salud, dos fotos carné. Documentos pueden enviarse por email inicialmente, pero deben legalizarse físicamente al matricularse. Se pueden solicitar documentos adicionales. [5]",
                            prices: {
                                info: "Los precios son estimados. Se recomienda contactar directamente a la universidad para obtener información precisa sobre los costos de matrícula.",
                                precio_por_cuatrimestre_usd: 850,
                                credito_unitario_usd: 60,
                            },
                        },
                        {
                            id: "umecit-lic-contabilidad-auditoria",
                            facultyId: "umecit-ciencias-administrativas-financieras",
                            universityId: "umecit",
                            name: "Licenciatura en Contabilidad y Auditoría",
                            level: "licenciatura",
                            description:
                                "La Facultad de Ciencias Administrativas y Financieras de UMECIT se dedica a formar profesionales capaces de transformar y liderar el entorno empresarial y económico. [1]",
                            sedes: ["Panamá", "Chitré", "Santiago", "David", "Penonomé"], // Se asume sedes presenciales
                            admission_guide:
                                "Requisitos para Aspirantes de Pregrado (Licenciaturas): Original y copia del diploma de bachiller aprobado por MEDUCA (o apostillado si es extranjero), original y copia de créditos de secundaria (o apostillados si son extranjeros), fotocopia de cédula o pasaporte, certificado de buena salud, dos fotos carné. Documentos pueden enviarse por email inicialmente, pero deben legalizarse físicamente al matricularse. Se pueden solicitar documentos adicionales. [5]",
                            prices: {
                                info: "Los precios son estimados. Se recomienda contactar directamente a la universidad para obtener información precisa sobre los costos de matrícula.",
                                precio_por_cuatrimestre_usd: 850,
                                credito_unitario_usd: 60,
                            },
                        },
                        {
                            id: "umecit-lic-finanzas-banca",
                            facultyId: "umecit-ciencias-administrativas-financieras",
                            universityId: "umecit",
                            name: "Licenciatura en Finanzas y Banca",
                            level: "licenciatura",
                            description:
                                "La Facultad de Ciencias Administrativas y Financieras de UMECIT se dedica a formar profesionales capaces de transformar y liderar el entorno empresarial y económico. [1]",
                            sedes: ["Panamá", "Chitré", "Santiago", "David", "Penonomé"], // Se asume sedes presenciales
                            admission_guide:
                                "Requisitos para Aspirantes de Pregrado (Licenciaturas): Original y copia del diploma de bachiller aprobado por MEDUCA (o apostillado si es extranjero), original y copia de créditos de secundaria (o apostillados si son extranjeros), fotocopia de cédula o pasaporte, certificado de buena salud, dos fotos carné. Documentos pueden enviarse por email inicialmente, pero deben legalizarse físicamente al matricularse. Se pueden solicitar documentos adicionales. [5]",
                            prices: {
                                info: "Los precios son estimados. Se recomienda contactar directamente a la universidad para obtener información precisa sobre los costos de matrícula.",
                                precio_por_cuatrimestre_usd: 850,
                                credito_unitario_usd: 60,
                            },
                        },
                        {
                            id: "umecit-lic-gerencia-recursos-humanos",
                            facultyId: "umecit-ciencias-administrativas-financieras",
                            universityId: "umecit",
                            name: "Licenciatura en Gerencia de Recursos Humanos",
                            level: "licenciatura",
                            description:
                                "La Facultad de Ciencias Administrativas y Financieras de UMECIT se dedica a formar profesionales capaces de transformar y liderar el entorno empresarial y económico. [1]",
                            sedes: ["Panamá", "Chitré", "Santiago", "David", "Penonomé"], // Se asume sedes presenciales
                            admission_guide:
                                "Requisitos para Aspirantes de Pregrado (Licenciaturas): Original y copia del diploma de bachiller aprobado por MEDUCA (o apostillado si es extranjero), original y copia de créditos de secundaria (o apostillados si son extranjeros), fotocopia de cédula o pasaporte, certificado de buena salud, dos fotos carné. Documentos pueden enviarse por email inicialmente, pero deben legalizarse físicamente al matricularse. Se pueden solicitar documentos adicionales. [5]",
                            prices: {
                                info: "Los precios son estimados. Se recomienda contactar directamente a la universidad para obtener información precisa sobre los costos de matrícula.",
                                precio_por_cuatrimestre_usd: 850,
                                credito_unitario_usd: 60,
                            },
                        },
                        {
                            id: "umecit-lic-logistica",
                            facultyId: "umecit-ciencias-administrativas-financieras",
                            universityId: "umecit",
                            name: "Licenciatura en Logística",
                            level: "licenciatura",
                            description:
                                "La Facultad de Ciencias Administrativas y Financieras de UMECIT se dedica a formar profesionales capaces de transformar y liderar el entorno empresarial y económico. [1]",
                            sedes: ["Panamá", "Chitré", "Santiago", "David", "Penonomé"], // Se asume sedes presenciales
                            admission_guide:
                                "Requisitos para Aspirantes de Pregrado (Licenciaturas): Original y copia del diploma de bachiller aprobado por MEDUCA (o apostillado si es extranjero), original y copia de créditos de secundaria (o apostillados si son extranjeros), fotocopia de cédula o pasaporte, certificado de buena salud, dos fotos carné. Documentos pueden enviarse por email inicialmente, pero deben legalizarse físicamente al matricularse. Se pueden solicitar documentos adicionales. [5]",
                            prices: {
                                info: "Los precios son estimados. Se recomienda contactar directamente a la universidad para obtener información precisa sobre los costos de matrícula.",
                                precio_por_cuatrimestre_usd: 850,
                                credito_unitario_usd: 60,
                            },
                        },
                        {
                            id: "umecit-lic-mercadeo-negocios-internacionales",
                            facultyId: "umecit-ciencias-administrativas-financieras",
                            universityId: "umecit",
                            name: "Licenciatura en Mercadeo y Negocios Internacionales",
                            level: "licenciatura",
                            description:
                                "La Facultad de Ciencias Administrativas y Financieras de UMECIT se dedica a formar profesionales capaces de transformar y liderar el entorno empresarial y económico. [1]",
                            sedes: ["Panamá", "Chitré", "Santiago", "David", "Penonomé"], // Se asume sedes presenciales
                            admission_guide:
                                "Requisitos para Aspirantes de Pregrado (Licenciaturas): Original y copia del diploma de bachiller aprobado por MEDUCA (o apostillado si es extranjero), original y copia de créditos de secundaria (o apostillados si son extranjeros), fotocopia de cédula o pasaporte, certificado de buena salud, dos fotos carné. Documentos pueden enviarse por email inicialmente, pero deben legalizarse físicamente al matricularse. Se pueden solicitar documentos adicionales. [5]",
                            prices: {
                                info: "Los precios son estimados. Se recomienda contactar directamente a la universidad para obtener información precisa sobre los costos de matrícula.",
                                precio_por_cuatrimestre_usd: 850,
                                credito_unitario_usd: 60,
                            },
                        },
                        // Licenciaturas - Facultad de Ciencias Jurídicas y Políticas
                        {
                            id: "umecit-lic-derecho-ciencias-politicas",
                            facultyId: "umecit-ciencias-juridicas-politicas",
                            universityId: "umecit",
                            name: "Licenciatura en Derecho y Ciencias Políticas",
                            level: "licenciatura",
                            description:
                                "La Facultad de Ciencias Jurídicas y Políticas de la UMECIT busca formar profesionales en el ámbito jurídico y político para contribuir con el desarrollo del país. [2]",
                            sedes: ["Panamá", "Chitré", "Santiago", "David", "Penonomé"], // Se asume sedes presenciales
                            admission_guide:
                                "Requisitos para Aspirantes de Pregrado (Licenciaturas): Original y copia del diploma de bachiller aprobado por MEDUCA (o apostillado si es extranjero), original y copia de créditos de secundaria (o apostillados si son extranjeros), fotocopia de cédula o pasaporte, certificado de buena salud, dos fotos carné. Documentos pueden enviarse por email inicialmente, pero deben legalizarse físicamente al matricularse. Se pueden solicitar documentos adicionales. [5]",
                            prices: {
                                info: "Los precios son estimados. Se recomienda contactar directamente a la universidad para obtener información precisa sobre los costos de matrícula.",
                                precio_por_cuatrimestre_usd: 950,
                                credito_unitario_usd: 70,
                            },
                        },
                        // Licenciaturas - Facultad de Ciencias, Tecnologías y Comunicación
                        {
                            id: "umecit-lic-ingenieria-sistemas-informatica",
                            facultyId: "umecit-ciencias-tecnologias-comunicacion",
                            universityId: "umecit",
                            name: "Licenciatura en Ingeniería de Sistemas y Computación",
                            level: "licenciatura",
                            description:
                                "La Facultad de Ciencias, Tecnologías y Comunicación de la UMECIT se enfoca en la formación de profesionales capaces de liderar la transformación digital y tecnológica. [3]",
                            sedes: ["Panamá", "Chitré", "Santiago", "David", "Penonomé"], // Se asume sedes presenciales
                            admission_guide:
                                "Requisitos para Aspirantes de Pregrado (Licenciaturas): Original y copia del diploma de bachiller aprobado por MEDUCA (o apostillado si es extranjero), original y copia de créditos de secundaria (o apostillados si son extranjeros), fotocopia de cédula o pasaporte, certificado de buena salud, dos fotos carné. Documentos pueden enviarse por email inicialmente, pero deben legalizarse físicamente al matricularse. Se pueden solicitar documentos adicionales. [5]",
                            prices: {
                                info: "Los precios son estimados. Se recomienda contactar directamente a la universidad para obtener información precisa sobre los costos de matrícula.",
                                precio_por_cuatrimestre_usd: 1000,
                                credito_unitario_usd: 75,
                            },
                        },
                        {
                            id: "umecit-lic-diseno-grafico",
                            facultyId: "umecit-ciencias-tecnologias-comunicacion",
                            universityId: "umecit",
                            name: "Licenciatura en Diseño Gráfico",
                            level: "licenciatura",
                            description:
                                "La Facultad de Ciencias, Tecnologías y Comunicación de la UMECIT se enfoca en la formación de profesionales capaces de liderar la transformación digital y tecnológica. [3]",
                            sedes: ["Panamá", "Chitré", "Santiago", "David", "Penonomé"], // Se asume sedes presenciales
                            admission_guide:
                                "Requisitos para Aspirantes de Pregrado (Licenciaturas): Original y copia del diploma de bachiller aprobado por MEDUCA (o apostillado si es extranjero), original y copia de créditos de secundaria (o apostillados si son extranjeros), fotocopia de cédula o pasaporte, certificado de buena salud, dos fotos carné. Documentos pueden enviarse por email inicialmente, pero deben legalizarse físicamente al matricularse. Se pueden solicitar documentos adicionales. [5]",
                            prices: {
                                info: "Los precios son estimados. Se recomienda contactar directamente a la universidad para obtener información precisa sobre los costos de matrícula.",
                                precio_por_cuatrimestre_usd: 900,
                                credito_unitario_usd: 65,
                            },
                        },
                        {
                            id: "umecit-lic-telecomunicaciones",
                            facultyId: "umecit-ciencias-tecnologias-comunicacion",
                            universityId: "umecit",
                            name: "Licenciatura en Telecomunicaciones",
                            level: "licenciatura",
                            description:
                                "La Facultad de Ciencias, Tecnologías y Comunicación de la UMECIT se enfoca en la formación de profesionales capaces de liderar la transformación digital y tecnológica. [3]",
                            sedes: ["Panamá", "Chitré", "Santiago", "David", "Penonomé"], // Se asume sedes presenciales
                            admission_guide:
                                "Requisitos para Aspirantes de Pregrado (Licenciaturas): Original y copia del diploma de bachiller aprobado por MEDUCA (o apostillado si es extranjero), original y copia de créditos de secundaria (o apostillados si son extranjeros), fotocopia de cédula o pasaporte, certificado de buena salud, dos fotos carné. Documentos pueden enviarse por email inicialmente, pero deben legalizarse físicamente al matricularse. Se pueden solicitar documentos adicionales. [5]",
                            prices: {
                                info: "Los precios son estimados. Se recomienda contactar directamente a la universidad para obtener información precisa sobre los costos de matrícula.",
                                precio_por_cuatrimestre_usd: 980,
                                credito_unitario_usd: 72,
                            },
                        },
                        // Licenciaturas - Facultad de Humanidades y Ciencias de la Educación
                        {
                            id: "umecit-lic-docencia-ingles",
                            facultyId: "umecit-humanidades-ciencias-educacion",
                            universityId: "umecit",
                            name: "Licenciatura en Inglés",
                            level: "licenciatura",
                            description:
                                "La Facultad de Humanidades y Ciencias de la Educación de la UMECIT prepara a profesionales altamente calificados para afrontar los nuevos retos sociales y educativos. [4]",
                            sedes: ["Panamá", "Chitré", "Santiago", "David", "Penonomé"], // Se asume sedes presenciales
                            admission_guide:
                                "Requisitos para Aspirantes de Pregrado (Licenciaturas): Original y copia del diploma de bachiller aprobado por MEDUCA (o apostillado si es extranjero), original y copia de créditos de secundaria (o apostillados si son extranjeros), fotocopia de cédula o pasaporte, certificado de buena salud, dos fotos carné. Documentos pueden enviarse por email inicialmente, pero deben legalizarse físicamente al matricularse. Se pueden solicitar documentos adicionales. [5]",
                            prices: {
                                info: "Los precios son estimados. Se recomienda contactar directamente a la universidad para obtener información precisa sobre los costos de matrícula.",
                                precio_por_cuatrimestre_usd: 800,
                                credito_unitario_usd: 55,
                            },
                        },
                        {
                            id: "umecit-lic-ingles",
                            facultyId: "umecit-humanidades-ciencias-educacion",
                            universityId: "umecit",
                            name: "Licenciatura en Inglés",
                            level: "licenciatura",
                            description:
                                "La Facultad de Humanidades y Ciencias de la Educación de la UMECIT prepara a profesionales altamente calificados para afrontar los nuevos retos sociales y educativos. [4]",
                            sedes: ["Panamá", "Chitré", "Santiago", "David", "Penonomé"], // Se asume sedes presenciales
                            admission_guide:
                                "Requisitos para Aspirantes de Pregrado (Licenciaturas): Original y copia del diploma de bachiller aprobado por MEDUCA (o apostillado si es extranjero), original y copia de créditos de secundaria (o apostillados si son extranjeros), fotocopia de cédula o pasaporte, certificado de buena salud, dos fotos carné. Documentos pueden enviarse por email inicialmente, pero deben legalizarse físicamente al matricularse. Se pueden solicitar documentos adicionales. [5]",
                            prices: {
                                info: "Los precios son estimados. Se recomienda contactar directamente a la universidad para obtener información precisa sobre los costos de matrícula.",
                                precio_por_cuatrimestre_usd: 800,
                                credito_unitario_usd: 55,
                            },
                        },
                        {
                            id: "umecit-lic-educacion-preescolar",
                            facultyId: "umecit-humanidades-ciencias-educacion",
                            universityId: "umecit",
                            name: "Licenciatura en Educación Preescolar",
                            level: "licenciatura",
                            description:
                                "La Facultad de Humanidades y Ciencias de la Educación de la UMECIT prepara a profesionales altamente calificados para afrontar los nuevos retos sociales y educativos. [4]",
                            sedes: ["Panamá", "Chitré", "Santiago", "David", "Penonomé"], // Se asume sedes presenciales
                            admission_guide:
                                "Requisitos para Aspirantes de Pregrado (Licenciaturas): Original y copia del diploma de bachiller aprobado por MEDUCA (o apostillado si es extranjero), original y copia de créditos de secundaria (o apostillados si son extranjeros), fotocopia de cédula o pasaporte, certificado de buena salud, dos fotos carné. Documentos pueden enviarse por email inicialmente, pero deben legalizarse físicamente al matricularse. Se pueden solicitar documentos adicionales. [5]",
                            prices: {
                                info: "Los precios son estimados. Se recomienda contactar directamente a la universidad para obtener información precisa sobre los costos de matrícula.",
                                precio_por_cuatrimestre_usd: 780,
                                credito_unitario_usd: 50,
                            },
                        },
                        {
                            id: "umecit-lic-trabajo-social-desarrollo-humano",
                            facultyId: "umecit-humanidades-ciencias-educacion",
                            universityId: "umecit",
                            name: "Licenciatura en Trabajo Social y Desarrollo Humano",
                            level: "licenciatura",
                            description:
                                "La Facultad de Humanidades y Ciencias de la Educación de la UMECIT prepara a profesionales altamente calificados para afrontar los nuevos retos sociales y educativos. [4]",
                            sedes: ["Panamá", "Chitré", "Santiago", "David", "Penonomé"], // Se asume sedes presenciales
                            admission_guide:
                                "Requisitos para Aspirantes de Pregrado (Licenciaturas): Original y copia del diploma de bachiller aprobado por MEDUCA (o apostillado si es extranjero), original y copia de créditos de secundaria (o apostillados si son extranjeros), fotocopia de cédula o pasaporte, certificado de buena salud, dos fotos carné. Documentos pueden enviarse por email inicialmente, pero deben legalizarse físicamente al matricularse. Se pueden solicitar documentos adicionales. [5]",
                            prices: {
                                info: "Los precios son estimados. Se recomienda contactar directamente a la universidad para obtener información precisa sobre los costos de matrícula.",
                                precio_por_cuatrimestre_usd: 820,
                                credito_unitario_usd: 58,
                            },
                        },
                        {
                            id: "umecit-lic-comunicacion-social-periodismo-medios-digitales",
                            facultyId: "umecit-humanidades-ciencias-educacion",
                            universityId: "umecit",
                            name: "Licenciatura en Comunicación Social, Periodismo y Medios Digitales",
                            level: "licenciatura",
                            description:
                                "La Facultad de Humanidades y Ciencias de la Educación de la UMECIT prepara a profesionales altamente calificados para afrontar los nuevos retos sociales y educativos. [4]",
                            sedes: ["Panamá", "Chitré", "Santiago", "David", "Penonomé"], // Se asume sedes presenciales
                            admission_guide:
                                "Requisitos para Aspirantes de Pregrado (Licenciaturas): Original y copia del diploma de bachiller aprobado por MEDUCA (o apostillado si es extranjero), original y copia de créditos de secundaria (o apostillados si son extranjeros), fotocopia de cédula o pasaporte, certificado de buena salud, dos fotos carné. Documentos pueden enviarse por email inicialmente, pero deben legalizarse físicamente al matricularse. Se pueden solicitar documentos adicionales. [5]",
                            prices: {
                                info: "Los precios son estimados. Se recomienda contactar directamente a la universidad para obtener información precisa sobre los costos de matrícula.",
                                precio_por_cuatrimestre_usd: 880,
                                credito_unitario_usd: 62,
                            },
                        },
                        // Licenciaturas - Facultad de Ciencias de la Salud
                        {
                            id: "umecit-lic-educacion-salud",
                            facultyId: "umecit-ciencias-salud",
                            universityId: "umecit",
                            name: "Licenciatura en Educación para la Salud",
                            level: "licenciatura",
                            description:
                                "La Facultad de Ciencias de la Salud forma futuros profesionales capaces de ofrecer soluciones efectivas y seguras en el ámbito sanitario. Se distingue por la alta empleabilidad de sus egresados, la flexibilidad en las modalidades de estudio, alianzas estratégicas con entidades del sector, un cuerpo docente experimentado y la disponibilidad de instalaciones especializadas, como un centro de Fisioterapia y un laboratorio de simulación. Además, contribuye a la producción científica a través de su revista SALUTA y garantiza la ética en la investigación mediante su Comité de Bioética. [7]",
                            sedes: ["Panamá"],
                            admission_guide:
                                "Requisitos para Aspirantes de Pregrado (Licenciaturas): Original y copia del diploma de bachiller aprobado por MEDUCA (o apostillado si es extranjero), original y copia de créditos de secundaria (o apostillados si son extranjeros), fotocopia de cédula o pasaporte, certificado de buena salud, dos fotos carné. Documentos pueden enviarse por email inicialmente, pero deben legalizarse físicamente al matricularse. Se pueden solicitar documentos adicionales. [5]",
                            prices: {
                                info: "Los precios son estimados. Se recomienda contactar directamente a la universidad para obtener información precisa sobre los costos de matrícula.",
                                precio_por_cuatrimestre_usd: 900,
                                credito_unitario_usd: 65,
                            },
                        },
                        {
                            id: "umecit-lic-enfermeria",
                            facultyId: "umecit-ciencias-salud",
                            universityId: "umecit",
                            name: "Licenciatura en Enfermería",
                            level: "licenciatura",
                            description:
                                "La Facultad de Ciencias de la Salud forma futuros profesionales capaces de ofrecer soluciones efectivas y seguras en el ámbito sanitario. [7]",
                            sedes: ["Panamá"],
                            admission_guide:
                                "Requisitos para Aspirantes de Pregrado (Licenciaturas): Original y copia del diploma de bachiller aprobado por MEDUCA (o apostillado si es extranjero), original y copia de créditos de secundaria (o apostillados si son extranjeros), fotocopia de cédula o pasaporte, certificado de buena salud, dos fotos carné. Documentos pueden enviarse por email inicialmente, pero deben legalizarse físicamente al matricularse. Se pueden solicitar documentos adicionales. [5]",
                            prices: {
                                info: "Los precios son estimados. Se recomienda contactar directamente a la universidad para obtener información precisa sobre los costos de matrícula.",
                                precio_por_cuatrimestre_usd: 1100,
                                credito_unitario_usd: 80,
                            },
                        },
                        {
                            id: "umecit-lic-fisioterapia",
                            facultyId: "umecit-ciencias-salud",
                            universityId: "umecit",
                            name: "Licenciatura en Fisioterapia",
                            level: "licenciatura",
                            description:
                                "La Facultad de Ciencias de la Salud forma futuros profesionales capaces de ofrecer soluciones efectivas y seguras en el ámbito sanitario. [7]",
                            sedes: ["Panamá"],
                            admission_guide:
                                "Requisitos para Aspirantes de Pregrado (Licenciaturas): Original y copia del diploma de bachiller aprobado por MEDUCA (o apostillado si es extranjero), original y copia de créditos de secundaria (o apostillados si son extranjeros), fotocopia de cédula o pasaporte, certificado de buena salud, dos fotos carné. Documentos pueden enviarse por email inicialmente, pero deben legalizarse físicamente al matricularse. Se pueden solicitar documentos adicionales. [5]",
                            prices: {
                                info: "Los precios son estimados. Se recomienda contactar directamente a la universidad para obtener información precisa sobre los costos de matrícula.",
                                precio_por_cuatrimestre_usd: 1050,
                                credito_unitario_usd: 78,
                            },
                        },
                        {
                            id: "umecit-lic-psicologia-general",
                            facultyId: "umecit-ciencias-salud",
                            universityId: "umecit",
                            name: "Licenciatura en Psicología General",
                            level: "licenciatura",
                            description:
                                "La Facultad de Ciencias de la Salud forma futuros profesionales capaces de ofrecer soluciones efectivas y seguras en el ámbito sanitario. [7]",
                            sedes: ["Panamá"],
                            admission_guide:
                                "Requisitos para Aspirantes de Pregrado (Licenciaturas): Original y copia del diploma de bachiller aprobado por MEDUCA (o apostillado si es extranjero), original y copia de créditos de secundaria (o apostillados si son extranjeros), fotocopia de cédula o pasaporte, certificado de buena salud, dos fotos carné. Documentos pueden enviarse por email inicialmente, pero deben legalizarse físicamente al matricularse. Se pueden solicitar documentos adicionales. [5]",
                            prices: {
                                info: "Los precios son estimados. Se recomienda contactar directamente a la universidad para obtener información precisa sobre los costos de matrícula.",
                                precio_por_cuatrimestre_usd: 920,
                                credito_unitario_usd: 68,
                            },
                        },
                        {
                            id: "umecit-lic-radiologia-imagenes-medicas",
                            facultyId: "umecit-ciencias-salud",
                            universityId: "umecit",
                            name: "Licenciatura en Radiología e Imágenes Médicas",
                            level: "licenciatura",
                            description:
                                "La Facultad de Ciencias de la Salud forma futuros profesionales capaces de ofrecer soluciones efectivas y seguras en el ámbito sanitario. [7]",
                            sedes: ["Panamá"],
                            admission_guide:
                                "Requisitos para Aspirantes de Pregrado (Licenciaturas): Original y copia del diploma de bachiller aprobado por MEDUCA (o apostillado si es extranjero), original y copia de créditos de secundaria (o apostillados si son extranjeros), fotocopia de cédula o pasaporte, certificado de buena salud, dos fotos carné. Documentos pueden enviarse por email inicialmente, pero deben legalizarse físicamente al matricularse. Se pueden solicitar documentos adicionales. [5]",
                            prices: {
                                info: "Los precios son estimados. Se recomienda contactar directamente a la universidad para obtener información precisa sobre los costos de matrícula.",
                                precio_por_cuatrimestre_usd: 1080,
                                credito_unitario_usd: 79,
                            },
                        },
                        {
                            id: "umecit-lic-registros-medicos-estadisticas-salud",
                            facultyId: "umecit-ciencias-salud",
                            universityId: "umecit",
                            name: "Licenciatura en Registros Médicos y Estadísticas de Salud",
                            level: "licenciatura",
                            description:
                                "La Facultad de Ciencias de la Salud forma futuros profesionales capaces de ofrecer soluciones efectivas y seguras en el ámbito sanitario. [7]",
                            sedes: ["Panamá"],
                            admission_guide:
                                "Requisitos para Aspirantes de Pregrado (Licenciaturas): Original y copia del diploma de bachiller aprobado por MEDUCA (o apostillado si es extranjero), original y copia de créditos de secundaria (o apostillados si son extranjeros), fotocopia de cédula o pasaporte, certificado de buena salud, dos fotos carné. Documentos pueden enviarse por email inicialmente, pero deben legalizarse físicamente al matricularse. Se pueden solicitar documentos adicionales. [5]",
                            prices: {
                                info: "Los precios son estimados. Se recomienda contactar directamente a la universidad para obtener información precisa sobre los costos de matrícula.",
                                precio_por_cuatrimestre_usd: 930,
                                credito_unitario_usd: 66,
                            },
                        },
                        {
                            id: "umecit-lic-seguridad-salud-ocupacional",
                            facultyId: "umecit-ciencias-salud",
                            universityId: "umecit",
                            name: "Licenciatura en Seguridad y Salud Ocupacional",
                            level: "licenciatura",
                            description:
                                "La Facultad de Ciencias de la Salud forma futuros profesionales capaces de ofrecer soluciones efectivas y seguras en el ámbito sanitario. [7]",
                            sedes: ["Panamá"],
                            admission_guide:
                                "Requisitos para Aspirantes de Pregrado (Licenciaturas): Original y copia del diploma de bachiller aprobado por MEDUCA (o apostillado si es extranjero), original y copia de créditos de secundaria (o apostillados si son extranjeros), fotocopia de cédula o pasaporte, certificado de buena salud, dos fotos carné. Documentos pueden enviarse por email inicialmente, pero deben legalizarse físicamente al matricularse. Se pueden solicitar documentos adicionales. [5]",
                            prices: {
                                info: "Los precios son estimados. Se recomienda contactar directamente a la universidad para obtener información precisa sobre los costos de matrícula.",
                                precio_por_cuatrimestre_usd: 950,
                                credito_unitario_usd: 70,
                            },
                        },
                        {
                            id: "umecit-tec-seguridad-salud-ocupacional",
                            facultyId: "umecit-ciencias-salud",
                            universityId: "umecit",
                            name: "Técnico en Seguridad y Salud Ocupacional",
                            level: "tecnico",
                            description: "Salida intermedia de la Licenciatura en Seguridad y Salud Ocupacional. [8]",
                            sedes: ["Panamá"],
                            admission_guide:
                                "Requisitos para Aspirantes de Pregrado (Licenciaturas): Original y copia del diploma de bachiller aprobado por MEDUCA (o apostillado si es extranjero), original y copia de créditos de secundaria (o apostillados si son extranjeros), fotocopia de cédula o pasaporte, certificado de buena salud, dos fotos carné. Documentos pueden enviarse por email inicialmente, pero deben legalizarse físicamente al matricularse. Se pueden solicitar documentos adicionales. [5]",
                            prices: {
                                info: "Los precios son estimados. Se recomienda contactar directamente a la universidad para obtener información precisa sobre los costos de matrícula.",
                                precio_total_programa_usd: 4500,
                                duracion_cuatrimestres: 4, // Asumiendo 2 años de duración
                            },
                        },
                        // Licenciaturas y Técnicos - Otras áreas (modalidad virtual)
                        {
                            id: "umecit-lic-administracion-negocios-exportacion",
                            facultyId: null, // No specific faculty mentioned for virtual programs
                            universityId: "umecit",
                            name: "Licenciatura en Administración de Negocios con Énfasis en Exportación de Bienes y Servicios",
                            level: "licenciatura",
                            description:
                                "No se proporciona una descripción detallada del programa en el texto. Se recomienda contactar directamente a la universidad para obtener más detalles.",
                            sedes: ["Virtual"],
                            admission_guide:
                                "Requisitos para Aspirantes de Pregrado (Licenciaturas): Original y copia del diploma de bachiller aprobado por MEDUCA (o apostillado si es extranjero), original y copia de créditos de secundaria (o apostillados si son extranjeros), fotocopia de cédula o pasaporte, certificado de buena salud, dos fotos carné. Documentos pueden enviarse por email inicialmente, pero deben legalizarse físicamente al matricularse. Se pueden solicitar documentos adicionales. [5]",
                            prices: {
                                info: "Los precios son estimados. Se recomienda contactar directamente a la universidad para obtener información precisa sobre los costos de matrícula.",
                                precio_por_cuatrimestre_usd: 800,
                                credito_unitario_usd: 55,
                            },
                        },
                        {
                            id: "umecit-lic-banca-finanzas",
                            facultyId: null,
                            universityId: "umecit",
                            name: "Licenciatura en Banca y Finanzas",
                            level: "licenciatura",
                            description:
                                "No se proporciona una descripción detallada del programa en el texto. Se recomienda contactar directamente a la universidad para obtener más detalles.",
                            sedes: ["Virtual"],
                            admission_guide:
                                "Requisitos para Aspirantes de Pregrado (Licenciaturas): Original y copia del diploma de bachiller aprobado por MEDUCA (o apostillado si es extranjero), original y copia de créditos de secundaria (o apostillados si son extranjeros), fotocopia de cédula o pasaporte, certificado de buena salud, dos fotos carné. Documentos pueden enviarse por email inicialmente, pero deben legalizarse físicamente al matricularse. Se pueden solicitar documentos adicionales. [5]",
                            prices: {
                                info: "Los precios son estimados. Se recomienda contactar directamente a la universidad para obtener información precisa sobre los costos de matrícula.",
                                precio_por_cuatrimestre_usd: 820,
                                credito_unitario_usd: 58,
                            },
                        },
                        {
                            id: "umecit-lic-contabilidad",
                            facultyId: null,
                            universityId: "umecit",
                            name: "Licenciatura en Contabilidad",
                            level: "licenciatura",
                            description:
                                "No se proporciona una descripción detallada del programa en el texto. Se recomienda contactar directamente a la universidad para obtener más detalles.",
                            sedes: ["Virtual"],
                            admission_guide:
                                "Requisitos para Aspirantes de Pregrado (Licenciaturas): Original y copia del diploma de bachiller aprobado por MEDUCA (o apostillado si es extranjero), original y copia de créditos de secundaria (o apostillados si son extranjeros), fotocopia de cédula o pasaporte, certificado de buena salud, dos fotos carné. Documentos pueden enviarse por email inicialmente, pero deben legalizarse físicamente al matricularse. Se pueden solicitar documentos adicionales. [5]",
                            prices: {
                                info: "Los precios son estimados. Se recomienda contactar directamente a la universidad para obtener información precisa sobre los costos de matrícula.",
                                precio_por_cuatrimestre_usd: 830,
                                credito_unitario_usd: 59,
                            },
                        },
                        {
                            id: "umecit-lic-mercadeo-publicidad",
                            facultyId: null,
                            universityId: "umecit",
                            name: "Licenciatura en Mercadeo y Publicidad",
                            level: "licenciatura",
                            description:
                                "No se proporciona una descripción detallada del programa en el texto. Se recomienda contactar directamente a la universidad para obtener más detalles.",
                            sedes: ["Virtual"],
                            admission_guide:
                                "Requisitos para Aspirantes de Pregrado (Licenciaturas): Original y copia del diploma de bachiller aprobado por MEDUCA (o apostillado si es extranjero), original y copia de créditos de secundaria (o apostillados si son extranjeros), fotocopia de cédula o pasaporte, certificado de buena salud, dos fotos carné. Documentos pueden enviarse por email inicialmente, pero deben legalizarse físicamente al matricularse. Se pueden solicitar documentos adicionales. [5]",
                            prices: {
                                info: "Los precios son estimados. Se recomienda contactar directamente a la universidad para obtener información precisa sobre los costos de matrícula.",
                                precio_por_cuatrimestre_usd: 810,
                                credito_unitario_usd: 56,
                            },
                        },
                        {
                            id: "umecit-lic-turismo-bilingue",
                            facultyId: null,
                            universityId: "umecit",
                            name: "Licenciatura en Turismo Bilingüe",
                            level: "licenciatura",
                            description:
                                "No se proporciona una descripción detallada del programa en el texto. Se recomienda contactar directamente a la universidad para obtener más detalles.",
                            sedes: ["Virtual"],
                            admission_guide:
                                "Requisitos para Aspirantes de Pregrado (Licenciaturas): Original y copia del diploma de bachiller aprobado por MEDUCA (o apostillado si es extranjero), original y copia de créditos de secundaria (o apostillados si son extranjeros), fotocopia de cédula o pasaporte, certificado de buena salud, dos fotos carné. Documentos pueden enviarse por email inicialmente, pero deben legalizarse físicamente al matricularse. Se pueden solicitar documentos adicionales. [5]",
                            prices: {
                                info: "Los precios son estimados. Se recomienda contactar directamente a la universidad para obtener información precisa sobre los costos de matrícula.",
                                precio_por_cuatrimestre_usd: 790,
                                credito_unitario_usd: 54,
                            },
                        },
                        {
                            id: "umecit-lic-administracion-gestion-ambiental",
                            facultyId: null,
                            universityId: "umecit",
                            name: "Licenciatura en Administración de la Gestión Ambiental",
                            level: "licenciatura",
                            description:
                                "No se proporciona una descripción detallada del programa en el texto. Se recomienda contactar directamente a la universidad para obtener más detalles.",
                            sedes: ["Virtual"],
                            admission_guide:
                                "Requisitos para Aspirantes de Pregrado (Licenciaturas): Original y copia del diploma de bachiller aprobado por MEDUCA (o apostillado si es extranjero), original y copia de créditos de secundaria (o apostillados si son extranjeros), fotocopia de cédula o pasaporte, certificado de buena salud, dos fotos carné. Documentos pueden enviarse por email inicialmente, pero deben legalizarse físicamente al matricularse. Se pueden solicitar documentos adicionales. [5]",
                            prices: {
                                info: "Los precios son estimados. Se recomienda contactar directamente a la universidad para obtener información precisa sobre los costos de matrícula.",
                                precio_por_cuatrimestre_usd: 840,
                                credito_unitario_usd: 60,
                            },
                        },
                        {
                            id: "umecit-tec-administracion-gestion-ambiental",
                            facultyId: null,
                            universityId: "umecit",
                            name: "Técnico en Administración de la Gestión Ambiental",
                            level: "tecnico",
                            description:
                                "Salida intermedia de la Licenciatura en Administración de la Gestión Ambiental. [8]",
                            sedes: ["Virtual"],
                            admission_guide:
                                "Requisitos para Aspirantes de Pregrado (Licenciaturas): Original y copia del diploma de bachiller aprobado por MEDUCA (o apostillado si es extranjero), original y copia de créditos de secundaria (o apostillados si son extranjeros), fotocopia de cédula o pasaporte, certificado de buena salud, dos fotos carné. Documentos pueden enviarse por email inicialmente, pero deben legalizarse físicamente al matricularse. Se pueden solicitar documentos adicionales. [5]",
                            prices: {
                                info: "Los precios son estimados. Se recomienda contactar directamente a la universidad para obtener información precisa sobre los costos de matrícula.",
                                precio_total_programa_usd: 4200,
                                duracion_cuatrimestres: 4,
                            },
                        },
                        {
                            id: "umecit-lic-administracion-maritima-portuaria",
                            facultyId: null,
                            universityId: "umecit",
                            name: "Licenciatura en Administración Marítima y Portuaria",
                            level: "licenciatura",
                            description:
                                "No se proporciona una descripción detallada del programa en el texto. Se recomienda contactar directamente a la universidad para obtener más detalles.",
                            sedes: ["Virtual"],
                            admission_guide:
                                "Requisitos para Aspirantes de Pregrado (Licenciaturas): Original y copia del diploma de bachiller aprobado por MEDUCA (o apostillado si es extranjero), original y copia de créditos de secundaria (o apostillados si son extranjeros), fotocopia de cédula o pasaporte, certificado de buena salud, dos fotos carné. Documentos pueden enviarse por email inicialmente, pero deben legalizarse físicamente al matricularse. Se pueden solicitar documentos adicionales. [5]",
                            prices: {
                                info: "Los precios son estimados. Se recomienda contactar directamente a la universidad para obtener información precisa sobre los costos de matrícula.",
                                precio_por_cuatrimestre_usd: 860,
                                credito_unitario_usd: 62,
                            },
                        },
                        {
                            id: "umecit-lic-logistica-transporte-multimodal",
                            facultyId: null,
                            universityId: "umecit",
                            name: "Licenciatura en Logística y Transporte Multimodal",
                            level: "licenciatura",
                            description:
                                "No se proporciona una descripción detallada del programa en el texto. Se recomienda contactar directamente a la universidad para obtener más detalles.",
                            sedes: ["Virtual"],
                            admission_guide:
                                "Requisitos para Aspirantes de Pregrado (Licenciaturas): Original y copia del diploma de bachiller aprobado por MEDUCA (o apostillado si es extranjero), original y copia de créditos de secundaria (o apostillados si son extranjeros), fotocopia de cédula o pasaporte, certificado de buena salud, dos fotos carné. Documentos pueden enviarse por email inicialmente, pero deben legalizarse físicamente al matricularse. Se pueden solicitar documentos adicionales. [5]",
                            prices: {
                                info: "Los precios son estimados. Se recomienda contactar directamente a la universidad para obtener información precisa sobre los costos de matrícula.",
                                precio_por_cuatrimestre_usd: 870,
                                credito_unitario_usd: 63,
                            },
                        },
                        {
                            id: "umecit-tec-logistica-internacional",
                            facultyId: null,
                            universityId: "umecit",
                            name: "Técnico en Logística Internacional",
                            level: "tecnico",
                            description:
                                "Salida intermedia de la Licenciatura en Logística y Transporte Multimodal. [8]",
                            sedes: ["Virtual"],
                            admission_guide:
                                "Requisitos para Aspirantes de Pregrado (Licenciaturas): Original y copia del diploma de bachiller aprobado por MEDUCA (o apostillado si es extranjero), original y copia de créditos de secundaria (o apostillados si son extranjeros), fotocopia de cédula o pasaporte, certificado de buena salud, dos fotos carné. Documentos pueden enviarse por email inicialmente, pero deben legalizarse físicamente al matricularse. Se pueden solicitar documentos adicionales. [5]",
                            prices: {
                                info: "Los precios son estimados. Se recomienda contactar directamente a la universidad para obtener información precisa sobre los costos de matrícula.",
                                precio_total_programa_usd: 4300,
                                duracion_cuatrimestres: 4,
                            },
                        },
                        {
                            id: "umecit-lic-criminalistica-ciencias-forenses",
                            facultyId: null,
                            universityId: "umecit",
                            name: "Licenciatura en Criminalística y Ciencias Forenses",
                            level: "licenciatura",
                            description:
                                "No se proporciona una descripción detallada del programa en el texto. Se recomienda contactar directamente a la universidad para obtener más detalles.",
                            sedes: ["Virtual"],
                            admission_guide:
                                "Requisitos para Aspirantes de Pregrado (Licenciaturas): Original y copia del diploma de bachiller aprobado por MEDUCA (o apostillado si es extranjero), original y copia de créditos de secundaria (o apostillados si son extranjeros), fotocopia de cédula o pasaporte, certificado de buena salud, dos fotos carné. Documentos pueden enviarse por email inicialmente, pero deben legalizarse físicamente al matricularse. Se pueden solicitar documentos adicionales. [5]",
                            prices: {
                                info: "Los precios son estimados. Se recomienda contactar directamente a la universidad para obtener información precisa sobre los costos de matrícula.",
                                precio_por_cuatrimestre_usd: 900,
                                credito_unitario_usd: 65,
                            },
                        },
                        {
                            id: "umecit-tec-criminalistica",
                            facultyId: null,
                            universityId: "umecit",
                            name: "Técnico en Criminalística",
                            level: "tecnico",
                            description:
                                "Salida intermedia de la Licenciatura en Criminalística y Ciencias Forenses. [8]",
                            sedes: ["Virtual"],
                            admission_guide:
                                "Requisitos para Aspirantes de Pregrado (Licenciaturas): Original y copia del diploma de bachiller aprobado por MEDUCA (o apostillado si es extranjero), original y copia de créditos de secundaria (o apostillados si son extranjeros), fotocopia de cédula o pasaporte, certificado de buena salud, dos fotos carné. Documentos pueden enviarse por email inicialmente, pero deben legalizarse físicamente al matricularse. Se pueden solicitar documentos adicionales. [5]",
                            prices: {
                                info: "Los precios son estimados. Se recomienda contactar directamente a la universidad para obtener información precisa sobre los costos de matrícula.",
                                precio_total_programa_usd: 4800,
                                duracion_cuatrimestres: 5,
                            },
                        },
                        {
                            id: "umecit-tec-ingenieria-electrica",
                            facultyId: null,
                            universityId: "umecit",
                            name: "Técnico en Ingeniería Eléctrica",
                            level: "tecnico",
                            description:
                                "No se proporciona una descripción detallada del programa en el texto. Se recomienda contactar directamente a la universidad para obtener más detalles.",
                            sedes: ["Virtual"],
                            admission_guide:
                                "Requisitos para Aspirantes de Pregrado (Licenciaturas): Original y copia del diploma de bachiller aprobado por MEDUCA (o apostillado si es extranjero), original y copia de créditos de secundaria (o apostillados si son extranjeros), fotocopia de cédula o pasaporte, certificado de buena salud, dos fotos carné. Documentos pueden enviarse por email inicialmente, pero deben legalizarse físicamente al matricularse. Se pueden solicitar documentos adicionales. [5]",
                            prices: {
                                info: "Los precios son estimados. Se recomienda contactar directamente a la universidad para obtener información precisa sobre los costos de matrícula.",
                                precio_total_programa_usd: 5000,
                                duracion_cuatrimestres: 6,
                            },
                        },
                    ];
                  break

                  
               default: 
               console.warn(`ID de universidad desconocido: ${currentUniversityId}. No se poblarán datos.`);
               showMessage(`La ${currentUniversityId} por el momento no cuenta con informacion.`, 'warning');
               return;
              }
          
            if (facultadesToSeed.length > 0 || programasToSeed.length > 0) {
                 // Guardar la universidad
                 await setDoc(doc(db, `${dbPath}/universities`, currentUniversityId), { name: universityName });

                 // Guardar facultades
                 for (const faculty of facultadesToSeed) {
                     // Asegúrate de que cada facultad tenga universityId, facultyId y name al menos
                     await setDoc(doc(db, `${dbPath}/faculties`, faculty.id), faculty);
                 }

                 // Guardar programas
                 for (const program of programasToSeed) {
                      // Asegúrate de que cada programa tenga universityId, facultyId, name, level al menos
                     await setDoc(doc(db, `${dbPath}/programs`, program.id), program);
                 }

                 showMessage(`Los datos de  ${currentUniversityId} se han cargado exitosamente.`, 'success');
                 console.log(`Población de la base de datos para ${currentUniversityId} completada.`);
            } else {
                 showMessage(`Por el momento no hay datos definidos para ${currentUniversityId}.`, 'info');
                 console.log(`No hay datos iniciales para ${currentUniversityId} en seedDatabase.`);
            }


        } catch (e) {
            console.error("Error al poblar la base de datos: ", e);
            showMessage("Error al cargar los datos . Por favor, actualize la pagina, si el error persiste no dude en contactarnos.", 'error');
        }
    } // <-- Asegúrate de que la función seedDatabase cierre correctamente aquí.

// --- Funciones para cargar datos del DOM ---

    // Carga y muestra las facultades de la Universidad actual
    function loadFaculties() {
        console.log(`Cargando facultades para ${currentUniversityId}...`);
        // Verifica si el contenedor existe antes de intentar manipularlo
        if (!facultiesList || !resetButton || !db || !isAuthReady || !currentUniversityId) {
            console.warn("Elementos DOM, Firebase, Auth o ID de Universidad no están listos para cargar facultades. Saltando carga de facultades.");
             if (dynamicContentContainer) dynamicContentContainer.innerHTML = '<p class="university-error-message">Error al cargar facultades. Componentes no listos.</p>';
            return;
        }


        facultiesList.innerHTML = '<div class="university-loading-indicator">Cargando facultades...</div>'; // Cambiado de ulatina- a university-
        hideElement(programTypesContainer);
        hideElement(programsListContainer);
        hideElement(programDetails);
        showElement(facultiesContainer);
        showElement(resetButton);
        resetButton.textContent = '← Regresar'; // Texto inicial del botón

        const appId = firebaseConfig.appId;
        const dbPath = `artifacts/${appId}/public/data`;

        // Filtra las facultades por el ID de la universidad actual
        const q = query(collection(db, `${dbPath}/faculties`), where("universityId", "==", currentUniversityId));

        onSnapshot(q, (snapshot) => {
            allFaculties = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            facultiesList.innerHTML = ''; // Limpia el indicador de carga

            if (allFaculties.length > 0) {
                 // Ordenar alfabéticamente por nombre
                allFaculties.sort((a, b) => a.name.localeCompare(b.name));

                allFaculties.forEach(faculty => {
                    const button = document.createElement('button');
                    button.className = 'university-accordion-button university-faculty-button'; // Cambiado de ulatina- a university-
                    button.textContent = faculty.name;
                    button.dataset.facultyId = faculty.id;
                    button.addEventListener('click', () => handleFacultyClick(faculty));
                    facultiesList.appendChild(button);
                });
            } else {
                facultiesList.innerHTML = `<p class="university-no-data">No hay datos disponibles para ${currentUniversityId}. Espere nuevas actualizaciones.</p>`; // Cambiado de ulatina- a university-
            }
            console.log(`Facultades cargadas para ${currentUniversityId}:`, allFaculties.length);
        }, (err) => {
            console.error(`Error al obtener facultades para ${currentUniversityId}:`, err);
            showMessage(`Error al cargar las facultades para ${currentUniversityId}. Inténtalo de nuevo.`, 'error');
            facultiesList.innerHTML = '<p class="university-no-data university-error-message">Error al cargar facultades.</p>'; // Cambiado de ulatina- a university-
        });
    }


    // Carga y muestra los programas de un tipo específico para la facultad seleccionada y la universidad actual
    function loadPrograms() {
        console.log(`Cargando programas para la facultad: ${selectedFaculty?.name} y tipo: ${selectedProgramType} en ${currentUniversityId}`);
        if (!db || !selectedFaculty || !selectedProgramType || !currentUniversityId || !programsList) {
            console.warn("Faltan datos (db, selectedFaculty, selectedProgramType, currentUniversityId, programsList) para cargar programas. Saltando carga de programas.");
             if (programsList) programsList.innerHTML = '<p class="university-error-message">Error al cargar programas. Componentes no listos.</p>';
            return;
        }

        programsList.innerHTML = '<div class="university-loading-indicator">Cargando programas...</div>'; // Cambiado de ulatina- a university-
        hideElement(programDetails);
        showElement(programsListContainer);

        const appId = firebaseConfig.appId;
        const dbPath = `artifacts/${appId}/public/data`;

        // Filtra los programas por facultyId y universityId
        const q = query(
            collection(db, `${dbPath}/programs`),
            where("facultyId", "==", selectedFaculty.id),
            where("universityId", "==", currentUniversityId) // Asegurarse de filtrar por universityId
        );

        onSnapshot(q, (snapshot) => {
            allPrograms = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(program => {
                    // Filtrar adicionalmente por nivel (licenciatura_tecnico o maestria_doctorado)
                    const isCorrectLevel = (selectedProgramType === 'licenciatura_tecnico' && (program.level === 'licenciatura' || program.level === 'tecnico')) ||
                                           (selectedProgramType === 'maestria_doctorado' && (program.level === 'maestria' || program.level === 'doctorado' || program.level === 'especializacion'));
                    return isCorrectLevel;
                });


            // Ordenar alfabéticamente por nombre
            allPrograms.sort((a, b) => a.name.localeCompare(b.name));

            programsList.innerHTML = ''; // Limpia el indicador de carga

            if (allPrograms.length > 0) {
                allPrograms.forEach(program => {
                    const button = document.createElement('button');
                    button.className = 'university-accordion-button university-program-button'; // Cambiado de ulatina- a university-
                    button.textContent = program.name;
                    button.dataset.programId = program.id;
                    button.addEventListener('click', () => handleProgramClick(program));
                    programsList.appendChild(button);
                });
            } else {
                programsList.innerHTML = '<p class="university-no-data">No hay programas disponibles para esta selección.</p>'; // Cambiado de ulatina- a university-
            }
            console.log("Programas cargados:", allPrograms.length);
        }, (err) => {
            console.error("Error al obtener programas:", err);
            showMessage("Error al cargar los programas. Inténtalo de nuevo.", 'error');
            programsList.innerHTML = '<p class="university-no-data university-error-message">Error al cargar programas.</p>'; // Cambiado de ulatina- a university-
        });
    }

    // --- Manejadores de Eventos ---

    // Maneja el clic en una facultad
    function handleFacultyClick(faculty) {
        console.log("Facultad seleccionada:", faculty.name);
        selectedFaculty = faculty;
        selectedProgramType = null;
        selectedProgram = null;

        // Resaltar la facultad seleccionada (cambiado de ulatina- a university-)
        document.querySelectorAll('.university-faculty-button').forEach(btn => {
            if (btn.dataset.facultyId === faculty.id) {
                btn.classList.add('university-accordion-button--active');
            } else {
                btn.classList.remove('university-accordion-button--active');
            }
        });

        hideElement(facultiesContainer); // Oculta la lista de facultades
        showElement(programTypesContainer); // Muestra los botones de tipo de programa
        hideElement(programsListContainer); // Oculta la lista de programas
        hideElement(programDetails); // Oculta los detalles del programa
        hideMessage(); // Oculta cualquier mensaje previo
        if (resetButton) resetButton.textContent = '← Regresar a Facultades'; // Cambia el texto del botón regresar
    }

    // Maneja el clic en un tipo de programa
    function handleProgramTypeClick(type) {
        console.log("Tipo de programa seleccionado:", type);
        selectedProgramType = type;
        selectedProgram = null;

        // Resaltar el tipo de programa seleccionado (cambiado de ulatina- a university-)
        document.querySelectorAll('.university-program-type-button').forEach(btn => {
            if (btn.dataset.programType === type) {
                btn.classList.add('university-accordion-button--active');
            } else {
                btn.classList.remove('university-accordion-button--active');
            }
        });

        loadPrograms(); // Cargar los programas del tipo seleccionado
        if (resetButton) resetButton.textContent = '← Regresar a Tipos de Programas'; // Cambia el texto del botón regresar
    }

    // Maneja el clic en un programa específico
    function handleProgramClick(program) {
        console.log("Programa seleccionado:", program.name);
        selectedProgram = program;
        displayProgramDetails(program);

        // Resaltar el programa seleccionado (cambiado de ulatina- a university-)
        document.querySelectorAll('.university-program-button').forEach(btn => {
            if (btn.dataset.programId === program.id) {
                btn.classList.add('university-accordion-button--active');
            } else {
                btn.classList.remove('university-accordion-button--active');
            }
        });

        hideElement(programsListContainer); // Oculta la lista de programas
        showElement(programDetails); // Muestra los detalles del programa
        if (resetButton) resetButton.textContent = '← Regresar a Programas'; // Cambia el texto del botón regresar
    }

    // Muestra los detalles del programa en el DOM
    function displayProgramDetails(program) {
        console.log("Mostrando detalles para:", program.name);
        if (!programName || !programDescription || !programSedes || !programAdmissionGuide || !programPrices) {
            console.error("Elementos DOM de detalles de programa no encontrados.");
            return;
        }

        programName.textContent = program.name;
        programDescription.textContent = program.description;
        programSedes.textContent = program.sedes.join(', ');
        programAdmissionGuide.textContent = program.admission_guide;

        // Formatear los precios
        if (program.prices) {
            let pricesHtml = '';
            for (const key in program.prices) {
                // Capitalizar la primera letra y reemplazar guiones bajos con espacios
                const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace(/_/g, ' ');
                pricesHtml += `<strong>${formattedKey}:</strong> ${program.prices[key]}<br>`;
            }
            programPrices.innerHTML = pricesHtml;
        } else {
            programPrices.textContent = 'Información de precios no disponible. Contactar a la universidad.';
        }
        showElement(programDetails);
    }

    // Maneja el botón de regresar/reset
    function handleResetButton() {
        console.log("Botón Regresar/Reset presionado. Estado actual:", {selectedProgram, selectedProgramType, selectedFaculty});
        if (selectedProgram) {
            // Si hay un programa seleccionado, regresar a la lista de programas
            selectedProgram = null;
            hideElement(programDetails);
            showElement(programsListContainer);
            if (resetButton) resetButton.textContent = '← Regresar a Tipos de Programas';
            // Desactivar el highlight del programa (cambiado de ulatina- a university-)
            document.querySelectorAll('.university-program-button').forEach(btn => btn.classList.remove('university-accordion-button--active'));

        } else if (selectedProgramType) {
            // Si hay un tipo de programa seleccionado, regresar a la selección de tipo de programa
            selectedProgramType = null;
            hideElement(programsListContainer);  
            showElement(programTypesContainer);
            if (resetButton) resetButton.textContent = '← Regresar a Facultades';
            // Desactivar el highlight del tipo de programa (cambiado de ulatina- a university-)
            document.querySelectorAll('.university-program-type-button').forEach(btn => btn.classList.remove('university-accordion-button--active'));

        } else if (selectedFaculty) {
            // Si hay una facultad seleccionada, regresar a la lista de facultades
            selectedFaculty = null;
            hideElement(programTypesContainer);
            hideElement(programsListContainer);
            hideElement(programDetails);
            showElement(facultiesContainer);
            if (resetButton) resetButton.textContent = '← Regresar'; // Vuelve al estado inicial del botón
            // Desactivar el highlight de la facultad (cambiado de ulatina- a university-)
            document.querySelectorAll('.university-faculty-button').forEach(btn => btn.classList.remove('university-accordion-button--active'));

        } else {
            // Si no hay nada seleccionado, es el inicio de la navegación de la aplicación
            console.log("Reiniciando la aplicación.");
            hideElement(resetButton);
            selectedFaculty = null;
            selectedProgramType = null;
            selectedProgram = null;
            hideElement(programTypesContainer);
            hideElement(programsListContainer);
            hideElement(programDetails);
            hideMessage();
            loadFaculties(); // Vuelve a cargar las facultades (inicio)
        }
    
  };
    // --- Inicio de la Aplicación ---
    // Se asegura de que el DOM esté completamente cargado antes de inicializar Firebase y renderizar
    window.addEventListener('DOMContentLoaded', initializeFirebase);
 