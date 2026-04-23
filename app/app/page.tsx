import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

type Project = {
  id:number;
  slug:string;
  name:string;
  symbol:string;
  created_at?:string|null;
};

export default async function AppHome() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("projects")
    .select("id,slug,name,symbol,created_at")
    .order("id",{ascending:false});

  const projects:Project[] = data || [];
  const latest = projects[0];

  return (
<main className="min-h-screen bg-[#050816] text-white">
<div className="mx-auto max-w-7xl px-8 py-10">

<div className="flex items-start justify-between">
<div>
<div className="flex items-center gap-4">
<Image
src="/branding/web3mb-logo.png"
alt="WEB3MB"
width={210}
height={62}
/>

<div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-cyan-300">
Owner Dashboard
</div>
</div>

<h1 className="mt-8 text-6xl font-bold">
Welcome back
</h1>

<p className="mt-6 max-w-4xl text-lg text-zinc-300">
Manage transparency projects, launch new dashboards,
and monitor your WEB3MB portfolio from one central workspace.
</p>
</div>

<div className="flex gap-3">
<Link
href="/app/projects"
className="rounded-2xl border border-white/10 bg-white/[0.04] px-7 py-4 font-semibold"
>
My Projects
</Link>

<Link
href="/app/projects/new"
className="rounded-2xl bg-white px-7 py-4 font-semibold text-black"
>
Create New Project
</Link>
</div>
</div>


<div className="mt-12 grid gap-5 xl:grid-cols-3">

<div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-7">
<div className="text-sm uppercase tracking-[0.24em] text-cyan-300">
Total Projects
</div>

<div className="mt-6 text-5xl font-bold">
{projects.length}
</div>

<Link
href="/app/projects"
className="mt-8 inline-flex rounded-2xl border border-white/10 px-6 py-4"
>
Open Portfolio
</Link>
</div>


<div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-7">
<div className="text-sm uppercase tracking-[0.24em] text-cyan-300">
Latest Project
</div>

<div className="mt-6 text-5xl font-bold">
{latest?.name || "—"}
</div>

{latest && (
<Link
href={`/app/projects/${latest.id}`}
className="mt-8 inline-flex rounded-2xl border border-white/10 px-6 py-4"
>
Open Project Console
</Link>
)}
</div>


<div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-7">
<div className="text-sm uppercase tracking-[0.24em] text-cyan-300">
Public Dashboards
</div>

<div className="mt-6 text-5xl font-bold">
{projects.length}
</div>

<Link
href="/transparency"
className="mt-8 inline-flex rounded-2xl border border-white/10 px-6 py-4"
>
Review Dashboards
</Link>
</div>

</div>



<div className="mt-10 grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">

<div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">

<h2 className="text-4xl font-bold">
Recent Projects
</h2>

<div className="mt-10 space-y-4">

{projects.slice(0,5).map((project)=>(
<div
key={project.id}
className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6"
>

<div className="flex items-center justify-between">

<div>
<div className="text-sm uppercase tracking-[0.24em] text-cyan-300">
{project.symbol}
</div>

<div className="mt-3 text-4xl font-bold">
{project.name}
</div>

<div className="mt-3 text-zinc-400">
/token/{project.slug}
</div>
</div>


<div className="flex gap-3">

<Link
href={`/app/projects/${project.id}`}
className="rounded-2xl border border-white/10 px-5 py-3 font-semibold"
>
Open Project Console
</Link>

<Link
href={`/token/${project.slug}`}
className="rounded-2xl bg-white px-5 py-3 font-semibold text-black"
>
Public View
</Link>

</div>

</div>
</div>
))}

</div>
</div>



<div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">

<h2 className="text-4xl font-bold">
Quick Actions
</h2>

<div className="mt-10 space-y-4">

<Link
href="/app/projects/new"
className="block rounded-[1.5rem] border border-white/10 p-6"
>
<div className="text-sm uppercase tracking-[0.24em] text-cyan-300">
Create
</div>

<div className="mt-3 text-2xl font-semibold">
Start a new transparency project
</div>
</Link>


<Link
href="/app/projects"
className="block rounded-[1.5rem] border border-white/10 p-6"
>
<div className="text-sm uppercase tracking-[0.24em] text-cyan-300">
Manage
</div>

<div className="mt-3 text-2xl font-semibold">
Review your owner-side projects
</div>
</Link>


{latest && (
<Link
href={`/app/projects/${latest.id}`}
className="block rounded-[1.5rem] border border-white/10 p-6"
>
<div className="text-sm uppercase tracking-[0.24em] text-cyan-300">
Continue
</div>

<div className="mt-3 text-2xl font-semibold">
Open Project Console
</div>
</Link>
)}

</div>
</div>

</div>

</div>
</main>
  );
}
