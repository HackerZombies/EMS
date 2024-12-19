import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useMediaQuery } from "react-responsive";
import { useState, useMemo } from "react";
import { useRouter } from "next/router";
import MobileNavigation from "./MobileNavigation";
import DesktopNavigation from "./DesktopNavigation";

// Types
export type NavItemType = {
  url: string;
  title: string;
  icon: string;
};

export type NavCategoryType = {
  category: string;
  items: NavItemType[];
};

// Animation variants
const navVariants = {
  initial: { opacity: 0, x: -100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -100 },
};

export default function Navigation() {
  const router = useRouter();
  const { data: session } = useSession();
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const [navbarOpen, setNavbarOpen] = useState(false);

  // Memoized navigation items
  const navItems = useMemo((): NavCategoryType[] => {
    const baseItems: NavCategoryType[] = [
      {
        category: "",
        items: [
          { url: "/", title: "Home", icon: "ph:house" },
          { url: "/announcements", title: "Announcements", icon: "ph:megaphone" },
          { url: "/leave", title: "Leave", icon: "ph:airplane-takeoff" },
          { url: "/documents", title: "Get Payslips", icon: "ph:file-text" },
          { url: "/hr/submit", title: "HR Verification", icon: "ph:file-text" },
          { url: "/digilocker", title: "Digilocker", icon: "ph:files" },
          { url: "/help", title: "Tickets", icon: "ph:chats-circle" },
        ],
      },
    ];

    if (session?.user) {
      const adminItems: NavCategoryType = {
        category: "Admins",
        items: [
          { url: "/manage/users", title: "Manage Employees", icon: "ph:address-book" },
          { url: "/manage/tickets", title: "Resolve Tickets", icon: "ph:ticket" },
        ],
      };

      const hrItems: NavCategoryType = {
        category: "HR Employees",
        items: [
          { url: "/manage/leave", title: "Manage Leave", icon: "ph:calendar-check" },
          { url: "/manage/documents", title: "Upload Payslips", icon: "ph:files" },
          { url: "/hr/documents", title: "Approve Documents", icon: "ph:files" },
        ],
      };

      if (session.user.role === "HR" || session.user.role === "TECHNICIAN") {
        baseItems.push(adminItems);
      }

      if (session.user.role === "HR") {
        baseItems.push(hrItems);
      }
    }

    return baseItems;
  }, [session]);

  if (!session?.user) return null;

  // Updated theme classes
  const navBgClass = "bg-white dark:bg-gray-800";
  const headerBgClass = "bg-gray-100 dark:bg-gray-700";
  const textClass = "text-gray-800 dark:text-white";
  const categoryTextClass = "text-gray-500 dark:text-gray-400 font-semibold";

  return (
    <AnimatePresence mode="wait">
      {isMobile ? (
        <MobileNavigation
          navbarOpen={navbarOpen}
          setNavbarOpen={setNavbarOpen}
          navItems={navItems}
          session={session}
          navBgClass={navBgClass}
          headerBgClass={headerBgClass}
          textClass={textClass}
          categoryTextClass={categoryTextClass}
        />
      ) : (
        <DesktopNavigation
          navItems={navItems}
          session={session}
          navBgClass={navBgClass}
          headerBgClass={headerBgClass}
          textClass={textClass}
          categoryTextClass={categoryTextClass}
        />
      )}
    </AnimatePresence>
  );
}

