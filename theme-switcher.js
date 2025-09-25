/**
 * Sistema global de cambio de tema para EXCARPLOR
 * Este script maneja el cambio entre tema claro y oscuro en todas las páginas
 */

// Función para cambiar entre tema claro y oscuro globalmente
function applyTheme() {
    const body = document.body;
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    
    // Aplicar el tema guardado
    if (savedDarkMode) {
        body.classList.add("dark-mode");
    } else {
        body.classList.remove("dark-mode");
    }
}

// Función para alternar el tema cuando se hace clic en el botón
function toggleGlobalTheme() {
    const body = document.body;
    const isDarkMode = body.classList.contains("dark-mode");
    
    // Cambiar el estado del tema
    if (isDarkMode) {
        body.classList.remove("dark-mode");
        localStorage.setItem("darkMode", "false");
    } else {
        body.classList.add("dark-mode");
        localStorage.setItem("darkMode", "true");
    }
}

// Aplicar el tema guardado al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Aplicar el tema guardado
    applyTheme();
    
    // Buscar el checkbox de modo oscuro si estamos en la página de cuenta
    const darkModeToggle = document.getElementById("darkModeToggle");
    if (darkModeToggle) {
        const savedDarkMode = localStorage.getItem("darkMode") === "true";
        
        // Establecer el estado inicial del checkbox según la preferencia guardada
        darkModeToggle.checked = savedDarkMode;
        
        // Escuchar cambios en el checkbox
        darkModeToggle.addEventListener('change', function() {
            // Guardar la preferencia del usuario en localStorage
            localStorage.setItem("darkMode", this.checked);
            
            // Aplicar el tema
            applyTheme();
        });
    }
});