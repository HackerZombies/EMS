import Head from "next/head";
import { SetStateAction, useEffect, useState } from "react";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { Icon } from "@iconify/react";
import Router from "next/router";
import BackButton from "@/components/BackButton";
import { useSession } from "next-auth/react";
import Modal from "@/components/Modal";

export default function NewLeaveRequest() {
  const { data: session } = useSession();
  const [balance, setBalance] = useState(0);
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");

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

    fetchBalance();
  }, [session]);

  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const calculateDaysRequested = () => {
    if (!startDate || !endDate) {
      return 0;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    const difference = end.getTime() - start.getTime();
    const days = Math.ceil(difference / (1000 * 60 * 60 * 24));

    return days > 0 ? days : 0;
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

    const formattedStartDate1 = new Date(startDate);
    const formattedEndDate1 = new Date(endDate);
    if (formattedStartDate1 >= formattedEndDate1) {
      setMessage("Start date must be before end date.");
      setVisible(true);
      return;
    }

    if (formattedStartDate1 < new Date()) {
      setMessage("Start date must not be in the past.");
      setVisible(true);
      return;
    }

    const formattedStartDate = new Date(startDate + "T00:00:00");
    const formattedEndDate = new Date(endDate + "T00:00:00");
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
      <div className="flex flex-col gap-3 p-5 bg-gray-900 rounded-lg shadow-lg">
        <BackButton />
        <h1 className="text-4xl font-semibold text-white">New Leave Request</h1>
        <div className="flex flex-col gap-5">
          <label className="flex flex-col text-left text-white">
            Reason:
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="custom-select rounded-xl bg-gray-800 bg-opacity-80 px-4 py-3 shadow-lg outline-none transition hover:bg-opacity-70 focus:ring-2 focus:ring-blue-500 border border-gray-600 text-white"
            >
              <option value="Empty">Select a Reason</option>
              <option value=" Holiday">Holiday</option>
              <option value="Sick">Sick Leave</option>
              <option value="Parental">Parental Leave</option>
              <option value="Study">Study Leave</option>
              <option value="Training">Training Leave</option>
              <option value="Family">Family Leave</option>
            </select>
          </label>

          <label className="flex flex-col text-left text-white">
            Start Date:
            <Input
              type="date"
              value={startDate}
              onChange={(e: { target: { value: SetStateAction<string> } }) =>
                setStartDate(e.target.value)
              }
              className="rounded-xl bg-gray-800 bg-opacity-80 px-4 py-3 shadow-lg outline-none transition hover:bg-opacity-70 focus:ring-2 focus:ring-blue-500 border border-gray-600 text-white"
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
              className="rounded-xl bg-gray-800 bg-opacity-80 px-4 py-3 shadow-lg outline-none transition hover:bg-opacity-70 focus:ring-2 focus:ring-blue-500 border border-gray-600 text-white"
            />
          </label>

          <p className={calculateDaysRequested() > balance ? "text-red-500" : "text-white"}>
            Days Requested: {calculateDaysRequested()}
          </p>
          {calculateDaysRequested() > balance && (
            <p className="text-red-500">Leave Balance Limit Reached</p>
          )}
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white">
            Submit <Icon icon="ph:arrow-right-bold" />
          </Button>
        </div>
      </div>
      <Modal visible={visible} setVisible={setVisible} title="Oops..." className="bg-gray-800 text-white">
        {message}
      </Modal>
    </>
  );
}