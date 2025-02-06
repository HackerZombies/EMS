// src/components/cards/DocumentsCard.tsx
"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const DocumentsCard: React.FC = () => {
  return (
    <Card draggable className="bg-white dark:bg-gray-800 shadow-lg p-4 rounded-lg ">
      <CardHeader>
        <CardTitle>Documents</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Place your documents content here */}
      </CardContent>
    </Card>
  );
};

export default DocumentsCard;
