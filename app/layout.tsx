// Every page of the site is the static app in public/; this layout exists only because Next.js requires one.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
