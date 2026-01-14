export default function PortalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Add left padding for sidebar on portal routes (except login)
    return (
        <div className="lg:pl-64 w-full">
            {children}
        </div>
    )
}
