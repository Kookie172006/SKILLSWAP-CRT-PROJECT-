
// =========================
// SESSION STORAGE AND SETUP
// =========================

const sessionForm = document.getElementById("sessionForm");
const sessionList = document.getElementById("sessionList");
const sessionFilter = document.getElementById("sessionFilter");
const sessionMessage = document.getElementById("sessionMessage");

const sessionDate = document.getElementById("sessionDate");
const sessionTime = document.getElementById("sessionTime");

let sessions = JSON.parse(localStorage.getItem("skillswap-sessions")) || [];

// Prevent selecting a date in the past.
const today = new Date();
const localToday = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
].join("-");

sessionDate.min = localToday;

// Add example sessions only when the user has no saved sessions.
if (!localStorage.getItem("skillswap-sessions")) {
    sessions = [
        {
            id: "demo1",
            skillName: "Java Basics",
            partner: "Alex Morgan",
            date: localToday,
            time: "16:00",
            notes: "Practice loops and arrays together.",
            status: "Scheduled"
        },
        {
            id: "demo2",
            skillName: "UI/UX Design",
            partner: "Taylor Lee",
            date: localToday,
            time: "18:00",
            notes: "Explore wireframes and design principles.",
            status: "Scheduled"
        },
        {
            id: "demo3",
            skillName: "Python Fundamentals",
            partner: "Sam Wilson",
            date: localToday,
            time: "10:00",
            notes: "Review variables and dictionaries.",
            status: "Completed"
        }
    ];

    saveSessions();
}

// =========================
// SAVE SESSION DATA
// =========================

function saveSessions() {
    localStorage.setItem("skillswap-sessions", JSON.stringify(sessions));
}

// =========================
// DISPLAY SESSION STATISTICS
// =========================

function updateSessionStats() {
    document.getElementById("upcomingCount").textContent =
        sessions.filter(session => session.status === "Scheduled").length;

    document.getElementById("completedCount").textContent =
        sessions.filter(session => session.status === "Completed").length;

    const people = new Set(
        sessions
            .filter(session => session.status !== "Cancelled")
            .map(session => session.partner.trim().toLowerCase())
    );

    document.getElementById("peopleCount").textContent = people.size;
}

// =========================
// DISPLAY SESSION CARDS
// =========================

function renderSessions() {
    sessionList.innerHTML = "";

    const filter = sessionFilter.value;

    const filteredSessions = sessions
        .filter(session => filter === "All" || session.status === filter)
        .sort((a, b) =>
            (a.date + a.time).localeCompare(b.date + b.time)
        );

    if (filteredSessions.length === 0) {
        sessionList.innerHTML = `
            <div class="empty-sessions">
                <h3>No sessions found 🌱</h3>
                <p>Schedule a session or choose another filter.</p>
            </div>
        `;

        updateSessionStats();
        return;
    }

    filteredSessions.forEach(session => {
        const card = document.createElement("article");
        card.className = "session-item";

        const top = document.createElement("div");
        top.className = "session-item-top";

        const details = document.createElement("div");

        const title = document.createElement("h3");
        title.textContent = session.skillName;

        const partner = document.createElement("p");
        partner.textContent = `🤝 Partner: ${session.partner}`;

        const date = document.createElement("p");
        date.textContent = `📅 Date: ${session.date}`;

        const time = document.createElement("p");
        time.textContent = `🕒 Time: ${session.time}`;

        details.append(title, partner, date, time);

        if (session.notes) {
            const notes = document.createElement("p");
            notes.textContent = `📝 ${session.notes}`;
            details.appendChild(notes);
        }

        const status = document.createElement("span");
        status.className = "session-status";
        status.textContent = session.status;

        top.append(details, status);
        card.appendChild(top);

        // Actions are available only for scheduled sessions.
        if (session.status === "Scheduled") {
            const actions = document.createElement("div");
            actions.className = "session-actions";

            const completeButton = document.createElement("button");
            completeButton.className = "complete-session";
            completeButton.type = "button";
            completeButton.textContent = "Mark completed";

            completeButton.addEventListener("click", () => {
                const confirmed = confirm(
                    "Mark this session as completed? In the real app, both users should confirm completion."
                );

                if (confirmed) {
                    updateSessionStatus(session.id, "Completed");
                }
            });

            const reviewsButton = document.createElement("a");
            reviewsButton.href = "reviews.html";
            reviewsButton.className = "btn btn-outline";
            reviewsButton.textContent = "Reviews";

            const cancelButton = document.createElement("button");
            cancelButton.type = "button";
            cancelButton.textContent = "Cancel session";

            cancelButton.addEventListener("click", () => {
                if (confirm("Are you sure you want to cancel this session?")) {
                    updateSessionStatus(session.id, "Cancelled");
                }
            });

            actions.append(completeButton, reviewsButton, cancelButton);
            card.appendChild(actions);
        }

        sessionList.appendChild(card);
    });

    updateSessionStats();
}

// =========================
// CREATE A NEW SESSION
// =========================

sessionForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const skillName = document.getElementById("skillName").value.trim();
    const partner = document.getElementById("partnerName").value.trim();
    const date = sessionDate.value;
    const time = sessionTime.value;
    const notes = document.getElementById("sessionNotes").value.trim();

    if (!skillName || !partner || !date || !time) {
        showSessionMessage("Please fill in all required fields.", true);
        return;
    }

    if (date < localToday) {
        showSessionMessage("Please choose today or a future date.", true);
        return;
    }

    if (date === localToday) {
        const selectedDateTime = new Date(`${date}T${time}`);

        if (selectedDateTime < new Date()) {
            showSessionMessage("Please choose a future time.", true);
            return;
        }
    }

    const newSession = {
        id: Date.now().toString(),
        skillName,
        partner,
        date,
        time,
        notes,
        status: "Scheduled"
    };

    sessions.push(newSession);
    saveSessions();

    sessionForm.reset();
    sessionDate.min = localToday;
    sessionFilter.value = "All";

    showSessionMessage("Session scheduled successfully! 🎉", false);
    renderSessions();
});

// =========================
// UPDATE SESSION STATUS
// =========================

function updateSessionStatus(id, status) {
    sessions = sessions.map(session =>
        session.id === id ? { ...session, status } : session
    );

    saveSessions();
    renderSessions();
}

// =========================
// FORM FEEDBACK
// =========================

function showSessionMessage(message, isError) {
    sessionMessage.textContent = message;
    sessionMessage.style.color = isError ? "#d94848" : "var(--primary)";
}

// =========================
// FILTER SESSION CARDS
// =========================

sessionFilter.addEventListener("change", renderSessions);

// =========================
// INITIAL PAGE RENDER
// =========================

renderSessions();

