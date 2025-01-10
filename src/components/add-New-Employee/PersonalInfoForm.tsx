import React, { useState, useEffect } from "react";
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

import { CreateUserFormData } from "@/pages/add-New-Employee";

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

  // Notification states for image upload
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);
  const [uploadErrorMessage, setUploadErrorMessage] = useState<string | null>(null);

  // Local state for address parts
  const [residentialAddress, setResidentialAddress] = useState({
    flat: '',       // Flat/House Number
    street: '',     // Street/Locality
    landmark: '',   // Landmark (Optional)
    city: '',       // City
    district: '',   // District
    state: '',      // State
    pin: '',        // PIN Code
  });
  
  const [permanentAddress, setPermanentAddress] = useState({
    flat: '',
    street: '',
    landmark: '',
    city: '',
    district: '',
    state: '',
    pin: '',
  });
  
  useEffect(() => {
    setResidentialAddress(parseAddress(formData.residentialAddress));
    setPermanentAddress(parseAddress(formData.permanentAddress));
  }, [formData.residentialAddress, formData.permanentAddress]);

  useEffect(() => {
    if (formData.sameAsResidential) {
      setPermanentAddress(residentialAddress);
      setFormData(prev => ({
        ...prev,
        permanentAddress: `${residentialAddress.flat},${residentialAddress.street},${residentialAddress.landmark},${residentialAddress.city},${residentialAddress.district},${residentialAddress.state},${residentialAddress.pin}`,
      }));
    }
  }, [formData.sameAsResidential, residentialAddress, setFormData]);


  const parseAddress = (address?: string) => {
    if (!address) {
      return {
        flat: '',
        street: '',
        landmark: '',
        city: '',
        district: '',
        state: '',
        pin: '',
      };
    }

    const parts = address.split(',').map(part => part.trim());

    return {
      flat: parts[0] || '',
      street: parts[1] || '',
      landmark: parts[2] || '',
      city: parts[3] || '',
      district: parts[4] || '',
      state: parts[5] || '',
      pin: parts[6] || '',
    };
  };
  const syncResidentialToParent = () => {
    setFormData(prev => ({
      ...prev,
      residentialAddress: `${residentialAddress.flat},${residentialAddress.street},${residentialAddress.landmark},${residentialAddress.city},${residentialAddress.district},${residentialAddress.state},${residentialAddress.pin}`,
    }));
  };

  const syncPermanentToParent = () => {
    if (!formData.sameAsResidential) {
      setFormData(prev => ({
        ...prev,
        permanentAddress: `${permanentAddress.flat},${permanentAddress.street},${permanentAddress.landmark},${permanentAddress.city},${permanentAddress.district},${permanentAddress.state},${permanentAddress.pin}`,
      }));
    }
  };

  const handleResidentialChange = (field: string, value: string) => {
    setResidentialAddress(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePermanentChange = (field: string, value: string) => {
    setPermanentAddress(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddressSync = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setFormData(prev => ({
      ...prev,
      sameAsResidential: isChecked,
    }));

    if (isChecked) {
      setPermanentAddress(residentialAddress);
      setFormData(prev => ({
        ...prev,
        permanentAddress: `${residentialAddress.flat},${residentialAddress.street},${residentialAddress.landmark},${residentialAddress.city},${residentialAddress.district},${residentialAddress.state},${residentialAddress.pin}`,
      }));
    } else {
      setPermanentAddress({
        flat: '',
        street: '',
        landmark: '',
        city: '',
        district: '',
        state: '',
        pin: '',
      });
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    const uploadData = new FormData();
    uploadData.append("image", file);

    const oldImagePath = formData.profileImageUrl;
    if (oldImagePath) {
      uploadData.append("oldImagePath", oldImagePath);
    }

    // Clear previous upload messages
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (name: string) => (value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  const handleEmergencyContactChange = (
    index: number,
    field: keyof CreateUserFormData["emergencyContacts"][number],
    value: string
  ) => {
    const updatedContacts = [...formData.emergencyContacts];
    updatedContacts[index] = { ...updatedContacts[index], [field]: value };
    setFormData({ ...formData, emergencyContacts: updatedContacts });
  };

  const addEmergencyContact = () => {
    setFormData({
      ...formData,
      emergencyContacts: [
        ...formData.emergencyContacts,
        { name: "", relationship: "", phoneNumber: "", email: "" },
      ],
    });
  };

  const removeEmergencyContact = (index: number) => {
    const updatedContacts = formData.emergencyContacts.filter(
      (_, i) => i !== index
    );
    setFormData({ ...formData, emergencyContacts: updatedContacts });
  };


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

      {/* ---------------------- Name/Basic Info + Address ---------------------- */}
      <div className="space-y-4">
        {/* Basic Info */}
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
              onChange={handleChange}
              required
              className="max-w-xs"
            />
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
              onValueChange={handleSelectChange("gender")}
              value={formData.gender}
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
              onValueChange={handleSelectChange("bloodGroup")}
              value={formData.bloodGroup}
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

                       {/* Address Info with multiple fields */}
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Residential Address</Label>
          <div className="space-y-2">
            <Input
              placeholder="Flat/House Number"
              value={residentialAddress.flat}
              onChange={e => handleResidentialChange('flat', e.target.value)}
              onBlur={syncResidentialToParent}
              className="max-w-xs"
            />
            <Input
              placeholder="Street/Locality"
              value={residentialAddress.street}
              onChange={e => handleResidentialChange('street', e.target.value)}
              onBlur={syncResidentialToParent}
              className="max-w-xs"
            />
            <Input
              placeholder="Landmark (Optional)"
              value={residentialAddress.landmark}
              onChange={e => handleResidentialChange('landmark', e.target.value)}
              onBlur={syncResidentialToParent}
              className="max-w-xs"
            />
            <Input
              placeholder="City"
              value={residentialAddress.city}
              onChange={e => handleResidentialChange('city', e.target.value)}
              onBlur={syncResidentialToParent}
              className="max-w-xs"
            />
            <Input
              placeholder="District"
              value={residentialAddress.district}
              onChange={e => handleResidentialChange('district', e.target.value)}
              onBlur={syncResidentialToParent}
              className="max-w-xs"
            />
            <Input
              placeholder="State"
              value={residentialAddress.state}
              onChange={e => handleResidentialChange('state', e.target.value)}
              onBlur={syncResidentialToParent}
              className="max-w-xs"
            />
            <Input
              placeholder="PIN Code"
              value={residentialAddress.pin}
              onChange={e => handleResidentialChange('pin', e.target.value)}
              onBlur={syncResidentialToParent}
              className="max-w-xs"
            />
          </div>
        </div>
        <div>
          <Label>Permanent Address</Label>
          <div className="space-y-2">
            <Input
              placeholder="Flat/House Number"
              value={permanentAddress.flat}
              onChange={e => handlePermanentChange('flat', e.target.value)}
              disabled={formData.sameAsResidential}
              className={`max-w-xs ${formData.sameAsResidential ? 'bg-gray-200' : ''}`}
            />
            <Input
              placeholder="Street/Locality"
              value={permanentAddress.street}
              onChange={e => handlePermanentChange('street', e.target.value)}
              disabled={formData.sameAsResidential}
              className={`max-w-xs ${formData.sameAsResidential ? 'bg-gray-200' : ''}`}
            />
            <Input
              placeholder="Landmark (Optional)"
              value={permanentAddress.landmark}
              onChange={e => handlePermanentChange('landmark', e.target.value)}
              disabled={formData.sameAsResidential}
              className={`max-w-xs ${formData.sameAsResidential ? 'bg-gray-200' : ''}`}
            />
            <Input
              placeholder="City"
              value={permanentAddress.city}
              onChange={e => handlePermanentChange('city', e.target.value)}
              disabled={formData.sameAsResidential}
              className={`max-w-xs ${formData.sameAsResidential ? 'bg-gray-200' : ''}`}
            />
            <Input
              placeholder="District"
              value={permanentAddress.district}
              onChange={e => handlePermanentChange('district', e.target.value)}
              disabled={formData.sameAsResidential}
              className={`max-w-xs ${formData.sameAsResidential ? 'bg-gray-200' : ''}`}
            />
            <Input
              placeholder="State"
              value={permanentAddress.state}
              onChange={e => handlePermanentChange('state', e.target.value)}
              disabled={formData.sameAsResidential}
              className={`max-w-xs ${formData.sameAsResidential ? 'bg-gray-200' : ''}`}
            />
            <Input
              placeholder="PIN Code"
              value={permanentAddress.pin}
              onChange={e => handlePermanentChange('pin', e.target.value)}
              disabled={formData.sameAsResidential}
              className={`max-w-xs ${formData.sameAsResidential ? 'bg-gray-200' : ''}`}
            />
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
                <Label htmlFor={`contact-name-${index}`}>Name</Label>
                <Input
                  id={`contact-name-${index}`}
                  value={contact.name}
                  onChange={(e) =>
                    handleEmergencyContactChange(index, "name", e.target.value)
                  }
                  className="max-w-xs"
                />
              </div>
              <div>
                <Label htmlFor={`contact-relationship-${index}`}>
                  Relationship
                </Label>
                <Input
                  id={`contact-relationship-${index}`}
                  value={contact.relationship}
                  onChange={(e) =>
                    handleEmergencyContactChange(
                      index,
                      "relationship",
                      e.target.value
                    )
                  }
                  className="max-w-xs"
                />
              </div>
              <div>
                <Label htmlFor={`contact-phone-${index}`}>Phone Number</Label>
                <Input
                  id={`contact-phone-${index}`}
                  value={contact.phoneNumber}
                  onChange={(e) =>
                    handleEmergencyContactChange(
                      index,
                      "phoneNumber",
                      e.target.value
                    )
                  }
                  className="max-w-xs"
                />
              </div>
              <div>
                <Label htmlFor={`contact-email-${index}`}>Email</Label>
                <Input
                  id={`contact-email-${index}`}
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
