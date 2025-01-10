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
        {/* Department Dropdown */}
        <div>
          <Label htmlFor="department">Department</Label>
          <Select onValueChange={handleSelectChange('department')} value={formData.department}>
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
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
          <Label htmlFor="position">Position</Label>
          <Select onValueChange={handleSelectChange('position')} value={formData.position}>
            <SelectTrigger>
              <SelectValue placeholder="Select position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Software_Development_Engineer">Software Development Engineer</SelectItem>
              <SelectItem value="Embedded_Software_Development_Engineer">Embedded Software Development Engineer</SelectItem>
              <SelectItem value="Hardware_Engineer">Hardware Engineer</SelectItem>
              <SelectItem value="Chief_Technology_Officer">Chief Technology Officer</SelectItem>
              <SelectItem value="Chief_Executive_Officer">Chief Executive Officer</SelectItem>
              <SelectItem value="Project_Manager">Project Manager</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="role">Role</Label>
          <Select onValueChange={handleSelectChange('role')} value={formData.role}>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
            <SelectItem value="ADMIN">ADMIN</SelectItem>
              <SelectItem value="HR">HR</SelectItem>
              <SelectItem value="EMPLOYEE">Employee</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="workLocation">Work Location</Label>
          <Select onValueChange={handleSelectChange('workLocation')} value={formData.workLocation}>
            <SelectTrigger>
              <SelectValue placeholder="Select work location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NaviMumbai">Navi Mumbai</SelectItem>
              <SelectItem value="Delhi">Delhi</SelectItem>
              <SelectItem value="Kochi">Kochi</SelectItem>
              <SelectItem value="Remote">Remote</SelectItem>
            </SelectContent>
          </Select>
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
