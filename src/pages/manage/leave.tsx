"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/router"
import type { LeaveRequest } from "@prisma/client"
import { motion } from "framer-motion"
import { Plane, FilterIcon as Funnel, Search } from "lucide-react"
import Head from "next/head"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

// Pagination components
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"

import { ManageLeaveCard } from "@/components/ManageLeaveCards"

// -------------------
// Types
// -------------------
type UserData = {
  username: string
  firstName: string
  middleName?: string | null
  lastName: string
  email: string
  phoneNumber: string
  department?: string | null
  position?: string | null
  profileImageUrl?: string | null
  avatarImageUrl?: string | null
  nationality?: string | null
  gender?: string | null
  maritalStatus?: string | null
  dob?: Date | null
  // ... any additional fields
}

type LeaveRequestWithUser = LeaveRequest & {
  user: UserData
}

// -------------------
// Helper Function
// -------------------
const getProfileImageUrl = (url?: string | null) => {
  if (url && url.includes("cloudinary")) {
    const parts = url.split("/upload/")
    if (parts.length === 2) {
      // Insert transformation parameters after "/upload/"
      const transformation = "w_128,h_128,c_fill,r_max"
      return `${parts[0]}/upload/${transformation}/${parts[1]}`
    }
    return url
  }
  return url || "/default-avatar.png"
}

// -------------------
// Main Page Component
// -------------------
export default function LeaveManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Data States
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestWithUser[]>([])
  const [filter, setFilter] = useState("Pending")

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize] = useState<number>(5)

  // Search State
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Dialog States for Status Update and User Info
  const [dialogOpen, setDialogOpen] = useState<boolean>(false)
  const [dialogMessage, setDialogMessage] = useState<React.ReactNode>(null)
  const [userInfoOpen, setUserInfoOpen] = useState<boolean>(false)
  const [selectedUserData, setSelectedUserData] = useState<UserData | null>(null)

  // Protect route for HR role
  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user?.role !== "HR") {
      router.push("/leave")
    }
  }, [session, status, router])

  // Fetch leave requests
  useEffect(() => {
    const fetchAllLeaveRequests = async () => {
      try {
        const response = await fetch(`/api/leaveRequests`)
        if (!response.ok) {
          throw new Error("Failed to fetch leave requests")
        }
        const data: LeaveRequestWithUser[] = await response.json()

        if (session?.user?.username) {
          // Exclude the current user's own requests
          const filteredData = data.filter(
            (request) => request.userUsername !== session.user.username
          )

          // Sort by status priority, then by startDate
          const sortedData = filteredData.sort((a, b) => {
            const statusPriority: Record<string, number> = { Pending: 1, Accepted: 2, Declined: 3 }
            const priorityA = statusPriority[a.requestStatus] || 99
            const priorityB = statusPriority[b.requestStatus] || 99

            if (priorityA !== priorityB) return priorityA - priorityB

            const dateA = new Date(a.startDate)
            const dateB = new Date(b.startDate)
            return dateA.getTime() - dateB.getTime()
          })

          setLeaveRequests(sortedData)
        } else {
          setLeaveRequests(data)
        }
      } catch (error) {
        console.error("Error fetching leave requests:", error)
      }
    }

    fetchAllLeaveRequests()
  }, [session])

  // Update leave request status
  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/leaveRequests/updateleavestatus?id=${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestStatus: newStatus }),
      })
      if (!response.ok) {
        throw new Error("Failed to update leave request status")
      }

      // Update local state
      const updatedLeaveRequests = leaveRequests.map((request) => {
        if (request.id === id) {
          return { ...request, requestStatus: newStatus }
        }
        return request
      })

      setLeaveRequests(updatedLeaveRequests)
      setDialogMessage(
        <div className="flex flex-col gap-3">
          <p>Leave request has been {newStatus.toLowerCase()} successfully.</p>
          <Button onClick={() => setDialogOpen(false)}>OK</Button>
        </div>
      )
      setDialogOpen(true)
    } catch (error) {
      console.error("Error updating leave request status:", error)
      alert("Failed to update leave request status. Please try again.")
    }
  }

  // Filter logic
  const statusFilteredRequests =
    filter === "all"
      ? leaveRequests
      : leaveRequests.filter((request) => request.requestStatus === filter)

  // Search logic (by username, firstName, or lastName)
  const searchFilteredRequests = statusFilteredRequests.filter((req) => {
    const lowerQuery = searchQuery.toLowerCase().trim()
    if (!lowerQuery) return true
    const userNameMatches = req.user.username?.toLowerCase().includes(lowerQuery)
    const firstNameMatches = req.user.firstName.toLowerCase().includes(lowerQuery)
    const lastNameMatches = req.user.lastName.toLowerCase().includes(lowerQuery)
    return userNameMatches || firstNameMatches || lastNameMatches
  })

  // Pagination logic
  const totalPages = Math.ceil(searchFilteredRequests.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedRequests = searchFilteredRequests.slice(startIndex, endIndex)

  // Reset pagination on filter or search change
  useEffect(() => {
    setCurrentPage(1)
  }, [filter, searchQuery])

  // Show user details in a dialog
  const handleViewProfile = (request: LeaveRequestWithUser) => {
    setSelectedUserData(request.user)
    setUserInfoOpen(true)
  }

  // Framer Motion variants
  const list = {
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.07,
      },
    },
    hidden: {
      opacity: 0,
      transition: {
        when: "afterChildren",
      },
    },
  }

  const item = {
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { type: "tween" },
    },
    hidden: { opacity: 0, y: 10, filter: "blur(3px)" },
  }

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="container mx-auto p-4">
      <Head>
        <title>EMS Manage Leave</title>
      </Head>

      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Manage Leave</CardTitle>
          <CardDescription>
            Review and manage employee leave requests.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Filter, Title, and Search */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h1 className="text-2xl font-semibold">Leave Requests</h1>

            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter requests" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="Pending">Pending Requests</SelectItem>
                <SelectItem value="Accepted">Accepted Requests</SelectItem>
                <SelectItem value="Declined">Declined Requests</SelectItem>
              </SelectContent>
            </Select>

            {/* Search Bar */}
            <div className="flex items-center gap-2 ml-auto">
              <Search className="w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employee"
                className="w-[180px] border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Content States */}
          {leaveRequests.length === 0 ? (
            <div className="flex grow flex-col items-center justify-center gap-2 text-center text-gray-500">
              <Plane className="w-16 h-16" />
              <h1 className="text-2xl font-semibold">No leave requests</h1>
            </div>
          ) : paginatedRequests.length === 0 ? (
            <div className="flex grow flex-col items-center justify-center gap-2 text-center text-gray-500">
              <Funnel className="w-16 h-16" />
              <h1 className="text-2xl font-semibold">No matching requests</h1>
              <p className="text-gray-400">
                Try selecting a different filter or changing your search query.
              </p>
            </div>
          ) : (
            <motion.div
              className="flex flex-col gap-4"
              initial="hidden"
              animate="visible"
              variants={list}
            >
              {paginatedRequests.map((request) => (
                <motion.div key={request.id} variants={item}>
                  <ManageLeaveCard
                    leaveData={{
                      ...request,
                      userFirstName: request.user.firstName,
                      userLastName: request.user.lastName,
                      department: request.user.department ?? "",
                      position: request.user.position ?? "",
                      userUsername: request.user.username,
                    }}
                    onViewProfile={() => handleViewProfile(request)}
                    onAccept={(id) => handleStatusUpdate(id, "Accepted")}
                    onDecline={(id) => handleStatusUpdate(id, "Declined")}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Pagination */}
          {searchFilteredRequests.length > 0 && (
            <div className="mt-4 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => {
                        if (currentPage > 1) {
                          setCurrentPage(currentPage - 1)
                        }
                      }}
                    />
                  </PaginationItem>

                  {pageNumbers.map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={page === currentPage}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => {
                        if (currentPage < totalPages) {
                          setCurrentPage(currentPage + 1)
                        }
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Request Updated</DialogTitle>
            <DialogDescription>
              {dialogMessage}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={userInfoOpen} onOpenChange={setUserInfoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Employee Information</DialogTitle>
            <DialogDescription>
              Detailed profile information for the employee.
            </DialogDescription>
          </DialogHeader>

          {selectedUserData && (
            <div className="grid gap-3 mt-2">
              {/* Profile Image */}
              <div className="flex justify-center">
                <img
                  src={getProfileImageUrl(selectedUserData.profileImageUrl)}
                  alt={`${selectedUserData.firstName} ${selectedUserData.lastName} Profile`}
                  className="h-32 w-32 rounded-full object-cover ring-2 ring-gray-300"
                />
              </div>

              <p>
                <strong>Name:</strong> {selectedUserData.firstName}{" "}
                {selectedUserData.middleName ?? ""} {selectedUserData.lastName}
              </p>
              <p>
                <strong>Username:</strong> {selectedUserData.username}
              </p>
              <p>
                <strong>Email:</strong> {selectedUserData.email}
              </p>
              <p>
                <strong>Phone:</strong> {selectedUserData.phoneNumber}
              </p>
              {selectedUserData.nationality && (
                <p>
                  <strong>Nationality:</strong> {selectedUserData.nationality}
                </p>
              )}
              {selectedUserData.gender && (
                <p>
                  <strong>Gender:</strong> {selectedUserData.gender}
                </p>
              )}
              {selectedUserData.maritalStatus && (
                <p>
                  <strong>Marital Status:</strong> {selectedUserData.maritalStatus}
                </p>
              )}
              {selectedUserData.department && (
                <p>
                  <strong>Department:</strong> {selectedUserData.department}
                </p>
              )}
              {selectedUserData.position && (
                <p>
                  <strong>Position:</strong> {selectedUserData.position}
                </p>
              )}

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setUserInfoOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
