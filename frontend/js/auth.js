
const API_BASE_URL = "http://localhost:5000";

// Save the authenticated user's session information
function saveAuthSession(data) {
    if (!data || !data.token || !data.user) {
        throw new Error("The server returned an invalid login response.");
    }

    localStorage.setItem("skillswap-token", data.token);
    localStorage.setItem("skillswap-user", JSON.stringify(data.user));

    localStorage.setItem("skillswap-name", data.user.name || "");
    localStorage.setItem("skillswap-email", data.user.email || "");

    if (data.user.credits !== undefined) {
        localStorage.setItem(
            "skillswap-credits",
            String(data.user.credits)
        );
    }
}

// Display a message without changing the page design
function showAuthMessage(element, message, type) {
    if (!element) return;

    element.textContent = message;
    element.className = "form-message " + type;
}

// Send a request to the backend and handle its response
async function authRequest(endpoint, payload) {
    const response = await fetch(API_BASE_URL + endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.success) {
        throw new Error(
            result.message || "Something went wrong. Please try again."
        );
    }

    return result;
}

// ================================
// LOGIN PAGE
// ================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const showPassword = document.getElementById("showPassword");
    const formMessage = document.getElementById("formMessage");
    const submitButton = loginForm.querySelector(
        'button[type="submit"], input[type="submit"]'
    );

    if (showPassword && passwordInput) {
        showPassword.addEventListener("change", function () {
            passwordInput.type = this.checked ? "text" : "password";
        });
    }

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showAuthMessage(
                formMessage,
                "Please fill in both fields.",
                "error"
            );
            return;
        }

        showAuthMessage(formMessage, "Logging in...", "success");

        if (submitButton) submitButton.disabled = true;

        try {
            const result = await authRequest("/api/auth/login", {
                email: email,
                password: password
            });

            saveAuthSession(result.data);

            showAuthMessage(
                formMessage,
                "Login successful! Redirecting...",
                "success"
            );

            window.location.href = "dashboard.html";

        } catch (error) {
            showAuthMessage(
                formMessage,
                error.message ||
                    "Unable to log in. Please try again.",
                "error"
            );
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
}

// ================================
// REGISTRATION PAGE
// ================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("registerEmail");
    const passwordInput = document.getElementById("registerPassword");
    const confirmPasswordInput =
        document.getElementById("confirmPassword");
    const showPassword =
        document.getElementById("showRegisterPassword");
    const formMessage = document.getElementById("registerMessage");

    const submitButton = registerForm.querySelector(
        'button[type="submit"], input[type="submit"]'
    );

    if (showPassword && passwordInput && confirmPasswordInput) {
        showPassword.addEventListener("change", function () {
            const type = this.checked ? "text" : "password";

            passwordInput.type = type;
            confirmPasswordInput.type = type;
        });
    }

    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (name.length < 2) {
            showAuthMessage(
                formMessage,
                "Name must contain at least 2 characters.",
                "error"
            );
            return;
        }

        if (!emailInput.validity.valid || !email) {
            showAuthMessage(
                formMessage,
                "Please enter a valid email address.",
                "error"
            );
            return;
        }

        const strongPassword =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

        if (!strongPassword.test(password)) {
            showAuthMessage(
                formMessage,
                "Use at least 8 characters with uppercase, lowercase, a number, and a special character.",
                "error"
            );
            return;
        }

        if (password !== confirmPassword) {
            showAuthMessage(
                formMessage,
                "Passwords do not match.",
                "error"
            );
            return;
        }

        showAuthMessage(
            formMessage,
            "Creating your account...",
            "success"
        );

        if (submitButton) submitButton.disabled = true;

        try {
            const result = await authRequest("/api/auth/register", {
                name: name,
                email: email,
                password: password,
                confirmPassword: confirmPassword
            });

            saveAuthSession(result.data);

            showAuthMessage(
                formMessage,
                "Account created! Your 5 welcome credits are ready.",
                "success"
            );

            window.location.href = "dashboard.html";
        } catch (error) {
            showAuthMessage(
                formMessage,
                error.message ||
                    "Unable to register. Please try again.",
                "error"
            );
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
}