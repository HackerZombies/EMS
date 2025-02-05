"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import type { LeaveRequest } from "@prisma/client"
import Link from "next/link"
import { Plane, Plus } from "lucide-react"
import LeaveCard from "@/components/LeaveCard"
import { Button } from "@/components/ui/button"

export default function Leave() {
  const { data: session } = useSession()
  const [balance, setBalance] = useState<number>(28)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [totalLeaveDuration, setTotalLeaveDuration] = useState<number>(0)

  const calculateDurationInDays = useCallback(
    (start: string | Date, end: string | Date): number => {
      const startDate =
        start instanceof Date ? start : new Date(`${start}T00:00:00Z`)
      const endDate =
        end instanceof Date ? end : new Date(`${end}T00:00:00Z`)
      const diffMs = endDate.getTime() - startDate.getTime()
      if (diffMs < 0) return 0
      return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1
    },
    []
  )

  useEffect(() => {
    if (!session?.user?.username) return

    const fetchLeaveRequests = async () => {
      try {
        const response = await fetch(
          `/api/leaveRequests?userUsername=${session.user.username}`
        )
        if (!response.ok) {
          throw new Error("Failed to fetch leave requests")
        }
        const data: LeaveRequest[] = await response.json()

        // Sort by earliest start date
        const sortedData = data.sort(
          (a, b) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        )
        setLeaveRequests(sortedData)

        // Calculate total accepted/pending duration
        const totalDuration = sortedData.reduce((acc, request) => {
          if (request.requestStatus !== "Declined") {
            return acc + calculateDurationInDays(request.startDate, request.endDate)
          }
          return acc
        }, 0)
        setTotalLeaveDuration(totalDuration)
      } catch (error) {
        console.error("Error fetching leave requests:", error)
      }
    }

    const fetchBalance = async () => {
      try {
        const response = await fetch(
          `/api/leaveRequests/getleavebalance?username=${session.user.username}`
        )
        if (!response.ok) {
          throw new Error("Failed to fetch leave balance")
        }
        const data = await response.json()
        setBalance(data.leaveBalance ?? 28)
      } catch (error) {
        console.error("Error fetching leave balance:", error)
        setBalance(28)
      }
    }

    fetchLeaveRequests()
    fetchBalance()
  }, [session, calculateDurationInDays])

  const usedDays = totalLeaveDuration
  const remainingDays = balance - usedDays

  return (
    <div className="min-h-screen  p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
         
          <Link href="/leave/new" passHref>
            <Button className="bg-teal-600 hover:bg-teal-700 text-white font-medium shadow">
              <Plus className="mr-2 h-4 w-4" />
              New Leave Request
            </Button>
          </Link>
        </div>

        {/* Small Leave Balance Overview */}
        <div className="mb-6 flex flex-wrap items-center space-x-4 text-sm text-white">
          <span className="font-medium">Used:</span>
          <span>{usedDays} days</span>
          <span className="font-medium">| Remaining:</span>
          <span>{remainingDays < 0 ? 0 : remainingDays} days</span>
          <span className="font-medium">| Total Granted:</span>
          <span>{balance} days</span>
        </div>

        {/* Leave Requests List */}
        {leaveRequests.length === 0 ? (
          <div className="text-center py-12">
            <Plane className="h-16 w-16 text-gray-400 mb-4 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No Leave Requests
            </h3>
            <p className="text-white">
              Click &apos;New Leave Request&apos; to create one.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leaveRequests.map((leave) => (
              <LeaveCard key={leave.id} leaveData={leave} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
