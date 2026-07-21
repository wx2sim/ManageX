// This layout overrides the parent dashboard layout visually.
// The scanner page is full-screen with no header, nav or padding.
// z-[9999] ensures it covers the parent dashboard Header and FAB.
export default function ScannerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 overflow-hidden bg-black z-[9999]">
      {children}
    </div>
  );
}
