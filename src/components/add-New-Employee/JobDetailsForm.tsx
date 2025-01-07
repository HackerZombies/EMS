import React from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface JobDetailsFormProps {
  formData: any
  setFormData: React.Dispatch<React.SetStateAction<any>>
}

export default function JobDetailsForm({ formData, setFormData }: JobDetailsFormProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (name: string) => (value: string) => {
    setFormData({ ...formData, [name]: value })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="department">Department</Label>
          <Input id="department" name="department" value={formData.department} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="position">Position</Label>
          <Input id="position" name="position" value={formData.position} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="role">Role</Label>
          <Select onValueChange={handleSelectChange('role')} value={formData.role}>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HR">HR</SelectItem>
              <SelectItem value="EMPLOYEE">Employee</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="workLocation">Work Location</Label>
          <Input id="workLocation" name="workLocation" value={formData.workLocation} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="employmentType">Employment Type</Label>
          <Select onValueChange={handleSelectChange('employmentType')} value={formData.employmentType}>
            <SelectTrigger>
              <SelectValue placeholder="Select employment type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FULL_TIME">Full Time</SelectItem>
              <SelectItem value="PART_TIME">Part Time</SelectItem>
              <SelectItem value="CONTRACT">Contract</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="joiningDate">Joining Date</Label>
          <Input id="joiningDate" name="joiningDate" type="date" value={formData.joiningDate} onChange={handleChange} required />
        </div>
      </div>
    </div>
  )
}

