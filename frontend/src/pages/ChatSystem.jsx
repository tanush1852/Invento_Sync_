import React, { useState, useEffect, useRef } from "react";
import { db, auth } from "../../service/fireBaseConfig";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import {
  FiSend,
  FiPlus,
  FiSearch,
  FiMoreVertical,
  FiPaperclip,
  FiSmile,
} from "react-icons/fi";

function ChatSystem() {
  // State management
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // References
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  // Fetch current user's email on component mount
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUserEmail(user.email);
        // Fetch chats when user is authenticated
        fetchChats(user.email);
        // Listen for notifications
        listenForNotifications(user.email);
      }
    });

    return () => unsubscribe();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus on input when active chat changes
  useEffect(() => {
    if (activeChat) {
      messageInputRef.current?.focus();
    }
  }, [activeChat]);

  /**
   * Scrolls the message container to the bottom
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  /**
   * Fetches all chats where current user is a participant
   * @param {string} userEmail - The current user's email
   */
  const fetchChats = async (userEmail) => {
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", userEmail)
    );

    onSnapshot(q, (querySnapshot) => {
      const chatsList = [];
      querySnapshot.forEach((doc) => {
        chatsList.push({ id: doc.id, ...doc.data() });
      });
      setChats(chatsList);
    });
  };

  /**
   * Sets up a listener for new message notifications
   * @param {string} userEmail - The current user's email
   */
  const listenForNotifications = (userEmail) => {
    const userDocRef = doc(db, "notifications", userEmail);

    onSnapshot(userDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setNotifications(data.unreadMessages || []);
      }
    });
  };

  /**
   * Marks notifications for a specific chat as read
   * @param {string} chatId - The ID of the chat
   */
  const markAsRead = async (chatId) => {
    if (!currentUserEmail) return;

    const notificationsRef = doc(db, "notifications", currentUserEmail);

    // Get current notifications
    const docSnap = await getDoc(notificationsRef);

    if (docSnap.exists()) {
      const currentNotifications = docSnap.data().unreadMessages || [];
      const updatedNotifications = currentNotifications.filter(
        (notification) => notification.chatId !== chatId
      );

      // Update notifications
      await updateDoc(notificationsRef, {
        unreadMessages: updatedNotifications,
      });
    }
  };

  /**
   * Starts a new chat or opens an existing one
   */
  const startChat = async () => {
    if (!recipientEmail.trim() || recipientEmail === currentUserEmail) return;

    // Check if chat already exists
    const existingChat = chats.find(
      (chat) =>
        chat.participants.includes(recipientEmail) &&
        chat.participants.length === 2
    );

    if (existingChat) {
      setActiveChat(existingChat.id);
      loadMessages(existingChat.id);
      markAsRead(existingChat.id);
      setRecipientEmail("");
      setIsNewChatModalOpen(false);
      return;
    }

    // Create new chat
    try {
      const chatRef = await addDoc(collection(db, "chats"), {
        participants: [currentUserEmail, recipientEmail],
        createdAt: serverTimestamp(),
        lastMessage: null,
        lastMessageTime: serverTimestamp(),
      });

      setActiveChat(chatRef.id);
      loadMessages(chatRef.id);
      setRecipientEmail("");
      setIsNewChatModalOpen(false);
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  };

  /**
   * Loads messages for a specific chat
   * @param {string} chatId - The ID of the chat
   * @returns {function} Unsubscribe function
   */
  const loadMessages = (chatId) => {
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messagesList = [];
      querySnapshot.forEach((doc) => {
        messagesList.push({ id: doc.id, ...doc.data() });
      });
      setMessages(messagesList);
      markAsRead(chatId);
    });

    return unsubscribe;
  };

  /**
   * Opens an existing chat
   * @param {string} chatId - The ID of the chat to open
   */
  const openChat = (chatId) => {
    setActiveChat(chatId);
    loadMessages(chatId);
    markAsRead(chatId);
  };

  /**
   * Sends a message in the active chat
   */
  const sendMessage = async () => {
    if (!message.trim() || !activeChat) return;

    try {
      // Store message text before clearing
      const messageText = message;

      // Clear message input immediately for better UX
      setMessage("");

      // Add message to chat
      await addDoc(collection(db, "chats", activeChat, "messages"), {
        text: messageText,
        sender: currentUserEmail,
        timestamp: serverTimestamp(),
      });

      // Update last message in chat document
      await updateDoc(doc(db, "chats", activeChat), {
        lastMessage: messageText,
        lastMessageTime: serverTimestamp(),
      });

      // Get chat participants
      const chatDoc = await getDoc(doc(db, "chats", activeChat));
      const recipients = chatDoc
        .data()
        .participants.filter((participant) => participant !== currentUserEmail);

      // Create notifications for all other participants
      for (const recipient of recipients) {
        const notificationRef = doc(db, "notifications", recipient);
        const notificationDoc = await getDoc(notificationRef);

        if (notificationDoc.exists()) {
          await updateDoc(notificationRef, {
            unreadMessages: arrayUnion({
              chatId: activeChat,
              sender: currentUserEmail,
              message: messageText,
              timestamp: new Date().toISOString(),
            }),
          });
        } else {
          await updateDoc(
            notificationRef,
            {
              unreadMessages: [
                {
                  chatId: activeChat,
                  sender: currentUserEmail,
                  message: messageText,
                  timestamp: new Date().toISOString(),
                },
              ],
            },
            { merge: true }
          );
        }
      }

      // Focus back on input after sending
      messageInputRef.current?.focus();
    } catch (error) {
      console.error("Error sending message:", error);
      // Optionally show error to user
    }
  };

  // Filter chats based on search query
  const filteredChats = chats.filter((chat) => {
    const otherParticipant =
      chat.participants.find((p) => p !== currentUserEmail) || "";
    return otherParticipant.toLowerCase().includes(searchQuery.toLowerCase());
  });

  /**
   * Gets the notification count for a specific chat
   * @param {string} chatId - The ID of the chat
   * @returns {number} The number of notifications
   */
  const getNotificationCount = (chatId) => {
    return notifications.filter((n) => n.chatId === chatId).length;
  };

  /**
   * Gets the total notification count across all chats
   * @returns {number} The total number of notifications
   */
  const getTotalNotificationCount = () => {
    return notifications.length;
  };

  /**
   * Formats the timestamp for messages
   * @param {object} timestamp - Firestore timestamp
   * @returns {string} Formatted time string
   */
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  /**
   * Formats the last message time for chat list
   * @param {object} timestamp - Firestore timestamp
   * @returns {string} Formatted time or date string
   */
  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    const now = new Date();

    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // If this week, show day name
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    }

    // Otherwise show date
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="flex h-screen bg-[#f0f2f5]">
      {/* WhatsApp-style sidebar */}
      <div className="w-[380px] flex flex-col border-r border-[#e9edef] bg-white">
        {/* Sidebar header */}
        <div className="flex justify-between items-center p-3 bg-[#f0f2f5]">
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
            {currentUserEmail && currentUserEmail[0]?.toUpperCase()}
          </div>

          <div className="flex items-center space-x-3 text-[#54656f]">
            <button
              onClick={() => setIsNewChatModalOpen(true)}
              className="p-2 rounded-full hover:bg-gray-200"
            >
              <FiPlus size={20} />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-200">
              <FiMoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="p-2">
          <div className="bg-[#f0f2f5] rounded-lg flex items-center px-3 py-1">
            <FiSearch className="text-[#54656f] mr-3" />
            <input
              type="text"
              placeholder="Search or start new chat"
              className="bg-transparent border-none outline-none w-full py-1 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.map((chat) => {
            const otherParticipant = chat.participants.find(
              (p) => p !== currentUserEmail
            );
            const notificationCount = getNotificationCount(chat.id);

            return (
              <div
                key={chat.id}
                className={`flex items-center p-4 mx-2 my-1 rounded-lg cursor-pointer hover:bg-[#f5f6f6] transition-colors ${
                  activeChat === chat.id ? "bg-[#f0f2f5]" : ""
                }`}
                onClick={() => openChat(chat.id)}
              >
                {/* Profile picture */}
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-bold mr-3">
                  {otherParticipant && otherParticipant[0]?.toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-[#111b21] truncate">
                      {otherParticipant}
                    </h3>
                    <span className="text-xs text-[#667781]">
                      {chat.lastMessageTime &&
                        formatLastMessageTime(chat.lastMessageTime)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-sm text-[#667781] truncate">
                      {chat.lastMessage || "Start a conversation"}
                    </p>

                    {notificationCount > 0 && (
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#25d366] text-white text-xs flex items-center justify-center ml-2">
                        {notificationCount}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {activeChat ? (
          <>
            {/* Chat header */}
            <div className="flex justify-between items-center px-4 py-2 bg-[#f0f2f5] border-b border-[#e9edef]">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-bold mr-3">
                  {chats
                    .find((c) => c.id === activeChat)
                    ?.participants.find((p) => p !== currentUserEmail)?.[0]
                    ?.toUpperCase()}
                </div>
                <div>
                  <h2 className="font-medium">
                    {chats
                      .find((c) => c.id === activeChat)
                      ?.participants.find((p) => p !== currentUserEmail)}
                  </h2>
                  <p className="text-xs text-[#667781]">
                    {messages.length > 0 ? "online" : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-[#54656f]">
                <button className="p-2 rounded-full hover:bg-gray-200">
                  <FiSearch size={20} />
                </button>
                <button className="p-2 rounded-full hover:bg-gray-200">
                  <FiMoreVertical size={20} />
                </button>
              </div>
            </div>
            {/* Messages area with WhatsApp-style background */}
            <div
              className="flex-1 px-6 py-4 overflow-y-auto"
              style={{
                backgroundImage:
                  "url('https://www.flaticon.com/free-icon/message_4140386')",
                backgroundRepeat: "repeat",
                backgroundSize: "contain",
              }}
            >
              {messages.map((msg) => {
                const isCurrentUser = msg.sender === currentUserEmail;

                return (
                  <div
                    key={msg.id}
                    className={`mb-3 flex ${
                      isCurrentUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`inline-block max-w-[65%] ${
                        isCurrentUser ? "ml-auto" : "mr-auto"
                      }`}
                    >
                      <div
                        className={`rounded-2xl px-3 py-2 ${
                          isCurrentUser
                            ? "bg-[#d9fdd3] rounded-tr-sm"
                            : "bg-white rounded-tl-sm"
                        }`}
                      >
                        <p className="text-sm text-[#111b21] break-words">
                          {msg.text}
                        </p>
                        <div className="flex justify-end items-center mt-1">
                          <p className="text-[10px] text-[#667781]">
                            {msg.timestamp && formatMessageTime(msg.timestamp)}
                            {isCurrentUser && (
                              <span className="ml-1 text-[#53bdeb]">✓✓</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            {/* Message input */}
            <div className="bg-[#f0f2f5] px-4 py-2 flex items-center">
              <button className="p-2 text-[#54656f] rounded-full hover:bg-gray-200 mr-1">
                <FiSmile size={22} />
              </button>
              <button className="p-2 text-[#54656f] rounded-full hover:bg-gray-200 mr-2">
                <FiPaperclip size={22} />
              </button>

              <div className="flex-1 bg-white rounded-lg px-3 py-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message"
                  className="w-full outline-none text-sm"
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  ref={messageInputRef}
                />
              </div>

              <button
                onClick={sendMessage}
                disabled={!message.trim()}
                className={`p-2 ml-2 rounded-full ${
                  message.trim() ? "bg-[#00a884] text-white" : "text-[#8696a0]"
                }`}
              >
                <FiSend size={22} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#f0f2f5]">
            <div className="bg-white rounded-full w-40 h-40 flex items-center justify-center mb-6">
              <img
                src="/message.png"
                alt="Chat Icon"
                className="w-32 h-32 object-contain opacity-70"
                onError={(e) => {
                  // Fallback if image doesn't load
                  e.target.onerror = null;
                  e.target.style.display = "none";
                  const parent = e.target.parentNode;
                  const icon = document.createElement("div");
                  icon.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-24 h-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  `;
                  parent.appendChild(icon.firstChild);
                }}
              />
            </div>
            <h1 className="text-3xl font-light text-[#41525d] mb-2">
              Chat System
            </h1>
            <p className="text-sm text-[#667781] text-center max-w-md">
              Select a chat or start a new conversation to begin messaging
            </p>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-96 p-4">
            <h3 className="text-lg font-medium mb-4">New Chat</h3>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="Enter recipient email"
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsNewChatModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={startChat}
                className="px-4 py-2 bg-[#00a884] text-white rounded"
              >
                Start Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification badge for mobile */}
      {getTotalNotificationCount() > 0 && (
        <div className="fixed bottom-4 right-4 md:hidden bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
          {getTotalNotificationCount()}
        </div>
      )}
    </div>
  );
}

export default ChatSystem;
