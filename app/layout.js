import './globals.css'

export const metadata = {
  title: 'Voidboard - Canvas Whiteboard',
  description: 'A lightweight, canvas-first whiteboard clone for drawing and collaboration',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
