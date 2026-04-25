import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import ProjectCreationForm from "./project-client";

export default async function NewProjectPage() {
  const session = await getSession();

  if (!session) {
    redirect("/app/billing");
  }

  const hasPaidAccess =
    session.role === "admin" ||
    session.role === "user";

  if (!hasPaidAccess) {
    redirect("/app/billing");
  }

  return <ProjectCreationForm />;
}
