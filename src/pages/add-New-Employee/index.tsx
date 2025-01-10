import React, { useState } from "react";
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
} from "@/components/add-New-Employee/DocumentsForm";

export interface CreateUserFormData {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dob: string;
  residentialAddress: string;
  permanentAddress: string;
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
  sameAsResidential?: boolean;
}

export default function CreateUserPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Notification states
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Authorization logic
  const allowedRoles = ["ADMIN"];
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <span className="text-white text-xl">Loading...</span>
      </div>
    );
  }

  if (!session || !session.user || !allowedRoles.includes(session.user.role)) {
    router.push("/unauthorized");
    return null;
  }

  const [activeTab, setActiveTab] = useState("personal");

  const [formData, setFormData] = useState<CreateUserFormData>({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    dob: "",
    residentialAddress: "",
    permanentAddress: "",
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
    documents: {
      resume: [],
      education: [],
      identity: [],
      certification: [],
      skills: [],
      others: [],
    },
    profileImageUrl: "",
    avatarImageUrl: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    // Clear previous messages
    setSuccessMessage(null);
    setErrorMessage(null);
  
    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "documents") {
        Object.entries(value as UploadedDocuments).forEach(
          ([docType, docArray]) => {
            docArray.forEach(
              (doc: { file: File; displayName: string }, index: number) => {
                formDataToSend.append(
                  `documents[${docType}][${index}][file]`,
                  doc.file
                );
                formDataToSend.append(
                  `documents[${docType}][${index}][displayName]`,
                  doc.displayName
                );
                // Directly use docType as the category without converting to lowercase
                formDataToSend.append(
                  `documents[${docType}][${index}][category]`,
                  docType
                );
              }
            );
          }
        );
      } else if (Array.isArray(value)) {
        formDataToSend.append(key, JSON.stringify(value));
      } else {
        formDataToSend.append(key, value as string);
      }
    });
  
    try {
      const response = await fetch("/api/users/newUser", {
        method: "POST",
        body: formDataToSend,
      });

      if (response.status === 409) {
        const errorData = await response.json();
        // Use a notification or inline message to display conflict information
        setErrorMessage(errorData.message || "Conflict: User may already exist.");
        return;
      }
    

      if (!response.ok) {
        throw new Error("Failed to create user");
      }

      const data = await response.json();
      // Show success message
      setSuccessMessage(`New user created with username: ${data.username}`);
      // Redirect using dynamic route
      router.push(`/manage/users/user/${data.username}`);
    } catch (error) {
      console.error("Error creating user:", error);
      setErrorMessage("Failed to create user. Please try again.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Add New Employee</h1>
      
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
                <TabsTrigger value="personal">
                  <UserCircleIcon className="w-5 h-5 mr-2" />
                  Personal Info
                </TabsTrigger>
                <TabsTrigger value="job">
                  <BriefcaseIcon className="w-5 h-5 mr-2" />
                  Job Details
                </TabsTrigger>
                <TabsTrigger value="qualifications">
                  <AcademicCapIcon className="w-5 h-5 mr-2" />
                  Qualifications
                </TabsTrigger>
                <TabsTrigger value="documents">
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
                <QualificationsForm
                  formData={formData}
                  setFormData={setFormData}
                />
              </TabsContent>

              <TabsContent value="documents">
                <DocumentsForm
                  uploadedDocuments={formData.documents}
                  setUploadedDocuments={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      documents:
                        typeof value === "function"
                          ? value(prev.documents)
                          : value,
                    }))
                  }
                />
              </TabsContent>
            </Tabs>

            <div className="mt-6 flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const tabs = [
                    "personal",
                    "job",
                    "qualifications",
                    "documents",
                  ];
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex > 0) {
                    setActiveTab(tabs[currentIndex - 1]);
                  }
                }}
                disabled={activeTab === "personal"}
              >
                Previous
              </Button>

              <Button
                type="button"
                onClick={() => {
                  const tabs = [
                    "personal",
                    "job",
                    "qualifications",
                    "documents",
                  ];
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex < tabs.length - 1) {
                    setActiveTab(tabs[currentIndex + 1]);
                  }
                }}
                disabled={activeTab === "documents"}
              >
                Next
              </Button>

              <Button type="submit">Create User</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
