import dynamic from 'next/dynamic'
import Head from 'next/head'

const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
})

export default function SwaggerDocsPage() {
  return (
    <>
      <Head>
        <title>Allclear API Docs</title>
      </Head>
      <SwaggerUI url="/api/swagger-json" docExpansion="list" defaultModelsExpandDepth={-1} />
    </>
  )
}
