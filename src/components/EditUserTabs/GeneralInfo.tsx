// src/components/EditUserTabs/PersonalInfoForm.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
import { Camera, History, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";

// ------------------ Interfaces ------------------

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
  residentialAddress?: string;
  permanentAddress?: string;
  sameAsResidential?: boolean;
  profileImageUrl?: string;
  emergencyContacts: EmergencyContact[];
  resetPassword?: boolean;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
  email: string;
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
  isEditMode: boolean; // Received prop from parent
}

// ------------------ Constants ------------------

const ITEMS_PER_PAGE = 5;

// ------------------ Component ------------------

const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({
  formData,
  setFormData,
  changeHistory,
  isEditMode, // Destructure isEditMode from props
}) => {
  const { data: session } = useSession();

  // ------------------ State ------------------

  // Keep a copy of original data to revert upon cancel
  const [originalData, setOriginalData] = useState<PersonalInfoData>(formData);

  // Profile image preview & modal
  const [profilePreview, setProfilePreview] = useState<string | null>(
    formData.profileImageUrl || null
  );
  const [isModalOpen, setModalOpen] = useState(false);

  // Errors for form validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Address states
  const [residentialAddress, setResidentialAddress] = useState({
    flat: "",
    street: "",
    landmark: "",
    city: "",
    district: "",
    state: "",
    pin: "",
  });
  const [permanentAddress, setPermanentAddress] = useState({
    flat: "",
    street: "",
    landmark: "",
    city: "",
    district: "",
    state: "",
    pin: "",
  });

  // History toggles and pagination states
  const [openFields, setOpenFields] = useState<Record<string, boolean>>({});
  const [pagination, setPagination] = useState<Record<string, number>>({});

  // ------------------ Effects ------------------

  // Parse address strings into object form
  const parseAddress = (address?: string) => {
    if (!address)
      return {
        flat: "",
        street: "",
        landmark: "",
        city: "",
        district: "",
        state: "",
        pin: "",
      };
    const parts = address.split(",").map((part) => part.trim());
    return {
      flat: parts[0] || "",
      street: parts[1] || "",
      landmark: parts[2] || "",
      city: parts[3] || "",
      district: parts[4] || "",
      state: parts[5] || "",
      pin: parts[6] || "",
    };
  };

  // Initialize addresses on mount or data changes
  useEffect(() => {
    setResidentialAddress(parseAddress(formData.residentialAddress));
    if (formData.sameAsResidential) {
      setPermanentAddress(parseAddress(formData.residentialAddress));
    } else {
      setPermanentAddress(parseAddress(formData.permanentAddress));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.residentialAddress, formData.permanentAddress, formData.sameAsResidential]);

  // When sameAsResidential is checked, sync permanent to residential
  useEffect(() => {
    if (formData.sameAsResidential) {
      setPermanentAddress(residentialAddress);
      setFormData((prev) => ({
        ...prev,
        permanentAddress: Object.values(residentialAddress).join(", "),
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.sameAsResidential, residentialAddress]);

  // ------------------ Address Handlers ------------------

  const handleResidentialChange = (field: string, value: string) => {
    setResidentialAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handlePermanentChange = (field: string, value: string) => {
    setPermanentAddress((prev) => ({ ...prev, [field]: value }));
  };

  const syncResidentialToParent = () => {
    setFormData((prev) => ({
      ...prev,
      residentialAddress: Object.values(residentialAddress).join(", "),
    }));
  };

  const syncPermanentToParent = () => {
    if (!formData.sameAsResidential) {
      setFormData((prev) => ({
        ...prev,
        permanentAddress: Object.values(permanentAddress).join(", "),
      }));
    }
  };

  const handleAddressSync = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      sameAsResidential: e.target.checked,
    }));
  };

  // ------------------ Emergency Contacts ------------------

  const handleEmergencyContactChange = (
    index: number,
    field: keyof EmergencyContact,
    value: string
  ) => {
    const updatedContacts = [...formData.emergencyContacts];
    updatedContacts[index] = { ...updatedContacts[index], [field]: value };
    setFormData((prev) => ({ ...prev, emergencyContacts: updatedContacts }));
  };

  const addEmergencyContact = () => {
    setFormData((prev) => ({
      ...prev,
      emergencyContacts: [
        ...prev.emergencyContacts,
        { name: "", relationship: "", phoneNumber: "", email: "" },
      ],
    }));
  };

  const removeEmergencyContact = (index: number) => {
    const updatedContacts = formData.emergencyContacts.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, emergencyContacts: updatedContacts }));
  };

  // ------------------ Image Upload ------------------

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append("image", file);

    const oldImagePath = formData.profileImageUrl;
    if (oldImagePath) {
      uploadData.append("oldImagePath", oldImagePath);
    }

    try {
      const username = session?.user?.username;
      if (!username) {
        throw new Error("User is not authenticated or username is missing.");
      }

      const response = await fetch(`/api/users/employee-photos/${username}`, {
        method: "POST",
        body: uploadData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload image");
      }

      const data = await response.json();
      const imageUrl = data.imageUrl;

      setFormData((prev) => ({ ...prev, profileImageUrl: imageUrl }));
      setProfilePreview(imageUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
      // Optionally, you can set an error state here to display to the user
    }
  };

  const onProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePreview(URL.createObjectURL(file));
      handleImageUpload(file);
    }
  };

  // ------------------ Password Reset ------------------

  const handleResetPassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      resetPassword: e.target.checked,
    }));
  };

  // ------------------ Validation ------------------

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required.";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required.";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format.";
    }
    if (!formData.dob) {
      newErrors.dob = "Date of birth is required.";
    }
    if (!formData.nationality) {
      newErrors.nationality = "Nationality is required.";
    }
    if (!formData.gender) {
      newErrors.gender = "Gender is required.";
    }
    if (!formData.bloodGroup) {
      newErrors.bloodGroup = "Blood group is required.";
    }
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = "Phone number is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ------------------ Change History Helpers ------------------

  const getFieldHistory = (field: string): ChangeHistoryEntry[] => {
    return changeHistory[field] || [];
  };

  const toggleFieldHistory = (field: string) => {
    setOpenFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handlePageChange = (field: string, direction: "prev" | "next") => {
    setPagination((prev) => {
      const currentPage = prev[field] || 1;
      const maxPage = Math.ceil(getFieldHistory(field).length / ITEMS_PER_PAGE);
      let newPage = currentPage;
      if (direction === "prev" && currentPage > 1) {
        newPage -= 1;
      }
      if (direction === "next" && currentPage < maxPage) {
        newPage += 1;
      }
      return { ...prev, [field]: newPage };
    });
  };

  const getPaginatedHistory = (field: string): ChangeHistoryEntry[] => {
    const history = getFieldHistory(field);
    const currentPage = pagination[field] || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return history.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  // Helper to render a small history icon if any history is present
  const renderHistoryIcon = (fieldKey: string) => {
    const count = getFieldHistory(fieldKey).length;
    if (count === 0) return null; // No changes, no icon
    return (
      <button
        type="button"
        className="ml-2 text-gray-500 hover:text-gray-700"
        onClick={() => toggleFieldHistory(fieldKey)}
        title="View Change History"
      >
        <History className="w-5 h-5" />
      </button>
    );
  };

  // ------------------ Rendering ------------------

  return (
    <div className="p-6 sm:p-8 bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-lg space-y-8">
      {/* TOP SECTION: Profile Image (left) + Basic Info fields (right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Boxy Profile Image */}
        <div className="relative flex flex-col items-center bg-white/80 p-4 rounded-md shadow-sm">
          <Label className="mb-2 text-sm font-semibold text-gray-700">
            Profile Image
          </Label>
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
                  title="Upload Profile Image"
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

          {/* Modal for Enlarged Profile Image */}
          {isModalOpen && (
            <Modal onClose={() => setModalOpen(false)}>
              <img
                src={profilePreview || undefined}
                alt="Enlarged Profile"
                className="max-w-full max-h-full"
              />
            </Modal>
          )}
        </div>

        {/* Right: First/Middle/Last/Email */}
        <div className="bg-white/80 p-4 rounded-md shadow-sm space-y-4">
          {/* First Name */}
          <div className="relative">
            <Label htmlFor="firstName" className="text-gray-700">
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
                className={`mt-1 bg-white text-gray-900 border ${
                  errors.firstName ? "border-red-500" : "border-gray-300"
                } focus:ring-blue-500 w-full`}
              />
              {renderHistoryIcon("firstName")}
            </div>
            {errors.firstName && (
              <span className="block text-red-500 text-sm mt-1">
                {errors.firstName}
              </span>
            )}
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
          <div className="relative">
            <Label htmlFor="middleName" className="text-gray-700">
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
                className={`mt-1 bg-white text-gray-900 border ${
                  errors.middleName ? "border-red-500" : "border-gray-300"
                } focus:ring-blue-500 w-full`}
              />
              {renderHistoryIcon("middleName")}
            </div>
            {errors.middleName && (
              <span className="block text-red-500 text-sm mt-1">
                {errors.middleName}
              </span>
            )}
            {openFields["middleName"] && (
              <HistorySection
                field="middleName"
                historyList={getPaginatedHistory("middleName")}
                totalCount={getFieldHistory("middleName").length}
                currentPage={pagination["middleName"] || 1}
                onPageChange={handlePageChange}
              />
            )}
          </div>

          {/* Last Name */}
          <div className="relative">
            <Label htmlFor="lastName" className="text-gray-700">
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
                className={`mt-1 bg-white text-gray-900 border ${
                  errors.lastName ? "border-red-500" : "border-gray-300"
                } focus:ring-blue-500 w-full`}
              />
              {renderHistoryIcon("lastName")}
            </div>
            {errors.lastName && (
              <span className="block text-red-500 text-sm mt-1">
                {errors.lastName}
              </span>
            )}
            {openFields["lastName"] && (
              <HistorySection
                field="lastName"
                historyList={getPaginatedHistory("lastName")}
                totalCount={getFieldHistory("lastName").length}
                currentPage={pagination["lastName"] || 1}
                onPageChange={handlePageChange}
              />
            )}
          </div>

          {/* Email */}
          <div className="relative">
            <Label htmlFor="email" className="text-gray-700">
              Email <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center">
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                disabled={!isEditMode}
                className={`mt-1 bg-white text-gray-900 border ${
                  errors.email ? "border-red-500" : "border-gray-300"
                } focus:ring-blue-500 w-full`}
              />
              {renderHistoryIcon("email")}
            </div>
            {errors.email && (
              <span className="block text-red-500 text-sm mt-1">
                {errors.email}
              </span>
            )}
            {openFields["email"] && (
              <HistorySection
                field="email"
                historyList={getPaginatedHistory("email")}
                totalCount={getFieldHistory("email").length}
                currentPage={pagination["email"] || 1}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </div>
      </div>

      {/* ADDITIONAL INFO (DOB, Nationality, Gender, BloodGroup, PhoneNumber) */}
      <div className="bg-white/80 p-4 rounded-md shadow-sm space-y-6">
        <h2 className="text-lg font-semibold text-gray-700">Additional Info</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Date of Birth */}
          <div className="relative">
            <Label htmlFor="dob" className="text-gray-700">
              Date of Birth <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center">
              <Input
                id="dob"
                type="date"
                value={formData.dob ? formData.dob.split("T")[0] : ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, dob: e.target.value }))
                }
                disabled={!isEditMode}
                className={`mt-1 bg-white text-gray-900 border ${
                  errors.dob ? "border-red-500" : "border-gray-300"
                } focus:ring-blue-500 w-full`}
              />
              {renderHistoryIcon("dob")}
            </div>
            {errors.dob && (
              <span className="block text-red-500 text-sm mt-1">
                {errors.dob}
              </span>
            )}
            {openFields["dob"] && (
              <HistorySection
                field="dob"
                historyList={getPaginatedHistory("dob")}
                totalCount={getFieldHistory("dob").length}
                currentPage={pagination["dob"] || 1}
                onPageChange={handlePageChange}
              />
            )}
          </div>

          {/* Nationality */}
          <div className="relative">
            <Label htmlFor="nationality" className="text-gray-700">
              Nationality <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center">
              <Input
                id="nationality"
                value={formData.nationality || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nationality: e.target.value }))
                }
                disabled={!isEditMode}
                className={`mt-1 bg-white text-gray-900 border ${
                  errors.nationality ? "border-red-500" : "border-gray-300"
                } focus:ring-blue-500 w-full`}
              />
              {renderHistoryIcon("nationality")}
            </div>
            {errors.nationality && (
              <span className="block text-red-500 text-sm mt-1">
                {errors.nationality}
              </span>
            )}
            {openFields["nationality"] && (
              <HistorySection
                field="nationality"
                historyList={getPaginatedHistory("nationality")}
                totalCount={getFieldHistory("nationality").length}
                currentPage={pagination["nationality"] || 1}
                onPageChange={handlePageChange}
              />
            )}
          </div>

          {/* Gender */}
          <div className="relative">
            <Label htmlFor="gender" className="text-gray-700">
              Gender <span className="text-red-500">*</span>
            </Label>
            <div
              className={`mt-1 bg-white text-gray-900 border ${
                errors.gender ? "border-red-500" : "border-gray-300"
              } rounded-md focus:ring-blue-500 flex items-center w-full`}
            >
              <Select
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, gender: value }))
                }
                value={formData.gender || ""}
                disabled={!isEditMode}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* History Icon next to label */}
            {getFieldHistory("gender").length > 0 && (
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700 absolute top-6 right-2"
                onClick={() => toggleFieldHistory("gender")}
                title="View Change History"
              >
                <History className="w-5 h-5" />
              </button>
            )}
            {errors.gender && (
              <span className="block text-red-500 text-sm mt-1">
                {errors.gender}
              </span>
            )}
            {openFields["gender"] && (
              <HistorySection
                field="gender"
                historyList={getPaginatedHistory("gender")}
                totalCount={getFieldHistory("gender").length}
                currentPage={pagination["gender"] || 1}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Blood Group */}
          <div className="relative">
            <Label htmlFor="bloodGroup" className="text-gray-700">
              Blood Group <span className="text-red-500">*</span>
            </Label>
            <div
              className={`mt-1 bg-white text-gray-900 border ${
                errors.bloodGroup ? "border-red-500" : "border-gray-300"
              } rounded-md focus:ring-blue-500 flex items-center w-full`}
            >
              <Select
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, bloodGroup: value }))
                }
                value={formData.bloodGroup || ""}
                disabled={!isEditMode}
              >
                <SelectTrigger className="w-full">
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
                </SelectContent>
              </Select>
            </div>
            {getFieldHistory("bloodGroup").length > 0 && (
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700 absolute top-6 right-2"
                onClick={() => toggleFieldHistory("bloodGroup")}
                title="View Change History"
              >
                <History className="w-5 h-5" />
              </button>
            )}
            {errors.bloodGroup && (
              <span className="block text-red-500 text-sm mt-1">
                {errors.bloodGroup}
              </span>
            )}
            {openFields["bloodGroup"] && (
              <HistorySection
                field="bloodGroup"
                historyList={getPaginatedHistory("bloodGroup")}
                totalCount={getFieldHistory("bloodGroup").length}
                currentPage={pagination["bloodGroup"] || 1}
                onPageChange={handlePageChange}
              />
            )}
          </div>

          {/* Phone Number */}
          <div className="relative">
            <Label htmlFor="phoneNumber" className="text-gray-700">
              Phone Number <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center">
              <Input
                id="phoneNumber"
                value={formData.phoneNumber || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    phoneNumber: e.target.value,
                  }))
                }
                disabled={!isEditMode}
                className={`mt-1 bg-white text-gray-900 border ${
                  errors.phoneNumber ? "border-red-500" : "border-gray-300"
                } focus:ring-blue-500 w-full`}
              />
              {renderHistoryIcon("phoneNumber")}
            </div>
            {errors.phoneNumber && (
              <span className="block text-red-500 text-sm mt-1">
                {errors.phoneNumber}
              </span>
            )}
            {openFields["phoneNumber"] && (
              <HistorySection
                field="phoneNumber"
                historyList={getPaginatedHistory("phoneNumber")}
                totalCount={getFieldHistory("phoneNumber").length}
                currentPage={pagination["phoneNumber"] || 1}
                onPageChange={handlePageChange}
              />
            )}
          </div>

          {/* Reset Password (optional to keep here, or move) */}
          {isEditMode && (
            <div className="flex items-center pt-6">
              <input
                type="checkbox"
                id="resetPassword"
                name="resetPassword"
                checked={!!formData.resetPassword}
                onChange={handleResetPassword}
                className="form-checkbox h-5 w-5 text-blue-600"
              />
              <Label
                htmlFor="resetPassword"
                className="ml-2 text-gray-700 font-medium"
              >
                Reset Password
              </Label>
            </div>
          )}
        </div>
      </div>

      {/* ADDRESS SECTION */}
      <div className="bg-white/80 p-4 rounded-md shadow-sm space-y-6">
        <h2 className="text-lg font-semibold text-gray-700">Address Information</h2>

        {/* Residential Address */}
        <div className="relative space-y-2">
          <Label className="text-gray-700 font-medium">
            Residential Address <span className="text-red-500">*</span>
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            <Input
              value={residentialAddress.flat}
              onChange={(e) => handleResidentialChange("flat", e.target.value)}
              onBlur={syncResidentialToParent}
              placeholder="Flat/House No."
              disabled={!isEditMode}
              className="bg-white text-gray-900 border border-gray-300 focus:ring-blue-500"
            />
            <Input
              value={residentialAddress.street}
              onChange={(e) =>
                handleResidentialChange("street", e.target.value)
              }
              onBlur={syncResidentialToParent}
              placeholder="Street"
              disabled={!isEditMode}
              className="bg-white text-gray-900 border border-gray-300 focus:ring-blue-500"
            />
            <Input
              value={residentialAddress.landmark}
              onChange={(e) =>
                handleResidentialChange("landmark", e.target.value)
              }
              onBlur={syncResidentialToParent}
              placeholder="Landmark"
              disabled={!isEditMode}
              className="bg-white text-gray-900 border border-gray-300 focus:ring-blue-500"
            />
            <Input
              value={residentialAddress.city}
              onChange={(e) => handleResidentialChange("city", e.target.value)}
              onBlur={syncResidentialToParent}
              placeholder="City"
              disabled={!isEditMode}
              className="bg-white text-gray-900 border border-gray-300 focus:ring-blue-500"
            />
            <Input
              value={residentialAddress.district}
              onChange={(e) =>
                handleResidentialChange("district", e.target.value)
              }
              onBlur={syncResidentialToParent}
              placeholder="District"
              disabled={!isEditMode}
              className="bg-white text-gray-900 border border-gray-300 focus:ring-blue-500"
            />
            <Input
              value={residentialAddress.state}
              onChange={(e) => handleResidentialChange("state", e.target.value)}
              onBlur={syncResidentialToParent}
              placeholder="State"
              disabled={!isEditMode}
              className="bg-white text-gray-900 border border-gray-300 focus:ring-blue-500"
            />
            <Input
              value={residentialAddress.pin}
              onChange={(e) => handleResidentialChange("pin", e.target.value)}
              onBlur={syncResidentialToParent}
              placeholder="PIN Code"
              disabled={!isEditMode}
              className="bg-white text-gray-900 border border-gray-300 focus:ring-blue-500"
            />
          </div>
          {/* History Icon */}
          {getFieldHistory("residentialAddress").length > 0 && (
            <button
              type="button"
              className="absolute top-0 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => toggleFieldHistory("residentialAddress")}
              title="View Change History"
            >
              <History className="w-5 h-5" />
            </button>
          )}
          {/* Change History */}
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
        </div>

        {/* Permanent Address */}
        <div className="relative space-y-2">
          <Label className="text-gray-700 font-medium">
            Permanent Address <span className="text-red-500">*</span>
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            <Input
              value={permanentAddress.flat}
              onChange={(e) => handlePermanentChange("flat", e.target.value)}
              onBlur={syncPermanentToParent}
              placeholder="Flat/House No."
              disabled={!isEditMode || formData.sameAsResidential}
              className={`bg-white text-gray-900 border ${
                formData.sameAsResidential
                  ? "bg-gray-200 cursor-not-allowed"
                  : "border-gray-300"
              } focus:ring-blue-500`}
            />
            <Input
              value={permanentAddress.street}
              onChange={(e) => handlePermanentChange("street", e.target.value)}
              onBlur={syncPermanentToParent}
              placeholder="Street"
              disabled={!isEditMode || formData.sameAsResidential}
              className={`bg-white text-gray-900 border ${
                formData.sameAsResidential
                  ? "bg-gray-200 cursor-not-allowed"
                  : "border-gray-300"
              } focus:ring-blue-500`}
            />
            <Input
              value={permanentAddress.landmark}
              onChange={(e) =>
                handlePermanentChange("landmark", e.target.value)
              }
              onBlur={syncPermanentToParent}
              placeholder="Landmark"
              disabled={!isEditMode || formData.sameAsResidential}
              className={`bg-white text-gray-900 border ${
                formData.sameAsResidential
                  ? "bg-gray-200 cursor-not-allowed"
                  : "border-gray-300"
              } focus:ring-blue-500`}
            />
            <Input
              value={permanentAddress.city}
              onChange={(e) => handlePermanentChange("city", e.target.value)}
              onBlur={syncPermanentToParent}
              placeholder="City"
              disabled={!isEditMode || formData.sameAsResidential}
              className={`bg-white text-gray-900 border ${
                formData.sameAsResidential
                  ? "bg-gray-200 cursor-not-allowed"
                  : "border-gray-300"
              } focus:ring-blue-500`}
            />
            <Input
              value={permanentAddress.district}
              onChange={(e) =>
                handlePermanentChange("district", e.target.value)
              }
              onBlur={syncPermanentToParent}
              placeholder="District"
              disabled={!isEditMode || formData.sameAsResidential}
              className={`bg-white text-gray-900 border ${
                formData.sameAsResidential
                  ? "bg-gray-200 cursor-not-allowed"
                  : "border-gray-300"
              } focus:ring-blue-500`}
            />
            <Input
              value={permanentAddress.state}
              onChange={(e) => handlePermanentChange("state", e.target.value)}
              onBlur={syncPermanentToParent}
              placeholder="State"
              disabled={!isEditMode || formData.sameAsResidential}
              className={`bg-white text-gray-900 border ${
                formData.sameAsResidential
                  ? "bg-gray-200 cursor-not-allowed"
                  : "border-gray-300"
              } focus:ring-blue-500`}
            />
            <Input
              value={permanentAddress.pin}
              onChange={(e) => handlePermanentChange("pin", e.target.value)}
              onBlur={syncPermanentToParent}
              placeholder="PIN Code"
              disabled={!isEditMode || formData.sameAsResidential}
              className={`bg-white text-gray-900 border ${
                formData.sameAsResidential
                  ? "bg-gray-200 cursor-not-allowed"
                  : "border-gray-300"
              } focus:ring-blue-500`}
            />
          </div>
          <div className="flex items-center mt-2">
            <input
              type="checkbox"
              checked={!!formData.sameAsResidential}
              onChange={handleAddressSync}
              disabled={!isEditMode}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span className="ml-2 text-gray-700 font-medium">
              Same as Residential
            </span>
          </div>
          {/* History Icon */}
          {getFieldHistory("permanentAddress").length > 0 && (
            <button
              type="button"
              className="absolute top-0 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => toggleFieldHistory("permanentAddress")}
              title="View Change History"
            >
              <History className="w-5 h-5" />
            </button>
          )}
          {/* Change History */}
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
        </div>
      </div>

      {/* EMERGENCY CONTACTS */}
      <div className="bg-white/80 p-4 rounded-md shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-700">
            Emergency Contacts
          </h2>
          {isEditMode && (
            <Button
              type="button"
              onClick={addEmergencyContact}
              className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-2 transition-colors"
            >
              Add Contact
            </Button>
          )}
        </div>

        {formData.emergencyContacts && formData.emergencyContacts.length > 0 ? (
          formData.emergencyContacts.map((contact, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 bg-gray-50 relative"
            >
              {isEditMode && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white px-2 py-1 text-xs"
                  onClick={() => removeEmergencyContact(index)}
                >
                  Remove
                </Button>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="relative">
                  <Label
                    htmlFor={`contact-name-${index}`}
                    className="text-gray-700 font-medium"
                  >
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center">
                    <Input
                      id={`contact-name-${index}`}
                      value={contact.name || ""}
                      onChange={(e) =>
                        handleEmergencyContactChange(index, "name", e.target.value)
                      }
                      disabled={!isEditMode}
                      className={`bg-white text-gray-900 border mt-1 ${
                        errors[`emergencyContacts.${index}.name`]
                          ? "border-red-500"
                          : "border-gray-300"
                      } focus:ring-blue-500 w-full`}
                    />
                    {getFieldHistory(`emergencyContacts.${index}.name`).length >
                      0 && (
                      <button
                        type="button"
                        className="text-gray-500 hover:text-gray-700 ml-2"
                        onClick={() =>
                          toggleFieldHistory(`emergencyContacts.${index}.name`)
                        }
                        title="View Change History"
                      >
                        <History className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  {errors[`emergencyContacts.${index}.name`] && (
                    <span className="block text-red-500 text-sm mt-1">
                      {errors[`emergencyContacts.${index}.name`]}
                    </span>
                  )}
                  {openFields[`emergencyContacts.${index}.name`] && (
                    <HistorySection
                      field={`emergencyContacts.${index}.name`}
                      historyList={getPaginatedHistory(
                        `emergencyContacts.${index}.name`
                      )}
                      totalCount={
                        getFieldHistory(`emergencyContacts.${index}.name`).length
                      }
                      currentPage={
                        pagination[`emergencyContacts.${index}.name`] || 1
                      }
                      onPageChange={handlePageChange}
                      customLabel="Name"
                    />
                  )}
                </div>

                {/* Relationship */}
                <div className="relative">
                  <Label
                    htmlFor={`contact-relationship-${index}`}
                    className="text-gray-700 font-medium"
                  >
                    Relationship <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center">
                    <Input
                      id={`contact-relationship-${index}`}
                      value={contact.relationship || ""}
                      onChange={(e) =>
                        handleEmergencyContactChange(
                          index,
                          "relationship",
                          e.target.value
                        )
                      }
                      disabled={!isEditMode}
                      className={`bg-white text-gray-900 border mt-1 ${
                        errors[`emergencyContacts.${index}.relationship`]
                          ? "border-red-500"
                          : "border-gray-300"
                      } focus:ring-blue-500 w-full`}
                    />
                    {getFieldHistory(`emergencyContacts.${index}.relationship`)
                      .length > 0 && (
                      <button
                        type="button"
                        className="text-gray-500 hover:text-gray-700 ml-2"
                        onClick={() =>
                          toggleFieldHistory(
                            `emergencyContacts.${index}.relationship`
                          )
                        }
                        title="View Change History"
                      >
                        <History className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  {errors[`emergencyContacts.${index}.relationship`] && (
                    <span className="block text-red-500 text-sm mt-1">
                      {errors[`emergencyContacts.${index}.relationship`]}
                    </span>
                  )}
                  {openFields[`emergencyContacts.${index}.relationship`] && (
                    <HistorySection
                      field={`emergencyContacts.${index}.relationship`}
                      historyList={getPaginatedHistory(
                        `emergencyContacts.${index}.relationship`
                      )}
                      totalCount={
                        getFieldHistory(
                          `emergencyContacts.${index}.relationship`
                        ).length
                      }
                      currentPage={
                        pagination[`emergencyContacts.${index}.relationship`] ||
                        1
                      }
                      onPageChange={handlePageChange}
                      customLabel="Relationship"
                    />
                  )}
                </div>

                {/* Phone Number */}
                <div className="relative">
                  <Label
                    htmlFor={`contact-phone-${index}`}
                    className="text-gray-700 font-medium"
                  >
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center">
                    <Input
                      id={`contact-phone-${index}`}
                      value={contact.phoneNumber || ""}
                      onChange={(e) =>
                        handleEmergencyContactChange(
                          index,
                          "phoneNumber",
                          e.target.value
                        )
                      }
                      disabled={!isEditMode}
                      className={`bg-white text-gray-900 border mt-1 ${
                        errors[`emergencyContacts.${index}.phoneNumber`]
                          ? "border-red-500"
                          : "border-gray-300"
                      } focus:ring-blue-500 w-full`}
                    />
                    {getFieldHistory(`emergencyContacts.${index}.phoneNumber`)
                      .length > 0 && (
                      <button
                        type="button"
                        className="text-gray-500 hover:text-gray-700 ml-2"
                        onClick={() =>
                          toggleFieldHistory(
                            `emergencyContacts.${index}.phoneNumber`
                          )
                        }
                        title="View Change History"
                      >
                        <History className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  {errors[`emergencyContacts.${index}.phoneNumber`] && (
                    <span className="block text-red-500 text-sm mt-1">
                      {errors[`emergencyContacts.${index}.phoneNumber`]}
                    </span>
                  )}
                  {openFields[`emergencyContacts.${index}.phoneNumber`] && (
                    <HistorySection
                      field={`emergencyContacts.${index}.phoneNumber`}
                      historyList={getPaginatedHistory(
                        `emergencyContacts.${index}.phoneNumber`
                      )}
                      totalCount={
                        getFieldHistory(
                          `emergencyContacts.${index}.phoneNumber`
                        ).length
                      }
                      currentPage={
                        pagination[`emergencyContacts.${index}.phoneNumber`] || 1
                      }
                      onPageChange={handlePageChange}
                      customLabel="Phone Number"
                    />
                  )}
                </div>

                {/* Email */}
                <div className="relative">
                  <Label
                    htmlFor={`contact-email-${index}`}
                    className="text-gray-700 font-medium"
                  >
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center">
                    <Input
                      id={`contact-email-${index}`}
                      value={contact.email || ""}
                      onChange={(e) =>
                        handleEmergencyContactChange(
                          index,
                          "email",
                          e.target.value
                        )
                      }
                      disabled={!isEditMode}
                      className={`bg-white text-gray-900 border mt-1 ${
                        errors[`emergencyContacts.${index}.email`]
                          ? "border-red-500"
                          : "border-gray-300"
                      } focus:ring-blue-500 w-full`}
                    />
                    {getFieldHistory(`emergencyContacts.${index}.email`).length >
                      0 && (
                      <button
                        type="button"
                        className="text-gray-500 hover:text-gray-700 ml-2"
                        onClick={() =>
                          toggleFieldHistory(`emergencyContacts.${index}.email`)
                        }
                        title="View Change History"
                      >
                        <History className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  {errors[`emergencyContacts.${index}.email`] && (
                    <span className="block text-red-500 text-sm mt-1">
                      {errors[`emergencyContacts.${index}.email`]}
                    </span>
                  )}
                  {openFields[`emergencyContacts.${index}.email`] && (
                    <HistorySection
                      field={`emergencyContacts.${index}.email`}
                      historyList={getPaginatedHistory(
                        `emergencyContacts.${index}.email`
                      )}
                      totalCount={
                        getFieldHistory(
                          `emergencyContacts.${index}.email`
                        ).length
                      }
                      currentPage={
                        pagination[`emergencyContacts.${index}.email`] || 1
                      }
                      onPageChange={handlePageChange}
                      customLabel="Email"
                    />
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-gray-500">No emergency contacts added yet.</div>
        )}
      </div>
    </div>
  );
};

// ------------------ HistorySection Subcomponent ------------------

interface HistorySectionProps {
  field: string;
  historyList: ChangeHistoryEntry[];
  totalCount: number;
  currentPage: number;
  onPageChange: (field: string, direction: "prev" | "next") => void;
  customLabel?: string; // For customizing the label in the heading if needed
}

const HistorySection: React.FC<HistorySectionProps> = ({
  field,
  historyList,
  totalCount,
  currentPage,
  onPageChange,
  customLabel,
}) => {
  const maxPage = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
      <h4 className="text-sm font-semibold text-gray-700 flex items-center space-x-1">
        <History className="w-4 h-4 text-blue-500" />
        <span>{customLabel ? `${customLabel} Change History` : "Change History"}</span>
      </h4>
      <ul className="space-y-2">
        {historyList.map((entry, index) => (
          <li key={index} className="flex items-start">
            <div className="flex-shrink-0 mr-3">
              <History className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-700">
                <strong>{entry.performedBy}</strong>{" "}
                changed <strong>{customLabel || field}</strong> on{" "}
                {new Date(entry.datePerformed).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">From: {entry.old ?? "N/A"}</p>
              <p className="text-sm text-gray-600">To: {entry.new ?? "N/A"}</p>
            </div>
          </li>
        ))}
      </ul>
      {totalCount > ITEMS_PER_PAGE && (
        <div className="flex justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => onPageChange(field, "prev")}
            className="text-blue-600 hover:text-blue-800"
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage === maxPage}
            onClick={() => onPageChange(field, "next")}
            className="text-blue-600 hover:text-blue-800"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default PersonalInfoForm;
