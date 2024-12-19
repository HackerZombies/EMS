import Head from "next/head";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { User } from "@prisma/client";
import { useRouter } from "next/router";
import { GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";
import prisma from "@/lib/prisma";
import { 
  FaUserEdit, 
  FaSignOutAlt, 
  FaIdBadge, 
  FaEnvelope, 
  FaPhone, 
  FaCalendarAlt, 
  FaBriefcase, 
  FaBuilding 
} from "react-icons/fa";

type Props = {
  user: User;
};

export default function Settings({ user }: Props) {
  const router = useRouter();

  const handleSignOut = async () => {
    const data = await signOut({ redirect: false, callbackUrl: "/" });
    router.push(data.url);
  };

  const renderRoleLabel = (role: string) => {
    const roleLabels: { [key: string]: string } = {
      "EMPLOYEE": "Employee",
      "HR": "HR Professional",
      "TECHNICIAN": "Technician",
    };
    return roleLabels[role] || role;
  };

  return (
    <div className="rounded-lg min-h-screen bg-gradient-to-br from-gray-900 to-black bg-opacity-20 py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Profile Settings | EMS</title>
      </Head>

      <div className="max-w-4xl mx-auto bg-black bg-opacity-20 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden">
        {/* Profile Header */}
        <div className="relative p-8">
          <div className="absolute top-4 right-4 flex space-x-3">
            <button 
              onClick={() => router.push("/settings/edit")}
              className="bg-teal-600 bg-opacity-10 text-white p-2 rounded-full"
              title="Edit Profile"
            >
              <FaUserEdit className="text-2xl" />
            </button>
            <button 
              onClick={handleSignOut}
              className=" text-white p-2 rounded-full"
              title="Sign Out"
            >
              <FaSignOutAlt className="text-2xl" />
            </button>
          </div>

          <div className="flex items-center space-x-6 mb-6">
            <div className="w-32 h-32 relative">
            <Image 
  src="/default-avatar.png" 
  alt="Default Avatar" 
  fill 
  sizes="(max-width: 768px) 100vw, 50vw"
  className="rounded-full border-4 border-green-600 hover:border-green-500"
  style={{ objectFit: 'cover' }} // Use style for objectFit
  priority // Add this line to indicate high priority
/>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-xl text-gray-300">
                {renderRoleLabel(user.role)}
              </p>
            </div>
          </div>

          {/* Profile Details Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            <ProfileDetailCard 
              icon={<FaIdBadge className="text-teal-600" />}
              label="User  ID"
              value={user.username}
            />
            <ProfileDetailCard 
              icon={<FaEnvelope className="text-green-600" />}
              label="Email"
              value={user.email}
            />
            <ProfileDetailCard 
              icon={<FaPhone className="text-teal-400" />}
              label="Phone Number"
              value={user.phoneNumber}
            />
            <ProfileDetailCard 
              icon={<FaCalendarAlt className="text-yellow-600" />}
              label="Account Created"
              value={new Date(user.dateCreated).toLocaleDateString()}
            />
            <ProfileDetailCard 
              icon={<FaBuilding className="text-red-600" />}
              label="Department"
              value={user.department || "Not Specified"}
            />
            <ProfileDetailCard 
              icon={<FaBriefcase className="text-orange-600" />}
              label="Position"
              value={user.position || "Not Specified"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Profile Detail Card Component
const ProfileDetailCard = ({ 
  icon, 
  label, 
  value 
}: { 
  icon: React.ReactNode, 
  label: string, 
  value: string 
}) => {
  return (
    <div className="bg-gray-800 bg-opacity-60 p-4 rounded-xl flex items-center space-x-4">
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-lg font-semibold text-white">{value}</p>
      </div>
    </div>
  );
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/login',
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
        destination: '/login',
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