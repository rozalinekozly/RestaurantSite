const toggleButton = document.getElementById('toggleDarkMode');
const body = document.body;

// Load mode from localStorage on page load
if (localStorage.getItem('theme') === 'dark') {
    body.classList.add('dark');
}

toggleButton.addEventListener('click', () => {
    body.classList.toggle('dark');
    if (body.classList.contains('dark')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
});
