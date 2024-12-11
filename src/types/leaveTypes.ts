// src/types/leaveTypes.ts
import { LeaveRequest } from "@prisma/client";

export type LeaveRequestWithUser  = LeaveRequest & {
  User: {
    firstName: string;
    lastName: string;
    department: string;
    position: string;
  };
};