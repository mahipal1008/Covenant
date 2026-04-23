package dev.covenant.jetbrains

import com.intellij.notification.NotificationGroupManager
import com.intellij.notification.NotificationType
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent

/**
 * Triggers a refresh of Covenant findings. The full diagnostics
 * pipeline is wired in subsequent sessions; this action establishes
 * the user-visible entry point and notification surface.
 */
class RefreshAction : AnAction() {
    override fun actionPerformed(event: AnActionEvent) {
        val project = event.project ?: return
        NotificationGroupManager.getInstance()
            .getNotificationGroup("Covenant")
            .createNotification(
                "Covenant",
                "Refresh requested. Findings sync runs against the configured API URL.",
                NotificationType.INFORMATION
            )
            .notify(project)
    }
}
