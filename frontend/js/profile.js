
/* =====================================
   PROFILE ELEMENTS
===================================== */

const profileForm = document.getElementById("profileForm");
const editPanel = document.getElementById("editProfilePanel");
const profileMessage = document.getElementById("profileMessage");

const profileFields = {
    name: document.getElementById("profileName"),
    headline: document.getElementById("profileHeadline"),
    location: document.getElementById("profileLocationInput"),
    email: document.getElementById("profileEmail"),
    bio: document.getElementById("profileBioInput")
};

/* Read saved profile information */
function getProfileData() {
    try {
        return JSON.parse(localStorage.getItem("skillswap-profile") || "{}");
    } catch {
        return {};
    }
}

/* Display saved information on the page */
function displayProfile() {
    const profile = getProfileData();

    const name = profile.name || localStorage.getItem("skillswap-name") || "Your Name";

    document.getElementById("displayName").textContent = name;
    document.getElementById("profileAvatar").textContent =
        name.trim().charAt(0).toUpperCase() || "S";

    document.getElementById("displayHeadline").textContent =
        profile.headline || "Learning something new every day ✨";

    document.getElementById("displayLocation").textContent =
        "📍 " + (profile.location || "Add your location");

    document.getElementById("displayBio").textContent =
        profile.bio || "Your story starts here! Add a short introduction about yourself.";

    profileFields.name.value = profile.name || "";
    profileFields.headline.value = profile.headline || "";
    profileFields.location.value = profile.location || "";
    profileFields.email.value = profile.email || "";
    profileFields.bio.value = profile.bio || "";

    updateProfileCompletion(profile);
    displaySkills();
}

/* Open the edit form */
function openEditForm() {
    editPanel.hidden = false;
    profileFields.name.focus();

    editPanel.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

/* Close the edit form */
function closeEditForm() {
    editPanel.hidden = true;
    profileMessage.textContent = "";
    profileMessage.className = "form-message";
}

/* Save edited profile details */
profileForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const profile = {
        name: profileFields.name.value.trim(),
        headline: profileFields.headline.value.trim(),
        location: profileFields.location.value.trim(),
        email: profileFields.email.value.trim(),
        bio: profileFields.bio.value.trim()
    };

    if (profile.name.length < 2) {
        profileMessage.textContent = "Please enter your full name.";
        profileMessage.className = "form-message error";
        return;
    }

    if (profile.email && !profileFields.email.validity.valid) {
        profileMessage.textContent = "Please enter a valid email address.";
        profileMessage.className = "form-message error";
        return;
    }

    localStorage.setItem("skillswap-profile", JSON.stringify(profile));
    localStorage.setItem("skillswap-name", profile.name);

    displayProfile();

    profileMessage.textContent = "Profile saved in this browser!";
    profileMessage.className = "form-message success";
});

/* Calculate profile completion */
function updateProfileCompletion(profile) {
    const fields = [
        profile.name,
        profile.headline,
        profile.location,
        profile.email,
        profile.bio
    ];

    const completed = fields.filter(value => value && value.trim()).length;
    const percent = Math.round((completed / fields.length) * 100);

    document.getElementById("completionPercent").textContent = percent + "%";
    document.getElementById("completionBar").style.width = percent + "%";
}

/* Display teaching and learning skills */
function displaySkills() {
    let skills = [];

    try {
        skills = JSON.parse(localStorage.getItem("skillswap-skills") || "[]");
    } catch {
        skills = [];
    }

    const teaching = document.getElementById("teachingSkills");
    const learning = document.getElementById("learningSkills");

    teaching.replaceChildren();
    learning.replaceChildren();

    const teachSkills = skills.filter(skill => skill.type !== "learn");
    const learnSkills = skills.filter(skill => skill.type === "learn");

    function addTags(container, list, emptyMessage) {
        if (list.length === 0) {
            const message = document.createElement("p");
            message.className = "profile-empty-text";
            message.textContent = emptyMessage;
            container.appendChild(message);
            return;
        }
        list.forEach(skill => {
            const tag = document.createElement("span");
            tag.className = "profile-skill-tag";
            tag.textContent = skill.name || skill.title || "Skill";
            container.appendChild(tag);
        });
    }

    addTags(teaching, teachSkills, "No teaching skills added yet.");
    addTags(learning, learnSkills, "Add topics you'd love to learn.");

    document.getElementById("totalSkills").textContent = skills.length;
}

/* Connect the buttons */
document.getElementById("editProfileBtn").addEventListener("click", openEditForm);
document.getElementById("completeProfileBtn").addEventListener("click", openEditForm);
document.getElementById("closeEditBtn").addEventListener("click", closeEditForm);
document.getElementById("cancelEditBtn").addEventListener("click", closeEditForm);

/* Start with the form hidden */
editPanel.hidden = true;

/* Load saved information */
displayProfile();