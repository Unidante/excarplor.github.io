document.addEventListener('DOMContentLoaded', function() {
    const getRecommendationBtn = document.getElementById('get-recommendation-btn');
    const careerInput = document.getElementById('career-input');
    const loadingIndicatorCareer = document.getElementById('loading-indicator');
    const recommendationResultEl = document.getElementById('career-recommendation-result');

    if (getRecommendationBtn && careerInput && loadingIndicatorCareer && recommendationResultEl) {
    
        loadingIndicatorCareer.style.display = 'none';

        getRecommendationBtn.addEventListener('click', async () => {
            const promptText = careerInput.value.trim();
            if (!promptText) {

                window.uiHelpers.showMessageModal('Entrada Requerida', 'Por favor, describe tus intereses para obtener una recomendación.');
                return;
            }
            loadingIndicatorCareer.style.display = 'block';
            recommendationResultEl.innerHTML = '<h3>Tu Recomendación:</h3><p>Generando...</p>';

            if (window.dataApi && window.dataApi.getCareerRecommendation) {
                await window.dataApi.getCareerRecommendation(promptText, recommendationResultEl, loadingIndicatorCareer);
            } else {
                console.error("dataApi.getCareerRecommendation no está disponible.");
                window.uiHelpers.showMessageModal('Error', 'La función de recomendación no está disponible en este momento. (Falta la API de Gemini)');
                loadingIndicatorCareer.style.display = 'none';
            }
        });
    }
});