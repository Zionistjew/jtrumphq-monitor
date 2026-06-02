"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-bold text-black shadow hover:bg-cyan-400 print:hidden"
    >
      Download / Print PDF Report
    </button>
  );
}
