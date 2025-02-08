import { GetServerSideProps } from "next"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../api/auth/[...nextauth]"
import { useSession } from "next-auth/react"
import { useState, useMemo } from "react"
import React from "react" // for React.ReactNode

// Example: Our extended type with AuditLogs or Attendance
import type { User, AuditLog, Attendance } from "@prisma/client"

type UserWithExtras = User & {
  auditLogs?: AuditLog[]
  attendances?: Attendance[]
}

// shadcn/ui components
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

/** 
 * Example function to get the last relevant attendance time.
 */
function getLastAttendanceTime(user: UserWithExtras): Date | null {
  if (!user.attendances || user.attendances.length === 0) return null
  const [latest] = user.attendances
  const checkIn = latest.checkInTime ? new Date(latest.checkInTime) : null
  const checkOut = latest.checkOutTime ? new Date(latest.checkOutTime) : null
  if (checkIn && checkOut) {
    return checkIn > checkOut ? checkIn : checkOut
  }
  return checkOut || checkIn
}

/**
 * We gather three possible times:
 * - user.dateCreated
 * - user.auditLogs[0].datePerformed (recent update)
 * - last attendance time
 */
function getUserActionTimes(user: UserWithExtras) {
  const creation = user.dateCreated ? new Date(user.dateCreated) : null
  const update =
    user.auditLogs && user.auditLogs.length > 0
      ? new Date(user.auditLogs[0].datePerformed)
      : null
  const attendance = getLastAttendanceTime(user)

  return { creation, update, attendance }
}

/**
 * For sorting by "most recent action": find the single most recent time.
 */
function getMostRecentActionTime(user: UserWithExtras) {
  const { creation, update, attendance } = getUserActionTimes(user)
  const c = creation ? creation.getTime() : 0
  const u = update ? update.getTime() : 0
  const a = attendance ? attendance.getTime() : 0
  return Math.max(c, u, a)
}

/**
 * Identify which category is the user's most recent action:
 * "creation", "update", or "attendance".
 */
function getMostRecentActionCategory(user: UserWithExtras) {
  const { creation, update, attendance } = getUserActionTimes(user)
  const times = [
    { label: "creation", time: creation ? creation.getTime() : 0 },
    { label: "update", time: update ? update.getTime() : 0 },
    { label: "attendance", time: attendance ? attendance.getTime() : 0 },
  ]
  return times.reduce((acc, curr) => (curr.time > acc.time ? curr : acc)).label
}

/**
 * Return badges for user actions, each with a unique color.
 */
function UserBadges({ user }: { user: UserWithExtras }): React.ReactNode {
  const { creation, update, attendance } = getUserActionTimes(user)
  const badges: React.ReactNode[] = []

  if (creation) {
    badges.push(
      <Badge
        key="created"
        className="mr-1 bg-red-100 text-red-800 hover:bg-red-200 text-[10px]"
      >
        Created ({creation.toLocaleString()})
      </Badge>
    )
  }
  if (update) {
    badges.push(
      <Badge
        key="updated"
        className="mr-1 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 text-[10px]"
      >
        Updated ({update.toLocaleString()})
      </Badge>
    )
  }
  if (attendance) {
    // Check if it's checkIn or checkOut
    const [latest] = user.attendances || []
    const cIn = latest?.checkInTime ? new Date(latest.checkInTime).getTime() : 0
    const cOut = latest?.checkOutTime ? new Date(latest.checkOutTime).getTime() : 0

    if (attendance.getTime() === cIn) {
      badges.push(
        <Badge
          key="checkIn"
          className="mr-1 bg-green-100 text-green-800 hover:bg-green-200 text-[10px]"
        >
          Check In ({attendance.toLocaleString()})
        </Badge>
      )
    }
    if (attendance.getTime() === cOut) {
      badges.push(
        <Badge
          key="checkOut"
          className="mr-1 bg-purple-100 text-purple-800 hover:bg-purple-200 text-[10px]"
        >
          Check Out ({attendance.toLocaleString()})
        </Badge>
      )
    }
  }

  return <>{badges}</>
}

/** 
 * Mobile-friendly card layout for each user. 
 * Shown only on small screens (below md).
 */
function MobileUserCard({ user }: { user: UserWithExtras }) {
  return (
    <div className="border rounded-md p-3 bg-white shadow-sm mb-4 text-sm">
      <div className="flex flex-col">
        <div className="font-semibold text-base">
          {user.firstName} {user.lastName}
        </div>
        <div className="text-xs text-gray-500">{user.username}</div>
      </div>
      <div className="mt-1 text-xs">
        <span className="font-medium">Dept:</span> {user.department ?? "N/A"}
      </div>
      <div className="text-xs">
        <span className="font-medium">Role:</span> {user.role}
      </div>
      {/* Badges */}
      <div className="mt-2">
        <UserBadges user={user} />
      </div>
      {/* Actions */}
      <div className="flex flex-col mt-2 space-y-2">
        {user.attendances && user.attendances.length > 0 && (
          <Link href={`/hr/attendance`}>
            <Button variant="outline" size="sm" className="text-xs">
              View Attendance
            </Button>
          </Link>
        )}
        <Link href={`/manage/users/user/${user.username}`}>
          <Button variant="outline" size="sm" className="text-xs">
            View Details
          </Button>
        </Link>
      </div>
    </div>
  )
}

/**
 * Desktop table layout for md+ screens.
 */
function DesktopUserTable({ users }: { users: UserWithExtras[] }) {
  return (
    <ScrollArea className="max-h-[420px] text-sm">
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[130px]">Name</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Role</TableHead>
            {/* Renamed from "Badges" to "Updates" */}
            <TableHead>Updates</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6">
                No matching users found.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => {
              return (
                <TableRow key={user.username}>
                  <TableCell>
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.department ?? "N/A"}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <UserBadges user={user} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end sm:flex-row sm:justify-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                      {/* Show "View Attendance" ONLY if user has any attendance records */}
                      {user.attendances && user.attendances.length > 0 && (
                        <Link href={`/hr/attendance`}>
                          <Button variant="outline" size="sm" className="text-xs">
                            View Attendance
                          </Button>
                        </Link>
                      )}
                      <Link href={`/manage/users/user/${user.username}`}>
                        <Button variant="outline" size="sm" className="text-xs">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </ScrollArea>
  )
}

export default function ManageUsers({ users }: { users: UserWithExtras[] }) {
  const { data: session } = useSession()
  const router = useRouter()

  // Protect the page
  if (
    !session ||
    (session.user?.role !== "HR" && session.user?.role !== "ADMIN")
  ) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        <p>Unauthorized. Please login with the correct role.</p>
      </div>
    )
  }

  // States for search or filter
  const [query, setQuery] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("All")
  const [selectedRole, setSelectedRole] = useState("All")

  // Sorting: "recentActivity", "nameAsc", "nameDesc", "recentlyJoined", "oldestJoined"
  const [sortOption, setSortOption] = useState("recentActivity")

  // Toggle to show/hide the filter menu
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 4

  // Refresh button
  const handleRefresh = () => {
    router.replace(router.asPath)
  }

  // Filter logic
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesName =
        u.username.toLowerCase().includes(query.toLowerCase()) ||
        `${u.firstName} ${u.lastName}`
          .toLowerCase()
          .includes(query.toLowerCase())
      const matchesDept =
        selectedDepartment === "All" ||
        (u.department ?? "N/A") === selectedDepartment
      const matchesRole = selectedRole === "All" || u.role === selectedRole
      return matchesName && matchesDept && matchesRole
    })
  }, [users, query, selectedDepartment, selectedRole])

  // Sort logic
  const sortedUsers = useMemo(() => {
    const cloned = [...filteredUsers]
    switch (sortOption) {
      case "nameAsc":
        return cloned.sort((a, b) =>
          `${a.firstName} ${a.lastName}`.localeCompare(
            `${b.firstName} ${b.lastName}`
          )
        )
      case "nameDesc":
        return cloned.sort((a, b) =>
          `${b.firstName} ${b.lastName}`.localeCompare(
            `${a.firstName} ${a.lastName}`
          )
        )
      case "recentlyJoined":
        // user.dateCreated descending
        return cloned.sort((a, b) => {
          const dateA = a.dateCreated ? new Date(a.dateCreated).getTime() : 0
          const dateB = b.dateCreated ? new Date(b.dateCreated).getTime() : 0
          return dateB - dateA
        })
      case "oldestJoined":
        // user.dateCreated ascending
        return cloned.sort((a, b) => {
          const dateA = a.dateCreated ? new Date(a.dateCreated).getTime() : 0
          const dateB = b.dateCreated ? new Date(b.dateCreated).getTime() : 0
          return dateA - dateB
        })
      default:
        // Default: sort by most recent action
        return cloned.sort(
          (a, b) => getMostRecentActionTime(b) - getMostRecentActionTime(a)
        )
    }
  }, [filteredUsers, sortOption])

  // Department + Role lists
  const departments = useMemo(() => {
    const all = users.map((u) => u.department ?? "N/A")
    const unique = Array.from(new Set(all))
    return ["All", ...unique]
  }, [users])

  const roles = ["All", "ADMIN", "HR", "EMPLOYEE"]

  // Pagination slice
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentUsers = sortedUsers.slice(startIndex, startIndex + itemsPerPage)

  // Page nav
  function goToPage(page: number) {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  return (
    <>
      <Head>
        <title>EMS - Manage Users</title>
      </Head>

      <div className="mx-auto w-full max-w-7xl p-4">
        <Card className="w-full shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl md:text-2xl">
                  Manage Employees
                </CardTitle>
                <CardDescription className="text-sm md:text-base">
                  View and manage all employees within the system
                </CardDescription>
                {/* Total number of onboarded employees */}
                <p className="text-xs md:text-sm text-gray-600">
                  Total Onboarded: {users.length}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  Refresh
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => router.push("/add-New-Employee")}
                >
                  Add New Employee
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="mt-1 space-y-4 text-sm">
            {/* Collapsible filter panel */}
            <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
              <div className="flex justify-end">
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm">
                    {filtersOpen ? "Hide Filters" : "Show Filters"}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="mt-2">
                {/* Filter controls  */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-medium text-gray-600">
                      Search
                    </label>
                    <Input
                      className="h-8"
                      placeholder="Search by name or username..."
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value)
                        setCurrentPage(1)
                      }}
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-medium text-gray-600">
                      Department
                    </label>
                    <Select
                      value={selectedDepartment}
                      onValueChange={(value) => {
                        setSelectedDepartment(value)
                        setCurrentPage(1)
                      }}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Filter by Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-medium text-gray-600">
                      Role
                    </label>
                    <Select
                      value={selectedRole}
                      onValueChange={(value) => {
                        setSelectedRole(value)
                        setCurrentPage(1)
                      }}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Filter by Role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-medium text-gray-600">
                      Sort By
                    </label>
                    <Select
                      value={sortOption}
                      onValueChange={(value) => {
                        setSortOption(value)
                        setCurrentPage(1)
                      }}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Sort users..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recentActivity">
                          Most Recent Activity
                        </SelectItem>
                        <SelectItem value="nameAsc">Name (A–Z)</SelectItem>
                        <SelectItem value="nameDesc">Name (Z–A)</SelectItem>
                        <SelectItem value="recentlyJoined">
                          Recently Joined
                        </SelectItem>
                        <SelectItem value="oldestJoined">
                          Oldest Joined
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* 
               Two different layouts:
               1) Mobile-friendly card layout (below md) 
               2) Desktop table layout (md+)
            */}
            <div className="block md:hidden">
              {/* Mobile layout: cards */}
              {currentUsers.length === 0 ? (
                <p className="text-center py-6">No matching users found.</p>
              ) : (
                currentUsers.map((user) => (
                  <MobileUserCard key={user.username} user={user} />
                ))
              )}
            </div>

            <div className="hidden md:block">
              {/* Desktop layout: table */}
              <DesktopUserTable users={currentUsers} />
              {currentUsers.length === 0 && (
                <p className="text-center py-6">No matching users found.</p>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center pt-2">
                <Pagination className="text-xs">
                  <PaginationPrevious
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                    onClick={() => {
                      if (currentPage === 1) return
                      goToPage(currentPage - 1)
                    }}
                  >
                    Previous
                  </PaginationPrevious>
                  <PaginationContent>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (p) => {
                        const isFar = Math.abs(p - currentPage) > 2
                        // Simple approach: show first, last, plus neighbors, else ellipsis
                        if (isFar && p !== 1 && p !== totalPages) {
                          return (
                            <PaginationItem key={`ellipsis-${p}`}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )
                        }
                        return (
                          <PaginationItem key={p}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault()
                                goToPage(p)
                              }}
                              isActive={p === currentPage}
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      }
                    )}
                  </PaginationContent>
                  <PaginationNext
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                    onClick={() => {
                      if (currentPage === totalPages) return
                      goToPage(currentPage + 1)
                    }}
                  >
                    Next
                  </PaginationNext>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (
    !session ||
    (session.user?.role !== "HR" && session.user?.role !== "ADMIN")
  ) {
    return {
      redirect: {
        destination: "/unauthorized",
        permanent: false,
      },
    }
  }

  const users = await prisma.user.findMany({
    include: {
      auditLogs: {
        orderBy: { datePerformed: "desc" },
        take: 1,
      },
      attendances: {
        orderBy: { date: "desc" },
        take: 1,
      },
    },
  })

  return {
    props: {
      users: JSON.parse(JSON.stringify(users)),
    },
  }
}
