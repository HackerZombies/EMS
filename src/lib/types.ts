// lib/types.ts

// Prisma-like Enums
export type QualificationLevel = "Schooling" | "Graduate" | "Masters" | "Doctorate" | "Other";
export type UserRole = "EMPLOYEE" | "HR" | "ADMIN";
export type Gender = "M" | "F" | "Other";
export type BloodGroup =
  | "A_POSITIVE"
  | "A_NEGATIVE"
  | "B_POSITIVE"
  | "B_NEGATIVE"
  | "AB_POSITIVE"
  | "AB_NEGATIVE"
  | "O_POSITIVE"
  | "O_NEGATIVE"
  | "UNKNOWN";
export type EmploymentType =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "INTERN"
  | "OTHER";

// Basic data interfaces
export interface EmergencyContactData {
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
}

export interface QualificationData {
  name: string;
  level: QualificationLevel;
  specializations: string[];
  institution: string;
}

export interface ExperienceData {
  jobTitle: string;
  company: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

export interface CertificationData {
  name: string;
  issuingAuthority: string;
  licenseNumber?: string;
  issueDate?: string;
  expiryDate?: string;
}

// Main user form data
export interface UserFormData {
  // General Info
  firstName: string;
  middleName: string;
  lastName: string;
  dob: string;
  phoneNumber: string;
  email: string;
  residentialAddress: string;
  permanentAddress: string;
  nationality: string;
  gender: Gender;
  bloodGroup: BloodGroup;

  // Job Details
  role: UserRole;
  department: string;
  position: string;
  workLocation: string;       // newly added
  employmentType: EmploymentType; // newly added
  joiningDate: string;        // newly added (string for date input)

  // Arrays
  emergencyContacts: EmergencyContactData[];
  qualifications: QualificationData[];
  experiences: ExperienceData[];
  certifications: CertificationData[];

  // Files
  employeeDocuments: File[];
}

// Validation error shape
export interface FormErrors {
  [key: string]: string | any;
}
// /types.ts (or anywhere else)
import { User, AuditLog, Attendance } from "@prisma/client";

/**
 * Extends User to include relevant relations for sorting / badging
 */
export type UserWithExtras = User & {
  auditLogs: AuditLog[];
  attendances: Attendance[];
};
