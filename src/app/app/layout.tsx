export default function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Sidebar is now handled globally in root layout.tsx
    // This layout just wraps the content
    return (
        <div className="w-full">
            {children}
        </div>
    )
}
