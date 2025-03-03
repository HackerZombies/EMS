"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import { Attendance } from "@prisma/client";
import { GetServerSideProps } from "next";

// shadcn/ui components
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Clock, Download, Users, MapPin } from "lucide-react";

import ReactDatePicker from "react-datepicker";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "framer-motion";

type AttendanceRecord = {
  id: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  checkInLatitude: number | null;
  checkInLongitude: number | null;
  checkOutLatitude: number | null;
  checkOutLongitude: number | null;
  checkInAddress: string | null;
  checkOutAddress: string | null;
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
    department?: string | null;
    position?: string | null;
    workLocation?: string | null;
    profileImageUrl?: string | null;
  };
  isNew?: boolean; // used to mark new/updated records for animation
};

interface AllAttendancePageProps {
  initialAttendance: AttendanceRecord[];
  users: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
    department?: string | null;
    position?: string | null;
    workLocation?: string | null;
    profileImageUrl?: string | null;
  }[];
}

const ITEMS_PER_PAGE = 10;
const WORK_END_HOUR = 18; // 6 PM

// Helper functions to set start/end of day
function setToStartOfDay(date: Date) {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

function setToEndOfDay(date: Date) {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
}

export default function AllAttendancePage({
  initialAttendance,
  users,
}: AllAttendancePageProps) {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>(initialAttendance);
  const [filteredData, setFilteredData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const recordId = searchParams.get("recordId"); // e.g. /hr/attendance?recordId=abc123

  // Default filters
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateError, setDateError] = useState<string | null>(null);

// -------------------------------------------------------------------------
// Polling Setup for Realtime Attendance Updates (every 5 seconds)
// -------------------------------------------------------------------------
useEffect(() => {
  if (!users || users.length === 0) {
    console.warn("Users list is not available yet.");
    return; // Don't start polling until users are available
  }

  const pollAttendance = async () => {
    try {
      const res = await fetch("/api/sse-attendance?poll=1", {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        console.error("Polling error:", res.status);
        return;
      }

      const data = await res.json();
      if (data.type === "attendanceUpdate") {
        // Ensure updatedRecord is an array, and take the first record
        const updatedRecord = Array.isArray(data.payload) ? data.payload[0] : data.payload;
        
        

        // Defensive check for undefined userUsername
        if (!updatedRecord || !updatedRecord.userUsername) {
          console.error("userUsername is missing in the updated record:", updatedRecord);
          return; // Exit if the userUsername is missing
        }

        
       

        // Ensure the user exists in our list (case-insensitive comparison)
        const user = users.find(
          (u) => u.username.toLowerCase() === updatedRecord.userUsername.toLowerCase()
        );
        
        if (user) {
          const updatedRecordData: AttendanceRecord = {
            id: updatedRecord.id,
            date: new Date(updatedRecord.date).toISOString(),
            checkInTime: updatedRecord.checkInTime
              ? new Date(updatedRecord.checkInTime).toISOString()
              : null,
            checkOutTime: updatedRecord.checkOutTime
              ? new Date(updatedRecord.checkOutTime).toISOString()
              : null,
            checkInLatitude: updatedRecord.checkInLatitude,
            checkInLongitude: updatedRecord.checkInLongitude,
            checkOutLatitude: updatedRecord.checkOutLatitude,
            checkOutLongitude: updatedRecord.checkOutLongitude,
            checkInAddress: updatedRecord.checkInAddress || null,
            checkOutAddress: updatedRecord.checkOutAddress || null,
            user: {
              ...user,
              role: user.role || "USER",
            },
            isNew: true, // Mark as new for animation
          };

          setAttendanceData((prevData) => {
            const existingIndex = prevData.findIndex(
              (item) => item.id === updatedRecordData.id
            );
            if (existingIndex > -1) {
              const newData = [...prevData];
              newData[existingIndex] = updatedRecordData;
              return newData.sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
              );
            } else {
              return [updatedRecordData, ...prevData].sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
              );
            }
          });
        } else {
          console.warn("User not found for attendance update:", updatedRecord);
        }
      }
    } catch (error) {
      console.error("Error during polling:", error);
    }
  };

  const intervalId = setInterval(pollAttendance, 5000);
  pollAttendance(); // Run an initial poll on mount

  return () => clearInterval(intervalId); // Cleanup polling on unmount
}, [users]);

  // -------------------------------------------------------------------------
  // Filter by User + Date Range
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!startDate || !endDate) {
      setFilteredData([]);
      return;
    }
    const startDay = setToStartOfDay(startDate);
    const endDay = setToEndOfDay(endDate);
    const filtered = attendanceData.filter((record) => {
      const recordDate = new Date(record.date);
      const isAfterStart = recordDate >= startDay;
      const isBeforeEnd = recordDate <= endDay;
      const matchesUser = selectedUser ? record.user.id === selectedUser : true;
      return isAfterStart && isBeforeEnd && matchesUser;
    });
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [attendanceData, startDate, endDate, selectedUser]);

  // -------------------------------------------------------------------------
  // Validate Date Range
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (startDate && endDate && endDate < startDate) {
      setDateError("End date cannot be earlier than start date.");
    } else {
      setDateError(null);
    }
  }, [startDate, endDate]);

  // -------------------------------------------------------------------------
  // Export Data
  // -------------------------------------------------------------------------
  const handleExport = async () => {
    if (filteredData.length === 0) {
      alert("No data to export for the selected filters.");
      return;
    }
    const dataToExport = filteredData.map((record) => ({
      ID: record.id,
      Date: new Date(record.date).toLocaleDateString(),
      "Check-In Time": record.checkInTime
        ? new Date(record.checkInTime).toLocaleTimeString()
        : "N/A",
      "Check-Out Time": record.checkOutTime
        ? new Date(record.checkOutTime).toLocaleTimeString()
        : "N/A",
      "Check-In Location":
        record.checkInLatitude && record.checkInLongitude
          ? `${record.checkInLatitude}, ${record.checkInLongitude}`
          : "N/A",
      "Check-Out Location":
        record.checkOutLatitude && record.checkOutLongitude
          ? `${record.checkOutLatitude}, ${record.checkOutLongitude}`
          : "N/A",
      "Check-In Address": record.checkInAddress || "N/A",
      "Check-Out Address": record.checkOutAddress || "N/A",
      User: `${record.user.firstName} ${record.user.lastName}`,
      Role: record.user.role,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blobData = new Blob([excelBuffer], { type: "application/octet-stream" });
    const filenameParts: string[] = [];
    if (startDate) filenameParts.push(`from_${startDate.toISOString().split("T")[0]}`);
    if (endDate) filenameParts.push(`to_${endDate.toISOString().split("T")[0]}`);
    if (selectedUser) {
      const user = users.find((u) => u.id === selectedUser);
      if (user) filenameParts.push(user.username);
    }
    const filename =
      filenameParts.length > 0
        ? `attendance_${filenameParts.join("_")}.xlsx`
        : "attendance.xlsx";
    saveAs(blobData, filename);
  };

  // -------------------------------------------------------------------------
  // Pagination
  // -------------------------------------------------------------------------
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const handlePageChange = (page: number) => setCurrentPage(page);

  // -------------------------------------------------------------------------
  // Determine Status Badge
  // -------------------------------------------------------------------------
  function getStatusBadge(record: AttendanceRecord) {
    if (!record.checkInTime) {
      return <Badge variant="destructive">Not In</Badge>;
    }
    if (!record.checkOutTime) {
      return <Badge variant="destructive">NO CHECK OUT</Badge>;
    }
    const checkOutDate = new Date(record.checkOutTime);
    if (checkOutDate.getHours() >= WORK_END_HOUR) {
      return <Badge variant="destructive">Late</Badge>;
    }
    return <Badge variant="default">Done</Badge>;
  }

  // -------------------------------------------------------------------------
  // Address Popover
  // -------------------------------------------------------------------------
  function AddressPopover({
    label,
    lat,
    lng,
    address,
  }: {
    label: string;
    lat: number | null;
    lng: number | null;
    address: string | null;
  }) {
    if (!lat || !lng) {
      return <span className="text-xs text-gray-500">No {label}</span>;
    }
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-1 text-blue-600 hover:underline text-xs sm:text-sm">
            <MapPin className="w-4 h-4" />
            {label}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="center"
          sideOffset={6}
          className="p-3 w-64 bg-white border border-gray-200 shadow-md rounded-md text-xs sm:text-sm"
        >
          <p className="text-gray-700 mb-1">
            <strong>{label} Coordinates:</strong> {lat.toFixed(6)}, {lng.toFixed(6)}
          </p>
          <p className="text-gray-700 mb-2">
            <strong>Address:</strong> {address || "No address stored"}
          </p>
          <Link
            href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
            target="_blank"
            className="text-blue-600 underline"
          >
            View on Google Maps
          </Link>
        </PopoverContent>
      </Popover>
    );
  }

  // -------------------------------------------------------------------------
  // Highlight Row if record.id === recordId
  // -------------------------------------------------------------------------
  function isHighlightedRow(record: AttendanceRecord) {
    return recordId && recordId === record.id;
  }

  return (
    <div className="container mx-auto p-2 sm:p-4">
      <Card className="border border-gray-200 shadow-sm bg-white text-gray-900">
        {/* Header: Filters + Export */}
        <CardHeader className="p-3 sm:p-4 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-base sm:text-lg font-semibold">
              Attendance
            </CardTitle>
            <div className="flex flex-wrap items-end gap-2 sm:gap-4 text-xs sm:text-sm">
              {/* Start Date */}
              <div className="flex flex-col">
                <label htmlFor="startDate" className="font-semibold text-gray-600">
                  Start
                </label>
                <ReactDatePicker
                  id="startDate"
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  maxDate={new Date()}
                  className="border border-gray-300 rounded px-2 py-1"
                />
              </div>
              {/* End Date */}
              <div className="flex flex-col">
                <label htmlFor="endDate" className="font-semibold text-gray-600">
                  End
                </label>
                <ReactDatePicker
                  id="endDate"
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  maxDate={new Date()}
                  minDate={startDate || undefined}
                  className="border border-gray-300 rounded px-2 py-1"
                />
              </div>
              {/* Date Error */}
              {dateError && (
                <span className="text-red-500 font-medium self-center">
                  {dateError}
                </span>
              )}
              {/* User Filter */}
              <div className="flex flex-col">
                <label htmlFor="userFilter" className="font-semibold text-gray-600">
                  Employee
                </label>
                <select
                  id="userFilter"
                  value={selectedUser || ""}
                  onChange={(e) => setSelectedUser(e.target.value || null)}
                  className="border border-gray-300 rounded px-2 py-1"
                >
                  <option value="">All</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName}
                    </option>
                  ))}
                </select>
              </div>
              {/* Export Button */}
              <Button
                variant="default"
                size="sm"
                onClick={handleExport}
                className="bg-black"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-4">
          <Separator className="my-3" />
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-gray-600">
              <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm font-medium">
                No attendance data found for selected filters
              </p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-md overflow-x-auto">
              <Table className="w-full table-auto text-xs sm:text-sm">
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="px-2 py-2 whitespace-nowrap">Date</TableHead>
                    <TableHead className="px-2 py-2 whitespace-nowrap">Employee</TableHead>
                    <TableHead className="px-2 py-2 whitespace-nowrap">Status</TableHead>
                    <TableHead className="px-2 py-2 whitespace-nowrap">Check-In</TableHead>
                    <TableHead className="px-2 py-2 whitespace-nowrap">Check-Out</TableHead>
                    <TableHead className="px-2 py-2 whitespace-nowrap">Address / Coords</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {currentItems.map((record) => {
                      const dateStr = new Date(record.date).toLocaleDateString();
                      const userFullName = `${record.user.firstName} ${record.user.lastName}`;
                      const checkInTimeStr = record.checkInTime
                        ? new Date(record.checkInTime).toLocaleTimeString()
                        : "N/A";
                      const checkOutTimeStr = record.checkOutTime
                        ? new Date(record.checkOutTime).toLocaleTimeString()
                        : "N/A";
                      const isHighlighted = isHighlightedRow(record);
                      return (
                        <motion.tr
                          key={record.id}
                          initial={record.isNew ? { backgroundColor: "#ffffe0" } : {}}
                          animate={{ backgroundColor: isHighlighted ? "#fffacd" : "#ffffff" }}
                          transition={{ duration: 1 }}
                          onAnimationComplete={() => {
                            if (record.isNew) {
                              setAttendanceData((prevData) =>
                                prevData.map((item) =>
                                  item.id === record.id ? { ...item, isNew: false } : item
                                )
                              );
                            }
                          }}
                          className={`hover:bg-gray-50 ${isHighlighted ? "bg-yellow-50" : ""}`}
                        >
                          <TableCell className="px-2 py-2 font-medium">{dateStr}</TableCell>
                          <TableCell className="px-2 py-2 font-medium">
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="flex items-center gap-1 text-blue-600 hover:underline">
                                  <Users className="h-4 w-4" />
                                  <span>{userFullName}</span>
                                </button>
                              </PopoverTrigger>
                              <PopoverContent
                                align="start"
                                sideOffset={8}
                                className="w-64 p-3 bg-white border border-gray-200 shadow-md rounded-md text-xs sm:text-sm"
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="relative w-16 h-16">
                                    <Image
                                      src={
                                        record.user.profileImageUrl
                                          ? record.user.profileImageUrl
                                          : "/default-avatar.png"
                                      }
                                      alt={`${record.user.username}-avatar`}
                                      fill
                                      className="rounded-full object-cover"
                                      sizes="(max-width: 768px) 100vw, 64px"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-semibold text-gray-800">{userFullName}</p>
                                    <p className="text-[10px] text-gray-500">
                                      {record.user.department ?? "No Dept"} &bull;{" "}
                                      {record.user.position ?? "No Pos"}
                                    </p>
                                  </div>
                                </div>
                                <p className="text-gray-700 mb-1">
                                  <strong>Date:</strong> {dateStr}
                                </p>
                                <p className="text-gray-700 mb-1">
                                  <strong>Check-In:</strong> {checkInTimeStr}
                                </p>
                                <p className="text-gray-700 mb-2">
                                  <strong>Check-Out:</strong> {checkOutTimeStr}
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  onClick={() =>
                                    router.push(`/manage/users/user/${record.user.username}`)
                                  }
                                >
                                  View Profile
                                </Button>
                              </PopoverContent>
                            </Popover>
                          </TableCell>
                          <TableCell className="px-2 py-2">{getStatusBadge(record)}</TableCell>
                          <TableCell className="px-2 py-2">
                            {record.checkInTime ? (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-gray-400" />
                                {checkInTimeStr}
                              </div>
                            ) : (
                              "N/A"
                            )}
                          </TableCell>
                          <TableCell className="px-2 py-2">
                            {record.checkOutTime ? (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-gray-400" />
                                {checkOutTimeStr}
                              </div>
                            ) : (
                              "N/A"
                            )}
                          </TableCell>
                          <TableCell className="px-2 py-2">
                            <div className="flex flex-col gap-1">
                              <AddressPopover
                                label="In"
                                lat={record.checkInLatitude}
                                lng={record.checkInLongitude}
                                address={record.checkInAddress}
                              />
                              <AddressPopover
                                label="Out"
                                lat={record.checkOutLatitude}
                                lng={record.checkOutLongitude}
                                address={record.checkOutAddress}
                              />
                            </div>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex flex-col items-center justify-between gap-2 sm:flex-row mt-4 px-4 py-2">
                  <p className="text-xs sm:text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// getServerSideProps for authentication and initial data fetching
export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session?.user || !["HR", "ADMIN"].includes(session.user.role)) {
    return {
      redirect: {
        destination: "/unauthorized",
        permanent: false,
      },
    };
  }
  try {
    const attendanceRecords = await prisma.attendance.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true,
            department: true,
            position: true,
            workLocation: true,
            profileImageUrl: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });
    const userRecords = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        position: true,
        workLocation: true,
        profileImageUrl: true,
      },
    });
    const attendanceDataForProps: AttendanceRecord[] = attendanceRecords.map((r) => ({
      id: r.id,
      date: r.date.toISOString(),
      checkInTime: r.checkInTime?.toISOString() || null,
      checkOutTime: r.checkOutTime?.toISOString() || null,
      checkInLatitude: r.checkInLatitude,
      checkInLongitude: r.checkInLongitude,
      checkOutLatitude: r.checkOutLatitude,
      checkOutLongitude: r.checkOutLongitude,
      checkInAddress: r.checkInAddress,
      checkOutAddress: r.checkOutAddress,
      user: {
        id: r.user.id,
        username: r.user.username,
        firstName: r.user.firstName,
        lastName: r.user.lastName,
        role: r.user.role,
        department: r.user.department,
        position: r.user.position,
        workLocation: r.user.workLocation,
        profileImageUrl: r.user.profileImageUrl,
      },
    }));
    return {
      props: {
        initialAttendance: attendanceDataForProps,
        users: userRecords,
      },
    };
  } catch (error) {
    console.error("Error fetching attendance data:", error);
    return {
      props: {
        initialAttendance: [],
        users: [],
      },
    };
  }
};
