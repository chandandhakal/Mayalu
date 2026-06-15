import './globals.css';
import { AppProvider } from '@/lib/contexts';
import { SidebarLayout } from './sidebar-layout';

export const metadata = {
  title: 'AI Call Assistant',
  description: 'Mayalu - AI Call Assistant',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AppProvider>
          <SidebarLayout>{children}</SidebarLayout>
        </AppProvider>
      </body>
    </html>
  );
}
