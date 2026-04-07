export const dynamic = "force-dynamic";

import { saveProject, getProjects } from "@/lib/projectStore";

export async function GET() {
  try {
    const projects = await getProjects();

    return Response.json({
      ok: true,
      projects,
    });
  } catch (error: any) {
    return Response.json(
      {
        ok: false,
        error: error?.message || "Failed to load projects",
      },
      { status: 500 }
    );
  }
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

    const project = await saveProject(body);

    return Response.json({
      ok: true,
      message: "Project created",
      project,
    });
  } catch (error: any) {
    const message = error?.message || "Failed to create project";

    const isDuplicate =
      message.includes("duplicate key value") ||
      message.includes("projects_slug_key");

    return Response.json(
      {
        ok: false,
        error: isDuplicate
          ? "That slug already exists. Please choose a different slug."
          : message,
      },
      { status: isDuplicate ? 409 : 500 }
    );
  }
}
