"use client";

import React, { useState } from "react";
import {
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';


// Shadcn UI components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Types
import { ChangeHistoryEntry } from "@/types/audit";

// Utility: Format ISO date to yyyy-MM-dd for <input type="date">
function formatDate(isoDate?: string) {
  return isoDate ? new Date(isoDate).toISOString().split("T")[0] : "";
}

/**
 * HistorySection component displays the change history for a given field.
 */
function HistorySection({
  field,
  historyList,
  onClose,
}: {
  field: string;
  historyList: ChangeHistoryEntry[];
  onClose: () => void;
}) {
  return (
    <div className="mt-2 p-2 bg-gray-50 border border-gray-300 rounded-md">
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold">History for {field}</span>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
      <ScrollArea className="max-h-48 mt-2">
        {historyList.map((entry, i) => (
          <div key={i} className="border-b pb-1 mb-1">
            <p className="text-xs">
              <strong>{entry.performedBy}</strong> at{" "}
              {new Date(entry.datePerformed).toLocaleString()}
            </p>
            <p className="text-xs">
              <strong>From:</strong> {entry.old}
            </p>
            <p className="text-xs">
              <strong>To:</strong> {entry.new}
            </p>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}

/** Qualification type */
export interface Qualification {
  name: string;
  level: string;
  specializations: string[];
  institution: string;
  startDate?: string;
  endDate?: string;
}

/** Experience type */
export interface Experience {
  jobTitle: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
}

/** Certification type */
export interface Certification {
  name: string;
  issuingAuthority: string;
  licenseNumber: string;
  issueDate: string;
  expiryDate: string;
}

/** QualificationsData type */
export interface QualificationsData {
  qualifications: Qualification[];
  experiences: Experience[];
  certifications: Certification[];
}

/** Props for QualificationsForm */
interface QualificationsFormProps {
  formData: QualificationsData;
  setFormData: React.Dispatch<React.SetStateAction<QualificationsData>>;
  changeHistory: Record<string, ChangeHistoryEntry[]>;
  isEditMode: boolean;
}

/** Helper: Retrieve the history for a given field path */
function getFieldHistory(
  changeHistory: Record<string, ChangeHistoryEntry[]>,
  path: string
): ChangeHistoryEntry[] {
  return changeHistory[path] || [];
}

/** Helper: Get the latest change date for an item given a prefix (e.g. "qualifications.0.") */
function getLatestChangeForItem(
  changeHistory: Record<string, ChangeHistoryEntry[]>,
  itemPath: string
): Date | null {
  let latest: Date | null = null;
  const prefix = itemPath + ".";
  Object.keys(changeHistory).forEach((path) => {
    if (path.startsWith(prefix)) {
      getFieldHistory(changeHistory, path).forEach((entry) => {
        const d = new Date(entry.datePerformed);
        if (!latest || d > latest) {
          latest = d;
        }
      });
    }
  });
  return latest;
}

export default function QualificationsForm({
  formData,
  setFormData,
  changeHistory,
  isEditMode,
}: QualificationsFormProps) {
  // State for expanded rows in each section:
  const [openQualRows, setOpenQualRows] = useState<Record<number, boolean>>({});
  const [openExpRows, setOpenExpRows] = useState<Record<number, boolean>>({});
  const [openCertRows, setOpenCertRows] = useState<Record<number, boolean>>({});
  // State for open history panels (keyed by field path)
  const [openHistoryPanels, setOpenHistoryPanels] = useState<Record<string, boolean>>({});

  // Toggle history panel for a given field path.
  const toggleHistoryPanel = (fieldPath: string) => {
    setOpenHistoryPanels((prev) => ({
      ...prev,
      [fieldPath]: !prev[fieldPath],
    }));
  };

  // =============================
  // Qualifications Logic
  // =============================
  function handleQualificationChange(
    idx: number,
    field: keyof Qualification,
    value: string
  ) {
    const updated = [...formData.qualifications];
    if (field === "specializations") {
      updated[idx].specializations = value.split(",").map((s) => s.trim());
    } else {
      (updated[idx] as any)[field] = value;
    }
    setFormData({ ...formData, qualifications: updated });
  }

  function addQualification() {
    setFormData({
      ...formData,
      qualifications: [
        ...formData.qualifications,
        { name: "", level: "", specializations: [], institution: "", startDate: "", endDate: "" },
      ],
    });
  }

  function removeQualification(idx: number) {
    const updated = formData.qualifications.filter((_, i) => i !== idx);
    setFormData({ ...formData, qualifications: updated });
  }

  function toggleQualRow(idx: number) {
    setOpenQualRows((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }

  // =============================
  // Experiences Logic
  // =============================
  function handleExperienceChange(
    idx: number,
    field: keyof Experience,
    value: string
  ) {
    const updated = [...formData.experiences];
    updated[idx] = { ...updated[idx], [field]: value };
    setFormData({ ...formData, experiences: updated });
  }

  function addExperience() {
    setFormData({
      ...formData,
      experiences: [
        ...formData.experiences,
        { jobTitle: "", company: "", startDate: "", endDate: "", description: "" },
      ],
    });
  }

  function removeExperience(idx: number) {
    const updated = formData.experiences.filter((_, i) => i !== idx);
    setFormData({ ...formData, experiences: updated });
  }

  function toggleExpRow(idx: number) {
    setOpenExpRows((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }

  // =============================
  // Certifications Logic
  // =============================
  function handleCertificationChange(
    idx: number,
    field: keyof Certification,
    value: string
  ) {
    const updated = [...formData.certifications];
    updated[idx] = { ...updated[idx], [field]: value };
    setFormData({ ...formData, certifications: updated });
  }

  function addCertification() {
    setFormData({
      ...formData,
      certifications: [
        ...formData.certifications,
        { name: "", issuingAuthority: "", licenseNumber: "", issueDate: "", expiryDate: "" },
      ],
    });
  }

  function removeCertification(idx: number) {
    const updated = formData.certifications.filter((_, i) => i !== idx);
    setFormData({ ...formData, certifications: updated });
  }

  function toggleCertRow(idx: number) {
    setOpenCertRows((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }

  return (
    <div className="space-y-8 text-gray-900 bg-white p-4 md:p-6 rounded-md shadow-sm">
      {/* QUALIFICATIONS TABLE */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Qualifications</h2>
          {isEditMode && (
            <Button onClick={addQualification} className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 text-white">
              <PlusIcon className="w-4 h-4" />
              Add
            </Button>
          )}
        </div>
        <div className="overflow-x-auto border border-gray-300 rounded-md">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="w-1/4">Level</TableHead>
                <TableHead className="w-1/4">Name</TableHead>
                <TableHead className="w-1/4">Start Date</TableHead>
                <TableHead className="w-1/4">End Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formData.qualifications.map((q, idx) => {
                const rowOpen = openQualRows[idx] || false;
                const itemPath = `qualifications.${idx}`;
                const latestChange = getLatestChangeForItem(changeHistory, itemPath);
                return (
                  <React.Fragment key={idx}>
                    {/* Summary Row */}
                    <TableRow className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{q.level || "N/A"}</span>
                          {latestChange && (
                            <Badge variant="outline" className="text-red-800 border-red-300">
                              Updated {latestChange.toLocaleString()}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{q.level === "Schooling" ? "N/A" : q.name || "N/A"}</TableCell>
                      <TableCell>{formatDate(q.startDate) || "N/A"}</TableCell>
                      <TableCell>{formatDate(q.endDate) || "N/A"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isEditMode && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeQualification(idx)}
                              className="bg-red-700 hover:bg-red-800 text-white"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleQualRow(idx)}
                            className="flex items-center gap-1"
                          >
                            {rowOpen ? (
                              <ChevronDownIcon className="w-4 h-4" />
                            ) : (
                              <ChevronRightIcon className="w-4 h-4" />
                            )}
                            <span>View</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {rowOpen && (
                      <TableRow className="bg-gray-50">
                        <TableCell colSpan={5} className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Level Field */}
                            <div className="relative">
                              <Label className="text-sm">Level</Label>
                              <Select
                                onValueChange={(val) =>
                                  handleQualificationChange(idx, "level", val)
                                }
                                value={q.level}
                                disabled={!isEditMode}
                              >
                                <SelectTrigger className="mt-1 border border-gray-300">
                                  <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border border-gray-300">
                                  <SelectItem value="Schooling">Schooling</SelectItem>
                                  <SelectItem value="Graduate">Graduate</SelectItem>
                                  <SelectItem value="Masters">Masters</SelectItem>
                                  <SelectItem value="Doctorate">Doctorate</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <button
                                type="button"
                                className="absolute top-0 right-0 mt-1 mr-1 text-red-500"
                                onClick={() => toggleHistoryPanel(`${itemPath}.level`)}
                              >
                                <ArrowPathIcon className="w-4 h-4" />
                              </button>
                              {openHistoryPanels[`${itemPath}.level`] && (
                                <HistorySection
                                  field="Level"
                                  historyList={getFieldHistory(changeHistory, `${itemPath}.level`)}
                                  onClose={() => toggleHistoryPanel(`${itemPath}.level`)}
                                />
                              )}
                            </div>

                            {/* Name Field */}
                            {q.level !== "Schooling" && (
                              <div className="relative">
                                <Label className="text-sm">Name</Label>
                                <Input
                                  value={q.name}
                                  onChange={(e) =>
                                    handleQualificationChange(idx, "name", e.target.value)
                                  }
                                  disabled={!isEditMode}
                                  className="mt-1 border border-gray-300"
                                />
                                <button
                                  type="button"
                                  className="absolute top-0 right-0 mt-1 mr-1 text-red-500"
                                  onClick={() => toggleHistoryPanel(`${itemPath}.name`)}
                                >
                                  <ArrowPathIcon className="w-4 h-4" />
                                </button>
                                {openHistoryPanels[`${itemPath}.name`] && (
                                  <HistorySection
                                    field="Name"
                                    historyList={getFieldHistory(changeHistory, `${itemPath}.name`)}
                                    onClose={() => toggleHistoryPanel(`${itemPath}.name`)}
                                  />
                                )}
                              </div>
                            )}

                            {/* Specializations Field */}
                            <div className="relative">
                              <Label className="text-sm">Specializations</Label>
                              <Input
                                value={q.specializations.join(", ")}
                                onChange={(e) =>
                                  handleQualificationChange(idx, "specializations", e.target.value)
                                }
                                disabled={!isEditMode}
                                className="mt-1 border border-gray-300"
                              />
                              <button
                                type="button"
                                className="absolute top-0 right-0 mt-1 mr-1 text-red-500"
                                onClick={() =>
                                  toggleHistoryPanel(`${itemPath}.specializations`)
                                }
                              >
                                <ArrowPathIcon className="w-4 h-4" />
                              </button>
                              {openHistoryPanels[`${itemPath}.specializations`] && (
                                <HistorySection
                                  field="Specializations"
                                  historyList={getFieldHistory(changeHistory, `${itemPath}.specializations`)}
                                  onClose={() => toggleHistoryPanel(`${itemPath}.specializations`)}
                                />
                              )}
                            </div>

                            {/* Institution Field */}
                            <div className="relative md:col-span-2">
                              <Label className="text-sm">Institution (Address)</Label>
                              <textarea
                                value={q.institution}
                                onChange={(e) =>
                                  handleQualificationChange(idx, "institution", e.target.value)
                                }
                                rows={2}
                                disabled={!isEditMode}
                                className="mt-1 w-full border border-gray-300 rounded-md p-2"
                              />
                              <button
                                type="button"
                                className="absolute top-0 right-0 mt-1 mr-1 text-red-500"
                                onClick={() => toggleHistoryPanel(`${itemPath}.institution`)}
                              >
                                <ArrowPathIcon className="w-4 h-4" />
                              </button>
                              {openHistoryPanels[`${itemPath}.institution`] && (
                                <HistorySection
                                  field="Institution"
                                  historyList={getFieldHistory(changeHistory, `${itemPath}.institution`)}
                                  onClose={() => toggleHistoryPanel(`${itemPath}.institution`)}
                                />
                              )}
                            </div>

                            {/* Start Date Field */}
                            <div className="relative">
                              <Label className="text-sm">Start Date</Label>
                              <Input
                                type="date"
                                value={formatDate(q.startDate)}
                                onChange={(e) =>
                                  handleQualificationChange(idx, "startDate", e.target.value)
                                }
                                disabled={!isEditMode}
                                className="mt-1 border border-gray-300"
                              />
                              <button
                                type="button"
                                className="absolute top-0 right-0 mt-1 mr-1 text-red-500"
                                onClick={() => toggleHistoryPanel(`${itemPath}.startDate`)}
                              >
                                <ArrowPathIcon className="w-4 h-4" />
                              </button>
                              {openHistoryPanels[`${itemPath}.startDate`] && (
                                <HistorySection
                                  field="Start Date"
                                  historyList={getFieldHistory(changeHistory, `${itemPath}.startDate`)}
                                  onClose={() => toggleHistoryPanel(`${itemPath}.startDate`)}
                                />
                              )}
                            </div>

                            {/* End Date Field */}
                            <div className="relative">
                              <Label className="text-sm">End Date</Label>
                              <Input
                                type="date"
                                value={formatDate(q.endDate)}
                                onChange={(e) =>
                                  handleQualificationChange(idx, "endDate", e.target.value)
                                }
                                disabled={!isEditMode}
                                className="mt-1 border border-gray-300"
                              />
                              <button
                                type="button"
                                className="absolute top-0 right-0 mt-1 mr-1 text-red-500"
                                onClick={() => toggleHistoryPanel(`${itemPath}.endDate`)}
                              >
                                <ArrowPathIcon className="w-4 h-4" />
                              </button>
                              {openHistoryPanels[`${itemPath}.endDate`] && (
                                <HistorySection
                                  field="End Date"
                                  historyList={getFieldHistory(changeHistory, `${itemPath}.endDate`)}
                                  onClose={() => toggleHistoryPanel(`${itemPath}.endDate`)}
                                />
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* EXPERIENCES TABLE */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-black">Experiences</h2>
          {isEditMode && (
            <Button
              onClick={addExperience}
              className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 text-white"
            >
              <PlusIcon className="w-4 h-4" />
              Add
            </Button>
          )}
        </div>
        <div className="overflow-x-auto border border-gray-300 rounded-md">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="w-1/4">Job Title</TableHead>
                <TableHead className="w-1/4">Company</TableHead>
                <TableHead className="w-1/4">Start Date</TableHead>
                <TableHead className="w-1/4">End Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formData.experiences.map((exp, idx) => {
                const rowOpen = openExpRows[idx] || false;
                const itemPath = `experiences.${idx}`;
                const lastChanged = getLatestChangeForItem(changeHistory, itemPath);
                return (
                  <React.Fragment key={idx}>
                    <TableRow className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{exp.jobTitle || "N/A"}</span>
                          {lastChanged && (
                            <Badge variant="outline" className="text-red-800 border-red-300">
                              Updated {lastChanged.toLocaleString()}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {exp.company ? exp.company.substring(0, 20) : "N/A"}
                        {exp.company && exp.company.length > 20 ? "..." : ""}
                      </TableCell>
                      <TableCell>{formatDate(exp.startDate) || "N/A"}</TableCell>
                      <TableCell>{formatDate(exp.endDate) || "N/A"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2">
                          {isEditMode && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeExperience(idx)}
                              className="bg-red-700 hover:bg-red-800 text-white"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleExpRow(idx)}
                            className="flex items-center gap-1"
                          >
                            {rowOpen ? (
                              <ChevronDownIcon className="w-4 h-4" />
                            ) : (
                              <ChevronRightIcon className="w-4 h-4" />
                            )}
                            <span>View</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {rowOpen && (
                      <TableRow className="bg-gray-50">
                        <TableCell colSpan={5} className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Job Title Field */}
                            <div className="relative">
                              <Label className="text-sm">Job Title</Label>
                              <Input
                                value={exp.jobTitle}
                                onChange={(e) =>
                                  handleExperienceChange(idx, "jobTitle", e.target.value)
                                }
                                disabled={!isEditMode}
                                className="mt-1 border border-gray-300"
                              />
                              <button
                                type="button"
                                className="absolute top-0 right-0 mt-1 mr-1 text-red-500"
                                onClick={() => toggleHistoryPanel(`${itemPath}.jobTitle`)}
                              >
                                <ArrowPathIcon className="w-4 h-4" />
                              </button>
                              {openHistoryPanels[`${itemPath}.jobTitle`] && (
                                <HistorySection
                                  field="Job Title"
                                  historyList={getFieldHistory(changeHistory, `${itemPath}.jobTitle`)}
                                  onClose={() => toggleHistoryPanel(`${itemPath}.jobTitle`)}
                                />
                              )}
                            </div>
                            {/* Company Field */}
                            <div className="relative">
                              <Label className="text-sm">Company</Label>
                              <Input
                                value={exp.company}
                                onChange={(e) =>
                                  handleExperienceChange(idx, "company", e.target.value)
                                }
                                disabled={!isEditMode}
                                className="mt-1 border border-gray-300"
                              />
                              <button
                                type="button"
                                className="absolute top-0 right-0 mt-1 mr-1 text-red-500"
                                onClick={() => toggleHistoryPanel(`${itemPath}.company`)}
                              >
                                <ArrowPathIcon className="w-4 h-4" />
                              </button>
                              {openHistoryPanels[`${itemPath}.company`] && (
                                <HistorySection
                                  field="Company"
                                  historyList={getFieldHistory(changeHistory, `${itemPath}.company`)}
                                  onClose={() => toggleHistoryPanel(`${itemPath}.company`)}
                                />
                              )}
                            </div>
                            {/* Start Date Field */}
                            <div className="relative">
                              <Label className="text-sm">Start Date</Label>
                              <Input
                                type="date"
                                value={formatDate(exp.startDate)}
                                onChange={(e) =>
                                  handleExperienceChange(idx, "startDate", e.target.value)
                                }
                                disabled={!isEditMode}
                                className="mt-1 border border-gray-300"
                              />
                              <button
                                type="button"
                                className="absolute top-0 right-0 mt-1 mr-1 text-red-500"
                                onClick={() => toggleHistoryPanel(`${itemPath}.startDate`)}
                              >
                                <ArrowPathIcon className="w-4 h-4" />
                              </button>
                              {openHistoryPanels[`${itemPath}.startDate`] && (
                                <HistorySection
                                  field="Start Date"
                                  historyList={getFieldHistory(changeHistory, `${itemPath}.startDate`)}
                                  onClose={() => toggleHistoryPanel(`${itemPath}.startDate`)}
                                />
                              )}
                            </div>
                            {/* End Date Field */}
                            <div className="relative">
                              <Label className="text-sm">End Date</Label>
                              <Input
                                type="date"
                                value={formatDate(exp.endDate)}
                                onChange={(e) =>
                                  handleExperienceChange(idx, "endDate", e.target.value)
                                }
                                disabled={!isEditMode}
                                className="mt-1 border border-gray-300"
                              />
                              <button
                                type="button"
                                className="absolute top-0 right-0 mt-1 mr-1 text-red-500"
                                onClick={() => toggleHistoryPanel(`${itemPath}.endDate`)}
                              >
                                <ArrowPathIcon className="w-4 h-4" />
                              </button>
                              {openHistoryPanels[`${itemPath}.endDate`] && (
                                <HistorySection
                                  field="End Date"
                                  historyList={getFieldHistory(changeHistory, `${itemPath}.endDate`)}
                                  onClose={() => toggleHistoryPanel(`${itemPath}.endDate`)}
                                />
                              )}
                            </div>
                            {/* Description Field */}
                            <div className="relative md:col-span-2">
                              <Label className="text-sm">Description</Label>
                              <textarea
                                rows={3}
                                value={exp.description}
                                onChange={(e) =>
                                  handleExperienceChange(idx, "description", e.target.value)
                                }
                                disabled={!isEditMode}
                                className="mt-1 w-full border border-gray-300 rounded-md p-2"
                              />
                              <button
                                type="button"
                                className="absolute top-0 right-0 mt-1 mr-1 text-red-500"
                                onClick={() => toggleHistoryPanel(`${itemPath}.description`)}
                              >
                                <ArrowPathIcon className="w-4 h-4" />
                              </button>
                              {openHistoryPanels[`${itemPath}.description`] && (
                                <HistorySection
                                  field="Description"
                                  historyList={getFieldHistory(changeHistory, `${itemPath}.description`)}
                                  onClose={() => toggleHistoryPanel(`${itemPath}.description`)}
                                />
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* CERTIFICATIONS TABLE */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-black">Certifications</h2>
          {isEditMode && (
            <Button
              onClick={addCertification}
              className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 text-white"
            >
              <PlusIcon className="w-4 h-4" />
              Add
            </Button>
          )}
        </div>
        <div className="overflow-x-auto border border-gray-300 rounded-md">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="w-1/5">Name</TableHead>
                <TableHead className="w-1/5">Issuing Authority</TableHead>
                <TableHead className="w-1/5">Issue Date</TableHead>
                <TableHead className="w-1/5">Expiry Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formData.certifications.map((cert, idx) => {
                const rowOpen = openCertRows[idx] || false;
                const itemPath = `certifications.${idx}`;
                const lastChanged = getLatestChangeForItem(changeHistory, itemPath);
                return (
                  <React.Fragment key={idx}>
                    <TableRow className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{cert.name || "N/A"}</span>
                          {lastChanged && (
                            <Badge variant="outline" className="text-red-800 border-red-300">
                              Updated {lastChanged.toLocaleString()}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {cert.issuingAuthority
                          ? cert.issuingAuthority.substring(0, 20)
                          : "N/A"}
                        {cert.issuingAuthority && cert.issuingAuthority.length > 20 ? "..." : ""}
                      </TableCell>
                      <TableCell>{formatDate(cert.issueDate) || "N/A"}</TableCell>
                      <TableCell>{formatDate(cert.expiryDate) || "N/A"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2">
                          {isEditMode && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeCertification(idx)}
                              className="bg-red-700 hover:bg-red-800 text-white"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleCertRow(idx)}
                            className="flex items-center gap-1"
                          >
                            {rowOpen ? (
                              <ChevronDownIcon className="w-4 h-4" />
                            ) : (
                              <ChevronRightIcon className="w-4 h-4" />
                            )}
                            <span>View</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {rowOpen && (
                      <TableRow className="bg-gray-50">
                        <TableCell colSpan={5} className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Name Field */}
                            <div className="relative">
                              <Label className="text-sm">Name</Label>
                              <Input
                                value={cert.name}
                                onChange={(e) =>
                                  handleCertificationChange(idx, "name", e.target.value)
                                }
                                disabled={!isEditMode}
                                className="mt-1 border border-gray-300"
                              />
                              <button
                                type="button"
                                className="absolute top-0 right-0 mt-1 mr-1 text-red-500"
                                onClick={() => toggleHistoryPanel(`${itemPath}.name`)}
                              >
                                <ArrowPathIcon className="w-4 h-4" />
                              </button>
                              {openHistoryPanels[`${itemPath}.name`] && (
                                <HistorySection
                                  field="Name"
                                  historyList={getFieldHistory(changeHistory, `${itemPath}.name`)}
                                  onClose={() => toggleHistoryPanel(`${itemPath}.name`)}
                                />
                              )}
                            </div>
                            {/* Issuing Authority Field */}
                            <div className="relative">
                              <Label className="text-sm">Issuing Authority</Label>
                              <textarea
                                rows={2}
                                value={cert.issuingAuthority}
                                onChange={(e) =>
                                  handleCertificationChange(idx, "issuingAuthority", e.target.value)
                                }
                                disabled={!isEditMode}
                                className="mt-1 w-full border border-gray-300 rounded-md p-2"
                              />
                              <button
                                type="button"
                                className="absolute top-0 right-0 mt-1 mr-1 text-red-500"
                                onClick={() =>
                                  toggleHistoryPanel(`${itemPath}.issuingAuthority`)
                                }
                              >
                                <ArrowPathIcon className="w-4 h-4" />
                              </button>
                              {openHistoryPanels[`${itemPath}.issuingAuthority`] && (
                                <HistorySection
                                  field="Issuing Authority"
                                  historyList={getFieldHistory(changeHistory, `${itemPath}.issuingAuthority`)}
                                  onClose={() => toggleHistoryPanel(`${itemPath}.issuingAuthority`)}
                                />
                              )}
                            </div>
                            {/* License Number Field */}
                            <div className="relative">
                              <Label className="text-sm">License Number</Label>
                              <Input
                                value={cert.licenseNumber}
                                onChange={(e) =>
                                  handleCertificationChange(idx, "licenseNumber", e.target.value)
                                }
                                disabled={!isEditMode}
                                className="mt-1 border border-gray-300"
                              />
                              <button
                                type="button"
                                className="absolute top-0 right-0 mt-1 mr-1 text-red-500"
                                onClick={() => toggleHistoryPanel(`${itemPath}.licenseNumber`)}
                              >
                                <ArrowPathIcon className="w-4 h-4" />
                              </button>
                              {openHistoryPanels[`${itemPath}.licenseNumber`] && (
                                <HistorySection
                                  field="License Number"
                                  historyList={getFieldHistory(changeHistory, `${itemPath}.licenseNumber`)}
                                  onClose={() => toggleHistoryPanel(`${itemPath}.licenseNumber`)}
                                />
                              )}
                            </div>
                            {/* Issue Date Field */}
                            <div className="relative">
                              <Label className="text-sm">Issue Date</Label>
                              <Input
                                type="date"
                                value={formatDate(cert.issueDate)}
                                onChange={(e) =>
                                  handleCertificationChange(idx, "issueDate", e.target.value)
                                }
                                disabled={!isEditMode}
                                className="mt-1 border border-gray-300"
                              />
                              <button
                                type="button"
                                className="absolute top-0 right-0 mt-1 mr-1 text-red-500"
                                onClick={() => toggleHistoryPanel(`${itemPath}.issueDate`)}
                              >
                                <ArrowPathIcon className="w-4 h-4" />
                              </button>
                              {openHistoryPanels[`${itemPath}.issueDate`] && (
                                <HistorySection
                                  field="Issue Date"
                                  historyList={getFieldHistory(changeHistory, `${itemPath}.issueDate`)}
                                  onClose={() => toggleHistoryPanel(`${itemPath}.issueDate`)}
                                />
                              )}
                            </div>
                            {/* Expiry Date Field */}
                            <div className="relative">
                              <Label className="text-sm">Expiry Date</Label>
                              <Input
                                type="date"
                                value={formatDate(cert.expiryDate)}
                                onChange={(e) =>
                                  handleCertificationChange(idx, "expiryDate", e.target.value)
                                }
                                disabled={!isEditMode}
                                className="mt-1 border border-gray-300"
                              />
                              <button
                                type="button"
                                className="absolute top-0 right-0 mt-1 mr-1 text-red-500"
                                onClick={() => toggleHistoryPanel(`${itemPath}.expiryDate`)}
                              >
                                <ArrowPathIcon className="w-4 h-4" />
                              </button>
                              {openHistoryPanels[`${itemPath}.expiryDate`] && (
                                <HistorySection
                                  field="Expiry Date"
                                  historyList={getFieldHistory(changeHistory, `${itemPath}.expiryDate`)}
                                  onClose={() => toggleHistoryPanel(`${itemPath}.expiryDate`)}
                                />
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
