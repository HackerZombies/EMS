export type NavItemType = {
    url: string;
    title: string;
    icon: string;
  };
  
  export type NavCategoryType = {
    category: string;
    items: NavItemType[];
    isCollapsed?: boolean;
  };
  