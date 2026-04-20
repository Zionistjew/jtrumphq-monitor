export type PlanKey = "starter" | "pro" | "enterprise";

export const PLANS: Record<
  PlanKey,
  {
    label: string;
    priceSol: number;
    entitlementDays: number | null;
  }
> = {
  starter: {
    label: "Starter",
    priceSol: 0.1,
    entitlementDays: 30,
  },
  pro: {
    label: "Pro",
    priceSol: 0.25,
    entitlementDays: 30,
  },
  enterprise: {
    label: "Enterprise",
    priceSol: 1,
    entitlementDays: null,
  },
};

export function isValidPlan(plan: string): plan is PlanKey {
  return plan in PLANS;
}
