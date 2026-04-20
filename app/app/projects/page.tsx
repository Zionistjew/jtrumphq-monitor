"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Project = {
  id: number;
  name: string;
  slug: string;
  symbol: string;
  created_at?: string;
};

export default function ProjectsPage() {
  const supabase = createClient();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProjects() {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("You are not logged in.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("projects")
        .select("id, name, slug, symbol, created_at")
        .eq("user_id", user.id)
        .order("id", { ascending: false });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setProjects(data || []);
      setLoading(false);
    }

    loadProjects();
  }, [supabase]);

  return (
    <main className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Projects</h1>

        <Link
          href="/app/projects/new"
          className="rounded bg-white px-4 py-2 font-semibold text-black"
        >
          New Project
        </Link>
      </div>

      {loading ? (
        <p>Loading projects...</p>
      ) : error ? (
        <p className="text-red-500">Failed to load projects: {error}</p>
      ) : projects.length ? (
        <div className="space-y-4">
          {projects.map((project) => (
            <div key={project.id} className="rounded border p-4">
              <div className="text-xl font-semibold">{project.name}</div>

              <div className="mt-2">Symbol: {project.symbol}</div>
              <div>Slug: {project.slug}</div>

              <div className="mt-4 flex gap-4">
                <Link href={`/token/${project.slug}`} className="underline">
                  View Public Page
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No projects yet.</p>
      )}
    </main>
  );
}
