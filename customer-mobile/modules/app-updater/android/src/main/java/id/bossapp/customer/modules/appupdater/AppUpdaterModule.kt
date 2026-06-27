package id.bossapp.customer.modules.appupdater

import android.content.Intent
import android.net.Uri
import androidx.core.content.FileProvider
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

class AppUpdaterModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AppUpdater")

    AsyncFunction("installApk") { absolutePath: String ->
      val context = appContext.reactContext
        ?: throw Exception("React context not available")

      val file = File(absolutePath)
      if (!file.exists()) {
        throw Exception("APK file not found: $absolutePath")
      }

      val uri: Uri = FileProvider.getUriForFile(
        context,
        "${context.packageName}.appupdater.fileprovider",
        file
      )

      val intent = Intent(Intent.ACTION_VIEW).apply {
        setDataAndType(uri, "application/vnd.android.package-archive")
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }

      context.startActivity(intent)
    }
  }
}
