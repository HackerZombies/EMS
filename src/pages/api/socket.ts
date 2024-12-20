import { Server } from "socket.io";
import prisma from "@/lib/prisma";

let io: Server | undefined;

const SocketHandler = (req: any, res: any) => {
  if (res.socket.server.io) {
    console.log("Socket.IO server is already running");
    io = res.socket.server.io as Server; // Explicitly assign the existing instance
    res.end();
    return;
  }

  console.log("Starting Socket.IO server...");
  io = new Server(res.socket.server, {
    path: "/api/socket",
    cors: {
      origin: "*", // Adjust for production
      methods: ["GET", "POST"],
    },
  });

  res.socket.server.io = io;

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Emit attendance data on connection
    const sendAttendanceData = async () => {
      try {
        const attendanceData = await prisma.attendance.findMany({
          include: {
            user: {
              select: { username: true, firstName: true, lastName: true, role: true },
            },
          },
        });
        io?.emit("attendance-update", attendanceData); // Use optional chaining
      } catch (error) {
        console.error("Error fetching attendance data:", error);
      }
    };

    sendAttendanceData();

    // Listen for manual data refresh requests
    socket.on("refresh-attendance", () => {
      sendAttendanceData();
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  res.end();
};

// Utility function to emit attendance updates
export const emitAttendanceUpdate = async () => {
  if (!io) {
    console.error("Socket.IO server is not initialized");
    return; // Exit gracefully
  }
  try {
    const attendanceData = await prisma.attendance.findMany({
      include: {
        user: {
          select: { username: true, firstName: true, lastName: true, role: true },
        },
      },
    });
    io.emit("attendance-update", attendanceData); // No error here since io is checked above
  } catch (error) {
    console.error("Error emitting attendance update:", error);
  }
};

export default SocketHandler;
