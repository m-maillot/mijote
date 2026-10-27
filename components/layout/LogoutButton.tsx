export default function LogoutButton() {
  return (
    <form action="/api/auth/logout" method="post">
      <button
        type="submit"
        className="min-h-11 px-2 text-sm text-muted underline transition-colors hover:text-ink"
      >
        Déconnexion
      </button>
    </form>
  );
}
