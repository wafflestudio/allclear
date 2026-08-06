import Head from 'next/head'
import dynamic from 'next/dynamic'

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
