import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { chapters, sceneConfig } from './config';
import { clamp01 } from './motion';

gsap.registerPlugin(ScrollTrigger);
// The page owns resize refreshes so a delayed library refresh cannot interrupt
// a chapter's native smooth-scroll navigation immediately after a resize.
ScrollTrigger.config({ autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load' });

export class ScrollJourney {
  private timeline: gsap.core.Timeline;
  private trigger: ScrollTrigger;
  private playhead = { progress: 0 };
  private paused = false;

  constructor(story: HTMLElement, private onProgress: (progress: number) => void) {
    this.timeline = gsap.timeline({ paused: true }).to(this.playhead, {
      progress: 1, duration: 1, ease: 'none',
      onUpdate: () => { if (!this.paused) this.onProgress(this.playhead.progress); },
    });
    this.trigger = ScrollTrigger.create({
      trigger: story,
      start: 'top top', end: 'bottom bottom',
      animation: this.timeline, scrub: sceneConfig.scrubSeconds,
      invalidateOnRefresh: true,
    });
    this.onProgress(this.playhead.progress);
  }

  get progress(): number { return this.playhead.progress; }

  goTo(index: number, immediate = false): void {
    // A navigation click can arrive before ScrollTrigger's debounced resize refresh.
    // Read the new viewport geometry now so the destination hits the chapter pose.
    ScrollTrigger.refresh();
    const destination = this.trigger.start + chapters[index].progress * (this.trigger.end - this.trigger.start);
    window.scrollTo({ top: destination, behavior: immediate ? 'instant' : 'smooth' });
  }

  pause(): void {
    this.paused = true;
    this.trigger.disable(false);
    this.trigger.getTween()?.pause();
  }

  resume(): void {
    this.paused = false;
    this.trigger.enable(false, false);
    this.trigger.refresh();
    this.trigger.update();
    this.onProgress(this.playhead.progress);
  }

  seek(progress: number): void {
    this.timeline.progress(clamp01(progress));
    this.onProgress(this.playhead.progress);
  }

  refresh(): void { ScrollTrigger.refresh(); this.onProgress(this.playhead.progress); }
  reframe(progress: number): void {
    const preserved = clamp01(progress);
    if (!this.paused) {
      ScrollTrigger.refresh();
      window.scrollTo({ top: this.trigger.start + preserved * (this.trigger.end - this.trigger.start), behavior: 'instant' });
      ScrollTrigger.update();
      // Finish the refresh's scrub at the preserved position, then resume native scrolling.
      this.trigger.getTween()?.progress(1);
    }
    this.timeline.progress(preserved);
    this.onProgress(preserved);
  }
  dispose(): void { this.trigger.kill(); this.timeline.kill(); }
}
