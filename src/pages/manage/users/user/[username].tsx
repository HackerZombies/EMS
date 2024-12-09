import Head from "next/head";
import axios from "axios";
import { useState } from "react";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { User } from "@prisma/client";
import { Eye, EyeOff } from 'lucide-react';
import BackButton from "@/components/BackButton";
import prisma from "@/lib/prisma";
import Button from "@/components/Button";
import Input from "@/components/Input";
import ModalPopup from "@/components/Modal";
import argon2 from 'argon2';

type Props = {
  user: User;
};

export default function EditUser ({ user }: Props) {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const router = useRouter();

  const [formData, setFormData] = useState({
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    password: "",
    email: user.email,
    phoneNumber: user.phoneNumber,
    dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : "",
    address: user.address || "",
    qualifications: user.qualifications || "",
    department: user.department || "",
    position: user.position || "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState<React.ReactNode>(<></>);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (formData.email && !emailPattern.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    const phonePattern = /^91[0-9]{10}$/;
    if (formData.phoneNumber && !phonePattern.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Invalid phone number format. Please enter 91 followed by a 10-digit number.";
    }

    if (formData.dob) {
      const dobDate = new Date(formData.dob);
      const today = new Date();
      const age = today.getFullYear() - dobDate.getFullYear();
      if (age < 18) {
        newErrors.dob = "Employee must be at least 18 years old";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validate()) {
      return;
    }
  
    // Prepare the data to send to the API
    const dataToUpdate = {
      username: formData.username,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      dob: formData.dob ? new Date(formData.dob).toISOString() : undefined,
      address: formData.address,
      qualifications: formData.qualifications,
      department: formData.department,
      position: formData.position,
      password: formData.password, // Send the plain password
    };
  
    try {
      const response = await axios.post("/api/users/updateUser ", dataToUpdate);
      if (response.status === 200) {
        setModalTitle("Success");
        setModalMessage(
          <div className="flex flex-col gap-3 text-center">
            <p className="text-green-500 text-lg">
              User details have been successfully updated.
            </p>
            <Button onClick={() => router.push("/manage/users")} className="bg-blue-500 text-white px-4 py-2 rounded">
              Back to Users
            </Button>
          </div>
        );
        setModalVisible(true);
      }
    } catch (error) {
      // Handle errors as before
    }
  };

  const deleteUser  = async () => {
    setModalVisible(false);
    try {
      const response = await axios.delete("/api/users/deleteUser  ", {
        data: { username: formData.username },
      });
      if (response.status === 200) {
        router.push("/manage/users");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;
        setModalTitle("Error");
        setModalMessage(
          <p className="text-red-500">
            Error deleting user: {data?.message || "An unexpected error occurred."}
          </p>
        );
        setModalVisible(true);
      } else {
        console.error("Error deleting user:", error);
        setModalTitle("Error");
        setModalMessage(
          <p className="text-red-500">An unexpected error occurred. Please try again.</p>
        );
        setModalVisible(true);
      }
    }
  };

  const handleDelete = async () => {
    setModalTitle("Delete User");
    setModalMessage(
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <p>Are you sure you want to delete this user?</p>
          <p>
            If you continue, all data associated with this user will be removed.
          </p>
        </div>
        <div className="flex flex-row justify-end gap-2 max-md:flex-col">
          <button
            onClick={deleteUser }
            className="flex items-center justify-center gap-1 rounded-full bg-red-600 px-3 py-2 font-medium text-white shadow-lg transition hover:bg-black active:bg-black active:bg-opacity-70"
          >
            Yes, delete this user
          </button>
          <Button onClick={() => setModalVisible(false)}>No, go back</Button>
        </div>
      </div>
    );
    setModalVisible(true);
  };

  return (
    <>
      <Head>
        <title>
          EMS - Edit User - {user.firstName} {user.lastName}
        </title>
      </Head>
      <div className="flex flex-col gap-3 p-5 bg-gray-900 text-white">
        <BackButton />
        <div className="flex justify-between gap-2 max-md:flex-col">
          <h1 className="text-4xl font-semibold">
            Edit User - {user.firstName} {user.lastName}
          </h1>
          <div className="flex gap-3">
            {userRole === "TECHNICIAN" && (
              <button
                onClick={handleDelete}
                className="flex w-full items-center justify-center gap-1 rounded-full bg-red-600 px-3 py-2 font-medium text-white shadow-lg transition hover:bg-white hover:text-black active:bg-white active:bg-opacity-70"
              >
                Delete User
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-2xl bg-gray-800 p-5 shadow-lg">
          <FormField label="User  ID" name="username" value={formData.username} onChange={handleInputChange} disabled />
          <FormField label="First Name" name="firstName" value={formData.firstName} onChange={handleInputChange} />
          <FormField label="Last Name" name="lastName" value={formData.lastName} onChange={handleInputChange} />
          <div className="flex flex-col">
            <label className="font-medium" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                id="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`bg-gray-700 text-white ${errors.password ? "border-red- 500" : "border-gray-600"} border rounded-lg px-3 py-2`}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                {showPassword ? <EyeOff size={20} color="white" /> : <Eye size={20} color="white" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>
          <FormField label="Email Address" name="email" type="email" value={formData.email} onChange={handleInputChange} error={errors.email} />
          <FormField label="Mobile Number" name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleInputChange} error={errors.phoneNumber} />
          <FormField label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleInputChange} error={errors.dob} />
          <FormField label="Address" name="address" value={formData.address} onChange={handleInputChange} />
          <FormField label="Qualifications" name="qualifications" value={formData.qualifications} onChange={handleInputChange} />
          <FormField label="Department" name="department" value={formData.department} onChange={handleInputChange} />
          <FormField label="Position" name="position" value={formData.position} onChange={handleInputChange} />
          <div className="flex w-full justify-end">
            <Button onClick={handleUpdate} className="bg-blue-600 text-white px-4 py-2 rounded-lg transition hover:bg-blue-500">
              Save Changes
            </Button>
          </div>
        </div>
      </div>
      <ModalPopup
        visible={modalVisible}
        setVisible={setModalVisible}
        title={modalTitle}
      >
        {modalMessage}
      </ModalPopup>
    </>
  );
}

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
}

function FormField({ label, name, type = "text", value, onChange, error, disabled = false }: FormFieldProps) {
  return (
    <div className="flex flex-col">
      <label className="font-medium" htmlFor={name}>
        {label}
      </label>
      <Input
        type={type}
        name={name}
        id={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`bg-gray-700 text-white ${error ? "border-red-500" : "border-gray-600"} border rounded-lg px-3 py-2`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) {
    return { props: {} };
  }
  try {
    const username = context.params?.username as string;
    const user = await prisma.user.findUnique({
      where: {
        username: String(username),
      },
    });
    return {
      props: {
        user: JSON.parse(JSON.stringify(user)),
      },
    };
  } catch (error) {
    console.error("Error fetching user details:", error);
    return { props: { error: "Failed to fetch user details" } };
  }
};