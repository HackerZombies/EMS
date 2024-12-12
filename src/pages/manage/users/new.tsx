import Head from "next/head";
import axios from "axios";
import { SetStateAction, useState } from "react";
import { useRouter } from "next/router";
import { Eye, EyeOff } from 'lucide-react';
import BackButton from "@/components/BackButton";
import Input from "@/components/Input";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import { validateForm } from "@/lib/formValidation";

interface FormData {
  firstName: string;
  lastName: string;
  password: string;
  email: string;
  phoneNumber: string;
  dob: string;
  address: string;
  qualifications: string;
  department: string;
  position: string;
  role: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function CreateUser () {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    password: "",
    email: "",
    phoneNumber: "",
    dob: "",
    address: "",
    qualifications: "",
    department: "",
    position: "",
    role: "EMPLOYEE",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState(<></>);
  const [closeButton, setCloseButton] = useState(true);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleCreate = async () => {
    const validationErrors = validateForm(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      try {
        const response = await axios.post("/api/users/newUser ", formData);
        if (response.status === 200) {
          setTitle("User  created");
          setMessage(
            <div className="flex flex-col gap-3 text-center">
              <p className="text-green-500 text-lg">
                User was created successfully. Their User ID is{" "}
                <b>{response.data.username}</b>.
              </p>
              <Button onClick={() => router.push("/manage/users")} className="bg-blue-500 text-white px-4 py-2 rounded">
                OK
              </Button>
            </div>
          );
          setCloseButton(false);
          setVisible(true);
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          const data = error.response?.data;
          if (status === 409) {
            setTitle("Error");
            setMessage(
              <div className="text-center">
                <p className="text-red-500 text-lg">{data.message}</p>
              </div>
            );
          } else {
            setTitle("Error");
            setMessage(
              <div className="text-center">
                <p className="text-red-500 text-lg">
                  { data?.message || "An unexpected error occurred."}
                </p>
              </div>
            );
          }
          setCloseButton(true);
          setVisible(true);
        } else {
          console.error("Error creating user:", error);
          setTitle("Error");
          setMessage(
            <div className="text-center">
              <p className="text-red-500 text-lg">An unexpected error occurred. Please try again.</p>
            </div>
          );
          setCloseButton(true);
          setVisible(true);
        }
      }
    }
  };

  return (
    <>
      <Head>
        <title>EMS - Add User</title>
      </Head>
      <div className="flex flex-col gap-3 p-5">
        <BackButton />
        <div className="flex justify-between">
          <h1 className="text-4xl font-bold">Add User</h1>
        </div>
        <div className="flex flex-col gap-3 rounded-2xl bg-gray-800 bg-opacity-80 p-5 text-white shadow-lg">
          <FormField label="First Name" name="firstName" value={formData.firstName} onChange={handleInputChange} error={errors.firstName} />
          <FormField label="Last Name" name="lastName" value={formData.lastName} onChange={handleInputChange} error={errors.lastName} />
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
                className={`bg-gray-700 text-white ${errors.password ? "border-red-500" : "border-gray-600"} border rounded-lg px-3 py-2`}
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
          <FormField label="Address" name="address" value={formData.address} onChange={handleInputChange} error={errors.address} />
          <FormField label="Qualifications" name="qualifications" value={formData.qualifications} onChange={handleInputChange} error={errors.qualifications} />
          <FormField label="Department" name="department" value={formData.department} onChange={handleInputChange} error={errors.department} />
          <FormField label="Position" name="position" value={formData.position} onChange={handleInputChange} error={errors.position} />
          <div className="flex flex-col">
            <label className="font-medium" htmlFor="role">
              Choose User Role:
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="rounded-lg bg-gray-700 text-white border border-gray-600 px-3 py-2 transition hover:bg-opacity-70"
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="HR">HR Employee</option>
              <option value="TECHNICIAN">Technician</option>
            </select>
          </div>
          <div className="flex w-full justify-end">
            <Button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg transition hover:bg-blue-500">
              Submit
            </Button>
          </div>
        </div>
      </div>
      <Modal
  visible={visible}
  onClose={() => setVisible(false)} // Use onClose instead of setVisible
  title={title}
  closeButton={closeButton}
>
  {message}
</Modal>
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
}

function FormField({ label, name, type = "text", value, onChange, error }: FormFieldProps) {
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
        className={`bg-gray-700 text-white ${error ? "border-red-500" : "border-gray-600"} border rounded-lg px-3 py-2`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}