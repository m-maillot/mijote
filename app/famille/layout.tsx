import { redirect } from "next/navigation";
import { getMemberFromCookie } from "@/lib/auth";
import Header from "@/components/layout/Header";

export default async function FamilleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const member = await getMemberFromCookie();
  if (!member) redirect("/");
  if (!member.isAdmin) redirect("/recettes");

  return (
    <div className="min-h-screen bg-page">
      <Header memberName={member.name} isAdmin={member.isAdmin} />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 md:pb-10">
        {children}
      </main>
    </div>
  );
}
