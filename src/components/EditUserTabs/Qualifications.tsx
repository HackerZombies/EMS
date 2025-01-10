// components/EditUser/QualificationsForm.tsx

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

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
}
// Helper function to format ISO date to yyyy-MM-dd
const formatDate = (isoDate: string | undefined) => {
  return isoDate ? new Date(isoDate).toISOString().split('T')[0] : '';
};

const QualificationsForm: React.FC<QualificationsFormProps> = ({
  formData,
  setFormData,
}) => {
  // Qualifications Handlers
  const handleQualificationChange = (
    index: number,
    field: keyof Qualification,
    value: string
  ) => {
    const updatedQualifications = [...formData.qualifications];
    if (field === 'specializations') {
      updatedQualifications[index][field] = value.split(',').map(s => s.trim());
    } else {
      updatedQualifications[index][field] = value;
    }
    setFormData({ ...formData, qualifications: updatedQualifications });
  };

  const addQualification = () => {
    setFormData({
      ...formData,
      qualifications: [
        ...formData.qualifications,
        { name: '', level: '', specializations: [], institution: '' },
      ],
    });
  };

  const removeQualification = (index: number) => {
    const updatedQualifications = formData.qualifications.filter(
      (_, i) => i !== index
    );
    setFormData({ ...formData, qualifications: updatedQualifications });
  };

  // Experiences Handlers
  const handleExperienceChange = (
    index: number,
    field: keyof Experience,
    value: string
  ) => {
    const updatedExperiences = [...formData.experiences];
    updatedExperiences[index][field] = value;
    setFormData({ ...formData, experiences: updatedExperiences });
  };

  const addExperience = () => {
    setFormData({
      ...formData,
      experiences: [
        ...formData.experiences,
        { jobTitle: '', company: '', startDate: '', endDate: '', description: '' },
      ],
    });
  };

  const removeExperience = (index: number) => {
    const updatedExperiences = formData.experiences.filter(
      (_, i) => i !== index
    );
    setFormData({ ...formData, experiences: updatedExperiences });
  };

  // Certifications Handlers
  const handleCertificationChange = (
    index: number,
    field: keyof Certification,
    value: string
  ) => {
    const updatedCertifications = [...formData.certifications];
    updatedCertifications[index][field] = value;
    setFormData({ ...formData, certifications: updatedCertifications });
  };

  const addCertification = () => {
    setFormData({
      ...formData,
      certifications: [
        ...formData.certifications,
        { name: '', issuingAuthority: '', licenseNumber: '', issueDate: '', expiryDate: '' },
      ],
    });
  };

  const removeCertification = (index: number) => {
    const updatedCertifications = formData.certifications.filter(
      (_, i) => i !== index
    );
    setFormData({ ...formData, certifications: updatedCertifications });
  };

  return (
    <div className="space-y-8">
      {/* Qualifications Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Qualifications</h2>
          <Button type="button" onClick={addQualification} className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1">
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Qualification
          </Button>
        </div>
        {formData.qualifications.map((qualification, index) => (
          <div key={index} className="border rounded-lg p-4 bg-gray-800 relative">
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-xs"
              onClick={() => removeQualification(index)}
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor={`qualification-name-${index}`} className="text-white">Name *</Label>
                <Input
                  id={`qualification-name-${index}`}
                  value={qualification.name}
                  onChange={(e) =>
                    handleQualificationChange(index, 'name', e.target.value)
                  }
                  required
                  className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor={`qualification-level-${index}`} className="text-white">Level *</Label>
                <Select
                  onValueChange={(value) =>
                    handleQualificationChange(index, 'level', value)
                  }
                  value={qualification.level}
                >
                  <SelectTrigger className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800">
                    <SelectItem value="Schooling">Schooling</SelectItem>
                    <SelectItem value="Graduate">Graduate</SelectItem>
                    <SelectItem value="Masters">Masters</SelectItem>
                    <SelectItem value="Doctorate">Doctorate</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor={`qualification-specializations-${index}`} className="text-white">Specializations *</Label>
                <Input
                  id={`qualification-specializations-${index}`}
                  value={qualification.specializations.join(', ')}
                  onChange={(e) =>
                    handleQualificationChange(index, 'specializations', e.target.value)
                  }
                  placeholder="e.g., Computer Science, Data Analysis"
                  required
                  className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor={`qualification-institution-${index}`} className="text-white">Institution *</Label>
                <Input
                  id={`qualification-institution-${index}`}
                  value={qualification.institution}
                  onChange={(e) =>
                    handleQualificationChange(index, 'institution', e.target.value)
                  }
                  required
                  className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Experiences Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Experiences</h2>
          <Button type="button" onClick={addExperience} className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1">
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Experience
          </Button>
        </div>
        {formData.experiences.map((experience, index) => (
          <div key={index} className="border rounded-lg p-4 bg-gray-800 relative">
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-xs"
              onClick={() => removeExperience(index)}
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor={`experience-jobTitle-${index}`} className="text-white">Job Title *</Label>
                <Input
                  id={`experience-jobTitle-${index}`}
                  value={experience.jobTitle}
                  onChange={(e) =>
                    handleExperienceChange(index, 'jobTitle', e.target.value)
                  }
                  required
                  className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor={`experience-company-${index}`} className="text-white">Company *</Label>
                <Input
                  id={`experience-company-${index}`}
                  value={experience.company}
                  onChange={(e) =>
                    handleExperienceChange(index, 'company', e.target.value)
                  }
                  required
                  className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor={`experience-startDate-${index}`} className="text-white">Start Date *</Label>
                <Input
  id={`experience-startDate-${index}`}
  type="date"
  value={formatDate(experience.startDate)} // Updated
  onChange={(e) =>
    handleExperienceChange(index, 'startDate', e.target.value)
  }
  required
  className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
/>
<Input
  id={`experience-endDate-${index}`}
  type="date"
  value={formatDate(experience.endDate)} // Updated
  onChange={(e) =>
    handleExperienceChange(index, 'endDate', e.target.value)
  }
  required
  className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
/>
              </div>
              <div className="col-span-2">
                <Label htmlFor={`experience-description-${index}`} className="text-white">Description *</Label>
                <Input
                  id={`experience-description-${index}`}
                  value={experience.description}
                  onChange={(e) =>
                    handleExperienceChange(index, 'description', e.target.value)
                  }
                  required
                  className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Certifications Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Certifications</h2>
          <Button type="button" onClick={addCertification} className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1">
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Certification
          </Button>
        </div>
        {formData.certifications.map((certification, index) => (
          <div key={index} className="border rounded-lg p-4 bg-gray-800 relative">
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-xs"
              onClick={() => removeCertification(index)}
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor={`certification-name-${index}`} className="text-white">Name *</Label>
                <Input
                  id={`certification-name-${index}`}
                  value={certification.name}
                  onChange={(e) =>
                    handleCertificationChange(index, 'name', e.target.value)
                  }
                  required
                  className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor={`certification-issuingAuthority-${index}`} className="text-white">Issuing Authority *</Label>
                <Input
                  id={`certification-issuingAuthority-${index}`}
                  value={certification.issuingAuthority}
                  onChange={(e) =>
                    handleCertificationChange(index, 'issuingAuthority', e.target.value)
                  }
                  required
                  className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor={`certification-licenseNumber-${index}`} className="text-white">License Number *</Label>
                <Input
                  id={`certification-licenseNumber-${index}`}
                  value={certification.licenseNumber}
                  onChange={(e) =>
                    handleCertificationChange(index, 'licenseNumber', e.target.value)
                  }
                  required
                  className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor={`certification-issueDate-${index}`} className="text-white">Issue Date *</Label>
                <Input
  id={`certification-issueDate-${index}`}
  type="date"
  value={formatDate(certification.issueDate)} // Updated
  onChange={(e) =>
    handleCertificationChange(index, 'issueDate', e.target.value)
  }
  required
  className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
/>
<Input
  id={`certification-expiryDate-${index}`}
  type="date"
  value={formatDate(certification.expiryDate)} // Updated
  onChange={(e) =>
    handleCertificationChange(index, 'expiryDate', e.target.value)
  }
  required
  className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
/>

              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QualificationsForm;
