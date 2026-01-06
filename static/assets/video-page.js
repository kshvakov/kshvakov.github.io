(function() {
    'use strict';

    // Загрузка и обработка расшифровки
    const transcriptContainer = document.getElementById('transcript-content');
    const rawTranscriptToggle = document.querySelector('.raw-transcript-details');
    const rawTranscriptContainer = document.getElementById('raw-transcript');
    
    if (!transcriptContainer) return;

    const transcriptUrl = transcriptContainer.dataset.transcriptUrl;
    if (!transcriptUrl) return;

    // Загрузка текста расшифровки
    fetch(transcriptUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load transcript');
            }
            return response.text();
        })
        .then(text => {
            // Обработка текста: удаление пустых строк, склейка в абзацы
            const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            
            // Группировка строк в абзацы
            const paragraphs = [];
            let currentParagraph = [];
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const currentText = currentParagraph.join(' ');
                
                // Если строка заканчивается точкой, восклицательным или вопросительным знаком, завершаем абзац
                if (line.match(/[.!?]$/)) {
                    currentParagraph.push(line);
                    if (currentParagraph.length > 0) {
                        paragraphs.push(currentParagraph.join(' '));
                        currentParagraph = [];
                    }
                } else if (currentText.length > 0 && currentText.length + line.length + 1 > 400) {
                    // Если абзац становится слишком длинным, завершаем его
                    if (currentParagraph.length > 0) {
                        paragraphs.push(currentParagraph.join(' '));
                        currentParagraph = [line];
                    } else {
                        currentParagraph.push(line);
                    }
                } else {
                    // Иначе добавляем к текущему абзацу
                    currentParagraph.push(line);
                }
            }
            
            // Добавляем последний абзац, если он есть
            if (currentParagraph.length > 0) {
                paragraphs.push(currentParagraph.join(' '));
            }

            // Рендеринг обработанного текста
            const processedHtml = paragraphs.map(p => `<p>${p}</p>`).join('\n');
            transcriptContainer.innerHTML = processedHtml;

            // Сохранение сырого текста для переключателя
            if (rawTranscriptContainer) {
                rawTranscriptContainer.textContent = text;
            }
        })
        .catch(error => {
            console.error('Error loading transcript:', error);
            transcriptContainer.innerHTML = '<p>Не удалось загрузить расшифровку.</p>';
        });

    // Переключатель сырого текста через details
    if (rawTranscriptToggle && rawTranscriptContainer) {
        rawTranscriptToggle.addEventListener('toggle', function() {
            if (this.open) {
                rawTranscriptContainer.style.display = 'block';
            } else {
                rawTranscriptContainer.style.display = 'none';
            }
        });
    }
})();

