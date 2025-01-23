// src/components/Notifications.tsx
import { useState, useRef, useEffect } from "react";
import useNotifications from "@/hooks/useNotifications";
import { FaBell } from "react-icons/fa";
import { Transition } from "@headlessui/react";

export default function Notifications() {
  // Destructure values from the hook:
  const { notifications, total, isLoading, isError, markAsRead } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Count of unread notifications
  const unreadCount = notifications.filter((notif) => !notif.isRead).length;

  // Mark all unread notifications as read
  const handleMarkAllAsRead = () => {
    const unreadIds = notifications
      .filter((n) => !n.isRead)
      .map((n) => n.id);
    if (unreadIds.length > 0) {
      markAsRead(unreadIds);
    }
  };

  // Mark a single notification as read
  const handleMarkAsRead = (id: string) => {
    markAsRead([id]);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-gray-600 hover:text-gray-800 focus:outline-none"
        aria-label="Notifications"
      >
        <FaBell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <Transition
        show={isOpen}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-150"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <div className="absolute right-0 z-50 w-80 mt-2 bg-white border border-gray-200 rounded-md shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-blue-600 hover:underline"
              >
                Mark All as Read
              </button>
            )}
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {/* Loading, Error, or Notification List */}
            {isLoading && (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            )}
            {isError && (
              <div className="p-4 text-center text-red-500">
                Failed to load notifications.
              </div>
            )}
            {!isLoading && notifications.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                No notifications.
              </div>
            )}
            {!isLoading && notifications.length > 0 && (
              <ul>
                {notifications.map((notif) => (
                  <li
                    key={notif.id}
                    className={`flex items-start justify-between px-4 py-2 border-b ${
                      notif.isRead ? "bg-gray-50" : "bg-white"
                    }`}
                  >
                    <div>
                      <p className="text-sm text-gray-700">{notif.message}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(notif.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Mark as Read
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* If you want to show total or something else, you can use `total` here */}
          {/* <div className="px-4 py-2 text-sm text-gray-500">
              Total notifications: {total}
          </div> */}
        </div>
      </Transition>
    </div>
  );
}
