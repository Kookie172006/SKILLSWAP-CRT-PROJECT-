const API_BASE_URL = "http://localhost:5000";

const skillForm = document.getElementById("skillForm");
const skillName = document.getElementById("skillName");
const skillType = document.getElementById("skillType");
const skillDescription = document.getElementById("skillDescription");
const skillMessage = document.getElementById("skillMessage");
const skillsGrid = document.getElementById("skillsGrid");
const emptySkills = document.getElementById("emptySkills");
const skillSearch = document.getElementById("skillSearch");

const teachCount = document.getElementById("teachCount");
const learnCount = document.getElementById("learnCount");
const totalCount = document.getElementById("totalCount");

let currentFilter = "all";
let skills = [];

const token = localStorage.getItem("skillswap-token");

let currentUser = null;

try {
    currentUser = JSON.parse(
        localStorage.getItem("skillswap-user") || "null"
    );
} catch (error) {
    currentUser = null;
}

const userId = currentUser?._id || currentUser?.id;
const userName =
    currentUser?.name || localStorage.getItem("skillswap-name") || "";

function showMessage(message, type) {
    if (!skillMessage) return;

    skillMessage.textContent = message;
    skillMessage.className = "skill-message " + type;
}

async function apiRequest(endpoint, options = {}) {
    const response = await fetch(API_BASE_URL + endpoint, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: "Bearer " + token } : {}),
            ...options.headers
        }
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            result.message || "Request failed. Please try again."
        );
    }

    return result;
}

function updateCounts() {
    if (teachCount) {
        teachCount.textContent =
            skills.filter(skill => skill.type === "teach").length;
    }

    if (learnCount) {
        learnCount.textContent =
            skills.filter(skill => skill.type === "learn").length;
    }

    if (totalCount) {
        totalCount.textContent = skills.length;
    }
}

function displaySkills() {
    if (!skillsGrid || !skillSearch || !emptySkills) return;

    const searchText = skillSearch.value.trim().toLowerCase();

    const filteredSkills = skills.filter(skill => {
        const matchesType =
            currentFilter === "all" || skill.type === currentFilter;

        const matchesSearch =
            (skill.name || "").toLowerCase().includes(searchText) ||
            (skill.description || "").toLowerCase().includes(searchText);

        return matchesType && matchesSearch;
    });

    skillsGrid.replaceChildren();

    filteredSkills.forEach(skill => {
        const card = document.createElement("article");
        card.className = "skill-card";

        const top = document.createElement("div");
        top.className = "skill-card-top";

        const icon = document.createElement("span");
        icon.className = "skill-card-icon";
        icon.textContent = skill.type === "learn" ? "🌱" : "🎓";

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-skill";
        deleteButton.textContent = "Remove";
        deleteButton.type = "button";
        deleteButton.setAttribute(
            "aria-label",
            "Remove " + skill.name
        );

        deleteButton.addEventListener("click", async () => {
            if (!confirm("Remove this skill?")) return;

            deleteButton.disabled = true;

            try {
                await apiRequest(
                    "/api/skills/" + encodeURIComponent(skill._id),
                    {
                        method: "DELETE",
                        body: JSON.stringify({ userId })
                    }
                );

                skills = skills.filter(
                    item => item._id !== skill._id
                );

                showMessage("Skill removed successfully.", "success");
                displaySkills();
            } catch (error) {
                showMessage(error.message, "error");
                deleteButton.disabled = false;
            }
        });

        top.append(icon, deleteButton);

        const type = document.createElement("span");
        type.className = "skill-type " + skill.type;
        type.textContent =
            skill.type === "learn" ? "Want to learn" : "Can teach";

        const title = document.createElement("h3");
        title.textContent = skill.name;

        const description = document.createElement("p");
        description.className = "skill-card-description";
        description.textContent =
            skill.description || "Ready to grow and share through SkillSwap.";

        const chatButton = document.createElement("a");
        chatButton.href = "messages.html";
        chatButton.className = "btn btn-primary";
        chatButton.textContent = "Chat";

        card.append(top, type, title, description, chatButton);
        skillsGrid.appendChild(card);
    });

    emptySkills.hidden = filteredSkills.length > 0;

    const emptyHeading = emptySkills.querySelector("h3");
    const emptyText = emptySkills.querySelector("p");

    if (filteredSkills.length === 0 && searchText) {
        if (emptyHeading) {
            emptyHeading.textContent = "No matching skills found";
        }
        if (emptyText) {
            emptyText.textContent =
                "Try another search or choose a different filter.";
        }
    } else {
        if (emptyHeading) {
            emptyHeading.textContent = "Your skill garden is waiting!";
        }
        if (emptyText) {
            emptyText.textContent =
                "Add your first skill above and start building your collection.";
        }
    }

    updateCounts();
}

async function loadSkills() {
    if (!token || !userId) {
        showMessage(
            "Please log in again to manage your skills.",
            "error"
        );
        return;
    }

    showMessage("Loading your skills...", "success");

    try {
        const result = await apiRequest(
            "/api/skills?userId=" + encodeURIComponent(userId)
        );

        skills = Array.isArray(result.skills) ? result.skills : [];

        showMessage("", "success");
        displaySkills();
    } catch (error) {
        showMessage(
            "Could not load skills: " + error.message,
            "error"
        );
    }
}

if (skillForm) {
    skillForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = skillName.value.trim();
        const description = skillDescription.value.trim();
        const type = skillType.value;

        if (!token || !userId || !userName) {
            showMessage(
                "Please log in again before adding a skill.",
                "error"
            );
            return;
        }

        if (!name) {
            showMessage("Please enter a skill name.", "error");
            return;
        }

        const alreadyExists = skills.some(skill =>
            skill.name.toLowerCase() === name.toLowerCase() &&
            skill.type === type
        );

        if (alreadyExists) {
            showMessage(
                "You've already added this skill in that category.",
                "error"
            );
            return;
        }

        const submitButton = skillForm.querySelector(
            'button[type="submit"], input[type="submit"]'
        );

        if (submitButton) submitButton.disabled = true;

        try {
            const result = await apiRequest("/api/skills", {
                method: "POST",
                body: JSON.stringify({
                    userId: userId,
                    userName: userName,
                    name: name,
                    type: type,
                    level: "Beginner",
                    description: description
                })
            });

            if (!result.skill || !result.skill._id) {
                throw new Error("The server did not return the saved skill.");
            }

            skills.unshift(result.skill);

            skillForm.reset();
            skillType.value = "teach";
            currentFilter = "all";

            document.querySelectorAll(".filter-btn").forEach(button => {
                button.classList.toggle(
                    "active",
                    button.dataset.filter === "all"
                );
            });

            skillSearch.value = "";

            showMessage("Skill saved successfully! 💜", "success");
            displaySkills();
        } catch (error) {
            showMessage(
                "Could not save skill: " + error.message,
                "error"
            );
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
}

if (skillSearch) {
    skillSearch.addEventListener("input", displaySkills);
}

document.querySelectorAll(".filter-btn").forEach(button => {
    button.addEventListener("click", function () {
        currentFilter = this.dataset.filter;

        document.querySelectorAll(".filter-btn").forEach(filterButton => {
            filterButton.classList.remove("active");
        });

        this.classList.add("active");
        displaySkills();
    });
});

loadSkills();