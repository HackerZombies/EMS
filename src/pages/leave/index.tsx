import Head from "next/head";
import LeaveCard from "@/components/LeaveCard";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { LeaveRequest } from "@prisma/client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Icon } from "@iconify/react";

export default function Leave() {
  const { data: session } = useSession();

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [totalLeaveDuration, setTotalLeaveDuration] = useState<number>(0);
  const [balance, setBalance] = useState<number>(0);

  // Improved duration calculation: inclusive of start and end dates
  const calculateDurationInDays = (start: string | Date, end: string | Date): number => {
    const startDate = start instanceof Date ? start : new Date(start + "T00:00:00Z");
    const endDate = end instanceof Date ? end : new Date(end + "T00:00:00Z");
    const diffMs = endDate.getTime() - startDate.getTime();
    if (diffMs < 0) return 0;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  };

  useEffect(() => {
    if (!session?.user?.username) return;

    const fetchLeaveRequests = async () => {
      try {
        const response = await fetch(
          `/api/leaveRequests?userUsername=${session.user.username}`
        );
        const data: LeaveRequest[] = await response.json();

        // Sort using Date objects conversion to ensure proper sorting
        const sortedData = data.sort((a, b) => 
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );

        setLeaveRequests(sortedData);

        let totalDuration = 0;
        sortedData.forEach((request) => {
          if (request.requestStatus !== "Declined") {
            const duration = calculateDurationInDays(
              request.startDate,
              request.endDate
            );
            totalDuration += duration;
          }
        });
        setTotalLeaveDuration(totalDuration);
      } catch (error) {
        console.error("Error fetching leave requests:", error);
      }
    };

    fetchLeaveRequests();
  }, [session]);

  useEffect(() => {
    if (!session?.user?.username) return;

    const fetchBalance = async () => {
      try {
        const response = await fetch(
          `/api/leaveRequests/getleavebalance?username=${session.user.username}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch leave balance");
        }
        const data = await response.json();
        setBalance(data.leaveBalance);
      } catch (error) {
        console.error("Error fetching leave balance:", error);
      }
    };

    fetchBalance();
  }, [session]);

  const listVariants = {
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
  };

  const itemVariants = {
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "tween" },
    },
    hidden: { opacity: 0, y: 10 },
  };

  return (
    <>
      <Head>
        <title>EMS - Leave</title>
      </Head>
      <div className="min-h-screen p-5 bg-gradient-to-b from-gray-800 to-black bg-opacity-20 rounded-lg">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
          <h1 className="text-3xl md:text-4xl font-semibold text-white">
            Leave
          </h1>
          <Link scroll={false} href="/leave/new">
            <button className="mt-2 md:mt-0 px-4 py-2 font-bold text-white bg-gradient-to-r from-green-400 to-green-600 rounded-2xl shadow-lg transition-transform transform hover:scale-105 hover:shadow-xl">
              New Leave Request
            </button>
          </Link>
        </div>
        <div className="mb-4">
          <h2 className="text-white font-bold">
            Leave Balance: Granted: {balance} days | Used: {totalLeaveDuration} days |{" "}
            Remaining: {balance - totalLeaveDuration} days
          </h2>
        </div>
        {leaveRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 text-center text-neutral-400 mt-10">
            <Icon icon="ph:airplane-takeoff-light" width="8em" />
            <h2 className="text-2xl font-semibold text-white">No leave requests</h2>
            <p className="text-neutral-500">
              Click &apos;New Leave Request&apos; in the top right to create one.
            </p>
          </div>
        ) : (
          <motion.div
            className="flex flex-col gap-2"
            initial="hidden"
            animate="visible"
            variants={listVariants}
          >
            {leaveRequests.map((leave) => (
              <motion.div key={leave.id} variants={itemVariants}>
                <LeaveCard leaveData={leave} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </>
  );
}
