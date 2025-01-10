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

// Update the JobDetailsData interface to include workLocation
export interface JobDetailsData {
  department?: string;
  position?: string;
  role?: string;
  employmentType?: string;
  joiningDate?: string;
  workLocation?: string;
}

interface JobDetailsFormProps {
  formData: JobDetailsData;
  setFormData: React.Dispatch<React.SetStateAction<JobDetailsData>>;
}

const JobDetailsForm: React.FC<JobDetailsFormProps> = ({
  formData,
  setFormData,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string) => (value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Department Dropdown */}
        <div>
          <Label htmlFor="department" className="text-white">
            Department *
          </Label>
          <Select
            onValueChange={handleSelectChange('department')}
            value={formData.department}
          >
            <SelectTrigger className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800">
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="HR">HR</SelectItem>
              <SelectItem value="Software">Software</SelectItem>
              <SelectItem value="Hardware">Hardware</SelectItem>
              <SelectItem value="Production">Production</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Position Dropdown */}
        <div>
          <Label htmlFor="position" className="text-white">
            Position *
          </Label>
          <Select
            onValueChange={handleSelectChange('position')}
            value={formData.position}
          >
            <SelectTrigger className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500">
              <SelectValue placeholder="Select position" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800">
              <SelectItem value="Software_Development_Engineer">
                Software Development Engineer
              </SelectItem>
              <SelectItem value="Embedded_Software_Development_Engineer">
                Embedded Software Development Engineer
              </SelectItem>
              <SelectItem value="Hardware_Engineer">
                Hardware Engineer
              </SelectItem>
              <SelectItem value="Chief_Technology_Officer">
                Chief Technology Officer
              </SelectItem>
              <SelectItem value="Chief_Executive_Officer">
                Chief Executive Officer
              </SelectItem>
              <SelectItem value="Project_Manager">
                Project Manager
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Role Dropdown (unchanged) */}
        <div>
          <Label htmlFor="role" className="text-white">
            Role *
          </Label>
          <Select
            onValueChange={handleSelectChange('role')}
            value={formData.role}
          >
            <SelectTrigger className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800">
              <SelectItem value="HR">HR</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="EMPLOYEE">Employee</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Employment Type Dropdown (unchanged) */}
        <div>
          <Label htmlFor="employmentType" className="text-white">
            Employment Type *
          </Label>
          <Select
            onValueChange={handleSelectChange('employmentType')}
            value={formData.employmentType}
          >
            <SelectTrigger className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500">
              <SelectValue placeholder="Select employment type" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800">
              <SelectItem value="FULL_TIME">Full Time</SelectItem>
              <SelectItem value="PART_TIME">Part Time</SelectItem>
              <SelectItem value="CONTRACT">Contract</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Work Location Dropdown */}
        <div>
          <Label htmlFor="workLocation" className="text-white">
            Work Location *
          </Label>
          <Select
            onValueChange={handleSelectChange('workLocation')}
            value={formData.workLocation}
          >
            <SelectTrigger className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500">
              <SelectValue placeholder="Select work location" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800">
              <SelectItem value="NaviMumbai">Navi Mumbai</SelectItem>
              <SelectItem value="Delhi">Delhi</SelectItem>
              <SelectItem value="Kochi">Kochi</SelectItem>
              <SelectItem value="Remote">Remote</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Joining Date Input */}
        <div>
          <Label htmlFor="joiningDate" className="text-white">
            Joining Date *
          </Label>
          <Input
  id="joiningDate"
  name="joiningDate"
  type="date"
  value={formData.joiningDate ? new Date(formData.joiningDate).toISOString().split('T')[0] : ''}
  onChange={(e) => {
    const { value } = e.target;
    setFormData({ ...formData, joiningDate: value });
  }}
  required
  className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
/>
        </div>
      </div>
    </div>
  );
};

export default JobDetailsForm;
