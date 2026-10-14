
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
    });

    chatMessages.scrollTop = chatMessages.scrollHeight;
}


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