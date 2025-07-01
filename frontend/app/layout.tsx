import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Helical App',
  description: 'Upload your cell data and run state-of-the-art models',
  generator: 'Vincent Lefeuve',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}
