"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  UserCircleIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  DocumentPlusIcon,
} from "@heroicons/react/24/outline";

import PersonalInfoForm from "@/components/add-New-Employee/PersonalInfoForm";
import JobDetailsForm from "@/components/add-New-Employee/JobDetailsForm";
import QualificationsForm, {
  QualificationsFormData,
} from "@/components/add-New-Employee/QualificationsForm";
import DocumentsForm, {
  UploadedDocuments,
  UploadedDocument,
} from "@/components/add-New-Employee/DocumentsForm";

import {
  validatePersonalInfo,
  validateJobDetails,
  validateQualifications,
  validateDocuments,
} from "@/utils/validations";

// Import shadcn/ui dialog and progress
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

// 1. Define the Address interface (proper model shape)
export interface Address {
  flat: string;
  street: string;
  landmark: string;
  city: string;
  district: string;
  state: string;
  pin: string;
}

// 2. CreateUserFormData now uses Address objects for addresses
export interface CreateUserFormData {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dob: string;
  // Residential & Permanent addresses as proper objects
  residentialAddress: Address;
  permanentAddress: Address;
  nationality: string;
  gender: string;
  bloodGroup: string;
  role: string;
  department: string;
  position: string;
  workLocation: string;
  employmentType: string;
  joiningDate: string;
  emergencyContacts: any[];
  qualifications: QualificationsFormData["qualifications"];
  experiences: any[];
  certifications: any[];
  documents: UploadedDocuments;
  profileImageUrl: string;
  avatarImageUrl: string;
  // Used for "Same as Residential" checkbox
  sameAsResidential?: boolean;
}

export default function CreateUserPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Notification states
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  // Authorization logic
  const allowedRoles = ["ADMIN"];
  useEffect(() => {
    if (status !== "loading" && (!session || !session.user || !allowedRoles.includes(session.user.role))) {
      router.push("/unauthorized");
    }
  }, [session, status, router]);

  const [activeTab, setActiveTab] = useState("personal");

  // Initialize UploadedDocuments with all categories as empty arrays
  const initialUploadedDocuments: UploadedDocuments = {
    aadhaar_card: [],
    pan_card: [],
    passport: [],
    voter_id: [],
    driving_license: [],
    other_identity_documents: [],
    tenth_marksheet: [],
    twelfth_marksheet: [],
    graduation_degree: [],
    masters_degree: [],
    postgraduate_degree: [],
    diploma_certificate: [],
    educational_transcript: [],
    other_educational_documents: [],
    resume: [],
    previous_employment_certificate: [],
    experience_letter: [],
    relieving_letter: [],
    salary_slip: [],
    offer_letter: [],
    appointment_letter: [],
    employment_contract: [],
    other_employment_documents: [],
    professional_certifications: [],
    language_certifications: [],
    technical_certifications: [],
    industry_specific_certifications: [],
    other_certifications: [],
    utility_bill: [],
    rental_agreement: [],
    bank_statement: [],
    passport_copy: [],
    ration_card: [],
    lease_agreement: [],
    other_address_proof: [],
    portfolio: [],
    project_documents: [],
    skill_certificates: [],
    training_completion_certificates: [],
    other_skills_documents: [],
    form_16: [],
    it_return: [],
    bank_passbook: [],
    canceled_cheque: [],
    salary_certificate: [],
    other_financial_documents: [],
    health_insurance_policy: [],
    life_insurance_policy: [],
    motor_insurance: [],
    other_insurance_documents: [],
    nda_agreement: [],
    legal_contracts: [],
    court_clearance_certificate: [],
    police_clearance_certificate: [],
    other_legal_documents: [],
    engineering_license: [],
    medical_license: [],
    teaching_license: [],
    other_professional_licenses: [],
    signed_policies: [],
    employee_handbook: [],
    non_disclosure_agreement: [],
    non_compete_agreement: [],
    other_company_documents: [],
    spouse_aadhaar_card: [],
    spouse_pan_card: [],
    child_birth_certificate: [],
    child_school_certificate: [],
    other_dependents_documents: [],
    photo: [],
    medical_certificate: [],
    reference_letters: [],
    birth_certificate: [],
    marriage_certificate: [],
    resignation_letter: [],
    other_documents: [],
  };

  // 3. Initialize formData, including proper address objects
  const [formData, setFormData] = useState<CreateUserFormData>({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    dob: "",
    residentialAddress: {
      flat: "",
      street: "",
      landmark: "",
      city: "",
      district: "",
      state: "",
      pin: "",
    },
    permanentAddress: {
      flat: "",
      street: "",
      landmark: "",
      city: "",
      district: "",
      state: "",
      pin: "",
    },
    nationality: "",
    gender: "",
    bloodGroup: "",
    role: "",
    department: "",
    position: "",
    workLocation: "",
    employmentType: "",
    joiningDate: "",
    emergencyContacts: [],
    qualifications: [],
    experiences: [],
    certifications: [],
    documents: initialUploadedDocuments,
    profileImageUrl: "",
    avatarImageUrl: "",
    sameAsResidential: false,
  });

  // Enhanced validation for the current tab, memoized to prevent unnecessary re-renders
  const validateCurrentTab = useCallback((): boolean => {
    let errors: string[] = [];
    if (activeTab === "personal") {
      errors = validatePersonalInfo(formData);
    } else if (activeTab === "job") {
      errors = validateJobDetails(formData);
    } else if (activeTab === "qualifications") {
      errors = validateQualifications(formData);
    } else if (activeTab === "documents") {
      errors = validateDocuments(formData);
    }
    if (errors.length > 0) {
      setErrorMessage(errors.join(" "));
      return false;
    }
    setErrorMessage(null);
    return true;
  }, [activeTab, formData]);

  // Memoized tab change handler
  const handleTabChange = useCallback((direction: "next" | "prev") => {
    const tabs = ["personal", "job", "qualifications", "documents"];
    const currentIndex = tabs.indexOf(activeTab);
    if (direction === "next") {
      if (!validateCurrentTab()) return;
      if (currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1]);
      }
    } else {
      if (currentIndex > 0) {
        setActiveTab(tabs[currentIndex - 1]);
      }
    }
  }, [activeTab, validateCurrentTab]);

  // Refactored helper function to build FormData from formData state
  const buildFormData = useCallback((): FormData => {
    const formDataToSend = new FormData();
    // Append simple fields
    const simpleFields: Array<keyof CreateUserFormData> = [
      "firstName",
      "middleName",
      "lastName",
      "email",
      "phoneNumber",
      "dob",
      "nationality",
      "gender",
      "bloodGroup",
      "role",
      "department",
      "position",
      "workLocation",
      "employmentType",
      "joiningDate",
      "profileImageUrl",
      "avatarImageUrl",
      "sameAsResidential",
    ];
    simpleFields.forEach((field) => {
      const value = formData[field];
      if (value !== undefined && value !== null) {
        formDataToSend.append(field, String(value));
      }
    });
    // Append address fields individually
    Object.entries(formData.residentialAddress).forEach(([key, value]) => {
      formDataToSend.append(`residentialAddress_${key}`, value);
    });
    Object.entries(formData.permanentAddress).forEach(([key, value]) => {
      formDataToSend.append(`permanentAddress_${key}`, value);
    });
    // Append array fields as JSON strings
    const arrayFields: Array<keyof CreateUserFormData> = [
      "emergencyContacts",
      "qualifications",
      "experiences",
      "certifications",
    ];
    arrayFields.forEach((field) => {
      const value = formData[field];
      if (Array.isArray(value)) {
        formDataToSend.append(field, JSON.stringify(value));
      }
    });
    // Append documents if they exist
    Object.entries(formData.documents).forEach(([docType, docsArray]) => {
      (docsArray as UploadedDocument[]).forEach((doc: UploadedDocument, index: number) => {
        formDataToSend.append(`documents[${docType}][${index}][file]`, doc.file);
        formDataToSend.append(`documents[${docType}][${index}][displayName]`, doc.displayName);
        formDataToSend.append(`documents[${docType}][${index}][category]`, docType);
        formDataToSend.append(`documents[${docType}][${index}][id]`, doc.id);
      });
    });
    return formDataToSend;
  }, [formData]);

  // Memoized submit handler with enhanced error handling and UX
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    // Final re-validation across all tabs
    const allErrors = [
      ...validatePersonalInfo(formData),
      ...validateJobDetails(formData),
      ...validateQualifications(formData),
      ...validateDocuments(formData),
    ];
    if (allErrors.length > 0) {
      setErrorMessage(allErrors.join(" "));
      return;
    }
    setIsSubmitting(true);
    setProgress(0);

    // Simulate progress (if you later integrate real progress tracking, replace this)
    let currentProgress = 0;
    const fakeProgressInterval = setInterval(() => {
      currentProgress += 20;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(fakeProgressInterval);
      }
      setProgress(currentProgress);
    }, 100);

    try {
      const formDataToSend = buildFormData();
      const response = await fetch("/api/users/newUser", {
        method: "POST",
        body: formDataToSend,
      });
      setProgress(100);
      if (response.status === 409) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Conflict: User may already exist.");
      }
      if (!response.ok) {
        throw new Error("Failed to create user");
      }
      const data = await response.json();
      setSuccessMessage(`New user created with username: ${data.username}`);
      setTimeout(() => {
        setIsSubmitting(false);
        router.push(`/manage/users/user/${data.username}`);
      }, 800);
    } catch (error: any) {
      console.error("Error creating user:", error);
      setErrorMessage(error.message || "Failed to create user. Please try again.");
      setIsSubmitting(false);
    }
  }, [formData, buildFormData, router]);

  return (
    <div className="container mx-auto p-4">
      {/* Notification Messages */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 text-green-800 rounded">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-100 text-red-800 rounded">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="personal" disabled={isSubmitting}>
                  <UserCircleIcon className="w-5 h-5 mr-2" />
                  Personal Info
                </TabsTrigger>
                <TabsTrigger value="job" disabled={isSubmitting}>
                  <BriefcaseIcon className="w-5 h-5 mr-2" />
                  Job Details
                </TabsTrigger>
                <TabsTrigger value="qualifications" disabled={isSubmitting}>
                  <AcademicCapIcon className="w-5 h-5 mr-2" />
                  Qualifications
                </TabsTrigger>
                <TabsTrigger value="documents" disabled={isSubmitting}>
                  <DocumentPlusIcon className="w-5 h-5 mr-2" />
                  Documents
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personal">
                <PersonalInfoForm formData={formData} setFormData={setFormData} />
              </TabsContent>
              <TabsContent value="job">
                <JobDetailsForm formData={formData} setFormData={setFormData} />
              </TabsContent>
              <TabsContent value="qualifications">
                <QualificationsForm formData={formData} setFormData={setFormData} />
              </TabsContent>
              <TabsContent value="documents">
                <DocumentsForm
                  uploadedDocuments={formData.documents}
                  setUploadedDocuments={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      documents:
                        typeof value === "function" ? value(prev.documents) : value,
                    }))
                  }
                />
              </TabsContent>
            </Tabs>

            <div className="mt-6 flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleTabChange("prev")}
                disabled={activeTab === "personal" || isSubmitting}
              >
                Previous
              </Button>

              <Button
                type="button"
                onClick={() => handleTabChange("next")}
                disabled={activeTab === "documents" || isSubmitting}
              >
                Next
              </Button>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create User"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Dialog with progress bar while submitting */}
      <Dialog open={isSubmitting}>
        <DialogContent className="text-center space-y-4">
          <DialogHeader>
            <DialogTitle>Creating User...</DialogTitle>
            <DialogDescription>
              Please wait while we submit your data.
            </DialogDescription>
          </DialogHeader>
          <Progress value={progress} className="w-full" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
