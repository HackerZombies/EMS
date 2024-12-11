import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import prisma from "@/lib/prisma";
import { GetServerSidePropsContext } from "next";
import { User } from "@prisma/client";
import { getSession, useSession } from "next-auth/react";
import { FaEye, FaEyeSlash, FaLock, FaCheckCircle, FaArrowLeft } from "react-icons/fa";
import axios from "axios";

type Props = {
  user: User | null;
};

export default function PersonalInfo({ user }: Props) {
  const router = useRouter();
  const { data: session, update } = useSession();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    } else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
      newErrors.password = "Password must include uppercase, lowercase, number, and special character";
    }

    // Confirm password validation
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validate()) return;
  
    setIsSubmitting(true);
    try {
      const response = await axios.post("/api/users/updateUserInfo", {
        username: user?.username,
        password,
        email: user?.email, // Include the email in the request
      });
  
      if (response.status === 200) {
        setUpdateSuccess(true);
        setTimeout(() => {
          router.push("/settings");
        }, 2000);
      }
    } catch (error) {
      console.error("Password update error", error);
      // Handle error (show error message)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Update Password | Secure Account</title>
      </Head>

      {updateSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-green-600 text-white p-8 rounded-xl flex items-center space-x-4">
            <FaCheckCircle className="text-4xl" />
            <span className="text-xl">Password Updated Successfully!</span>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto bg-[#0f000046] bg-opacity-10 backdrop-blur-lg shadow-2xl rounded-2xl overflow-hidden border border-[#235C91]/50">
        {/* Back Button Added Here */}
        <div className="absolute top-4 left-4">
          <button
            onClick={() => router.push('/settings')}
            className="bg-[#16213e] bg-opacity-50 p-2 rounded-full hover:bg-opacity-70 transition-all duration-300 flex items-center justify-center"
            aria-label="Go Back"
          >
            <FaArrowLeft className="text-gray-200 text-xl" />
          </button>
        </div>

        <div className="p-8">
          <div className="text-center mb-8">
            <FaLock className="mx-auto text-5xl text-[#e94560] mb-4" />
            <h2 className="text-3xl font-extrabold text-gray-100">
              Update Password
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Enhance your account security
            </p>
          </div>

          <div className="space-y-6">
            {/* Personal Info Display (Read-Only) */}
            <div className="bg-[#16213e] bg-opacity-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Name</span>
                <span className="font-semibold text-gray-200">{user?.firstName} {user?.lastName}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Email</span>
                <span className="font-semibold text-gray-200">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Phone</span>
                <span className="font-semibold text-gray-200">{user?.phoneNumber}</span>
              </div>
            </div>

            {/* Password Input */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-300">
                New Password
              </label>
              <div className="mt-1 relative rounded-md">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pr-10 bg-[#16213e] border-[#535C91] text-gray-200 focus:ring-[#e94560] focus:border-[#e94560] rounded-md"
                  placeholder="Enter new password"
                />
                <div 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-400"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-400">{errors.password}</p>
              )}
              {/* Password Strength Indicator */}
              <div className="mt-2 flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1 w-full rounded-full ${
                      i < getPasswordStrength() 
                        ? 'bg-green-500' 
                        : 'bg-gray-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-300">
                Confirm New Password
              </label>
              <div className="mt-1 relative rounded-md">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pr-10 bg-[#16213e] border-[#535C91] text-gray-200 focus:ring-[#e94560] focus:border-[#e94560] rounded-md"
                  placeholder="Confirm new password" />
                <div 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-400"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-400">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleUpdate}
              disabled={isSubmitting}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#e94560] hover:bg-[#d83d54] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e94560] transition-colors duration-300"
            >
              {isSubmitting ? "Updating..." : "Update Password"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Existing getServerSideProps remains the same
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