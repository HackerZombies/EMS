// src/components/EditUserTabs/QualificationsForm.tsx

"use client";

import React, { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PlusIcon, TrashIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChangeHistoryEntry } from "@/types/audit";

// Define interfaces for data
export interface QualificationsData {
  qualifications: Qualification[];
  experiences: Experience[];
  certifications: Certification[];
}

export interface Qualification {
  name: string;
  level: string;
  specializations: string[];
  institution: string;
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

interface QualificationsFormProps {
  formData: QualificationsData;
  setFormData: React.Dispatch<React.SetStateAction<QualificationsData>>;
  changeHistory: Record<string, ChangeHistoryEntry[]>;
  isEditMode: boolean; // Received prop from parent
}

// Helper function to format ISO date to yyyy-MM-dd
const formatDate = (isoDate: string | undefined) =>
  isoDate ? new Date(isoDate).toISOString().split("T")[0] : "";

const QualificationsForm: React.FC<QualificationsFormProps> = ({
  formData,
  setFormData,
  changeHistory,
  isEditMode, // Destructure isEditMode from props
}) => {
  // Track which fields are toggled open (for collapsible)
  const [openFields, setOpenFields] = React.useState<Record<string, boolean>>({});

  // Get history for a particular field path (e.g., "qualifications.0.name")
  const getFieldHistory = (fieldPath: string): ChangeHistoryEntry[] => {
    return changeHistory[fieldPath] || [];
  };

  // Toggle collapsible for a specific field
  const toggleField = (fieldPath: string) => {
    if (!isEditMode) return; // Prevent toggling history when not in edit mode
    setOpenFields((prev) => ({
      ...prev,
      [fieldPath]: !prev[fieldPath],
    }));
  };

  // Reset openFields and pagination when edit mode is disabled
  useEffect(() => {
    if (!isEditMode) {
      setOpenFields({});
    }
  }, [isEditMode]);

  // --- Qualifications Handlers ---
  const handleQualificationChange = (
    index: number,
    field: keyof Qualification,
    value: string
  ) => {
    const updated = [...formData.qualifications];
    if (field === "specializations") {
      // Convert comma-separated string to array
      updated[index][field] = value.split(",").map((s) => s.trim());
    } else {
      updated[index][field] = value;
    }
    setFormData({ ...formData, qualifications: updated });
  };

  const addQualification = () => {
    setFormData({
      ...formData,
      qualifications: [
        ...formData.qualifications,
        { name: "", level: "", specializations: [], institution: "" },
      ],
    });
  };

  const removeQualification = (index: number) => {
    const updated = formData.qualifications.filter((_, i) => i !== index);
    setFormData({ ...formData, qualifications: updated });
  };

  // --- Experiences Handlers ---
  const handleExperienceChange = (
    index: number,
    field: keyof Experience,
    value: string
  ) => {
    const updated = [...formData.experiences];
    updated[index][field] = value;
    setFormData({ ...formData, experiences: updated });
  };

  const addExperience = () => {
    setFormData({
      ...formData,
      experiences: [
        ...formData.experiences,
        { jobTitle: "", company: "", startDate: "", endDate: "", description: "" },
      ],
    });
  };

  const removeExperience = (index: number) => {
    const updated = formData.experiences.filter((_, i) => i !== index);
    setFormData({ ...formData, experiences: updated });
  };

  // --- Certifications Handlers ---
  const handleCertificationChange = (
    index: number,
    field: keyof Certification,
    value: string
  ) => {
    const updated = [...formData.certifications];
    updated[index][field] = value;
    setFormData({ ...formData, certifications: updated });
  };

  const addCertification = () => {
    setFormData({
      ...formData,
      certifications: [
        ...formData.certifications,
        {
          name: "",
          issuingAuthority: "",
          licenseNumber: "",
          issueDate: "",
          expiryDate: "",
        },
      ],
    });
  };

  const removeCertification = (index: number) => {
    const updated = formData.certifications.filter((_, i) => i !== index);
    setFormData({ ...formData, certifications: updated });
  };

  // ------------------ Render ------------------
  return (
    <div className="p-6 bg-white/80 rounded-lg shadow-md space-y-8">
      {/* Main Form Sections */}
      <div className="space-y-8">
        {/* Qualifications */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-700">Qualifications</h2>
            {isEditMode && (
              <Button
                type="button"
                onClick={addQualification}
                className="bg-green-600 hover:bg-green-700 text-white text-sm flex items-center"
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Add Qualification
              </Button>
            )}
          </div>

          {formData.qualifications.map((qualification, index) => {
            const basePath = `qualifications.${index}`;
            return (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 bg-white relative"
              >
                {isEditMode && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white px-2 py-1"
                    onClick={() => removeQualification(index)}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Name */}
                  <div className="relative">
                    <Label className="text-gray-700" htmlFor={`qualification-name-${index}`}>
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`qualification-name-${index}`}
                      value={qualification.name}
                      onChange={(e) =>
                        handleQualificationChange(index, "name", e.target.value)
                      }
                      disabled={!isEditMode}
                      className={`mt-1 bg-white text-gray-900 border border-gray-300 focus:ring-blue-500 ${
                        !isEditMode && "cursor-not-allowed opacity-50"
                      } w-full`}
                    />
                    {/* HoverCard + Collapsible if there's history */}
                    {getFieldHistory(`${basePath}.name`).length > 0 && (
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <button
                            type="button"
                            className="absolute top-[2.2rem] right-2 text-gray-500 hover:text-gray-700"
                            onClick={() => toggleField(`${basePath}.name`)}
                            disabled={!isEditMode}
                          >
                            <ArrowPathIcon className="w-5 h-5" />
                          </button>
                        </HoverCardTrigger>
                        <HoverCardContent>
                          <p className="text-sm">Changes History</p>
                        </HoverCardContent>

                        {/* Collapsible Panel */}
                        <Collapsible open={openFields[`${basePath}.name`] || false}>
                          <CollapsibleContent>
                            <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-md">
                              <ScrollArea className="h-48 space-y-2 text-sm text-gray-700">
                                {getFieldHistory(`${basePath}.name`).map((entry, i) => (
                                  <div key={i} className="border-b pb-2">
                                    <p>
                                      <strong>{entry.performedBy}</strong> changed on{" "}
                                      {new Date(entry.datePerformed).toLocaleString()}
                                    </p>
                                    <p>
                                      <strong>From:</strong> {entry.old}
                                    </p>
                                    <p>
                                      <strong>To:</strong> {entry.new}
                                    </p>
                                  </div>
                                ))}
                              </ScrollArea>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </HoverCard>
                    )}
                  </div>

                  {/* Level */}
                  <div className="relative">
                    <Label className="text-gray-700" htmlFor={`qualification-level-${index}`}>
                      Level <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      onValueChange={(value) =>
                        handleQualificationChange(index, "level", value)
                      }
                      value={qualification.level}
                      disabled={!isEditMode}
                    >
                      <SelectTrigger
                        className={`mt-1 bg-white text-gray-900 border border-gray-300 focus:ring-blue-500 ${
                          !isEditMode && "cursor-not-allowed opacity-50"
                        } w-full`}
                      >
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-300 text-gray-700">
                        <SelectItem value="Schooling">Schooling</SelectItem>
                        <SelectItem value="Graduate">Graduate</SelectItem>
                        <SelectItem value="Masters">Masters</SelectItem>
                        <SelectItem value="Doctorate">Doctorate</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {getFieldHistory(`${basePath}.level`).length > 0 && (
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <button
                            type="button"
                            className="absolute top-[2.2rem] right-2 text-gray-500 hover:text-gray-700"
                            onClick={() => toggleField(`${basePath}.level`)}
                            disabled={!isEditMode}
                          >
                            <ArrowPathIcon className="w-5 h-5" />
                          </button>
                        </HoverCardTrigger>
                        <HoverCardContent>
                          <p className="text-sm">Changes History</p>
                        </HoverCardContent>

                        <Collapsible open={openFields[`${basePath}.level`] || false}>
                          <CollapsibleContent>
                            <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-md">
                              <ScrollArea className="h-48 space-y-2 text-sm text-gray-700">
                                {getFieldHistory(`${basePath}.level`).map((entry, i) => (
                                  <div key={i} className="border-b pb-2">
                                    <p>
                                      <strong>{entry.performedBy}</strong> changed on{" "}
                                      {new Date(entry.datePerformed).toLocaleString()}
                                    </p>
                                    <p>
                                      <strong>From:</strong> {entry.old}
                                    </p>
                                    <p>
                                      <strong>To:</strong> {entry.new}
                                    </p>
                                  </div>
                                ))}
                              </ScrollArea>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </HoverCard>
                    )}
                  </div>

                  {/* Specializations */}
                  <div className="relative">
                    <Label
                      className="text-gray-700"
                      htmlFor={`qualification-specializations-${index}`}
                    >
                      Specializations <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`qualification-specializations-${index}`}
                      value={qualification.specializations.join(", ")}
                      onChange={(e) =>
                        handleQualificationChange(index, "specializations", e.target.value)
                      }
                      placeholder="e.g. Computer Science, Data Analysis"
                      disabled={!isEditMode}
                      className={`mt-1 bg-white text-gray-900 border border-gray-300 focus:ring-blue-500 ${
                        !isEditMode && "cursor-not-allowed opacity-50"
                      } w-full`}
                    />
                    {getFieldHistory(`${basePath}.specializations`).length > 0 && (
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <button
                            type="button"
                            className="absolute top-[2.2rem] right-2 text-gray-500 hover:text-gray-700"
                            onClick={() => toggleField(`${basePath}.specializations`)}
                            disabled={!isEditMode}
                          >
                            <ArrowPathIcon className="w-5 h-5" />
                          </button>
                        </HoverCardTrigger>
                        <HoverCardContent>
                          <p className="text-sm">Changes History</p>
                        </HoverCardContent>

                        <Collapsible open={openFields[`${basePath}.specializations`] || false}>
                          <CollapsibleContent>
                            <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-md">
                              <ScrollArea className="h-48 space-y-2 text-sm text-gray-700">
                                {getFieldHistory(`${basePath}.specializations`).map(
                                  (entry, i) => (
                                    <div key={i} className="border-b pb-2">
                                      <p>
                                        <strong>{entry.performedBy}</strong> changed on{" "}
                                        {new Date(entry.datePerformed).toLocaleString()}
                                      </p>
                                      <p>
                                        <strong>From:</strong>{" "}
                                        {Array.isArray(entry.old)
                                          ? entry.old.join(", ")
                                          : entry.old}
                                      </p>
                                      <p>
                                        <strong>To:</strong>{" "}
                                        {Array.isArray(entry.new)
                                          ? entry.new.join(", ")
                                          : entry.new}
                                      </p>
                                    </div>
                                  )
                                )}
                              </ScrollArea>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </HoverCard>
                    )}
                  </div>

                  {/* Institution */}
                  <div className="relative">
                    <Label
                      className="text-gray-700"
                      htmlFor={`qualification-institution-${index}`}
                    >
                      Institution <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`qualification-institution-${index}`}
                      value={qualification.institution}
                      onChange={(e) =>
                        handleQualificationChange(index, "institution", e.target.value)
                      }
                      disabled={!isEditMode}
                      className={`mt-1 bg-white text-gray-900 border border-gray-300 focus:ring-blue-500 ${
                        !isEditMode && "cursor-not-allowed opacity-50"
                      } w-full`}
                    />
                    {getFieldHistory(`${basePath}.institution`).length > 0 && (
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <button
                            type="button"
                            className="absolute top-[2.2rem] right-2 text-gray-500 hover:text-gray-700"
                            onClick={() => toggleField(`${basePath}.institution`)}
                            disabled={!isEditMode}
                          >
                            <ArrowPathIcon className="w-5 h-5" />
                          </button>
                        </HoverCardTrigger>
                        <HoverCardContent>
                          <p className="text-sm">Changes History</p>
                        </HoverCardContent>

                        <Collapsible open={openFields[`${basePath}.institution`] || false}>
                          <CollapsibleContent>
                            <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-md">
                              <ScrollArea className="h-48 space-y-2 text-sm text-gray-700">
                                {getFieldHistory(`${basePath}.institution`).map((entry, i) => (
                                  <div key={i} className="border-b pb-2">
                                    <p>
                                      <strong>{entry.performedBy}</strong> changed on{" "}
                                      {new Date(entry.datePerformed).toLocaleString()}
                                    </p>
                                    <p>
                                      <strong>From:</strong> {entry.old}
                                    </p>
                                    <p>
                                      <strong>To:</strong> {entry.new}
                                    </p>
                                  </div>
                                ))}
                              </ScrollArea>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </HoverCard>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Experiences */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-700">Experiences</h2>
            {isEditMode && (
              <Button
                type="button"
                onClick={addExperience}
                className="bg-green-600 hover:bg-green-700 text-white text-sm flex items-center"
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Add Experience
              </Button>
            )}
          </div>
          {formData.experiences.map((experience, index) => {
            const basePath = `experiences.${index}`;
            return (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 bg-white relative"
              >
                {isEditMode && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white px-2 py-1"
                    onClick={() => removeExperience(index)}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Job Title */}
                  <div className="relative">
                    <Label className="text-gray-700" htmlFor={`experience-jobTitle-${index}`}>
                      Job Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`experience-jobTitle-${index}`}
                      value={experience.jobTitle}
                      onChange={(e) =>
                        handleExperienceChange(index, "jobTitle", e.target.value)
                      }
                      disabled={!isEditMode}
                      className={`mt-1 bg-white text-gray-900 border border-gray-300 focus:ring-blue-500 ${
                        !isEditMode && "cursor-not-allowed opacity-50"
                      } w-full`}
                    />
                    {getFieldHistory(`${basePath}.jobTitle`).length > 0 && (
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <button
                            type="button"
                            className="absolute top-[2.2rem] right-2 text-gray-500 hover:text-gray-700"
                            onClick={() => toggleField(`${basePath}.jobTitle`)}
                            disabled={!isEditMode}
                          >
                            <ArrowPathIcon className="w-5 h-5" />
                          </button>
                        </HoverCardTrigger>
                        <HoverCardContent>
                          <p className="text-sm">Changes History</p>
                        </HoverCardContent>

                        <Collapsible open={openFields[`${basePath}.jobTitle`] || false}>
                          <CollapsibleContent>
                            <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-md">
                              <ScrollArea className="h-48 space-y-2 text-sm text-gray-700">
                                {getFieldHistory(`${basePath}.jobTitle`).map((entry, i) => (
                                  <div key={i} className="border-b pb-2">
                                    <p>
                                      <strong>{entry.performedBy}</strong> changed on{" "}
                                      {new Date(entry.datePerformed).toLocaleString()}
                                    </p>
                                    <p>
                                      <strong>From:</strong> {entry.old}
                                    </p>
                                    <p>
                                      <strong>To:</strong> {entry.new}
                                    </p>
                                  </div>
                                ))}
                              </ScrollArea>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </HoverCard>
                    )}
                  </div>

                  {/* Company */}
                  <div className="relative">
                    <Label className="text-gray-700" htmlFor={`experience-company-${index}`}>
                      Company <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`experience-company-${index}`}
                      value={experience.company}
                      onChange={(e) =>
                        handleExperienceChange(index, "company", e.target.value)
                      }
                      disabled={!isEditMode}
                      className={`mt-1 bg-white text-gray-900 border border-gray-300 focus:ring-blue-500 ${
                        !isEditMode && "cursor-not-allowed opacity-50"
                      } w-full`}
                    />
                    {getFieldHistory(`${basePath}.company`).length > 0 && (
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <button
                            type="button"
                            className="absolute top-[2.2rem] right-2 text-gray-500 hover:text-gray-700"
                            onClick={() => toggleField(`${basePath}.company`)}
                            disabled={!isEditMode}
                          >
                            <ArrowPathIcon className="w-5 h-5" />
                          </button>
                        </HoverCardTrigger>
                        <HoverCardContent>
                          <p className="text-sm">Changes History</p>
                        </HoverCardContent>

                        <Collapsible open={openFields[`${basePath}.company`] || false}>
                          <CollapsibleContent>
                            <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-md">
                              <ScrollArea className="h-48 space-y-2 text-sm text-gray-700">
                                {getFieldHistory(`${basePath}.company`).map((entry, i) => (
                                  <div key={i} className="border-b pb-2">
                                    <p>
                                      <strong>{entry.performedBy}</strong> changed on{" "}
                                      {new Date(entry.datePerformed).toLocaleString()}
                                    </p>
                                    <p>
                                      <strong>From:</strong> {entry.old}
                                    </p>
                                    <p>
                                      <strong>To:</strong> {entry.new}
                                    </p>
                                  </div>
                                ))}
                              </ScrollArea>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </HoverCard>
                    )}
                  </div>

                  {/* Start Date */}
                  <div className="relative">
                    <Label className="text-gray-700" htmlFor={`experience-startDate-${index}`}>
                      Start Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`experience-startDate-${index}`}
                      type="date"
                      value={formatDate(experience.startDate)}
                      onChange={(e) =>
                        handleExperienceChange(index, "startDate", e.target.value)
                      }
                      disabled={!isEditMode}
                      className={`mt-1 bg-white text-gray-900 border border-gray-300 focus:ring-blue-500 ${
                        !isEditMode && "cursor-not-allowed opacity-50"
                      } w-full`}
                    />
                    {getFieldHistory(`${basePath}.startDate`).length > 0 && (
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <button
                            type="button"
                            className="absolute top-[2.2rem] right-2 text-gray-500 hover:text-gray-700"
                            onClick={() => toggleField(`${basePath}.startDate`)}
                            disabled={!isEditMode}
                          >
                            <ArrowPathIcon className="w-5 h-5" />
                          </button>
                        </HoverCardTrigger>
                        <HoverCardContent>
                          <p className="text-sm">Changes History</p>
                        </HoverCardContent>

                        <Collapsible open={openFields[`${basePath}.startDate`] || false}>
                          <CollapsibleContent>
                            <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-md">
                              <ScrollArea className="h-48 space-y-2 text-sm text-gray-700">
                                {getFieldHistory(`${basePath}.startDate`).map((entry, i) => (
                                  <div key={i} className="border-b pb-2">
                                    <p>
                                      <strong>{entry.performedBy}</strong> changed on{" "}
                                      {new Date(entry.datePerformed).toLocaleString()}
                                    </p>
                                    <p>
                                      <strong>From:</strong>{" "}
                                      {entry.old
                                        ? new Date(entry.old).toLocaleDateString()
                                        : "N/A"}
                                    </p>
                                    <p>
                                      <strong>To:</strong>{" "}
                                      {entry.new
                                        ? new Date(entry.new).toLocaleDateString()
                                        : "N/A"}
                                    </p>
                                  </div>
                                ))}
                              </ScrollArea>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </HoverCard>
                    )}
                  </div>

                  {/* End Date */}
                  <div className="relative">
                    <Label className="text-gray-700" htmlFor={`experience-endDate-${index}`}>
                      End Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`experience-endDate-${index}`}
                      type="date"
                      value={formatDate(experience.endDate)}
                      onChange={(e) =>
                        handleExperienceChange(index, "endDate", e.target.value)
                      }
                      disabled={!isEditMode}
                      className={`mt-1 bg-white text-gray-900 border border-gray-300 focus:ring-blue-500 ${
                        !isEditMode && "cursor-not-allowed opacity-50"
                      } w-full`}
                    />
                    {getFieldHistory(`${basePath}.endDate`).length > 0 && (
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <button
                            type="button"
                            className="absolute top-[2.2rem] right-2 text-gray-500 hover:text-gray-700"
                            onClick={() => toggleField(`${basePath}.endDate`)}
                            disabled={!isEditMode}
                          >
                            <ArrowPathIcon className="w-5 h-5" />
                          </button>
                        </HoverCardTrigger>
                        <HoverCardContent>
                          <p className="text-sm">Changes History</p>
                        </HoverCardContent>

                        <Collapsible open={openFields[`${basePath}.endDate`] || false}>
                          <CollapsibleContent>
                            <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-md">
                              <ScrollArea className="h-48 space-y-2 text-sm text-gray-700">
                                {getFieldHistory(`${basePath}.endDate`).map((entry, i) => (
                                  <div key={i} className="border-b pb-2">
                                    <p>
                                      <strong>{entry.performedBy}</strong> changed on{" "}
                                      {new Date(entry.datePerformed).toLocaleString()}
                                    </p>
                                    <p>
                                      <strong>From:</strong>{" "}
                                      {entry.old
                                        ? new Date(entry.old).toLocaleDateString()
                                        : "N/A"}
                                    </p>
                                    <p>
                                      <strong>To:</strong>{" "}
                                      {entry.new
                                        ? new Date(entry.new).toLocaleDateString()
                                        : "N/A"}
                                    </p>
                                  </div>
                                ))}
                              </ScrollArea>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </HoverCard>
                    )}
                  </div>

                  {/* Description */}
                  <div className="col-span-2 relative">
                    <Label
                      className="text-gray-700"
                      htmlFor={`experience-description-${index}`}
                    >
                      Description <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`experience-description-${index}`}
                      value={experience.description}
                      onChange={(e) =>
                        handleExperienceChange(index, "description", e.target.value)
                      }
                      disabled={!isEditMode}
                      className={`mt-1 bg-white text-gray-900 border border-gray-300 focus:ring-blue-500 ${
                        !isEditMode && "cursor-not-allowed opacity-50"
                      } w-full`}
                    />
                    {getFieldHistory(`${basePath}.description`).length > 0 && (
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <button
                            type="button"
                            className="absolute top-[2.2rem] right-2 text-gray-500 hover:text-gray-700"
                            onClick={() => toggleField(`${basePath}.description`)}
                            disabled={!isEditMode}
                          >
                            <ArrowPathIcon className="w-5 h-5" />
                          </button>
                        </HoverCardTrigger>
                        <HoverCardContent>
                          <p className="text-sm">Changes History</p>
                        </HoverCardContent>

                        <Collapsible open={openFields[`${basePath}.description`] || false}>
                          <CollapsibleContent>
                            <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-md">
                              <ScrollArea className="h-48 space-y-2 text-sm text-gray-700">
                                {getFieldHistory(`${basePath}.description`).map((entry, i) => (
                                  <div key={i} className="border-b pb-2">
                                    <p>
                                      <strong>{entry.performedBy}</strong> changed on{" "}
                                      {new Date(entry.datePerformed).toLocaleString()}
                                    </p>
                                    <p>
                                      <strong>From:</strong> {entry.old}
                                    </p>
                                    <p>
                                      <strong>To:</strong> {entry.new}
                                    </p>
                                  </div>
                                ))}
                              </ScrollArea>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </HoverCard>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Certifications */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-700">Certifications</h2>
            {isEditMode && (
              <Button
                type="button"
                onClick={addCertification}
                className="bg-green-600 hover:bg-green-700 text-white text-sm flex items-center"
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Add Certification
              </Button>
            )}
          </div>
          {formData.certifications.map((certification, index) => {
            const basePath = `certifications.${index}`;
            return (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 bg-white relative"
              >
                {isEditMode && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white px-2 py-1"
                    onClick={() => removeCertification(index)}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Name */}
                  <div className="relative">
                    <Label className="text-gray-700" htmlFor={`cert-name-${index}`}>
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`cert-name-${index}`}
                      value={certification.name}
                      onChange={(e) =>
                        handleCertificationChange(index, "name", e.target.value)
                      }
                      disabled={!isEditMode}
                      className={`mt-1 bg-white text-gray-900 border border-gray-300 focus:ring-blue-500 ${
                        !isEditMode && "cursor-not-allowed opacity-50"
                      } w-full`}
                    />
                    {getFieldHistory(`${basePath}.name`).length > 0 && (
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <button
                            type="button"
                            className="absolute top-[2.2rem] right-2 text-gray-500 hover:text-gray-700"
                            onClick={() => toggleField(`${basePath}.name`)}
                            disabled={!isEditMode}
                          >
                            <ArrowPathIcon className="w-5 h-5" />
                          </button>
                        </HoverCardTrigger>
                        <HoverCardContent>
                          <p className="text-sm">Changes History</p>
                        </HoverCardContent>

                        <Collapsible open={openFields[`${basePath}.name`] || false}>
                          <CollapsibleContent>
                            <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-md">
                              <ScrollArea className="h-48 space-y-2 text-sm text-gray-700">
                                {getFieldHistory(`${basePath}.name`).map((entry, i) => (
                                  <div key={i} className="border-b pb-2">
                                    <p>
                                      <strong>{entry.performedBy}</strong> changed on{" "}
                                      {new Date(entry.datePerformed).toLocaleString()}
                                    </p>
                                    <p>
                                      <strong>From:</strong> {entry.old}
                                    </p>
                                    <p>
                                      <strong>To:</strong> {entry.new}
                                    </p>
                                  </div>
                                ))}
                              </ScrollArea>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </HoverCard>
                    )}
                  </div>

                  {/* Issuing Authority */}
                  <div className="relative">
                    <Label
                      className="text-gray-700"
                      htmlFor={`cert-issuingAuthority-${index}`}
                    >
                      Issuing Authority <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`cert-issuingAuthority-${index}`}
                      value={certification.issuingAuthority}
                      onChange={(e) =>
                        handleCertificationChange(index, "issuingAuthority", e.target.value)
                      }
                      disabled={!isEditMode}
                      className={`mt-1 bg-white text-gray-900 border border-gray-300 focus:ring-blue-500 ${
                        !isEditMode && "cursor-not-allowed opacity-50"
                      } w-full`}
                    />
                    {getFieldHistory(`${basePath}.issuingAuthority`).length > 0 && (
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <button
                            type="button"
                            className="absolute top-[2.2rem] right-2 text-gray-500 hover:text-gray-700"
                            onClick={() => toggleField(`${basePath}.issuingAuthority`)}
                            disabled={!isEditMode}
                          >
                            <ArrowPathIcon className="w-5 h-5" />
                          </button>
                        </HoverCardTrigger>
                        <HoverCardContent>
                          <p className="text-sm">Changes History</p>
                        </HoverCardContent>

                        <Collapsible open={openFields[`${basePath}.issuingAuthority`] || false}>
                          <CollapsibleContent>
                            <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-md">
                              <ScrollArea className="h-48 space-y-2 text-sm text-gray-700">
                                {getFieldHistory(`${basePath}.issuingAuthority`).map((entry, i) => (
                                  <div key={i} className="border-b pb-2">
                                    <p>
                                      <strong>{entry.performedBy}</strong> changed on{" "}
                                      {new Date(entry.datePerformed).toLocaleString()}
                                    </p>
                                    <p>
                                      <strong>From:</strong> {entry.old}
                                    </p>
                                    <p>
                                      <strong>To:</strong> {entry.new}
                                    </p>
                                  </div>
                                ))}
                              </ScrollArea>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </HoverCard>
                    )}
                  </div>

                  {/* License Number */}
                  <div className="relative">
                    <Label
                      className="text-gray-700"
                      htmlFor={`cert-licenseNumber-${index}`}
                    >
                      License Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`cert-licenseNumber-${index}`}
                      value={certification.licenseNumber}
                      onChange={(e) =>
                        handleCertificationChange(index, "licenseNumber", e.target.value)
                      }
                      disabled={!isEditMode}
                      className={`mt-1 bg-white text-gray-900 border border-gray-300 focus:ring-blue-500 ${
                        !isEditMode && "cursor-not-allowed opacity-50"
                      } w-full`}
                    />
                    {getFieldHistory(`${basePath}.licenseNumber`).length > 0 && (
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <button
                            type="button"
                            className="absolute top-[2.2rem] right-2 text-gray-500 hover:text-gray-700"
                            onClick={() => toggleField(`${basePath}.licenseNumber`)}
                            disabled={!isEditMode}
                          >
                            <ArrowPathIcon className="w-5 h-5" />
                          </button>
                        </HoverCardTrigger>
                        <HoverCardContent>
                          <p className="text-sm">Changes History</p>
                        </HoverCardContent>

                        <Collapsible open={openFields[`${basePath}.licenseNumber`] || false}>
                          <CollapsibleContent>
                            <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-md">
                              <ScrollArea className="h-48 space-y-2 text-sm text-gray-700">
                                {getFieldHistory(`${basePath}.licenseNumber`).map((entry, i) => (
                                  <div key={i} className="border-b pb-2">
                                    <p>
                                      <strong>{entry.performedBy}</strong> changed on{" "}
                                      {new Date(entry.datePerformed).toLocaleString()}
                                    </p>
                                    <p>
                                      <strong>From:</strong> {entry.old}
                                    </p>
                                    <p>
                                      <strong>To:</strong> {entry.new}
                                    </p>
                                  </div>
                                ))}
                              </ScrollArea>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </HoverCard>
                    )}
                  </div>

                  {/* Issue Date */}
                  <div className="relative">
                    <Label className="text-gray-700" htmlFor={`cert-issueDate-${index}`}>
                      Issue Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`cert-issueDate-${index}`}
                      type="date"
                      value={formatDate(certification.issueDate)}
                      onChange={(e) =>
                        handleCertificationChange(index, "issueDate", e.target.value)
                      }
                      disabled={!isEditMode}
                      className={`mt-1 bg-white text-gray-900 border border-gray-300 focus:ring-blue-500 ${
                        !isEditMode && "cursor-not-allowed opacity-50"
                      } w-full`}
                    />
                    {getFieldHistory(`${basePath}.issueDate`).length > 0 && (
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <button
                            type="button"
                            className="absolute top-[2.2rem] right-2 text-gray-500 hover:text-gray-700"
                            onClick={() => toggleField(`${basePath}.issueDate`)}
                            disabled={!isEditMode}
                          >
                            <ArrowPathIcon className="w-5 h-5" />
                          </button>
                        </HoverCardTrigger>
                        <HoverCardContent>
                          <p className="text-sm">Changes History</p>
                        </HoverCardContent>

                        <Collapsible open={openFields[`${basePath}.issueDate`] || false}>
                          <CollapsibleContent>
                            <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-md">
                              <ScrollArea className="h-48 space-y-2 text-sm text-gray-700">
                                {getFieldHistory(`${basePath}.issueDate`).map((entry, i) => (
                                  <div key={i} className="border-b pb-2">
                                    <p>
                                      <strong>{entry.performedBy}</strong> changed on{" "}
                                      {new Date(entry.datePerformed).toLocaleString()}
                                    </p>
                                    <p>
                                      <strong>From:</strong>{" "}
                                      {entry.old
                                        ? new Date(entry.old).toLocaleDateString()
                                        : "N/A"}
                                    </p>
                                    <p>
                                      <strong>To:</strong>{" "}
                                      {entry.new
                                        ? new Date(entry.new).toLocaleDateString()
                                        : "N/A"}
                                    </p>
                                  </div>
                                ))}
                              </ScrollArea>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </HoverCard>
                    )}
                  </div>

                  {/* Expiry Date */}
                  <div className="relative">
                    <Label className="text-gray-700" htmlFor={`cert-expiryDate-${index}`}>
                      Expiry Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`cert-expiryDate-${index}`}
                      type="date"
                      value={formatDate(certification.expiryDate)}
                      onChange={(e) =>
                        handleCertificationChange(index, "expiryDate", e.target.value)
                      }
                      disabled={!isEditMode}
                      className={`mt-1 bg-white text-gray-900 border border-gray-300 focus:ring-blue-500 ${
                        !isEditMode && "cursor-not-allowed opacity-50"
                      } w-full`}
                    />
                    {getFieldHistory(`${basePath}.expiryDate`).length > 0 && (
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <button
                            type="button"
                            className="absolute top-[2.2rem] right-2 text-gray-500 hover:text-gray-700"
                            onClick={() => toggleField(`${basePath}.expiryDate`)}
                            disabled={!isEditMode}
                          >
                            <ArrowPathIcon className="w-5 h-5" />
                          </button>
                        </HoverCardTrigger>
                        <HoverCardContent>
                          <p className="text-sm">Changes History</p>
                        </HoverCardContent>

                        <Collapsible open={openFields[`${basePath}.expiryDate`] || false}>
                          <CollapsibleContent>
                            <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-md">
                              <ScrollArea className="h-48 space-y-2 text-sm text-gray-700">
                                {getFieldHistory(`${basePath}.expiryDate`).map((entry, i) => (
                                  <div key={i} className="border-b pb-2">
                                    <p>
                                      <strong>{entry.performedBy}</strong> changed on{" "}
                                      {new Date(entry.datePerformed).toLocaleString()}
                                    </p>
                                    <p>
                                      <strong>From:</strong>{" "}
                                      {entry.old
                                        ? new Date(entry.old).toLocaleDateString()
                                        : "N/A"}
                                    </p>
                                    <p>
                                      <strong>To:</strong>{" "}
                                      {entry.new
                                        ? new Date(entry.new).toLocaleDateString()
                                        : "N/A"}
                                    </p>
                                  </div>
                                ))}
                              </ScrollArea>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </HoverCard>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
};

export default QualificationsForm;
