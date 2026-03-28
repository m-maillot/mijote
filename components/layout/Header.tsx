import Link from "next/link";

interface HeaderProps {
  memberName: string;
  isAdmin: boolean;
}

export default function Header({ memberName, isAdmin }: HeaderProps) {
  return (
    <header className="bg-white/60 border-b border-cream-dark sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/recettes" className="font-[family-name:var(--font-hand)] text-3xl text-brown hover:text-brown-light transition-colors">
          Carnet de Recettes
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/recettes" className="text-brown-light hover:text-brown transition-colors">
            Recettes
          </Link>
          <Link href="/recettes/nouveau" className="text-brown-light hover:text-brown transition-colors">
            + Ajouter
          </Link>
          {isAdmin && (
            <Link href="/famille" className="text-brown-light hover:text-brown transition-colors">
              Famille
            </Link>
          )}
          <span className="font-[family-name:var(--font-hand)] text-lg text-brown ml-2">
            {memberName}
          </span>
        </nav>
      </div>
    </header>
  );
}
