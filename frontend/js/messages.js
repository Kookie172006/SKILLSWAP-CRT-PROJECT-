
const API_BASE_URL = "https://skillswap-crt-project.onrender.com";
const token = localStorage.getItem("skillswap-token");

let currentUser = null;

try {
    currentUser = JSON.parse(localStorage.getItem("skillswap-user") || "null");
} catch (error) {
    currentUser = null;
}

const currentUserId = currentUser?._id || currentUser?.id;

const emptyChatState = document.getElementById("emptyChatState");
const activeChatState = document.getElementById("activeChatState");
const chatMessages = document.getElementById("chatMessages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const conversationList = document.getElementById("conversationList");
const scheduleBtn = document.getElementById("scheduleBtn");

let activeSwapId = null;
let activeReceiverId = null;
let chatPollingInterval = null;

function init() {
    if (!token || !currentUserId) {
        alert("Please log in to view messages.");
        window.location.href = "login.html";
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const urlSwapId = urlParams.get("swapId");
    const urlReceiverId = urlParams.get("receiverId");

    loadConversations(urlSwapId);

    if (urlSwapId && urlReceiverId) {
        openChat(urlSwapId, urlReceiverId, "SkillSwap Member");
    }
}

function openChat(swapId, receiverId, receiverName) {
    activeSwapId = swapId;
    activeReceiverId = receiverId;

    emptyChatState.hidden = true;
    activeChatState.hidden = false;

    document.getElementById("activeName").textContent = receiverName;
    document.getElementById("activeAvatar").textContent =
        receiverName.charAt(0).toUpperCase();

    document.querySelectorAll(".conversation-item").forEach(item => {
        item.classList.remove("active");
    });

    const activeItem = document.getElementById(`conv-${swapId}`);

    if (activeItem) {
        activeItem.classList.add("active");
    }

    scheduleBtn.onclick = () => {
        window.location.href =
            `sessions.html?swapId=${swapId}&receiverId=${receiverId}` +
            `&partnerName=${encodeURIComponent(receiverName)}`;
    };

    loadMessages();

    if (chatPollingInterval) {
        clearInterval(chatPollingInterval);
    }

    chatPollingInterval = setInterval(loadMessages, 3000);
}

async function loadMessages() {
    if (!activeSwapId) return;

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/messages/${activeSwapId}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (response.ok && data.success) {
            renderMessages(data.messages || []);
        }
    } catch (error) {
        console.error("Error loading messages:", error);
    }
}

function renderMessages(messages) {
    chatMessages.replaceChildren();

    if (messages.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.textContent = "No messages yet. Say hi!";
        emptyMessage.style.textAlign = "center";
        emptyMessage.style.color = "#888";
        emptyMessage.style.marginTop = "2rem";
        chatMessages.appendChild(emptyMessage);
        return;
    }

    messages.forEach(msg => {
        const isOutgoing =
            String(msg.senderId?._id || msg.senderId) === String(currentUserId);

        const msgTime = new Date(msg.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });

        const wrapper = document.createElement("div");
        wrapper.className =
            `message-wrapper ${isOutgoing ? "outgoing" : "incoming"}`;

        const sender = document.createElement("span");
        sender.className = "msg-sender";
        sender.textContent = isOutgoing
            ? "You"
            : document.getElementById("activeName").textContent;

        const bubble = document.createElement("div");
        bubble.className = "message-bubble";
        bubble.textContent = msg.text;

        const time = document.createElement("span");
        time.className = "msg-time";
        time.textContent = msgTime;

        wrapper.append(sender, bubble, time);
        chatMessages.appendChild(wrapper);
    });

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage() {
    const text = messageInput.value.trim();

    if (!text || !activeSwapId || !activeReceiverId) return;

    sendBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/api/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                swapId: activeSwapId,
                receiverId: activeReceiverId,
                text
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            console.error("Message could not be sent:", data.message);
            return;
        }

        messageInput.value = "";
        await loadMessages();
    } catch (error) {
        console.error("Error sending message:", error);
    } finally {
        sendBtn.disabled = false;
    }
}

async function loadConversations(activeIdToHighlight) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/swaps?userId=${encodeURIComponent(currentUserId)}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Could not load conversations:", data.message);
            return;
        }

        const acceptedSwaps = (data.swaps || []).filter(
            swap => swap.status === "accepted" || swap.status === "completed"
        );

        const chatCount = document.getElementById("chatCount");

        if (chatCount) {
            chatCount.textContent =
                `${acceptedSwaps.length} ${acceptedSwaps.length === 1 ? "chat" : "chats"}`;
        }

        conversationList.replaceChildren();

        acceptedSwaps.forEach(swap => {
            const requesterId = swap.requesterId?._id || swap.requesterId;
            const receiverId = swap.receiverId?._id || swap.receiverId;

            const isRequester =
                String(requesterId) === String(currentUserId);

            const otherName = isRequester
                ? swap.receiverName
                : swap.requesterName;

            const otherId = isRequester ? receiverId : requesterId;

            const skillContext = isRequester
                ? `Wants to learn ${swap.skillWanted || "a skill"}`
                : `Teaching ${swap.skillWanted || "a skill"}`;

            const convItem = document.createElement("button");
            convItem.type = "button";
            convItem.className = "conversation-item";
            convItem.id = `conv-${swap._id}`;

            if (String(swap._id) === String(activeIdToHighlight)) {
                convItem.classList.add("active");
            }

            const avatar = document.createElement("div");
            avatar.className = "avatar";
            avatar.textContent = (otherName || "M").charAt(0).toUpperCase();

            const details = document.createElement("div");
            details.className = "conv-details";

            const header = document.createElement("div");
            header.className = "conv-header";

            const name = document.createElement("h4");
            name.textContent = otherName || "SkillSwap Member";

            const preview = document.createElement("p");
            preview.className = "conv-preview";
            preview.textContent = skillContext;

            header.appendChild(name);
            details.append(header, preview);
            convItem.append(avatar, details);

            convItem.addEventListener("click", () => {
                openChat(swap._id, otherId, otherName || "SkillSwap Member");
            });

            conversationList.appendChild(convItem);
        });
    } catch (error) {
        console.error("Error loading conversations:", error);
    }
}

sendBtn.addEventListener("click", sendMessage);

messageInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
    }
});

init();

window.addEventListener("beforeunload", () => {
    if (chatPollingInterval) {
        clearInterval(chatPollingInterval);
    }
});
