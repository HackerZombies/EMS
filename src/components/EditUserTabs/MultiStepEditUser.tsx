// src/components/EditUserTabs/MultiStepEditUser.tsx

"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import isEqual from "lodash.isequal";
import cloneDeep from "lodash.clonedeep"; // Import cloneDeep for deep cloning
import PersonalInfoForm, { PersonalInfoData } from "./GeneralInfo"; // Adjusted import
import JobDetailsForm, { JobDetailsData } from "./JobDetails"; // Adjusted import
import QualificationsForm, { QualificationsData } from "./Qualifications"; // Adjusted import
import DocumentsSection from "./Documents"; // Adjusted import
import { TrashIcon, ExclamationTriangleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

import { processAuditLogs } from "@/lib/processAuditLogs"; // Import the utility

// Steps used for your stepper
const steps = [
  { id: 0, name: "Personal Info" },
  { id: 1, name: "Job Details" },
  { id: 2, name: "Qualifications" },
  { id: 3, name: "Documents" },
];

export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
  email: string;
}

export interface User {
  username: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  nationality?: string;
  phoneNumber?: string;
  dob?: string;
  residentialAddress?: string;
  permanentAddress?: string;
  department?: string;
  position?: string;
  role?: string;
  gender?: string;
  bloodGroup?: string;
  employmentType?: string;
  joiningDate?: string;
  qualifications: Qualification[];
  experiences: Experience[];
  certifications: Certification[];
  emergencyContacts: EmergencyContact[];
  profileImageUrl?: string;
  workLocation?: string;
}

export type Qualification = {
  name: string;
  level: string;
  specializations: string[];
  institution: string;
};

export type Experience = {
  jobTitle: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
};

export type Certification = {
  name: string;
  issuingAuthority: string;
  licenseNumber: string;
  issueDate: string;
  expiryDate: string;
};

interface AuditLogEntry {
  id: string;
  action: string;
  performedBy: string;
  userUsername: string;
  targetUsername: string;
  datePerformed: string; // ISO string
  details: string; // JSON string
  user: {
    username: string;
    firstName: string;
    lastName: string;
  };
}

interface ChangeHistoryEntry {
  old: any;
  new: any;
  datePerformed: string;
  performedBy: string;
}

const MultiStepEditUser: React.FC = () => {
  // Next.js / NextAuth
  const router = useRouter();
  const { username } = router.query;
  const { data: session, status } = useSession();

  // Steps
  const [activeStep, setActiveStep] = useState<number>(0);

  // Child state slices
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoData>({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    dob: "",
    residentialAddress: "",
    permanentAddress: "",
    gender: "",
    bloodGroup: "",
    emergencyContacts: [
      {
        name: "",
        relationship: "",
        phoneNumber: "",
        email: "",
      },
    ],
    resetPassword: false,
    profileImageUrl: "",
    nationality: "",
  });

  const [jobDetails, setJobDetails] = useState<JobDetailsData>({
    department: "",
    position: "",
    role: "",
    employmentType: "",
    joiningDate: "",
    workLocation: "",
  });

  const [qualifications, setQualifications] = useState<QualificationsData>({
    qualifications: [],
    experiences: [],
    certifications: [],
  });

  // Data from API
  const [initialData, setInitialData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Error Handling States
  const [error, setError] = useState<string | null>(null);
  const [retryFetch, setRetryFetch] = useState<boolean>(false);

  // Success Message State
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reference to the container to manage scroll
  const containerRef = useRef<HTMLDivElement>(null);

  // State for Edit Mode
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // State for Delete Confirmation Modal
  const [deleteConfirm, setDeleteConfirm] = useState<boolean>(false);

  // 1) Derive the current user role from the session
  const userRole = session?.user?.role ?? "";

  // Fetch user data on mount (or when username changes)
  useEffect(() => {
    if (username && typeof username === "string") {
      const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/users/user/${username}`);
          if (!response.ok) throw new Error("Failed to fetch user data");

          const data = await response.json();
          const userData: User = {
            username: data.username,
            firstName: data.firstName,
            middleName: data.middleName,
            lastName: data.lastName,
            email: data.email,
            phoneNumber: data.phoneNumber || "",
            dob: data.dob || "",
            residentialAddress: data.residentialAddress || "",
            permanentAddress: data.permanentAddress || "",
            department: data.department || "",
            position: data.position || "",
            role: data.role || "",
            gender: data.gender || "",
            bloodGroup: data.bloodGroup || "",
            employmentType: data.employmentType || "",
            joiningDate: data.joiningDate || "",
            qualifications: data.qualifications || [],
            experiences: data.experiences || [],
            certifications: data.certifications || [],
            emergencyContacts: data.emergencyContacts || [],
            profileImageUrl: data.profileImageUrl || "",
            nationality: data.nationality || "",
            workLocation: data.workLocation || "",
          };

          // Fill local states with deep clones to prevent mutations
          setPersonalInfo({
            firstName: userData.firstName,
            middleName: userData.middleName || "",
            lastName: userData.lastName,
            email: userData.email,
            phoneNumber: userData.phoneNumber || "",
            dob: userData.dob || "",
            residentialAddress: userData.residentialAddress || "",
            permanentAddress: userData.permanentAddress || "",
            gender: userData.gender || "",
            bloodGroup: userData.bloodGroup || "",
            emergencyContacts: cloneDeep(userData.emergencyContacts),
            profileImageUrl: userData.profileImageUrl || "",
            nationality: userData.nationality || "",
            resetPassword: false,
          });

          setJobDetails({
            department: userData.department || "",
            position: userData.position || "",
            role: userData.role || "",
            employmentType: userData.employmentType || "",
            joiningDate: userData.joiningDate || "",
            workLocation: userData.workLocation || "",
          });

          setQualifications({
            qualifications: cloneDeep(userData.qualifications),
            experiences: cloneDeep(userData.experiences),
            certifications: cloneDeep(userData.certifications),
          });

          setInitialData(userData);
        } catch (error: any) {
          console.error("Error fetching user data:", error);
          setError(error.message || "An error occurred while fetching user data.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [username, retryFetch]);

  // Fetch audit logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState<boolean>(true);
  const [auditError, setAuditError] = useState<string | null>(null);

  useEffect(() => {
    if (username && typeof username === "string") {
      const fetchAuditLogs = async () => {
        setAuditLoading(true);
        setAuditError(null);
        try {
          const response = await fetch(
            `/api/users/user/${username}/auditLogs?page=1&limit=100`
          ); // Adjust pagination as needed
          if (!response.ok) {
            throw new Error("Failed to fetch audit logs");
          }
          const data = await response.json();
          setAuditLogs(data.data);
        } catch (error: any) {
          setAuditError(
            error.message || "An error occurred while fetching audit logs"
          );
        } finally {
          setAuditLoading(false);
        }
      };
      fetchAuditLogs();
    }
  }, [username]);

  // Process audit logs to build change history using the utility
  const changeHistory = useMemo(() => {
    return processAuditLogs(auditLogs);
  }, [auditLogs]);

  // Compare current states with initialData to see if changes were made
  const changesMade = useMemo(() => {
    if (!initialData) return false;
    const currentUser: User = {
      username: initialData.username,
      firstName: personalInfo.firstName,
      middleName: personalInfo.middleName,
      lastName: personalInfo.lastName,
      email: personalInfo.email,
      phoneNumber: personalInfo.phoneNumber,
      dob: personalInfo.dob,
      residentialAddress: personalInfo.residentialAddress,
      permanentAddress: personalInfo.permanentAddress,
      gender: personalInfo.gender,
      bloodGroup: personalInfo.bloodGroup,
      nationality: personalInfo.nationality,
      emergencyContacts: cloneDeep(personalInfo.emergencyContacts),
      department: jobDetails.department,
      position: jobDetails.position,
      role: jobDetails.role,
      employmentType: jobDetails.employmentType,
      joiningDate: jobDetails.joiningDate,
      workLocation: jobDetails.workLocation,
      qualifications: cloneDeep(qualifications.qualifications),
      experiences: cloneDeep(qualifications.experiences),
      certifications: cloneDeep(qualifications.certifications),
      profileImageUrl: personalInfo.profileImageUrl,
    };
    return !isEqual(initialData, currentUser);
  }, [initialData, personalInfo, jobDetails, qualifications]);

  // Early returns (loading, unauthorized, not found, audit loading/error)
  if (status === "loading" || isLoading || auditLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-r from-purple-500 to-indigo-600">
        <span className="text-lg sm:text-xl text-white flex items-center">
          <ArrowPathIcon className="w-5 h-5 animate-spin mr-2" />
          Loading...
        </span>
      </div>
    );
  }

  const allowedRoles = ["HR", "ADMIN"];
  if (!session || !session.user || !allowedRoles.includes(session.user.role)) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-r from-red-500 to-yellow-500 px-4">
        <div className="flex flex-col items-center">
          <ExclamationTriangleIcon className="w-10 h-10 text-white mb-2" />
          <span className="text-lg sm:text-xl text-white text-center">Unauthorized</span>
        </div>
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-r from-red-400 to-pink-500 px-4">
        <div className="flex flex-col items-center">
          <ExclamationTriangleIcon className="w-10 h-10 text-white mb-2" />
          <span className="text-lg sm:text-xl text-white text-center">User not found</span>
          <Button
            onClick={() => setRetryFetch((prev) => !prev)}
            className="mt-2 bg-white text-red-600 hover:bg-gray-100 px-3 py-1 rounded"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (auditError) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-r from-yellow-400 to-orange-500 px-4">
        <div className="flex flex-col items-center">
          <ExclamationTriangleIcon className="w-10 h-10 text-white mb-2" />
          <span className="text-lg sm:text-xl text-white text-center">{auditError}</span>
          <Button
            onClick={() => router.reload()}
            className="mt-2 bg-white text-yellow-600 hover:bg-gray-100 px-3 py-1 rounded"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const payload: any = {
        username: initialData.username,
        firstName: personalInfo.firstName,
        middleName: personalInfo.middleName,
        lastName: personalInfo.lastName,
        email: personalInfo.email,
        phoneNumber: personalInfo.phoneNumber,
        dob: personalInfo.dob,
        residentialAddress: personalInfo.residentialAddress,
        permanentAddress: personalInfo.permanentAddress,
        gender: personalInfo.gender,
        bloodGroup: personalInfo.bloodGroup,
        nationality: personalInfo.nationality,
        emergencyContacts: cloneDeep(personalInfo.emergencyContacts),
        department: jobDetails.department,
        position: jobDetails.position,
        role: jobDetails.role,
        employmentType: jobDetails.employmentType,
        joiningDate: jobDetails.joiningDate,
        workLocation: jobDetails.workLocation,
        qualifications: cloneDeep(qualifications.qualifications),
        experiences: cloneDeep(qualifications.experiences),
        certifications: cloneDeep(qualifications.certifications),
      };

      if (personalInfo.resetPassword) {
        payload.resetPassword = true;
      }

      const response = await fetch("/api/users/updateUser", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update user.");
      }

      await response.json(); // or destructure if needed

      setSuccessMessage("User updated successfully!");
      setActiveStep(0); // Reset to first step if desired
      setInitialData(cloneDeep({
        username: initialData.username,
        firstName: personalInfo.firstName,
        middleName: personalInfo.middleName,
        lastName: personalInfo.lastName,
        email: personalInfo.email,
        phoneNumber: personalInfo.phoneNumber,
        dob: personalInfo.dob,
        residentialAddress: personalInfo.residentialAddress,
        permanentAddress: personalInfo.permanentAddress,
        gender: personalInfo.gender,
        bloodGroup: personalInfo.bloodGroup,
        nationality: personalInfo.nationality,
        emergencyContacts: cloneDeep(personalInfo.emergencyContacts),
        department: jobDetails.department,
        position: jobDetails.position,
        role: jobDetails.role,
        employmentType: jobDetails.employmentType,
        joiningDate: jobDetails.joiningDate,
        workLocation: jobDetails.workLocation,
        qualifications: cloneDeep(qualifications.qualifications),
        experiences: cloneDeep(qualifications.experiences),
        certifications: cloneDeep(qualifications.certifications),
        profileImageUrl: personalInfo.profileImageUrl,
      }));
      setIsEditMode(false); // Exit edit mode after saving
    } catch (error: any) {
      console.error("Error updating user:", error);
      setError(error.message || "An error occurred while updating the user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async () => {
    setIsDeleting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch("/api/users/deleteUser", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: initialData.username }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete user.");
      }
      setSuccessMessage("User deleted successfully!");
      setTimeout(() => {
        router.push("/manage/users");
      }, 2000);
    } catch (error: any) {
      console.error("Error deleting user:", error);
      setError(error.message || "An error occurred while deleting the user.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle toggling edit mode
  const toggleEditMode = () => {
    if (isEditMode) {
      // If exiting edit mode, revert changes by deeply cloning initialData
      if (initialData) {
        setPersonalInfo({
          firstName: initialData.firstName,
          middleName: initialData.middleName || "",
          lastName: initialData.lastName,
          email: initialData.email,
          phoneNumber: initialData.phoneNumber || "",
          dob: initialData.dob || "",
          residentialAddress: initialData.residentialAddress || "",
          permanentAddress: initialData.permanentAddress || "",
          gender: initialData.gender || "",
          bloodGroup: initialData.bloodGroup || "",
          emergencyContacts: cloneDeep(initialData.emergencyContacts),
          profileImageUrl: initialData.profileImageUrl || "",
          nationality: initialData.nationality || "",
          resetPassword: false,
        });

        setJobDetails({
          department: initialData.department || "",
          position: initialData.position || "",
          role: initialData.role || "",
          employmentType: initialData.employmentType || "",
          joiningDate: initialData.joiningDate || "",
          workLocation: initialData.workLocation || "",
        });

        setQualifications({
          qualifications: cloneDeep(initialData.qualifications),
          experiences: cloneDeep(initialData.experiences),
          certifications: cloneDeep(initialData.certifications),
        });
      }
    }
    setIsEditMode(!isEditMode);
  };

  // Render the current step's form
  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <PersonalInfoForm
            // Removed key prop
            formData={personalInfo}
            setFormData={setPersonalInfo}
            changeHistory={changeHistory}
            isEditMode={isEditMode} // Passed prop
          />
        );
      case 1:
        return (
          <JobDetailsForm
            // Removed key prop
            formData={jobDetails}
            setFormData={setJobDetails}
            currentUserRole={userRole}
            changeHistory={changeHistory}
            isEditMode={isEditMode} // Passed prop
          />
        );
      case 2:
        return (
          <QualificationsForm
            // Removed key prop
            formData={qualifications}
            setFormData={setQualifications}
            changeHistory={changeHistory}
            isEditMode={isEditMode} // Passed prop
          />
        );
      case 3:
        return (
          <DocumentsSection
            // Removed key prop
            userUsername={initialData.username}
            isEditMode={isEditMode} // Passed prop
          />
        );
      default:
        return null;
    }
  };

  const handleStepClick = (stepId: number) => {
    setActiveStep(stepId);
    scrollToTop();
  };

  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <Head>
        <title>Edit User - {initialData.username}</title>
      </Head>

      <div
        ref={containerRef}
        className="container mx-auto p-2 sm:p-4 bg-gradient-to-r from-blue-50 to-purple-100 min-h-screen flex flex-col"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-2 sm:mb-4">
          {/* Edit, Save, and Cancel Buttons */}
          <div className="flex space-x-2">
            {!isEditMode ? (
              <Button
                type="button"
                onClick={toggleEditMode}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Edit
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`bg-green-600 hover:bg-green-700 text-white ${
                    isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
                <Button
                  type="button"
                  onClick={toggleEditMode}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Cancel
                </Button>
              </>
            )}
          </div>

          {/* Delete Button */}
          <Button
            type="button"
            onClick={() => setDeleteConfirm(true)}
            className="bg-red-600 hover:bg-red-700 text-white flex items-center px-2 py-1 rounded"
          >
            <TrashIcon className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div
            className="flex items-center bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded relative mb-4"
            role="alert"
          >
            <span className="block sm:inline">{successMessage}</span>
            <button
              onClick={() => setSuccessMessage(null)}
              className="absolute top-1 right-1 text-green-700"
            >
              <svg
                className="fill-current h-4 w-4"
                role="button"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <title>Close</title>
                <path d="M14.348 5.652a1 1 0 00-1.414 0L10 8.586 7.066 5.652a1 1 0 00-1.414 1.414L8.586 10l-2.934 2.934a1 1 0 101.414 1.414L10 11.414l2.934 2.934a1 1 0 001.414-1.414L11.414 10l2.934-2.934a1 1 0 000-1.414z" />
              </svg>
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            className="flex items-center bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded relative mb-4"
            role="alert"
          >
            <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
            <span className="block sm:inline">{error}</span>
            <button
              onClick={() => setError(null)}
              className="absolute top-1 right-1 text-red-700"
            >
              <svg
                className="fill-current h-4 w-4"
                role="button"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <title>Close</title>
                <path d="M14.348 5.652a1 1 0 00-1.414 0L10 8.586 7.066 5.652a1 1 0 00-1.414 1.414L8.586 10l-2.934 2.934a1 1 0 101.414 1.414L10 11.414l2.934 2.934a1 1 0 001.414-1.414L11.414 10l2.934-2.934a1 1 0 000-1.414z" />
              </svg>
            </button>
          </div>
        )}

        {/* Stepper */}
        <div className="mb-2 sm:mb-4">
          <Progress
            value={(activeStep / (steps.length - 1)) * 100}
            className="mb-1 h-1 rounded-full bg-gradient-to-r from-green-200 to-green-400"
          />
          <div className="flex space-x-2 sm:space-x-4 overflow-x-auto">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => handleStepClick(step.id)}
                className={`flex flex-col items-center text-xs sm:text-sm font-medium ${
                  index === activeStep
                    ? "text-blue-600"
                    : "text-gray-500 hover:text-blue-500"
                } focus:outline-none`}
              >
                <span>{step.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Active Step Content */}
        <div className="flex-grow">
          <div className="bg-white shadow-md rounded-lg p-2 sm:p-4">
            {renderStep()}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-end mt-2 sm:mt-4">
          {activeStep < steps.length - 1 ? (
            <Button
              onClick={() => {
                setActiveStep((prev) => prev + 1);
                scrollToTop();
              }}
              disabled={!isEditMode}
              className={`bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-300 px-3 py-1 rounded ${
                !isEditMode ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!isEditMode || isSubmitting}
              className={`bg-green-600 text-white hover:bg-green-700 transition-colors duration-300 px-3 py-1 rounded ${
                (!isEditMode || isSubmitting) ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 px-2">
            <div className="bg-white p-3 sm:p-4 rounded-lg w-full max-w-xs sm:max-w-sm shadow-lg">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Confirm Deletion</h2>
              <p className="text-gray-700 mb-3">
                Are you sure you want to delete user "<strong>{initialData.username}</strong>"? This action cannot be undone.
              </p>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  onClick={() => setDeleteConfirm(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                  className={`bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded ${
                    isDeleting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MultiStepEditUser;
