export const PRICING = {
  starter: {
    label: "Starter",
    sol: 0.2,
    usd: 29,
  },
  pro: {
    label: "Pro",
    sol: 0.7,
    usd: 99,
  },
  enterprise: {
    label: "Enterprise",
    sol: 3.5,
    usd: 499,
  },
} as const;

export type PlanKey = keyof typeof PRICING;
