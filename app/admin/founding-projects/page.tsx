import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Application = {
  id: string;
  project_name: string;
  token_symbol: string | null;
  website: string | null;
  x_account: string | null;
  telegram: string | null;
  founder_name: string;
  founder_email: string;
  project_description: string | null;
  why_selected: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
};

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function updateApplicationStatus(formData: FormData) {
  "use server";

  const adminSession = cookies().get("admin_session")?.value;

  if (adminSession !== "authenticated") {
    redirect("/admin/login?next=/admin/founding-projects");
  }

  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "pending");
  const admin_notes = String(formData.get("admin_notes") || "");

  if (!id) return;

  const supabase = getSupabaseAdmin();

  await supabase
    .from("founding_project_applications")
    .update({
      status,
      admin_notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/admin/founding-projects");
}

export default async function AdminFoundingProjectsPage() {
  const adminSession = cookies().get("admin_session")?.value;

  if (adminSession !== "authenticated") {
    redirect("/admin/login?next=/admin/founding-projects");
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("founding_project_applications")
    .select("*")
    .order("created_at", { ascending: false });

  const applications = (data || []) as Application[];

  return (
    <main className="min-h-screen bg-[#050816] px-6 py-8 text-white">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.3em] text-cyan-300">
              WEB3MB ADMIN
            </p>
            <h1 className="mt-2 text-3xl font-black">
              Founding Project Applications
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Review applications for the first 5 WEB3MB Founding Projects.
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-3 text-sm text-cyan-100">
            Contact email: founder@web3mb.com
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-300/30 bg-red-300/10 p-4 text-sm text-red-200">
            Could not load applications.
          </div>
        ) : null}

        <div className="grid gap-5">
          {applications.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center text-zinc-400">
              No founding project applications yet.
            </div>
          ) : (
            applications.map((app) => (
              <article
                key={app.id}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-bold">{app.project_name}</h2>

                      <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs uppercase text-zinc-300">
                        {app.status}
                      </span>

                      {app.token_symbol ? (
                        <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-200">
                          ${app.token_symbol}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-2 text-sm text-zinc-400">
                      Founder: {app.founder_name} · {app.founder_email}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      Submitted: {new Date(app.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 text-sm">
                    {app.website ? (
                      <a
                        href={app.website}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-white/10 px-3 py-2 text-zinc-200 hover:border-cyan-300 hover:text-cyan-200"
                      >
                        Website
                      </a>
                    ) : null}

                    {app.x_account ? (
                      <a
                        href={app.x_account}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-white/10 px-3 py-2 text-zinc-200 hover:border-cyan-300 hover:text-cyan-200"
                      >
                        X
                      </a>
                    ) : null}

                    {app.telegram ? (
                      <a
                        href={app.telegram}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-white/10 px-3 py-2 text-zinc-200 hover:border-cyan-300 hover:text-cyan-200"
                      >
                        Telegram
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                      Project Description
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-300">
                      {app.project_description || "No description provided."}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                      Why Selected
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-300">
                      {app.why_selected || "No explanation provided."}
                    </p>
                  </div>
                </div>

                <form
                  action={updateApplicationStatus}
                  className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-black/30 p-4 md:grid-cols-[180px_1fr_auto]"
                >
                  <input type="hidden" name="id" value={app.id} />

                  <select
                    name="status"
                    defaultValue={app.status}
                    className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="contacted">Contacted</option>
                  </select>

                  <input
                    name="admin_notes"
                    defaultValue={app.admin_notes || ""}
                    placeholder="Admin notes"
                    className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none"
                  />

                  <button
                    type="submit"
                    className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-black hover:bg-cyan-300"
                  >
                    Save
                  </button>
                </form>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
