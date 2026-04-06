import Sidebar from "@/components/Sidebar";
import NextTopLoader from "nextjs-toploader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NextTopLoader color="#7EC843" height={3} showSpinner={false} />
      <Sidebar />
      <main className="lg:ml-[72px] min-h-screen p-4 pt-16 lg:pt-8 lg:p-8">
        {children}
      </main>
    </>
  );
}
