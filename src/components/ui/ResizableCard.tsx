// src/components/ui/ResizableCard.tsx
"use client";

import React from "react";
import { Resizable } from "re-resizable";

interface ResizableCardProps {
  children: React.ReactNode;
  defaultWidth?: number;
  defaultHeight?: number;
}

const ResizableCard: React.FC<ResizableCardProps> = ({
  children,
  defaultWidth = 300,
  defaultHeight = 200,
}) => {
  return (
    <Resizable
      defaultSize={{
        width: defaultWidth,
        height: defaultHeight,
      }}
      minWidth={200}
      minHeight={150}
      // Enable resizing from all directions:
      enable={{
        top: true,
        right: true,
        bottom: true,
        left: true,
        topRight: true,
        bottomRight: true,
        bottomLeft: true,
        topLeft: true,
      }}
      className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden"
    >
      {children}
    </Resizable>
  );
};

export default ResizableCard;
