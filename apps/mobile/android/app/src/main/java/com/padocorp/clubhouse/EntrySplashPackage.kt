package com.padocorp.clubhouse

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.ViewManager

class EntrySplashPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> =
    listOf(EntrySplashModule(context))

  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}

class EntrySplashModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "EntrySplash"

  @ReactMethod
  fun ready() {
    val activity = reactApplicationContext.currentActivity as? MainActivity ?: return
    activity.runOnUiThread { activity.releaseEntrySplash() }
  }
}
