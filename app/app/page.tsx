import Link from "next/link";

export default function AppHome() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">WEB3MB User Dashboard</h1>

      <p className="mt-4">Login successful. Auth is working.</p>

      <div className="mt-6">
        <Link
          href="href="/app/projects"
          className="rounded bg-white px-4 py-2 text-black font-semibold"
        >
          Create New Project
        </Link>
      </div>
    </main>
  );
}
