export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-full flex-col items-center justify-center px-4 py-12"
      data-testid="public-layout"
    >
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
