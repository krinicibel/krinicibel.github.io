async function loadLayout() {
    const elements = [
        { id: 'header-container', file: 'header.html' },
        { id: 'footer-container', file: 'footer.html' }
    ];

    for (const item of elements) {
        const container = document.getElementById(item.id);
        if (container) {
            try {
                const response = await fetch(item.file);
                if (response.ok) {
                    container.innerHTML = await response.text();
                }
            } catch (e) {
                console.error('Ошибка загрузки файла:', item.file);
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', loadLayout);