// src/components/EditUserTabs/GeneralInfo.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Camera, History, ChevronDown, ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Modal } from "@/components/ui/modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ----------- Types -----------

export interface Address {
  flat: string;
  street: string;
  landmark: string;
  city: string;
  district: string;
  state: string;
  pin: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
  email: string;
}

export interface PersonalInfoData {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  dob?: string;
  nationality?: string;
  gender?: string;
  bloodGroup?: string;
  residentialAddress: Address;
  permanentAddress: Address;
  sameAsResidential?: boolean;
  profileImageUrl?: string;
  emergencyContacts: EmergencyContact[];
  resetPassword?: boolean;
}

export interface ChangeHistoryEntry {
  old: any;
  new: any;
  datePerformed: string;
  performedBy: string;
}

// For pagination in history
const ITEMS_PER_PAGE = 5;

// Simple email check
function isValidEmail(email: string) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

// Safely display changes
function formatValue(val: any): string {
  if (val == null) return "N/A";
  if (typeof val === "object") {
    return JSON.stringify(val);
  }
  return String(val);
}

// ---------- Subcomponent: HistorySection ----------
function HistorySection({
  field,
  historyList,
  totalCount,
  currentPage,
  onPageChange,
  customLabel,
}: {
  field: string;
  historyList: ChangeHistoryEntry[];
  totalCount: number;
  currentPage: number;
  onPageChange: (field: string, dir: "prev" | "next") => void;
  customLabel?: string;
}) {
  const maxPage = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="mt-2 p-4 bg-white/70 border border-gray-200 rounded-md space-y-2 text-red-900">
      <h4 className="text-sm font-semibold flex items-center space-x-1">
        <History className="w-4 h-4 text-blue-500" />
        <span>
          {customLabel ? `${customLabel} Change History` : "Change History"}
        </span>
      </h4>
      <ul className="space-y-2">
        {historyList.map((entry, idx) => (
          <li key={idx} className="flex items-start">
            <History className="w-4 h-4 text-blue-500 mr-3" />
            <div>
              <p className="text-sm">
                <strong>{entry.performedBy}</strong> changed{" "}
                <strong>{customLabel || field}</strong> on{" "}
                {new Date(entry.datePerformed).toLocaleString()}
              </p>
              <p className="text-sm">From: {formatValue(entry.old)}</p>
              <p className="text-sm">To: {formatValue(entry.new)}</p>
            </div>
          </li>
        ))}
      </ul>

      {totalCount > ITEMS_PER_PAGE && (
        <div className="flex justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => onPageChange(field, "prev")}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === maxPage}
            onClick={() => onPageChange(field, "next")}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------- Main Component ----------
interface PersonalInfoFormProps {
  userUsername?: string; // The username from the parent
  formData: PersonalInfoData;
  setFormData: React.Dispatch<React.SetStateAction<PersonalInfoData>>;
  changeHistory: Record<string, ChangeHistoryEntry[]>;
  isEditMode: boolean;
}

export default function PersonalInfoForm({
  userUsername,
  formData,
  setFormData,
  changeHistory,
  isEditMode,
}: PersonalInfoFormProps) {
  // Profile image preview & modal
  const [profilePreview, setProfilePreview] = useState<string | null>(
    formData.profileImageUrl || null
  );
  const [isModalOpen, setModalOpen] = useState(false);

  // Sync local preview whenever `formData.profileImageUrl` changes
  useEffect(() => {
    setProfilePreview(formData.profileImageUrl || null);
  }, [formData.profileImageUrl]);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Collapsible states
  const [isResidentialOpen, setResidentialOpen] = useState(false);
  const [isPermanentOpen, setPermanentOpen] = useState(false);
  const [isContactsOpen, setContactsOpen] = useState(false);

  // History toggles/pagination
  const [openFields, setOpenFields] = useState<Record<string, boolean>>({});
  const [pagination, setPagination] = useState<Record<string, number>>({});

  function validate() {
    const newErr: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErr.firstName = "First name is required.";
    }
    if (!formData.lastName.trim()) {
      newErr.lastName = "Last name is required.";
    }
    if (!formData.email.trim()) {
      newErr.email = "Email is required.";
    } else if (!isValidEmail(formData.email)) {
      newErr.email = "Please enter a valid email.";
    }

    setErrors(newErr);
    return Object.keys(newErr).length === 0;
  }

  // History logic
  const getFieldHistory = (fld: string) => changeHistory[fld] || [];
  function toggleFieldHistory(fld: string) {
    setOpenFields((prev) => ({ ...prev, [fld]: !prev[fld] }));
  }
  function handlePageChange(fld: string, dir: "prev" | "next") {
    setPagination((prev) => {
      const cur = prev[fld] || 1;
      const max = Math.ceil(getFieldHistory(fld).length / ITEMS_PER_PAGE);
      let newVal = cur;
      if (dir === "prev" && cur > 1) newVal -= 1;
      if (dir === "next" && cur < max) newVal += 1;
      return { ...prev, [fld]: newVal };
    });
  }
  function getPaginatedHistory(fld: string) {
    const h = getFieldHistory(fld);
    const p = pagination[fld] || 1;
    return h.slice((p - 1) * ITEMS_PER_PAGE, p * ITEMS_PER_PAGE);
  }
  function renderHistoryIcon(fld: string) {
    if (getFieldHistory(fld).length > 0) {
      return (
        <button
          type="button"
          className="ml-2 text-gray-500 hover:text-gray-700"
          onClick={() => toggleFieldHistory(fld)}
        >
          <History className="w-5 h-5" />
        </button>
      );
    }
    return null;
  }

  // Address helpers
  function updateAddress(
    which: "residentialAddress" | "permanentAddress",
    field: keyof Address,
    value: string
  ) {
    if (field === "pin") {
      value = value.replace(/\D/g, "").slice(0, 6);
    }
    setFormData((prev) => ({
      ...prev,
      [which]: {
        ...prev[which],
        [field]: value,
      },
    }));
  }
  function handleSameAsResidential(checked: boolean) {
    setFormData((prev) => {
      const updated = { ...prev, sameAsResidential: checked };
      if (checked) {
        updated.permanentAddress = { ...prev.residentialAddress };
      }
      return updated;
    });
  }

  useEffect(() => {
    if (formData.sameAsResidential) {
      setFormData((prev) => ({
        ...prev,
        permanentAddress: { ...prev.residentialAddress },
      }));
    }
  }, [formData.sameAsResidential, formData.residentialAddress, setFormData]);

  // Emergency contacts
  function handleEmergencyContactChange(
    idx: number,
    field: keyof EmergencyContact,
    value: string
  ) {
    if (field === "phoneNumber") {
      value = value.replace(/\D/g, "").slice(0, 10);
    }
    const updated = [...formData.emergencyContacts];
    updated[idx] = { ...updated[idx], [field]: value };
    setFormData((prev) => ({ ...prev, emergencyContacts: updated }));
  }
  function addEmergencyContact() {
    setFormData((prev) => ({
      ...prev,
      emergencyContacts: [
        ...prev.emergencyContacts,
        { name: "", relationship: "", phoneNumber: "", email: "" },
      ],
    }));
    setContactsOpen(true);
  }
  function removeEmergencyContact(idx: number) {
    const updated = formData.emergencyContacts.filter((_, i) => i !== idx);
    setFormData((prev) => ({ ...prev, emergencyContacts: updated }));
  }

  // -------------- Image Upload --------------
  async function handleImageUpload(file: File) {
    if (!file) return;
    if (!userUsername) {
      console.error("No username provided to PersonalInfoForm!");
      return;
    }

    try {
      const fd = new FormData();
      // The field name below must match your upload endpoint's expected field name ("image")
      fd.append("image", file);

      const res = await fetch(`/api/users/employee-photos/${userUsername}`, {
        method: "PUT",
        body: fd,
      });

      if (!res.ok) {
        throw new Error("Upload to Cloudinary failed");
      }

      const text = await res.text();
      console.log('Raw response:', text);
      const data = JSON.parse(text);
      console.log("New profile image URL:", data.profileImageUrl);

      setFormData((prev) => ({ ...prev, profileImageUrl: data.profileImageUrl }));
      setProfilePreview(data.profileImageUrl);
    } catch (error) {
      console.error("Image upload error:", error);
    }
  }

  function onProfileImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      // Show local preview while uploading...
      setProfilePreview(URL.createObjectURL(file));
      handleImageUpload(file);
    }
  }

  // Reset password select handler
  function handleResetPassword(val: string) {
    setFormData((prev) => ({
      ...prev,
      resetPassword: val === "true",
    }));
  }

  return (
    <div className="space-y-6 text-gray-900">
      {/* Profile & Basic Info */}
      <Card className="shadow-[0_10px_30px_rgba(0,0,0,0.15)] bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-md border border-gray-200 rounded-xl">
        <CardHeader>
          <CardTitle className="text-black">Profile & Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Image */}
            <div className="p-4 rounded-lg shadow-sm bg-white/60 flex flex-col items-center">
              <Label className="mb-2 font-semibold">Profile Image</Label>
              <div className="relative w-60 h-60 overflow-hidden border-2 border-blue-200 bg-gray-100 flex items-center justify-center group rounded-md">
                {profilePreview ? (
                  <img
                    src={profilePreview}
                    alt="Profile Preview"
                    className="object-cover w-full h-full cursor-pointer transition-transform duration-300 group-hover:scale-110"
                    onClick={() => isEditMode && setModalOpen(true)}
                  />
                ) : (
                  <svg
                    className="w-16 h-16 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-3.33 0-9 1.67-9 5v1h18v-1c0-3.33-5.67-5-9-5z" />
                  </svg>
                )}
                {isEditMode && (
                  <>
                    <label
                      htmlFor="profileImage"
                      className="absolute bottom-1 right-1 bg-blue-600/80 p-1 rounded-full cursor-pointer hover:bg-blue-700 transition-colors"
                    >
                      <Camera size={16} className="text-white" />
                    </label>
                    <input
                      id="profileImage"
                      type="file"
                      accept="image/*"
                      disabled={!isEditMode}
                      onChange={onProfileImageChange}
                      className="hidden"
                    />
                  </>
                )}
              </div>

              {isModalOpen && (
                <Modal onClose={() => setModalOpen(false)}>
                  {profilePreview && (
                    <img
                      src={profilePreview}
                      alt="Enlarged Profile"
                      className="max-w-full max-h-full"
                    />
                  )}
                </Modal>
              )}
            </div>

            {/* Basic Fields */}
            <div className="p-4 rounded-lg shadow-sm bg-white/60 space-y-4">
              {/* First Name */}
              <div>
                <Label htmlFor="firstName" className="font-semibold text-black">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center">
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, firstName: e.target.value }))
                    }
                    disabled={!isEditMode}
                  />
                  {renderHistoryIcon("firstName")}
                </div>
                {/* Conditionally render history details */}
                {openFields["firstName"] && (
                  <HistorySection
                    field="firstName"
                    historyList={getFieldHistory("firstName")}
                    totalCount={getFieldHistory("firstName").length}
                    currentPage={pagination["firstName"] || 1}
                    onPageChange={handlePageChange}
                  />
                )}
                {errors.firstName && (
                  <p className="text-red-500 text-sm">{errors.firstName}</p>
                )}
              </div>

              {/* Middle Name */}
              <div>
                <Label htmlFor="middleName" className="font-semibold text-black">
                  Middle Name
                </Label>
                <div className="flex items-center">
                  <Input
                    id="middleName"
                    value={formData.middleName || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, middleName: e.target.value }))
                    }
                    disabled={!isEditMode}
                  />
                  {renderHistoryIcon("middleName")}
                </div>
                {openFields["middleName"] && (
                  <HistorySection
                    field="middleName"
                    historyList={getFieldHistory("middleName")}
                    totalCount={getFieldHistory("middleName").length}
                    currentPage={pagination["middleName"] || 1}
                    onPageChange={handlePageChange}
                  />
                )}
              </div>

              {/* Last Name */}
              <div>
                <Label htmlFor="lastName" className="font-semibold text-black">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center">
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                    }
                    disabled={!isEditMode}
                  />
                  {renderHistoryIcon("lastName")}
                </div>
                {openFields["lastName"] && (
                  <HistorySection
                    field="lastName"
                    historyList={getFieldHistory("lastName")}
                    totalCount={getFieldHistory("lastName").length}
                    currentPage={pagination["lastName"] || 1}
                    onPageChange={handlePageChange}
                  />
                )}
                {errors.lastName && (
                  <p className="text-red-500 text-sm">{errors.lastName}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="font-semibold text-black">
                  Email <span className="text-red-500">*</span>
                </Label>
                <p className="text-xs text-gray-500 mb-1">
                  Format: user@example.com
                </p>
                <div className="flex items-center">
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    disabled={!isEditMode}
                  />
                  {renderHistoryIcon("email")}
                </div>
                {openFields["email"] && (
                  <HistorySection
                    field="email"
                    historyList={getFieldHistory("email")}
                    totalCount={getFieldHistory("email").length}
                    currentPage={pagination["email"] || 1}
                    onPageChange={handlePageChange}
                  />
                )}
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <Card className="shadow-[0_10px_30px_rgba(0,0,0,0.15)] bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-md border border-gray-200 rounded-xl">
        <CardHeader>
          <CardTitle className="text-black">Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* DOB */}
            <div>
              <Label>Date of Birth *</Label>
              <div className="flex items-center">
                <Input
                  type="date"
                  value={formData.dob ? formData.dob.split("T")[0] : ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, dob: e.target.value }))
                  }
                  disabled={!isEditMode}
                />
                {renderHistoryIcon("dob")}
              </div>
              {openFields["dob"] && (
                <HistorySection
                  field="dob"
                  historyList={getFieldHistory("dob")}
                  totalCount={getFieldHistory("dob").length}
                  currentPage={pagination["dob"] || 1}
                  onPageChange={handlePageChange}
                />
              )}
            </div>

            {/* Nationality */}
            <div>
              <Label>Nationality *</Label>
              <div className="flex items-center">
                <Input
                  value={formData.nationality || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nationality: e.target.value }))
                  }
                  disabled={!isEditMode}
                />
                {renderHistoryIcon("nationality")}
              </div>
              {openFields["nationality"] && (
                <HistorySection
                  field="nationality"
                  historyList={getFieldHistory("nationality")}
                  totalCount={getFieldHistory("nationality").length}
                  currentPage={pagination["nationality"] || 1}
                  onPageChange={handlePageChange}
                />
              )}
            </div>

            {/* Gender */}
            <div>
              <Label>Gender *</Label>
              <Select
                value={formData.gender || ""}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, gender: val }))
                }
                disabled={!isEditMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {renderHistoryIcon("gender")}
              {openFields["gender"] && (
                <HistorySection
                  field="gender"
                  historyList={getFieldHistory("gender")}
                  totalCount={getFieldHistory("gender").length}
                  currentPage={pagination["gender"] || 1}
                  onPageChange={handlePageChange}
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Blood Group */}
            <div>
              <Label>Blood Group *</Label>
              <Select
                value={formData.bloodGroup || ""}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, bloodGroup: val }))
                }
                disabled={!isEditMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A_POSITIVE">A+</SelectItem>
                  <SelectItem value="A_NEGATIVE">A-</SelectItem>
                  <SelectItem value="B_POSITIVE">B+</SelectItem>
                  <SelectItem value="B_NEGATIVE">B-</SelectItem>
                  <SelectItem value="AB_POSITIVE">AB+</SelectItem>
                  <SelectItem value="AB_NEGATIVE">AB-</SelectItem>
                  <SelectItem value="O_POSITIVE">O+</SelectItem>
                  <SelectItem value="O_NEGATIVE">O-</SelectItem>
                  <SelectItem value="UNKNOWN">Unknown</SelectItem>
                </SelectContent>
              </Select>
              {renderHistoryIcon("bloodGroup")}
              {openFields["bloodGroup"] && (
                <HistorySection
                  field="bloodGroup"
                  historyList={getFieldHistory("bloodGroup")}
                  totalCount={getFieldHistory("bloodGroup").length}
                  currentPage={pagination["bloodGroup"] || 1}
                  onPageChange={handlePageChange}
                />
              )}
            </div>

            {/* Phone Number */}
            <div>
              <Label>Phone Number *</Label>
              <p className="text-xs text-gray-500 mb-1">
                Must be exactly 10 digits (no dashes/spaces).
              </p>
              <div className="flex items-center">
                <Input
                  type="tel"
                  value={formData.phoneNumber || ""}
                  maxLength={10}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setFormData((prev) => ({ ...prev, phoneNumber: val }));
                  }}
                  disabled={!isEditMode}
                />
                {renderHistoryIcon("phoneNumber")}
              </div>
              {openFields["phoneNumber"] && (
                <HistorySection
                  field="phoneNumber"
                  historyList={getFieldHistory("phoneNumber")}
                  totalCount={getFieldHistory("phoneNumber").length}
                  currentPage={pagination["phoneNumber"] || 1}
                  onPageChange={handlePageChange}
                />
              )}
            </div>

            {/* Reset Password */}
            {isEditMode && (
              <div className="flex flex-col justify-center">
                <Label className="mb-1 font-medium">Reset Password</Label>
                <Select
                  value={formData.resetPassword ? "true" : "false"}
                  onValueChange={handleResetPassword}
                  disabled={!isEditMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">No</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Address Info */}
      <Card className="shadow-[0_10px_30px_rgba(0,0,0,0.15)] bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-md border border-gray-200 rounded-xl">
        <CardHeader>
          <CardTitle className="text-black">Address Information</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Residential Address */}
          <Collapsible
            open={isResidentialOpen}
            onOpenChange={setResidentialOpen}
          >
            <div className="flex items-center justify-between">
              <Label className="font-semibold">
                Residential Address <span className="text-red-500">*</span>
              </Label>
              {renderHistoryIcon("residentialAddress")}
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="ml-2">
                  {isResidentialOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="mt-2">
              <p className="text-xs text-gray-500 mb-2">
                Pin code must be 6 digits (India standard).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {["flat", "street", "landmark", "city", "district", "state", "pin"].map(
                  (fld) => (
                    <Input
                      key={fld}
                      placeholder={fld}
                      disabled={!isEditMode}
                      value={formData.residentialAddress[fld as keyof Address] || ""}
                      onChange={(e) =>
                        updateAddress(
                          "residentialAddress",
                          fld as keyof Address,
                          e.target.value
                        )
                      }
                    />
                  )
                )}
              </div>
              {openFields["residentialAddress"] && (
                <HistorySection
                  field="residentialAddress"
                  historyList={getFieldHistory("residentialAddress")}
                  totalCount={getFieldHistory("residentialAddress").length}
                  currentPage={pagination["residentialAddress"] || 1}
                  onPageChange={handlePageChange}
                  customLabel="Residential Address"
                />
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Permanent Address */}
          <Collapsible
            open={isPermanentOpen}
            onOpenChange={setPermanentOpen}
          >
            <div className="flex items-center justify-between">
              <Label className="font-semibold">
                Permanent Address <span className="text-red-500">*</span>
              </Label>
              {renderHistoryIcon("permanentAddress")}
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="ml-2">
                  {isPermanentOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="mt-2">
              <p className="text-xs text-gray-500 mb-2">
                Pin code must be 6 digits (India standard).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {["flat", "street", "landmark", "city", "district", "state", "pin"].map(
                  (fld) => (
                    <Input
                      key={fld}
                      placeholder={fld}
                      disabled={!isEditMode || formData.sameAsResidential}
                      className={
                        formData.sameAsResidential
                          ? "bg-gray-200 cursor-not-allowed"
                          : ""
                      }
                      value={formData.permanentAddress[fld as keyof Address] || ""}
                      onChange={(e) =>
                        updateAddress(
                          "permanentAddress",
                          fld as keyof Address,
                          e.target.value
                        )
                      }
                    />
                  )
                )}
              </div>
              {openFields["permanentAddress"] && (
                <HistorySection
                  field="permanentAddress"
                  historyList={getFieldHistory("permanentAddress")}
                  totalCount={getFieldHistory("permanentAddress").length}
                  currentPage={pagination["permanentAddress"] || 1}
                  onPageChange={handlePageChange}
                  customLabel="Permanent Address"
                />
              )}
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  checked={!!formData.sameAsResidential}
                  onChange={(e) => handleSameAsResidential(e.target.checked)}
                  disabled={!isEditMode}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span className="ml-2 font-medium">Same as Residential</span>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Emergency Contacts */}
      <Card className="shadow-[0_10px_30px_rgba(0,0,0,0.15)] bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-md border border-gray-200 rounded-xl">
        <CardHeader>
          <CardTitle className="text-black">Emergency Contacts</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Collapsible open={isContactsOpen} onOpenChange={setContactsOpen}>
            <div className="flex items-center justify-between">
              {isEditMode ? (
                <Button
                  onClick={addEmergencyContact}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Add Contact
                </Button>
              ) : (
                <span className="font-medium">Contacts List</span>
              )}
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isContactsOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="mt-4 space-y-4">
              {formData.emergencyContacts.length ? (
                formData.emergencyContacts.map((c, i) => (
                  <div
                    key={i}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50 relative"
                  >
                    {isEditMode && (
                      <div className="flex justify-end mb-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeEmergencyContact(i)}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Name */}
                      <div>
                        <Label>Name *</Label>
                        <div className="flex items-center">
                          <Input
                            value={c.name}
                            onChange={(e) =>
                              handleEmergencyContactChange(i, "name", e.target.value)
                            }
                            disabled={!isEditMode}
                          />
                          {renderHistoryIcon(`emergencyContacts.${i}.name`)}
                        </div>
                        {openFields[`emergencyContacts.${i}.name`] && (
                          <HistorySection
                            field={`emergencyContacts.${i}.name`}
                            historyList={getFieldHistory(`emergencyContacts.${i}.name`)}
                            totalCount={getFieldHistory(`emergencyContacts.${i}.name`).length}
                            currentPage={pagination[`emergencyContacts.${i}.name`] || 1}
                            onPageChange={handlePageChange}
                          />
                        )}
                      </div>

                      {/* Relationship */}
                      <div>
                        <Label>Relationship *</Label>
                        <div className="flex items-center">
                          <Input
                            value={c.relationship}
                            onChange={(e) =>
                              handleEmergencyContactChange(i, "relationship", e.target.value)
                            }
                            disabled={!isEditMode}
                          />
                          {renderHistoryIcon(`emergencyContacts.${i}.relationship`)}
                        </div>
                        {openFields[`emergencyContacts.${i}.relationship`] && (
                          <HistorySection
                            field={`emergencyContacts.${i}.relationship`}
                            historyList={getFieldHistory(`emergencyContacts.${i}.relationship`)}
                            totalCount={getFieldHistory(`emergencyContacts.${i}.relationship`).length}
                            currentPage={pagination[`emergencyContacts.${i}.relationship`] || 1}
                            onPageChange={handlePageChange}
                          />
                        )}
                      </div>

                      {/* Phone Number */}
                      <div>
                        <Label>Phone Number *</Label>
                        <p className="text-xs text-gray-500 mb-1">Must be 10 digits.</p>
                        <div className="flex items-center">
                          <Input
                            type="tel"
                            value={c.phoneNumber}
                            maxLength={10}
                            onChange={(e) =>
                              handleEmergencyContactChange(i, "phoneNumber", e.target.value)
                            }
                            disabled={!isEditMode}
                          />
                          {renderHistoryIcon(`emergencyContacts.${i}.phoneNumber`)}
                        </div>
                        {openFields[`emergencyContacts.${i}.phoneNumber`] && (
                          <HistorySection
                            field={`emergencyContacts.${i}.phoneNumber`}
                            historyList={getFieldHistory(`emergencyContacts.${i}.phoneNumber`)}
                            totalCount={getFieldHistory(`emergencyContacts.${i}.phoneNumber`).length}
                            currentPage={pagination[`emergencyContacts.${i}.phoneNumber`] || 1}
                            onPageChange={handlePageChange}
                          />
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <Label>Email *</Label>
                        <p className="text-xs text-gray-500 mb-1">user@example.com</p>
                        <div className="flex items-center">
                          <Input
                            type="email"
                            value={c.email}
                            onChange={(e) =>
                              handleEmergencyContactChange(i, "email", e.target.value)
                            }
                            disabled={!isEditMode}
                          />
                          {renderHistoryIcon(`emergencyContacts.${i}.email`)}
                        </div>
                        {openFields[`emergencyContacts.${i}.email`] && (
                          <HistorySection
                            field={`emergencyContacts.${i}.email`}
                            historyList={getFieldHistory(`emergencyContacts.${i}.email`)}
                            totalCount={getFieldHistory(`emergencyContacts.${i}.email`).length}
                            currentPage={pagination[`emergencyContacts.${i}.email`] || 1}
                            onPageChange={handlePageChange}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No emergency contacts added yet.</p>
              )}
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </div>
  );
}
