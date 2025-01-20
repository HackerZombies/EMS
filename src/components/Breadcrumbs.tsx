// components/Breadcrumbs.tsx
"use client"; 

import { useRouter } from "next/router";
import Link from "next/link";
import { Icon } from "@iconify/react";
import capitalize from 'lodash/capitalize'; // Or 'underscore'

const generateBreadcrumbs = (pathname: string) => {
  const pathSegments = pathname.split("/").filter(Boolean);
  const breadcrumbs = [];

  breadcrumbs.push({ label: "Home", href: "/" });

  let cumulativePath = "";
  for (const segment of pathSegments) {
    cumulativePath += `/${segment}`;
    const label = capitalize(segment.replace(/[-_]/g, " "));
    breadcrumbs.push({ label, href: cumulativePath });
  }

  return breadcrumbs;
};

const Breadcrumbs = () => {
  const router = useRouter();
  const breadcrumbs = generateBreadcrumbs(router.pathname);

  // Check if the current route is a 404 page
  if (router.pathname === '/404') {
    return null;
  }

  return (
    <nav aria-label="breadcrumb">
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const isHome = breadcrumb.href === '/';

          return (
            <li className="flex items-center" key={breadcrumb.href}>
              {/* Render Link only if it's not the current page and not potentially an empty route */}
              {!isLast ? (
                <Link
                  href={breadcrumb.href}
                  className="text-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                  onClick={(e) => {
                    // Basic check: if clicking leads to the same URL, treat as "back"
                    if (window.location.pathname === breadcrumb.href && !isHome) {
                      e.preventDefault();
                      router.back();
                    }
                  }}
                >
                  {breadcrumb.label}
                </Link>
              ) : (
                <span className="text-gray-300 dark:text-gray-500">{breadcrumb.label}</span>
              )}
              {!isLast && (
                <Icon icon="ph:caret-right" className="w-4 h-4 text-gray-100 mx-1 dark:text-gray-600" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;