import Head from "next/head";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]";
import { useSession } from "next-auth/react";
import { User } from "@prisma/client";
import GreenButton from "@/components/GreenButton";
import UserList from "@/components/UserList";
import Input from "@/components/Input";
import { SetStateAction, useState } from "react";

type Props = {
  users: User[];
};

export default function ManageUsers({ users }: Props) {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const [query, setQuery] = useState("");

  return (
    <>
      <Head>
        <title>EMS - Manage Users</title>
      </Head>
      <div className="flex grow flex-col gap-5 p-5 bg-black bg-opacity-50 opacity-80 rounded-2xl text-white">
        <div className="flex justify-between">
          <h1 className="text-3xl font-semibold py--2 px-2">Manage Employees</h1>
          {userRole === "ADMIN" && (
            <Link scroll={false} href="/add-New-Employee">
              <GreenButton>Add Employee</GreenButton>
            </Link>
          )}
        </div>
        <Input
          placeholder="Search for users..."
          onChange={(e: { target: { value: SetStateAction<string> } }) =>
            setQuery(e.target.value)
          }
        />
        <UserList users={users} query={query} />
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session || (session.user?.role !== "HR" && session.user?.role !== "ADMIN")) {
    return {
      redirect: {
        destination: "/unauthorized", // Redirect to an unauthorized page or login
        permanent: false,
      },
    };
  }

  const users = await prisma.user.findMany();

  return { props: { users } };
};
