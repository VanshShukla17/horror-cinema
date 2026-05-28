import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: 'CineMacabre — Horror Movie Tickets',
  description: 'Face your fears. Book tickets to the most terrifying cinematic experiences ever crafted.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
