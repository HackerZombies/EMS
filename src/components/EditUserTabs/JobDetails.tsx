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

// Define the JobDetailsData interface
export interface JobDetailsData {
  department?: string;
  position?: string;
  role?: string;
  employmentType?: string;
  joiningDate?: string;
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
        <div>
          <Label htmlFor="department" className="text-white">Department *</Label>
          <Input
            id="department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            required
            className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
          />
        </div>
        <div>
          <Label htmlFor="position" className="text-white">Position *</Label>
          <Input
            id="position"
            name="position"
            value={formData.position}
            onChange={handleChange}
            required
            className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
          />
        </div>
        <div>
          <Label htmlFor="role" className="text-white">Role *</Label>
          <Select
            onValueChange={handleSelectChange('role')}
            value={formData.role}
          >
            <SelectTrigger className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800">
              <SelectItem value="HR">HR</SelectItem>
              <SelectItem value="EMPLOYEE">Employee</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="employmentType" className="text-white">Employment Type *</Label>
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
        <div>
          <Label htmlFor="joiningDate" className="text-white">Joining Date *</Label>
          <Input
            id="joiningDate"
            name="joiningDate"
            type="date"
            value={formData.joiningDate}
            onChange={handleChange}
            required
            className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default JobDetailsForm;
