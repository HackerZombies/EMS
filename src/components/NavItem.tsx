import Link from "next/link";
import { Icon } from "@iconify/react";
import { useRouter } from "next/router";

interface NavItemProps {
  url: string;
  title: string;
  icon: string;
  onClick?: () => void;
  className?: string;
}

export default function NavItem({ url, title, icon, onClick, className = "" }: NavItemProps) {
  const router = useRouter();
  const isActive = router.pathname === url;

  return (
    <Link
      href={url}
      className={`flex items-center gap-3 rounded-lg p-2 transition-colors duration-200 ${
        isActive
          ? "bg-gray-200 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
          : "hover:bg-gray-100 dark:hover:bg-gray-700"
      } ${className}`}
      onClick={onClick}
    >
      <Icon icon={icon} className="text-xl" />
      <span>{title}</span>
    </Link>
  );
}

