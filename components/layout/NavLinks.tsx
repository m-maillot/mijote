"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinksProps {
  isAdmin: boolean;
}

const icons = {
  recipes: (
    <path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3zM5 17a3 3 0 013-3h11" />
  ),
  add: <path d="M12 5v14M5 12h14" />,
  family: (
    <>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M3 20c0-3.5 2.5-6 6-6s6 2.5 6 6M15 14.5c3 0 6 1.5 6 5.5" />
    </>
  ),
};

export default function NavLinks({ isAdmin }: NavLinksProps) {
  const pathname = usePathname();

  const items = [
    {
      href: "/recettes",
      label: "Recettes",
      icon: icons.recipes,
      active:
        pathname === "/recettes" ||
        (pathname.startsWith("/recettes/") && pathname !== "/recettes/nouveau"),
    },
    {
      href: "/recettes/nouveau",
      label: "Ajouter",
      icon: icons.add,
      active: pathname === "/recettes/nouveau",
    },
    ...(isAdmin
      ? [
          {
            href: "/famille",
            label: "Famille",
            icon: icons.family,
            active: pathname.startsWith("/famille"),
          },
        ]
      : []),
  ];

  return (
    <>
      {/* Bureau : liens dans l'en-tête */}
      <nav aria-label="Navigation principale" className="hidden items-center gap-6 font-medium md:flex">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className={`border-b-2 py-1 transition-colors hover:text-danger ${
              item.active ? "border-danger text-ink" : "border-transparent text-muted"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Mobile : barre d'onglets en bas, à portée du pouce */}
      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-50 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium ${
              item.active ? "text-danger" : "text-muted"
            }`}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {item.icon}
            </svg>
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
