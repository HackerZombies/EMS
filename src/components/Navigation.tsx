import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useMediaQuery } from "react-responsive";
import { useState, useMemo } from "react";
import { useRouter } from "next/router";
import NavItem from "./NavItem";
import Link from "next/link";
import Image from "next/image";
import fdmLogo from "../../public/fdm.svg";

// Define types for navigation items
type NavItemType = {
  url: string;
  title: string;
  icon: string;
};

type NavCategoryType = {
  category: string;
  items: NavItemType[];
};

// Define animation variants
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

  // Back button handler
  const handleGoBack = () => {
    router.back();
  };

  // Memoize navigation items with proper typing
  const navItems = useMemo((): NavCategoryType[] => {
    const baseItems: NavCategoryType[] = [
      {
        category: "",
        items: [
          { url: "/", title: "Home", icon: "ph:house" },
          { url: "/announcements", title: "Announcements", icon: "ph:megaphone" },
          { url: "/leave", title: "Leave", icon: "ph:airplane-takeoff" },
          { url: "/documents", title: "Payslip Documents", icon: "ph:file-text" },
          { url: "/hr/submit", title: "Submit Documents", icon: "ph:file-text" },
          { url: "/digilocker", title: "Digilocker", icon: "ph:files" },
          { url: "/help", title: "Help", icon: "ph:chats-circle" },
        ],
      },
    ];

    if (session?.user) {
      const adminItems: NavCategoryType = {
        category: "Admins",
        items: [
          { url: "/manage/users", title: "Manage Users", icon: "ph:address-book" },
          { url: "/manage/tickets", title: "Manage Tickets", icon: "ph:ticket" },
        ],
      };

      const hrItems: NavCategoryType = {
        category: "HR Employees",
        items: [
          { url: "/manage/leave", title: "Manage Leave", icon: "ph:calendar-check" },
          { url: "/manage/documents", title: "Manage Documents", icon: "ph:files" },
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

  // Render nothing if no session
  if (!session?.user) return null;

 // Dynamic theme classes
const navBgClass = "bg-gray-500 bg-opacity-70 backdrop-blur-lg"; // Changed from black to gray
const headerBgClass = "bg-gray-500"; // Changed from black to gray
const categoryTextClass = "text-white font-semibold opacity-100";

  return (
    <AnimatePresence mode="wait">
      {isMobile ? (
        <>
          {/* Overlay for full-screen navigation */}
          {navbarOpen && (
            <motion.div
              className="fixed inset-0 z-10 bg-black bg-opacity-70 backdrop-blur-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNavbarOpen(false)}
            />
          )}
          {/* Top Header for Mobile */}
          {!navbarOpen && (
            <motion.div
              key="menubar"
              initial={{ opacity: 0, y: -30, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -30, filter: "blur(10px)" }}
              transition={{ ease: "easeInOut", duration: 0.2 }}
              className={`fixed z-10 flex w-screen items-center justify-between gap-1 rounded-b-xl ${headerBgClass} p-4 text-2xl drop-shadow-lg`}
            >
              <button onClick={() => setNavbarOpen(true)}>
                <Icon icon="ph:list" />
              </button>
              <Link
                href="/"
                className="flex items-center gap-2 font-semibold"
              >
                <Image
                  src={fdmLogo}
                  alt="FDM"
                  className="mt-[1px] w-14"
                  width={56}
                  height={56}
                />
                EMS
              </Link>
              <Link href="/settings">
                <Icon icon="ph:user" />
              </Link>
            </motion.div>
          )}
          {/* Full Navigation Overlay */}
          {navbarOpen && (
            <motion.div
              key="mobile-navbar"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-50%" }}
              transition={{ type: "tween" }}
              className={`fixed inset-0 z-50 w-full h-full ${navBgClass} transform transition-transform duration-300 ease-in-out`}
            >
              {/* Mobile Navbar Header */}
              <header className={`flex items-center justify-between p-4 ${headerBgClass}`}>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setNavbarOpen(false)}
                    className="p-2 rounded-full hover:bg-opacity-20"
                  >
                    <Icon icon="ph:x" className="text-2xl" />
                  </button>
                  <Image
                    src={fdmLogo}
                    alt="FDM"
                    className="w-12"
                    priority
                    width={48}
                    height={48}
                  />
                  <h1 className="text-xl font-bold text-white">EMS</h1>
                </div>
              </header>
              {/* Navigation Items */}
              <div className="flex flex-col gap-1 p-4 overflow-y-auto h-[calc(100%-100px)]">
                {navItems.map((category) => (
                  <div key={category.category}>
                    {category.category && (
                      <li className={`list-none mt-4 text-sm uppercase ${categoryTextClass}`}>
                        {category.category}
                      </li>
                    )}
                    {category.items.map((item) => (
                      <li key={item.url} className="list-none">
                        <NavItem
                          url={item.url}
                          title={item.title}
                          icon={item.icon}
                          onClick={() => setNavbarOpen(false)}
                          className="text-white"
                        />
                      </li>
                    ))}
                  </div>
                ))}
                {/* User Settings */}
                <div className="mt-auto">
                  <li className="list-none">
                    <NavItem
                      url="/settings"
                      title={`${session.user.firstName} ${session.user.lastName}`}
                      icon="ph:user"
                      onClick={() => setNavbarOpen(false)}
                      className="text-white"
                    />
                  </li>
                </div>
              </div>
            </motion.div>
          )}
        </>
      ) : (
        // Desktop Navigation
        <motion.nav
          key="navbar"
          variants={navVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ ease: "easeInOut", duration: 0.3 }}
          className={`fixed z-20 h-full w-64 py-5 shadow-lg ${navBgClass}`}
        >
          <div className="flex h-full flex-col overflow-y-auto">
            {/* Header */}
            <header className={`flex items-center justify-between gap-2 rounded-b-lg ${headerBgClass} p-5 text-inherit`}>
              <div className="flex items-center gap-2">
                <Image
                  src={fdmLogo}
                  alt="FDM"
                  className="w-16"
                  priority
                  width={64}
                  height={64}
                />
                <h1 className="text-2xl font-bold text-white">EMS</h1>
              </div>
            </header>
            {/* Navigation Items */}
            <div className="flex flex-col gap-1 p-4">
              {navItems.map((category) => (
                <div key={category.category}>
                  {category.category && (
                    <li className={`list-none mt-4 text-sm uppercase ${categoryTextClass}`}>
                      {category.category}
                    </li>
                  )}
                  {category.items.map((item) => (
                    <li key={item.url} className="list-none">
                      <NavItem
                        url={item.url}
                        title={item.title}
                        icon={item.icon}
                        onClick={() => setNavbarOpen(false)}
                        className="text-white"
                      />
                    </li>
                  ))}
                </div>
              ))}
              {/* User Settings */}
              <div className="mt-auto">
                <li className="list-none">
                  <NavItem
                    url="/settings"
                    title={`${session.user.firstName} ${session.user.lastName}`}
                    icon="ph:user"
                    onClick={() => setNavbarOpen(false)}
                    className="text-white"
                  />
                </li>
              </div>
            </div>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}