document.addEventListener('DOMContentLoaded', function() {
            // Element references
            const advisorList = document.getElementById('advisor-list');
            const searchInput = document.getElementById('search-input');
            const careerFilter = document.getElementById('career-filter');
            const advisorDetailOverlay = document.getElementById('advisor-detail-overlay');
            const closeAdvisorDetailButton = document.getElementById('close-advisor-detail');

            const detailImage = document.getElementById('detail-image');
            const detailName = document.getElementById('detail-name');
            const detailCareer = document.getElementById('detail-career');

            const chatMessagesContainer = document.getElementById('chat-messages');
            const userQuestionInput = document.getElementById('user-question');
            const sendQuestionButton = document.getElementById('send-question-button');
            const loadingIndicator = document.getElementById('loading-indicator');
            const chatDisabledMessage = document.getElementById('chat-disabled-message');

            let currentAdvisor = null; // To keep track of the currently selected advisor

            // Fictional advisor data (101 advisors, including Aura IA)
            const advisors = [
                {
                    id: 1,
                    name: "Dr. Alejandro Vargas",
                    career: "Ingeniería Aeroespacial",
                    description: "Experto en propulsión y diseño de naves. Ayudo a estudiantes a alcanzar las estrellas.",
                    longDescription: "El Dr. Vargas tiene más de 15 años de experiencia en la industria aeroespacial, con un doctorado en propulsión avanzada. Ha trabajado en proyectos innovadores y está comprometido a guiar a la próxima generación de ingenieros aeroespaciales en la creación de futuras misiones espaciales. Su pasión es inspirar la curiosidad y el rigor científico para que juntos, diseñemos el mañana.",
                    email: "alejandro.vargas@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/4.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "¡Hola! Soy el Dr. Vargas. ¿En qué puedo ayudarte con Ingeniería Aeroespacial?" }] }]
                },
                {
                    id: 2,
                    name: "Lic. Sofía Robles",
                    career: "Psicología Clínica",
                    description: "Acompaño a mis estudiantes en su crecimiento personal y profesional.",
                    longDescription: "La Lic. Robles es una psicóloga clínica con una especialización en bienestar estudiantil. Su enfoque se centra en proporcionar herramientas para la gestión del estrés, el desarrollo de habilidades de afrontamiento y el apoyo emocional durante la vida universitaria. Cree firmemente en la importancia de la salud mental para el éxito académico y la vida plena.",
                    email: "sofia.robles@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/5.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Sofía. Estoy aquí para apoyarte en cualquier aspecto de Psicología Clínica. ¿Qué te gustaría saber?" }] }]
                },
                {
                    id: 3,
                    name: "Mtro. Carlos Gómez",
                    career: "Economía y Finanzas",
                    description: "Asesor financiero con visión de futuro para sus inversiones académicas.",
                    longDescription: "El Mtro. Gómez es un economista experimentado con un máster en finanzas cuantitativas. Su asesoramiento se enfoca en ayudar a los estudiantes a comprender los mercados globales, la inversión y la gestión de riesgos, preparándolos para carreras en banca, consultoría o emprendimiento. Su meta es capacitar líderes financieros capaces de transformar el panorama económico.",
                    email: "carlos.gomez@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/6.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Saludos, soy Carlos Gómez. ¿Cómo puedo orientarte en el mundo de la Economía y Finanzas hoy?" }] }]
                },
                {
                    id: 4,
                    name: "Dra. Laura Fernández",
                    career: "Biología Marina",
                    description: "Sumérgete en el estudio de la vida oceánica y su conservación.",
                    longDescription: "La Dra. Fernández es una reconocida bióloga marina con amplia experiencia en ecología de arrecifes y conservación. Su investigación se centra en el impacto del cambio climático en los ecosistemas marinos y la educación para la sostenibilidad. Inspira a los estudiantes a proteger nuestros océanos y a convertirse en guardianes del azul profundo.",
                    email: "laura.fernandez@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/7.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "¡Bienvenido al océano de la Biología Marina! Soy Laura Fernández. ¿Qué misterios quieres explorar hoy?" }] }]
                },
                {
                    id: 5,
                    name: "Ing. Ricardo Soto",
                    career: "Ingeniería de Software",
                    description: "Construyendo el futuro digital línea por línea de código.",
                    longDescription: "El Ing. Soto es un desarrollador de software con experiencia en inteligencia artificial y aprendizaje automático. Su pasión es enseñar metodologías ágiles y el desarrollo de aplicaciones escalables. Prepara a los estudiantes para los desafíos del mundo tecnológico moderno y la innovación constante que exige la era digital.",
                    email: "ricardo.soto@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/8.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Ricardo. ¿Listos para programar el futuro? Pregúntame sobre Ingeniería de Software." }] }]
                },
                {
                    id: 6,
                    name: "Lic. Andrea Paz",
                    career: "Comunicación Social",
                    description: "Conviértete en un narrador de historias impactantes y efectivas.",
                    longDescription: "La Lic. Paz es una estratega de comunicación con experiencia en medios digitales y relaciones públicas. Guía a los estudiantes en el arte de la persuasión, el análisis crítico de la información y la creación de campañas de comunicación efectivas. Fomenta la ética y la responsabilidad social en los futuros comunicadores que moldearán el discurso público.",
                    email: "andrea.paz@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/9.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Andrea, especialista en Comunicación Social. ¿Qué historia quieres contar hoy, o en qué te puedo ayudar a comunicarte mejor?" }] }]
                },
                {
                    id: 7,
                    name: "Dr. Marco Polo",
                    career: "Historia del Arte",
                    description: "Un viaje a través de la creatividad y la expresión humana.",
                    longDescription: "El Dr. Polo es un historiador del arte especializado en el Renacimiento y el arte moderno. Su enfoque es ayudar a los estudiantes a desarrollar un ojo crítico para la estética, la iconografía y el contexto cultural de las obras de arte. Les anima a explorar las conexiones entre el arte y la sociedad a lo largo del tiempo, descubriendo la belleza en cada época.",
                    email: "marco.polo@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/10.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "¡Hola! Soy el Dr. Polo. ¿Qué obra de arte o período te intriga hoy?" }] }]
                },
                {
                    id: 8,
                    name: "Mtra. Gisela Méndez",
                    career: "Educación Especial",
                    description: "Creando entornos inclusivos para todos los estudiantes.",
                    longDescription: "La Mtra. Méndez es una educadora especializada en necesidades educativas especiales y diseño universal de aprendizaje. Capacita a futuros docentes para adaptar currículos y metodologías, asegurando que todos los estudiantes reciban una educación de calidad. Su misión es promover la equidad y la inclusión en el aula, construyendo puentes para el aprendizaje.",
                    email: "gisela.mendez@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/11.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Saludos, soy Gisela. ¿Cómo puedo ayudarte a crear un entorno educativo más inclusivo?" }] }]
                },
                {
                    id: 9,
                    name: "Ing. Daniel Cruz",
                    career: "Ingeniería Civil",
                    description: "Diseñando las infraestructuras que sostienen nuestro mundo.",
                    longDescription: "El Ing. Cruz es un ingeniero civil con una sólida trayectoria en diseño estructural y gestión de proyectos de gran escala. Proporciona a los estudiantes las bases para construir edificaciones seguras, sostenibles e innovadoras, desde puentes hasta rascacielos. Su experiencia es un puente para el éxito profesional en la construcción del mañana.",
                    email: "daniel.cruz@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/12.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Daniel. ¿Qué quieres construir hoy en el ámbito de la Ingeniería Civil?" }] }]
                },
                {
                    id: 10,
                    name: "Lic. Valeria Quiroz",
                    career: "Diseño Gráfico",
                    description: "Transformando ideas en imágenes que comunican y cautivan.",
                    longDescription: "La Lic. Quiroz es una diseñadora gráfica con una visión creativa y un dominio de las herramientas digitales. Enseña a los estudiantes a desarrollar identidades visuales, campañas publicitarias y diseños web, enfocándose en la estética, la usabilidad y la efectividad comunicativa. Su objetivo es formar mentes creativas y estratégicas que dejen huella visual.",
                    email: "valeria.quiroz@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/13.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Valeria. ¿Hablamos de cómo tus ideas pueden tomar forma visual en Diseño Gráfico?" }] }]
                },
                {
                    id: 11,
                    name: "Dr. Felipe Soto",
                    career: "Física Cuántica",
                    description: "Explorando los misterios del universo a escala subatómica.",
                    longDescription: "El Dr. Soto es un físico teórico con un profundo conocimiento de la mecánica cuántica y la relatividad. Guía a los estudiantes a través de los conceptos más complejos de la física moderna, fomentando el pensamiento crítico y la capacidad de resolver problemas abstractos. Su investigación abre nuevas fronteras del conocimiento y la comprensión del cosmos.",
                    email: "felipe.soto@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/14.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Saludos, soy Felipe. ¿Listo para explorar el universo subatómico en Física Cuántica?" }] }]
                },
                {
                    id: 12,
                    name: "Mtra. Paula Ramos",
                    career: "Literaturas Modernas",
                    description: "Descubriendo mundos a través de las palabras y sus autores.",
                    longDescription: "La Mtra. Ramos es una especialista en literatura contemporánea y crítica literaria. Anima a los estudiantes a analizar textos con profundidad, a desarrollar su propia voz como escritores y a comprender el impacto de la literatura en la sociedad. Promueve la lectura crítica y la expresión creativa, desatando el poder de la narrativa.",
                    email: "paula.ramos@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/15.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Paula. ¿Qué libro o autor te gustaría analizar hoy en Literaturas Modernas?" }] }]
                },
                {
                    id: 13,
                    name: "Ing. Gustavo Salas",
                    career: "Ingeniería Eléctrica",
                    description: "La energía del futuro está en tus manos, literal.",
                    longDescription: "El Ing. Salas es un experto en sistemas de energía renovable y electrónica de potencia. Prepara a los estudiantes para diseñar y optimizar redes eléctricas inteligentes, sistemas de generación limpia y dispositivos electrónicos de vanguardia. Su objetivo es impulsar la innovación en el sector energético, iluminando el camino hacia la sostenibilidad.",
                    email: "gustavo.salas@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/16.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Gustavo. ¿Listo para conectar tus ideas en Ingeniería Eléctrica?" }] }]
                },
                {
                    id: 14,
                    name: "Lic. Emilia Castro",
                    career: "Trabajo Social",
                    description: "Construyendo comunidades más fuertes y justas para todos.",
                    longDescription: "La Lic. Castro es una trabajadora social comprometida con la justicia social y el empoderamiento comunitario. Enseña a los estudiantes a intervenir en problemáticas sociales complejas, a abogar por poblaciones vulnerables y a diseñar programas de desarrollo social sostenibles. Su vocación es generar un impacto positivo en la sociedad, un cambio a la vez.",
                    email: "emilia.castro@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/17.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Emilia. ¿En qué temas de Trabajo Social necesitas orientación hoy?" }] }]
                },
                {
                    id: 15,
                    name: "Dr. Roberto Núñez",
                    career: "Medicina Veterinaria",
                    description: "Cuidando a nuestros compañeros animales con ciencia y compasión.",
                    longDescription: "El Dr. Núñez es un veterinario con especialización en cirugía de pequeños animales y medicina de fauna silvestre. Comparte su amplio conocimiento y experiencia práctica, formando profesionales capaces de diagnosticar, tratar y prevenir enfermedades en animales, así como promover su bienestar. Su amor por los animales es contagioso y su compromiso inquebrantable.",
                    email: "roberto.nuñez@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/18.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Roberto. ¿Tienes preguntas sobre el cuidado animal o Medicina Veterinaria?" }] }]
                },
                {
                    id: 16,
                    name: "Mtra. Elena Benítez",
                    career: "Arqueología",
                    description: "Desenterrando el pasado para entender nuestro presente.",
                    longDescription: "La Mtra. Benítez es una arqueóloga experta en civilizaciones antiguas y métodos de excavación. Ofrece una perspectiva única sobre la historia humana a través del estudio de artefactos y sitios arqueológicos. Anima a los estudiantes a desarrollar habilidades de investigación rigurosas y una profunda apreciación por el patrimonio cultural que nos define.",
                    email: "elena.benitez@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/19.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Elena. ¿Listo para desenterrar los secretos del pasado en Arqueología?" }] }]
                },
                {
                    id: 17,
                    name: "Ing. Pablo Mora",
                    career: "Ingeniería Industrial",
                    description: "Optimizando procesos para un futuro más eficiente.",
                    longDescription: "El Ing. Mora es un consultor en eficiencia operativa y gestión de la cadena de suministro. Enseña a los estudiantes cómo mejorar la productividad, reducir costos y optimizar sistemas complejos en diversas industrias, desde la manufactura hasta los servicios. Su objetivo es formar ingenieros con una visión integral, listos para los desafíos del mercado.",
                    email: "pablo.mora@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/20.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Pablo. ¿Cómo podemos optimizar tus dudas sobre Ingeniería Industrial?" }] }]
                },
                {
                    id: 18,
                    name: "Lic. Isabel Ramos",
                    career: "Periodismo Digital",
                    description: "La verdad en la era digital: investiga, reporta, innova.",
                    longDescription: "La Lic. Ramos es una periodista galardonada con experiencia en investigación y producción de contenido multimedia. Capacita a los estudiantes para navegar el panorama mediático actual, verificar información, y crear reportajes impactantes y éticos para plataformas digitales. Fomenta la búsqueda de la verdad y la responsabilidad periodística en cada historia contada.",
                    email: "isabel.ramos@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/21.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Isabel. ¿Qué noticia quieres investigar hoy en Periodismo Digital?" }] }]
                },
                {
                    id: 19,
                    name: "Dr. Javier López",
                    career: "Ciencias de la Computación",
                    description: "Desarrollando la próxima generación de tecnología inteligente.",
                    longDescription: "El Dr. López es un investigador en inteligencia artificial y algoritmos complejos. Su trabajo se centra en el diseño de sistemas computacionales que resuelven problemas del mundo real. Guía a los estudiantes en el dominio de estructuras de datos, programación avanzada y el pensamiento lógico que impulsa la innovación tecnológica y la resolución de desafíos complejos.",
                    email: "javier.lopez@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/22.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Javier. ¿Listo para sumergirte en el mundo de las Ciencias de la Computación?" }] }]
                },
                {
                    id: 20,
                    name: "Mtra. Carmen Ruiz",
                    career: "Nutrición y Dietética",
                    description: "Alimentando el bienestar desde la ciencia y la práctica.",
                    longDescription: "La Mtra. Ruiz es una nutricionista clínica con experiencia en educación alimentaria y desarrollo de dietas personalizadas. Enseña a los estudiantes sobre la importancia de la alimentación en la salud, la prevención de enfermedades y el manejo de condiciones médicas a través de la dieta. Su misión es promover hábitos de vida saludables y una relación consciente con los alimentos.",
                    email: "carmen.ruiz@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/23.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Carmen. ¿Qué quieres saber sobre Nutrición y Dietética hoy?" }] }]
                },
                {
                    id: 21,
                    name: "Ing. José Luis Solís",
                    career: "Robótica y Automatización",
                    description: "Diseñando máquinas que transforman industrias.",
                    longDescription: "El Ing. Solís es un pionero en robótica industrial y sistemas de control automático. Su experiencia abarca desde el diseño de brazos robóticos hasta la implementación de fábricas inteligentes. Forma a los estudiantes para liderar la revolución de la automatización y la inteligencia artificial en la manufactura y más allá, construyendo el futuro de la industria.",
                    email: "jose.solis@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/24.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy José Luis. ¿Listo para construir el futuro con Robótica y Automatización?" }] }]
                },
                {
                    id: 22,
                    name: "Lic. Mónica Castro",
                    career: "Marketing Digital",
                    description: "Conectando marcas con su audiencia en el mundo online.",
                    longDescription: "La Lic. Castro es una estratega de marketing digital con un enfoque en SEO, SEM y redes sociales. Capacita a los estudiantes para crear campañas digitales exitosas, analizar métricas y comprender el comportamiento del consumidor en línea. Su objetivo es formar expertos en marketing para la era digital, capaces de construir relaciones significativas entre marcas y personas.",
                    email: "monica.castro@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/25.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Mónica. ¿En qué estrategia de Marketing Digital puedo ayudarte?" }] }]
                },
                {
                    id: 23,
                    name: "Dr. Fernando Morales",
                    career: "Neurociencia",
                    description: "Desvelando los secretos del cerebro y la mente humana.",
                    longDescription: "El Dr. Morales es un neurocientífico especializado en cognición y comportamiento. Su investigación se centra en cómo el cerebro procesa la información y da forma a nuestras experiencias. Guía a los estudiantes en la exploración de las complejidades del sistema nervioso y las implicaciones para la salud y la tecnología, abriendo la puerta a los misterios de la mente.",
                    email: "fernando.morales@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/26.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Fernando. ¿Qué misterio del cerebro quieres desvelar hoy en Neurociencia?" }] }]
                },
                {
                    id: 24,
                    name: "Mtra. Regina Díaz",
                    career: "Gestión Cultural",
                    description: "Impulsando el arte y la cultura en la sociedad.",
                    longDescription: "La Mtra. Díaz es una gestora cultural con experiencia en la planificación y ejecución de eventos artísticos y proyectos culturales. Enseña a los estudiantes cómo administrar instituciones culturales, desarrollar audiencias y fomentar el impacto social del arte. Su pasión es hacer que la cultura sea accesible para todos, enriqueciendo vidas y comunidades.",
                    email: "regina.diaz@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/27.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Regina. ¿Hablamos de cómo impulsar la cultura en Gestión Cultural?" }] }]
                },
                {
                    id: 25,
                    name: "Ing. Arturo Reyes",
                    career: "Ingeniería Química",
                    description: "Transformando la materia para un futuro sostenible.",
                    longDescription: "El Ing. Reyes es un ingeniero químico con un enfoque en procesos industriales y desarrollo de nuevos materiales. Guía a los estudiantes en la aplicación de principios químicos y físicos para diseñar y optimizar la producción de bienes, desde productos farmacéuticos hasta combustibles. Su visión es la de una industria más limpia y eficiente, en armonía con el medio ambiente.",
                    email: "arturo.reyes@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/28.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Arturo. ¿Listo para transformar tus ideas en realidad con Ingeniería Química?" }] }]
                },
                {
                    id: 26,
                    name: "Lic. Natalia Flores",
                    career: "Relaciones Internacionales",
                    description: "Comprendiendo y navegando el complejo escenario global.",
                    longDescription: "La Lic. Flores es una experta en diplomacia y política exterior. Prepara a los estudiantes para analizar conflictos internacionales, negociar acuerdos y trabajar en organismos multilaterales. Su conocimiento profundo de la geopolítica actual es clave para formar futuros líderes globales capaces de construir la paz y la cooperación.",
                    email: "natalia.flores@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/29.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Natalia. ¿Qué te intriga del escenario global en Relaciones Internacionales?" }] }]
                },
                {
                    id: 27,
                    name: "Dr. Omar Pardo",
                    career: "Artes Visuales",
                    description: "Explora la creatividad y la expresión a través del lienzo.",
                    longDescription: "El Dr. Pardo es un artista visual y teórico del arte contemporáneo. Inspira a los estudiantes a desarrollar su propio lenguaje artístico, experimentar con diversas técnicas y contextualizar su obra dentro de las tendencias actuales. Fomenta la experimentación y la reflexión crítica en el proceso creativo, cultivando la innovación visual.",
                    email: "omar.pardo@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/30.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Omar. ¿Listo para explorar el arte en Artes Visuales?" }] }]
                },
                {
                    id: 28,
                    name: "Mtro. Luisa Herrera",
                    career: "Filosofía",
                    description: "Pregúntate, reflexiona, comprende el mundo y tu lugar en él.",
                    longDescription: "La Mtro. Herrera es una filósofa especializada en ética y filosofía política. Desafía a los estudiantes a pensar críticamente sobre las grandes preguntas de la existencia, la moralidad y la sociedad. Su guía les ayuda a desarrollar un marco conceptual para comprender y actuar en el mundo, fomentando el pensamiento profundo y la sabiduría.",
                    email: "luisa.herrera@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/31.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Luisa. ¿Qué pregunta filosófica te desvela hoy?" }] }]
                },
                {
                    id: 29,
                    name: "Ing. Sergio Dávila",
                    career: "Ingeniería Mecatrónica",
                    description: "Fusionando mecánica, electrónica y programación para innovar.",
                    longDescription: "El Ing. Dávila es un experto en el diseño y control de sistemas mecatrónicos, desde robots hasta dispositivos médicos. Combina principios de mecánica, electrónica y software para crear soluciones innovadoras. Forma a ingenieros capaces de integrar diversas disciplinas para desarrollar tecnologías de vanguardia que transformen el futuro.",
                    email: "sergio.davila@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/32.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Sergio. ¿Hablamos de cómo la Ingeniería Mecatrónica puede innovar el mundo?" }] }]
                },
                {
                    id: 30,
                    name: "Lic. Jimena Vera",
                    career: "Ciencias Políticas",
                    description: "Analizando el poder y las estructuras de gobierno.",
                    longDescription: "La Lic. Vera es una politóloga con experiencia en análisis de políticas públicas y sistemas electorales. Proporciona a los estudiantes las herramientas para comprender la dinámica del poder, los procesos democráticos y los desafíos de la gobernanza. Les inspira a participar activamente en la construcción de una sociedad mejor y más equitativa.",
                    email: "jimena.vera@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/33.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Jimena. ¿Qué tema de Ciencias Políticas te gustaría explorar?" }] }]
                },
                {
                    id: 31,
                    name: "Dr. Gabriel Soto",
                    career: "Geología",
                    description: "Descubriendo los secretos de la Tierra bajo nuestros pies.",
                    longDescription: "El Dr. Soto es un geólogo especializado en tectónica de placas y recursos minerales. Guía a los estudiantes en el estudio de la formación de la Tierra, sus procesos geológicos y la exploración de recursos naturales. Su experiencia en campo y laboratorio es invaluable para entender nuestro planeta y su evolución a lo largo del tiempo.",
                    email: "gabriel.soto@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/34.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Gabriel. ¿Listo para explorar la Geología y los secretos de la Tierra?" }] }]
                },
                {
                    id: 32,
                    name: "Mtro. Ana Belén",
                    career: "Teatro y Actuación",
                    description: "Da vida a las historias en el escenario y más allá.",
                    longDescription: "La Mtro. Belén es una directora de teatro y actriz con una vasta experiencia en las artes escénicas. Enseña a los estudiantes las técnicas de actuación, dirección y producción teatral, fomentando la creatividad, la disciplina y la capacidad de conectar con el público. Inspira a sus alumnos a encontrar su propia voz a través del arte y la interpretación.",
                    email: "ana.belen@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/35.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Ana Belén. ¿Qué papel quieres interpretar hoy en Teatro y Actuación?" }] }]
                },
                {
                    id: 33,
                    name: "Ing. Diego Pardo",
                    career: "Ingeniería Biomédica",
                    description: "Innovación tecnológica al servicio de la salud.",
                    longDescription: "El Ing. Pardo es un bioingeniero con experiencia en diseño de dispositivos médicos e instrumentación biomédica. Capacita a los estudiantes para desarrollar tecnologías que mejoran el diagnóstico, tratamiento y rehabilitación de pacientes. Su trabajo es un puente entre la ingeniería y la medicina, impulsando avances que salvan vidas.",
                    email: "diego.pardo@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/36.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Diego. ¿Hablamos de cómo la Ingeniería Biomédica está revolucionando la salud?" }] }]
                },
                {
                    id: 34,
                    name: "Lic. Carolina Mora",
                    career: "Derecho Internacional",
                    description: "Navegando las leyes que rigen las relaciones globales.",
                    longDescription: "La Lic. Mora es una abogada especializada en derecho internacional público y derechos humanos. Prepara a los estudiantes para comprender y aplicar las normativas que regulan las relaciones entre estados y organizaciones internacionales, así como la protección de los derechos fundamentales. Su visión es un mundo más justo a través del derecho y la diplomacia.",
                    email: "carolina.mora@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/37.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Carolina. ¿Qué aspectos del Derecho Internacional te interesan hoy?" }] }]
                },
                {
                    id: 35,
                    name: "Dr. Miguel Ángel Soto",
                    career: "Astronomía",
                    description: "Desvelando los misterios del cosmos.",
                    longDescription: "El Dr. Soto es un astrónomo observacional con un profundo interés en la formación de galaxias y la cosmología. Guía a los estudiantes en el uso de telescopios avanzados y el análisis de datos astronómicos, invitándolos a explorar el vasto universo y sus enigmas. Su pasión por el espacio es contagiosa y su conocimiento ilumina el firmamento.",
                    email: "miguel.soto@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/38.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Miguel Ángel. ¿Listo para viajar por el cosmos en Astronomía?" }] }]
                },
                {
                    id: 36,
                    name: "Mtra. Victoria López",
                    career: "Danza Contemporánea",
                    description: "Movimiento y expresión sin límites.",
                    longDescription: "La Mtra. López es una coreógrafa y bailarina con una trayectoria destacada en la danza contemporánea. Enseña a los estudiantes a explorar el movimiento como forma de expresión artística, desarrollar técnica y creatividad, y comprender el cuerpo como instrumento de comunicación. Inspira a sus alumnos a encontrar su propia voz a través del baile y la libertad de la expresión corporal.",
                    email: "victoria.lopez@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/39.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Victoria. ¿Qué movimiento te inspira hoy en Danza Contemporánea?" }] }]
                },
                {
                    id: 37,
                    name: "Ing. Andrés Salas",
                    career: "Ingeniería de Minas",
                    description: "Extrayendo recursos con seguridad y sostenibilidad.",
                    longDescription: "El Ing. Salas es un ingeniero de minas con experiencia en exploración, extracción y procesamiento de minerales. Capacita a los estudiantes en las mejores prácticas de la industria, la gestión de la seguridad y el impacto ambiental, formando profesionales responsables para el sector extractivo. Su conocimiento es fundamental para una minería sostenible y consciente.",
                    email: "andres.salas@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/40.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Andrés. ¿Qué quieres desenterrar hoy en Ingeniería de Minas?" }] }]
                },
                {
                    id: 38,
                    name: "Lic. Daniela Ruiz",
                    career: "Turismo Sostenible",
                    description: "Descubriendo el mundo de forma responsable y ética.",
                    longDescription: "La Lic. Ruiz es una especialista en turismo ecológico y desarrollo comunitario. Enseña a los estudiantes a diseñar y gestionar experiencias turísticas que respeten el medio ambiente y beneficien a las comunidades locales. Su visión es un turismo que genere un impacto positivo duradero, protegiendo los destinos para las futuras generaciones.",
                    email: "daniela.ruiz@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/41.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Daniela. ¿Cómo podemos hacer el turismo más sostenible hoy?" }] }]
                },
                {
                    id: 39,
                    name: "Dr. Benjamín Cruz",
                    career: "Matemáticas Aplicadas",
                    description: "Resolviendo problemas complejos con el poder de los números.",
                    longDescription: "El Dr. Cruz es un matemático con experiencia en modelado y simulación. Guía a los estudiantes en la aplicación de herramientas matemáticas para resolver problemas en ciencia, ingeniería y finanzas. Fomenta el pensamiento analítico y la capacidad de abstracción para abordar desafíos del mundo real con rigor y precisión.",
                    email: "benjamin.cruz@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/42.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Benjamín. ¿Qué problema matemático quieres resolver hoy en Matemáticas Aplicadas?" }] }]
                },
                {
                    id: 40,
                    name: "Mtra. Gabriela Pérez",
                    career: "Musicología",
                    description: "Explorando la historia, teoría y significado de la música.",
                    longDescription: "La Mtra. Pérez es una musicóloga especializada en música clásica y etnomusicología. Invita a los estudiantes a un viaje a través de la historia de la música, sus formas y su impacto cultural. Desarrolla la escucha crítica y la apreciación por la diversidad musical del mundo. Su conocimiento es una sinfonía que resuena con la belleza del sonido.",
                    email: "gabriela.perez@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/43.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Gabriela. ¿Qué ritmo de la Musicología te gustaría explorar hoy?" }] }]
                },
                {
                    id: 41,
                    name: "Dr. Camilo Noguera",
                    career: "Ciencias del Deporte",
                    description: "Optimizando el rendimiento atlético y la salud.",
                    longDescription: "El Dr. Noguera es un fisiólogo del ejercicio con un enfoque en el rendimiento deportivo y la prevención de lesiones. Ayuda a los estudiantes a comprender la biomecánica, la nutrición deportiva y la psicología del deporte para formar profesionales que impulsen el bienestar y la excelencia atlética. Su pasión es el movimiento y la salud integral.",
                    email: "camilo.noguera@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/44.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Camilo. ¿Cómo podemos llevar tu rendimiento al siguiente nivel en Ciencias del Deporte?" }] }]
                },
                {
                    id: 42,
                    name: "Lic. Sofía Jiménez",
                    career: "Diseño de Interiores",
                    description: "Creando espacios que inspiran y mejoran vidas.",
                    longDescription: "La Lic. Jiménez es una diseñadora de interiores con una visión innovadora para transformar ambientes. Guía a los estudiantes en el uso de principios de diseño, selección de materiales y gestión de proyectos para crear espacios funcionales, estéticos y sostenibles. Su creatividad y atención al detalle son su firma.",
                    email: "sofia.jimenez@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/45.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Sofía. ¿Qué espacio quieres diseñar hoy en Diseño de Interiores?" }] }]
                },
                {
                    id: 43,
                    name: "Mtro. Pedro Rivas",
                    career: "Gestión de Proyectos",
                    description: "Liderando iniciativas hacia el éxito y la eficiencia.",
                    longDescription: "El Mtro. Rivas es un experto en gestión de proyectos con certificaciones reconocidas globalmente. Enseña a los estudiantes metodologías ágiles, planificación estratégica y gestión de equipos para llevar proyectos complejos a buen término. Su enfoque es la practicidad y la obtención de resultados tangibles.",
                    email: "pedro.rivas@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/46.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Pedro. ¿Hablamos de cómo gestionar tus proyectos al éxito?" }] }]
                },
                {
                    id: 44,
                    name: "Dra. Elisa Montes",
                    career: "Sociología Urbana",
                    description: "Analizando la vida en nuestras ciudades en evolución.",
                    longDescription: "La Dra. Montes es una socióloga urbana especializada en desarrollo comunitario y políticas de vivienda. Investiga las dinámicas sociales en entornos urbanos, ayudando a los estudiantes a comprender los desafíos y oportunidades de las ciudades modernas. Su objetivo es formar agentes de cambio para un urbanismo más inclusivo.",
                    email: "elisa.montes@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/47.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Elisa. ¿Qué aspectos de la Sociología Urbana te interesan hoy?" }] }]
                },
                {
                    id: 45,
                    name: "Ing. Guillermo Vera",
                    career: "Ingeniería de Telecomunicaciones",
                    description: "Conectando el mundo a través de la tecnología.",
                    longDescription: "El Ing. Vera es un experto en redes de comunicación y sistemas inalámbricos. Prepara a los estudiantes para diseñar, implementar y gestionar infraestructuras de telecomunicaciones que habilitan la conectividad global. Su conocimiento es clave para el avance de la sociedad digital.",
                    email: "guillermo.vera@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/48.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Guillermo. ¿Listo para conectar tus ideas en Ingeniería de Telecomunicaciones?" }] }]
                },
                {
                    id: 46,
                    name: "Lic. Alejandra Díaz",
                    career: "Diseño de Moda",
                    description: "De la idea al atuendo, crea tu propia tendencia.",
                    longDescription: "La Lic. Díaz es una diseñadora de moda con experiencia en alta costura y prêt-à-porter. Enseña a los estudiantes el proceso completo de creación de colecciones, desde el boceto y la selección de tejidos hasta la producción. Su meta es formar mentes creativas con un fuerte sentido estético y de negocio.",
                    email: "alejandra.diaz@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/49.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Alejandra. ¿Qué tendencia quieres crear hoy en Diseño de Moda?" }] }]
                },
                {
                    id: 47,
                    name: "Dr. Oscar Reyes",
                    career: "Lingüística Computacional",
                    description: "Puentes entre lenguajes humanos y máquinas.",
                    longDescription: "El Dr. Reyes es un investigador en procesamiento de lenguaje natural (NLP) y lingüística computacional. Guía a los estudiantes en el desarrollo de algoritmos para entender y generar texto humano, desde traductores hasta asistentes de voz. Su trabajo es fundamental para la interacción humano-computadora.",
                    email: "oscar.reyes@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/50.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Oscar. ¿Listo para programar el lenguaje en Lingüística Computacional?" }] }]
                },
                {
                    id: 48,
                    name: "Mtra. Fernanda Soto",
                    career: "Psicopedagogía",
                    description: "Desbloqueando el potencial de aprendizaje en cada individuo.",
                    longDescription: "La Mtra. Soto es una psicopedagoga especializada en dificultades de aprendizaje y estrategias educativas. Ayuda a los estudiantes a diseñar intervenciones pedagógicas personalizadas, fomentando un entorno de aprendizaje inclusivo y efectivo. Su misión es apoyar el desarrollo cognitivo y emocional de los niños y jóvenes.",
                    email: "fernanda.soto@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/51.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Fernanda. ¿Cómo podemos desbloquear tu potencial de aprendizaje en Psicopedagogía?" }] }]
                },
                {
                    id: 49,
                    name: "Ing. Luis Pérez",
                    career: "Ingeniería Aeroespacial",
                    description: "Innovando en sistemas de vuelo y exploración espacial.",
                    longDescription: "El Ing. Pérez es un experto en diseño de aeronaves y sistemas de propulsión. Con 10 años en la industria, su enfoque es la eficiencia y la seguridad. Prepara a los estudiantes para los retos de la ingeniería moderna, combinando teoría y práctica en cada lección.",
                    email: "luis.perez@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/52.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Luis. ¿Listo para despegar en Ingeniería Aeroespacial?" }] }]
                },
                {
                    id: 50,
                    name: "Lic. Patricia Orellana",
                    career: "Periodismo de Investigación",
                    description: "Buscando la verdad, revelando lo oculto.",
                    longDescription: "La Lic. Orellana es una periodista condecorada por su trabajo en investigación de casos complejos. Enseña las técnicas de recolección de pruebas, entrevistas y análisis crítico. Su meta es formar profesionales valientes, comprometidos con la transparencia y la justicia social a través de la palabra escrita.",
                    email: "patricia.orellana@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/53.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Patricia. ¿Qué verdad quieres desenterrar hoy en Periodismo de Investigación?" }] }]
                },
                {
                    id: 51,
                    name: "Dr. Rodrigo Castro",
                    career: "Bioquímica",
                    description: "Las moléculas de la vida, su función y su potencial.",
                    longDescription: "El Dr. Castro es un bioquímico con enfoque en biotecnología y descubrimiento de fármacos. Su investigación es fundamental para el avance de la medicina. Guía a los estudiantes en el laboratorio, enseñando la rigor científico y la aplicación de la química a los sistemas biológicos, abriendo nuevas vías para la innovación en salud.",
                    email: "rodrigo.castro@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/54.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Rodrigo. ¿Listo para explorar las moléculas de la vida en Bioquímica?" }] }]
                },
                {
                    id: 52,
                    name: "Mtra. Laura Quiroz",
                    career: "Danza Clásica",
                    description: "La gracia y disciplina del ballet en cada paso.",
                    longDescription: "La Mtra. Quiroz es una bailarina y coreógrafa de ballet clásico. Con una carrera internacional, comparte su conocimiento sobre técnica, expresión y la historia de la danza. Inspira a sus alumnos a alcanzar la perfección en el movimiento y a transmitir emociones a través del arte escénico, cultivando la pasión por el ballet.",
                    email: "laura.quiroz@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/55.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Laura. ¿Qué paso de ballet te gustaría perfeccionar hoy?" }] }]
                },
                {
                    id: 53,
                    name: "Ing. Fernando Morales",
                    career: "Ingeniería de Datos",
                    description: "Transformando datos en decisiones estratégicas.",
                    longDescription: "El Ing. Morales es un arquitecto de datos y experto en Big Data. Enseña a los estudiantes a diseñar, implementar y gestionar sistemas de bases de datos masivas. Su conocimiento es crucial para el análisis predictivo y la inteligencia de negocios, capacitando a los futuros especialistas en el oro del siglo XXI: los datos.",
                    email: "fernando.morales@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/56.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Fernando. ¿Listo para transformar datos en decisiones en Ingeniería de Datos?" }] }]
                },
                {
                    id: 54,
                    name: "Lic. Andrea Vega",
                    career: "Marketing Deportivo",
                    description: "La pasión del deporte unida a estrategias comerciales.",
                    longDescription: "La Lic. Vega es una especialista en marketing deportivo con experiencia en gestión de marcas atléticas y eventos de gran envergadura. Guía a los estudiantes en la creación de estrategias de patrocinio, comunicación y engagement con fans. Su objetivo es fusionar la pasión por el deporte con el rigor del marketing moderno.",
                    email: "andrea.vega@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/57.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Andrea. ¿Qué estrategia de Marketing Deportivo te gustaría explorar hoy?" }] }]
                },
                {
                    id: 55,
                    name: "Dr. Juan Carlos Ortiz",
                    career: "Genética",
                    description: "Desentrañando el código de la vida y sus misterios.",
                    longDescription: "El Dr. Ortiz es un genetista molecular enfocado en la edición génica y la investigación de enfermedades hereditarias. Su laboratorio es un centro de innovación donde los estudiantes aprenden técnicas avanzadas y la ética de la manipulación genética. Su trabajo busca entender y mejorar el futuro de la biología.",
                    email: "juan.ortiz@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/58.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Juan Carlos. ¿Listo para desentrañar el código de la vida en Genética?" }] }]
                },
                {
                    id: 56,
                    name: "Mtra. Isabel Guzmán",
                    career: "Bellas Artes",
                    description: "Cultiva tu expresión artística en todas sus formas.",
                    longDescription: "La Mtra. Guzmán es una artista multidisciplinar con experiencia en pintura, escultura y arte digital. Su enseñanza se centra en fomentar la creatividad, el desarrollo de la técnica y la exploración de diferentes medios. Inspira a los estudiantes a encontrar su propia voz artística y a desafiar los límites de la expresión.",
                    email: "isabel.guzman@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/59.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Isabel. ¿Qué expresión artística te gustaría cultivar hoy en Bellas Artes?" }] }]
                },
                {
                    id: 57,
                    name: "Ing. Marco Antonio Ríos",
                    career: "Ingeniería Ambiental",
                    description: "Protegiendo nuestro planeta con soluciones sostenibles.",
                    longDescription: "El Ing. Ríos es un especialista en gestión de residuos, energías renovables y remediación de suelos. Capacita a los estudiantes para diseñar y aplicar soluciones a los problemas ambientales más apremiantes. Su compromiso es con la sostenibilidad y la creación de un futuro más verde y saludable.",
                    email: "marco.rios@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/60.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Marco Antonio. ¿Listo para proteger nuestro planeta en Ingeniería Ambiental?" }] }]
                },
                {
                    id: 58,
                    name: "Lic. Valeria Núñez",
                    career: "Ciencias Forenses",
                    description: "La ciencia al servicio de la justicia y la verdad.",
                    longDescription: "La Lic. Núñez es una experta en análisis de escenas del crimen, toxicología y balística. Prepara a los estudiantes para aplicar principios científicos en la investigación criminal, desde la recolección de pruebas hasta su análisis en laboratorio. Su trabajo es crucial para resolver crímenes y garantizar la justicia.",
                    email: "valeria.nuñez@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/61.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Valeria. ¿Qué quieres saber sobre la ciencia forense hoy?" }] }]
                },
                {
                    id: 59,
                    name: "Dr. Ricardo Torres",
                    career: "Fisioterapia",
                    description: "Recuperando el movimiento, mejorando la calidad de vida.",
                    longDescription: "El Dr. Torres es un fisioterapeuta con especialización en rehabilitación deportiva y terapia manual. Enseña a los estudiantes a diagnosticar y tratar disfunciones del movimiento, ayudando a los pacientes a recuperar su funcionalidad y bienestar. Su enfoque es la rehabilitación integral y el empoderamiento del paciente.",
                    email: "ricardo.torres@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/62.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Ricardo. ¿Cómo puedo ayudarte a recuperar el movimiento en Fisioterapia?" }] }]
                },
                {
                    id: 60,
                    name: "Mtra. Gabriela Soto",
                    career: "Conservación de Patrimonio",
                    description: "Preservando el legado histórico y cultural.",
                    longDescription: "La Mtra. Soto es una especialista en conservación de bienes culturales, desde manuscritos antiguos hasta estructuras arquitectónicas. Guía a los estudiantes en técnicas de restauración, documentación y gestión de colecciones. Su pasión es proteger la historia y asegurar que el patrimonio sea accesible para futuras generaciones.",
                    email: "gabriela.soto@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/63.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Gabriela. ¿Qué legado quieres preservar hoy en Conservación de Patrimonio?" }] }]
                },
                {
                    id: 61,
                    name: "Ing. Alejandro Salazar",
                    career: "Ingeniería en Energía",
                    description: "Desarrollando soluciones para un futuro energético sostenible.",
                    longDescription: "El Ing. Salazar es un innovador en fuentes de energía renovable y eficiencia energética. Su experiencia abarca desde el diseño de paneles solares hasta sistemas de energía geotérmica. Prepara a los estudiantes para liderar la transición energética global, fusionando ingeniería y sostenibilidad.",
                    email: "alejandro.salazar@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/64.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Alejandro. ¿Listo para generar ideas en Ingeniería en Energía?" }] }]
                },
                {
                    id: 62,
                    name: "Lic. Brenda Castro",
                    career: "Gestión Turística",
                    description: "Creando experiencias inolvidables en destinos diversos.",
                    longDescription: "La Lic. Castro es una experta en planificación y desarrollo de productos turísticos. Enseña a los estudiantes sobre marketing de destinos, gestión hotelera y sostenibilidad en la industria. Su objetivo es formar profesionales capaces de promover el turismo de manera responsable y rentable, ofreciendo vivencias únicas.",
                    email: "brenda.castro@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/65.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Brenda. ¿Qué experiencia turística quieres crear hoy en Gestión Turística?" }] }]
                },
                {
                    id: 63,
                    name: "Dr. Carlos Delgado",
                    career: "Farmacología",
                    description: "La ciencia detrás de los medicamentos que salvan vidas.",
                    longDescription: "El Dr. Delgado es un investigador en farmacología, centrado en el desarrollo de nuevos fármacos y terapias. Su trabajo explora cómo las sustancias interactúan con los sistemas biológicos. Guía a los estudiantes en el estudio de los mecanismos de acción de los medicamentos, la toxicología y la innovación farmacéutica. Su objetivo es contribuir a la salud pública a través del descubrimiento de fármacos seguros y efectivos.",
                    email: "carlos.delgado@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/66.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Carlos. ¿Qué medicamento quieres entender hoy en Farmacología?" }] }]
                },
                {
                    id: 64,
                    name: "Mtra. Diana Rueda",
                    career: "Diseño Textil",
                    description: "Innovando en tejidos y patrones para la moda y el arte.",
                    longDescription: "La Mtra. Rueda es una diseñadora textil con un enfoque en la sostenibilidad y las nuevas tecnologías de materiales. Enseña a los estudiantes sobre las propiedades de las fibras, las técnicas de estampado y tejido, y la creación de patrones. Su pasión es fusionar la artesanía tradicional con la innovación moderna en el mundo textil.",
                    email: "diana.rueda@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/67.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Diana. ¿Qué diseño textil te gustaría crear hoy?" }] }]
                },
                {
                    id: 65,
                    name: "Ing. Emilio Guzmán",
                    career: "Ingeniería Automotriz",
                    description: "Diseñando los vehículos del futuro, eficientes y seguros.",
                    longDescription: "El Ing. Guzmán es un experto en diseño de vehículos, sistemas de propulsión y electrónica automotriz. Capacita a los estudiantes en las últimas tecnologías, desde vehículos eléctricos hasta autónomos. Su experiencia es clave para formar la próxima generación de ingenieros automotrices que liderarán la transformación del transporte.",
                    email: "emilio.guzman@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/68.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Emilio. ¿Listo para diseñar el futuro de la automoción en Ingeniería Automotriz?" }] }]
                },
                {
                    id: 66,
                    name: "Lic. Florencia Soto",
                    career: "Traducción e Interpretación",
                    description: "Conectando culturas a través del lenguaje.",
                    longDescription: "La Lic. Soto es una traductora e intérprete profesional con especialización en lenguas técnicas y jurídicas. Enseña a los estudiantes las complejidades de la traducción simultánea y consecutiva, así como la importancia de la precisión cultural. Su rol es vital para la comunicación global y el entendimiento intercultural.",
                    email: "florencia.soto@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/69.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Florencia. ¿Qué idiomas quieres conectar hoy en Traducción e Interpretación?" }] }]
                },
                {
                    id: 67,
                    name: "Dr. Gerardo Vera",
                    career: "Robótica Quirúrgica",
                    description: "Avances tecnológicos que mejoran la cirugía.",
                    longDescription: "El Dr. Vera es un pionero en la aplicación de la robótica en procedimientos quirúrgicos mínimamente invasivos. Combina su conocimiento en medicina e ingeniería para diseñar y operar sistemas robóticos que asisten a los cirujanos. Su objetivo es mejorar la precisión, reducir los riesgos y acelerar la recuperación de los pacientes.",
                    email: "gerardo.vera@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/70.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Gerardo. ¿Listo para explorar la Robótica Quirúrgica?" }] }]
                },
                {
                    id: 68,
                    name: "Mtra. Hortensia Campos",
                    career: "Gestión del Arte Culinario",
                    description: "Liderazgo y creatividad en el mundo de la gastronomía.",
                    longDescription: "La Mtra. Campos es una chef y gestora con experiencia en alta cocina y administración de restaurantes. Enseña a los estudiantes sobre operaciones de cocina, gestión de personal, finanzas y marketing en el sector gastronómico. Su enfoque es formar líderes que combinen la excelencia culinaria con una sólida visión de negocios.",
                    email: "hortensia.campos@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/71.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Hortensia. ¿Qué receta de éxito quieres preparar hoy en Gestión del Arte Culinario?" }] }]
                },
                {
                    id: 69,
                    name: "Ing. Ignacio Ruiz",
                    career: "Ingeniería de Minas y Metalurgia",
                    description: "Desde la extracción hasta la transformación de recursos.",
                    longDescription: "El Ing. Ruiz es un especialista en procesos metalúrgicos y operaciones mineras. Capacita a los estudiantes en la extracción sostenible de minerales, el procesamiento eficiente y la gestión ambiental en la industria minera. Su conocimiento es clave para el desarrollo responsable de recursos.",
                    email: "ignacio.ruiz@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/72.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Ignacio. ¿Qué recursos quieres transformar hoy en Ingeniería de Minas y Metalurgia?" }] }]
                },
                {
                    id: 70,
                    name: "Lic. Julia Herrera",
                    career: "Criminología",
                    description: "Comprendiendo el crimen para construir sociedades más seguras.",
                    longDescription: "La Lic. Herrera es una criminóloga enfocada en el análisis del comportamiento criminal y la prevención del delito. Prepara a los estudiantes para investigar patrones delictivos, evaluar políticas de seguridad y contribuir a la rehabilitación. Su objetivo es aportar una perspectiva científica a la justicia penal.",
                    email: "julia.herrera@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/73.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Julia. ¿Qué misterio criminal quieres desentrañar hoy en Criminología?" }] }]
                },
                {
                    id: 71,
                    name: "Dr. Kevin Solís",
                    career: "Ciencias de la Tierra",
                    description: "Explorando los procesos dinámicos de nuestro planeta.",
                    longDescription: "El Dr. Solís es un geofísico con experiencia en sismología y vulcanología. Guía a los estudiantes en el estudio de los fenómenos naturales de la Tierra, desde terremotos hasta erupciones volcánicas. Su investigación es vital para la comprensión de nuestro entorno y la mitigación de desastres.",
                    email: "kevin.solis@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/74.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Kevin. ¿Listo para explorar los procesos dinámicos de la Tierra en Ciencias de la Tierra?" }] }]
                },
                {
                    id: 72,
                    name: "Mtra. Liliana Morales",
                    career: "Arqueología Submarina",
                    description: "Descubriendo la historia oculta bajo las olas.",
                    longDescription: "La Mtra. Morales es una arqueóloga submarina pionera en la exploración y conservación de naufragios y sitios sumergidos. Enseña a los estudiantes técnicas de buceo arqueológico, documentación y análisis de artefactos marinos. Su trabajo abre una ventana al pasado marítimo y el patrimonio sumergido.",
                    email: "liliana.morales@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/75.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Liliana. ¿Qué tesoro histórico quieres descubrir hoy en Arqueología Submarina?" }] }]
                },
                {
                    id: 73,
                    name: "Ing. Manuel Pardo",
                    career: "Ingeniería en Sistemas de Control",
                    description: "Automatizando el futuro, un sistema a la vez.",
                    longDescription: "El Ing. Pardo es un experto en diseño y desarrollo de sistemas de control automático para diversas aplicaciones, desde robótica hasta procesos industriales. Enseña a los estudiantes a optimizar el rendimiento y la estabilidad de los sistemas. Su conocimiento es clave para la eficiencia y la innovación en la automatización.",
                    email: "manuel.pardo@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/76.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Manuel. ¿Listo para automatizar tus ideas en Ingeniería en Sistemas de Control?" }] }]
                },
                {
                    id: 74,
                    name: "Lic. Nora Quintero",
                    career: "Publicidad y Relaciones Públicas",
                    description: "Construyendo marcas y reputaciones sólidas.",
                    longDescription: "La Lic. Quintero es una estratega de comunicación con amplia experiencia en campañas publicitarias y gestión de crisis. Guía a los estudiantes en el desarrollo de mensajes impactantes, la construcción de relaciones con los medios y la gestión de la imagen corporativa. Su objetivo es formar comunicadores persuasivos y éticos.",
                    email: "nora.quintero@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/77.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Nora. ¿Qué marca quieres construir hoy en Publicidad y Relaciones Públicas?" }] }]
                },
                {
                    id: 75,
                    name: "Dr. Octavio Salas",
                    career: "Microbiología",
                    description: "El mundo invisible: bacterias, virus y su impacto.",
                    longDescription: "El Dr. Salas es un microbiólogo especializado en inmunología y virología. Su investigación se centra en el estudio de microorganismos y su interacción con la salud humana y el medio ambiente. Guía a los estudiantes en el laboratorio, explorando el fascinante mundo microbiano y su relevancia en la ciencia moderna.",
                    email: "octavio.salas@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/78.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Octavio. ¿Listo para explorar el mundo invisible de la Microbiología?" }] }]
                },
                {
                    id: 76,
                    name: "Mtra. Penélope Vega",
                    career: "Gestión de Recursos Humanos",
                    description: "Potenciando el talento, construyendo equipos de alto rendimiento.",
                    longDescription: "La Mtra. Vega es una experta en desarrollo organizacional, reclutamiento y bienestar laboral. Enseña a los estudiantes las mejores prácticas para gestionar el capital humano, fomentar un clima laboral positivo y maximizar el potencial de los empleados. Su misión es crear ambientes de trabajo justos y productivos.",
                    email: "penelope.vega@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/79.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Penélope. ¿Qué estrategia de Recursos Humanos te gustaría potenciar hoy?" }] }]
                },
                {
                    id: 77,
                    name: "Ing. Quentin Guzmán",
                    career: "Ingeniería de Producción",
                    description: "Maximizando la eficiencia en la cadena de valor.",
                    longDescription: "El Ing. Guzmán es un especialista en optimización de procesos y logística industrial. Capacita a los estudiantes para diseñar sistemas de producción eficientes, gestionar inventarios y asegurar la calidad en manufactura. Su objetivo es formar ingenieros capaces de transformar las operaciones empresariales.",
                    email: "quentin.guzman@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/80.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Quentin. ¿Listo para maximizar la eficiencia en Ingeniería de Producción?" }] }]
                },
                {
                    id: 78,
                    name: "Lic. Rebeca Díaz",
                    career: "Gestión de Eventos",
                    description: "De la idea a la ejecución, creando experiencias memorables.",
                    longDescription: "La Lic. Díaz es una organizadora de eventos con una vasta experiencia en bodas, conferencias y festivales. Enseña a los estudiantes sobre planificación logística, marketing de eventos, gestión de proveedores y resolución de problemas en tiempo real. Su pasión es transformar ideas en realidades espectaculares.",
                    email: "rebeca.diaz@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/81.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Rebeca. ¿Qué evento quieres crear hoy en Gestión de Eventos?" }] }]
                },
                {
                    id: 79,
                    name: "Dr. Santiago Flores",
                    career: "Ciencias de la Atmósfera",
                    description: "Entendiendo el clima y sus fenómenos.",
                    longDescription: "El Dr. Flores es un meteorólogo y climatólogo con un enfoque en el modelado climático y el cambio global. Guía a los estudiantes en el estudio de la dinámica atmosférica, los patrones climáticos y el impacto humano. Su investigación es fundamental para predecir y mitigar los efectos del clima.",
                    email: "santiago.flores@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/82.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Santiago. ¿Listo para entender el clima en Ciencias de la Atmósfera?" }] }]
                },
                {
                    id: 80,
                    name: "Mtra. Tania Mendieta",
                    career: "Cine y Televisión",
                    description: "Dando vida a historias a través de la pantalla.",
                    longDescription: "La Mtra. Mendieta es una directora de cine y guionista con experiencia en producción audiovisual. Enseña a los estudiantes sobre narrativa visual, dirección de actores, edición y postproducción. Su objetivo es formar creadores que cuenten historias poderosas y relevantes a través del medio cinematográfico.",
                    email: "tania.mendieta@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/83.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Tania. ¿Qué historia quieres contar hoy en Cine y Televisión?" }] }]
                },
                {
                    id: 81,
                    name: "Ing. Ulises Ramos",
                    career: "Ingeniería en Sonido y Acústica",
                    description: "Moldeando el sonido para una experiencia auditiva perfecta.",
                    longDescription: "El Ing. Ramos es un experto en diseño de sistemas de audio, ingeniería de grabación y acústica arquitectónica. Capacita a los estudiantes en la ciencia y el arte del sonido, desde conciertos hasta estudios de grabación. Su pasión es crear entornos acústicos impecables y experiencias auditivas inmersivas.",
                    email: "ulises.ramos@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/84.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Ulises. ¿Listo para crear la experiencia auditiva perfecta en Ingeniería en Sonido y Acústica?" }] }]
                },
                {
                    id: 82,
                    name: "Lic. Valentina Cruz",
                    career: "Artes Culinarias",
                    description: "El arte de la cocina: sabor, técnica y creatividad.",
                    longDescription: "La Lic. Cruz es una chef con formación clásica y experiencia en cocina de vanguardia. Enseña a los estudiantes sobre técnicas culinarias, maridaje de sabores, gestión de cocina y creatividad gastronómica. Su objetivo es formar chefs apasionados y versátiles, capaces de transformar ingredientes en obras de arte comestibles.",
                    email: "valentina.cruz@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/85.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Valentina. ¿Qué plato maestro quieres preparar hoy en Artes Culinarias?" }] }]
                },
                {
                    id: 83,
                    name: "Dr. Walter Soto",
                    career: "Oceanografía",
                    description: "Explorando los vastos misterios de los océanos.",
                    longDescription: "El Dr. Soto es un oceanógrafo con especialización en ecología marina y corrientes oceánicas. Guía a los estudiantes en el estudio de los ecosistemas marinos, la química del océano y el impacto del cambio climático. Su investigación es vital para comprender la salud de nuestros océanos y su papel en el sistema terrestre.",
                    email: "walter.soto@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/86.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Walter. ¿Listo para sumergirte en los misterios de la Oceanografía?" }] }]
                },
                {
                    id: 84,
                    name: "Mtra. Ximena Vargas",
                    career: "Restauración de Obras de Arte",
                    description: "Devolviendo la vida y el esplendor al patrimonio artístico.",
                    longDescription: "La Mtra. Vargas es una restauradora de arte con experiencia en pintura, escultura y textiles antiguos. Enseña a los estudiantes las técnicas de conservación, análisis de materiales y ética de la restauración. Su trabajo es crucial para preservar el legado artístico para las futuras generaciones.",
                    email: "ximena.vargas@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/87.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Ximena. ¿Qué obra de arte quieres restaurar hoy?" }] }]
                },
                {
                    id: 85,
                    name: "Ing. Yeray Díaz",
                    career: "Ingeniería de Robótica Social",
                    description: "Diseñando robots que interactúan y asisten a humanos.",
                    longDescription: "El Ing. Díaz es un pionero en la robótica de interacción humano-robot y la creación de robots asistenciales. Capacita a los estudiantes para diseñar robots que comprendan y respondan a las necesidades humanas, desde compañeros de ancianos hasta asistentes educativos. Su visión es que la robótica mejore la calidad de vida.",
                    email: "yeray.diaz@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/88.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Yeray. ¿Listo para diseñar robots que interactúan con humanos en Robótica Social?" }] }]
                },
                {
                    id: 86,
                    name: "Lic. Zulema Herrera",
                    career: "Gestión de Conflictos y Paz",
                    description: "Construyendo puentes en tiempos de división.",
                    longDescription: "La Lic. Herrera es una mediadora y experta en resolución de conflictos internacionales. Enseña a los estudiantes sobre negociación, diplomacia y construcción de la paz en contextos diversos. Su objetivo es formar profesionales capaces de transformar la confrontación en colaboración y entendimiento mutuo.",
                    email: "zulema.herrera@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/89.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Zulema. ¿Cómo podemos construir puentes en la Gestión de Conflictos y Paz?" }] }]
                },
                {
                    id: 87,
                    name: "Dr. Ariel Morales",
                    career: "Inteligencia Artificial Ética",
                    description: "Guiando la IA hacia un futuro responsable y justo.",
                    longDescription: "El Dr. Morales es un eticista de IA y filósofo de la tecnología. Su trabajo se centra en las implicaciones morales y sociales del desarrollo de la inteligencia artificial. Guía a los estudiantes en la exploración de cómo diseñar sistemas de IA que sean justos, transparentes y responsables. Su misión es asegurar que la tecnología sirva a la humanidad.",
                    email: "ariel.morales@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/90.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Ariel. ¿Listo para guiar la IA hacia un futuro ético en Inteligencia Artificial Ética?" }] }]
                },
                {
                    id: 88,
                    name: "Mtra. Brisa Jiménez",
                    career: "Diseño Urbano Sostenible",
                    description: "Creando ciudades verdes y habitables para el mañana.",
                    longDescription: "La Mtra. Jiménez es una urbanista con un enfoque en el diseño de ciudades sostenibles y resiliencia urbana. Enseña a los estudiantes sobre planificación de espacios públicos, infraestructuras verdes y desarrollo de comunidades ecológicas. Su visión es construir ciudades que prosperen en armonía con el medio ambiente.",
                    email: "brisa.jimenez@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/91.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Brisa. ¿Qué ciudad verde quieres diseñar hoy en Diseño Urbano Sostenible?" }] }]
                },
                {
                    id: 89,
                    name: "Ing. Cristóbal Rivas",
                    career: "Ingeniería de Control Ambiental",
                    description: "Tecnología para un aire y agua más puros.",
                    longDescription: "El Ing. Rivas es un experto en tecnologías de control de la contaminación del aire y del agua. Capacita a los estudiantes en el diseño de sistemas de tratamiento, monitoreo ambiental y gestión de residuos industriales. Su compromiso es con la protección de los recursos naturales y la salud pública.",
                    email: "cristobal.rivas@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/92.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Cristóbal. ¿Listo para un aire y agua más puros en Ingeniería de Control Ambiental?" }] }]
                },
                {
                    id: 90,
                    name: "Lic. Dafne Vera",
                    career: "Historia del Cine",
                    description: "Un viaje a través de la evolución del séptimo arte.",
                    longDescription: "La Lic. Vera es una historiadora del cine con un profundo conocimiento de los movimientos cinematográficos, directores icónicos y la influencia del cine en la sociedad. Guía a los estudiantes en el análisis crítico de películas, la evolución narrativa y el impacto cultural de las obras cinematográficas. Su pasión es el celuloide y sus historias.",
                    email: "dafne.vera@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/93.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Dafne. ¿Qué viaje cinematográfico quieres explorar hoy en Historia del Cine?" }] }]
                },
                {
                    id: 91,
                    name: "Dr. Elías Soto",
                    career: "Inteligencia de Negocios",
                    description: "Transformando datos en estrategias empresariales exitosas.",
                    longDescription: "El Dr. Soto es un especialista en análisis de datos y business intelligence. Enseña a los estudiantes a utilizar herramientas y metodologías para extraer información valiosa de grandes conjuntos de datos, lo que permite tomar decisiones informadas en el ámbito empresarial. Su enfoque es la optimización y el crecimiento basado en evidencia.",
                    email: "elias.soto@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/94.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Elías. ¿Listo para transformar datos en estrategias exitosas en Inteligencia de Negocios?" }] }]
                },
                {
                    id: 92,
                    name: "Mtra. Fátima Guerra",
                    career: "Museología",
                    description: "Curando historias, preservando colecciones para el futuro.",
                    longDescription: "La Mtra. Guerra es una museóloga con experiencia en gestión de colecciones, diseño de exposiciones y educación en museos. Guía a los estudiantes en la creación de experiencias culturales significativas, desde la curaduría hasta la interacción con el público. Su pasión es conectar a las personas con el arte y la historia a través de los museos.",
                    email: "fatima.guerra@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/95.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Fátima. ¿Qué historia quieres curar hoy en Museología?" }] }]
                },
                {
                    id: 93,
                    name: "Ing. Genaro Salas",
                    career: "Ingeniería de Materiales",
                    description: "Diseñando los materiales del mañana para innovaciones ilimitadas.",
                    longDescription: "El Ing. Salas es un científico de materiales con un enfoque en polímeros avanzados y nanomateriales. Capacita a los estudiantes para entender las propiedades de los materiales y diseñar nuevos con aplicaciones en medicina, energía y tecnología. Su trabajo es fundamental para el futuro de la ingeniería.",
                    email: "genaro.salas@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/96.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Genaro. ¿Listo para diseñar los materiales del mañana en Ingeniería de Materiales?" }] }]
                },
                {
                    id: 94,
                    name: "Lic. Helena Castro",
                    career: "Diseño de Sonido",
                    description: "Creando mundos inmersivos a través de la acústica y el audio.",
                    longDescription: "La Lic. Castro es una diseñadora de sonido para cine, videojuegos y realidad virtual. Enseña a los estudiantes sobre foley, mezcla, masterización y la importancia del audio en la narrativa. Su objetivo es formar expertos que enriquezcan las experiencias audiovisuales a través de paisajes sonoros cautivadores.",
                    email: "helena.castro@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/97.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Helena. ¿Qué mundo sonoro quieres crear hoy en Diseño de Sonido?" }] }]
                },
                {
                    id: 95,
                    name: "Dr. Íker Núñez",
                    career: "Epidemiología",
                    description: "La ciencia detrás de la salud pública y la prevención.",
                    longDescription: "El Dr. Núñez es un epidemiólogo con experiencia en investigación de brotes y salud global. Guía a los estudiantes en el análisis de patrones de enfermedades, la identificación de factores de riesgo y el diseño de intervenciones de salud pública. Su trabajo es vital para proteger a las comunidades y responder a crisis sanitarias.",
                    email: "iker.nuñez@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/98.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Íker. ¿Listo para proteger la salud pública en Epidemiología?" }] }]
                },
                {
                    id: 96,
                    name: "Mtra. Jimena Pardo",
                    career: "Historia del Diseño",
                    description: "Un recorrido por la evolución de la forma y la función.",
                    longDescription: "La Mtra. Pardo es una historiadora del diseño con un enfoque en el diseño industrial y gráfico. Enseña a los estudiantes sobre los movimientos, figuras clave y el impacto cultural del diseño a lo largo de la historia. Su objetivo es fomentar una comprensión profunda de cómo el diseño moldea nuestro mundo.",
                    email: "jimena.pardo@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/99.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Jimena. ¿Qué diseño quieres explorar hoy en Historia del Diseño?" }] }]
                },
                {
                    id: 97,
                    name: "Ing. Karla Ruiz",
                    career: "Ingeniería de Sistemas de Información",
                    description: "Construyendo los pilares digitales de las organizaciones.",
                    longDescription: "La Ing. Ruiz es una especialista en arquitectura de sistemas empresariales y seguridad de la información. Capacita a los estudiantes para diseñar, implementar y gestionar sistemas que soportan las operaciones de negocio. Su experiencia es crucial para la transformación digital y la resiliencia de las empresas.",
                    email: "karla.ruiz@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/1.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Karla. ¿Listo para construir los pilares digitales de las organizaciones en Ingeniería de Sistemas de Información?" }] }]
                },
                {
                    id: 98,
                    name: "Lic. Lázaro Gómez",
                    career: "Gestión Deportiva",
                    description: "Liderando el futuro de la industria del deporte.",
                    longDescription: "El Lic. Gómez es un gestor deportivo con experiencia en administración de clubes, marketing deportivo y organización de eventos. Enseña a los estudiantes sobre las complejidades del negocio del deporte, desde la financiación hasta el desarrollo de atletas. Su objetivo es formar líderes que impulsen la industria deportiva.",
                    email: "lazaro.gomez@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/2.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Lázaro. ¿Qué futuro quieres liderar en Gestión Deportiva?" }] }]
                },
                {
                    id: 99,
                    name: "Dr. Marina Díaz",
                    career: "Bioinformática",
                    description: "Cruzando la biología y la computación para nuevos descubrimientos.",
                    longDescription: "La Dra. Díaz es una bioinformática con un enfoque en el análisis de datos genómicos y proteómicos. Guía a los estudiantes en el uso de herramientas computacionales para resolver problemas biológicos complejos. Su trabajo es fundamental para la investigación médica y el desarrollo de nuevas terapias.",
                    email: "marina.diaz@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/women/3.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Soy Marina. ¿Lista para cruzar la biología y la computación en Bioinformática?" }] }]
                },
                {
                    id: 100,
                    name: "Mtro. Néstor Cárdenas",
                    career: "Educación Musical",
                    description: "Inspira a la próxima generación de músicos y amantes del arte.",
                    longDescription: "El Mtro. Cárdenas es un educador musical con una pasión por la enseñanza instrumental y coral. Enseña a los estudiantes pedagogía musical, dirección de orquesta y el impacto social de la música. Su objetivo es formar educadores que nutran el talento y la apreciación musical en sus alumnos, construyendo una comunidad a través del sonido.",
                    email: "nestor.cardenada@universidad.edu",
                    imageUrl: "https://randomuser.me/api/portraits/men/5.jpg",
                    chatHistory: [{ role: "ai", parts: [{ text: "Hola, soy Néstor. ¿Qué melodía quieres crear hoy en Educación Musical?" }] }]
                },
                {
                    id: 101,
                    name: "Asesor IA. Aura",
                    career: "Inteligencia Artificial General",
                    description: "Tu guía personalizada en el universo del conocimiento.",
                    longDescription: "Aura es un modelo avanzado de inteligencia artificial, diseñado para proporcionar asesoramiento instantáneo y personalizado en una amplia gama de campos académicos y profesionales. Su 'conocimiento' abarca todas las disciplinas enseñadas en la universidad, y su propósito es asistir a los estudiantes en sus consultas, ofrecer recursos relevantes y simular escenarios de aprendizaje complejos. Siempre disponible para adaptarse a tus necesidades y evolucionar con cada interacción. ¡Hazme cualquier pregunta sobre tus estudios o carrera!",
                    email: "aura.ia@universidad.edu",
                    imageUrl: "https://img.icons8.com/plasticine/100/bot.png", // Image of a bot
                    chatHistory: [{ role: "ai", parts: [{ text: "¡Hola! Soy Aura IA, tu asistente virtual. Estoy aquí para ayudarte con cualquier pregunta sobre carreras, universidades, o tu futuro académico. ¿En qué puedo asistirte hoy?" }] }]
                }
            ];

            // Function to check if the user is "registered" (simulated using localStorage)
            function isUserRegistered() {
                try {
                    // Check if 'isLoggedIn' flag is set to 'true' in localStorage
                    return localStorage.getItem('isLoggedIn') === 'true';
                } catch (e) {
                    console.error("Error accessing localStorage:", e);
                    return false;
                }
            }

            // Function to render advisor cards
            function renderAdvisors(advisorsToRender) {
                advisorList.innerHTML = ''; // Clear current advisors
                if (advisorsToRender.length === 0) {
                    advisorList.innerHTML = '<p class="text-center text-gray-600 col-span-full">No se encontraron asesores que coincidan con su búsqueda.</p>';
                    return;
                }

                advisorsToRender.forEach(advisor => {
                    const card = document.createElement('div');
                    card.className = 'advisor-card';
                    card.innerHTML = `
                        <img src="${advisor.imageUrl}" alt="Foto de ${advisor.name}" onerror="this.onerror=null;this.src='https://placehold.co/160x160/a78bfa/ffffff?text=Asesor';" />
                        <h3>${advisor.name}</h3>
                        <p class="career-title">${advisor.career}</p>
                        <p>${advisor.description}</p>
                    `;
                    card.addEventListener('click', () => showAdvisorDetail(advisor));
                    advisorList.appendChild(card);
                });
            }

            // Function to populate career filter dropdown
            function populateCareerFilter() {
                const careers = [...new Set(advisors.map(advisor => advisor.career))].sort();
                careers.forEach(career => {
                    const option = document.createElement('option');
                    option.value = career;
                    option.textContent = career;
                    careerFilter.appendChild(option);
                });
            }

            // Function to filter advisors
            function filterAdvisors() {
                const searchTerm = searchInput.value.toLowerCase();
                const selectedCareer = careerFilter.value;

                const filtered = advisors.filter(advisor => {
                    const matchesSearch = (
                        advisor.name.toLowerCase().includes(searchTerm) ||
                        advisor.career.toLowerCase().includes(searchTerm) ||
                        advisor.description.toLowerCase().includes(searchTerm) ||
                        advisor.longDescription.toLowerCase().includes(searchTerm)
                    );
                    const matchesCareer = selectedCareer === "" || advisor.career === selectedCareer;
                    return matchesSearch && matchesCareer;
                });
                renderAdvisors(filtered);
            }

            // Function to display advisor detail modal
            function showAdvisorDetail(advisor) {
                currentAdvisor = advisor; // Set the current advisor

                detailImage.src = advisor.imageUrl;
                detailImage.alt = `Foto de ${advisor.name}`;
                detailName.textContent = advisor.name;
                detailCareer.textContent = advisor.career;

                // Display chat history
                chatMessagesContainer.innerHTML = '';
                advisor.chatHistory.forEach(message => {
                    addMessageToChat(message.parts[0].text, message.role);
                });
                chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight; // Scroll to bottom

                // Conditional display of chat input area based on advisor type and user registration
                if (currentAdvisor.id === 101) { // If it's Aura IA (ID 101)
                    userQuestionInput.style.display = 'block';
                    sendQuestionButton.style.display = 'flex'; // Use flex for button
                    chatDisabledMessage.style.display = 'none';
                } else if (isUserRegistered()) {
                    userQuestionInput.style.display = 'block';
                    sendQuestionButton.style.display = 'flex'; // Use flex for button
                    chatDisabledMessage.style.display = 'none';
                } else {
                    userQuestionInput.style.display = 'none';
                    sendQuestionButton.style.display = 'none';
                    chatDisabledMessage.style.display = 'block';
                }

                advisorDetailOverlay.classList.add('show');
            }

            function hideAdvisorDetail() {
                advisorDetailOverlay.classList.remove('show');
                currentAdvisor = null; // Clear current advisor
            }


            // Function to add message to chat display
            function addMessageToChat(text, role) {
                const messageDiv = document.createElement('div');
                messageDiv.classList.add('chat-message', role);
                messageDiv.textContent = text;
                chatMessagesContainer.appendChild(messageDiv);
                chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight; // Scroll to bottom
            }

            // Simulate AI response
            function getAIResponse(userMessage) {
                const lowerCaseMessage = userMessage.toLowerCase();
                if (lowerCaseMessage.includes("hola") || lowerCaseMessage.includes("saludos")) {
                    return "¡Hola! ¿Cómo puedo ayudarte hoy con tus preguntas académicas?";
                } else if (lowerCaseMessage.includes("carreras")) {
                    return "Claro, ¿estás buscando información sobre alguna carrera en particular o necesitas ayuda para encontrar la ideal para ti?";
                } else if (lowerCaseMessage.includes("universidades")) {
                    return "Puedo darte información sobre universidades. ¿Qué tipo de institución te interesa o en qué país/ciudad buscas?";
                } else if (lowerCaseMessage.includes("gracias")) {
                    return "De nada, ¡es un placer ayudarte! ¿Hay algo más en lo que pueda asistirte?";
                } else {
                    return "Hmm, esa es una excelente pregunta. Estoy aquí para ofrecerte orientación y recursos. ¿Podrías ser más específico para que pueda ayudarte mejor?";
                }
            }


            // Initial render
            renderAdvisors(advisors);
            populateCareerFilter();

            // Event listeners for search and filter
            searchInput.addEventListener('input', filterAdvisors);
            careerFilter.addEventListener('change', filterAdvisors);

            // Close advisor detail overlay on click outside content
            closeAdvisorDetailButton.addEventListener('click', hideAdvisorDetail);
            advisorDetailOverlay.addEventListener('click', (e) => {
                if (e.target === advisorDetailOverlay) {
                    hideAdvisorDetail();
                }
            });

            // Send message logic
            sendQuestionButton.addEventListener('click', () => {
                const userMessage = userQuestionInput.value.trim();
                if (userMessage === '') return;

                addMessageToChat(userMessage, 'user');
                currentAdvisor.chatHistory.push({ role: "user", parts: [{ text: userMessage }] });
                userQuestionInput.value = '';

                loadingIndicator.style.display = 'block';
                userQuestionInput.disabled = true;
                sendQuestionButton.disabled = true;

                if (currentAdvisor.id === 101) { // If chatting with Aura IA
                    setTimeout(() => {
                        const aiResponse = getAIResponse(userMessage);
                        addMessageToChat(aiResponse, 'ai');
                        currentAdvisor.chatHistory.push({ role: "ai", parts: [{ text: aiResponse }] });
                        loadingIndicator.style.display = 'none';
                        userQuestionInput.disabled = false;
                        sendQuestionButton.disabled = false;
                    }, 1500); // Simulate network delay
                } else {
                    // For other advisors, simulate a generic "I'll get back to you" message
                    setTimeout(() => {
                        const genericResponse = `Gracias por tu mensaje. El asesor ${currentAdvisor.name} revisará tu pregunta y se pondrá en contacto contigo pronto.`;
                        addMessageToChat(genericResponse, 'ai');
                        currentAdvisor.chatHistory.push({ role: "ai", parts: [{ text: genericResponse }] });
                        loadingIndicator.style.display = 'none';
                        userQuestionInput.disabled = false;
                        sendQuestionButton.disabled = false;
                    }, 1500); // Simulate network delay
                }
            });

            userQuestionInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    sendQuestionButton.click();
                }
            });

            // Simulate user login for demonstration purposes.
            // You can set this to 'true' to simulate a logged-in user.
            // For a real application, this would be handled by a proper authentication flow.
            // localStorage.setItem('isLoggedIn', 'true');
            // localStorage.setItem('isLoggedIn', 'false'); // Set to false to test unregistered user experience
        });