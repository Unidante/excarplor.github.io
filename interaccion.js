window.uiHelpers = {
    modalElements: { // Encapsulate modal elements
        overlay: null,
        title: null,
        message: null,
        closeBtn: null,
        confirmBtn: null
    },

//     const cursorPet = document.getElementById('cursorPet');
// document.addEventListener('mousemove', (e) => {
//     cursorPet.style.left = e.pageX + 'px';
//     cursorPet.style.top = e.pageY + 'px';
// });


    initializeModalElements: function() {
        this.modalElements.overlay = document.getElementById('message-modal-overlay');
        this.modalElements.title = document.getElementById('modal-title');
        this.modalElements.message = document.getElementById('modal-message');
        this.modalElements.closeBtn = document.getElementById('modal-close-btn');
        
        if (this.modalElements.closeBtn && !document.getElementById('modal-confirm-btn')) {
            this.modalElements.confirmBtn = document.createElement('button');
            this.modalElements.confirmBtn.id = 'modal-confirm-btn';
            this.modalElements.confirmBtn.textContent = 'Confirmar';
            this.modalElements.confirmBtn.style.display = 'none';
            this.modalElements.confirmBtn.classList.add('modal-button');
            this.modalElements.closeBtn.parentNode.insertBefore(this.modalElements.confirmBtn, this.modalElements.closeBtn.nextSibling);
        } else {
            this.modalElements.confirmBtn = document.getElementById('modal-confirm-btn');
        }

        if (this.modalElements.closeBtn) {
            this.modalElements.closeBtn.addEventListener('click', () => this.hideMessageModal());
        }
    },

    showMessageModal: function(title, message, isConfirm = false, onConfirm = null) {
        if (!this.modalElements.overlay || !this.modalElements.title || !this.modalElements.message || !this.modalElements.closeBtn || !this.modalElements.confirmBtn) {
            // Fallback for environments where modal elements might not be present (e.g., direct script execution outside full HTML)
            console.warn("Modal elements not found. Using native alert/confirm.");
            if (isConfirm && onConfirm) {
                // If it's a confirmation, use native confirm and call onConfirm if true
                if (confirm(`${title}\n${message}`)) {
                    onConfirm();
                }
            } else {
                // For simple messages, use native alert
                alert(`${title}\n${message}`);
            }
            return;
        }

        this.modalElements.title.textContent = title;
        this.modalElements.message.textContent = message;
        this.modalElements.overlay.classList.add('show');

        // Clone and replace the confirm button to remove old event listeners
        const newConfirmBtn = this.modalElements.confirmBtn.cloneNode(true);
        this.modalElements.confirmBtn.parentNode.replaceChild(newConfirmBtn, this.modalElements.confirmBtn);
        this.modalElements.confirmBtn = newConfirmBtn;

        if (isConfirm && onConfirm) {
            this.modalElements.closeBtn.textContent = 'Cancelar';
            this.modalElements.confirmBtn.style.display = 'inline-block';
            this.modalElements.confirmBtn.onclick = () => {
                onConfirm();
                this.hideMessageModal();
            };
        } else {
            this.modalElements.closeBtn.textContent = 'Aceptar';
            this.modalElements.confirmBtn.style.display = 'none';
            this.modalElements.confirmBtn.onclick = null; // Remove any previous click handler
        }
    },

    hideMessageModal: function() {
        if (this.modalElements.overlay) {
            this.modalElements.overlay.classList.remove('show');
            if(this.modalElements.closeBtn) this.modalElements.closeBtn.textContent = 'Aceptar';
            if(this.modalElements.confirmBtn) this.modalElements.confirmBtn.style.display = 'none';
        }
    },

    initializeAccordions: function() {
        const accordions = document.querySelectorAll('.accordion');
        accordions.forEach(accordion => {
            // Remove previous event listener to prevent duplicates
            accordion.removeEventListener('click', this.handleAccordionClick); 
            // Add new event listener, binding 'this' to uiHelpers
            accordion.addEventListener('click', this.handleAccordionClick.bind(this))
        });
    },

    handleAccordionClick: function(event) {
        const accordionButton = event.currentTarget;
        accordionButton.classList.toggle('active-accordion');
        const panel = accordionButton.nextElementSibling;
        if (panel && panel.classList.contains('panel')) {
            if (panel.style.maxHeight) {
                panel.style.maxHeight = null; // Collapse the panel
            } else {
                panel.style.maxHeight = panel.scrollHeight + "px"; // Expand the panel
            }
        }
        const arrowIcon = accordionButton.querySelector('.arrow-icon');
        if (arrowIcon) {
            arrowIcon.innerHTML = accordionButton.classList.contains('active-accordion') ? '&#9660;' : '&#9654;'; // Toggle arrow direction
        }
    }
};


document.addEventListener('DOMContentLoaded', () => {
    window.uiHelpers.initializeModalElements(); 

    // --- Mobile Menu Functionality ---
    const menuIcon = document.getElementById('menu-icon');
    const nav = document.querySelector('.horizontal-nav');
    if (menuIcon && nav) {
        menuIcon.addEventListener('click', () => {
            nav.classList.toggle('active');
        });
    }

    // --- FAQ Functionality ---
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
           // this.classList.toggle('active');
            const answer = this.nextElementSibling;
            if (answer.style.maxHeight) {
                answer.style.maxHeight = null;
            } else {
                answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });

    // --- University Search Functionality ---
    const searchInput = document.getElementById('university-search');
    const universityCardsContainer = document.querySelector('.services.container'); // This might need adjustment based on final HTML
    if (searchInput && universityCardsContainer) {
        let allUniversityLinks = Array.from(universityCardsContainer.querySelectorAll('.service-link'));
        searchInput.addEventListener('keyup', function() { 
            const searchTerm = this.value.toLowerCase();
            allUniversityLinks.forEach(link => {
                const universityName = link.querySelector('h3').textContent.toLowerCase();
                link.style.display = universityName.includes(searchTerm) ? 'block' : 'none';
            });
        });
    }
    

    // --- Dynamic Faculty Grid Display for Udelas (if applicable) ---
    function displayFacultyGrid(udelasFacultiesData, udelasContentAreaTarget) {
        if (!udelasContentAreaTarget || !udelasFacultiesData) return;
        udelasContentAreaTarget.innerHTML = ''; // Clear previous content
        const gridContainer = document.createElement('div');
        gridContainer.className = 'faculty-grid';

        udelasFacultiesData.faculties.forEach(faculty => {
            const card = document.createElement('div');
            card.className = 'faculty-card';
            card.style.animationDelay = faculty.entryAnimationDelay || '0s'; // Apply animation delay
            card.innerHTML = `
                ${faculty.icon ? `<i class='bx ${faculty.icon}' style="font-size: 3em; margin-bottom: 15px; color: var(--text-color);"></i>` : ''}
                <h3>${faculty.name}</h3>
                <p>${faculty.description || 'Explora los programas de esta facultad.'}</p>
            `;
            card.addEventListener('click', () => displayDegreeTypesForFaculty(faculty.id, udelasFacultiesData, udelasContentAreaTarget));
            gridContainer.appendChild(card);
        });
        udelasContentAreaTarget.appendChild(gridContainer);
        // Hide loading indicator if present
        const loadingDivInUdelas = udelasContentAreaTarget.querySelector('.loading-indicator');
        if (loadingDivInUdelas) loadingDivInUdelas.style.display = 'none';
    }

    // --- Display Degree Types for a Selected Faculty ---
    function displayDegreeTypesForFaculty(facultyId, udelasFacultiesData, udelasContentAreaTarget) {
        if (!udelasContentAreaTarget || !udelasFacultiesData) return;
        udelasContentAreaTarget.innerHTML = ''; // Clear previous content
        const faculty = udelasFacultiesData.faculties.find(f => f.id === facultyId);
        if (!faculty) return;

        const selectionContainer = document.createElement('div');
        selectionContainer.className = 'degree-type-selection';
        selectionContainer.innerHTML = `<h3>${faculty.name}</h3>`;

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'degree-type-button-container';

        const degreeTypes = [
            { key: 'maestrias', name: 'Maestrías' },
            { key: 'licenciaturas', name: 'Licenciaturas' },
            { key: 'tecnicos', name: 'Técnicos' }
        ];

        degreeTypes.forEach(type => {
            if (faculty.degrees[type.key] && faculty.degrees[type.key].length > 0) {
                const button = document.createElement('button');
                button.className = 'degree-type-button';
                button.textContent = type.name;
                button.addEventListener('click', () => displayDegrees(facultyId, type.key, udelasFacultiesData, udelasContentAreaTarget));
                buttonContainer.appendChild(button);
            }
        });
        
        selectionContainer.appendChild(buttonContainer);
        const backButton = document.createElement('button');
        backButton.className = 'back-to-faculties-btn';
        backButton.textContent = '← Volver a Facultades';
        backButton.addEventListener('click', () => displayFacultyGrid(udelasFacultiesData, udelasContentAreaTarget));
        
        selectionContainer.appendChild(backButton);
        udelasContentAreaTarget.appendChild(selectionContainer);
    }

    // --- Display Specific Degrees (Maestrias, Licenciaturas, Tecnicos) ---
    function displayDegrees(facultyId, degreeTypeKey, udelasFacultiesData, udelasContentAreaTarget) {
        if (!udelasContentAreaTarget || !udelasFacultiesData) return;
        const faculty = udelasFacultiesData.faculties.find(f => f.id === facultyId);
        if (!faculty || !faculty.degrees[degreeTypeKey]) return;

        let degreeListSection = udelasContentAreaTarget.querySelector('.degree-list-section');
        if (degreeListSection) {
            degreeListSection.innerHTML = ''; // Clear previous content if exists
        } else {
            degreeListSection = document.createElement('div');
            degreeListSection.className = 'degree-list-section';
            const selectionContainer = udelasContentAreaTarget.querySelector('.degree-type-selection');
            if (selectionContainer) selectionContainer.appendChild(degreeListSection);
            else udelasContentAreaTarget.appendChild(degreeListSection);
        }
        
        const degreeTypeName = degreeTypeKey.charAt(0).toUpperCase() + degreeTypeKey.slice(1);
        degreeListSection.innerHTML = `<h3>${degreeTypeName} en ${faculty.name}</h3>`;
        const list = document.createElement('ul');
        list.className = 'degree-list';
        faculty.degrees[degreeTypeKey].forEach(degree => {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = degree.link || '#'; // Add a fallback href
            link.textContent = degree.name;
            listItem.appendChild(link);
            list.appendChild(listItem);
        });
        degreeListSection.appendChild(list);
        degreeListSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    // Expose displayFacultyGrid to global scope if needed by other scripts
    window.uiHelpers.displayUdelasFacultyGrid = displayFacultyGrid;


   // --- Carousel functionality ---
  //  Initialize Swiper
    const swiper = new Swiper('.swiper', {
        loop: true, // Enable looping
        autoplay: {
            delay: 3000, // 3 seconds delay
            disableOnInteraction: false, // Continue autoplay after user interaction
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        // Responsive breakpoints
        breakpoints: {
            640: {
                slidesPerView: 1,
                spaceBetween: 20,
            },
            768: {
                slidesPerView: 2,
                spaceBetween: 40,
            },
            1024: {
                slidesPerView: 3,
                spaceBetween: 50,
            },
        },
    });


    // --- New Topic Form Submission Logic (Forum Page) ---
    const newTopicForm = document.getElementById('new-topic-form');
    if (newTopicForm) {
        newTopicForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const titleInput = document.getElementById('topic-title');
            const contentInput = document.getElementById('topic-content');
            const title = titleInput.value.trim();
            const content = contentInput.value.trim();

            if (!title || !content) {
                window.uiHelpers.showMessageModal('Campos Requeridos', 'Por favor, completa el título y el contenido del tema.');
                return;
            }
            
            if (window.dataApi && window.dataApi.addNewForumTopic) {
                const success = await window.dataApi.addNewForumTopic(title, content);
                if (success) {
                    newTopicForm.reset(); // Clear form on success
                }
            } else {
                console.error("dataApi.addNewForumTopic no está disponible.");
                window.uiHelpers.showMessageModal('Error', 'La función para añadir temas no está disponible.');
            }
        });
    }

    // --- Firebase Auth State Change Listener (for dynamic content loading) ---
    document.addEventListener('firebaseAuthStateChanged', (event) => {
        const user = event.detail.user;
        console.log("UI Interactions: Auth state changed, user:", user ? user.uid : 'none');

        const universityPageBody = document.body;
        const currentUniversityId = universityPageBody.dataset.universityId; // Assuming university ID is set as data attribute on body

        // Load Udelas faculties if on Udelas page and data is available
        const udelasContentAreaTarget = document.getElementById('udelas-dynamic-content');
        if (currentUniversityId === 'udelas' && udelasContentAreaTarget && window.dataApi && window.dataApi.udelasData) {
            window.uiHelpers.displayUdelasFacultyGrid(window.dataApi.udelasData, udelasContentAreaTarget);
        }

        // Load non-Udelas university careers if on a university detail page
        const careersAccordionElement = document.getElementById('careers-accordion');
        if (currentUniversityId && currentUniversityId !== 'udelas' && careersAccordionElement && window.dataApi && window.dataApi.loadNonUdelasUniversityCareers) {
            window.dataApi.loadNonUdelasUniversityCareers(currentUniversityId, careersAccordionElement);
        }
        
        // Listen to forum topics if on forum page
        const topicsListElement = document.getElementById('topics-list');
        if (document.body.classList.contains('forum-page') && topicsListElement && window.dataApi && window.dataApi.listenToForumTopics) {
            window.dataApi.listenToForumTopics(topicsListElement, attachDynamicForumButtonListeners);
        }
    });

    // --- Helper function to attach event listeners to dynamically added forum topic buttons ---
    function attachDynamicForumButtonListeners(topicElement) {
        const summarizeBtn = topicElement.querySelector('.summarize-topic-btn');
        const deleteBtn = topicElement.querySelector('.delete-topic-btn');

        if (summarizeBtn) {
            summarizeBtn.addEventListener('click', async function() { 
                const parentTopicEl = this.closest('.topic');
                const topicTitle = parentTopicEl.querySelector('.topic-title').textContent;
                const topicContent = parentTopicEl.querySelector('.topic-content').innerHTML; 
                const summaryResultEl = parentTopicEl.querySelector('.topic-summary-result');
                const loadingSummaryIndicator = parentTopicEl.querySelector('.loading-indicator-summary');
                
                if (window.dataApi && window.dataApi.summarizeForumTopic) {
                    await window.dataApi.summarizeForumTopic(topicTitle, topicContent, summaryResultEl, loadingSummaryIndicator);
                } else {
                    console.error("dataApi.summarizeForumTopic no disponible.");
                    window.uiHelpers.showMessageModal('Error', 'La función de resumen no está disponible.');
                }
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', async function() { 
                const topicId = this.closest('.topic').dataset.topicId;
                if (window.dataApi && window.dataApi.deleteForumTopic) {
                    // Use a confirmation modal before deleting
                    window.uiHelpers.showMessageModal(
                        'Confirmar Eliminación', 
                        '¿Estás seguro de que quieres eliminar este tema? Esta acción no se puede deshacer.', 
                        true, // isConfirm = true
                        async () => { // onConfirm callback
                            await window.dataApi.deleteForumTopic(topicId);
                        }
                    );
                } else {
                    console.error("dataApi.deleteForumTopic no disponible.");
                    window.uiHelpers.showMessageModal('Error', 'La función para eliminar temas no está disponible.');
                }
            });
        }
    }
    
    // Expose this helper function globally for use by dataApi
    window.uiHelpers.attachDynamicForumButtonListeners = attachDynamicForumButtonListeners;


});
document.addEventListener('DOMContentLoaded', function() {
    const carouselContainer = document.querySelector('.carousel-container');
    if (!carouselContainer) {
        console.warn("Elemento '.carousel-container' no encontrado. El carrusel no se inicializará.");
        return;
    }

    const carouselSlide = carouselContainer.querySelector('.carousel-slide');
    const carouselImages = carouselSlide ? Array.from(carouselSlide.querySelectorAll('img')) : [];
    const prevButton = carouselContainer.querySelector('.carousel-prev');
    const nextButton = carouselContainer.querySelector('.carousel-next');

    let currentImageIndex = 0;
    const totalImages = carouselImages.length;

    // Si no hay imágenes, no inicializar el carrusel
    if (totalImages === 0) {
        console.warn("No se encontraron imágenes en el carrusel. El carrusel no funcionará.");
        return;
    }

    // Ocultar todas las imágenes excepto la primera
    function showImage(index) {
        carouselImages.forEach((img, i) => {
            img.style.display = (i === index) ? 'block' : 'none';
        });
    }

    // Función para ir a la imagen anterior
    function goToPrevImage() {
        currentImageIndex = (currentImageIndex === 0) ? totalImages - 1 : currentImageIndex - 1;
        showImage(currentImageIndex);
    }

    // Función para ir a la imagen siguiente
    function goToNextImage() {
        currentImageIndex = (currentImageIndex === totalImages - 1) ? 0 : currentImageIndex + 1;
        showImage(currentImageIndex);
    }

    // Añadir event listeners a los botones de navegación
    if (prevButton) {
        prevButton.addEventListener('click', goToPrevImage);
    }
    if (nextButton) {
        nextButton.addEventListener('click', goToNextImage);
    }

    // Inicializar mostrando la primera imagen
    showImage(currentImageIndex);


    // });
});
