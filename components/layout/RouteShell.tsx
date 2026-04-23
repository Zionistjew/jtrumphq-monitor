import type { ReactNode } from "react";

type RouteShellProps = {
  children: ReactNode;
};

export default function RouteShell({ children }: RouteShellProps) {
  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <main>{children}</main>
    </div>
  );
}
