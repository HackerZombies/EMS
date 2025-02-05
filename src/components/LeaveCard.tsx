"use client"

import type { LeaveRequest } from "@prisma/client"
import { Calendar, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Props = {
  leaveData: LeaveRequest
}

const LeaveCard = ({ leaveData }: Props) => {
  const formatDate = (date: Date | string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }
    return new Intl.DateTimeFormat("en-UK", options).format(new Date(date))
  }

  const calculateDuration = (
    startDate: Date | string,
    endDate: Date | string
  ) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const durationInMs = end.getTime() - start.getTime()
    return Math.round(durationInMs / (1000 * 60 * 60 * 24)) + 1
  }

  const duration = calculateDuration(leaveData.startDate, leaveData.endDate)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Accepted":
        return "bg-green-100 text-green-800 border-green-200"
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Declined":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <Card className="hover:shadow transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-gray-800">
            {leaveData.reason}
          </h3>
          <Badge
            className={`${getStatusColor(
              leaveData.requestStatus
            )} px-2 py-1 text-xs font-medium rounded-full`}
          >
            {leaveData.requestStatus}
          </Badge>
        </div>
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            <span>
              {formatDate(leaveData.startDate)} - {formatDate(leaveData.endDate)}
            </span>
          </div>
          <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4" />
            <span>
              {duration} {duration === 1 ? "day" : "days"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default LeaveCard
