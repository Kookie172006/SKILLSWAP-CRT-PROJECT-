const API_BASE_URL = "http://localhost:5000";
const token = localStorage.getItem("skillswap-token");

let currentUser = null;
try {
    currentUser = JSON.parse(localStorage.getItem("skillswap-user") || "null");
} catch (error) {
    currentUser = null;
}
const currentUserId = currentUser?._id || currentUser?.id;

if (!token || !currentUserId) {
    window.location.href = "login.html";
}

const urlParams = new URLSearchParams(window.location.search);
const activeSwapId = urlParams.get('swapId');
const activePartnerId = urlParams.get('receiverId');
const urlPartnerName = urlParams.get('partnerName'); 

const sessionForm = document.getElementById("sessionForm");
const sessionList = document.getElementById("sessionList");
const sessionFilter = document.getElementById("sessionFilter");
const sessionMessage = document.getElementById("sessionMessage");
const sessionDate = document.getElementById("sessionDate");
const sessionTime = document.getElementById("sessionTime");
const partnerNameInput = document.getElementById("partnerName");
const skillNameInput = document.getElementById("skillName");
const sessionNotesInput = document.getElementById("sessionNotes");

if (urlPartnerName) {
    partnerNameInput.value = urlPartnerName;
    partnerNameInput.readOnly = true; 
    partnerNameInput.style.backgroundColor = "var(--bg-secondary)"; 
    partnerNameInput.style.cursor = "not-allowed";
}

let sessions = [];

const today = new Date();
const localToday = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
].join("-");
sessionDate.min = localToday;

async function loadSessions() {
    try {
        // FIXED: Added API_BASE_URL formatting and $ to currentUserId
        const response = await fetch(`${API_BASE_URL}/api/sessions?userId=${currentUserId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        
        if (Array.isArray(data)) {
            sessions = data;
        } else if (data && Array.isArray(data.sessions)) {
            sessions = data.sessions;
        } else if (data && Array.isArray(data.data)) {
            sessions = data.data;
        } else {
            sessions = []; 
        }
        
        renderSessions();
    } catch (error) {
        console.error("Error loading sessions:", error);
        sessionList.innerHTML = `<div class="empty-sessions"><p style="color:#d94848;">Failed to connect to server. Please try again.</p></div>`;
    }
}

sessionForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const date = sessionDate.value;
    const time = sessionTime.value;
    const skillName = skillNameInput.value.trim();
    const notes = sessionNotesInput.value.trim();
    const partnerName = partnerNameInput.value.trim();

    if (!activeSwapId || !activePartnerId || !date || !time) {
        showSessionMessage("Missing required swap details or time. Please schedule directly from a chat.", true);
        return;
    }

    const payload = {
        swapId: activeSwapId, 
        receiverId: activePartnerId,
        date: date,
        time: time,
        skillName: skillName,
        partnerName: partnerName,
        notes: notes
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok || result.success) {
            showSessionMessage("Session scheduled successfully! 🎉", false);
            sessionForm.reset();
            if (urlPartnerName) partnerNameInput.value = urlPartnerName;
            sessionDate.min = localToday;
            loadSessions();
        } else {
            showSessionMessage(result.message || "Failed to schedule session.", true);
        }
    } catch (error) {
        console.error("Error creating session:", error);
        showSessionMessage("Network error.", true);
    }
});

async function completeSessionBackend(sessionId, swapId) {
    try {
        // FIXED: Added API_BASE_URL formatting and $ to sessionId
        const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/complete`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const confirmReview = confirm("Session completed! Do you want to leave a review now?");
            if (confirmReview) {
                // FIXED: Added $ to swapId and sessionId variables
                window.location.href = `reviews?swapId=${swapId || ''}&sessionId=${sessionId}`;
                return;
            }
            loadSessions(); 
        } else {
            alert("Failed to update session status in the database.");
        }
    } catch (error) {
        console.error("Error updating status:", error);
    }
}

function updateSessionStats() {
    document.getElementById("upcomingCount").textContent = sessions.filter(s => s.status.toLowerCase() === "scheduled").length;
    document.getElementById("completedCount").textContent = sessions.filter(s => s.status.toLowerCase() === "completed").length;
    
    const people = new Set(
        sessions
            .filter(s => s.status.toLowerCase() !== "cancelled" && s.partnerName)
            .map(s => s.partnerName.trim().toLowerCase())
    );
    document.getElementById("peopleCount").textContent = people.size;
}

function renderSessions() {
    sessionList.innerHTML = "";
    
    const filter = sessionFilter.value.toLowerCase();
    const filteredSessions = sessions
        .filter(session => filter === "all" || session.status.toLowerCase() === filter)
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

    if (filteredSessions.length === 0) {
        sessionList.innerHTML = `<div class="empty-sessions"><h3>No sessions found 🌱</h3><p>Schedule a session or choose another filter.</p></div>`;
        updateSessionStats();
        return;
    }

    filteredSessions.forEach(session => {
        const sessionId = session._id || session.id; 
        const pName = session.partnerName || "Unknown Partner";
        
        const card = document.createElement("article");
        card.className = "session-item";

        const top = document.createElement("div");
        top.className = "session-item-top";

        const details = document.createElement("div");
        
        const title = document.createElement("h3");
        title.textContent = session.skillName || "Skill Session";

        const partner = document.createElement("p");
        partner.textContent = `🤝 Partner: ${pName}`;

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
        status.textContent = session.status.charAt(0).toUpperCase() + session.status.slice(1);

        top.append(details, status);
        card.appendChild(top);

        if (session.status.toLowerCase() === "scheduled") {
            const actions = document.createElement("div");
            actions.className = "session-actions";

            const completeButton = document.createElement("button");
            completeButton.className = "complete-session";
            completeButton.textContent = "Mark completed";
            completeButton.addEventListener("click", () => {
                if (confirm("Mark this session as completed?")) {
                    completeSessionBackend(sessionId, session.swapId);
                }
            });

            actions.appendChild(completeButton);
            card.appendChild(actions);
        }

        sessionList.appendChild(card);
    });

    updateSessionStats();
}

sessionFilter.addEventListener("change", renderSessions);

function showSessionMessage(message, isError) {
    sessionMessage.textContent = message;
    sessionMessage.style.color = isError ? "#d94848" : "var(--primary)";
}

loadSessions();
