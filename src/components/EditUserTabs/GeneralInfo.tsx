import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import { Modal } from '@/components/ui/modal';

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

interface PersonalInfoFormProps {
  formData: PersonalInfoData;
  setFormData: React.Dispatch<React.SetStateAction<PersonalInfoData>>;
}

const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({ formData, setFormData }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string) => (value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const { data: session, status } = useSession();
  const [profilePreview, setProfilePreview] = useState<string | null>(formData.profileImageUrl || null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);

  const [residentialAddress, setResidentialAddress] = useState({
    street: '',
    city: '',
    zip: '',
  });

  const [permanentAddress, setPermanentAddress] = useState({
    street: '',
    city: '',
    zip: '',
  });

  const parseAddress = (address?: string) => {
    if (!address) return { street: '', city: '', zip: '' };
    const parts = address.split(',').map(part => part.trim());
    return {
      street: parts[0] || '',
      city: parts[1] || '',
      zip: parts[2] || '',
    };
  };

  // Initialize address fields once based on formData
  useEffect(() => {
    setResidentialAddress(parseAddress(formData.residentialAddress));
    if (formData.sameAsResidential) {
      setPermanentAddress(parseAddress(formData.residentialAddress));
    } else {
      setPermanentAddress(parseAddress(formData.permanentAddress));
    }
  }, [formData.residentialAddress, formData.permanentAddress, formData.sameAsResidential]);

  // Synchronize permanent address with residential when sameAsResidential is true
  useEffect(() => {
    if (formData.sameAsResidential) {
      setPermanentAddress(residentialAddress);
      setFormData(prev => ({
        ...prev,
        permanentAddress: `${residentialAddress.street}, ${residentialAddress.city}, ${residentialAddress.zip}`,
      }));
    }
  }, [formData.sameAsResidential, residentialAddress, setFormData]);

  // Update parent formData onBlur for Residential Address
  const syncResidentialToParent = () => {
    setFormData(prev => ({
      ...prev,
      residentialAddress: `${residentialAddress.street}, ${residentialAddress.city}, ${residentialAddress.zip}`,
    }));
  };

  // Update parent formData onBlur for Permanent Address, if not same as residential
  const syncPermanentToParent = () => {
    if (!formData.sameAsResidential) {
      setFormData(prev => ({
        ...prev,
        permanentAddress: `${permanentAddress.street}, ${permanentAddress.city}, ${permanentAddress.zip}`,
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

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    const uploadData = new FormData();
    uploadData.append('image', file);

    const oldImagePath = formData.profileImageUrl;
    if (oldImagePath) {
      uploadData.append('oldImagePath', oldImagePath);
    }

    setLoading(true);

    try {
      const username = session?.user?.username;
      if (!username) {
        throw new Error('User is not authenticated or username is missing.');
      }

      const response = await fetch(`/api/users/employee-photos/${username}`, {
        method: 'POST',
        body: uploadData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload image');
      }

      const data = await response.json();
      const imageUrl = data.imageUrl;

      setFormData(prev => ({
        ...prev,
        profileImageUrl: imageUrl,
      }));
      setProfilePreview(imageUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
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

  const handleAddressSync = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      sameAsResidential: e.target.checked,
    }));
  };

  const handleEmergencyContactChange = (index: number, field: keyof EmergencyContact, value: string) => {
    const updatedContacts = [...formData.emergencyContacts];
    updatedContacts[index] = { ...updatedContacts[index], [field]: value };
    setFormData(prev => ({ ...prev, emergencyContacts: updatedContacts }));
  };

  const addEmergencyContact = () => {
    setFormData(prev => ({
      ...prev,
      emergencyContacts: [
        ...prev.emergencyContacts,
        { name: '', relationship: '', phoneNumber: '', email: '' },
      ],
    }));
  };

  const removeEmergencyContact = (index: number) => {
    const updatedContacts = formData.emergencyContacts.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, emergencyContacts: updatedContacts }));
  };

  const handleResetPassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      resetPassword: e.target.checked,
    }));
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }
  if (!session) {
    return <div>You must be logged in to edit personal info.</div>;
  }
  return (
    <div className="space-y-6">
      {/* Profile Image Upload */}
      <div className="flex flex-col items-center">
        <Label className="mb-2 text-sm font-semibold text-white">Profile Image</Label>
        <div className="relative w-32 h-32 rounded-full overflow-hidden border border-gray-700 bg-gray-800 flex items-center justify-center group">
          {profilePreview ? (
            <img
              src={profilePreview}
              alt="Profile Preview"
              className="object-cover w-full h-full cursor-pointer transition-transform duration-300 group-hover:scale-110"
              onClick={() => setModalOpen(true)}
            />
          ) : (
            <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-3.33 0-9 1.67-9 5v1h18v-1c0-3.33-5.67-5-9-5z" />
            </svg>
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
      </div>

      {/* Modal for Enlarged Image */}
      {isModalOpen && (
        <Modal onClose={() => setModalOpen(false)}>
          <img src={profilePreview || undefined} alt="Enlarged Profile" className="max-w-full max-h-full" />
        </Modal>
      )}

      {/* Reset Password */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="resetPassword"
          name="resetPassword"
          checked={!!formData.resetPassword}
          onChange={handleResetPassword}
          className="form-checkbox h-4 w-4 text-blue-600"
        />
        <Label htmlFor="resetPassword" className="ml-2 text-white">Reset Password</Label>
      </div>

      {/* Personal Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="firstName" className="text-white">First Name *</Label>
          <Input
            id="firstName"
            name="firstName"
            value={formData.firstName || ''}
            onChange={handleChange}
            required
            className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
          />
        </div>
        <div>
          <Label htmlFor="middleName" className="text-white">Middle Name</Label>
          <Input
            id="middleName"
            name="middleName"
            value={formData.middleName || ''}
            onChange={handleChange}
            className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
          />
        </div>
        <div>
          <Label htmlFor="lastName" className="text-white">Last Name *</Label>
          <Input
            id="lastName"
            name="lastName"
            value={formData.lastName || ''}
            onChange={handleChange}
            required
            className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="email" className="text-white">Email *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email || ''}
            onChange={handleChange}
            required
            className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
          />
        </div>
        <div>
          <Label htmlFor="phoneNumber" className="text-white">Phone Number *</Label>
          <Input
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber || ''}
            onChange={handleChange}
            required
            className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
          />
        </div>
        <div>
          <Label htmlFor="dob" className="text-white">Date of Birth *</Label>
          <Input
            id="dob"
            name="dob"
            type="date"
            value={formData.dob ? formData.dob.split("T")[0] : ''}
            onChange={handleChange}
            required
            className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="nationality" className="text-white">Nationality *</Label>
          <Input
            id="nationality"
            name="nationality"
            value={formData.nationality || ''}
            onChange={handleChange}
            required
            className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
          />
        </div>
        <div>
          <Label htmlFor="gender" className="text-white">Gender *</Label>
          <Select
            onValueChange={handleSelectChange('gender')}
            value={formData.gender || ''}
          >
            <SelectTrigger className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800">
              <SelectItem value="M">Male</SelectItem>
              <SelectItem value="F">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="bloodGroup" className="text-white">Blood Group *</Label>
          <Select
            onValueChange={handleSelectChange('bloodGroup')}
            value={formData.bloodGroup || ''}
          >
            <SelectTrigger className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500">
              <SelectValue placeholder="Select blood group" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800">
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

      <div className="space-y-6">
        {/* Residential Address */}
        <div>
          <Label className="text-white">Residential Address *</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input
              value={residentialAddress.street}
              onChange={(e) => handleResidentialChange('street', e.target.value)}
              onBlur={syncResidentialToParent}
              placeholder="Street"
              className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
            />
            <Input
              value={residentialAddress.city}
              onChange={(e) => handleResidentialChange('city', e.target.value)}
              onBlur={syncResidentialToParent}
              placeholder="City"
              className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
            />
            <Input
              value={residentialAddress.zip}
              onChange={(e) => handleResidentialChange('zip', e.target.value)}
              onBlur={syncResidentialToParent}
              placeholder="Zip"
              className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Permanent Address */}
        <div>
          <Label className="text-white">Permanent Address *</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input
              value={permanentAddress.street}
              onChange={(e) => handlePermanentChange('street', e.target.value)}
              onBlur={syncPermanentToParent}
              placeholder="Street"
              disabled={formData.sameAsResidential}
              className={`bg-gray-700 text-white border-gray-600 focus:ring-blue-500 ${
                formData.sameAsResidential ? 'bg-gray-600 cursor-not-allowed' : ''
              }`}
            />
            <Input
              value={permanentAddress.city}
              onChange={(e) => handlePermanentChange('city', e.target.value)}
              onBlur={syncPermanentToParent}
              placeholder="City"
              disabled={formData.sameAsResidential}
              className={`bg-gray-700 text-white border-gray-600 focus:ring-blue-500 ${
                formData.sameAsResidential ? 'bg-gray-600 cursor-not-allowed' : ''
              }`}
            />
            <Input
              value={permanentAddress.zip}
              onChange={(e) => handlePermanentChange('zip', e.target.value)}
              onBlur={syncPermanentToParent}
              placeholder="Zip"
              disabled={formData.sameAsResidential}
              className={`bg-gray-700 text-white border-gray-600 focus:ring-blue-500 ${
                formData.sameAsResidential ? 'bg-gray-600 cursor-not-allowed' : ''
              }`}
            />
          </div>
          <div className="flex items-center mt-2">
            <input
              type="checkbox"
              checked={!!formData.sameAsResidential}
              onChange={handleAddressSync}
              className="form-checkbox h-4 w-4 text-blue-600"
            />
            <span className="ml-2 text-white">Same as Residential</span>
          </div>
        </div>
      </div>

      {/* Emergency Contacts */}
        <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white">Emergency Contacts</h2>
        <Button
          type="button"
          onClick={addEmergencyContact}
          className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1"
        >
          Add Contact
        </Button>
      </div>
      {formData.emergencyContacts && formData.emergencyContacts.length > 0 ? (
        formData.emergencyContacts.map((contact, index) => (
          <div key={index} className="border rounded-lg p-4 bg-gray-800 relative">
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-xs"
              onClick={() => removeEmergencyContact(index)}
            >
              Remove
            </Button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`contact-name-${index}`} className="text-white">
                  Name *
                </Label>
                <Input
                  id={`contact-name-${index}`}
                  value={contact.name || ''}
                  onChange={(e) => handleEmergencyContactChange(index, 'name', e.target.value)}
                  required
                  className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor={`contact-relationship-${index}`} className="text-white">
                  Relationship *
                </Label>
                <Input
                  id={`contact-relationship-${index}`}
                  value={contact.relationship || ''}
                  onChange={(e) => handleEmergencyContactChange(index, 'relationship', e.target.value)}
                  required
                  className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor={`contact-phone-${index}`} className="text-white">
                  Phone Number *
                </Label>
                <Input
                  id={`contact-phone-${index}`}
                  value={contact.phoneNumber || ''}
                  onChange={(e) => handleEmergencyContactChange(index, 'phoneNumber', e.target.value)}
                  required
                  className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor={`contact-email-${index}`} className="text-white">
                  Email *
                </Label>
                <Input
                  id={`contact-email-${index}`}
                  value={contact.email || ''}
                  onChange={(e) => handleEmergencyContactChange(index, 'email', e.target.value)}
                  required
                  className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-gray-400">No emergency contacts added yet.</div>
      )}
    </div>
    </div>  );
};

export default PersonalInfoForm;
