import Script from 'next/script'
import { WEB_ENV } from '../../WEB_ENV'

declare global {
  interface Window {
    ChannelIO: (command: string, ...args: any[]) => void
  }
}

export const showChannelTalk = () => {
  if (typeof window === 'undefined' || !window.ChannelIO) {
    return
  }
  return window.ChannelIO('showMessenger')
}

export const openChat = (chatId?: string | number, message?: string) => {
  if (typeof window === 'undefined' || !window.ChannelIO) {
    return
  }
  return window.ChannelIO('openChat', chatId, message)
}

export const hideChannelTalk = () => {
  if (typeof window === 'undefined' || !window.ChannelIO) {
    return
  }
  return window.ChannelIO('hideMessenger')
}

export const ChannelTalkScript = () => {
  return (
    <Script
      id="channel-talk-script"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: getChannelTalkScript(),
      }}
    />
  )
}

function getChannelTalkScript(userName?: string, phone?: string) {
  const profileInfo =
    userName && phone
      ? `'profile': {
'name': '${userName}',
'mobileNumber': '${phone.replaceAll('-', '').trim()}',
},`
      : ''

  return `
  (function() {
    var w = window;
    if (w.ChannelIO) {
      return (window.console.error || window.console.log || function(){})('ChannelIO script included twice.');
    }
    var ch = function() {
      ch.c(arguments);
    };
    ch.q = [];
    ch.c = function(args) {
      ch.q.push(args);
    };
    w.ChannelIO = ch;
    function l() {
      if (w.ChannelIOInitialized) {
        return;
      }
      w.ChannelIOInitialized = true;
      var s = document.createElement('script');
      s.type = 'text/javascript';
      s.async = true;
      s.src = 'https://cdn.channel.io/plugin/ch-plugin-web.js';
      s.charset = 'UTF-8';
      var x = document.getElementsByTagName('script')[0];
      x.parentNode.insertBefore(s, x);
    }
    if (document.readyState === 'complete') {
      l();
    } else if (window.attachEvent) {
      window.attachEvent('onload', l);
    } else {
      window.addEventListener('DOMContentLoaded', l, false);
      window.addEventListener('load', l, false);
    }
  })();
  ChannelIO('boot', {
    'pluginKey': '${WEB_ENV.CHANNEL_TALK.PLUGIN_KEY}',
    'language': 'ko',
    ${profileInfo}
  });`
}
