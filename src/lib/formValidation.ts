// @/lib/formValidation.ts

export interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dob: string;
  address: string;
  qualifications: string;
  department: string;
  position: string;
  role: string;
}

interface FormErrors {
  [key: string]: string;
}

export function validateForm(formData: FormData): FormErrors {
  const errors: FormErrors = {};

  // First Name Validation
  if (!formData.firstName.trim()) {
    errors.firstName = "First name is required.";
  } else if (formData.firstName.length < 2) {
    errors.firstName = "First name must be at least 2 characters.";
  }

  // Last Name Validation
  if (!formData.lastName.trim()) {
    errors.lastName = "Last name is required.";
  } else if (formData.lastName.length < 2) {
    errors.lastName = "Last name must be at least 2 characters.";
  }

  // Email Validation
  if (!formData.email.trim()) {
    errors.email = "Email is required.";
  } else if (!validateEmail(formData.email)) {
    errors.email = "Invalid email format.";
  }

  // Mobile Number Validation
  if (!formData.phoneNumber.trim()) {
    errors.phoneNumber = "Mobile number is required.";
  } else if (!validatePhoneNumber(formData.phoneNumber)) {
    errors.phoneNumber = "Invalid mobile number format.";
  }

  // Date of Birth Validation
  if (!formData.dob.trim()) {
    errors.dob = "Date of birth is required.";
  } else if (!validateDate(formData.dob)) {
    errors.dob = "Invalid date format.";
  }

  // Address Validation
  if (!formData.address.trim()) {
    errors.address = "Address is required.";
  }

  // Qualifications Validation
  if (!formData.qualifications.trim()) {
    errors.qualifications = "Qualifications are required.";
  }

  // Department Validation
  if (!formData.department.trim()) {
    errors.department = "Department is required.";
  }

  // Position Validation
  if (!formData.position.trim()) {
    errors.position = "Position is required.";
  }

  // Role Validation
  if (!formData.role.trim()) {
    errors.role = "User role is required.";
  }

  return errors;
}

// Helper Functions

function validateEmail(email: string): boolean {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).toLowerCase());
}

function validatePhoneNumber(phone: string): boolean {
  const re = /^\+?[1-9]\d{1,14}$/; // E.164 format
  return re.test(phone);
}

function validateDate(date: string): boolean {
  const timestamp = Date.parse(date);
  return !isNaN(timestamp);
}