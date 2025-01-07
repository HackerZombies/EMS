import { useState, useCallback } from "react";
import type { NavCategoryType } from "@/types/nav";

export function useToggleCategory(navItems: NavCategoryType[]) {
  // Initialize state based on categories
  const initialCollapsed: { [key: string]: boolean } = {};
  navItems.forEach((cat) => {
    initialCollapsed[cat.category] = false;
  });

  const [categoryCollapsed, setCategoryCollapsed] = useState(initialCollapsed);

  const toggleCategory = useCallback((categoryName: string) => {
    setCategoryCollapsed((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  }, []);

  return { categoryCollapsed, toggleCategory };
}
