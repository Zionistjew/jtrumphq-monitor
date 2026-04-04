export const dynamic = "force-dynamic";

import { saveProject, getProjects } from "@/lib/projectStore";

export async function GET() {
  const projects = getProjects();

  return Response.json({
    ok: true,
    projects,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.slug || !body.name || !body.mint) {
      return Response.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    saveProject(body);

    return Response.json({
      ok: true,
      message: "Project created",
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: "Failed to create project" },
      { status: 500 }
    );
  }
}
