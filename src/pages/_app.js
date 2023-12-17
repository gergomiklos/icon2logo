import '@/styles/globals.css'
import Head from 'next/head'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/react';


export default function App({ Component, pageProps }) {
  return (
    <>
      <MetaTags />

      <Component {...pageProps} />

      <Analytics />
    </>

  )
}


const MetaTags = () => {

  const title = "icon2logo - convert any icon to a beautiful logo for free"
  const description = "this is the only logo editor tool you'll ever need. design your favorite logos 1,000x faster and cheaper."
  const url = "https://www.icon2logo.vercel.app"
  const image = `${url}/banner.png`

  return (
    <Head>
      <title>{title}</title>
      <meta
        key="description"
        name="description"
        content={description}
      />
      <meta
        key="image"
        name="image"
        content={image}
      />
      <meta
        property="og:title"
        content={title}  
      />
      <meta
        property="og:description"
        content={description}
      />
      <meta
        property="og:image"
        content={image}
      />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />

      <meta property="twitter:card" content="summary_large_image" />
      <meta
        property="twitter:title"
        content={title}
      />
      <meta property="twitter:url" content={url} />
      <meta
        property="twitter:description"
        content={description}
      />
      <meta
        property="twitter:image"
        content={image}
      />
    </Head>
  )
}
