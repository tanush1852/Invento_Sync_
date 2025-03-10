import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { auth } from "../../service/fireBaseConfig";
import { db } from "../../service/fireBaseConfig";
import { doc, onSnapshot } from "firebase/firestore";

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [unreadMessages, setUnreadMessages] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        setDisplayName(
          user.displayName || user.email.split("@")[0].replace(/[0-9]/g, "")
        );

        // Set up notification listener when user is logged in
        const userNotificationsRef = doc(db, "notifications", user.email);
        const notificationUnsubscribe = onSnapshot(
          userNotificationsRef,
          (docSnapshot) => {
            if (docSnapshot.exists()) {
              const data = docSnapshot.data();
              const notifications = data.unreadMessages || [];
              setUnreadMessages(notifications.length);
            } else {
              setUnreadMessages(0);
            }
          }
        );

        return () => {
          notificationUnsubscribe();
        };
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUnreadMessages(0); // Reset notifications count on logout
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo with link to home */}
          <Link to="/" className="flex-shrink-0">
            <span className="text-2xl font-bold text-indigo-800 hover:text-indigo-600 transition flex items-center">
              <img src="/logo.png" alt="Logo" className="w-10 h-10" />
              <span className="ml-2">InventoSync</span>
            </span>
          </Link>

          {/* Navigation Links - Better spacing */}
          <div className="hidden md:flex items-center justify-center flex-1 mx-2">
            <div className="flex items-center justify-between space-x-4">
              <Link
                to="/marketplace"
                className={`relative px-3 py-2 transition-all duration-200 ${
                  isActive("/marketplace")
                    ? "text-white font-semibold bg-blue-600 rounded-3xl"
                    : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                }`}
              >
                Marketplace
              </Link>

              <Link
                to="/suggestions"
                className={`relative px-3 py-2 transition-all duration-200 ${
                  isActive("/suggestions")
                    ? "text-white font-semibold rounded-3xl bg-blue-600 "
                    : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                }`}
              >
                Suggestions
              </Link>

              <Link
                to="/maps"
                className={`relative px-3 py-2 transition-all duration-200 ${
                  isActive("/maps")
                    ? "text-white font-semibold bg-blue-600 rounded-3xl"
                    : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                }`}
              >
                Maps
              </Link>
              
              <Link
                to="/warehouse"
                className={`relative px-3 py-2 transition-all duration-200 ${
                  isActive("/warehouse")
                    ? "text-white font-semibold bg-blue-600 rounded-3xl"
                    : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                }`}
              >
                Warehouses
              </Link>
              <Link
                to="/warehouse_test"
                className={`relative px-3 py-2 transition-all duration-200 ${
                  isActive("/warehouse_test")
                    ? "text-white font-semibold bg-blue-600 rounded-3xl"
                    : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                }`}
              >
                Store
              </Link>

              <Link
                to="/buyproduct"
                className={`relative px-3 py-2 transition-all duration-200 ${
                  isActive("/buyproduct")
                    ? "text-white font-semibold bg-blue-600 rounded-3xl"
                    : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                }`}
              >
                Inventory
              </Link>

              <Link
                to="/chat"
                className={`relative px-3 py-2 transition-all duration-200 ${
                  isActive("/chat")
                    ? "text-white font-semibold bg-blue-600 rounded-3xl"
                    : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                }`}
              >
                Chat
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </Link>

              {user && (
                <Link
                  to="/dashboard"
                  className={`relative px-3 py-2 transition-all duration-200 ${
                    isActive("/dashboard")
                      ? "text-white font-semibold bg-blue-600 rounded-3xl"
                      : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>

          {/* Auth Buttons and Profile */}
          <div className="hidden md:flex items-center">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 py-2 px-3  rounded-lg ">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover border-2 "
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {displayName[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-semibold text-blue-600 capitalize">
                    {displayName}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition shadow-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className={`px-4 py-2 rounded-md transition ${
                    isActive("/login")
                      ? "bg-blue-50 text-blue-600 font-semibold"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className={`px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition shadow-sm  ${
                    isActive("/signup") ? "bg-indigo-700" : ""
                  }`}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;