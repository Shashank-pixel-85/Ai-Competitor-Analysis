import './globals.css';

export const metadata = {
  title: 'AI Competitor Analysis',
  description: 'AI-powered website comparison tool',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
