// web/app/layout.jsx
import './globals.css';

export const metadata = {
  title: 'Trademark Clearance Bot',
  description: 'Search trademarks across US, CA, EU, UK, and WIPO'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
