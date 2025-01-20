import Head from "next/head";
import { useEffect, useState, useMemo } from "react";
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
  { value: "Other", label: "Other" },
];

export default function NewLeaveRequest() {
  const { data: session } = useSession();
  const [balance, setBalance] = useState<number>(0);
  const [visible, setVisible] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");
  const [isSingleDay, setIsSingleDay] = useState<boolean>(true);

  // State for single-day leave
  const [singleDate, setSingleDate] = useState<string>("");

  // States for multi-day leave
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await fetch(
          `/api/leaveRequests/getleavebalance?username=${session?.user?.username}`
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

  // Helper function for inclusive day calculation using UTC dates for multi-day mode
  const calculateDaysBetween = (startStr: string, endStr: string): number => {
    if (!startStr || !endStr) return 0;
    const start = new Date(startStr + "T00:00:00Z");
    const end = new Date(endStr + "T00:00:00Z");
    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) return 0;
    return diffMs / (1000 * 60 * 60 * 24) + 1;
  };

  const daysRequested = useMemo(() => {
    if (isSingleDay) {
      return singleDate ? 1 : 0;
    } else {
      const days = calculateDaysBetween(startDate, endDate);
      return Math.floor(days);
    }
  }, [isSingleDay, singleDate, startDate, endDate]);

  // Function to check for duplicate or conflicting leave requests
  const checkDuplicateRequests = async (startISO: string, endISO: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `/api/leaveRequests/checkConflict?username=${session?.user?.username}&startDate=${startISO}&endDate=${endISO}`
      );
      if (!response.ok) {
        throw new Error("Failed to check for conflicts");
      }
      const data = await response.json();
      // Assume the API returns { hasConflict: boolean }
      return data.hasConflict;
    } catch (error) {
      console.error("Error checking conflicts:", error);
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!reason) {
      setMessage("Please select a reason.");
      setVisible(true);
      return;
    }
    
    // If "Other" is selected, validate custom reason length (10 words max)
    if (reason === "Other") {
      const wordCount = customReason.trim().split(/\s+/).length;
      if (wordCount > 10) {
        setMessage("Custom reason must be 10 words or less.");
        setVisible(true);
        return;
      }
      if (!customReason) {
        setMessage("Please provide a custom reason.");
        setVisible(true);
        return;
      }
    }

    if (isSingleDay) {
      if (!singleDate) {
        setMessage("Please select a date for your leave.");
        setVisible(true);
        return;
      }

      const formattedDate = new Date(singleDate + "T00:00:00");
      const today = new Date(new Date().toISOString().split("T")[0] + "T00:00:00");
      if (formattedDate < today) {
        setMessage("The selected date must not be in the past.");
        setVisible(true);
        return;
      }

      const startISO = formattedDate.toISOString();
      const endISO = startISO; // same day

      // Check for duplicate leave requests
      if (await checkDuplicateRequests(startISO, endISO)) {
        setMessage("A leave request for this date already exists.");
        setVisible(true);
        return;
      }

      const requestData = {
        reason: reason === "Other" ? customReason : reason,
        startDate: startISO,
        endDate: endISO,
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
    } else {
      if (!startDate || !endDate) {
        setMessage("Please fill in both start and end dates.");
        setVisible(true);
        return;
      }

      if (daysRequested > balance) {
        setMessage("Days requested exceed remaining balance.");
        setVisible(true);
        return;
      }

      const formattedStartDate = new Date(startDate + "T00:00:00");
      const formattedEndDate = new Date(endDate + "T00:00:00");

      if (formattedStartDate > formattedEndDate) {
        setMessage("Start date must be before or equal to end date.");
        setVisible(true);
        return;
      }

      const today = new Date(new Date().toISOString().split("T")[0] + "T00:00:00");
      if (formattedStartDate < today) {
        setMessage("Start date must not be in the past.");
        setVisible(true);
        return;
      }

      const startISO = formattedStartDate.toISOString();
      const endISO = formattedEndDate.toISOString();

      // Check for duplicate/conflicting leave requests
      if (await checkDuplicateRequests(startISO, endISO)) {
        setMessage("A leave request for these dates already exists.");
        setVisible(true);
        return;
      }

      const requestData = {
        reason: reason === "Other" ? customReason : reason,
        startDate: startISO,
        endDate: endISO,
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
        <h1 className="text-4xl font-bold text-white mb-6">New Leave Request</h1>
        <div className="flex flex-col gap-5 w-full max-w-md">
          {/* Reason Selection */}
          <div className="flex flex-col text-left text-white">
            <span className="mb-2">Reason:</span>
            <div className="grid grid-cols-2 gap-4">
              {reasons.map((item) => (
                <div
                  key={item.value}
                  onClick={() => setReason(item.value)}
                  className={`p-4 rounded-lg cursor-pointer transition-transform transform hover:scale-105 ${
                    reason === item.value
                      ? "bg-green-500 text-white"
                      : "bg-gray-800 text-white"
                  }`}
                >
                  {item.label}
                </div>
              ))}
            </div>
            {/* Custom reason textarea if "Other" is selected */}
            {reason === "Other" && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Provide custom reason (max 10 words)"
                className="mt-2 p-2 rounded bg-gray-700 text-white"
                maxLength={100} // rough limit; adjust as needed
              />
            )}
          </div>

          {/* Toggle for Single-Day vs Multi-Day Leave */}
          <label className="flex items-center text-white">
            <input
              type="checkbox"
              checked={isSingleDay}
              onChange={() => setIsSingleDay(!isSingleDay)}
              className="mr-2"
            />
            Single-Day Leave
          </label>

          {/* Conditional Rendering of Date Inputs */}
          {isSingleDay ? (
            <label className="flex flex-col text-left text-white">
              Select Date:
              <Input
                type="date"
                value={singleDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSingleDate(e.target.value)
                }
                className="rounded-xl bg-gray-800 bg-opacity-90 px-4 py-3 shadow-lg outline-none transition hover:bg-opacity-100 focus:ring-2 focus:ring-blue-500 border border-gray-600 text-white"
              />
            </label>
          ) : (
            <>
              <label className="flex flex-col text-left text-white">
                Start Date:
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEndDate(e.target.value)
                  }
                  className="rounded-xl bg-gray-800 bg-opacity-90 px-4 py-3 shadow-lg outline-none transition hover:bg-opacity-100 focus:ring-2 focus:ring-blue-500 border border-gray-600 text-white"
                />
              </label>
            </>
          )}

          <p className={daysRequested > balance ? "text-red-500" : "text-white"}>
            Days Requested: {daysRequested}
          </p>
          {daysRequested > balance && (
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
