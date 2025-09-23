let valoracionSeleccionada = 0;
const estrellas = document.querySelectorAll('#valoracionEstrellas i');
const contenedorResenas = document.getElementById('contenedorResenas');

function updateUI() {
  for (let i = 0; i < estrellas.length; i++) {
    if (i < valoracionSeleccionada) {
      estrellas[i].classList.add('seleccionada');
    } else {
      estrellas[i].classList.remove('seleccionada');
    }
  }
}

// const cursorPet = document.getElementById('cursorPet');
// document.addEventListener('mousemove', (e) => {
//     cursorPet.style.left = e.pageX + 'px';
//     cursorPet.style.top = e.pageY + 'px';
// });


// Función para pintar una reseña
function pintarResena({ valoracion, comentario }) {
  const resena = document.createElement('div');
  resena.classList.add('resena');

  resena.innerHTML = `
    <div class="estrellas">
      ${'<i class="fas fa-star seleccionada"></i>'.repeat(valoracion)}
      ${'<i class="fas fa-star"></i>'.repeat(5 - valoracion)}
    </div>
    <p>${comentario}</p>
  `;

  contenedorResenas.prepend(resena);
}

// Cargar reseñas guardadas al iniciar
function cargarResenas() {
  const resenasGuardadas = localStorage.getItem('resenas');
  if (resenasGuardadas) {
    const arrayResenas = JSON.parse(resenasGuardadas);
    arrayResenas.forEach(pintarResena);
  }
}

estrellas.forEach((estrella, index) => {
  estrella.addEventListener('mouseover', () => {
    for (let i = 0; i <= index; i++) {
      estrellas[i].classList.add('seleccionada');
    }
    for (let i = index + 1; i < estrellas.length; i++) {
      estrellas[i].classList.remove('seleccionada');
    }
  });

  estrella.addEventListener('mouseout', () => {
    updateUI();
  });

  estrella.addEventListener('click', () => {
    valoracionSeleccionada = index + 1;
    updateUI();
  });
});

document.getElementById('comentarioForm').addEventListener('submit', function(event) {
  event.preventDefault();
  const comentario = document.getElementById('comentario').value.trim();

  if (comentario && valoracionSeleccionada > 0) {
    // Crear objeto reseña
    const nuevaResena = {
      valoracion: valoracionSeleccionada,
      comentario: comentario
    };

    // Guardar en localStorage
    const resenasGuardadas = localStorage.getItem('resenas');
    const arrayResenas = resenasGuardadas ? JSON.parse(resenasGuardadas) : [];
    arrayResenas.push(nuevaResena);
    localStorage.setItem('resenas', JSON.stringify(arrayResenas));

    // Pintar la reseña en pantalla
    pintarResena(nuevaResena);

    this.reset();
    valoracionSeleccionada = 0;
    updateUI();

    document.getElementById('tituloInteractivo').textContent = '¡Gracias por tu comentario!';
  } else {
    alert('Por favor, completa el comentario y selecciona una valoración.');
  }
});

// Al cargar la página, pintar las reseñas guardadas
cargarResenas();
