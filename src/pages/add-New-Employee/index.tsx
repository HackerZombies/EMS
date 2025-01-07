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

//
// Define a type for the entire form data
//
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
  profileImageUrl: string; // Add this field
  avatarImageUrl: string;  // Add this field
  sameAsResidential?: boolean;
}

export default function CreateUserPage() {
  const router = useRouter();
  const { data: session, status } = useSession(); // Access session info

  // Authorization logic
  const allowedRoles = ["HR"];
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <span className="text-white text-xl">Loading...</span>
      </div>
    );
  }

  if (!session || !session.user || !allowedRoles.includes(session.user.role)) {
    // Redirect unauthorized users
    router.push("/unauthorized");
    return null; // Prevent rendering any content
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
    profileImageUrl: "", // Initialize as empty string
    avatarImageUrl: "",  // Initialize as empty string
  });

  //
  // If you want to handle updated documents in a separate callback
  //
  const handleDocumentChange = (updatedDocuments: UploadedDocuments) => {
    setFormData((prev) => ({ ...prev, documents: updatedDocuments }));
  };

  //
  // The main submit function
  //
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formDataToSend = new FormData();

    // Append all form fields
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "documents") {
        // Append document data
        Object.entries(value as UploadedDocuments).forEach(
          ([docType, docArray]) => {
            docArray.forEach(
              (doc: { file: File; displayName: string }, index: number) => {
                // Append file
                formDataToSend.append(
                  `documents[${docType}][${index}][file]`,
                  doc.file
                );
                // Append display name
                formDataToSend.append(
                  `documents[${docType}][${index}][displayName]`,
                  doc.displayName
                );
                // Append category
                formDataToSend.append(
                  `documents[${docType}][${index}][category]`,
                  docType.toUpperCase()
                );
              }
            );
          }
        );
      } else if (Array.isArray(value)) {
        // If it's an array (e.g., emergencyContacts), store as JSON
        formDataToSend.append(key, JSON.stringify(value));
      } else {
        // Otherwise, just append the value as is
        formDataToSend.append(key, value as string);
      }
    });

    try {
      const response = await fetch("/api/users/newUser", {
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error("Failed to create user");
      }

      const data = await response.json();
      alert(`New user created with username: ${data.username}`);
      router.push("/manage/users");
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Failed to create user. Please try again.");
    }
  };

  //
  // Render
  //
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Add New Employee</h1>
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
                <PersonalInfoForm
                  formData={formData}
                  setFormData={setFormData}
                />
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
              {/* PREVIOUS Button */}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const tabs = ["personal", "job", "qualifications", "documents"];
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex > 0) {
                    setActiveTab(tabs[currentIndex - 1]);
                  }
                }}
                disabled={activeTab === "personal"}
              >
                Previous
              </Button>

              {/* NEXT Button */}
              <Button
                type="button"
                onClick={() => {
                  const tabs = ["personal", "job", "qualifications", "documents"];
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex < tabs.length - 1) {
                    setActiveTab(tabs[currentIndex + 1]);
                  }
                }}
                disabled={activeTab === "documents"}
              >
                Next
              </Button>

              {/* SUBMIT Button */}
              <Button type="submit">Create User</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
