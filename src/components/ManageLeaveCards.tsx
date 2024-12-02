import React from "react";
import { LeaveRequest } from "@prisma/client";

interface ManageLeaveCardsProps {
  leaveData: LeaveRequest & { userFirstName: string; userLastName: string }; // Extend to include user's full name
  onAccept: (id: string) => void; // Change to string
  onDecline: (id: string) => void; // Change to string
}

const ManageLeaveCards: React.FC<ManageLeaveCardsProps> = ({ leaveData, onAccept, onDecline }) => {
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    return new Intl.DateTimeFormat("en-UK", options).format(date);
  };

  const calculateDuration = (startDate: Date, endDate: Date) => {
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return 0;
    }
    const durationInMilliseconds = endDate.getTime() - startDate.getTime();
    const durationInDays = durationInMilliseconds / (1000 * 60 * 60 * 24);
    return Math.round(durationInDays);
  };

  const getStatusColor = (status: string) => {
    if (status === "Accepted") {
      return "bg-green-100 text-green-600";
    } else if (status === "Pending") {
      return "bg-yellow-100 text-yellow-600";
    } else {
      return "bg-red-100 text-red-600";
    }
  };

  return (
    <div className="flex flex-col items-start justify-between gap-3 rounded-2xl bg-white bg-opacity-80 p-4 text-black shadow-lg">
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-col">
          <span className="text-lg">{formatDate(new Date(leaveData.startDate))}</span>
          <span className="font-bold">
            Requested by: {leaveData.userFirstName} {leaveData.userLastName} (ID: {leaveData.userUsername})
          </span>
        </div>
        <span className={`rounded-full px-3 py-1 text-md font-semibold ${getStatusColor(leaveData.requestStatus)}`}>
          {leaveData.requestStatus}
        </span>
      </div>
      <div className="w-full">
        <p className="text-lg font-bold">Leave Request Details:</p>
        <p>Type: {leaveData.reason}</p>
        <p>Start Date: {formatDate(new Date(leaveData.startDate))}</p>
        <p>End Date: {formatDate(new Date(leaveData.endDate))}</p>
        <p>
          Duration: {calculateDuration(new Date(leaveData.startDate), new Date(leaveData.endDate))} days
        </p>
        <div className="flex justify-end gap-1">
          {leaveData.requestStatus !== "Accepted" && leaveData.requestStatus !== "Declined" ? (
            <>
              <button
                onClick={() => onAccept(leaveData.id.toString())} // Pass ID as a string
                className="flex items-center justify-center gap-1 rounded-full bg-green-600 px-3 py-2 font-medium text-white shadow-lg transition hover:bg-white hover:text-black active:bg-white active:bg-opacity-70"
              >
                Accept
              </button>
              <button
                onClick={() => onDecline(leaveData.id.toString())} // Pass ID as a string
                className="flex items-center justify-center gap-1 rounded-full bg-red-600 px-3 py-2 font-medium text-white shadow-lg transition hover:bg-white hover:text-black active:bg-white active:bg-opacity-70"
              >
                Decline
              </button>
            </>
          ) : (
            <p className="text-gray-300">Already submitted</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageLeaveCards;