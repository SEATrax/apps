import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/providers';
import { Header } from '@/components/header';
import { appConfig } from '@/config';

export const metadata: Metadata = {
  title: {
    default: appConfig.name,
    template: `%s | ${appConfig.name}`,
  },
  description: appConfig.description,
  keywords: [
    'shipping',
    'invoice',
    'funding',
    'blockchain',
    'NFT',
    'DeFi',
    'trade finance',
    'export',
    'Lisk',
  ],
  authors: [{ name: 'SEATrax' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: appConfig.name,
    title: appConfig.name,
    description: appConfig.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: appConfig.name,
    description: appConfig.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <Providers>
          <div className="relative min-h-screen flex flex-col">
            {/* Background gradient */}
            <div className="fixed inset-0 -z-10 bg-background">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
            </div>
            
            <Header />
            
            <main className="flex-1">
              {children}
            </main>
            
            {/* Footer */}
            <footer className="border-t py-6">
              <div className="container mx-auto px-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-sm text-muted-foreground">
                    © {new Date().getFullYear()} {appConfig.name}. All rights reserved.
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <a href="#" className="hover:text-foreground transition-colors">
                      Terms
                    </a>
                    <a href="#" className="hover:text-foreground transition-colors">
                      Privacy
                    </a>
                    <a href="#" className="hover:text-foreground transition-colors">
                      Docs
                    </a>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
