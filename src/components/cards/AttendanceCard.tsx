// src/components/cards/AttendanceCard.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { AlertCircle, Clock, Users, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";

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
    profileImageUrl?: string | null;
    department?: string | null;
    position?: string | null;
  };
};

const WORK_END_HOUR = 18; // 6 PM

const AttendanceCompactCard: React.FC = () => {
  const { data: session } = useSession();
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);

  // Only show this card for HR or ADMIN users.
  if (!session || (session.user.role !== "HR" && session.user.role !== "ADMIN")) {
    return null;
  }

  // Fetch today's attendance records.
  const fetchTodayAttendance = async () => {
    try {
      const res = await fetch("/api/attendance/today");
      const json = await res.json();
      const data: AttendanceRecord[] = Array.isArray(json)
        ? json
        : (json.attendance || []);
      setAttendanceData(data);
    } catch (error) {
      console.error("Error fetching today's attendance:", error);
      setAttendanceData([]);
    }
  };

  useEffect(() => {
    fetchTodayAttendance();
    const intervalId = setInterval(fetchTodayAttendance, 10000);
    return () => clearInterval(intervalId);
  }, []);

  // Helper: Render the status badge based on check-in/out times.
  const getStatusBadge = (record: AttendanceRecord) => {
    if (!record.checkInTime) {
      return <Badge variant="destructive">Not In</Badge>;
    }
    if (!record.checkOutTime) {
      return <Badge variant="destructive">No Check-Out</Badge>;
    }
    const checkOut = new Date(record.checkOutTime);
    if (checkOut.getHours() >= WORK_END_HOUR) {
      return <Badge variant="destructive">Late</Badge>;
    }
    return <Badge variant="default">Done</Badge>;
  };

  // Reusable Address popover component.
  const AddressPopover = ({
    label,
    lat,
    lng,
    address,
  }: {
    label: string;
    lat: number | null;
    lng: number | null;
    address: string | null;
  }) => {
    if (!lat || !lng) {
      return <span className="text-xs text-gray-500">No {label}</span>;
    }
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-1 text-blue-600 hover:underline text-xs">
            <MapPin className="w-4 h-4" />
            {label}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="center"
          sideOffset={6}
          className="p-2 w-56 bg-white border border-gray-200 shadow-md rounded-md text-xs"
        >
          <p className="text-gray-700 mb-1">
            <strong>{label} Coordinates:</strong> {lat.toFixed(6)}, {lng.toFixed(6)}
          </p>
          <p className="text-gray-700 mb-2">
            <strong>Address:</strong> {address || "No address stored"}
          </p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            View on Google Maps
          </a>
        </PopoverContent>
      </Popover>
    );
  };

  // Display up to 5 attendance records. If there are fewer than 5, fill extra rows.
  const displayedAttendance = attendanceData.slice(0, 5);
  const extraRows = 5 - displayedAttendance.length;

  return (
    <Card className="bg-white dark:bg-gray-800 shadow-lg p-2 rounded-lg">
      <CardHeader className="p-1">
        <CardTitle className="text-sm font-semibold">Attendance</CardTitle>
      </CardHeader>
      <CardContent className="px-2 py-2">
        {attendanceData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-2 text-gray-600 text-xs">
            <AlertCircle className="w-5 h-5 mb-1" />
            <span>No attendance data for today</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="w-full table-auto text-xs">
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="px-1 py-1">Time</TableHead>
                  <TableHead className="px-1 py-1">Employee</TableHead>
                  <TableHead className="px-1 py-1">Status</TableHead>
                  <TableHead className="px-1 py-1">Check-In</TableHead>
                  <TableHead className="px-1 py-1">Check-Out</TableHead>
                  <TableHead className="px-1 py-1">Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedAttendance.map((record) => {
                  const recordTime = new Date(record.date).toLocaleTimeString();
                  const employeeName = `${record.user.firstName} ${record.user.lastName}`;
                  const checkInTime = record.checkInTime
                    ? new Date(record.checkInTime).toLocaleTimeString()
                    : "N/A";
                  const checkOutTime = record.checkOutTime
                    ? new Date(record.checkOutTime).toLocaleTimeString()
                    : "N/A";

                  return (
                    <TableRow key={record.id} className="hover:bg-gray-50">
                      <TableCell className="px-1 py-1">{recordTime}</TableCell>
                      <TableCell className="px-1 py-1">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="flex items-center gap-1 text-blue-600 hover:underline">
                              <Users className="w-4 h-4" />
                              <span>{employeeName}</span>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            align="start"
                            sideOffset={8}
                            className="w-56 p-2 bg-white border border-gray-200 shadow-md rounded-md text-xs"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <div className="relative w-10 h-10">
                                <Image
                                  src={record.user.profileImageUrl || "/default-avatar.png"}
                                  alt={`${record.user.username}-avatar`}
                                  fill
                                  className="rounded-full object-cover"
                                  sizes="(max-width: 768px) 100vw, 40px"
                                />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800 text-xs">{employeeName}</p>
                                <p className="text-[10px] text-gray-500">
                                  {record.user.department || "No Dept"} • {record.user.position || "No Pos"}
                                </p>
                              </div>
                            </div>
                            <p className="text-gray-700 text-xs">
                              <strong>Time:</strong> {recordTime}
                            </p>
                            <p className="text-gray-700 text-xs">
                              <strong>Check-In:</strong> {checkInTime}
                            </p>
                            <p className="text-gray-700 text-xs">
                              <strong>Check-Out:</strong> {checkOutTime}
                            </p>
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                      <TableCell className="px-1 py-1">{getStatusBadge(record)}</TableCell>
                      <TableCell className="px-1 py-1">
                        {record.checkInTime ? (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>{checkInTime}</span>
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell className="px-1 py-1">
                        {record.checkOutTime ? (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>{checkOutTime}</span>
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell className="px-1 py-1">
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
                    </TableRow>
                  );
                })}
                {extraRows > 0 &&
                  Array.from({ length: extraRows }).map((_, index) => (
                    <TableRow key={`empty-${index}`} className="hover:bg-gray-50">
                      <TableCell className="px-1 py-1">&nbsp;</TableCell>
                      <TableCell className="px-1 py-1">&nbsp;</TableCell>
                      <TableCell className="px-1 py-1">&nbsp;</TableCell>
                      <TableCell className="px-1 py-1">&nbsp;</TableCell>
                      <TableCell className="px-1 py-1">&nbsp;</TableCell>
                      <TableCell className="px-1 py-1">&nbsp;</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        )}
        {/* "View More" button positioned at the bottom-right */}
        <div className="mt-2 text-right">
          <Link href="/hr/attendance">
            <Button variant="default" size="xs">
              View More
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceCompactCard;
