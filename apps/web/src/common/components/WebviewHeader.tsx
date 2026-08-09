import ArrowBackIcon from './ArrowBackIcon'

export const WebviewHeader = () => {
  const message = { method: 'CLOSE_WEBVIEW' }

  return (
    <header className={'w-full min-w-full sticky z-10'}>
      <nav className="py-3.5 pr-4 pl-4 lg:px-6">
        <div className="mx-auto flex max-w-screen-xl flex-wrap items-center justify-between">
          <div
            className="flex items-center lg:order-2 cursor-pointer"
            onClick={() => window?.ReactNativeWebView?.postMessage(JSON.stringify(message))}
          >
            <ArrowBackIcon />
          </div>
        </div>
      </nav>
    </header>
  )
}
