import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { COOKIE_NAME } from "@/lib/auth";
import Header from "@/components/layout/Header";

export default async function FamilleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) redirect("/");

  const member = await prisma.member.findUnique({ where: { token } });
  if (!member) redirect("/");
  if (!member.isAdmin) redirect("/recettes");

  return (
    <div className="min-h-screen">
      <Header memberName={member.name} isAdmin={member.isAdmin} />
      <main className="max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
