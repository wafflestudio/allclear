# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Note: the configuration keeps the entry point 'okio.AsyncTimeout { void scheduleTimeout(okio.AsyncTimeout,long,boolean); }', but not the descriptor class 'okio.AsyncTimeou
-dontwarn okio.**
# Note: the configuration keeps the entry point 'okhttp3.internal.ws.WebSocketWriter$FrameSink { void write(okio.Buffer,long); }', but not the descriptor class 'okio.Buffer'
-dontwarn okhttp3.**
# https://github.com/luggit/react-native-config#problems-with-proguard
-keep class com.mypackage.BuildConfig { *; }

# https://github.com/crossplatformkorea/react-native-kakao-login
-keep class com.kakao.sdk.**.model.* { <fields>; }
-keep class * extends com.google.gson.TypeAdapter
