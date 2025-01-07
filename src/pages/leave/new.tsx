import Head from "next/head";
import { SetStateAction, useEffect, useState } from "react";
import Input from "@/components/Input";
import Button from "@/components/Button";
import Router from "next/router";
import BackButton from "@/components/BackButton";
import { useSession } from "next-auth/react";
import Modal from "@/components/Modal";

const reasons = [
  { value: "Holiday", label: "Holiday" },
  { value: "Sick", label: "Sick Leave" },
  { value: "Parental", label: "Parental Leave" },
  { value: "Study", label: "Study Leave" },
  { value: "Training", label: "Training Leave" },
  { value: "Family", label: "Family Leave" },
];

export default function NewLeaveRequest() {
  const { data: session } = useSession();
  const [balance, setBalance] = useState(0);
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await fetch(
          `/api/leaveRequests/getleavebalance?username=${session?.user?.username}`,
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

    if (session?.user?.username) {
      fetchBalance();
    }
  }, [session]);

  const calculateDaysRequested = () => {
    if (!startDate || !endDate) {
      return 0;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    const difference = end.getTime() - start.getTime();
    const days = Math.ceil(difference / (1000 * 60 * 60 * 24));

    // Ensure that if the start date is the same as the end date, it counts as 1 day
    return days >= 0 ? days + 1 : 0; // Add 1 to include the end date
  };

  const handleSubmit = async () => {
    const daysRequested = calculateDaysRequested();
    if (daysRequested > balance) {
      setMessage("Days requested exceed remaining balance.");
      setVisible(true);
      return;
    }

    if (!reason || !startDate || !endDate) {
      setMessage("Please fill in all fields.");
      setVisible(true);
      return;
    }

    const formattedStartDate = new Date(startDate + "T00:00:00");
    const formattedEndDate = new Date(endDate + "T00:00:00");
    if (formattedStartDate >= formattedEndDate) {
      setMessage("Start date must be before end date.");
      setVisible(true);
      return;
    }

    if (formattedStartDate < new Date()) {
      setMessage("Start date must not be in the past.");
      setVisible(true);
      return;
    }

    const requestData = {
      reason,
      startDate: formattedStartDate.toISOString(),
      endDate: formattedEndDate.toISOString(),
      userUsername: session?.user?.username,
    };

    try {
      const response = await fetch("/api/leaveRequests/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      await Router.push("/leave");
    } catch (error) {
      console.error("There was an error!", error);
      alert("Please Try Again");
    }
  };

  return (
    <>
      <Head>
        <title>EMS - New Leave Request</title>
      </Head>
      <div className="relative flex flex-col items-center justify-center min-h-screen p-5 bg-black bg-opacity-70 rounded-lg shadow-lg transition-all duration-300">
        <div className="absolute top-5 left-5">
          <BackButton />
        </div>
        <h1 className="text-4xl font-bold text-white mb-6 animate-fade-in">New Leave Request</h1>
        <div className="flex flex-col gap-5 w-full max-w-md">
          <div className="flex flex-col text-left text-white">
            <span className="mb-2">Reason:</span>
            <div className="grid grid-cols-2 gap-4">
              {reasons.map((item) => (
                <div
                  key={item.value}
                  onClick={() => setReason(item.value)}
                  className={`p-4 rounded-lg cursor-pointer transition-transform transform hover:scale-105 ${
                    reason === item.value ? "bg-green-500 text-white" : "bg-gray-800 text-white"
                  }`}
                >
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          <label className="flex flex-col text-left text-white">
            Start Date:
            <Input
              type="date"
              value={startDate}
              onChange={(e: { target: { value: SetStateAction<string> } }) =>
                setStartDate(e.target.value)
              }
              className="rounded-xl bg-gray-800 bg-opacity-90 px-4 py-3 shadow-lg outline-none transition hover:bg-opacity-100 focus:ring-2 focus:ring-blue-500 border border-gray-600 text-white"
            />
          </label>

          <label className="flex flex-col text-left text-white">
            End Date:
            <Input
              type="date"
              value={endDate}
              onChange={(e: { target: { value: SetStateAction<string> } }) =>
                setEndDate(e.target.value)
              }
              className="rounded-xl bg-gray-800 bg-opacity-90 px-4 py-3 shadow-lg outline-none transition hover:bg-opacity-100 focus:ring-2 focus:ring-blue-500 border border-gray-600 text-white"
            />
          </label>

          <p className={calculateDaysRequested() > balance ? "text-red-500" : "text-white"}>
            Days Requested: {calculateDaysRequested()}
          </p>
          {calculateDaysRequested() > balance && (
            <p className="text-red-500">Leave Balance Limit Reached</p>
          )}
          <Button 
            onClick={handleSubmit} 
            className="p-4 bg-gradient-to-r from-green-400 to-green-600 text-white font-semibold rounded-lg shadow-md transition-transform duration-300 transform hover:scale-105"
          >
            Submit
          </Button>
        </div>
      </div>
      <Modal
        visible={visible}
        title="Oops..."
        onClose={() => setVisible(false)}
        className="bg-gray-800 text-white"
      >
        {message}
      </Modal>
    </>
  );
}