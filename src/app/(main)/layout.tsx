import { TopNav } from "@/components/top-nav";
import { getCurrentStore } from "@/server/store";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const store = await getCurrentStore();

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-[var(--background)]">
      <TopNav storeName={store.name} />
      <main className="flex-1 mx-auto w-full max-w-[1400px] px-3 sm:px-6 py-4 sm:py-6">
        {children}
      </main>
    </div>
  );
}
