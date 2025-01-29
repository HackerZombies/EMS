import Head from "next/head";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import { Ticket } from "@prisma/client";
import TicketList from "@/components/TicketList";
import { useState } from "react";
import { Icon } from "@iconify/react";

type Props = {
  tickets: Ticket[];
};

export default function ManageTickets({ tickets }: Props) {
  const [filter, setFilter] = useState("Unresolved");

  // Filter tickets based on the selected filter
  const filteredTickets =
    filter === ""
      ? tickets
      : tickets.filter((ticket: Ticket) => ticket.status === filter);

  return (
    <>
      <Head>
        <title>EMS - Manage Tickets</title>
      </Head>
      <div className="flex grow flex-col gap-5 pt-4">
        <div className="flex flex-row justify-between gap-2 max-md:flex-col">
          <h1 className="text-4xl font-semibold">Manage Tickets</h1>
          <select
            className="flex items-center justify-between rounded-full bg-white border border-gray-300 shadow-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out px-4 py-3 appearance-none"
            onChange={(e) => setFilter(e.target.value)}
            defaultValue="Unresolved"
          >
            <option value="">All Tickets</option>
            <option value="Unresolved">Unresolved</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
        {tickets.length === 0 ? (
          <div className="flex grow flex-col items-center justify-center gap-2 text-center text-neutral-400">
            <Icon icon="ph:ticket-light" width="8em" />
            <h1 className="text-2xl font-semibold">No tickets</h1>
            <p className="text-neutral-500">Maybe check back later?</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="flex grow flex-col items-center justify-center gap-2 text-center text-neutral-400">
            <Icon icon="ph:funnel-light" width="8em" />
            <h1 className="text-2xl font-semibold">
              No tickets matching filter
            </h1>
            <p className="text-neutral-500">
              Try selecting a different filter in the top right.
            </p>
          </div>
        ) : (
          <TicketList tickets={filteredTickets} />
        )}
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  // Role-based access control
  if (!session || session.user.role !== "HR") {
    return {
      redirect: {
        destination: "/unauthorized",
        permanent: false,
      },
    };
  }

  // Fetch tickets for users with the HR role
  const tickets = await prisma.ticket.findMany();

  return {
    props: { tickets },
  };
};