import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      <main className="lg:ml-[72px] min-h-screen p-4 pt-16 lg:pt-8 lg:p-8">
        {children}
      </main>
    </>
  );
}
