<<<<<<< HEAD

/* ========================================
   MESSAGES PAGE - ELEMENTS
======================================== */

const conversationList = document.getElementById("conversationList");
const conversationSearch = document.getElementById("conversationSearch");
const conversationCount = document.getElementById("conversationCount");

const noConversations = document.getElementById("noConversations");
const chatWelcome = document.getElementById("chatWelcome");
const activeChat = document.getElementById("activeChat");

const chatAvatar = document.getElementById("chatAvatar");
const chatName = document.getElementById("chatName");
const chatSkill = document.getElementById("chatSkill");
const chatMessages = document.getElementById("chatMessages");

const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");


/* ========================================
   LOAD SAVED CONVERSATIONS
======================================== */

function loadConversations() {
    try {
        const saved = JSON.parse(
            localStorage.getItem("skillswap-conversations") || "[]"
        );

        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        return [];
    }
}


/* ========================================
   SAVE CONVERSATIONS
======================================== */

function saveConversations() {
    localStorage.setItem(
        "skillswap-conversations",
        JSON.stringify(conversations)
    );
}


/* ========================================
   DEMO CONVERSATIONS
======================================== */

let conversations = loadConversations();

if (conversations.length === 0) {
    conversations = [
        {
            id: "chat1",
            name: "Alex",
            skill: "Java Programming",
            demo: true,
            messages: [
                {
                    sender: "Alex",
                    text: "Hey! Thanks for checking out my Java skills.",
                    time: "10:30 AM"
                },
                {
                    sender: "You",
                    text: "Hi! I'd love to learn more about Java.",
                    time: "10:32 AM"
                },
                {
                    sender: "Alex",
                    text: "Awesome! We can start with OOP concepts.",
                    time: "10:33 AM"
                }
            ]
        },
        {
            id: "chat2",
            name: "Taylor",
            skill: "UI/UX Design",
            demo: true,
            messages: [
                {
                    sender: "Taylor",
                    text: "Hello! Are you interested in learning UI/UX?",
                    time: "Yesterday"
                },
                {
                    sender: "You",
                    text: "Yes! I'd like to learn about wireframes.",
                    time: "Yesterday"
                }
            ]
        },
        {
            id: "chat3",
            name: "Sam",
            skill: "Python",
            demo: true,
            messages: [
                {
                    sender: "Sam",
                    text: "Hey there! I can help you get started with Python.",
                    time: "Mon"
                }
            ]
        }
    ];

    saveConversations();
}

let selectedConversationId = null;


/* ========================================
   CURRENT USER NAME
======================================== */

function getCurrentUserName() {
    return localStorage.getItem("skillswap-name") || "You";
}


/* ========================================
   FORMAT MESSAGE TIME
======================================== */

function getCurrentTime() {
    return new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });
}


/* ========================================
   DISPLAY CONVERSATION LIST
======================================== */

function displayConversations() {
    const searchText = conversationSearch.value.trim().toLowerCase();

    const filtered = conversations.filter(conversation =>
        conversation.name.toLowerCase().includes(searchText) ||
        conversation.skill.toLowerCase().includes(searchText)
    );

    conversationList.replaceChildren();

    filtered.forEach(conversation => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "conversation-item";

        if (conversation.id === selectedConversationId) {
            item.classList.add("active");
        }

        const avatar = document.createElement("span");
        avatar.className = "conversation-avatar";
        avatar.textContent = conversation.name.charAt(0).toUpperCase();

        const details = document.createElement("div");
        details.className = "conversation-details";

        const name = document.createElement("h3");
        name.textContent = conversation.name;

        const lastMessage = document.createElement("p");
        const last = conversation.messages[conversation.messages.length - 1];

        lastMessage.textContent = last ? last.text : "Start a conversation";

        details.append(name, lastMessage);

        const time = document.createElement("span");
        time.className = "conversation-time";
        time.textContent = last ? last.time : "";

        item.append(avatar, details, time);

        item.addEventListener("click", () => {
            selectedConversationId = conversation.id;
            displayConversations();
            openConversation(conversation.id);
        });

        conversationList.appendChild(item);
    });

    conversationCount.textContent =
        conversations.length +
        (conversations.length === 1 ? " chat" : " chats");

    noConversations.hidden = filtered.length > 0;
}


/* ========================================
   OPEN A CONVERSATION
======================================== */

function openConversation(conversationId) {
    const conversation = conversations.find(
        item => item.id === conversationId
    );

    if (!conversation) {
        return;
    }

    chatWelcome.hidden = true;
    activeChat.hidden = false;

    chatAvatar.textContent = conversation.name.charAt(0).toUpperCase();
    chatName.textContent = conversation.name;
    chatSkill.textContent = "Skill exchange: " + conversation.skill;

    displayMessages(conversation);
}


/* ========================================
   DISPLAY CHAT MESSAGES
======================================== */

function displayMessages(conversation) {
    chatMessages.replaceChildren();

    conversation.messages.forEach(message => {
        const isMine = message.sender === "You" ||
            message.sender === getCurrentUserName();

        const row = document.createElement("div");
        row.className = "message-row";

        if (isMine) {
            row.classList.add("mine");
        }

        const sender = document.createElement("span");
        sender.className = "message-sender";
        sender.textContent = isMine ? "You" : message.sender;

        const bubble = document.createElement("div");
        bubble.className = "message-bubble";
        bubble.textContent = message.text;

        const time = document.createElement("span");
        time.className = "message-time";
        time.textContent = message.time;

        row.append(sender, bubble, time);
        chatMessages.appendChild(row);
=======
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

    const urlParams = new URLSearchParams(window.location.search);
    const urlSwapId = urlParams.get('swapId');
    const urlReceiverId = urlParams.get('receiverId');

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
    document.getElementById("activeAvatar").textContent = receiverName.charAt(0).toUpperCase();
    
    document.querySelectorAll('.conversation-item').forEach(item => item.classList.remove('active'));
    const activeItem = document.getElementById(`conv-${swapId}`);
    if(activeItem) activeItem.classList.add('active');

    // FIXED: Added $ signs back to variables
    scheduleBtn.onclick = () => {
        window.location.href = `sessions?swapId=${swapId}&receiverId=${receiverId}&partnerName=${encodeURIComponent(receiverName)}`;
    };

    loadMessages();
    if (chatPollingInterval) clearInterval(chatPollingInterval);
    chatPollingInterval = setInterval(loadMessages, 3000); 
}

async function loadMessages() {
    if (!activeSwapId) return;

    try {
        // FIXED: Added API_BASE_URL formatting and $ to activeSwapId
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

function renderMessages(messages) {
    chatMessages.innerHTML = ""; 

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
>>>>>>> origin/member4-communication
    });

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

<<<<<<< HEAD

/* ========================================
   SEND A MESSAGE
======================================== */

messageForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const text = messageInput.value.trim();

    if (!text || !selectedConversationId) {
        return;
    }

    const conversation = conversations.find(
        item => item.id === selectedConversationId
    );

    if (!conversation) {
        return;
    }

    conversation.messages.push({
        sender: "You",
        text: text,
        time: getCurrentTime()
    });

    saveConversations();

    messageInput.value = "";
    displayMessages(conversation);
    displayConversations();
});


/* ========================================
   SEARCH CONVERSATIONS
======================================== */

conversationSearch.addEventListener("input", displayConversations);


/* ========================================
   INITIAL PAGE LOAD
======================================== */

displayConversations();

// Automatically open the first demo conversation.
if (conversations.length > 0) {
    selectedConversationId = conversations[0].id;
    displayConversations();
    openConversation(selectedConversationId);
}
=======
async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !activeSwapId) return;

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
            loadMessages();
        }
    } catch (error) {
        console.error("Error sending message:", error);
    }
}

sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
});

async function loadConversations(activeIdToHighlight) {
    try {
        // FIXED: Added API_BASE_URL formatting and $ to currentUserId
        const response = await fetch(`${API_BASE_URL}/api/swaps?userId=${currentUserId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        const acceptedSwaps = (data.swaps || []).filter(s => s.status === "accepted" || s.status === "completed");
        document.getElementById("chatCount").textContent = `${acceptedSwaps.length} chats`;
        
        conversationList.innerHTML = "";
        
        acceptedSwaps.forEach(swap => {
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
            
            convItem.addEventListener("click", () => {
                openChat(swap._id, otherId, otherName);
            });
            
            conversationList.appendChild(convItem);
        });

    } catch (error) {
        console.error("Error loading sidebar:", error);
    }
}

init();
>>>>>>> origin/member4-communication
