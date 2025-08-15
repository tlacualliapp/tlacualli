import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'Tlacualli',
  description: 'Restaurant Management System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
        >
            <div className="relative min-h-screen w-full bg-background">
                <div 
                    className="absolute inset-0 bg-cover bg-center opacity-10" 
                    style={{backgroundImage: "url('/assets/background.png')"}}
                    data-ai-hint="chef preparing food"
                ></div>
                <div className="relative z-10">
                    {children}
                </div>
            </div>
            <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
