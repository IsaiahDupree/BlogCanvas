import { VendorSidebar } from '@/components/vendor/VendorSidebar';

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <VendorSidebar />
      <main className="pl-64 w-full">
        {children}
      </main>
    </div>
  );
}
