"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { CreateUserFormData } from "../../pages/add-New-Employee/index"; // adjust this import as necessary

// 1. Add startDate & endDate to the Qualification interface
export interface Qualification {
  name: string;
  level: string;
  specializations: string[];
  institution: string;
  startDate: string; // <--- new
  endDate: string;   // <--- new
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

export interface QualificationsFormData {
  qualifications: Qualification[];
  experiences: Experience[];
  certifications: Certification[];
}

interface QualificationsFormProps {
  formData: CreateUserFormData;
  setFormData: React.Dispatch<React.SetStateAction<CreateUserFormData>>;
}

const QualificationsForm: React.FC<QualificationsFormProps> = ({
  formData,
  setFormData,
}) => {
  const router = useRouter();

  // Redirect if formData is not available (direct access)
  if (!formData) {
    router.push("/add-new-Employee");
    return null;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Handle qualification changes
  // ──────────────────────────────────────────────────────────────────────────
  const handleQualificationChange = (
    index: number,
    field: keyof Qualification,
    value: string | string[]
  ) => {
    const updatedQualifications = [...formData.qualifications];
    if (field === "specializations" && typeof value === "string") {
      // Split the string into an array by comma
      updatedQualifications[index] = {
        ...updatedQualifications[index],
        [field]: value.split(",").map((s) => s.trim()),
      };
    } else {
      updatedQualifications[index] = {
        ...updatedQualifications[index],
        [field]: value as string,
      };
    }
    setFormData((prev) => ({ ...prev, qualifications: updatedQualifications }));
  };

  const addQualification = () => {
    setFormData((prev) => ({
      ...prev,
      qualifications: [
        ...prev.qualifications,
        {
          name: "",
          level: "",
          specializations: [],
          institution: "",
          startDate: "", // <--- initialize here
          endDate: "",   // <--- initialize here
        },
      ],
    }));
  };

  const removeQualification = (index: number) => {
    const updatedQualifications = formData.qualifications.filter(
      (_: any, i: number) => i !== index
    );
    setFormData((prev) => ({ ...prev, qualifications: updatedQualifications }));
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Handle experience changes
  // ──────────────────────────────────────────────────────────────────────────
  const handleExperienceChange = (
    index: number,
    field: keyof Experience,
    value: string
  ) => {
    const updatedExperiences = [...formData.experiences];
    updatedExperiences[index] = { ...updatedExperiences[index], [field]: value };
    setFormData((prev) => ({ ...prev, experiences: updatedExperiences }));
  };

  const addExperience = () => {
    setFormData((prev) => ({
      ...prev,
      experiences: [
        ...prev.experiences,
        {
          jobTitle: "",
          company: "",
          startDate: "",
          endDate: "",
          description: "",
        },
      ],
    }));
  };

  const removeExperience = (index: number) => {
    const updatedExperiences = formData.experiences.filter(
      (_: any, i: number) => i !== index
    );
    setFormData((prev) => ({ ...prev, experiences: updatedExperiences }));
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Handle certification changes
  // ──────────────────────────────────────────────────────────────────────────
  const handleCertificationChange = (
    index: number,
    field: keyof Certification,
    value: string
  ) => {
    const updatedCertifications = [...formData.certifications];
    updatedCertifications[index] = {
      ...updatedCertifications[index],
      [field]: value,
    };
    setFormData((prev) => ({ ...prev, certifications: updatedCertifications }));
  };

  const addCertification = () => {
    setFormData((prev) => ({
      ...prev,
      certifications: [
        ...prev.certifications,
        {
          name: "",
          issuingAuthority: "",
          licenseNumber: "",
          issueDate: "",
          expiryDate: "",
        },
      ],
    }));
  };

  const removeCertification = (index: number) => {
    const updatedCertifications = formData.certifications.filter(
      (_: any, i: number) => i !== index
    );
    setFormData((prev) => ({
      ...prev,
      certifications: updatedCertifications,
    }));
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Qualifications Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold">Qualifications</h2>
        {formData.qualifications.map((qualification: Qualification, index: number) => (
          <div key={index} className="p-4 border rounded-md">
            <h3 className="font-semibold mb-2">Qualification {index + 1}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`qualification-name-${index}`}>Name</Label>
                <Input
                  id={`qualification-name-${index}`}
                  value={qualification.name}
                  onChange={(e) =>
                    handleQualificationChange(index, "name", e.target.value)
                  }
                />
              </div>

              <div>
                <Label htmlFor={`qualification-level-${index}`}>Level</Label>
                <Select
                  onValueChange={(value) =>
                    handleQualificationChange(index, "level", value)
                  }
                  value={qualification.level}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Schooling">Schooling</SelectItem>
                    <SelectItem value="Graduate">Graduate</SelectItem>
                    <SelectItem value="Masters">Masters</SelectItem>
                    <SelectItem value="Doctorate">Doctorate</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor={`qualification-specializations-${index}`}>
                  Specializations
                </Label>
                <Input
                  id={`qualification-specializations-${index}`}
                  value={qualification.specializations.join(", ")}
                  onChange={(e) =>
                    handleQualificationChange(
                      index,
                      "specializations",
                      e.target.value
                    )
                  }
                />
              </div>

              <div>
                <Label htmlFor={`qualification-institution-${index}`}>
                  Institution
                </Label>
                <Input
                  id={`qualification-institution-${index}`}
                  value={qualification.institution}
                  onChange={(e) =>
                    handleQualificationChange(index, "institution", e.target.value)
                  }
                />
              </div>

              {/* NEW: Start Date */}
              <div>
                <Label htmlFor={`qualification-startDate-${index}`}>Start Date</Label>
                <Input
                  id={`qualification-startDate-${index}`}
                  type="date"
                  value={qualification.startDate}
                  onChange={(e) =>
                    handleQualificationChange(index, "startDate", e.target.value)
                  }
                />
              </div>

              {/* NEW: End Date */}
              <div>
                <Label htmlFor={`qualification-endDate-${index}`}>End Date</Label>
                <Input
                  id={`qualification-endDate-${index}`}
                  type="date"
                  value={qualification.endDate}
                  onChange={(e) =>
                    handleQualificationChange(index, "endDate", e.target.value)
                  }
                />
              </div>
            </div>

            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="mt-2"
              onClick={() => removeQualification(index)}
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              Remove
            </Button>
          </div>
        ))}
        <Button type="button" onClick={addQualification}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Qualification
        </Button>
      </div>

      {/* Experiences Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold">Experiences</h2>
        {formData.experiences.map((experience: Experience, index: number) => (
          <div key={index} className="p-4 border rounded-md">
            <h3 className="font-semibold mb-2">Experience {index + 1}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`experience-jobTitle-${index}`}>Job Title</Label>
                <Input
                  id={`experience-jobTitle-${index}`}
                  value={experience.jobTitle}
                  onChange={(e) => handleExperienceChange(index, "jobTitle", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor={`experience-company-${index}`}>Company</Label>
                <Input
                  id={`experience-company-${index}`}
                  value={experience.company}
                  onChange={(e) => handleExperienceChange(index, "company", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor={`experience-startDate-${index}`}>Start Date</Label>
                <Input
                  id={`experience-startDate-${index}`}
                  type="date"
                  value={experience.startDate}
                  onChange={(e) => handleExperienceChange(index, "startDate", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor={`experience-endDate-${index}`}>End Date</Label>
                <Input
                  id={`experience-endDate-${index}`}
                  type="date"
                  value={experience.endDate}
                  onChange={(e) => handleExperienceChange(index, "endDate", e.target.value)}
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor={`experience-description-${index}`}>Description</Label>
                <Input
                  id={`experience-description-${index}`}
                  value={experience.description}
                  onChange={(e) => handleExperienceChange(index, "description", e.target.value)}
                />
              </div>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="mt-2"
              onClick={() => removeExperience(index)}
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              Remove
            </Button>
          </div>
        ))}
        <Button type="button" onClick={addExperience}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Experience
        </Button>
      </div>

      {/* Certifications Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold">Certifications</h2>
        {formData.certifications.map((certification: Certification, index: number) => (
          <div key={index} className="p-4 border rounded-md">
            <h3 className="font-semibold mb-2">Certification {index + 1}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`certification-name-${index}`}>Name</Label>
                <Input
                  id={`certification-name-${index}`}
                  value={certification.name}
                  onChange={(e) =>
                    handleCertificationChange(index, "name", e.target.value)
                  }
                />
              </div>
              <div>
                <Label htmlFor={`certification-issuingAuthority-${index}`}>
                  Issuing Authority
                </Label>
                <Input
                  id={`certification-issuingAuthority-${index}`}
                  value={certification.issuingAuthority}
                  onChange={(e) =>
                    handleCertificationChange(index, "issuingAuthority", e.target.value)
                  }
                />
              </div>
              <div>
                <Label htmlFor={`certification-licenseNumber-${index}`}>
                  License Number
                </Label>
                <Input
                  id={`certification-licenseNumber-${index}`}
                  value={certification.licenseNumber}
                  onChange={(e) =>
                    handleCertificationChange(index, "licenseNumber", e.target.value)
                  }
                />
              </div>
              <div>
                <Label htmlFor={`certification-issueDate-${index}`}>Issue Date</Label>
                <Input
                  id={`certification-issueDate-${index}`}
                  type="date"
                  value={certification.issueDate}
                  onChange={(e) =>
                    handleCertificationChange(index, "issueDate", e.target.value)
                  }
                />
              </div>
              <div>
                <Label htmlFor={`certification-expiryDate-${index}`}>Expiry Date</Label>
                <Input
                  id={`certification-expiryDate-${index}`}
                  type="date"
                  value={certification.expiryDate}
                  onChange={(e) =>
                    handleCertificationChange(index, "expiryDate", e.target.value)
                  }
                />
              </div>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="mt-2"
              onClick={() => removeCertification(index)}
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              Remove
            </Button>
          </div>
        ))}
        <Button type="button" onClick={addCertification}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Certification
        </Button>
      </div>
    </div>
  );
};

export default QualificationsForm;
