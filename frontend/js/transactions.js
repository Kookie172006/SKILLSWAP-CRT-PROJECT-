
const API_BASE_URL = "http://localhost:5000";

const transactionList = document.getElementById("transactionList");
const emptyTransactions = document.getElementById("emptyTransactions");
const transactionFilter = document.getElementById("transactionFilter");

const currentBalanceElement = document.getElementById("currentBalance");
const totalEarnedElement = document.getElementById("totalEarned");
const totalSpentElement = document.getElementById("totalSpent");

const token = localStorage.getItem("skillswap-token");

let currentUser = null;
let transactions = [];
let currentBalance = 0;

try {
    currentUser = JSON.parse(
        localStorage.getItem("skillswap-user") || "null"
    );
} catch (error) {
    currentUser = null;
}

const userId = currentUser?._id || currentUser?.id;

async function apiRequest(endpoint) {
    const response = await fetch(API_BASE_URL + endpoint, {
        headers: token
            ? { Authorization: "Bearer " + token }
            : {}
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(result.message || "Unable to load credit information.");
    }

    return result;
}

function mapTransaction(item) {
    const types = {
        signup_bonus: "Bonus",
        teaching_reward: "Earned",
        learning_cost: "Spent"
    };

    const type = types[item.type] || "Other";

    const titles = {
        signup_bonus: "Welcome bonus",
        teaching_reward: "Skill taught",
        learning_cost: "Learning session"
    };

    return {
        id: item._id,
        title: titles[item.type] || "SkillSwap transaction",
        description: item.description || "SkillSwap credit transaction",
        type,
        amount: Number(item.amount) || 0,
        date: item.createdAt || item.date
    };
}

function formatDate(dateString) {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "Unknown date";
    }

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function updateCreditSummary() {
    const earned = transactions
        .filter(item => item.type === "Earned")
        .reduce((total, item) => total + Math.max(0, item.amount), 0);

    const spent = transactions
        .filter(item => item.type === "Spent")
        .reduce((total, item) => total + Math.abs(item.amount), 0);

    currentBalanceElement.textContent = currentBalance;
    totalEarnedElement.textContent = earned;
    totalSpentElement.textContent = spent;
}

function renderTransactions() {
    const selectedFilter = transactionFilter.value;

    transactionList.replaceChildren();

    const filteredTransactions = transactions.filter(item =>
        selectedFilter === "All" || item.type === selectedFilter
    );

    emptyTransactions.hidden = filteredTransactions.length > 0;

    filteredTransactions.forEach(item => {
        const row = document.createElement("tr");

        const activityCell = document.createElement("td");
        const activity = document.createElement("div");
        activity.className = "activity-cell";

        const icon = document.createElement("span");
        icon.className = "activity-icon";
        icon.textContent =
            item.type === "Earned" ? "↗" :
            item.type === "Spent" ? "↘" : "🎁";

        const textContainer = document.createElement("div");

        const title = document.createElement("div");
        title.className = "activity-title";
        title.textContent = item.title;

        const description = document.createElement("div");
        description.className = "activity-description";
        description.textContent = item.description;

        textContainer.append(title, description);
        activity.append(icon, textContainer);
        activityCell.appendChild(activity);

        const dateCell = document.createElement("td");
        dateCell.textContent = formatDate(item.date);

        const typeCell = document.createElement("td");
        const typeLabel = document.createElement("span");
        typeLabel.className = "transaction-type";
        typeLabel.textContent = item.type;
        typeCell.appendChild(typeLabel);

        const amountCell = document.createElement("td");
        amountCell.className =
            item.amount > 0 ? "credit-positive" : "credit-negative";

        amountCell.textContent =
            `${item.amount > 0 ? "+" : ""}${item.amount} credit${Math.abs(item.amount) === 1 ? "" : "s"}`;

        const balanceCell = document.createElement("td");
        balanceCell.className = "balance-cell";
        balanceCell.textContent = `${item.balanceAfter} credits`;

        row.append(
            activityCell,
            dateCell,
            typeCell,
            amountCell,
            balanceCell
        );

        transactionList.appendChild(row);
    });

    updateCreditSummary();
}

async function loadTransactions() {
    if (!token || !userId) {
        currentBalanceElement.textContent = "—";
        totalEarnedElement.textContent = "—";
        totalSpentElement.textContent = "—";
        emptyTransactions.hidden = false;

        const message = emptyTransactions.querySelector("p");
        if (message) message.textContent = "Please log in to view your credits.";

        return;
    }

    try {
        const encodedUserId = encodeURIComponent(userId);

        const [balanceResult, historyResult] = await Promise.all([
            apiRequest(`/api/credits/${encodedUserId}/balance`),
            apiRequest(`/api/credits/${encodedUserId}/transactions`)
        ]);

        currentBalance = Number(balanceResult.balance) || 0;

        transactions = (historyResult.transactions || [])
            .map(mapTransaction)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        // The API provides each transaction's amount and date, but not
        // balanceAfter. Reconstruct the running balance for display.
        let runningBalance = currentBalance;

        transactions = transactions.map(item => {
            const transaction = {
                ...item,
                balanceAfter: runningBalance
            };

            runningBalance -= item.amount;
            return transaction;
        });

        renderTransactions();
    } catch (error) {
        console.error("Could not load transactions:", error);

        currentBalanceElement.textContent = "—";
        totalEarnedElement.textContent = "—";
        totalSpentElement.textContent = "—";
        emptyTransactions.hidden = false;

        const message = emptyTransactions.querySelector("p");
        if (message) message.textContent =
            "Unable to load credit history. Please refresh and try again.";
    }
}
transactionFilter.addEventListener("change", renderTransactions);

loadTransactions();