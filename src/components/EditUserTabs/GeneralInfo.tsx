"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

// Shadcn UI + your custom components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
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

// ----------- Types -----------
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

export interface PersonalInfoData {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phoneNumber?: string; // 10-digit
  dob?: string;
  nationality?: string;
  gender?: string;
  bloodGroup?: string;
  residentialAddress?: Address; // pin => 6-digit
  permanentAddress?: Address;
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

interface PersonalInfoFormProps {
  formData: PersonalInfoData;
  setFormData: React.Dispatch<React.SetStateAction<PersonalInfoData>>;
  changeHistory: Record<string, ChangeHistoryEntry[]>;
  isEditMode: boolean;
}

// For pagination in history
const ITEMS_PER_PAGE = 5;

// A small email format checker for demonstration
function isValidEmail(email: string) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

// Safely display changes (string, number, or object)
function formatValue(val: any): string {
  if (val === null || val === undefined) return "N/A";
  if (typeof val === "object") {
    return JSON.stringify(val);
  }
  return String(val);
}

// ----------- Subcomponent: HistorySection -----------
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
        <span>{customLabel ? `${customLabel} Change History` : "Change History"}</span>
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

// ----------- Main Component -----------
export default function PersonalInfoForm({
  formData,
  setFormData,
  changeHistory,
  isEditMode,
}: PersonalInfoFormProps) {
  const { data: session } = useSession();

  // Profile image preview & modal
  const [profilePreview, setProfilePreview] = useState<string | null>(
    formData.profileImageUrl || null
  );
  const [isModalOpen, setModalOpen] = useState(false);

  // Validation errors, history toggles, pagination
  const [errors, setErrors] = useState<Record<string, string>>({});

  // For controlling collapsibles
  const [isResidentialOpen, setResidentialOpen] = useState(false);
  const [isPermanentOpen, setPermanentOpen] = useState(false);
  const [isContactsOpen, setContactsOpen] = useState(false);

  // For pagination in various fields
  const [openFields, setOpenFields] = useState<Record<string, boolean>>({});
  const [pagination, setPagination] = useState<Record<string, number>>({});

  // Basic validation
  function validate() {
    const newErr: Record<string, string> = {};

    if (!formData.firstName?.trim()) newErr.firstName = "First name is required.";
    if (!formData.lastName?.trim()) newErr.lastName = "Last name is required.";

    if (!formData.email?.trim()) {
      newErr.email = "Email is required.";
    } else if (!isValidEmail(formData.email)) {
      newErr.email = "Please enter a valid email address.";
    }

    setErrors(newErr);
    return Object.keys(newErr).length === 0;
  }

  // History logic
  const getFieldHistory = (fld: string) => changeHistory[fld] || [];
  const toggleFieldHistory = (fld: string) =>
    setOpenFields((prev) => ({ ...prev, [fld]: !prev[fld] }));
  const handlePageChange = (fld: string, dir: "prev" | "next") => {
    setPagination((prev) => {
      const cur = prev[fld] || 1;
      const max = Math.ceil(getFieldHistory(fld).length / ITEMS_PER_PAGE);
      let newVal = cur;
      if (dir === "prev" && cur > 1) newVal -= 1;
      if (dir === "next" && cur < max) newVal += 1;
      return { ...prev, [fld]: newVal };
    });
  };
  const getPaginatedHistory = (fld: string) => {
    const h = getFieldHistory(fld);
    const p = pagination[fld] || 1;
    return h.slice((p - 1) * ITEMS_PER_PAGE, p * ITEMS_PER_PAGE);
  };
  const renderHistoryIcon = (fld: string) =>
    getFieldHistory(fld).length > 0 && (
      <button
        type="button"
        className="ml-2 text-gray-500 hover:text-gray-700"
        onClick={() => toggleFieldHistory(fld)}
      >
        <History className="w-5 h-5" />
      </button>
    );

  // Address helpers
  function updateAddress(
    which: "residentialAddress" | "permanentAddress",
    field: keyof Address,
    value: string
  ) {
    if (field === "pin") {
      // pin => 6-digit only
      value = value.replace(/\D/g, "").slice(0, 6);
    }
    setFormData((prev) => ({
      ...prev,
      [which]: {
        ...(prev[which] || {
          flat: "",
          street: "",
          landmark: "",
          city: "",
          district: "",
          state: "",
          pin: "",
        }),
        [field]: value,
      },
    }));
  }

  function handleSameAsResidential(checked: boolean) {
    setFormData((prev) => {
      const updated = { ...prev, sameAsResidential: checked };
      if (checked && prev.residentialAddress) {
        updated.permanentAddress = { ...prev.residentialAddress };
      }
      return updated;
    });
  }

  useEffect(() => {
    if (formData.sameAsResidential && formData.residentialAddress) {
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
    // phone => 10-digit only
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
    // auto-open the collapsible
    setContactsOpen(true);
  }

  function removeEmergencyContact(idx: number) {
    const updated = formData.emergencyContacts.filter((_, i) => i !== idx);
    setFormData((prev) => ({ ...prev, emergencyContacts: updated }));
  }

  // Image upload
  async function handleImageUpload(file: File) {
    if (!file) return;
    const uploadData = new FormData();
    uploadData.append("image", file);
    if (formData.profileImageUrl) {
      uploadData.append("oldImagePath", formData.profileImageUrl);
    }

    try {
      const username = session?.user?.username;
      if (!username) throw new Error("No username available.");
      const res = await fetch(`/api/users/employee-photos/${username}`, {
        method: "POST",
        body: uploadData,
      });
      if (!res.ok) throw new Error("Failed to upload image");
      const data = await res.json();
      setFormData((prev) => ({ ...prev, profileImageUrl: data.imageUrl }));
      setProfilePreview(data.imageUrl);
    } catch (err) {
      console.error("Upload error:", err);
    }
  }

  function onProfileImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePreview(URL.createObjectURL(file));
      handleImageUpload(file);
    }
  }

  // Replace switch with a Select for resetPassword
  function handleResetPassword(val: string) {
    setFormData((prev) => ({
      ...prev,
      resetPassword: val === "true", // 'true' => boolean true
    }));
  }

  // ------- RENDER -------
  return (
    <div className="space-y-6 text-gray-900">
      {/* Profile Image & Basic Info */}
      <Card className="shadow-[0_10px_30px_rgba(0,0,0,0.15)] bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-md border border-gray-200 rounded-xl">
        <CardHeader>
          <CardTitle className="text-black">Profile & Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Image Block */}
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
                      onChange={onProfileImageChange}
                      disabled={!isEditMode}
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
                      setFormData((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    disabled={!isEditMode}
                    className="mt-1"
                  />
                  {renderHistoryIcon("firstName")}
                </div>
                {errors.firstName && (
                  <p className="text-red-500 text-sm">{errors.firstName}</p>
                )}
                {/* History Section if open */}
                {openFields["firstName"] && (
                  <HistorySection
                    field="firstName"
                    historyList={getPaginatedHistory("firstName")}
                    totalCount={getFieldHistory("firstName").length}
                    currentPage={pagination["firstName"] || 1}
                    onPageChange={handlePageChange}
                  />
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
                      setFormData((prev) => ({
                        ...prev,
                        middleName: e.target.value,
                      }))
                    }
                    disabled={!isEditMode}
                  />
                  {renderHistoryIcon("middleName")}
                </div>
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
                      setFormData((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    disabled={!isEditMode}
                    className="mt-1"
                  />
                  {renderHistoryIcon("lastName")}
                </div>
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
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    disabled={!isEditMode}
                    className="mt-1"
                  />
                  {renderHistoryIcon("email")}
                </div>
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
                    setFormData((p) => ({ ...p, dob: e.target.value }))
                  }
                  disabled={!isEditMode}
                />
                {renderHistoryIcon("dob")}
              </div>
            </div>

            {/* Nationality */}
            <div>
              <Label>Nationality *</Label>
              <div className="flex items-center">
                <Input
                  value={formData.nationality || ""}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, nationality: e.target.value }))
                  }
                  disabled={!isEditMode}
                />
                {renderHistoryIcon("nationality")}
              </div>
            </div>

            {/* Gender */}
            <div>
              <Label>Gender *</Label>
              <Select
                value={formData.gender || ""}
                onValueChange={(val) =>
                  setFormData((p) => ({ ...p, gender: val }))
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
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Blood Group */}
            <div>
              <Label>Blood Group *</Label>
              <Select
                value={formData.bloodGroup || ""}
                onValueChange={(val) =>
                  setFormData((p) => ({ ...p, bloodGroup: val }))
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
                    setFormData((p) => ({ ...p, phoneNumber: val }));
                  }}
                  disabled={!isEditMode}
                />
                {renderHistoryIcon("phoneNumber")}
              </div>
            </div>

            {/* Reset Password Select */}
            {isEditMode && (
              <div className="flex flex-col justify-center">
                <Label className="mb-1 font-medium">Reset Password</Label>
                <Select
                  // If resetPassword is true => "true", else "false"
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

      {/* Address Information */}
      <Card className="shadow-[0_10px_30px_rgba(0,0,0,0.15)] bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-md border border-gray-200 rounded-xl">
        <CardHeader>
          <CardTitle className="text-black">Address Information</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Residential Address Collapsible */}
          <Collapsible open={isResidentialOpen} onOpenChange={setResidentialOpen}>
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
            {openFields["residentialAddress"] && (
              <HistorySection
                field="residentialAddress"
                historyList={getPaginatedHistory("residentialAddress")}
                totalCount={getFieldHistory("residentialAddress").length}
                currentPage={pagination["residentialAddress"] || 1}
                onPageChange={handlePageChange}
                customLabel="Residential Address"
              />
            )}
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
                      value={
                        formData.residentialAddress?.[fld as keyof Address] || ""
                      }
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
            </CollapsibleContent>
          </Collapsible>

          {/* Permanent Address Collapsible */}
          <Collapsible open={isPermanentOpen} onOpenChange={setPermanentOpen}>
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
            {openFields["permanentAddress"] && (
              <HistorySection
                field="permanentAddress"
                historyList={getPaginatedHistory("permanentAddress")}
                totalCount={getFieldHistory("permanentAddress").length}
                currentPage={pagination["permanentAddress"] || 1}
                onPageChange={handlePageChange}
                customLabel="Permanent Address"
              />
            )}
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
                      value={
                        formData.permanentAddress?.[fld as keyof Address] || ""
                      }
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

      {/* Emergency Contacts Collapsible */}
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
                      </div>

                      {/* Relationship */}
                      <div>
                        <Label>Relationship *</Label>
                        <div className="flex items-center">
                          <Input
                            value={c.relationship}
                            onChange={(e) =>
                              handleEmergencyContactChange(
                                i,
                                "relationship",
                                e.target.value
                              )
                            }
                            disabled={!isEditMode}
                          />
                          {renderHistoryIcon(`emergencyContacts.${i}.relationship`)}
                        </div>
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
                              handleEmergencyContactChange(
                                i,
                                "phoneNumber",
                                e.target.value
                              )
                            }
                            disabled={!isEditMode}
                          />
                          {renderHistoryIcon(`emergencyContacts.${i}.phoneNumber`)}
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <Label>Email *</Label>
                        <p className="text-xs text-gray-500 mb-1">user@example.com</p>
                        <div className="flex items-center">
                          <Input
                            value={c.email}
                            type="email"
                            onChange={(e) =>
                              handleEmergencyContactChange(i, "email", e.target.value)
                            }
                            disabled={!isEditMode}
                          />
                          {renderHistoryIcon(`emergencyContacts.${i}.email`)}
                        </div>
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
