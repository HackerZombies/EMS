"use client";

import React, { useState } from "react";
import {
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { ChevronDown, ChevronRight, AlertCircle } from "lucide-react";

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
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge"; // For “Recently Updated” status

// Types
import { ChangeHistoryEntry } from "@/types/audit";

export interface Qualification {
  name: string;
  level: string;
  specializations: string[];
  institution: string;
  startDate?: string;
  endDate?: string;
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

export interface QualificationsData {
  qualifications: Qualification[];
  experiences: Experience[];
  certifications: Certification[];
}

interface QualificationsFormProps {
  formData: QualificationsData;
  setFormData: React.Dispatch<React.SetStateAction<QualificationsData>>;
  changeHistory: Record<string, ChangeHistoryEntry[]>;
  isEditMode: boolean;
}

/** Convert ISO date to yyyy-MM-dd for <input type="date"> */
function formatDate(isoDate?: string) {
  return isoDate ? new Date(isoDate).toISOString().split("T")[0] : "";
}

/** Returns all changes for a field path (e.g. “qualifications.0.level”) */
function getFieldHistory(
  changeHistory: Record<string, ChangeHistoryEntry[]>,
  path: string
) {
  return changeHistory[path] || [];
}

/** Finds the largest datePerformed among all changes for an item prefix (e.g. “qualifications.0.”). */
function getLatestChangeForItem(
  changeHistory: Record<string, ChangeHistoryEntry[]>,
  itemPath: string
): Date | null {
  let latest: Date | null = null;
  const prefix = itemPath + ".";
  for (const path of Object.keys(changeHistory)) {
    if (path.startsWith(prefix)) {
      const entries = changeHistory[path];
      for (const entry of entries) {
        const d = new Date(entry.datePerformed);
        if (!latest || d > latest) {
          latest = d;
        }
      }
    }
  }
  return latest;
}

export default function QualificationsForm({
  formData,
  setFormData,
  changeHistory,
  isEditMode,
}: QualificationsFormProps) {
  // track which row is expanded in each table
  const [openQualRows, setOpenQualRows] = useState<Record<number, boolean>>({});
  const [openExpRows, setOpenExpRows] = useState<Record<number, boolean>>({});
  const [openCertRows, setOpenCertRows] = useState<Record<number, boolean>>({});

  // track which field’s history is open
  const [openFields, setOpenFields] = useState<Record<string, boolean>>({});

  /** Toggle a field’s history panel. */
  function toggleFieldHistory(fieldPath: string) {
    setOpenFields((prev) => ({ ...prev, [fieldPath]: !prev[fieldPath] }));
  }

  // ---------------------------
  //    QUALIFICATIONS LOGIC
  // ---------------------------
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
        {
          name: "",
          level: "",
          specializations: [],
          institution: "",
          startDate: "",
          endDate: "",
        },
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

  // ---------------------------
  //    EXPERIENCES LOGIC
  // ---------------------------
  function handleExperienceChange(
    idx: number,
    field: keyof Experience,
    value: string
  ) {
    const updated = [...formData.experiences];
    (updated[idx] as any)[field] = value;
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

  // ---------------------------
  //    CERTIFICATIONS LOGIC
  // ---------------------------
  function handleCertificationChange(
    idx: number,
    field: keyof Certification,
    value: string
  ) {
    const updated = [...formData.certifications];
    (updated[idx] as any)[field] = value;
    setFormData({ ...formData, certifications: updated });
  }

  function addCertification() {
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
  }

  function removeCertification(idx: number) {
    const updated = formData.certifications.filter((_, i) => i !== idx);
    setFormData({ ...formData, certifications: updated });
  }

  function toggleCertRow(idx: number) {
    setOpenCertRows((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }

  // ---------------------------
  //    RENDER
  // ---------------------------
  return (
    <div className="space-y-10 text-gray-900 bg-white/80 p-4 md:p-6 rounded-md shadow-sm">
      {/* QUALIFICATIONS TABLE */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg md:text-xl font-bold text-black">Qualifications</h2>
          {isEditMode && (
            <Button
              onClick={addQualification}
              className="bg-gray-800 hover:bg-gray-700 text-white text-sm md:text-base"
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Add
            </Button>
          )}
        </div>

        {/* Wrap table in an overflow-x-auto container for mobile */}
        <div className="w-full overflow-x-auto border border-gray-300 rounded-md">
          <Table className="min-w-[600px]"> 
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="w-1/4 text-black text-sm md:text-base">Level</TableHead>
                <TableHead className="w-1/4 text-black text-sm md:text-base">Name</TableHead>
                <TableHead className="w-1/4 text-black text-sm md:text-base">Start Date</TableHead>
                <TableHead className="w-1/4 text-black text-sm md:text-base">End Date</TableHead>
                <TableHead className="text-right text-black text-sm md:text-base">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formData.qualifications.map((q, idx) => {
                const rowOpen = openQualRows[idx] || false;
                const itemPath = `qualifications.${idx}`;
                const lastChanged = getLatestChangeForItem(changeHistory, itemPath);

                return (
                  <React.Fragment key={idx}>
                    {/* Summary Row */}
                    <TableRow className="hover:bg-gray-50 text-sm md:text-base">
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {lastChanged && (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span>{q.level || "N/A"}</span>
                          {/* If lastChanged => show badge */}
                          {lastChanged && (
                            <Badge variant="outline" className="text-red-800 border-red-300">
                              Updated {lastChanged.toLocaleString()}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {q.level === "Schooling" ? "N/A" : q.name || "N/A"}
                      </TableCell>
                      <TableCell>{formatDate(q.startDate) || "N/A"}</TableCell>
                      <TableCell>{formatDate(q.endDate) || "N/A"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {isEditMode && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeQualification(idx)}
                              className="bg-red-700 hover:bg-red-800 text-white text-sm md:text-base"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center space-x-1 border-gray-300 text-gray-700 hover:bg-gray-200"
                            onClick={() => toggleQualRow(idx)}
                          >
                            {rowOpen ? (
                              <ChevronDown className="w-4 h-4 text-gray-700" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-700" />
                            )}
                            <span>View</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Row */}
                    {rowOpen && (
                      <TableRow className="bg-gray-50 text-sm md:text-base">
                        <TableCell colSpan={5} className="p-4">
                          {/* Expandable content */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Level */}
                            <div className="relative">
                              <Label className="text-black text-sm md:text-base">Level</Label>
                              <Select
                                onValueChange={(val) =>
                                  handleQualificationChange(idx, "level", val)
                                }
                                value={q.level}
                                disabled={!isEditMode}
                              >
                                <SelectTrigger className="mt-1 border border-gray-300 text-black text-sm md:text-base">
                                  <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border border-gray-300 text-black text-sm md:text-base">
                                  <SelectItem value="Schooling">Schooling</SelectItem>
                                  <SelectItem value="Graduate">Graduate</SelectItem>
                                  <SelectItem value="Masters">Masters</SelectItem>
                                  <SelectItem value="Doctorate">Doctorate</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              {/* Field-level history icon for level */}
                              {getFieldHistory(changeHistory, `${itemPath}.level`).length > 0 && (
                                <HoverCard>
                                  <HoverCardTrigger asChild>
                                    <button
                                      type="button"
                                      className="absolute top-[2.3rem] right-2 text-red-500"
                                      onClick={() => {
                                        toggleFieldHistory(`${itemPath}.level`);
                                      }}
                                    >
                                      <ArrowPathIcon className="w-5 h-5" />
                                    </button>
                                  </HoverCardTrigger>
                                  <HoverCardContent>
                                    <p className="text-sm text-gray-900">Changes History</p>
                                  </HoverCardContent>
                                  {openFields[`${itemPath}.level`] && (
                                    <div className="mt-2 p-4 bg-white border border-gray-200 rounded-md">
                                      <ScrollArea className="h-48 space-y-2 text-sm text-gray-900">
                                        {getFieldHistory(changeHistory, `${itemPath}.level`).map(
                                          (entry, i) => (
                                            <div key={i} className="border-b pb-1">
                                              <p>
                                                <strong>{entry.performedBy}</strong> at{" "}
                                                {new Date(entry.datePerformed).toLocaleString()}
                                              </p>
                                              <p>
                                                <strong>From:</strong> {entry.old}
                                              </p>
                                              <p>
                                                <strong>To:</strong> {entry.new}
                                              </p>
                                            </div>
                                          )
                                        )}
                                      </ScrollArea>
                                    </div>
                                  )}
                                </HoverCard>
                              )}
                            </div>

                            {/* Name (hidden if schooling) */}
                            {q.level !== "Schooling" && (
                              <div>
                                <Label className="text-black text-sm md:text-base">Name</Label>
                                <Input
                                  value={q.name}
                                  onChange={(e) =>
                                    handleQualificationChange(idx, "name", e.target.value)
                                  }
                                  disabled={!isEditMode}
                                  className="border border-gray-300 text-black text-sm md:text-base"
                                />
                              </div>
                            )}

                            {/* Specializations */}
                            <div>
                              <Label className="text-black text-sm md:text-base">
                                Specializations
                              </Label>
                              <Input
                                value={q.specializations.join(", ")}
                                onChange={(e) =>
                                  handleQualificationChange(
                                    idx,
                                    "specializations",
                                    e.target.value
                                  )
                                }
                                disabled={!isEditMode}
                                className="border border-gray-300 text-black text-sm md:text-base"
                              />
                            </div>

                            {/* Institution (textarea) */}
                            <div className="md:col-span-2">
                              <Label className="text-black text-sm md:text-base">
                                Institution (Address)
                              </Label>
                              <textarea
                                value={q.institution}
                                onChange={(e) =>
                                  handleQualificationChange(idx, "institution", e.target.value)
                                }
                                rows={2}
                                disabled={!isEditMode}
                                className="w-full mt-1 border border-gray-300 rounded-md p-2 text-black text-sm md:text-base"
                              />
                            </div>

                            {/* Start Date */}
                            <div>
                              <Label className="text-black text-sm md:text-base">Start Date</Label>
                              <Input
                                type="date"
                                value={formatDate(q.startDate)}
                                onChange={(e) =>
                                  handleQualificationChange(idx, "startDate", e.target.value)
                                }
                                disabled={!isEditMode}
                                className="border border-gray-300 text-black text-sm md:text-base"
                              />
                            </div>

                            {/* End Date */}
                            <div>
                              <Label className="text-black text-sm md:text-base">End Date</Label>
                              <Input
                                type="date"
                                value={formatDate(q.endDate)}
                                onChange={(e) =>
                                  handleQualificationChange(idx, "endDate", e.target.value)
                                }
                                disabled={!isEditMode}
                                className="border border-gray-300 text-black text-sm md:text-base"
                              />
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
          <h2 className="text-lg md:text-xl font-bold text-black">Experiences</h2>
          {isEditMode && (
            <Button
              onClick={addExperience}
              className="bg-gray-800 hover:bg-gray-700 text-white text-sm md:text-base"
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Add
            </Button>
          )}
        </div>

        <div className="w-full overflow-x-auto border border-gray-300 rounded-md">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="w-1/5 text-black text-sm md:text-base">Job Title</TableHead>
                <TableHead className="w-1/5 text-black text-sm md:text-base">Company</TableHead>
                <TableHead className="w-1/5 text-black text-sm md:text-base">Start Date</TableHead>
                <TableHead className="w-1/5 text-black text-sm md:text-base">End Date</TableHead>
                <TableHead className="text-right text-black text-sm md:text-base">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formData.experiences.map((exp, idx) => {
                const rowOpen = openExpRows[idx] || false;
                const itemPath = `experiences.${idx}`;
                const lastChanged = getLatestChangeForItem(changeHistory, itemPath);

                return (
                  <React.Fragment key={idx}>
                    {/* Summary Row */}
                    <TableRow className="hover:bg-gray-50 text-sm md:text-base">
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {lastChanged && (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          )}
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
                        <div className="flex items-center justify-end space-x-2">
                          {isEditMode && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeExperience(idx)}
                              className="bg-red-700 hover:bg-red-800 text-white text-sm md:text-base"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center space-x-1 border-gray-300 text-gray-700 hover:bg-gray-200"
                            onClick={() => toggleExpRow(idx)}
                          >
                            {rowOpen ? (
                              <ChevronDown className="w-4 h-4 text-gray-700" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-700" />
                            )}
                            <span>View</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Row */}
                    {rowOpen && (
                      <TableRow className="bg-gray-50 text-sm md:text-base">
                        <TableCell colSpan={5} className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Job Title */}
                            <div>
                              <Label className="text-black text-sm md:text-base">Job Title</Label>
                              <Input
                                value={exp.jobTitle}
                                onChange={(e) =>
                                  handleExperienceChange(idx, "jobTitle", e.target.value)
                                }
                                disabled={!isEditMode}
                                className="mt-1 border-gray-300 text-black text-sm md:text-base"
                              />
                            </div>

                            {/* Company (textarea) */}
                            <div>
                              <Label className="text-black text-sm md:text-base">Company</Label>
                              <textarea
                                rows={2}
                                value={exp.company}
                                onChange={(e) =>
                                  handleExperienceChange(idx, "company", e.target.value)
                                }
                                disabled={!isEditMode}
                                className="mt-1 w-full border border-gray-300 rounded-md p-2 text-black text-sm md:text-base"
                              />
                            </div>

                            {/* Start Date */}
                            <div>
                              <Label className="text-black text-sm md:text-base">Start Date</Label>
                              <Input
                                type="date"
                                value={formatDate(exp.startDate)}
                                onChange={(e) =>
                                  handleExperienceChange(idx, "startDate", e.target.value)
                                }
                                disabled={!isEditMode}
                                className="mt-1 border-gray-300 text-black text-sm md:text-base"
                              />
                            </div>

                            {/* End Date */}
                            <div>
                              <Label className="text-black text-sm md:text-base">End Date</Label>
                              <Input
                                type="date"
                                value={formatDate(exp.endDate)}
                                onChange={(e) =>
                                  handleExperienceChange(idx, "endDate", e.target.value)
                                }
                                disabled={!isEditMode}
                                className="mt-1 border-gray-300 text-black text-sm md:text-base"
                              />
                            </div>

                            {/* Description */}
                            <div className="md:col-span-2">
                              <Label className="text-black text-sm md:text-base">Description</Label>
                              <textarea
                                rows={3}
                                value={exp.description}
                                onChange={(e) =>
                                  handleExperienceChange(idx, "description", e.target.value)
                                }
                                disabled={!isEditMode}
                                className="mt-1 w-full border border-gray-300 rounded-md p-2 text-black text-sm md:text-base"
                              />
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
          <h2 className="text-lg md:text-xl font-bold text-black">Certifications</h2>
          {isEditMode && (
            <Button
              onClick={addCertification}
              className="bg-gray-800 hover:bg-gray-700 text-white text-sm md:text-base"
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Add
            </Button>
          )}
        </div>

        <div className="w-full overflow-x-auto border border-gray-300 rounded-md">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="w-1/5 text-black text-sm md:text-base">Name</TableHead>
                <TableHead className="w-1/5 text-black text-sm md:text-base">
                  Issuing Authority
                </TableHead>
                <TableHead className="w-1/5 text-black text-sm md:text-base">Issue Date</TableHead>
                <TableHead className="w-1/5 text-black text-sm md:text-base">Expiry Date</TableHead>
                <TableHead className="text-right text-black text-sm md:text-base">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formData.certifications.map((cert, idx) => {
                const rowOpen = openCertRows[idx] || false;
                const itemPath = `certifications.${idx}`;
                const lastChanged = getLatestChangeForItem(changeHistory, itemPath);

                return (
                  <React.Fragment key={idx}>
                    {/* Summary Row */}
                    <TableRow className="hover:bg-gray-50 text-sm md:text-base">
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {lastChanged && (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          )}
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
                        {cert.issuingAuthority &&
                        cert.issuingAuthority.length > 20
                          ? "..."
                          : ""}
                      </TableCell>
                      <TableCell>{formatDate(cert.issueDate) || "N/A"}</TableCell>
                      <TableCell>{formatDate(cert.expiryDate) || "N/A"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {isEditMode && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeCertification(idx)}
                              className="bg-red-700 hover:bg-red-800 text-white text-sm md:text-base"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center space-x-1 border-gray-300 text-gray-700 hover:bg-gray-200"
                            onClick={() => toggleCertRow(idx)}
                          >
                            {rowOpen ? (
                              <ChevronDown className="w-4 h-4 text-gray-700" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-700" />
                            )}
                            <span>View</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Row */}
                    {rowOpen && (
                      <TableRow className="bg-gray-50 text-sm md:text-base">
                        <TableCell colSpan={5} className="p-4">
                          {/* Full detail row */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Name */}
                            <div>
                              <Label className="text-black text-sm md:text-base">Name</Label>
                              <Input
                                value={cert.name}
                                onChange={(e) =>
                                  handleCertificationChange(idx, "name", e.target.value)
                                }
                                disabled={!isEditMode}
                                className="mt-1 border-gray-300 text-black text-sm md:text-base"
                              />
                            </div>

                            {/* Issuing Authority (textarea) */}
                            <div>
                              <Label className="text-black text-sm md:text-base">
                                Issuing Authority
                              </Label>
                              <textarea
                                rows={2}
                                value={cert.issuingAuthority}
                                onChange={(e) =>
                                  handleCertificationChange(
                                    idx,
                                    "issuingAuthority",
                                    e.target.value
                                  )
                                }
                                disabled={!isEditMode}
                                className="mt-1 w-full border border-gray-300 rounded-md p-2 text-black text-sm md:text-base"
                              />
                            </div>

                            {/* License Number */}
                            <div>
                              <Label className="text-black text-sm md:text-base">
                                License Number
                              </Label>
                              <Input
                                value={cert.licenseNumber}
                                onChange={(e) =>
                                  handleCertificationChange(
                                    idx,
                                    "licenseNumber",
                                    e.target.value
                                  )
                                }
                                disabled={!isEditMode}
                                className="mt-1 border-gray-300 text-black text-sm md:text-base"
                              />
                            </div>

                            {/* Issue Date */}
                            <div>
                              <Label className="text-black text-sm md:text-base">Issue Date</Label>
                              <Input
                                type="date"
                                value={formatDate(cert.issueDate)}
                                onChange={(e) =>
                                  handleCertificationChange(idx, "issueDate", e.target.value)
                                }
                                disabled={!isEditMode}
                                className="mt-1 border-gray-300 text-black text-sm md:text-base"
                              />
                            </div>

                            {/* Expiry Date */}
                            <div>
                              <Label className="text-black text-sm md:text-base">Expiry Date</Label>
                              <Input
                                type="date"
                                value={formatDate(cert.expiryDate)}
                                onChange={(e) =>
                                  handleCertificationChange(idx, "expiryDate", e.target.value)
                                }
                                disabled={!isEditMode}
                                className="mt-1 border-gray-300 text-black text-sm md:text-base"
                              />
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
