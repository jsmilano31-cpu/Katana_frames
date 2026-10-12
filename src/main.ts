import './style.css';
import { chapters, sceneConfig, type AssetManifest, type CameraPose } from './config';
import { activeChapter, sampleCamera } from './motion';
import type { KatanaScene, SceneStats } from './scene';
import type { ScrollJourney } from './scroll';

const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" /></svg>';
const down = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v17m-6-6 6 6 6-6" /></svg>';
const replay = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10a8 8 0 1 1 1.4 8M4 4v6h6" /></svg>';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <a class="skip-link" href="#reveal">Skip to the study</a>
  <header class="site-header">
    <a class="wordmark" href="#reveal" aria-label="Katana, return to the reveal"><span class="seal" lang="ja">刀</span><span>KATANA<span class="wordmark-sub">A STUDY IN FORM</span></span></a>
    <div class="header-right"><span class="header-caption">An object. Five perspectives.</span><button class="about-button" type="button">About the study <span>↗</span></button></div>
  </header>

  <main id="study" class="story" aria-label="A five-part study of a katana">
    <div class="story-frame">
      <div class="scene-stage" aria-hidden="true">
        <div class="stage-glow"></div>
        <span class="stage-kanji" lang="ja">刀</span>
        <img class="stage-poster" src="/assets/katana-preview.jpg" alt="" />
        <canvas id="katana-canvas"></canvas>
        <div class="stage-shade"></div>
      </div>
      <div class="chapter-panels">
        ${chapters.map((chapter, index) => `
          <section class="chapter ${index === 0 ? 'is-active' : ''}" id="${chapter.id}" data-chapter="${index}" aria-labelledby="title-${chapter.id}">
            <div class="chapter-image" aria-hidden="true"><picture><source class="mobile-poster" media="(max-width: 760px)" /><img src="/assets/katana-preview.jpg" alt="" style="--poster-position:${chapter.poster.position};--poster-scale:${chapter.poster.scale}" /></picture><div class="image-shade"></div></div>
            <div class="chapter-content">
              <p class="eyebrow"><span class="red-line"></span>${chapter.eyebrow}</p>
              ${index === 0 ? '<p class="hero-word" aria-hidden="true">KATANA</p>' : `<span class="chapter-kanji" lang="ja" aria-hidden="true">${chapter.japanese}</span>`}
              <${index === 0 ? 'h1' : 'h2'} id="title-${chapter.id}">${chapter.title}</${index === 0 ? 'h1' : 'h2'}>
              <p class="chapter-description">${chapter.description}</p>
              ${index === 0 ? `<a class="text-link begin-link" href="#blade">Begin the study ${arrow}</a>` : ''}
              ${index === 4 ? `<div class="final-actions"><button class="primary-button explore-button" type="button" disabled>Explore the form ${arrow}</button><button class="text-link replay-button" type="button">Replay the study ${replay}</button></div><p class="explore-availability">Interactive rotation becomes available in the 3D view.</p>` : ''}
            </div>
            <div class="chapter-bottom"><span class="chapter-note">${chapter.note}</span><span class="chapter-number">0${index + 1}<span> / 05</span></span></div>
            ${index === 0 ? `<a class="scroll-cue" href="#blade"><span>SCROLL TO DISCOVER</span>${down}</a>` : ''}
          </section>`).join('')}
      </div>
      <div class="object-caption"><span class="caption-line"></span><span><span class="object-caption-title">KATANA</span><span class="object-caption-sub">刀 / THE JAPANESE SWORD</span></span></div>
      <div class="journey-progress" aria-hidden="true"><span></span></div>
    </div>
  </main>

  <nav class="chapter-nav" aria-label="Study chapters">
    ${chapters.map((chapter, index) => `<a href="#${chapter.id}" data-nav="${index}" aria-label="${chapter.label}" ${index === 0 ? 'aria-current="step"' : ''}><span class="nav-label" aria-hidden="true">${chapter.label}</span><span class="nav-mark"></span><span class="nav-index" aria-hidden="true">0${index + 1}</span></a>`).join('')}
  </nav>

  <div class="view-status" role="status"><span class="status-dot"></span><span class="status-text">Preparing the study</span><button class="retry-button" type="button" hidden>Retry 3D ↗</button></div>
  <div class="live-announcement sr-only" aria-live="polite"></div>

  <section class="explore-panel" aria-label="Explore the katana" hidden>
    <p class="explore-heading">Your perspective.</p><p class="explore-help" id="explore-help">Drag to rotate. Use arrow keys when the viewer is focused.</p>
    <div class="explore-toolbar">
      <button class="rotate-button" type="button" data-rotate="left" aria-label="Rotate left">←</button>
      <button class="rotate-button" type="button" data-rotate="up" aria-label="Rotate up">↑</button>
      <button class="rotate-button" type="button" data-rotate="down" aria-label="Rotate down">↓</button>
      <button class="rotate-button" type="button" data-rotate="right" aria-label="Rotate right">→</button>
      <button class="reset-button" type="button">Reset view ${replay}</button>
      <button class="exit-button" type="button">Back to the study <span>×</span></button>
    </div>
  </section>

  <footer class="site-footer">
    <div><span class="footer-kanji" lang="ja">刀</span><p>A closer look.<br>A quieter perspective.</p></div>
    <p class="asset-credit">3D model &amp; preview: <a href="https://sketchfab.com/3d-models/katana-36e9ab64846246e8964a66b691e62f37" target="_blank" rel="noopener noreferrer">Katana by J.AkioHonda ↗</a><br>Licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>.<br><span class="modification-credit">Preview cropped for presentation.</span></p>
    <button class="footer-top text-link" type="button">Back to the beginning ↑</button>
  </footer>

  <dialog class="about-dialog" aria-labelledby="about-title">
    <button class="close-about" type="button" aria-label="Close about the study">×</button>
    <p class="eyebrow"><span class="red-line"></span>About the study</p><h2 id="about-title">An invitation<br>to look closer.</h2>
    <p>This is a visual study of a katana: the curve of its blade, the shape of its guard, and the rhythm of its wrapped handle. Scroll through five perspectives, then explore the full form.</p>
    <p>The digital model is <a href="https://sketchfab.com/3d-models/katana-36e9ab64846246e8964a66b691e62f37" target="_blank" rel="noopener noreferrer">Katana by J.AkioHonda</a>, used under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>. Its creator describes it as a realistic interpretation, without historical accuracy.</p>
    <p class="about-modifications">Preview cropped for presentation. Model import pending.</p>
  </dialog>
`;

const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const story = $('.story');
const canvas = $<HTMLCanvasElement>('#katana-canvas');
const panels = [...document.querySelectorAll<HTMLElement>('.chapter')];
const navLinks = [...document.querySelectorAll<HTMLAnchorElement>('[data-nav]')];
const status = $('.status-text');
const retryButton = $<HTMLButtonElement>('.retry-button');
const exploreButton = $<HTMLButtonElement>('.explore-button');
const explorePanel = $('.explore-panel');
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
let scene: KatanaScene | null = null;
let journey: ScrollJourney | null = null;
let manifest: AssetManifest | null = null;
let isLoading = false;
let isExploring = false;
let currentChapter = 0;
let progress = 0;
let observer: IntersectionObserver | null = null;
let savedScroll = 0;
let resizeTimer = 0;
let stats: SceneStats | null = null;
let destroyed = false;

function isMobile(): boolean { return innerWidth < sceneConfig.breakpoint; }
function currentPose(): CameraPose { return sampleCamera(progress, isMobile()); }

function selectChapter(index: number): void {
  const changed = index !== currentChapter;
  currentChapter = index;
  document.body.dataset.chapter = String(index);
  navLinks.forEach((link, i) => {
    if (i === index) link.setAttribute('aria-current', 'step');
    else link.removeAttribute('aria-current');
  });
  if (changed && journey) $('.live-announcement').textContent = `Chapter ${index + 1}: ${chapters[index].label}`;
}

function updateProgress(value: number): void {
  progress = value;
  const index = activeChapter(value);
  selectChapter(index);
  document.documentElement.style.setProperty('--progress', String(value));
  if (isExploring) return;
  panels.forEach((panel, i) => {
    const distance = Math.abs(value - chapters[i].progress);
    const opacity = i === index ? Math.min(1, Math.max(0, (0.125 - distance) / 0.055)) : 0;
    panel.classList.toggle('is-active', i === index);
    panel.style.setProperty('--chapter-opacity', String(opacity));
    panel.style.setProperty('--chapter-offset', `${(chapters[i].progress - value) * 65}px`);
    panel.setAttribute('aria-hidden', String(i !== index));
    panel.inert = i !== index;
  });
  $('.object-caption-title').textContent = index === 0 || index === 4 ? 'KATANA' : chapters[index].label.replace('The ', '').toUpperCase();
  $('.object-caption-sub').textContent = `${chapters[index].japanese} / ${chapters[index].note.toUpperCase()}`;
  scene?.setPose(currentPose());
}

function setStaticView(message: string, retry: boolean): void {
  if (isExploring) exitExplore(false);
  journey?.dispose();
  journey = null;
  scene?.dispose();
  scene = null;
  document.body.classList.remove('is-live', 'is-loading');
  document.body.classList.add('is-static');
  document.body.dataset.view = 'static';
  status.textContent = message;
  retryButton.hidden = !retry;
  exploreButton.disabled = true;
  $('.explore-availability').hidden = false;
  panels.forEach(panel => {
    panel.removeAttribute('aria-hidden');
    panel.inert = false;
    panel.style.removeProperty('--chapter-opacity');
    panel.style.removeProperty('--chapter-offset');
  });
  observer?.disconnect();
  observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) selectChapter(Number((entry.target as HTMLElement).dataset.chapter));
  }, { rootMargin: '-35% 0px -35% 0px', threshold: 0 });
  panels.forEach(panel => observer!.observe(panel));
}

function goTo(index: number, immediate = false): void {
  if (isExploring) exitExplore(false);
  clearTimeout(resizeTimer);
  scene?.resize();
  if (journey) journey.goTo(index, immediate || motionQuery.matches);
  else panels[index].scrollIntoView({ behavior: immediate || motionQuery.matches ? 'instant' : 'smooth', block: 'start' });
  history.replaceState(null, '', `#${chapters[index].id}`);
}

function setPosters(): void {
  if (!manifest?.postersReady) return;
  document.body.classList.add('has-rendered-posters');
  panels.forEach((panel, index) => {
    const image = panel.querySelector<HTMLImageElement>('.chapter-image img')!;
    image.src = `/assets/posters/chapter-${index}.png`;
    panel.querySelector<HTMLSourceElement>('.mobile-poster')!.srcset = `/assets/posters/chapter-${index}-mobile.png`;
    image.style.setProperty('--poster-position', 'center');
    image.style.setProperty('--poster-scale', '1');
  });
}

async function initialize(): Promise<void> {
  if (isLoading || destroyed) return;
  isLoading = true;
  retryButton.hidden = true;
  const previousChapter = currentChapter;
  try {
    const response = await fetch(`/assets/model/manifest.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Asset manifest unavailable.');
    manifest = await response.json() as AssetManifest;
    $('.modification-credit').textContent = manifest.modifications;
    $('.about-modifications').textContent = manifest.modifications;
    setPosters();
    if (motionQuery.matches) {
      setStaticView('Still-image view · reduced motion', false);
      return;
    }
    if (manifest.status !== 'ready') {
      setStaticView('Still-image view · 3D unavailable', true);
      return;
    }
    document.body.classList.add('is-loading');
    status.textContent = 'Preparing the 3D study';
    // WebGL and the animation libraries are only downloaded when an asset is ready.
    const [{ KatanaScene: Scene }, { ScrollJourney: Journey }] = await Promise.all([import('./scene'), import('./scroll')]);
    scene?.dispose();
    scene = new Scene(canvas, () => setStaticView('Still-image view · 3D interrupted', true));
    scene.setPose(sampleCamera(chapters[previousChapter].progress, isMobile()));
    await scene.load(`${manifest.url}?t=${Date.now()}`, percent => {
      status.textContent = percent === null ? 'Preparing the 3D study' : `Preparing the 3D study · ${percent}%`;
    });
    if (destroyed) return;
    if (motionQuery.matches) {
      setStaticView('Still-image view · reduced motion', false);
      return;
    }
    observer?.disconnect();
    observer = null;
    document.body.classList.remove('is-static', 'is-loading');
    document.body.classList.add('is-live');
    document.body.dataset.view = '3d';
    journey = new Journey(story, updateProgress);
    scene.setStatsCallback(value => { stats = value; });
    status.textContent = 'Scroll to explore';
    exploreButton.disabled = false;
    $('.explore-availability').hidden = true;
    if (previousChapter > 0) journey.goTo(previousChapter, true);
    else if (location.hash) {
      const index = chapters.findIndex(chapter => `#${chapter.id}` === location.hash);
      if (index >= 0) journey.goTo(index, true);
    }
    journey.refresh();
  } catch (error) {
    console.warn('The 3D study could not be loaded:', error);
    setStaticView('Still-image view · 3D unavailable', !motionQuery.matches);
  } finally {
    isLoading = false;
  }
}

function enterExplore(): void {
  if (!scene || !journey || currentChapter !== 4 || isExploring) return;
  savedScroll = scrollY;
  journey.pause();
  const pose = sampleCamera(1, isMobile());
  scene.beginExplore(pose);
  isExploring = true;
  document.body.classList.add('is-exploring');
  document.body.style.top = `-${savedScroll}px`;
  explorePanel.hidden = false;
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'application');
  canvas.setAttribute('aria-label', 'Katana rotation viewer');
  canvas.setAttribute('aria-describedby', 'explore-help');
  canvas.closest('.scene-stage')!.removeAttribute('aria-hidden');
  status.textContent = 'Explore mode';
  canvas.focus({ preventScroll: true });
  $('.live-announcement').textContent = 'Explore mode. Drag or use the arrow keys to rotate. Escape returns to the study.';
}

function exitExplore(returnFocus = true): void {
  if (!isExploring) return;
  isExploring = false;
  document.body.classList.remove('is-exploring');
  document.body.style.removeProperty('top');
  window.scrollTo({ top: savedScroll, behavior: 'instant' });
  explorePanel.hidden = true;
  canvas.tabIndex = -1;
  canvas.removeAttribute('role');
  canvas.removeAttribute('aria-label');
  canvas.removeAttribute('aria-describedby');
  canvas.closest('.scene-stage')!.setAttribute('aria-hidden', 'true');
  scene?.endExplore(currentPose());
  journey?.resume();
  status.textContent = 'Scroll to explore';
  if (returnFocus) exploreButton.focus({ preventScroll: true });
}

document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
  const index = chapters.findIndex(chapter => link.hash === `#${chapter.id}`);
  if (index < 0) return;
  event.preventDefault();
  goTo(index);
  if (link.classList.contains('skip-link')) {
    const heading = $('#title-reveal');
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
}));

retryButton.addEventListener('click', () => void initialize());
exploreButton.addEventListener('click', enterExplore);
$('.exit-button').addEventListener('click', () => exitExplore());
// Activate on the completed touch pointer as well as click. Browsers can suppress
// the compatibility click when a toolbar tap immediately follows an orbit drag.
$('.exit-button').addEventListener('pointerup', event => {
  if (event.pointerType === 'touch') {
    event.preventDefault();
    exitExplore();
  }
});
$('.reset-button').addEventListener('click', () => scene?.resetExplore());
$('.replay-button').addEventListener('click', () => goTo(0));
$('.footer-top').addEventListener('click', () => goTo(0));

const rotations: Record<string, [number, number]> = { left: [-0.12, 0], right: [0.12, 0], up: [0, -0.12], down: [0, 0.12] };
document.querySelectorAll<HTMLButtonElement>('[data-rotate]').forEach(button => button.addEventListener('click', () => scene?.rotate(...rotations[button.dataset.rotate!])));
canvas.addEventListener('keydown', event => {
  if (!isExploring) return;
  const direction = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }[event.key];
  if (direction) {
    event.preventDefault();
    scene?.rotate(...rotations[direction]);
  } else if (event.key.toLowerCase() === 'r' || event.key === 'Home') {
    event.preventDefault();
    scene?.resetExplore();
  }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && isExploring) { event.preventDefault(); exitExplore(); }
});

const aboutDialog = $<HTMLDialogElement>('.about-dialog');
$('.about-button').addEventListener('click', () => aboutDialog.showModal());
$('.close-about').addEventListener('click', () => aboutDialog.close());
aboutDialog.addEventListener('click', event => { if (event.target === aboutDialog) aboutDialog.close(); });

window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    scene?.resize();
    if (isExploring) {
      scene?.endExplore(sampleCamera(1, isMobile()));
      scene?.beginExplore(sampleCamera(1, isMobile()));
    } else {
      scene?.setPose(currentPose());
      journey?.refresh();
    }
  }, 100);
});
motionQuery.addEventListener('change', () => {
  const previousChapter = currentChapter;
  if (motionQuery.matches) {
    setStaticView('Still-image view · reduced motion', false);
    goTo(previousChapter, true);
  } else void initialize();
});
window.addEventListener('hashchange', () => {
  const index = chapters.findIndex(chapter => `#${chapter.id}` === location.hash);
  if (index >= 0) goTo(index, true);
});

// A read-only diagnostics interface lets browser QA inspect camera state and performance.
declare global {
  interface Window {
    __katana: {
      state: () => { view: string; chapter: number; progress: number; exploring: boolean; pose: CameraPose; stats: SceneStats | null };
      captureChapter?: (index: number) => Promise<void>;
    };
  }
}
window.__katana = {
  state: () => ({
    view: document.body.dataset.view ?? 'loading', chapter: currentChapter, progress, exploring: isExploring,
    pose: scene ? { position: scene.camera.position.toArray() as [number, number, number], target: scene.controls.target.toArray() as [number, number, number], fov: scene.camera.fov } : currentPose(), stats,
  }),
};
if (new URLSearchParams(location.search).has('capture')) {
  window.__katana.captureChapter = async index => {
    if (!scene || !journey) throw new Error('The official model must be loaded before capturing posters.');
    journey.pause();
    journey.seek(chapters[index].progress);
    scene.setPose(sampleCamera(chapters[index].progress, isMobile()));
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  };
}

setStaticView('Preparing the study', false);
void initialize();
if (import.meta.hot) import.meta.hot.dispose(() => {
  destroyed = true;
  observer?.disconnect();
  journey?.dispose();
  scene?.dispose();
});
