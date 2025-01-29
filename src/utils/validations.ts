// validations.ts

import { CreateUserFormData } from "@/pages/add-New-Employee";

export function validatePersonalInfo(data: CreateUserFormData): string[] {
  const errors: string[] = [];

  if (!data.firstName.trim()) {
    errors.push("First Name is required.");
  }
  if (!data.lastName.trim()) {
    errors.push("Last Name is required.");
  }
  if (!data.email.trim()) {
    errors.push("Email is required.");
  } else {
    // Basic email pattern check
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(data.email)) {
      errors.push("Please enter a valid email address.");
    }
  }
  if (!data.phoneNumber.trim()) {
    errors.push("Phone Number is required.");
  }
  if (!data.dob.trim()) {
    errors.push("Date of Birth is required.");
  }

  // Add any other personal info checks...
  return errors;
}

export function validateJobDetails(data: CreateUserFormData): string[] {
  const errors: string[] = [];

  if (!data.role.trim()) {
    errors.push("Role is required.");
  }
  if (!data.department.trim()) {
    errors.push("Department is required.");
  }
  if (!data.position.trim()) {
    errors.push("Position is required.");
  }
  if (!data.employmentType.trim()) {
    errors.push("Employment type is required.");
  }
  if (!data.joiningDate.trim()) {
    errors.push("Joining date is required.");
  }

  // Add any other job detail checks...
  return errors;
}

export function validateQualifications(data: CreateUserFormData): string[] {
  const errors: string[] = [];

  // For example, if you want at least one qualification:
  if (!data.qualifications || data.qualifications.length === 0) {
    // errors.push("At least one qualification is required.");
  }

  // You can add more checks for experiences or certifications as well
  return errors;
}

export function validateDocuments(data: CreateUserFormData): string[] {
  const errors: string[] = [];

  // Example: if you want to ensure at least one document is uploaded
  // const allDocs = Object.values(data.documents).flat();
  // if (!allDocs.length) {
  //   errors.push("You must upload at least one document.");
  // }

  return errors;
}