// src/components/cards/LeaveCard.tsx
"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const LeaveCard: React.FC = () => {
  return (
    <Card draggable className="bg-white dark:bg-gray-800 shadow-lg p-4 rounded-lg ">
      <CardHeader>
        <CardTitle>Leave</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Place your leave content here */}
      </CardContent>
    </Card>
  );
};

export default LeaveCard;
