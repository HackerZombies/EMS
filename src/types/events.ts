// src/types/events.ts

export interface Event {
  id: string;
  type: "Announcements" | "Help" | "Leave" | "Documents" | "Attendance";
  icon: string;
  date: string; // ISO string
  title: string;
  text: string;
  linkTo: string;
}
