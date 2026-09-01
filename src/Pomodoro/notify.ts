import { Notice } from 'obsidian';
import { getSettings } from '../Config/Settings';

/**
 * 番茄钟通知：桌面端走系统通知（Electron renderer 原生支持 Web Notification API），
 * 权限未授予时先申请；移动端或用户关闭系统通知时降级为 Obsidian Notice。
 */
export function notify(title: string, body: string) {
    const { pomodoro } = getSettings();

    if (pomodoro.systemNotifications && typeof Notification !== 'undefined') {
        if (Notification.permission === 'granted') {
            new Notification(title, { body });
            return;
        }
        if (Notification.permission !== 'denied') {
            void Notification.requestPermission()
                .then((permission) => {
                    if (permission === 'granted') {
                        new Notification(title, { body });
                    } else {
                        new Notice(`${title}\n${body}`, 10000);
                    }
                })
                .catch(() => {
                    new Notice(`${title}\n${body}`, 10000);
                });
            return;
        }
    }

    new Notice(`${title}\n${body}`, 10000);
}
