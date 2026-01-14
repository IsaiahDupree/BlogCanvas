import { SidebarProvider } from "@/contexts/sidebar-context";
import { GlobalSidebar } from "@/components/layout/GlobalSidebar";

export default function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <SidebarProvider>
            <GlobalSidebar />
            <main className="lg:pl-64 w-full transition-all duration-300 min-h-screen">
                {children}
            </main>
        </SidebarProvider>
    )
}
