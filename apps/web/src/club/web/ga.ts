import ReactGA from 'react-ga'
import { WEB_ENV } from '../../WEB_ENV'

function isBrowser() {
  return typeof window !== 'undefined'
}

export function init() {
  if (!isBrowser()) {
    return
  }
  ReactGA.initialize(WEB_ENV.GA.TRACKING_ID, {
    // debug: process.env.Environment !== 'production',
  })
  ReactGA.set({ path: window.location.pathname })
}

export function setPageview(url: string) {
  ReactGA.pageview(url)
}

export function setEvent(event) {
  ReactGA.event(event)
}
