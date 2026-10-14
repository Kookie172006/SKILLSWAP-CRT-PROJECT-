const API_BASE_URL = "http://localhost:5000";

const requestsList = document.getElementById("requestsList");
const requestsEmpty = document.getElementById("requestsEmpty");
const statusFilter = document.getElementById("statusFilter");

const incomingCount = document.getElementById("incomingCount");
const outgoingCount = document.getElementById("outgoingCount");
const pendingCount = document.getElementById("pendingCount");
const acceptedCount = document.getElementById("acceptedCount");

let currentTab = "all";
let requests = [];

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

function getStatusLabel(status) {
    const labels = {
        pending: "Pending",
        accepted: "Accepted",
        rejected: "Rejected",
        completed: "Completed",
        cancelled: "Cancelled"
    };

    return labels[String(status || "").toLowerCase()] || status || "Pending";
}

function getDirection(request) {
    return String(request.receiverId) === String(userId)
        ? "incoming"
        : "outgoing";
}

function formatDate(dateString) {
    if (!dateString) return "Date unavailable";

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function updateRequestCounts() {
    incomingCount.textContent = requests.filter(
        request => request.direction === "incoming"
    ).length;

    outgoingCount.textContent = requests.filter(
        request => request.direction === "outgoing"
    ).length;

    pendingCount.textContent = requests.filter(
        request => request.status === "Pending"
    ).length;

    acceptedCount.textContent = requests.filter(
        request => request.status === "Accepted"
    ).length;
}

function createRequestCard(request) {
    const card = document.createElement("article");
    card.className = "request-card";

    const top = document.createElement("div");
    top.className = "request-card-top";

    const person = document.createElement("div");
    person.className = "request-person";

    const personName = request.direction === "incoming"
        ? request.requesterName
        : request.receiverName;

    const avatar = document.createElement("span");
    avatar.className = "request-avatar";
    avatar.textContent = (personName || "S").charAt(0).toUpperCase();

    const personDetails = document.createElement("div");

    const name = document.createElement("h3");
    name.textContent = personName || "SkillSwap member";

    const subtitle = document.createElement("p");
    subtitle.textContent = request.direction === "incoming"
        ? "Wants to learn from you"
        : "Your swap request";

    personDetails.append(name, subtitle);
    person.append(avatar, personDetails);

    const status = document.createElement("span");
    status.className =
        "request-status " + request.status.toLowerCase();
    status.textContent = request.status;

    top.append(person, status);

    const details = document.createElement("div");
    details.className = "request-skill-details";

    const skillBox = document.createElement("div");
    skillBox.className = "request-skill-box";

    const skillLabel = document.createElement("span");
    skillLabel.textContent = "SKILL REQUESTED";

    const skillName = document.createElement("strong");
    skillName.textContent = request.skillWanted || "Skill exchange";

    skillBox.append(skillLabel, skillName);

    const exchangeBox = document.createElement("div");
    exchangeBox.className = "request-skill-box";

    const exchangeLabel = document.createElement("span");
    exchangeLabel.textContent = "SKILL OFFERED";

    const exchangeValue = document.createElement("strong");
    exchangeValue.textContent = request.skillOffered || "Not specified";

    exchangeBox.append(exchangeLabel, exchangeValue);
    details.append(skillBox, exchangeBox);

    const bottom = document.createElement("div");
    bottom.className = "request-card-bottom";

    const date = document.createElement("span");
    date.className = "request-date";
    date.textContent = "Requested " + formatDate(request.createdAt);

    const actions = document.createElement("div");
    actions.className = "request-actions";

    if (
        request.direction === "incoming" &&
        request.status === "Pending"
    ) {
        const acceptButton = document.createElement("button");
        acceptButton.className = "accept-request";
        acceptButton.textContent = "Accept";

        acceptButton.addEventListener("click", () => {
            updateRequestStatus(request, "accepted");
        });

        const rejectButton = document.createElement("button");
        rejectButton.className = "reject-request";
        rejectButton.textContent = "Reject";

        rejectButton.addEventListener("click", () => {
            updateRequestStatus(request, "rejected");
        });

        actions.append(acceptButton, rejectButton);
    }

    // Show Chat only for accepted or completed swaps.
    if (
        ["Accepted", "Completed"].includes(request.status)
    ) {
        const chatButton = document.createElement("a");
        chatButton.className = "chat-request";
        chatButton.href = "messages.html";
        chatButton.textContent = "💬 Chat";
        chatButton.setAttribute(
            "aria-label",
            "Chat about this swap"
        );

        actions.appendChild(chatButton);
    }

    bottom.append(date, actions);
    card.append(top, details, bottom);

    return card;
}

async function updateRequestStatus(request, newStatus) {
    if (!token || !userId) {
        alert("Please log in again.");
        return;
    }

    try {
        await apiRequest(
            "/api/swaps/" + encodeURIComponent(request._id) + "/status",
            {
                method: "PATCH",
                body: JSON.stringify({
                    status: newStatus,
                    userId: String(userId)
                })
            }
        );

        await loadRequests();
    } catch (error) {
        alert("Could not update request: " + error.message);
    }
}

function displayRequests() {
    updateRequestCounts();

    const selectedStatus = statusFilter.value.toLowerCase();

    const filtered = requests.filter(request => {
        const matchesTab =
            currentTab === "all" ||
            request.direction === currentTab;

        const matchesStatus =
            selectedStatus === "all" ||
            request.status.toLowerCase() === selectedStatus;

        return matchesTab && matchesStatus;
    });

    requestsList.replaceChildren();

    filtered.forEach(request => {
        requestsList.appendChild(createRequestCard(request));
    });

    requestsEmpty.hidden = filtered.length > 0;
    requestsList.hidden = filtered.length === 0;

    if (filtered.length === 0) {
        const heading = requestsEmpty.querySelector("h2");
        const description = requestsEmpty.querySelector("p");

        if (heading) {
            heading.textContent = requests.length === 0
                ? "No requests here yet"
                : "No matching requests";
        }

        if (description) {
            description.textContent = requests.length === 0
                ? "Explore skills and send your first swap request to get things started!"
                : "Try a different tab or status filter.";
        }
    }
}

async function loadRequests() {
    if (!token || !userId) {
        requests = [];
        displayRequests();

        const heading = requestsEmpty.querySelector("h2");
        const description = requestsEmpty.querySelector("p");

        if (heading) heading.textContent = "Please log in";

        if (description) {
            description.textContent =
                "Log in to view and manage your swap requests.";
        }

        return;
    }

    try {
        const result = await apiRequest(
            "/api/swaps?userId=" + encodeURIComponent(userId)
        );

        requests = (result.swaps || []).map(request => ({
            ...request,
            direction: getDirection(request),
            status: getStatusLabel(request.status)
        }));

        displayRequests();
    } catch (error) {
        console.error("Could not load swap requests:", error);

        requests = [];
        displayRequests();

        const heading = requestsEmpty.querySelector("h2");
        const description = requestsEmpty.querySelector("p");

        if (heading) heading.textContent = "Couldn't load requests";

        if (description) {
            description.textContent =
                error.message || "Please refresh and try again.";
        }
    }
}

document.querySelectorAll(".request-tab").forEach(button => {
    button.addEventListener("click", function () {
        currentTab = this.dataset.tab;
        document.querySelectorAll(".request-tab").forEach(tab => {
            tab.classList.remove("active");
        });

        this.classList.add("active");
        displayRequests();
    });
});

statusFilter.addEventListener("change", displayRequests);

loadRequests();