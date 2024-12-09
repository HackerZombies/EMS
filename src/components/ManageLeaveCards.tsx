import React from "react";
import { LeaveRequest } from "@prisma/client";

interface ManageLeaveCardsProps {
  leaveData: LeaveRequest & { userFirstName: string; userLastName: string; department: string; position: string };
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
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
      return "bg-green-600 text-white";
    } else if (status === "Pending") {
      return "bg-yellow-600 text-white";
    } else {
      return "bg-red-600 text-white";
    }
  };

  return (
    <div className="flex flex-col items-start justify-between gap-3 rounded-2xl bg-gray-800 bg-opacity-80 p-4 text -black shadow-lg transition-transform transform hover:scale-105">
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-col">
          <span className="text-lg text-white">{formatDate(new Date(leaveData.startDate))}</span>
          <span className="font-bold text-white">
            Requested by: {leaveData.userFirstName} {leaveData.userLastName} (ID: {leaveData.userUsername})
          </span>
          <span className="text-sm text-gray-400">
            Department: {leaveData.department} | Position: {leaveData.position}
          </span>
        </div>
        <span className={`rounded-full px-3 py-1 text-md font-semibold ${getStatusColor(leaveData.requestStatus)}`}>
          {leaveData.requestStatus}
        </span>
      </div>
      <div className="w-full">
        <p className="text-lg font-bold text-white">Leave Request Details:</p>
        <p className="text-gray-300">Type: {leaveData.reason}</p>
        <p className="text-gray-300">Start Date: {formatDate(new Date(leaveData.startDate))}</p>
        <p className="text-gray-300">End Date: {formatDate(new Date(leaveData.endDate))}</p>
        <p className="text-gray-300">
          Duration: {calculateDuration(new Date(leaveData.startDate), new Date(leaveData.endDate))} days
        </p>
        <div className="flex justify-end gap-1">
          {leaveData.requestStatus !== "Accepted" && leaveData.requestStatus !== "Declined" ? (
            <>
              <button
                onClick={() => onAccept(leaveData.id.toString())}
                className="flex items-center justify-center gap-1 rounded-full bg-green-600 px-3 py-2 font-medium text-white shadow-lg transition hover:bg-white hover:text-black active:bg-white active:bg-opacity-70"
              >
                Accept
              </button>
              <button
                onClick={() => onDecline(leaveData.id.toString())}
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