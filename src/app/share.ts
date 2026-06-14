import { Injectable } from '@angular/core';
import { Share } from '@capacitor/share';

@Injectable({
  providedIn: 'root'
})
export class ShareService {

  async shareVideo(videoId: string, title: string) {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    await this.share({ title, text: title, url, dialogTitle: 'Share Video' });
  }

  async sharePost(caption: string, postUrl?: string) {
    const url = postUrl || window.location.href;
    await this.share({ title: 'VibeNet Post', text: caption, url, dialogTitle: 'Share Post' });
  }

  async shareLink(title: string, url: string, text?: string) {
    await this.share({ title, text: text || title, url, dialogTitle: 'Share' });
  }

  private async share(options: {
    title: string;
    text: string;
    url: string;
    dialogTitle: string;
  }) {
    try {
      const canShare = await Share.canShare();
      if (canShare.value) {
        await Share.share(options);
        return;
      }
    } catch (_) {}

    if (navigator.share) {
      try {
        await navigator.share({ title: options.title, text: options.text, url: options.url });
        return;
      } catch (e) { return; }
    }

    try {
      await navigator.clipboard.writeText(options.url);
      this.toast('Link copy ho gaya! 📋');
    } catch (_) {
      this.toast('Link: ' + options.url);
    }
  }

  private toast(msg: string) {
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = `
      position:fixed; bottom:90px; left:50%;
      transform:translateX(-50%);
      background:rgba(20,20,20,0.92); color:#fff;
      padding:10px 22px; border-radius:24px;
      font-size:13px; font-weight:600;
      z-index:9999; white-space:nowrap;
      box-shadow:0 4px 16px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.3s';
      setTimeout(() => el.remove(), 300);
    }, 2500);
  }
}