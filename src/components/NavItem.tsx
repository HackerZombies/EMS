import { Icon } from "@iconify/react";
import Link from "next/link";
import { useRouter } from "next/router";

type Props = {
  url: string;
  title: string;
  icon: string;
  onClick?: () => void; // Optional onClick prop
  [key: string]: any; // Allow additional props
};

export default function SidebarItem({
  url,
  title,
  icon,
  onClick,
  ...attributes
}: Props) {
  const router = useRouter();

  return (
    <Link
      {...attributes}
      scroll={false}
      href={url}
      onClick={onClick} // Call onClick if provided
      className={`flex items-center gap-1 rounded-full p-2.5 py-1.5 text-lg font-medium transition-all ${
        router.asPath === url
          ? `-translate-y-[2px] scale-[1.04] bg-white bg-opacity-50 drop-shadow-md`
          : "drop-shadow-sm hover:scale-[1.02] hover:bg-white hover:bg-opacity-20 hover:text-[#87ae02]"
      }`}
      aria-label={title} // Add aria-label for accessibility
    >
      <Icon icon={`${icon}-bold`} />
      {title}
    </Link>
  );
}