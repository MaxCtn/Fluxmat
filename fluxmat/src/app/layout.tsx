export const metadata = {
    title: 'FluxMat',
    description: 'Passerelle Excel → Stockage / Analyse',
  }
  
  export default function RootLayout({
    children,
  }: { children: React.ReactNode }) {
    return (
      <html lang="fr">
        <body className="min-h-dvh bg-zinc-50 text-zinc-900">
          {children}
        </body>
      </html>
    )
  }
  