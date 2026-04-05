import {
  getProjectBySlugFromStore,
  getProjects as getProjectsFromStore,
} from "./projectStore";

export type ProjectWallet = {
  label: string;
  category: string;
  address: string;
  purpose: string;
};

export type ProjectConfig = {
  slug: string;
  name: string;
  symbol: string;
  mint: string;
  description: string;
  theme: {
    primary: string;
    accent: string;
  };
  wallets: ProjectWallet[];
};

export async function getAllProjects(): Promise<ProjectConfig[]> {
  const projects = await getProjectsFromStore();
  return projects || [];
}

export async function getProjectBySlug(
  slug: string
): Promise<ProjectConfig | null> {
  const project = await getProjectBySlugFromStore(slug);
  return project || null;
}
