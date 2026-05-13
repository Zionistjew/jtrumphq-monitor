import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import ProjectCreationForm from "./project-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewProjectPage() {
  const session = await getSession();

  if (!session) {
    redirect("/app/billing");
  }

  return <ProjectCreationForm />;
}
