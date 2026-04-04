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
  wallets: {
    label: string;
    category: string;
    address: string;
    purpose: string;
  }[];
};

export const PROJECTS: ProjectConfig[] = [
  {
    slug: "jtrump",
    name: "JTRUMP",
    symbol: "JTRUMP",
    mint: "DKyc5vo9DyWh9q9XxMPjUcVbKKAnTwL7Gn4k9rTBFCrt",
    description:
      "Public transparency dashboard for JTRUMP with wallet disclosures, alerting, and investor trust signals.",
    theme: {
      primary: "red",
      accent: "zinc",
    },
    wallets: [
      {
        label: "Liquidity Pool",
        category: "liquidity",
        address: "5VVSAwe3tjc9atop9axBouYmvg655vR2TTBrSzX59xhH",
        purpose: "DEX liquidity support",
      },
      {
        label: "Treasury 1",
        category: "treasury",
        address: "F4j7a2D97ARoEzq7cmHQRo6f6g65uEqqJnaRSHDMzt8Z",
        purpose: "Treasury reserve allocation",
      },
      {
        label: "Treasury 2",
        category: "treasury",
        address: "EZfewNuJ6Z27XocUPocFmY726MEcg18U5BQyTZMYaqXg",
        purpose: "Treasury reserve allocation",
      },
      {
        label: "Treasury 3",
        category: "treasury",
        address: "Btq97dtDz5kkrBU8gNqZgUqWnSZKv8Dxtwfi4VmVKfix",
        purpose: "Treasury reserve allocation",
      },
      {
        label: "Treasury 4",
        category: "treasury",
        address: "J2zkT1iBEoryESwzxkcwK9bcFojbDk5k4Sf9G4ZcyPf",
        purpose: "Treasury reserve allocation",
      },
      {
        label: "Dev Wallet",
        category: "dev",
        address: "66ARrnfF4fCfqxhVcuWDhZwjGY6CpjwBZddZECQXYZzE",
        purpose: "Development allocation",
      },
      {
        label: "Community Wallet",
        category: "community",
        address: "Brby6NMSJ8iTFJ17n4QgZrFfvAMBKXdkWWbEyperzxDM",
        purpose: "Community rewards and growth",
      },
    ],
  },
];

export function getProjectBySlug(slug: string) {
  return PROJECTS.find((project) => project.slug === slug) || null;
}
