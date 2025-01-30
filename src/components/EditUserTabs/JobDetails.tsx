// components/EditUserTabs/JobDetailsForm.tsx

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
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChangeHistoryEntry } from "@/types/audit"; // Adjust path as needed

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
  currentUserRole: string; // e.g., 'ADMIN' | 'HR' | 'EMPLOYEE'
  changeHistory: Record<string, ChangeHistoryEntry[]>;
  isEditMode: boolean; // Controlled via parent
}

// Items per page for the history lists
const ITEMS_PER_PAGE = 5;

const JobDetailsForm: React.FC<JobDetailsFormProps> = ({
  formData,
  setFormData,
  currentUserRole,
  changeHistory,
  isEditMode,
}) => {
  // Track which fields have their history section open
  const [openFields, setOpenFields] = useState<Record<string, boolean>>({});

  // Track pagination (which page) per field
  const [pagination, setPagination] = useState<Record<string, number>>({});

  // Normalize user role
  const userRoleNormalized = currentUserRole?.toUpperCase() || "";

  // ------------------ History Helpers ------------------

  // Get all change history for a specific field
  const getFieldHistory = (field: string): ChangeHistoryEntry[] => {
    return changeHistory[field] || [];
  };

  // Toggle a field's history panel (removed the edit-mode guard)
  const toggleFieldHistory = (field: string) => {
    setOpenFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // Pagination: change page
  const handlePageChange = (field: string, direction: "prev" | "next") => {
    setPagination((prev) => {
      const currentPage = prev[field] || 1;
      const maxPage = Math.ceil(getFieldHistory(field).length / ITEMS_PER_PAGE);
      let newPage = currentPage;
      if (direction === "prev" && currentPage > 1) {
        newPage -= 1;
      } else if (direction === "next" && currentPage < maxPage) {
        newPage += 1;
      }
      return { ...prev, [field]: newPage };
    });
  };

  // Get paginated subset of a field's history
  const getPaginatedHistory = (field: string): ChangeHistoryEntry[] => {
    const history = getFieldHistory(field);
    const currentPage = pagination[field] || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return history.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  // ------------------ Handlers for Input/Select ------------------

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange =
    (name: keyof JobDetailsData) => (value: string) => {
      // If non-admin tries to select ADMIN role, prevent it
      if (name === "role" && value === "ADMIN" && userRoleNormalized !== "ADMIN") {
        alert("You do not have permission to select Admin role.");
        return;
      }
      setFormData({ ...formData, [name]: value });
    };

  const handleRoleClick = () => {
    if (userRoleNormalized !== "ADMIN") {
      alert("You do not have permission to select Admin role.");
    }
  };

  // ------------------ Rendering ------------------

  return (
    <div className="bg-white/80 p-4 rounded-md shadow-sm space-y-6">
      <h2 className="text-lg font-semibold text-gray-700">Job Details</h2>

      {/* Fields in a grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Department */}
        <div className="relative">
          <Label htmlFor="department" className="text-gray-700">
            Department <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center">
            <Select
              onValueChange={handleSelectChange("department")}
              value={formData.department || ""}
              disabled={!isEditMode}
            >
              <SelectTrigger
                className={`bg-white text-gray-900 border border-gray-300 focus:ring-blue-500 w-full mt-1 ${
                  !isEditMode ? "cursor-not-allowed opacity-50" : ""
                }`}
              >
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-300 text-gray-700">
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
                <SelectItem value="Software">Software</SelectItem>
                <SelectItem value="Hardware">Hardware</SelectItem>
                <SelectItem value="Production">Production</SelectItem>
              </SelectContent>
            </Select>
            {/* History Icon (always clickable now) */}
            {getFieldHistory("department").length > 0 && (
              <button
                type="button"
                className="ml-2 text-gray-500 hover:text-gray-700"
                onClick={() => toggleFieldHistory("department")}
                title="View Change History"
              >
                <History className="w-5 h-5" />
              </button>
            )}
          </div>
          {/* Change History Display (no longer gated by isEditMode) */}
          {openFields["department"] && (
            <HistorySection
              field="department"
              label="Department"
              historyList={getPaginatedHistory("department")}
              totalCount={getFieldHistory("department").length}
              currentPage={pagination["department"] || 1}
              onPageChange={handlePageChange}
            />
          )}
        </div>

        {/* Position */}
        <div className="relative">
          <Label htmlFor="position" className="text-gray-700">
            Position <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center">
            <Select
              onValueChange={handleSelectChange("position")}
              value={formData.position || ""}
              disabled={!isEditMode}
            >
              <SelectTrigger
                className={`bg-white text-gray-900 border border-gray-300 focus:ring-blue-500 w-full mt-1 ${
                  !isEditMode ? "cursor-not-allowed opacity-50" : ""
                }`}
              >
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-300 text-gray-700">
                <SelectItem value="Software_Development_Engineer">
                  Software Development Engineer
                </SelectItem>
                <SelectItem value="Embedded_Software_Development_Engineer">
                  Embedded Software Development Engineer
                </SelectItem>
                <SelectItem value="Hardware_Engineer">Hardware Engineer</SelectItem>
                <SelectItem value="Chief_Technology_Officer">
                  Chief Technology Officer
                </SelectItem>
                <SelectItem value="Chief_Executive_Officer">
                  Chief Executive Officer
                </SelectItem>
                <SelectItem value="Project_Manager">Project Manager</SelectItem>
              </SelectContent>
            </Select>
            {getFieldHistory("position").length > 0 && (
              <button
                type="button"
                className="ml-2 text-gray-500 hover:text-gray-700"
                onClick={() => toggleFieldHistory("position")}
                title="View Change History"
              >
                <History className="w-5 h-5" />
              </button>
            )}
          </div>
          {openFields["position"] && (
            <HistorySection
              field="position"
              label="Position"
              historyList={getPaginatedHistory("position")}
              totalCount={getFieldHistory("position").length}
              currentPage={pagination["position"] || 1}
              onPageChange={handlePageChange}
            />
          )}
        </div>

        {/* Role */}
        <div className="relative">
          <Label htmlFor="role" className="text-gray-700">
            Role <span className="text-red-500">*</span>
          </Label>
          <div
            onClick={handleRoleClick}
            className={`mt-1 w-full ${
              userRoleNormalized !== "ADMIN" ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <Select
              onValueChange={handleSelectChange("role")}
              value={formData.role || ""}
              disabled={!isEditMode}
            >
              <SelectTrigger
                className={`bg-white text-gray-900 border border-gray-300 focus:ring-blue-500 w-full ${
                  !isEditMode ? "cursor-not-allowed opacity-50" : ""
                }`}
              >
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-300 text-gray-700">
                <SelectItem value="HR">HR</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="EMPLOYEE">Employee</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {getFieldHistory("role").length > 0 && (
            <button
              type="button"
              className="absolute top-8 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => toggleFieldHistory("role")}
              title="View Change History"
            >
              <History className="w-5 h-5" />
            </button>
          )}
          {/* If you still want to show a warning message for non-Admin users: */}
          {userRoleNormalized !== "ADMIN" && (
            <p className="mt-1 text-sm text-red-500">
              (You do not have permission to select Admin. Contact an Admin.)
            </p>
          )}
          {openFields["role"] && (
            <HistorySection
              field="role"
              label="Role"
              historyList={getPaginatedHistory("role")}
              totalCount={getFieldHistory("role").length}
              currentPage={pagination["role"] || 1}
              onPageChange={handlePageChange}
            />
          )}
        </div>

        {/* Employment Type */}
        <div className="relative">
          <Label htmlFor="employmentType" className="text-gray-700">
            Employment Type <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center">
            <Select
              onValueChange={handleSelectChange("employmentType")}
              value={formData.employmentType || ""}
              disabled={!isEditMode}
            >
              <SelectTrigger
                className={`bg-white text-gray-900 border border-gray-300 focus:ring-blue-500 w-full mt-1 ${
                  !isEditMode ? "cursor-not-allowed opacity-50" : ""
                }`}
              >
                <SelectValue placeholder="Select employment type" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-300 text-gray-700">
                <SelectItem value="FULL_TIME">Full Time</SelectItem>
                <SelectItem value="PART_TIME">Part Time</SelectItem>
                <SelectItem value="CONTRACT">Contract</SelectItem>
              </SelectContent>
            </Select>
            {getFieldHistory("employmentType").length > 0 && (
              <button
                type="button"
                className="ml-2 text-gray-500 hover:text-gray-700"
                onClick={() => toggleFieldHistory("employmentType")}
                title="View Change History"
              >
                <History className="w-5 h-5" />
              </button>
            )}
          </div>
          {openFields["employmentType"] && (
            <HistorySection
              field="employmentType"
              label="Employment Type"
              historyList={getPaginatedHistory("employmentType")}
              totalCount={getFieldHistory("employmentType").length}
              currentPage={pagination["employmentType"] || 1}
              onPageChange={handlePageChange}
            />
          )}
        </div>

        {/* Work Location */}
        <div className="relative">
          <Label htmlFor="workLocation" className="text-gray-700">
            Work Location <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center">
            <Select
              onValueChange={handleSelectChange("workLocation")}
              value={formData.workLocation || ""}
              disabled={!isEditMode}
            >
              <SelectTrigger
                className={`bg-white text-gray-900 border border-gray-300 focus:ring-blue-500 w-full mt-1 ${
                  !isEditMode ? "cursor-not-allowed opacity-50" : ""
                }`}
              >
                <SelectValue placeholder="Select work location" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-300 text-gray-700">
                <SelectItem value="NaviMumbai">Navi Mumbai</SelectItem>
                <SelectItem value="Delhi">Delhi</SelectItem>
                <SelectItem value="Kochi">Kochi</SelectItem>
                <SelectItem value="Remote">Remote</SelectItem>
              </SelectContent>
            </Select>
            {getFieldHistory("workLocation").length > 0 && (
              <button
                type="button"
                className="ml-2 text-gray-500 hover:text-gray-700"
                onClick={() => toggleFieldHistory("workLocation")}
                title="View Change History"
              >
                <History className="w-5 h-5" />
              </button>
            )}
          </div>
          {openFields["workLocation"] && (
            <HistorySection
              field="workLocation"
              label="Work Location"
              historyList={getPaginatedHistory("workLocation")}
              totalCount={getFieldHistory("workLocation").length}
              currentPage={pagination["workLocation"] || 1}
              onPageChange={handlePageChange}
            />
          )}
        </div>

        {/* Joining Date */}
        <div className="relative">
          <Label htmlFor="joiningDate" className="text-gray-700">
            Joining Date <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center">
            <Input
              id="joiningDate"
              name="joiningDate"
              type="date"
              value={
                formData.joiningDate
                  ? new Date(formData.joiningDate).toISOString().split("T")[0]
                  : ""
              }
              onChange={handleInputChange}
              required
              className={`bg-white text-gray-900 border border-gray-300 focus:ring-blue-500 mt-1 ${
                !isEditMode ? "cursor-not-allowed opacity-50" : ""
              }`}
              disabled={!isEditMode}
            />
            {getFieldHistory("joiningDate").length > 0 && (
              <button
                type="button"
                className="ml-2 text-gray-500 hover:text-gray-700"
                onClick={() => toggleFieldHistory("joiningDate")}
                title="View Change History"
              >
                <History className="w-5 h-5" />
              </button>
            )}
          </div>
          {openFields["joiningDate"] && (
            <HistorySection
              field="joiningDate"
              label="Joining Date"
              historyList={getPaginatedHistory("joiningDate")}
              totalCount={getFieldHistory("joiningDate").length}
              currentPage={pagination["joiningDate"] || 1}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

interface HistorySectionProps {
  field: string;
  label: string;
  historyList: ChangeHistoryEntry[];
  totalCount: number;
  currentPage: number;
  onPageChange: (field: string, direction: "prev" | "next") => void;
}

const HistorySection: React.FC<HistorySectionProps> = ({
  field,
  label,
  historyList,
  totalCount,
  currentPage,
  onPageChange,
}) => {
  const maxPage = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
      <h4 className="text-sm font-semibold text-gray-700 flex items-center space-x-1">
        <History className="w-4 h-4 text-blue-500" />
        <span>{label} Change History</span>
      </h4>
      {totalCount === 0 ? (
        <p className="text-sm text-gray-600">No changes recorded.</p>
      ) : (
        <>
          <ul className="space-y-2">
            {historyList.map((entry, index) => (
              <li key={index} className="flex items-start">
                <div className="flex-shrink-0 mr-2">
                  <History className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-sm text-gray-700">
                  <p className="mb-1">
                    <strong>{entry.performedBy}</strong> changed on{" "}
                    {new Date(entry.datePerformed).toLocaleString()}
                  </p>
                  <p className="mb-1">
                    <strong>From:</strong>{" "}
                    {field === "joiningDate" && entry.old
                      ? new Date(entry.old).toLocaleDateString()
                      : entry.old || "N/A"}
                  </p>
                  <p>
                    <strong>To:</strong>{" "}
                    {field === "joiningDate" && entry.new
                      ? new Date(entry.new).toLocaleDateString()
                      : entry.new || "N/A"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          {/* Pagination Controls */}
          {totalCount > ITEMS_PER_PAGE && (
            <div className="flex justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => onPageChange(field, "prev")}
                className="text-blue-500 hover:text-blue-700"
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage === maxPage}
                onClick={() => onPageChange(field, "next")}
                className="text-blue-500 hover:text-blue-700"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default JobDetailsForm;
