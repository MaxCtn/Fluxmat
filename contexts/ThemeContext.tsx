'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialiser le thème immédiatement en lisant depuis localStorage (si disponible) ou depuis la classe HTML déjà appliquée
  const getInitialTheme = (): Theme => {
    if (typeof window === 'undefined') return 'light';
    
    // D'abord vérifier si la classe dark est déjà sur le HTML (appliquée par le script inline)
    if (document.documentElement.classList.contains('dark')) {
      return 'dark';
    }
    
    // Sinon, lire depuis localStorage - par défaut mode clair si rien n'est sauvegardé
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme === 'dark') return 'dark';
    
    // Par défaut, toujours démarrer en mode clair lors de la première ouverture
    return 'light';
  };

  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // S'assurer que le thème est bien appliqué même si le script inline a déjà fait le travail
    const currentTheme = getInitialTheme();
    if (currentTheme !== theme) {
      setTheme(currentTheme);
    }
    applyTheme(currentTheme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Mettre à jour le favicon
    let favicon = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = newTheme === 'dark' 
      ? '/images/Logoicosombre.ico' 
      : '/images/logoicoclair.ico';
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    
    // Ajouter une classe d'animation au body et au html
    const body = document.body;
    const html = document.documentElement;
    body.classList.add('theme-transitioning');
    html.classList.add('theme-transitioning');
    
    // Petit délai pour que l'animation soit visible
    setTimeout(() => {
      setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
      applyTheme(newTheme);
    }, 50);
    
    // Retirer la classe après l'animation complète
    setTimeout(() => {
      body.classList.remove('theme-transitioning');
      html.classList.remove('theme-transitioning');
    }, 600);
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Valeur par défaut pour le SSR ou quand le Provider n'est pas disponible
    const defaultTheme: Theme = 'light';
    return {
      theme: typeof window !== 'undefined' 
        ? (localStorage.getItem('theme') as Theme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
        : defaultTheme,
      toggleTheme: () => {}
    };
  }
  return context;
}

