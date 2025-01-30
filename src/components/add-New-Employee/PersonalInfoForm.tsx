import React, { useState } from "react";
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
import { Camera } from "lucide-react";

// Import your types. Make sure they reflect JSON shape for addresses
import { CreateUserFormData, Address } from "@/pages/add-New-Employee";

interface PersonalInfoFormProps {
  formData: CreateUserFormData;
  setFormData: React.Dispatch<React.SetStateAction<CreateUserFormData>>;
}

export default function PersonalInfoForm({
  formData,
  setFormData,
}: PersonalInfoFormProps) {
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(
    null
  );
  const [uploadErrorMessage, setUploadErrorMessage] = useState<string | null>(
    null
  );

  // ─────────────────────────────────────────────
  // IMAGE UPLOAD
  // ─────────────────────────────────────────────
  const handleImageUpload = async (file: File) => {
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append("image", file);

    const oldImagePath = formData.profileImageUrl;
    if (oldImagePath) {
      uploadData.append("oldImagePath", oldImagePath);
    }

    setUploadSuccessMessage(null);
    setUploadErrorMessage(null);
    setLoading(true);

    try {
      const response = await fetch("/api/uploadImage", {
        method: "POST",
        body: uploadData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      const imageUrl = data.imageUrl;

      setFormData((prev) => ({
        ...prev,
        profileImageUrl: imageUrl,
        avatarImageUrl: imageUrl,
      }));

      setUploadSuccessMessage("Image uploaded successfully.");
    } catch (error) {
      console.error("Error uploading image:", error);
      setUploadErrorMessage("Failed to upload image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePreview(URL.createObjectURL(file));
      handleImageUpload(file);
    }
  };

  // ─────────────────────────────────────────────
  // BASIC FIELDS
  // ─────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange =
    (fieldName: keyof CreateUserFormData) => (value: string) => {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: value,
      }));
    };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
    setFormData((prev) => ({
      ...prev,
      phoneNumber: cleaned,
    }));
  };

  // ─────────────────────────────────────────────
  // ADDRESS CHANGE
  // ─────────────────────────────────────────────
  const handleAddressChange = (
    whichAddress: "residentialAddress" | "permanentAddress",
    field: keyof Address,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [whichAddress]: {
        ...prev[whichAddress],
        [field]: value,
      },
    }));
  };

  const handleResidentialPinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pin = e.target.value.replace(/\D/g, "").slice(0, 6);
    setFormData((prev) => ({
      ...prev,
      residentialAddress: {
        ...prev.residentialAddress,
        pin,
      },
    }));
  };

  const handlePermanentPinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pin = e.target.value.replace(/\D/g, "").slice(0, 6);
    setFormData((prev) => ({
      ...prev,
      permanentAddress: {
        ...prev.permanentAddress,
        pin,
      },
    }));
  };

  // Copy residential -> permanent address if user wants “Same as Residential”
  const handleAddressSync = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setFormData((prev) => {
      const updated = { ...prev, sameAsResidential: isChecked };
      if (isChecked) {
        // Copy entire residentialAddress -> permanentAddress
        updated.permanentAddress = { ...prev.residentialAddress };
      }
      return updated;
    });
  };

  // ─────────────────────────────────────────────
  // EMERGENCY CONTACTS
  // ─────────────────────────────────────────────
  const handleEmergencyContactChange = (
    index: number,
    field: keyof CreateUserFormData["emergencyContacts"][number],
    value: string
  ) => {
    setFormData((prev) => {
      const updated = [...prev.emergencyContacts];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, emergencyContacts: updated };
    });
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
    setFormData((prev) => {
      const updated = prev.emergencyContacts.filter((_, i) => i !== index);
      return { ...prev, emergencyContacts: updated };
    });
  };

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ---------------------- Image Upload ---------------------- */}
      <div className="flex flex-col items-center">
        <Label className="mb-2 text-sm font-semibold">
          Profile/Avatar Image
        </Label>
        <div className="relative w-32 h-32 rounded-full overflow-hidden border bg-gray-100 flex items-center justify-center">
          {profilePreview || formData.profileImageUrl ? (
            <img
              src={profilePreview || formData.profileImageUrl}
              alt="Profile Preview"
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-gray-500 text-xs">No Image</span>
          )}
          <label
            htmlFor="profileImage"
            className="absolute bottom-1 right-1 bg-black/60 p-1 rounded-full cursor-pointer"
          >
            <Camera size={16} className="text-white" />
          </label>
          <Input
            id="profileImage"
            type="file"
            accept="image/*"
            onChange={onProfileImageChange}
            disabled={loading}
            className="hidden"
          />
        </div>

        {/* Inline Notifications for Image Upload */}
        {uploadSuccessMessage && (
          <div className="mt-2 p-2 bg-green-100 text-green-800 rounded">
            {uploadSuccessMessage}
          </div>
        )}
        {uploadErrorMessage && (
          <div className="mt-2 p-2 bg-red-100 text-red-800 rounded">
            {uploadErrorMessage}
          </div>
        )}
      </div>

      {/* ---------------------- Name/Basic Info ---------------------- */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="max-w-xs"
            />
          </div>
          <div>
            <Label htmlFor="middleName">Middle Name</Label>
            <Input
              id="middleName"
              name="middleName"
              value={formData.middleName}
              onChange={handleChange}
              className="max-w-xs"
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="max-w-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="max-w-xs"
            />
          </div>
          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handlePhoneChange}
              required
              className="max-w-xs"
            />
            <p className="text-xs text-gray-500">Enter 10 digits only</p>
          </div>
          <div>
            <Label htmlFor="dob">Date of Birth</Label>
            <Input
              id="dob"
              name="dob"
              type="date"
              value={formData.dob}
              onChange={handleChange}
              required
              className="max-w-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="nationality">Nationality</Label>
            <Input
              id="nationality"
              name="nationality"
              value={formData.nationality}
              onChange={handleChange}
              required
              className="max-w-xs"
            />
          </div>
          <div>
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={formData.gender}
              onValueChange={handleSelectChange("gender")}
            >
              <SelectTrigger className="max-w-xs">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Male</SelectItem>
                <SelectItem value="F">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="bloodGroup">Blood Group</Label>
            <Select
              value={formData.bloodGroup}
              onValueChange={handleSelectChange("bloodGroup")}
            >
              <SelectTrigger className="max-w-xs">
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
        </div>

        {/* ---------------------- Address Info ---------------------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Residential Address</Label>
            <div className="space-y-2">
              <Input
                placeholder="Flat/House Number"
                value={formData.residentialAddress.flat}
                onChange={(e) =>
                  handleAddressChange("residentialAddress", "flat", e.target.value)
                }
                className="max-w-xs"
              />
              <Input
                placeholder="Street/Locality"
                value={formData.residentialAddress.street}
                onChange={(e) =>
                  handleAddressChange("residentialAddress", "street", e.target.value)
                }
                className="max-w-xs"
              />
              <Input
                placeholder="Landmark (Optional)"
                value={formData.residentialAddress.landmark || ""}
                onChange={(e) =>
                  handleAddressChange("residentialAddress", "landmark", e.target.value)
                }
                className="max-w-xs"
              />
              <Input
                placeholder="City"
                value={formData.residentialAddress.city}
                onChange={(e) =>
                  handleAddressChange("residentialAddress", "city", e.target.value)
                }
                className="max-w-xs"
              />
              <Input
                placeholder="District"
                value={formData.residentialAddress.district}
                onChange={(e) =>
                  handleAddressChange("residentialAddress", "district", e.target.value)
                }
                className="max-w-xs"
              />
              <Input
                placeholder="State"
                value={formData.residentialAddress.state}
                onChange={(e) =>
                  handleAddressChange("residentialAddress", "state", e.target.value)
                }
                className="max-w-xs"
              />
              <Input
                placeholder="PIN Code"
                value={formData.residentialAddress.pin}
                onChange={handleResidentialPinChange}
                className="max-w-xs"
              />
              <p className="text-xs text-gray-500">Digits only (max length 6)</p>
            </div>
          </div>

          <div>
            <Label>Permanent Address</Label>
            <div className="space-y-2">
              <Input
                placeholder="Flat/House Number"
                value={formData.permanentAddress.flat}
                onChange={(e) =>
                  handleAddressChange("permanentAddress", "flat", e.target.value)
                }
                disabled={formData.sameAsResidential}
                className={`max-w-xs ${
                  formData.sameAsResidential ? "bg-gray-200" : ""
                }`}
              />
              <Input
                placeholder="Street/Locality"
                value={formData.permanentAddress.street}
                onChange={(e) =>
                  handleAddressChange("permanentAddress", "street", e.target.value)
                }
                disabled={formData.sameAsResidential}
                className={`max-w-xs ${
                  formData.sameAsResidential ? "bg-gray-200" : ""
                }`}
              />
              <Input
                placeholder="Landmark (Optional)"
                value={formData.permanentAddress.landmark || ""}
                onChange={(e) =>
                  handleAddressChange("permanentAddress", "landmark", e.target.value)
                }
                disabled={formData.sameAsResidential}
                className={`max-w-xs ${
                  formData.sameAsResidential ? "bg-gray-200" : ""
                }`}
              />
              <Input
                placeholder="City"
                value={formData.permanentAddress.city}
                onChange={(e) =>
                  handleAddressChange("permanentAddress", "city", e.target.value)
                }
                disabled={formData.sameAsResidential}
                className={`max-w-xs ${
                  formData.sameAsResidential ? "bg-gray-200" : ""
                }`}
              />
              <Input
                placeholder="District"
                value={formData.permanentAddress.district}
                onChange={(e) =>
                  handleAddressChange("permanentAddress", "district", e.target.value)
                }
                disabled={formData.sameAsResidential}
                className={`max-w-xs ${
                  formData.sameAsResidential ? "bg-gray-200" : ""
                }`}
              />
              <Input
                placeholder="State"
                value={formData.permanentAddress.state}
                onChange={(e) =>
                  handleAddressChange("permanentAddress", "state", e.target.value)
                }
                disabled={formData.sameAsResidential}
                className={`max-w-xs ${
                  formData.sameAsResidential ? "bg-gray-200" : ""
                }`}
              />
              <Input
                placeholder="PIN Code"
                value={formData.permanentAddress.pin}
                onChange={handlePermanentPinChange}
                disabled={formData.sameAsResidential}
                className={`max-w-xs ${
                  formData.sameAsResidential ? "bg-gray-200" : ""
                }`}
              />
              <p className="text-xs text-gray-500">Digits only (max length 6)</p>
            </div>

            <label className="flex items-center mt-2 text-sm">
              <input
                type="checkbox"
                checked={!!formData.sameAsResidential}
                onChange={handleAddressSync}
              />
              <span className="ml-2">Same as Residential</span>
            </label>
          </div>
        </div>
      </div>

      {/* ---------------------- Emergency Contacts ---------------------- */}
      <div className="space-y-2">
        <h2 className="text-lg font-bold">Emergency Contacts</h2>
        {formData.emergencyContacts.map((contact, index) => (
          <div key={index} className="border p-3 rounded-lg mb-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
              <div>
                <Label>Name</Label>
                <Input
                  value={contact.name}
                  onChange={(e) =>
                    handleEmergencyContactChange(index, "name", e.target.value)
                  }
                  className="max-w-xs"
                />
              </div>
              <div>
                <Label>Relationship</Label>
                <Input
                  value={contact.relationship}
                  onChange={(e) =>
                    handleEmergencyContactChange(index, "relationship", e.target.value)
                  }
                  className="max-w-xs"
                />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input
                  value={contact.phoneNumber}
                  onChange={(e) =>
                    handleEmergencyContactChange(index, "phoneNumber", e.target.value)
                  }
                  className="max-w-xs"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={contact.email}
                  onChange={(e) =>
                    handleEmergencyContactChange(index, "email", e.target.value)
                  }
                  className="max-w-xs"
                />
              </div>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => removeEmergencyContact(index)}
            >
              Remove Contact
            </Button>
          </div>
        ))}
        <Button type="button" onClick={addEmergencyContact}>
          Add Emergency Contact
        </Button>
      </div>
    </div>
  );
}
