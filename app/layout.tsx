import "./globals.css";
import { ThemeProvider } from "../contexts/ThemeContext";

export const metadata = {
  title: "FluxMat",
  description: "Import → Contrôle → Export + synthèse par exutoire et base Supabase",
  icons: {
    icon: [
      { url: '/images/logoicoclair.ico', media: '(prefers-color-scheme: light)' },
      { url: '/images/Logoicosombre.ico', media: '(prefers-color-scheme: dark)' }
    ]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/images/logoicoclair.ico" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Par défaut, toujours démarrer en mode clair lors de la première ouverture
                  const theme = localStorage.getItem('theme');
                  const shouldUseDark = theme === 'dark'; // Seulement si explicitement défini à 'dark'
                  
                  if (shouldUseDark) {
                    document.documentElement.classList.add('dark');
                    // Mettre à jour le favicon immédiatement
                    const favicon = document.querySelector("link[rel~='icon']") || document.createElement('link');
                    favicon.rel = 'icon';
                    favicon.href = '/images/Logoicosombre.ico';
                    if (!document.querySelector("link[rel~='icon']")) {
                      document.head.appendChild(favicon);
                    }
                  }
                } catch (e) {
                  console.error('Erreur initialisation thème:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning={true}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
