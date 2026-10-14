
/* =========================================
   DASHBOARD PERSONALIZATION
========================================= */

// Read demo profile information from browser storage
const savedName = localStorage.getItem("skillswap-name");
const savedSkills = JSON.parse(
    localStorage.getItem("skillswap-skills") || "[]"
);

// Update the welcome message and avatar
const welcomeName = document.getElementById("welcomeName");
const navUserName = document.getElementById("navUserName");
const navAvatar = document.getElementById("navAvatar");

if (savedName) {
    welcomeName.textContent = savedName.split(" ")[0];
    navUserName.textContent = savedName;
    navAvatar.textContent = savedName.charAt(0).toUpperCase();
}

// Display demo skills if they exist in browser storage
const skillsList = document.getElementById("mySkillsList");
const skillsEmpty = document.getElementById("mySkillsEmpty");
const skillsCount = document.getElementById("skillsCount");

if (savedSkills.length > 0) {
    skillsEmpty.style.display = "none";

    skillsCount.textContent =
        savedSkills.length + (savedSkills.length === 1 ? " Skill" : " Skills");

    savedSkills.forEach(function (skill) {
        const item = document.createElement("article");
        item.className = "dashboard-skill-item";

        const details = document.createElement("div");

        const title = document.createElement("h3");
        title.textContent = skill.name || skill.title || "Untitled skill";
        const description = document.createElement("p");
        description.textContent =
            skill.type === "learn"
                ? "Want to learn"
                : "Can teach";

        details.appendChild(title);
        details.appendChild(description);

        const label = document.createElement("span");
        label.className = "skill-type-label";
        label.textContent =
            skill.type === "learn" ? "Learning" : "Teaching";

        item.appendChild(details);
        item.appendChild(label);

        skillsList.appendChild(item);
    });
} else {
    skillsCount.textContent = "0 Skills";
}

// NOTE:
// The credit balance and request count are demo placeholders.
// The backend will provide real values after integration.