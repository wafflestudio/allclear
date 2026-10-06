import React from 'react'
import { APP_STORE_URL, GOOGLE_PLAY_URL, type MobilePlatform } from '../constants/appStores'

type Props = {
  highlightedPlatform?: MobilePlatform
}

const getStoreLinkClassName = (highlighted: boolean) =>
  [
    'inline-flex min-h-14 w-full items-center justify-center rounded-lg bg-gray-900 px-4 py-3 text-left text-white transition-colors hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-300 sm:w-auto',
    highlighted ? 'ring-4 ring-primary-200' : '',
  ]
    .filter(Boolean)
    .join(' ')

const AppStoreButtons = ({ highlightedPlatform = 'other' }: Props) => (
  <div className="mx-auto flex max-w-sm flex-col items-stretch justify-center gap-3 sm:flex-row">
    <a
      href={APP_STORE_URL}
      className={getStoreLinkClassName(highlightedPlatform === 'ios')}
      aria-label="App Store에서 올클 다운로드"
    >
      <svg
        aria-hidden="true"
        className="h-8 w-8 sm:h-10 sm:w-10"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M19.665 16.811a10.316 10.316 0 0 1-1.021 1.837c-.537.767-.978 1.297-1.316 1.592-.525.482-1.089.73-1.692.744-.432 0-.954-.123-1.562-.373-.61-.249-1.17-.371-1.683-.371-.537 0-1.113.122-1.73.371-.616.25-1.114.381-1.495.393-.577.025-1.154-.229-1.729-.764-.367-.32-.826-.87-1.377-1.648-.59-.829-1.075-1.794-1.455-2.891-.407-1.187-.611-2.335-.611-3.447 0-1.273.275-2.372.826-3.292a4.857 4.857 0 0 1 1.73-1.751 4.65 4.65 0 0 1 2.34-.662c.46 0 1.063.142 1.81.422s1.227.422 1.436.422c.158 0 .689-.167 1.593-.498.853-.307 1.573-.434 2.163-.384 1.6.129 2.801.759 3.6 1.895-1.43.867-2.137 2.08-2.123 3.637.012 1.213.453 2.222 1.317 3.023a4.33 4.33 0 0 0 1.315.863c-.106.307-.218.6-.336.882zM15.998 2.38c0 .95-.348 1.838-1.039 2.659-.836.976-1.846 1.541-2.941 1.452a2.955 2.955 0 0 1-.021-.36c0-.913.396-1.889 1.103-2.688.352-.404.8-.741 1.343-1.009.542-.264 1.054-.41 1.536-.435.013.128.019.255.019.381z" />
      </svg>
      <span className="ml-2.5">
        <span className="block text-xs font-normal leading-none">Download on the</span>
        <span className="block text-lg font-bold leading-tight">App Store</span>
      </span>
    </a>

    <a
      href={GOOGLE_PLAY_URL}
      className={getStoreLinkClassName(highlightedPlatform === 'android')}
      aria-label="Google Play에서 올클 다운로드"
    >
      <svg
        aria-hidden="true"
        className="h-8 w-8 sm:h-10 sm:w-10"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="m12.954 11.616 2.957-2.957L6.36 3.291c-.633-.342-1.226-.39-1.746-.016l8.34 8.341zm3.461 3.462 3.074-1.729c.6-.336.929-.812.929-1.34 0-.527-.329-1.004-.928-1.34l-2.783-1.563-3.133 3.132 2.841 2.84zM4.1 4.002c-.064.197-.1.417-.1.658v14.705c0 .381.084.709.236.97l8.097-8.098L4.1 4.002zm8.854 8.855L4.902 20.91c.154.059.32.09.495.09.312 0 .637-.092.968-.276l9.255-5.197-2.666-2.67z" />
      </svg>
      <span className="ml-2.5">
        <span className="block text-xs font-normal leading-none">Get it on</span>
        <span className="block text-lg font-bold leading-tight">Google Play</span>
      </span>
    </a>
  </div>
)

export default AppStoreButtons
