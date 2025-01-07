// src/components/icons.tsx
import * as React from "react"
import {
  LucideProps,
  Home,
  Check,
  Megaphone,
  Plane,
  File,
  FileCheck,
  Folder,
  MessageCircle,
  Users,
  Ticket,
  Calendar,
  CalendarCheck,
  Upload,
  Menu,
} from "lucide-react"

// Define the type for Icons
type IconType = React.FC<LucideProps> | React.FC<React.SVGProps<SVGSVGElement>>

export const Icons: Record<string, IconType> = {
  home: Home,
  check: Check,
  megaphone: Megaphone,
  plane: Plane,
  file: File,
  fileCheck: FileCheck,
  folder: Folder,
  messageCircle: MessageCircle,
  users: Users,
  ticket: Ticket,
  calendar: Calendar,
  calendarCheck: CalendarCheck,
  upload: Upload,
  menu: Menu,
  // Add the logo component
  logo: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="currentColor"
      {...props}
    >
      {/* Replace this with your actual logo SVG path */}
      <circle cx="50" cy="50" r="50" />
      <text
        x="50%"
        y="55%"
        textAnchor="middle"
        fill="#fff"
        fontSize="50px"
        dy=".3em"
      >
        EMS
      </text>
    </svg>
  ),
}
