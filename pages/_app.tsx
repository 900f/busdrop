import type { AppProps } from 'next/app'
import '@/styles/globals.css'
import Navbar from '@/components/Navbar'
import CookiePopup from '@/components/CookiePopup'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Navbar />
      <Component {...pageProps} />
      <CookiePopup />
    </>
  )
}
