import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "projects.json");

export function getProjects() {
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveProject(project: any) {
  const projects = getProjects();

  projects.push(project);

  fs.writeFileSync(filePath, JSON.stringify(projects, null, 2));
}
