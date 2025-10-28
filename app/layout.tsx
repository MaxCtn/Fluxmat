import "./globals.css";

export const metadata = {
  title: "FluxMat",
  description: "Import → Contrôle → Export + synthèse par exutoire et base Supabase",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body suppressHydrationWarning={true}>{children}</body>
    </html>
  );
}
