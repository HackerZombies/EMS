// src/hooks/useUserData.ts

import { useCallback, useState } from "react";
import { useRouter } from "next/router";

// Make all fields optional to match your other code:
export interface Address {
  flat?: string;
  street?: string;
  landmark?: string;
  city?: string;
  district?: string;
  state?: string;
  pin?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
  email: string;
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

/**
 * Ensure this matches your actual usage in the app:
 */
export interface User {
  username: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  nationality?: string;
  phoneNumber?: string;
  dob?: string;
  residentialAddress?: Address;  // remains optional
  permanentAddress?: Address;    // remains optional
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
  workLocation?: string;
}

interface UseUserDataReturn {
  /** The user data (if fetched) */
  userData: User | null;

  /** Any error messages that occurred (fetching, updating, deleting) */
  error: string | null;

  /** Object describing different loading states */
  status: {
    isLoading: boolean;
    isSubmitting: boolean;
    isDeleting: boolean;
  };

  /** Method to fetch user data by username (GET /api/users/user/:username) */
  fetchUser: (username: string) => Promise<void>;

  /** Method to update user data (PUT /api/users/updateUser) */
  updateUser: (user: Partial<User> & { resetPassword?: boolean }) => Promise<void>;

  /** Method to delete user data (DELETE /api/users/deleteUser) */
  deleteUser: (username: string) => Promise<void>;

  /** Setter to manually override the user data state if needed */
  setUserData: React.Dispatch<React.SetStateAction<User | null>>;
}

/**
 * Custom hook to handle fetching, updating, and deleting a single user.
 */
export function useUserData(): UseUserDataReturn {
  const router = useRouter();

  const [userData, setUserData] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState({
    isLoading: false,
    isSubmitting: false,
    isDeleting: false,
  });

  /**
   * Fetch user data (GET /api/users/user/[username]).
   */
  const fetchUser = useCallback(async (username: string) => {
    setStatus((prev) => ({ ...prev, isLoading: true }));
    setError(null);

    try {
      const response = await fetch(`/api/users/user/${username}`);
      if (!response.ok) {
        throw new Error("Failed to fetch user data.");
      }
      const data = await response.json();
      setUserData(data);
    } catch (err: any) {
      setError(err.message || "Error fetching user data.");
    } finally {
      setStatus((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  /**
   * Update user data (PUT /api/users/updateUser).
   * The `user` param should be the full or partial user object 
   * that you want to update, including { username }.
   */
  const updateUser = useCallback(
    async (user: Partial<User> & { resetPassword?: boolean }) => {
      setStatus((prev) => ({ ...prev, isSubmitting: true }));
      setError(null);

      try {
        const response = await fetch(`/api/users/updateUser`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(user),
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || "Failed to update user.");
        }

        // Optionally re-fetch user data or reload:
        router.reload();
      } catch (err: any) {
        setError(err.message || "Error updating user data.");
      } finally {
        setStatus((prev) => ({ ...prev, isSubmitting: false }));
      }
    },
    [router]
  );

  /**
   * Delete user (DELETE /api/users/deleteUser).
   */
  const deleteUser = useCallback(
    async (username: string) => {
      setStatus((prev) => ({ ...prev, isDeleting: true }));
      setError(null);

      try {
        const response = await fetch(`/api/users/deleteUser`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username }),
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || "Failed to delete user.");
        }

        // After deleting, redirect or update state:
        router.push("/manage/users");
      } catch (err: any) {
        setError(err.message || "Error deleting user.");
      } finally {
        setStatus((prev) => ({ ...prev, isDeleting: false }));
      }
    },
    [router]
  );

  return {
    userData,
    error,
    status,
    fetchUser,
    updateUser,
    deleteUser,
    setUserData,
  };
}
