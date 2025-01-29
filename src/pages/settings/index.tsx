import Head from "next/head";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { User } from "@prisma/client";
import { useRouter } from "next/router";
import { GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";
import { prisma } from "@/lib/prisma";
import {
  FaUserEdit,
  FaSignOutAlt,
  FaIdBadge,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaBriefcase,
  FaBuilding,
  FaTrash,
} from "react-icons/fa";
import { useState } from "react";
import axios from "axios";

type Role = "EMPLOYEE" | "HR" | "ADMIN"; 

const renderRoleLabel = (role: Role): string => {
  const roleLabels: { [key in Role]: string } = {
    EMPLOYEE: "Employee",
    HR: "HR Professional",
    ADMIN: "Admin",
  };
  return roleLabels[role] || role;
};

type ProfileDetailCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
};

const ProfileDetailCard: React.FC<ProfileDetailCardProps> = ({ icon, label, value }) => {
  return (
    <div className="flex items-center bg-dark-secondary p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="p-3 bg-gray-800 rounded-full mr-4">{icon}</div>
      <div>
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-md font-medium text-white">{value}</p>
      </div>
    </div>
  );
};

type Props = {
  user: User;
};

export default function Settings({ user }: Props) {
  const router = useRouter();
  const [profileImage, setProfileImage] = useState(
    user.avatarImageUrl || user.profileImageUrl || "/default-avatar.png"
  );

  const handleSignOut = async () => {
    const data = await signOut({ redirect: false, callbackUrl: "/" });
    router.push(data.url);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await axios.post("/api/users/updateProfileImage", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const updatedUser = response.data.user;
      setProfileImage(updatedUser.avatarImageUrl || "/default-avatar.png");
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const handleImageDelete = async () => {
    const formData = new FormData();
    formData.append("avatarImageUrl", "");
    try {
      const response = await axios.post("/api/users/updateProfileImage", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const updatedUser = response.data.user;
      setProfileImage(updatedUser.avatarImageUrl || "/default-avatar.png");
    } catch (error) {
      console.error("Error deleting profile image:", error);
    }
  };

  return (
    <div className="min-h-screen bg-dark-primary">
      <Head>
        <title>Profile Settings | EMS</title>
      </Head>

      <main className="max-w-4xl mx-auto p-8">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-indigo-700 to-purple-700 rounded-lg p-6 relative">
          <div className="absolute top-4 right-4 space-x-4">
            <button
              onClick={() => router.push("/settings/edit")}
              className="text-white hover:text-gray-300"
              title="Edit Profile"
            >
              <FaUserEdit size={20} />
            </button>
            <button
              onClick={handleSignOut}
              className="text-white hover:text-gray-300"
              title="Sign Out"
            >
              <FaSignOutAlt size={20} />
            </button>
          </div>

          <div className="flex items-center space-x-6">
            <div className="relative w-32 h-32">
            <Image
    src={profileImage}
    alt="Profile Avatar"
    fill
    className="rounded-full border-4 border-white object-cover"
    style={{
      objectFit: 'cover',
      objectPosition: 'center', // Ensures the center of the image is visible
    }}
    priority
  />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded-full">
                <label className="cursor-pointer text-white bg-green-500 p-2 rounded-full hover:bg-green-600">
                  <input type="file" className="hidden" onChange={handleImageUpload} />
                  <FaUserEdit />
                </label>
                <button
                  onClick={handleImageDelete}
                  className="text-white bg-red-500 p-2 rounded-full hover:bg-red-600"
                  title="Delete Profile Image"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
            <div className="text-white">
              <h1 className="text-3xl font-semibold">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-lg text-gray-200">{renderRoleLabel(user.role as Role)}</p>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfileDetailCard
            icon={<FaIdBadge className="text-blue-500" />}
            label="User ID"
            value={user.username}
          />
          <ProfileDetailCard
            icon={<FaEnvelope className="text-green-500" />}
            label="Email"
            value={user.email}
          />
          <ProfileDetailCard
            icon={<FaPhone className="text-purple-500" />}
            label="Phone Number"
            value={user.phoneNumber}
          />
          <ProfileDetailCard
            icon={<FaCalendarAlt className="text-yellow-500" />}
            label="Account Created"
            value={new Date(user.dateCreated).toLocaleDateString()}
          />
          <ProfileDetailCard
            icon={<FaBuilding className="text-red-500" />}
            label="Department"
            value={user.department || "Not Specified"}
          />
          <ProfileDetailCard
            icon={<FaBriefcase className="text-orange-500" />}
            label="Position"
            value={user.position || "Not Specified"}
          />
        </div>
      </main>
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  const user = await prisma.user.findUnique({
    where: { username: session.user?.username },
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
