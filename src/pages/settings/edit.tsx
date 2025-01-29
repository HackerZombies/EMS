// src/pages/settings/edit.tsx

import Head from "next/head";
import { useRouter } from "next/router";
import { useState, FormEvent, useEffect, useRef } from "react";
import { prisma } from "@/lib/prisma";
import { GetServerSidePropsContext } from "next";
import { User } from "@prisma/client";
import { getSession, useSession, signOut } from "next-auth/react";
import {
  FaEye,
  FaEyeSlash,
  FaLock,
  FaCheckCircle,
  FaArrowLeft,
  FaExclamationTriangle,
} from "react-icons/fa";
import axios from "axios";

type Props = {
  user: User | null;
};

export default function PasswordUpdate({ user }: Props) {
  const router = useRouter();
  const { data: session } = useSession();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);

  // Tutorial overlay visibility
  const [showTutorial, setShowTutorial] = useState(true);
  const hideTutorial = () => setShowTutorial(false);

  useEffect(() => {
    if (user?.isFirstTime) {
      setIsFirstTime(true);
    }
  }, [user]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    } else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
      newErrors.password =
        "Password must include uppercase, lowercase, number, and special character";
    }

    // Confirm password validation
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const response = await axios.post("/api/users/updateUserInfo", {
        username: user?.username,
        password,
        email: user?.email,
      });

      if (response.status === 200) {
        setUpdateSuccess(true);

        // After showing success, sign out and redirect to login
        setTimeout(async () => {
          await signOut({ redirect: false });
          router.push("/auth/signin");
        }, 3000);
      }
    } catch (error) {
      console.error("Password update error:", error);
      setErrors({ api: "Failed to update password. Please try again later." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[@$!%*?&]/.test(password)) strength++;
    return strength;
  };

  // ------------------------------------------------------------------------------
  // Minimal & Professional Tutorial Overlay (no arrow)
  // ------------------------------------------------------------------------------
  const TutorialOverlay = () => {
    if (!showTutorial) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        {/* Dark translucent background */}
        <div className="absolute inset-0 bg-black bg-opacity-70" />

        {/* Glassmorphic container for the tutorial message */}
        <div className="relative bg-white/10 border border-gray-600 backdrop-blur-md text-white rounded-xl p-6 w-11/12 max-w-md mx-auto pointer-events-auto shadow-xl">
          <div className="flex items-start space-x-3">
            <FaExclamationTriangle className="text-yellow-400 text-2xl mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold mb-1">
                Hello {user?.firstName}!
              </h2>
              <p className="text-sm text-gray-200">
                This is your first time logging in. 
                <br />Please set a secure password below. If you skip this step,
                you'll be redirected to this page every time you log in.
              </p>
            </div>
          </div>
          <button
            onClick={hideTutorial}
            className="mt-4 block ml-auto py-2 px-4 text-sm font-medium rounded-md bg-opacity-5 bg-gray-700 hover:bg-gray-600 text-gray-100"
          >
            Got it
          </button>
        </div>
      </div>
    );
  };
  // ------------------------------------------------------------------------------

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>
          {isFirstTime ? "Welcome! Set Your Password" : "Update Password"}
        </title>
      </Head>

      {/* Show tutorial only if first-time, user hasn't updated yet, and overlay not dismissed */}
      {isFirstTime && !updateSuccess && <TutorialOverlay />}

      {/* Success Overlay */}
      {updateSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-800 text-white p-8 rounded-xl flex flex-col items-center space-y-2 shadow-2xl border border-gray-600">
            <FaCheckCircle className="text-4xl text-green-400" />
            <span className="text-xl font-bold">Password Updated Successfully!</span>
            <p className="text-center text-sm text-gray-200">
              Please check your email for a confirmation of your updated credentials.
            </p>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-lg mx-auto bg-white/10 backdrop-blur-md shadow-2xl border border-gray-700 rounded-2xl overflow-hidden relative mt-8">
        {/* Back button for non-first timers */}
        {!isFirstTime && (
          <button
            onClick={() => router.push("/settings")}
            className="absolute top-4 left-4 inline-flex items-center justify-center w-10 h-10 bg-white/20 rounded-full text-gray-100 hover:bg-white/30 transition-colors"
            aria-label="Go Back"
          >
            <FaArrowLeft className="text-xl" />
          </button>
        )}

        <div className="p-8 sm:p-10">
          {/* Header Icon + Title */}
          <div className="text-center mb-10">
            <FaLock className="mx-auto text-5xl text-gray-100 mb-4" />
            <h2 className="text-3xl font-extrabold text-white tracking-wide">
              {isFirstTime ? "Set Your Password" : "Update Password"}
            </h2>
            <p className="mt-2 text-sm text-gray-300">
              {isFirstTime
                ? "Choose a strong password you’ll remember."
                : "Enhance your account security by updating your password."
              }
            </p>
          </div>

          {/* Personal info display only if NOT first-time */}
          {!isFirstTime && (
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg mb-6 text-gray-300 border border-gray-600">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-200">Name:</span>
                <span>
                  {user?.firstName} {user?.lastName}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-200">Email:</span>
                <span>{user?.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-200">Phone:</span>
                <span>{user?.phoneNumber}</span>
              </div>
            </div>
          )}

          {/* Password Form */}
          <form onSubmit={handleUpdate} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-200">
                New Password
              </label>
              <div className="mt-1 relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full bg-transparent border border-gray-600 rounded-md px-3 py-2 focus:ring-1 focus:ring-gray-400 text-white placeholder-gray-400"
                  placeholder="Enter new password"
                />
                <div
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-300 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-400">{errors.password}</p>
              )}

              {/* Password Strength Indicator */}
              <div className="mt-3 flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 w-full rounded-full ${
                      i < getPasswordStrength() ? "bg-green-500" : "bg-gray-600"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200">
                Confirm New Password
              </label>
              <div className="mt-1 relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full bg-transparent border border-gray-600 rounded-md px-3 py-2 focus:ring-1 focus:ring-gray-400 text-white placeholder-gray-400"
                  placeholder="Confirm new password"
                />
                <div
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-300 cursor-pointer"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-400">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* API errors */}
            {errors.api && (
              <p className="text-sm text-red-400 mt-2">{errors.api}</p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md bg-green-600 text-white font-medium hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-300 mt-6"
            >
              {isSubmitting ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Server-side function
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getSession(context);
  if (!session || !prisma) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      username: session.user?.username,
    },
  });

  if (!user) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  return {
    props: {
      user,
    },
  };
}
