package com.vaympseller

import android.media.AudioAttributes
import android.os.Build
import android.media.MediaPlayer
import android.os.PowerManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Loops res/raw/new_order_sound until stop() — the seller's new-order
 * alarm. App-driven on purpose: Android's own looping notification sound
 * (insistent flag) stops as soon as the notification shade is opened, but
 * this must keep ringing until the order is accepted/rejected. Runs inside
 * Notifee's foreground service (see localNotifications.ts), which keeps the
 * process alive while it plays. The player is static so the headless
 * (background push) and UI JS contexts share the same one.
 */
class OrderAlarmModule(private val context: ReactApplicationContext) :
  ReactContextBaseJavaModule(context) {

  override fun getName() = "OrderAlarm"

  @ReactMethod
  fun start() {
    synchronized(lock) {
      if (player != null) return

      player = MediaPlayer().apply {
        setAudioAttributes(
          AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build(),
        )
        context.resources.openRawResourceFd(R.raw.new_order_sound).use {
          setDataSource(it.fileDescriptor, it.startOffset, it.length)
        }
        isLooping = true
        setWakeMode(context, PowerManager.PARTIAL_WAKE_LOCK)
        prepare()
        start()
      }
    }
  }

  @ReactMethod
  fun stop() {
    synchronized(lock) {
      player?.run {
        stop()
        release()
      }
      player = null
    }
  }

  // Lets the full-screen "New order" popup (IncomingOrderAlert.tsx) appear
  // over the lock screen and wake the display — only while orders wait.
  @ReactMethod
  fun showOverLockScreen(enabled: Boolean) {
    val activity = context.currentActivity ?: return
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O_MR1) return
    activity.runOnUiThread {
      activity.setShowWhenLocked(enabled)
      activity.setTurnScreenOn(enabled)
    }
  }

  companion object {
    private val lock = Any()
    private var player: MediaPlayer? = null
  }
}
