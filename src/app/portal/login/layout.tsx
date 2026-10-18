export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 -ml-64 lg:ml-0">
      {children}
    </div>
  );
}

