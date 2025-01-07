// lib/formValidations.ts
import { UserFormData, FormErrors } from "@/lib/types";

/** Validates the General Info tab. Adjust "required" logic as needed. */
export function validateGeneralInfo(formData: UserFormData): FormErrors {
  const errors: FormErrors = {};

  if (!formData.firstName.trim()) {
    errors.firstName = "First name is required.";
  }
  // middleName optional
  if (!formData.lastName.trim()) {
    errors.lastName = "Last name is required.";
  }
  if (!formData.dob.trim()) {
    errors.dob = "Date of birth is required.";
  }
  if (!formData.phoneNumber.trim()) {
    errors.phoneNumber = "Phone number is required.";
  }
  if (!formData.email.trim()) {
    errors.email = "Email is required.";
  }
  if (!formData.residentialAddress.trim()) {
    errors.residentialAddress = "Residential address is required.";
  }
  if (!formData.permanentAddress.trim()) {
    errors.permanentAddress = "Permanent address is required.";
  }
  if (!formData.nationality.trim()) {
    errors.nationality = "Nationality is required.";
  }
  if (!formData.gender) {
    errors.gender = "Gender is required.";
  }
  if (!formData.bloodGroup) {
    errors.bloodGroup = "Blood group is required.";
  }

  // Check emergency contacts
  if (formData.emergencyContacts.length === 0) {
    errors.emergencyContacts = "At least one emergency contact is required.";
  } else {
    formData.emergencyContacts.forEach((contact, index) => {
      const contactErrors: any = {};
      if (!contact.name.trim()) {
        contactErrors[`name_${index}`] = "Contact name is required.";
      }
      if (!contact.relationship.trim()) {
        contactErrors[`relationship_${index}`] = "Relationship is required.";
      }
      if (!contact.phoneNumber.trim()) {
        contactErrors[`phoneNumber_${index}`] = "Contact phone number is required.";
      }
      if (Object.keys(contactErrors).length > 0) {
        errors.emergencyContacts = errors.emergencyContacts || {};
        (errors.emergencyContacts as any)[index] = contactErrors;
      }
    });
  }

  return errors;
}

/** Validates the Job Details tab. Here we add workLocation, employmentType, joiningDate. */
export function validateJobDetails(formData: UserFormData): FormErrors {
  const errors: FormErrors = {};

  if (!formData.department.trim()) {
    errors.department = "Department is required.";
  }
  if (!formData.position.trim()) {
    errors.position = "Position is required.";
  }
  if (!formData.role.trim()) {
    errors.role = "Role is required.";
  }

  // If you'd like them required:
  // if (!formData.workLocation.trim()) {
  //   errors.workLocation = "Work location is required.";
  // }
  // if (!formData.joiningDate.trim()) {
  //   errors.joiningDate = "Joining date is required.";
  // }
  // if (!formData.employmentType) {
  //   errors.employmentType = "Employment Type is required.";
  // }

  return errors;
}

/** Validates the Qualifications/Experiences/Certifications tab. */
export function validateQualificationsTab(formData: UserFormData): FormErrors {
  const errors: FormErrors = {};

  // Qualifications
  if (formData.qualifications.length === 0) {
    errors.qualifications = "At least one qualification is required.";
  } else {
    formData.qualifications.forEach((qualification, index) => {
      const qualificationErrors: any = {};
      if (!qualification.name.trim()) {
        qualificationErrors[`name_${index}`] = "Qualification name is required.";
      }
      if (!qualification.level) {
        qualificationErrors[`level_${index}`] = "Qualification level is required.";
      }
      if (!qualification.institution.trim()) {
        qualificationErrors[`institution_${index}`] = "Institution is required.";
      }
      // specializations optional

      if (Object.keys(qualificationErrors).length > 0) {
        errors.qualifications = errors.qualifications || {};
        (errors.qualifications as any)[index] = qualificationErrors;
      }
    });
  }

  // Experiences
  formData.experiences.forEach((exp, index) => {
    const expErrors: any = {};
    if (!exp.jobTitle.trim()) {
      expErrors[`jobTitle_${index}`] = "Job title is required.";
    }
    if (!exp.company.trim()) {
      expErrors[`company_${index}`] = "Company is required.";
    }
    if (!exp.startDate.trim()) {
      expErrors[`startDate_${index}`] = "Start date is required.";
    }
    // endDate optional
    if (Object.keys(expErrors).length > 0) {
      errors.experiences = errors.experiences || {};
      (errors.experiences as any)[index] = expErrors;
    }
  });

  // Certifications
  formData.certifications.forEach((cert, index) => {
    const certErrors: any = {};
    if (!cert.name.trim()) {
      certErrors[`name_${index}`] = "Certification name is required.";
    }
    if (!cert.issuingAuthority.trim()) {
      certErrors[`issuingAuthority_${index}`] = "Issuing authority is required.";
    }
    if (Object.keys(certErrors).length > 0) {
      errors.certifications = errors.certifications || {};
      (errors.certifications as any)[index] = certErrors;
    }
  });

  return errors;
}
