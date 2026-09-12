export default function LiffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)] flex justify-center">
      <div className="w-full max-w-md px-4 py-6">{children}</div>
    </div>
  );
}
