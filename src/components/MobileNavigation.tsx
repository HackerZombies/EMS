import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import NavItem from "./NavItem";
import { NavCategoryType } from "./Navigation";
import fdmLogo from "../../public/fdm.svg";

interface MobileNavigationProps {
  navbarOpen: boolean;
  setNavbarOpen: (open: boolean) => void;
  navItems: NavCategoryType[];
  session: any; // Replace 'any' with the correct session type from your auth library
  navBgClass: string;
  headerBgClass: string;
  textClass: string;
  categoryTextClass: string;
}

export default function MobileNavigation({
  navbarOpen,
  setNavbarOpen,
  navItems,
  session,
  navBgClass,
  headerBgClass,
  textClass,
  categoryTextClass,
}: MobileNavigationProps) {
  return (
    <>
      {/* Overlay for full-screen navigation */}
      {navbarOpen && (
        <motion.div
          className="fixed inset-0 z-10 bg-black bg-opacity-50 backdrop-blur-sm"
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
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ ease: "easeInOut", duration: 0.2 }}
          className={`fixed z-20 flex w-full items-center justify-between ${headerBgClass} p-4 shadow-md`}
        >
          <button onClick={() => setNavbarOpen(true)} className={textClass}>
            <Icon icon="ph:list" className="text-2xl" />
          </button>
          <Link href="/" className={`flex items-center gap-2 font-semibold ${textClass}`}>
            <Image src={fdmLogo} alt="FDM" className="w-8 h-8" width={32} height={32} />
            <span>EMS</span>
          </Link>
          <Link href="/settings" className={textClass}>
            <Icon icon="ph:user" className="text-2xl" />
          </Link>
        </motion.div>
      )}
      {/* Full Navigation Overlay */}
      {navbarOpen && (
        <motion.div
          key="mobile-navbar"
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ type: "tween", duration: 0.3 }}
          className={`fixed inset-0 z-30 w-full h-full ${navBgClass} transform transition-transform duration-300 ease-in-out overflow-y-auto`}
        >
          {/* Mobile Navbar Header */}
          <header className={`flex items-center justify-between p-4 ${headerBgClass}`}>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setNavbarOpen(false)}
                className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 ${textClass}`}
              >
                <Icon icon="ph:x" className="text-2xl" />
              </button>
              <Image src={fdmLogo} alt="FDM" className="w-8 h-8" width={32} height={32} />
              <h1 className={`text-xl font-bold ${textClass}`}>EMS</h1>
            </div>
          </header>
          {/* Navigation Items */}
          <div className="flex flex-col gap-2 p-4">
            {navItems.map((category) => (
              <div key={category.category}>
                {category.category && (
                  <h2 className={`mt-4 text-sm uppercase ${categoryTextClass}`}>
                    {category.category}
                  </h2>
                )}
                {category.items.map((item) => (
                  <NavItem
                    key={item.url}
                    url={item.url}
                    title={item.title}
                    icon={item.icon}
                    onClick={() => setNavbarOpen(false)}
                    className={textClass}
                  />
                ))}
              </div>
            ))}
          </div>
          {/* User Settings */}
          <div className="mt-auto p-4">
            <NavItem
              url="/settings"
              title={`${session.user.firstName} ${session.user.lastName}`}
              icon="ph:user"
              onClick={() => setNavbarOpen(false)}
              className={textClass}
            />
          </div>
        </motion.div>
      )}
    </>
  );
}

