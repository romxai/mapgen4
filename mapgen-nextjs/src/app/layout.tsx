export const metadata = {
  title: "World Map Generator - Interactive Grid Map",
  description:
    "An interactive world map with a 1000x1000 grid overlay for game world simulation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-100">
        <header className="bg-indigo-700 text-white p-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold">World Map Generator</h1>
            <p className="text-sm opacity-80">
              Interactive world map with procedural generation
            </p>
          </div>
        </header>
        {children}
        <footer className="bg-gray-800 text-white p-4 mt-8">
          <div className="max-w-6xl mx-auto text-center text-sm">
            <p>Based on Mapgen4 by Red Blob Games</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
