
const API_BASE_URL = "http://localhost:5000";

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const categoryFilter = document.getElementById("categoryFilter");
const sortFilter = document.getElementById("sortFilter");
const clearFilters = document.getElementById("clearFilters");
const emptyClearButton = document.getElementById("emptyClearButton");
const exploreGrid = document.getElementById("exploreGrid");
const noResults = document.getElementById("noResults");
const resultCount = document.getElementById("resultCount");

const token = localStorage.getItem("skillswap-token");

let currentUser = null;
try {
    currentUser = JSON.parse(
        localStorage.getItem("skillswap-user") || "null"
    );
} catch {
    currentUser = null;
}

const userId = currentUser?._id || currentUser?.id || "";
const userName = currentUser?.name ||
    localStorage.getItem("skillswap-name") || "";

let exploreSkills = [];
let myTeachingSkills = [];
let requests = [];

async function apiRequest(endpoint, options = {}) {
    const response = await fetch(API_BASE_URL + endpoint, {
        ...options,
        headers: {
            ...(token ? { Authorization: "Bearer " + token } : {}),
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...options.headers
        }
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(result.message || "Request failed.");
    }

    return result;
}

function guessCategory(name) {
    const skill = name.toLowerCase();

    if (
        skill.includes("java") ||
        skill.includes("python") ||
        skill.includes("program") ||
        skill.includes("coding") ||
        skill.includes("web development") ||
        skill.includes("javascript")
    ) return "programming";

    if (
        skill.includes("design") ||
        skill.includes("photo") ||
        skill.includes("drawing") ||
        skill.includes("art")
    ) return "design";

    if (
        skill.includes("speak") ||
        skill.includes("communication") ||
        skill.includes("presentation")
    ) return "communication";

    if (
        skill.includes("guitar") ||
        skill.includes("music") ||
        skill.includes("sing")
    ) return "music";

    if (
        skill.includes("language") ||
        skill.includes("spanish") ||
        skill.includes("french") ||
        skill.includes("english")
    ) return "languages";

    return "other";
}

function getExploreSkills() {
    return exploreSkills.filter(skill =>
        !userId || String(skill.userId) !== String(userId)
    );
}

function createSkillCard(skill) {
    const card = document.createElement("article");
    card.className = "explore-card";

    const top = document.createElement("div");
    top.className = "explore-card-top";

    const icon = document.createElement("span");
    icon.className = "explore-skill-icon";
    icon.textContent = skill.icon;

    const category = document.createElement("span");
    category.className = "explore-category";
    category.textContent = skill.category.replace("-", " ");

    top.append(icon, category);

    const title = document.createElement("h3");
    title.textContent = skill.name;

    const teacher = document.createElement("p");
    teacher.className = "explore-teacher";
    teacher.textContent = "👤 " + skill.teacher;

    const description = document.createElement("p");
    description.className = "explore-description";
    description.textContent =
        skill.description || "A skill shared by a SkillSwap member.";

    const bottom = document.createElement("div");
    bottom.className = "explore-card-bottom";

    const creditLabel = document.createElement("span");
    creditLabel.className = "credit-label";
    creditLabel.textContent = "Skill exchange";

    const requestButton = document.createElement("button");
    requestButton.className = "request-swap-btn";
    requestButton.type = "button";
    requestButton.textContent = "Request swap";

    const alreadyRequested = requests.some(request =>
        String(request.requesterId) === String(userId) &&
        String(request.receiverId) === String(skill.userId) &&
        request.skillWanted === skill.name &&
        request.status === "pending"
    );

    if (alreadyRequested) {
        requestButton.textContent = "Requested ✓";
        requestButton.disabled = true;
    }

    requestButton.addEventListener("click", () => {
        sendSwapRequest(skill, requestButton);
    });

    bottom.append(creditLabel, requestButton);
    card.append(top, title, teacher, description, bottom);

    return card;
}

async function sendSwapRequest(skill, button) {
    if (!token || !userId || !userName) {
        alert("Please log in before requesting a skill swap.");
        return;
    }

    if (myTeachingSkills.length === 0) {
        alert(
            "First, add at least one skill you can teach on your Skills page."
        );
        return;
    }

    const choices = myTeachingSkills
        .map((item, index) => `${index + 1}. ${item.name}`)
        .join("\n");

    const answer = prompt(
        "Choose the skill you can offer in exchange:\n\n" +
        choices +
        "\n\nEnter the number of your skill:"
    );

    if (answer === null) return;

    const choice = Number(answer);

    if (
        !Number.isInteger(choice) ||
        choice < 1 ||
        choice > myTeachingSkills.length
    ) {
        alert("Please enter a valid skill number.");
        return;
    }

    const offeredSkill = myTeachingSkills[choice - 1];

    const alreadyRequested = requests.some(request =>
        String(request.requesterId) === String(userId) &&
        String(request.receiverId) === String(skill.userId) &&
        request.skillWanted === skill.name &&
        request.status === "pending"
    );

    if (alreadyRequested) {
        alert("You already have a pending request for this skill.");
        return;
    }

    button.disabled = true;
    button.textContent = "Sending...";

    try {
        const result = await apiRequest("/api/swaps", {
            method: "POST",
            body: JSON.stringify({
                requesterId: String(userId),
                requesterName: userName,
                receiverId: String(skill.userId),
                receiverName: skill.teacher,
                skillOffered: offeredSkill.name,
                skillWanted: skill.name
            })
        });

        if (!result.swap) {
            throw new Error("The server did not return the created request.");
        }

        requests.unshift(result.swap);
        button.textContent = "Requested ✓";

        alert("Your swap request was saved successfully!");
    } catch (error) {
        button.disabled = false;
        button.textContent = "Request swap";
        alert("Could not send request: " + error.message);
    }
}

function displayExploreSkills() {
    const searchText = searchInput.value.trim().toLowerCase();
    const selectedCategory = categoryFilter.value;
    const sortBy = sortFilter.value;

    let results = getExploreSkills().filter(skill => {
        const matchesSearch =
            skill.name.toLowerCase().includes(searchText) ||
            skill.teacher.toLowerCase().includes(searchText) ||
            skill.description.toLowerCase().includes(searchText);

        const matchesCategory =
            selectedCategory === "all" ||
            skill.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    if (sortBy === "name") {
        results.sort((a, b) => a.name.localeCompare(b.name));
    }

    exploreGrid.replaceChildren();

    results.forEach(skill => {
        exploreGrid.appendChild(createSkillCard(skill));
    });

    resultCount.textContent =
        results.length + (results.length === 1 ? " skill" : " skills");

    noResults.hidden = results.length > 0;
    exploreGrid.hidden = results.length === 0;
}

function resetFilters() {
    searchInput.value = "";
    categoryFilter.value = "all";
    sortFilter.value = "default";
    displayExploreSkills();
}

searchButton.addEventListener("click", displayExploreSkills);

searchInput.addEventListener("keydown", event => {
    if (event.key === "Enter") displayExploreSkills();
});

document.querySelectorAll(".popular-tag").forEach(button => {
    button.addEventListener("click", function () {
        searchInput.value = this.dataset.search;
        displayExploreSkills();
    });
});

categoryFilter.addEventListener("change", displayExploreSkills);
sortFilter.addEventListener("change", displayExploreSkills);
clearFilters.addEventListener("click", resetFilters);
emptyClearButton.addEventListener("click", resetFilters);

async function loadExploreData() {
    try {
        const result = await apiRequest("/api/skills?type=teach");

        exploreSkills = (result.skills || []).map(skill => ({
            id: skill._id,
            userId: String(skill.userId),
            name: skill.name,
            category: guessCategory(skill.name),
            teacher: skill.userName,
            description: skill.description || "",
            icon: "✨"
        }));

        if (token && userId) {
            const [ownSkillsResult, requestsResult] = await Promise.all([
                apiRequest(
                    "/api/skills?userId=" +
                    encodeURIComponent(userId) + "&type=teach"
                ),
                apiRequest(
                    "/api/swaps?userId=" + encodeURIComponent(userId)
                )
            ]);

            myTeachingSkills = ownSkillsResult.skills || [];
            requests = requestsResult.swaps || [];
        }

        displayExploreSkills();
    } catch (error) {
        console.error("Could not load Explore data:", error);
        resultCount.textContent = "Unable to load skills";
        noResults.hidden = false;
        exploreGrid.hidden = true;
    }
}
loadExploreData();