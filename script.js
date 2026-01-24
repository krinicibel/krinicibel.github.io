document.addEventListener('DOMContentLoaded', function() {
    const menuBtn = document.getElementById('menu-toggle');
    const menu = document.getElementById('main-menu');

    menuBtn.addEventListener('click', function() {
        menu.classList.toggle('active');
        
        if (menu.classList.contains('active')) {
            menuBtn.textContent = '✕ Закрыть меню';
        } else {
            menuBtn.textContent = '☰ Меню';
        }
    });
    
    const links = menu.querySelectorAll('a');
    links.forEach(link => {
        link.addEventListener('click', () => {
            menu.classList.remove('active');
            menuBtn.textContent = '☰ Меню';
        });
    });
});
