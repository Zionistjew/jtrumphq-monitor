export type OfficialWallet = {
  label: string;
  category: string;
  address: string;
  purpose: string;
};

/**
 * Compatibility exports for older transparency routes that still import
 * JTRUMP_MINT and OFFICIAL_WALLETS.
 *
 * Your newer multi-project pages should use project.mint and project.wallets
 * from the database instead of these constants.
 */
export const JTRUMP_MINT = "DKyc5vo9DyWh9q9XxMPjUcVbKKAnTwL7Gn4k9rTBFCrt";

export const OFFICIAL_WALLETS: OfficialWallet[] = [
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
    category: "development",
    address: "66ARrnfF4fCfqxhVcuWDhZwjGY6CpjwBZddZECQXYZzE",
    purpose: "Development allocation",
  },
  {
    label: "Community Wallet",
    category: "community",
    address: "Brby6NMSJ8iTFJ17n4QgZrFfvAMBKXdkWWbEyperzxDM",
    purpose: "Community rewards and growth",
  },
];

/**
 * Legacy aliases kept only so older code keeps compiling.
 * New multi-project code should not rely on these.
 */
export const LEGACY_DEFAULT_MINT = JTRUMP_MINT;
export const LEGACY_DEFAULT_WALLETS = OFFICIAL_WALLETS;
