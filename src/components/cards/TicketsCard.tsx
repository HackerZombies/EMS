// src/components/cards/TicketsCard.tsx
"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const TicketsCard: React.FC = () => {
  return (
    <Card draggable className="bg-white dark:bg-gray-800 shadow-lg p-4 rounded-lg ">
      <CardHeader>
        <CardTitle>Tickets</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Place your tickets content here */}
      </CardContent>
    </Card>
  );
};

export default TicketsCard;
