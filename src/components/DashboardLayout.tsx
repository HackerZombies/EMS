import { useSession, signOut } from "next-auth/react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useMediaQuery } from "react-responsive";
import Breadcrumbs from "@/components/Breadcrumbs"; // Import the Breadcrumbs component
import Image from "next/image";

async function fetchAvatarImage(): Promise<string> {
  const response = await fetch("/api/users/user/avatar");
  if (!response.ok) throw new Error("Failed to fetch avatar image");
  const data = await response.json();
  return data.avatarImageUrl;
}

type NavItemType = {
  url: string;
  title: string;
  icon: string;
};

type NavCategoryType = {
  category: string;
  items: NavItemType[];
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession(); // Include status for loading check
  const router = useRouter();

  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const [navbarOpen, setNavbarOpen] = useState(false);
  const [avatarImage, setAvatarImage] = useState<string>("/default-avatar.png");

  const sidebarRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    async function loadAvatar() {
      try {
        const imageUrl = await fetchAvatarImage();
        setAvatarImage(imageUrl);
      } catch (error) {
        console.error("Error fetching avatar image:", error);
      }
    }
    loadAvatar();
  }, []);

  // Sign out
  const handleSignOut = useCallback(async () => {
    const data = await signOut({ redirect: false, callbackUrl: "/" });
    router.push(data.url);
  }, [router]);

  // Role-based nav items
  const navItems = useMemo<NavCategoryType[]>(() => {
    if (!session?.user) return [];

    const baseItems: NavCategoryType[] = [
      {
        category: "General",
        items: [
          { url: "/", title: "Home", icon: "ph:house" },
          { url: "/announcements", title: "Alerts", icon: "ph:megaphone" },
          { url: "/leave", title: "Leave", icon: "ph:airplane-takeoff" },
          { url: "/documents", title: "Get Payslips", icon: "ph:file-text" },
          { url: "/hr/submit", title: "HR Verification", icon: "ph:file-text" },
          { url: "/digilocker", title: "Digilocker", icon: "ph:files" },
          { url: "/help", title: "Tickets", icon: "ph:chats-circle" },
          { url: "/attendance", title: "Attendance", icon: "ph:calendar-check" },
        ],
      },
    ];

    if (session?.user.role === "HR") {
      baseItems.push({
        category: "HR Employees",
        items: [
          { url: "/add-New-Employee", title: "Add Employees", icon: "ph:address-book" },
          { url: "/manage/users", title: "Manage Employees", icon: "ph:address-book" },
          { url: "/hr/attendance", title: "Manage Attendance", icon: "ph:calendar-check" },
          { url: "/manage/tickets", title: "Resolve Tickets", icon: "ph:ticket" },
          { url: "/hr/documents", title: "Approve Documents", icon: "ph:files-duotone" },
          { url: "/manage/documents", title: "Upload Documents", icon: "ph:upload-simple" },
          
        ],
      });
    }

    return baseItems;
  }, [session]);

  // Collapse categories
  const [categoryCollapsed, setCategoryCollapsed] = useState<{ [k: string]: boolean }>({});

  const toggleCategory = useCallback((categoryName: string) => {
    setCategoryCollapsed((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  }, []);

  // Close sidebar if user clicks outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        navbarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target as Node) &&
        toggleButtonRef.current &&
        !toggleButtonRef.current.contains(e.target as Node)
      ) {
        setNavbarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [navbarOpen]);

  if (status === "loading") {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!session?.user) {
    return <>{children}</>;
  }

  const firstName = session.user.firstName?.split(" ")[0] || "User";

  return (
    <div className="flex min-h-screen">
      {isMobile && navbarOpen && (
        <div
          onClick={() => setNavbarOpen(false)}
          className="fixed top-0 left-0 w-full h-full bg-black/50 z-30 backdrop-blur-sm"
        ></div>
      )}

      <header
        className={`fixed top-0 left-0 w-full z-50
          flex items-center justify-between
          py-4 px-6
          backdrop-blur-md backdrop-saturate-150
          bg-white/20 dark:bg-black/20
          border-none
          shadow-md
          rounded-b-lg
        `}
      >
        <div className="flex items-center space-x-4">
          {/* Breadcrumbs on larger screens */}
          <div className="hidden sm:block">
            <Breadcrumbs />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Display user role */}
          <span className="px-2 py-1 bg-white/10 rounded-md text-xs text-white uppercase tracking-wide">
            {session.user.role}
          </span>

          {/* Settings Button */}
          <Link
            href="/settings"
            className="hidden sm:flex items-center px-2 py-1 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
          >
            <Icon icon="ph:gear" className="w-5 h-5 mr-1" />
            <span className="text-sm">Settings</span>
          </Link>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="hidden sm:flex items-center px-2 py-1 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
          >
            <Icon icon="ph:sign-out" className="w-5 h-5 mr-1" />
            <span className="text-sm">Sign Out</span>
          </button>

          {/* Toggle sidebar button for mobile */}
          {isMobile && (
            <button
              ref={toggleButtonRef}
              type="button"
              onClick={() => setNavbarOpen(!navbarOpen)}
              className="inline-flex items-center p-2 text-gray-200
                         hover:bg-white/20 rounded-md transition-all
                         sm:hidden"
              aria-controls="sidebar-navigation"
              aria-expanded={navbarOpen}
              aria-label={navbarOpen ? "Close sidebar" : "Open sidebar"}
            >
              <Icon icon="ph:list" className="w-6 h-6" />
              <span className="sr-only">{navbarOpen ? "Close sidebar" : "Open sidebar"}</span>
            </button>
          )}
        </div>
      </header>

      <aside
        ref={sidebarRef}
        id="sidebar-navigation"
        className={`fixed top-0 left-0 z-40 w-64 h-screen pt-[4rem]
          backdrop-blur-md backdrop-saturate-150
          bg-white/20 dark:bg-black/20
          border-none
          shadow-md
          rounded-r-lg
          transition-transform
          ${navbarOpen ? "translate-x-0" : "-translate-x-full"}
          sm:translate-x-0
        `}
      >
        <div className="h-full overflow-y-auto px-3 pb-4 text-white">
          <ul className="pt-2 space-y-2">
            {navItems.map((category) => {
              const isCollapsed = categoryCollapsed[category.category] || false;
              return (
                <li key={category.category}>
                  <button
                    onClick={() => toggleCategory(category.category)}
                    className="flex items-center justify-between w-full p-2
                      cursor-pointer rounded-lg
                      hover:bg-white/10
                      transition-colors
                    "
                    aria-expanded={!isCollapsed}
                  >
                    <span className="font-medium capitalize">
                      {category.category}
                    </span>
                    <Icon
                      icon={isCollapsed ? "ph:caret-down" : "ph:caret-up"}
                      className="w-5 h-5"
                    />
                  </button>
                  <ul className={`${isCollapsed ? "hidden" : "block"} ml-2`}>
                    {category.items.map((item) => (
                      <li key={item.url}>
                        <Link
                          href={item.url}
                          className={`
                            flex items-center p-2 text-sm
                            rounded-lg hover:bg-white/10
                            transition-colors
                            ${
                              router.pathname === item.url
                                ? "bg-white/10 font-semibold"
                                : ""
                            }
                          `}
                        >
                          <Icon icon={item.icon} className="w-4 h-4 mr-2" />
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </div>
        {/* Removed bottom sign out and settings buttons */}
      </aside>

      <main className="flex-1 p-4 sm:pl-64 min-h-screen pt-16">
        <div className="mt-4">
          {children}
        </div>
      </main>
    </div>
  );
}
