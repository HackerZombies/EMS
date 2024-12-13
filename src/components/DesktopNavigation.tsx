import { motion } from "framer-motion";
import Image from "next/image";
import NavItem from "./NavItem";
import { NavCategoryType } from "./Navigation";
import fdmLogo from "../../public/fdm.svg";

const navVariants = {
  initial: { opacity: 0, x: -100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -100 },
};

interface DesktopNavigationProps {
  navItems: NavCategoryType[];
  session: any; // Replace 'any' with the correct session type from your auth library
  navBgClass: string;
  headerBgClass: string;
  textClass: string;
  categoryTextClass: string;
}

export default function DesktopNavigation({
  navItems,
  session,
  navBgClass,
  headerBgClass,
  textClass,
  categoryTextClass,
}: DesktopNavigationProps) {
  return (
    <motion.nav
      key="navbar"
      variants={navVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ ease: "easeInOut", duration: 0.3 }}
      className={`fixed z-20 h-full w-64 shadow-lg ${navBgClass}`}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <header className={`flex items-center gap-2 ${headerBgClass} p-4`}>
          <Image src={fdmLogo} alt="FDM" className="w-10 h-10" width={40} height={40} />
          <h1 className={`text-xl font-bold ${textClass}`}>EMS</h1>
        </header>
        {/* Navigation Items */}
        <div className="flex flex-col gap-2 p-4 overflow-y-auto">
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
                  className={textClass}
                />
              ))}
            </div>
          ))}
        </div>
        {/* User Settings */}
        <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700">
          <NavItem
            url="/settings"
            title={`${session.user.firstName} ${session.user.lastName}`}
            icon="ph:user"
            className={textClass}
          />
        </div>
      </div>
    </motion.nav>
  );
}

