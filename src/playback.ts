import type { Chapter, Interview } from './content';

interface PlaybackOptions { onError?: (message: string) => void }

/** One media element owns all audio and remembers progress per interview. */
export class Playback {
  readonly video = document.createElement('video');
  private active: Interview | null = null;
  private pendingTime: number | null = null;
  private readonly positions = new Map<string, number>();
  private readonly onError?: (message: string) => void;

  constructor(options: PlaybackOptions = {}) {
    this.onError = options.onError;
    this.video.preload = 'none';
    this.video.controls = true;
    this.video.playsInline = true;
    this.video.setAttribute('aria-label', '访谈原片，支持完整时间轴');
    this.video.addEventListener('loadedmetadata', this.seekPending);
    this.video.addEventListener('timeupdate', this.remember);
    this.video.addEventListener('pause', this.remember);
    this.video.addEventListener('error', this.failed);
  }

  /** Prepare a source without fetching its video data or starting audio. */
  select(interview: Interview, chapter: Chapter, resume = false) {
    this.pause();
    const changed = this.active?.id !== interview.id || this.active.src !== interview.src;
    this.active = interview;
    this.pendingTime = resume ? this.positions.get(interview.id) ?? chapter.start : chapter.start;
    if (changed) {
      this.video.src = interview.src;
      // preload=none leaves the original recording untouched until explicit play.
    } else {
      this.seekPending();
    }
  }

  async play() {
    if (!this.active) return;
    this.seekPending();
    try {
      // Invoke play synchronously inside the user's gesture; metadata will seek.
      await this.video.play();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      this.onError?.('视频暂时无法播放，请检查本地媒体文件，或点击播放器中的播放按钮重试。');
    }
  }

  pause() { this.video.pause(); this.remember(); }
  close() { this.pause(); }
  getResume(interviewId: string) { return this.positions.get(interviewId); }

  private seekPending = () => {
    if (this.pendingTime === null || this.video.readyState < 1) return;
    const duration = this.video.duration;
    const target = Math.max(0, Math.min(this.pendingTime, Number.isFinite(duration) ? Math.max(0, duration - 0.01) : this.pendingTime));
    this.video.currentTime = target;
    this.pendingTime = null;
  };
  private remember = () => {
    if (this.active && this.pendingTime === null && Number.isFinite(this.video.currentTime)) {
      this.positions.set(this.active.id, this.video.currentTime);
    }
  };
  private failed = () => this.onError?.('原片加载失败。请确认 public/media/interview.mp4 已准备好，再重新打开片段。');

  dispose() {
    this.pause();
    this.video.removeEventListener('loadedmetadata', this.seekPending);
    this.video.removeEventListener('timeupdate', this.remember);
    this.video.removeEventListener('pause', this.remember);
    this.video.removeEventListener('error', this.failed);
    this.video.removeAttribute('src');
    this.video.load();
    this.video.remove();
  }
}
