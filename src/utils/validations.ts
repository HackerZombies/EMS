import { CreateUserFormData } from "@/pages/add-New-Employee";

/** Utility to check if a string is a valid date (e.g. "2023-01-01"). */
function isValidDate(dateString: string): boolean {
  if (!dateString.trim()) return false;
  const timestamp = Date.parse(dateString);
  return !Number.isNaN(timestamp);
}

/** Check if start <= end (treat empty end date as optional). */
function isStartBeforeEnd(start: string, end: string): boolean {
  if (!start.trim()) return true;
  if (!end.trim()) return true;
  return new Date(start) <= new Date(end);
}

/**
 * Example helper to see if an Address object is basically “empty” or not.
 * You can adjust the logic (e.g. requiring *some* fields or *all* fields).
 */
function isAddressEmpty(addressObj: CreateUserFormData["residentialAddress"]): boolean {
  // Simple approach: if *all* fields are empty strings => “empty”
  const values = Object.values(addressObj); 
  // e.g. ["", "", "", "", "", "", ""]
  return values.every((field) => !field.trim());
}

/** 1. Personal Info Validation */
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
  } else {
    if (!isValidDate(data.dob)) {
      errors.push("Date of Birth must be a valid date.");
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Address Checks (since they're now objects)
  // ─────────────────────────────────────────────────────────────────

  // Example: require that residentialAddress not be completely empty
  if (isAddressEmpty(data.residentialAddress)) {
    errors.push("Residential Address is required.");
  }

  // If "sameAsResidential" is false, then permanentAddress must not be empty
  if (!data.sameAsResidential && isAddressEmpty(data.permanentAddress)) {
    errors.push("Permanent Address is required if not same as Residential.");
  }

  // If your business logic requires *each field* in the address to be filled,
  // you can check them individually or tweak the isAddressEmpty() logic.

  // Example: If you also want nationality/gender/bloodGroup required:
  /*
  if (!data.nationality.trim()) {
    errors.push("Nationality is required.");
  }
  if (!data.gender.trim()) {
    errors.push("Gender is required.");
  }
  if (!data.bloodGroup.trim()) {
    errors.push("Blood Group is required.");
  }
  */

  return errors;
}

/** 2. Job Details Validation */
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
  } else {
    if (!isValidDate(data.joiningDate)) {
      errors.push("Joining date must be a valid date.");
    }
  }

  if (!data.workLocation.trim()) {
    errors.push("Work Location is required.");
  }

  return errors;
}

/** 3. Qualifications / Experiences / Certifications */
export function validateQualifications(data: CreateUserFormData): string[] {
  const errors: string[] = [];

  // Qualifications
  data.qualifications.forEach((q, idx) => {
    if (!q.level.trim()) {
      errors.push(`Qualification #${idx + 1}: Level is required.`);
    }
    if (!q.name.trim()) {
      errors.push(`Qualification #${idx + 1}: Name is required.`);
    }
    if (q.startDate.trim() && !isValidDate(q.startDate)) {
      errors.push(`Qualification #${idx + 1}: Start date is invalid.`);
    }
    if (q.endDate.trim() && !isValidDate(q.endDate)) {
      errors.push(`Qualification #${idx + 1}: End date is invalid.`);
    }
    if (!isStartBeforeEnd(q.startDate, q.endDate)) {
      errors.push(`Qualification #${idx + 1}: End date must be after start date.`);
    }
  });

  // Experiences
  data.experiences.forEach((exp, idx) => {
    if (!exp.jobTitle.trim()) {
      errors.push(`Experience #${idx + 1}: Job Title is required.`);
    }
    if (!exp.company.trim()) {
      errors.push(`Experience #${idx + 1}: Company is required.`);
    }
    if (!exp.startDate.trim()) {
      errors.push(`Experience #${idx + 1}: Start date is required.`);
    } else if (!isValidDate(exp.startDate)) {
      errors.push(`Experience #${idx + 1}: Start date is invalid.`);
    }
    if (exp.endDate.trim() && !isValidDate(exp.endDate)) {
      errors.push(`Experience #${idx + 1}: End date is invalid.`);
    }
    if (!isStartBeforeEnd(exp.startDate, exp.endDate)) {
      errors.push(`Experience #${idx + 1}: End date must be after start date.`);
    }
  });

  // Certifications
  data.certifications.forEach((cert, idx) => {
    if (!cert.name.trim()) {
      errors.push(`Certification #${idx + 1}: Name is required.`);
    }
    if (!cert.issuingAuthority.trim()) {
      errors.push(
        `Certification #${idx + 1}: Issuing Authority is required.`
      );
    }
    if (cert.issueDate.trim() && !isValidDate(cert.issueDate)) {
      errors.push(`Certification #${idx + 1}: Issue Date is invalid.`);
    }
    if (cert.expiryDate.trim() && !isValidDate(cert.expiryDate)) {
      errors.push(`Certification #${idx + 1}: Expiry Date is invalid.`);
    }
    if (!isStartBeforeEnd(cert.issueDate, cert.expiryDate)) {
      errors.push(
        `Certification #${idx + 1}: Expiry date must be after issue date.`
      );
    }
  });

  return errors;
}

/** 4. Documents Validation */
export function validateDocuments(data: CreateUserFormData): string[] {
  const errors: string[] = [];

  // example checks...
  return errors;
}
