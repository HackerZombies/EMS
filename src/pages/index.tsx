"use client"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import NotificationCard from "@/components/cards/NotificationCard"
import AnnouncementCard from "@/components/cards/AnnouncementCard"
import AttendanceCard from "@/components/cards/AttendanceCard"
import EmployeeAttendanceCard from "@/components/cards/EmployeeAttendanceCard"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
}

export default function Dashboard() {
  const { data: session } = useSession()

  if (!session) {
    return <div>Loading...</div>
  }

  return (
    <motion.div className="p-4" variants={containerVariants} initial="hidden" animate="visible">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* First Row: Notification & Announcement side by side */}
        <motion.div
          className="sm:col-span-1 lg:col-span-2 mt-6"
          variants={itemVariants}
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        >
          <NotificationCard />
        </motion.div>
        <motion.div
          className="sm:col-span-1 lg:col-span-2"
          variants={itemVariants}
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        >
          <AnnouncementCard />
        </motion.div>

        {/* Second Row: Attendance spanning full width */}
        <motion.div
          className="sm:col-span-2 lg:col-span-4"
          variants={itemVariants}
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        >
          {session.user.role === "EMPLOYEE" ? <EmployeeAttendanceCard /> : <AttendanceCard />}
        </motion.div>
      </div>
    </motion.div>
  )
}

