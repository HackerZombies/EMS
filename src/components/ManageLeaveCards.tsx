// src/components/ManageLeaveCards.tsx
"use client"

import type { LeaveRequest } from "@prisma/client"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarDays, User, Briefcase } from "lucide-react"

interface ManageLeaveCardProps {
  leaveData: LeaveRequest & {
    userFirstName: string
    userLastName: string
    department: string
    position: string
    userUsername: string
    // You can pass additional fields here if you want 
    // (e.g., phoneNumber, profileImageUrl) 
  }
  onAccept: (id: string) => void
  onDecline: (id: string) => void
  onViewProfile?: () => void
}

export function ManageLeaveCard({
  leaveData,
  onAccept,
  onDecline,
  onViewProfile,
}: ManageLeaveCardProps) {
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
    return new Intl.DateTimeFormat("en-UK", options).format(date)
  }

  const calculateDuration = (startDate: Date, endDate: Date) => {
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return 0
    }
    const durationInMilliseconds = endDate.getTime() - startDate.getTime()
    const durationInDays = durationInMilliseconds / (1000 * 60 * 60 * 24)
    return Math.round(durationInDays)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Accepted":
        return "bg-green-100 text-green-800"
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "Declined":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card className="max-w-md shadow-md rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
        <CardTitle className="text-base font-medium">Leave Request</CardTitle>
        <Badge className={getStatusColor(leaveData.requestStatus)}>
          {leaveData.requestStatus}
        </Badge>
      </CardHeader>

      <CardContent className="p-3">
        <div className="grid gap-1 text-sm">
          {/* Basic user info */}
          <div className="flex items-center gap-1">
            <User className="h-4 w-4 opacity-70" />
            <span className="font-medium">
              {leaveData.userFirstName} {leaveData.userLastName} (ID: {leaveData.userUsername})
            </span>
          </div>

          {/* Department & Position */}
          <div className="flex items-center text-muted-foreground gap-1">
            <Briefcase className="h-4 w-4 opacity-70" />
            <span>
              {leaveData.department} | {leaveData.position}
            </span>
          </div>

          {/* Dates */}
          <div className="flex items-center gap-1">
            <CalendarDays className="h-4 w-4 opacity-70" />
            <span>
              {formatDate(new Date(leaveData.startDate))} - {formatDate(new Date(leaveData.endDate))}
            </span>
          </div>

          {/* Duration */}
          <div>
            <span className="font-medium">Duration:</span>{" "}
            {calculateDuration(new Date(leaveData.startDate), new Date(leaveData.endDate))} days
          </div>

          {/* Reason */}
          <div>
            <span className="font-medium">Type:</span> {leaveData.reason}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-3 flex justify-end space-x-2">
        {/* View Employee Details */}
        <Button size="sm" variant="outline" onClick={() => onViewProfile?.()}>
          View Details
        </Button>

        {leaveData.requestStatus === "Pending" && (
          <>
            <Button
              size="sm"
              onClick={() => onAccept(leaveData.id.toString())}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              Accept
            </Button>
            <Button
              size="sm"
              onClick={() => onDecline(leaveData.id.toString())}
              variant="destructive"
            >
              Decline
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
