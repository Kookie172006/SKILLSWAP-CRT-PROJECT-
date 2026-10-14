const API_BASE_URL = "http://localhost:5000";
const token = localStorage.getItem("skillswap-token");

// Get logged in user to determine which bubbles are "Outgoing" (purple)
let currentUser = null;
try {
    currentUser = JSON.parse(localStorage.getItem("skillswap-user") || "null");
} catch (error) {
    currentUser = null;
}
const currentUserId = currentUser?._id || currentUser?.id;

// DOM Elements
const emptyChatState = document.getElementById("emptyChatState");
const activeChatState = document.getElementById("activeChatState");
const chatMessages = document.getElementById("chatMessages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const conversationList = document.getElementById("conversationList");
const scheduleBtn = document.getElementById("scheduleBtn");

// Active Chat State Variables
let activeSwapId = null;
let activeReceiverId = null;
let chatPollingInterval = null;

// Initialize Page
function init() {
    if (!token || !currentUserId) {
        alert("Please log in to view messages.");
        window.location.href = "login.html";
        return;
    }

    // 1. Check if we arrived from the Requests page with a specific chat in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlSwapId = urlParams.get('swapId');
    const urlReceiverId = urlParams.get('receiverId');

    // Load sidebar conversations
    loadConversations(urlSwapId);

    // If URL has a chat, open it immediately
    if (urlSwapId && urlReceiverId) {
        openChat(urlSwapId, urlReceiverId, "SkillSwap Member"); // Name updates later
    }
}

// Open a specific chat panel
function openChat(swapId, receiverId, receiverName) {
    activeSwapId = swapId;
    activeReceiverId = receiverId;

    // Toggle UI States
    emptyChatState.hidden = true;
    activeChatState.hidden = false;

    // Update Header
    document.getElementById("activeName").textContent = receiverName;
    document.getElementById("activeAvatar").textContent = receiverName.charAt(0).toUpperCase();
    
    // Highlight active conversation in sidebar
    document.querySelectorAll('.conversation-item').forEach(item => item.classList.remove('active'));
    const activeItem = document.getElementById(`conv-${swapId}`);
    if(activeItem) activeItem.classList.add('active');

    // Setup schedule button link
    scheduleBtn.onclick = () => {
        window.location.href = `sessions.html?swapId=${swapId}&receiverId=${receiverId}`;
    };

    // Load messages and start polling
    loadMessages();
    if (chatPollingInterval) clearInterval(chatPollingInterval);
    chatPollingInterval = setInterval(loadMessages, 3000); // Check for new messages every 3s
}

// Fetch messages from backend
async function loadMessages() {
    if (!activeSwapId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/messages/${activeSwapId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success) {
            renderMessages(data.messages);
        }
    } catch (error) {
        console.error("Error loading messages:", error);
    }
}

// Render the message bubbles inside the chat window
function renderMessages(messages) {
    chatMessages.innerHTML = ""; // Clear current messages

    if(messages.length === 0) {
        chatMessages.innerHTML = `<p style="text-align:center; color:#888; margin-top:2rem;">No messages yet. Say hi!</p>`;
        return;
    }

    messages.forEach(msg => {
        const isOutgoing = msg.senderId === currentUserId;
        const msgTime = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const wrapper = document.createElement("div");
        wrapper.className = `message-wrapper ${isOutgoing ? 'outgoing' : 'incoming'}`;
        
        wrapper.innerHTML = `
            <span class="msg-sender">${isOutgoing ? 'You' : document.getElementById("activeName").textContent}</span>
            <div class="message-bubble">${msg.text}</div>
            <span class="msg-time">${msgTime}</span>
        `;
        
        chatMessages.appendChild(wrapper);
    });

    // Auto-scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Send a new message
async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !activeSwapId) return;

    // Clear input instantly for snappy feel
    messageInput.value = ""; 

    try {
        const response = await fetch(`${API_BASE_URL}/api/messages`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({
                swapId: activeSwapId,
                receiverId: activeReceiverId,
                text: text
            })
        });
        
        const data = await response.json();
        if (data.success) {
            loadMessages(); // Instantly refresh UI
        }
    } catch (error) {
        console.error("Error sending message:", error);
    }
}

// Bind Send Button and Enter Key
sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
});

// Load the sidebar conversations (Fetches accepted swaps from Member 3's API)
async function loadConversations(activeIdToHighlight) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/swaps?userId=${currentUserId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        // Filter only accepted swaps for chatting
        const acceptedSwaps = (data.swaps || []).filter(s => s.status === "accepted" || s.status === "completed");
        document.getElementById("chatCount").textContent = `${acceptedSwaps.length} chats`;
        
        conversationList.innerHTML = "";
        
        acceptedSwaps.forEach(swap => {
            // Determine who the "other" person is
            const isRequester = swap.requesterId === currentUserId;
            const otherName = isRequester ? swap.receiverName : swap.requesterName;
            const otherId = isRequester ? swap.receiverId : swap.requesterId;
            const skillContext = isRequester ? `Wants to learn ${swap.skillWanted}` : `Teaching ${swap.skillWanted}`;

            const convItem = document.createElement("div");
            convItem.className = `conversation-item ${swap._id === activeIdToHighlight ? 'active' : ''}`;
            convItem.id = `conv-${swap._id}`;
            
            convItem.innerHTML = `
                <div class="avatar">${otherName.charAt(0).toUpperCase()}</div>
                <div class="conv-details">
                    <div class="conv-header">
                        <h4>${otherName}</h4>
                    </div>
                    <p class="conv-preview">${skillContext}</p>
                </div>
            `;
            
            // When clicked, open the chat
            convItem.addEventListener("click", () => {
                openChat(swap._id, otherId, otherName);
            });
            
            conversationList.appendChild(convItem);
        });

    } catch (error) {
        console.error("Error loading sidebar:", error);
    }
}

// Start the script
init();
