"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import isEqual from "lodash.isequal";
import cloneDeep from "lodash.clonedeep";

// Child forms
import PersonalInfoForm, { PersonalInfoData } from "./GeneralInfo";
import JobDetailsForm, { JobDetailsData } from "./JobDetails";
import QualificationsForm, { QualificationsData } from "./Qualifications";
import DocumentsSection from "./Documents";

// Hooks
import { useUserData } from "../../hooks/useUserData";
import { useAuditLogs } from "../../hooks/useAuditLogs";

// Helpers
import { processAuditLogs } from "@/lib/processAuditLogs";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Icons
import {
  TrashIcon,
  ExclamationTriangleIcon,
  UserCircleIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  DocumentPlusIcon,
} from "@heroicons/react/24/outline";

/** 
 * Updated Qualification type with 
 * startDate/endDate from your schema.
 */
export interface Qualification {
  name: string;
  level: string;
  specializations: string[];
  institution: string;
  startDate?: string;  // DateTime? in your schema
  endDate?: string;    // DateTime? in your schema
}

export interface Experience {
  jobTitle: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Certification {
  name: string;
  issuingAuthority: string;
  licenseNumber: string;
  issueDate: string;
  expiryDate: string;
}

export interface Address {
  flat?: string;
  street?: string;
  landmark?: string;
  city?: string;
  district?: string;
  state?: string;
  pin?: string;
}

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
  residentialAddress?: Address;
  permanentAddress?: Address;
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

const MultiStepEditUser: React.FC = () => {
  const router = useRouter();
  const { username } = router.query;
  const { data: session } = useSession();

  // Hooks for user data & logs
  const {
    userData,
    error: userError,
    status,
    setUserData,
    fetchUser,
    updateUser,
    deleteUser,
  } = useUserData();
  const { auditLogs, fetchAuditLogs } = useAuditLogs();

  // Sub-form states
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoData>({
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
    gender: "",
    bloodGroup: "",
    emergencyContacts: [],
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

  // Tabs, container ref
  const [activeTab, setActiveTab] = useState<string>("personalInfo");
  const containerRef = useRef<HTMLDivElement>(null);

  // Edit mode & dialogs
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [deleteConfirm, setDeleteConfirm] = useState<boolean>(false);
  const [saveConfirm, setSaveConfirm] = useState<boolean>(false);

  // Messages
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load user + logs
  useEffect(() => {
    if (typeof username === "string") {
      fetchUser(username);
      fetchAuditLogs(username);
    }
  }, [username, fetchUser, fetchAuditLogs]);

  // Convert logs -> structured changes
  const changeHistory = useMemo(() => processAuditLogs(auditLogs), [auditLogs]);

  // Populate states once user data is loaded
  useEffect(() => {
    if (userData) {
      setPersonalInfo({
        firstName: userData.firstName,
        middleName: userData.middleName || "",
        lastName: userData.lastName,
        email: userData.email,
        phoneNumber: userData.phoneNumber || "",
        dob: userData.dob || "",
        residentialAddress: cloneDeep(userData.residentialAddress) || {
          flat: "",
          street: "",
          landmark: "",
          city: "",
          district: "",
          state: "",
          pin: "",
        },
        permanentAddress: cloneDeep(userData.permanentAddress) || {
          flat: "",
          street: "",
          landmark: "",
          city: "",
          district: "",
          state: "",
          pin: "",
        },
        gender: userData.gender || "",
        bloodGroup: userData.bloodGroup || "",
        emergencyContacts: cloneDeep(userData.emergencyContacts) || [],
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

      // qualifications w/ startDate/endDate
      setQualifications({
        qualifications: cloneDeep(userData.qualifications),
        experiences: cloneDeep(userData.experiences),
        certifications: cloneDeep(userData.certifications),
      });
    }
  }, [userData]);

  // Check if changes made
  const changesMade = useMemo(() => {
    if (!userData) return false;

    const currentFormData = {
      username: userData.username,
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
      emergencyContacts: personalInfo.emergencyContacts,
      department: jobDetails.department,
      position: jobDetails.position,
      role: jobDetails.role,
      employmentType: jobDetails.employmentType,
      joiningDate: jobDetails.joiningDate,
      workLocation: jobDetails.workLocation,
      qualifications: qualifications.qualifications,
      experiences: qualifications.experiences,
      certifications: qualifications.certifications,
      profileImageUrl: personalInfo.profileImageUrl,
    };

    return !isEqual(userData, currentFormData);
  }, [userData, personalInfo, jobDetails, qualifications]);

  // Toggle edit (revert if turning off)
  const toggleEditMode = useCallback(() => {
    if (isEditMode && userData) {
      // revert to original
      setPersonalInfo({
        firstName: userData.firstName,
        middleName: userData.middleName || "",
        lastName: userData.lastName,
        email: userData.email,
        phoneNumber: userData.phoneNumber || "",
        dob: userData.dob || "",
        residentialAddress: cloneDeep(userData.residentialAddress) || {
          flat: "",
          street: "",
          landmark: "",
          city: "",
          district: "",
          state: "",
          pin: "",
        },
        permanentAddress: cloneDeep(userData.permanentAddress) || {
          flat: "",
          street: "",
          landmark: "",
          city: "",
          district: "",
          state: "",
          pin: "",
        },
        gender: userData.gender || "",
        bloodGroup: userData.bloodGroup || "",
        emergencyContacts: cloneDeep(userData.emergencyContacts) || [],
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

      setGlobalError(null);
      setSuccessMessage(null);
    }
    setIsEditMode(!isEditMode);
  }, [isEditMode, userData]);

  // Submit changes
  const handleSubmit = useCallback(async () => {
    if (!userData) {
      setGlobalError("No user data loaded yet.");
      return;
    }
    setGlobalError(null);
    setSuccessMessage(null);

    const payload = {
      username: userData.username,
      firstName: personalInfo.firstName,
      middleName: personalInfo.middleName,
      lastName: personalInfo.lastName,
      email: personalInfo.email,
      phoneNumber: personalInfo.phoneNumber,
      dob: personalInfo.dob,
      residentialAddress: cloneDeep(personalInfo.residentialAddress),
      permanentAddress: cloneDeep(personalInfo.permanentAddress),
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
      ...(personalInfo.resetPassword ? { resetPassword: true } : {}),
    };

    try {
      // Call updateUser and do not check its return value since it returns void.
      await updateUser(payload);
      // Optionally, you can call fetchUser(userData.username) here to refresh the user data.
      setSuccessMessage("User details have been successfully updated!");
      setIsEditMode(false);
    } catch (error: any) {
      setGlobalError(error.message);
    } finally {
      setSaveConfirm(false);
    }
  }, [
    userData,
    personalInfo,
    jobDetails,
    qualifications,
    updateUser,
  ]);

  // Delete user
  const handleDeleteUser = useCallback(async () => {
    if (!userData) {
      setGlobalError("No user loaded.");
      return;
    }
    try {
      await deleteUser(userData.username);
      setSuccessMessage("User deleted successfully!");
      // Optionally redirect
      router.push("/manage/users");
    } catch (err: any) {
      setGlobalError(err.message);
    } finally {
      setDeleteConfirm(false);
    }
  }, [deleteUser, userData, router]);

  // Switch tab
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <>
      <Head>
        <title>Edit User - {userData?.username || "Loading..."}</title>
      </Head>

      <div
        ref={containerRef}
        className="container mx-auto px-4 py-6 min-h-screen space-y-6"
      >
        {/* Notifications */}
        {successMessage && (
          <Alert variant="default">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}
        {(userError || globalError) && (
          <Alert variant="destructive">
            <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
            <div>
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{userError || globalError}</AlertDescription>
            </div>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4">
          {!isEditMode ? (
            <Button
              onClick={toggleEditMode}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Edit
            </Button>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                variant="default"
                onClick={toggleEditMode}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={() => setSaveConfirm(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={!changesMade}
              >
                Save
              </Button>
            </div>
          )}

          <Button
            onClick={() => setDeleteConfirm(true)}
            variant="destructive"
            disabled={!userData}
            className="flex items-center bg-red-700 hover:bg-red-800 text-white"
          >
            <TrashIcon className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>

        {/* Tabs with icons */}
        <div className="bg-white/80 p-4 rounded-md shadow-lg">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger
                value="personalInfo"
                className="data-[state=active]:bg-white data-[state=active]:shadow-md px-4 py-2 flex items-center justify-center"
              >
                <UserCircleIcon className="w-5 h-5 mr-2" />
                Personal Info
              </TabsTrigger>
              <TabsTrigger
                value="jobDetails"
                className="data-[state=active]:bg-white data-[state=active]:shadow-md px-4 py-2 flex items-center justify-center"
              >
                <BriefcaseIcon className="w-5 h-5 mr-2" />
                Job Details
              </TabsTrigger>
              <TabsTrigger
                value="qualifications"
                className="data-[state=active]:bg-white data-[state=active]:shadow-md px-4 py-2 flex items-center justify-center"
              >
                <AcademicCapIcon className="w-5 h-5 mr-2" />
                Qualifications
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="data-[state=active]:bg-white data-[state=active]:shadow-md px-4 py-2 flex items-center justify-center"
              >
                <DocumentPlusIcon className="w-5 h-5 mr-2" />
                Documents
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="personalInfo"
              className="rounded-md p-4 border border-gray-100 shadow-sm"
            >
              {!userData ? (
                <p className="text-gray-700">Loading user data...</p>
              ) : (
                <PersonalInfoForm
                  userUsername={userData?.username}
                  formData={personalInfo}
                  setFormData={setPersonalInfo}
                  changeHistory={changeHistory}
                  isEditMode={isEditMode}
                />
              )}
            </TabsContent>

            <TabsContent
              value="jobDetails"
              className="rounded-md p-4 border border-gray-100 shadow-sm"
            >
              {!userData ? (
                <p className="text-gray-700">Loading user data...</p>
              ) : (
                <JobDetailsForm
                  formData={jobDetails}
                  setFormData={setJobDetails}
                  currentUserRole={session?.user?.role || ""}
                  changeHistory={changeHistory}
                  isEditMode={isEditMode}
                />
              )}
            </TabsContent>

            <TabsContent
              value="qualifications"
              className="rounded-md p-4 border border-gray-100 shadow-sm"
            >
              {!userData ? (
                <p className="text-gray-700">Loading user data...</p>
              ) : (
                <QualificationsForm
                  formData={qualifications}
                  setFormData={setQualifications}
                  changeHistory={changeHistory}
                  isEditMode={isEditMode}
                />
              )}
            </TabsContent>

            <TabsContent
              value="documents"
              className="rounded-md p-4 border border-gray-100 shadow-sm"
            >
              {!userData ? (
                <p className="text-gray-700">Loading user data...</p>
              ) : (
                <DocumentsSection
                  userUsername={userData.username}
                  isEditMode={isEditMode}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <TrashIcon className="h-5 w-5 mr-2 text-red-600" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. Are you sure you want to delete the user{" "}
              <strong>{userData?.username}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={status.isDeleting}
            >
              {status.isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Confirmation Dialog */}
      <Dialog open={saveConfirm} onOpenChange={setSaveConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-yellow-600" />
              Confirm Save
            </DialogTitle>
            <DialogDescription>
              You're about to save all changes made for{" "}
              <strong>{userData?.username}</strong>. Please ensure everything is
              correct before proceeding.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setSaveConfirm(false)}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleSubmit}
              disabled={!changesMade || status.isSubmitting}
            >
              {status.isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MultiStepEditUser;
