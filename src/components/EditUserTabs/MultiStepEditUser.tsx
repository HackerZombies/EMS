'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import isEqual from 'lodash.isequal';

import PersonalInfoForm, { PersonalInfoData } from './GeneralInfo';
import JobDetailsForm, { JobDetailsData } from './JobDetails';
import QualificationsForm, { QualificationsData } from './Qualifications';
import DocumentsSection from './Documents';

import { TrashIcon } from '@heroicons/react/24/outline';

const steps = [
  { id: 0, name: 'Personal Information' },
  { id: 1, name: 'Job Details' },
  { id: 2, name: 'Qualifications' },
  { id: 3, name: 'Documents' },
];

export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
  email: string;
}

export interface User {
  username: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  nationality?: string;
  phoneNumber?: string;
  dob?: string;
  residentialAddress?: string;
  permanentAddress?: string;
  department?: string;
  position?: string;
  role?: string;
  gender?: string;
  bloodGroup?: string;
  employmentType?: string;
  joiningDate?: string;
  qualifications: Qualification[];
  experiences: Experience[];
  certifications: Certification[];
  emergencyContacts: EmergencyContact[];
  profileImageUrl?: string;
}

export type Qualification = {
  name: string;
  level: string;
  specializations: string[];
  institution: string;
};

export type Experience = {
  jobTitle: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
};

export type Certification = {
  name: string;
  issuingAuthority: string;
  licenseNumber: string;
  issueDate: string;
  expiryDate: string;
};

const MultiStepEditUser: React.FC = () => {
  // Initialize router, session, and state hooks
  const router = useRouter();
  const { username } = router.query;
  const { data: session, status } = useSession();

  const [activeStep, setActiveStep] = useState<number>(0);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoData>({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dob: '',
    residentialAddress: '',
    permanentAddress: '',
    gender: '',
    bloodGroup: '',
    emergencyContacts: [
      {
        name: '',
        relationship: '',
        phoneNumber: '',
        email: '',
      },
    ],
    resetPassword: false,
    profileImageUrl: '',
    nationality: ''
  });
  const [jobDetails, setJobDetails] = useState<JobDetailsData>({
    department: '',
    position: '',
    role: '',
    employmentType: '',
    joiningDate: '',
  });
  const [qualifications, setQualifications] = useState<QualificationsData>({
    qualifications: [],
    experiences: [],
    certifications: [],
  });

  const [initialData, setInitialData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [deleteConfirm, setDeleteConfirm] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Fetch user data on mount or username change
  useEffect(() => {
    if (username) {
      const fetchData = async () => {
        try {
          const response = await fetch(`/api/users/user/${username}`);
          if (!response.ok) throw new Error('Failed to fetch user data');
          const data = await response.json();

          const userData: User = {
            username: data.username,
            firstName: data.firstName,
            middleName: data.middleName,
            lastName: data.lastName,
            email: data.email,
            phoneNumber: data.phoneNumber,
            dob: data.dob,
            residentialAddress: data.residentialAddress,
            permanentAddress: data.permanentAddress,
            department: data.department,
            position: data.position,
            role: data.role,
            gender: data.gender,
            bloodGroup: data.bloodGroup,
            employmentType: data.employmentType,
            joiningDate: data.joiningDate,
            qualifications: data.qualifications || [],
            experiences: data.experiences || [],
            certifications: data.certifications || [],
            emergencyContacts: data.emergencyContacts || [],
            profileImageUrl: data.profileImageUrl,
            nationality: data.nationality
            
          };

          setPersonalInfo({
            firstName: userData.firstName,
            middleName: userData.middleName || '',
            lastName: userData.lastName,
            email: userData.email,
            phoneNumber: userData.phoneNumber || '',
            dob: userData.dob || '',
            residentialAddress: userData.residentialAddress || '',
            permanentAddress: userData.permanentAddress || '',
            gender: userData.gender || '',
            bloodGroup: userData.bloodGroup || '',
            emergencyContacts: userData.emergencyContacts,
            resetPassword: false,
            profileImageUrl: userData.profileImageUrl || '',
            
            nationality: userData.nationality
          });

          setJobDetails({
            department: userData.department || '',
            position: userData.position || '',
            role: userData.role || '',
            employmentType: userData.employmentType || '',
            joiningDate: userData.joiningDate || '',
          });

          setQualifications({
            qualifications: userData.qualifications,
            experiences: userData.experiences,
            certifications: userData.certifications,
          });

          setInitialData(userData);
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [username]);

  // Memoized check for changes
  const changesMade = useMemo(() => {
    if (!initialData) return false;

    const currentUser: User = {
      username: initialData.username,
      firstName: personalInfo.firstName,
      middleName: personalInfo.middleName,
      lastName: personalInfo.lastName,
      email: personalInfo.email,
      phoneNumber: personalInfo.phoneNumber,
      dob: personalInfo.dob,
      residentialAddress: personalInfo.residentialAddress,
      permanentAddress: personalInfo.permanentAddress,
      gender: personalInfo.gender,
      bloodGroup: personalInfo.bloodGroup,
      nationality: personalInfo.nationality,
      emergencyContacts: personalInfo.emergencyContacts,
      department: jobDetails.department,
      position: jobDetails.position,
      role: jobDetails.role,
      employmentType: jobDetails.employmentType,
      joiningDate: jobDetails.joiningDate,
      qualifications: qualifications.qualifications,
      experiences: qualifications.experiences,
      certifications: qualifications.certifications,
      
      
    };

    return !isEqual(initialData, currentUser);
  }, [initialData, personalInfo, jobDetails, qualifications]);

  // Conditional renders after all hooks are declared
  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <span className="text-xl text-white">Loading...</span>
      </div>
    );
  }

  const allowedRoles = ['HR'];
  if (!session || !session.user || !allowedRoles.includes(session.user.role)) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <span className="text-red-500 text-xl">Unauthorized</span>
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <span className="text-red-500 text-xl">User not found</span>
      </div>
    );
  }

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload: any = {
        username: initialData!.username,
        firstName: personalInfo.firstName,
        middleName: personalInfo.middleName,
        nationality:personalInfo.nationality,
        lastName: personalInfo.lastName,
        email: personalInfo.email,
        phoneNumber: personalInfo.phoneNumber,
        dob: personalInfo.dob,
        residentialAddress: personalInfo.residentialAddress,
        permanentAddress: personalInfo.permanentAddress,
        gender: personalInfo.gender,
        bloodGroup: personalInfo.bloodGroup,
        emergencyContacts: personalInfo.emergencyContacts,
        department: jobDetails.department,
        position: jobDetails.position,
        role: jobDetails.role,
        employmentType: jobDetails.employmentType,
        joiningDate: jobDetails.joiningDate,
        qualifications: qualifications.qualifications,
        experiences: qualifications.experiences,
        certifications: qualifications.certifications,
        profileImageUrl: personalInfo.profileImageUrl,
        
      };

      if (personalInfo.resetPassword) {
        payload.resetPassword = true;
      }

      const response = await fetch('/api/users/updateUser', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to update user.');
      }

      const data = await response.json();

      setShowConfirmation(true);
      setTimeout(() => {
        router.push('/manage/users');
      }, 2000);
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/users/deleteUser', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: initialData!.username }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete user.');
      }

      router.push('/manage/users');
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Render current step component
  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <PersonalInfoForm
            formData={personalInfo}
            setFormData={setPersonalInfo}
          />
        );
      case 1:
        return (
          <JobDetailsForm
            formData={jobDetails}
            setFormData={setJobDetails}
          />
        );
      case 2:
        return (
          <QualificationsForm
            formData={qualifications}
            setFormData={setQualifications}
          />
        );
      case 3:
        return (
          <DocumentsSection userUsername={initialData!.username} />
        );
      default:
        return null;
    }
  };

  const handleStepClick = (stepId: number) => {
    setActiveStep(stepId);
  };

  return (
    <>
      <Head>
        <title>Edit User - {initialData.username}</title>
      </Head>
      <div className="container mx-auto p-6 bg-gray-900 min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-center text-white">
            Edit User: {initialData.username}
          </h1>
          <Button
            type="button"
            onClick={() => setDeleteConfirm(true)}
            className="bg-red-600 hover:bg-red-700 text-white flex items-center"
          >
            <TrashIcon className="w-4 h-4 mr-2" />
            Delete User
          </Button>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <Progress
            value={(activeStep / (steps.length - 1)) * 100}
            className="mb-4 bg-gray-700"
          />
          <div className="flex justify-between">
            {steps.map((step, index) => (
              <div
                key={step.id}
                onClick={() => handleStepClick(step.id)}
                className={`flex flex-col items-center cursor-pointer ${
                  index <= activeStep ? 'text-blue-400' : 'text-gray-500'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    index <= activeStep
                      ? 'border-blue-400 bg-blue-500 text-white'
                      : 'border-gray-500'
                  }`}
                >
                  {index + 1}
                </div>
                <span className="mt-2 text-sm">{step.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Step */}
        <div className="bg-gray-800 shadow-md rounded-lg p-6">
          {renderStep()}
        </div>

        {/* Confirmation Message */}
        {showConfirmation && (
          <div className="mt-4 p-4 bg-green-600 text-white text-center rounded">
            User updated successfully! Redirecting...
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            disabled={activeStep === 0}
            onClick={() => setActiveStep((prev) => prev - 1)}
            className="bg-gray-700 text-white hover:bg-gray-600"
          >
            Back
          </Button>
          {activeStep < steps.length - 1 ? (
            <Button
              onClick={() => setActiveStep((prev) => prev + 1)}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!changesMade || isSubmitting} 
              // Provide a tooltip when disabled due to no changes
              title={!changesMade ? 'No changes detected' : undefined}
              className={`bg-green-600 text-white hover:bg-green-700 ${!changesMade ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-gray-800 p-6 rounded-lg w-96">
              <h2 className="text-xl font-semibold text-white mb-4">Confirm Deletion</h2>
              <p className="text-gray-300 mb-6">Are you sure you want to delete user "{initialData.username}"? This action cannot be undone.</p>
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  onClick={() => setDeleteConfirm(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MultiStepEditUser;
