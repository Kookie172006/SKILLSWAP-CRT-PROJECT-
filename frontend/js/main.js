const themeToggle = document.getElementById("themeToggle");

// Load the saved theme, or use light mode by default
const savedTheme = localStorage.getItem("skillswap-theme");

if (savedTheme === "dark") {
    document.body.classList.add("dark-theme");
}

updateThemeButton();

themeToggle.addEventListener("click", function () {
    document.body.classList.toggle("dark-theme");

    if (document.body.classList.contains("dark-theme")) {
        localStorage.setItem("skillswap-theme", "dark");
    } else {
        localStorage.setItem("skillswap-theme", "light");
    }

    updateThemeButton();
});

function updateThemeButton() {
    if (document.body.classList.contains("dark-theme")) {
        themeToggle.textContent = "☀";
        themeToggle.setAttribute("aria-label", "Switch to light theme");
    } else {
        themeToggle.textContent = "☾";
        themeToggle.setAttribute("aria-label", "Switch to dark theme");
    }
}
