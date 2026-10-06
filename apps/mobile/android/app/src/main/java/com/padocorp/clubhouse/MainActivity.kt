package com.padocorp.clubhouse

import android.content.Intent
import android.os.Bundle
import android.os.Build
import android.view.View
import android.view.ViewTreeObserver
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {
  private var entrySplashReady = false
  private var splashContent: View? = null
  private val releaseSplash = Runnable { releaseEntrySplash() }

  fun releaseEntrySplash() {
    entrySplashReady = true
    splashContent?.removeCallbacks(releaseSplash)
    splashContent?.invalidate()
  }
  /**
    Returns the name of the main component registered from JavaScript. This is used to schedule
    rendering of the component.
  */
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
    // Keep the starting window until React has laid out and decoded its first frame.
    // Unlike a modal splash dialog this cannot obscure login after the handoff.
    val content = findViewById<View>(android.R.id.content)
    splashContent = content
    content.viewTreeObserver.addOnPreDrawListener(object : ViewTreeObserver.OnPreDrawListener {
      override fun onPreDraw(): Boolean {
        if (entrySplashReady) content.viewTreeObserver.removeOnPreDrawListener(this)
        return entrySplashReady
      }
    })
    // Fail open if JS cannot start or an image event is lost.
    content.postDelayed(releaseSplash, 10000)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      splashScreen.setOnExitAnimationListener { it.remove() }
    }
  }

  override fun onDestroy() {
    splashContent?.removeCallbacks(releaseSplash)
    splashContent = null
    super.onDestroy()
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "clubhouse";

  /**
   * launchMode="singleTask"; Deep Link is passed with onNewIntent
   */
  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
  }

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate = DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
