import Link from "next/link";
import NavLinks from "./NavLinks";
import Avatar from "@/components/ui/Avatar";
import LogoutButton from "./LogoutButton";
import { memberInk } from "@/lib/memberInk";

interface HeaderProps {
  memberName: string;
  isAdmin: boolean;
}

export default function Header({ memberName, isAdmin }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-page/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/recettes" className="font-heading text-xl font-semibold text-danger sm:text-3xl">
          Ludlow Family&apos;s Cookbook
        </Link>
        <div className="flex items-center gap-6">
          <NavLinks isAdmin={isAdmin} />
          <span className="flex items-center gap-2 font-medium" style={{ color: memberInk(memberName) }}>
            <Avatar name={memberName} size={36} />
            <span className="hidden sm:inline">{memberName}</span>
          </span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
