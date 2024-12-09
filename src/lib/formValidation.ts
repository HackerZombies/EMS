// @/lib/formValidation.ts

interface FormData {
    firstName: string;
    lastName: string;
    password: string;
    email: string;
    phoneNumber: string;
    dob: string;
    address: string;
    qualifications: string;
    department: string;
    position: string;
  }
  
  export function validateForm(formData: FormData): { [key: string]: string } {
    const errors: { [key: string]: string } = {};
  
    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    }
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters long";
    }
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      errors.email = "Invalid email address";
    }
    if (!formData.phoneNumber) {
      errors.phoneNumber = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phoneNumber)) {
      errors.phoneNumber = "Invalid phone number (should be 10 digits)";
    }
    if (!formData.dob) {
      errors.dob = "Date of birth is required";
    } else {
      const dobDate = new Date(formData.dob);
      const today = new Date();
      const age = today.getFullYear() - dobDate.getFullYear();
      if (age < 18) {
        errors.dob = "Employee must be at least 18 years old";
      }
    }
    if (!formData.address.trim()) {
      errors.address = "Address is required";
    }
    if (!formData.qualifications.trim()) {
      errors.qualifications = "Qualifications are required";
    }
    if (!formData.department.trim()) {
      errors.department = "Department is required";
    }
    if (!formData.position.trim()) {
      errors.position = "Position is required";
    }
  
    return errors;
  }