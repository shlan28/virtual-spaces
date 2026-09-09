import type { Chapter } from './content';
interface InterfaceOptions {
  onNavigate: (id: string) => void;
  onChapter: (index: number) => void;
  onPlay: () => void;
  onClose: () => void;
  onQuality: () => void;
  onSliceStep: (direction: number) => void;
  onOpenSlice: () => void;
  video: HTMLVideoElement;
  chapters: Chapter[];
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function time(seconds: number) {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
}

export function createInterface(options: InterfaceOptions) {
  const root = element('div', 'interface');
  const app = document.getElementById('app');
  if (!app) throw new Error('Missing application host #app');
  app.append(root);

  const button = (label: string, className: string, callback: () => void) => {
    const node = element('button', className, label);
    node.type = 'button';
    node.addEventListener('click', callback);
    return node;
  };

  const header = element('header', 'world-header');
  const brand = element('div', 'world-brand');
  brand.append(element('span', 'brand-symbol', '◯'), element('span', 'brand-name', '天窗访谈馆'));
  const brandCopy = element('div', 'brand-copy');
  brandCopy.append(element('span', 'brand-eyebrow', 'OCULUS / 天窗访谈馆'), element('span', 'brand-description', '循着天光，发现思想之间的联系'));
  const utilities = element('div', 'world-utilities');
  let reducedQuality = false;
  const quality = button('画质 · 精细', 'utility-button', () => {
    reducedQuality = !reducedQuality;
    quality.textContent = reducedQuality ? '画质 · 流畅' : '画质 · 精细';
    quality.setAttribute('aria-pressed', String(reducedQuality));
    options.onQuality();
  });
  quality.setAttribute('aria-label', '切换精细或流畅画质');
  quality.setAttribute('aria-pressed', 'false');
  const home = button('↖ 回到入口', 'utility-button home-button', () => navigate('entry'));
  utilities.append(quality, home);
  header.append(brand, brandCopy, utilities);

  const location = element('section', 'location-card');
  const locationEyebrow = element('div', 'location-eyebrow', '01 / 入口叠景');
  const locationTitle = element('h1', 'location-title', '光落下的地方，对话正在发生。');
  const locationDescription = element('p', 'location-description', '穿过曲墙与门洞，探索访谈、观点和它们的联系。');
  const locationToggle = button('收起 −', 'location-toggle', () => {
    const collapsed = location.classList.toggle('is-collapsed');
    locationToggle.textContent = collapsed ? '展开 +' : '收起 −';
    locationToggle.setAttribute('aria-expanded', String(!collapsed));
  });
  locationToggle.setAttribute('aria-expanded', 'true');
  location.append(locationEyebrow, locationTitle, locationDescription, locationToggle);

  const footer = element('footer', 'world-footer');
  const hint = element('p', 'navigation-hint');
  hint.append(element('span', 'desktop-navigation-hint', '拖动转头 · WASD 沿路移动 · 点击展品'), element('span', 'touch-navigation-hint', '拖动转头 · 下方切换展区 · 点击展品'));
  const nav = element('nav', 'destination-nav');
  nav.setAttribute('aria-label', '空间目的地');
  const destinations = [ ['entry', '入口叠景'], ['court', '下沉中庭'], ['interview', '对话侧厅'], ['mezzanine', '夹层回廊'] ];
  const navButtons = new Map<string, HTMLButtonElement>();
  function setActiveDestination(id: string) {
    navButtons.forEach((node, key) => {
      node.classList.toggle('is-active', key === id);
      if (key === id) node.setAttribute('aria-current', 'location');
      else node.removeAttribute('aria-current');
    });
  }
  function navigate(id: string) {
    setActiveDestination(id);
    options.onNavigate(id);
  }
  destinations.forEach(([id, label], index) => {
    const node = button('', 'destination-button', () => navigate(id));
    node.append(element('span', 'destination-number', `0${index + 1}`), element('span', 'destination-name', label));
    if (id === 'entry') { node.classList.add('is-active'); node.setAttribute('aria-current', 'location'); }
    navButtons.set(id, node);
    nav.append(node);
  });
  const footerNote = element('span', 'footer-note', '一场访谈 · 八个精选片段');
  footer.append(hint, nav, footerNote);

  const sliceToolbar = element('section', 'slice-toolbar');
  sliceToolbar.hidden = true;
  sliceToolbar.setAttribute('aria-label', '拨动访谈切片');
  const previousSlice = button('‹', 'slice-step', () => options.onSliceStep(-1));
  previousSlice.setAttribute('aria-label', '上一片');
  const nextSlice = button('›', 'slice-step', () => options.onSliceStep(1));
  nextSlice.setAttribute('aria-label', '下一片');
  const sliceCopy = element('div', 'slice-copy');
  const sliceTitle = element('span', 'slice-current-title', '选择一个片段');
  sliceTitle.setAttribute('aria-live', 'polite');
  sliceCopy.append(element('span', 'slice-caption', '拨动切片 · 探索这场对话'), sliceTitle);
  const openSlice = button('查看片段 ↗', 'slice-open', options.onOpenSlice);
  sliceToolbar.append(previousSlice, sliceCopy, nextSlice, openSlice);

  const panel = element('section', 'reading-panel');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-labelledby', 'panel-title');
  panel.hidden = true;
  panel.setAttribute('aria-label', '访谈与观点详情');
  const panelTop = element('div', 'panel-top');
  const panelLabel = element('span', 'panel-eyebrow', 'CONVERSATION / 访谈');
  const close = button('×', 'panel-close', () => { options.onClose(); closePanel(); });
  close.setAttribute('aria-label', '关闭详情');
  panelTop.append(panelLabel, close);
  const panelTitle = element('h2', 'panel-title');
  panelTitle.id = 'panel-title';
  const panelMeta = element('p', 'panel-meta');
  const videoFrame = element('div', 'video-frame');
  options.video.controls = true;
  options.video.playsInline = true;
  options.video.setAttribute('aria-label', '访谈视频');
  videoFrame.append(options.video);
  const playback = button('▶ 播放这一段', 'source-button', options.onPlay);
  const panelBody = element('p', 'panel-body');
  let currentChapter = 0;
  const chapterStepper = element('div', 'chapter-stepper');
  const previousChapter = button('← 上一片', 'secondary-button', () => options.onChapter(Math.max(0, currentChapter - 1)));
  const nextChapter = button('下一片 →', 'secondary-button', () => options.onChapter(Math.min(options.chapters.length - 1, currentChapter + 1)));
  chapterStepper.append(previousChapter, nextChapter);
  const chapterLabel = element('h3', 'chapter-list-heading', '这一场对话');
  const chapterList = element('div', 'chapter-list');
  const chapterButtons: HTMLButtonElement[] = [];
  options.chapters.forEach((chapter, index) => {
    const node = button('', 'chapter-button', () => options.onChapter(index));
    node.append(element('span', 'chapter-time', time(chapter.start)), element('span', 'chapter-title', chapter.title), element('span', 'chapter-arrow', '↗'));
    chapterList.append(node);
    chapterButtons.push(node);
  });
  let sourceHandler: (() => void) | undefined;
  const source = button('↗ 回到来源访谈', 'source-button', () => sourceHandler?.());
  source.hidden = true;
  const editorialNote = element('p', 'editorial-note', '编辑整理 · 时间约略，观点请结合原始访谈理解。');
  panel.append(panelTop, panelTitle, panelMeta, videoFrame, playback, chapterStepper, panelBody, source, chapterLabel, chapterList, editorialNote);

  let previousFocus: HTMLElement | null = null;
  function openPanel() {
    if (panel.hidden) previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panel.hidden = false;
    root.classList.add('has-panel');
    header.inert = true; footer.inert = true; location.inert = true; sliceToolbar.inert = true;
    close.focus({ preventScroll: true });
  }
  function closePanel() {
    panel.hidden = true;
    root.classList.remove('has-panel');
    header.inert = false; footer.inert = false; location.inert = false; sliceToolbar.inert = false;
    options.video.pause();
    previousFocus?.focus({ preventScroll: true });
  }
  const escape = (event: KeyboardEvent) => {
    if (event.key === 'Tab' && !panel.hidden) {
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>('button:not([disabled]), video[controls], a[href], [tabindex="0"]')).filter(node => node.getClientRects().length > 0);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    if (event.key === 'Escape' && !panel.hidden) { options.onClose(); closePanel(); }
  };
  document.addEventListener('keydown', escape);
  const error = element('div', 'world-message');
  error.hidden = true;
  error.setAttribute('role', 'alert');
  const errorCopy = element('span', 'message-copy');
  const dismissError = button('×', 'message-dismiss', () => { error.hidden = true; });
  dismissError.setAttribute('aria-label', '关闭提示');
  error.append(errorCopy, dismissError);

  const loading = element('div', 'loading-screen');
  const loadingInner = element('div', 'loading-inner');
  const loadingTitle = element('h2', 'loading-title', '让思想，拥有空间。');
  const loadingMessage = element('p', 'loading-message', '正在准备你的探索之旅');
  const loadingTrack = element('div', 'loading-track');
  loadingTrack.setAttribute('role', 'progressbar');
  loadingTrack.setAttribute('aria-label', '空间加载进度');
  loadingTrack.setAttribute('aria-valuemin', '0');
  loadingTrack.setAttribute('aria-valuemax', '100');
  const loadingFill = element('div', 'loading-fill');
  loadingTrack.append(loadingFill);
  const loadingPercent = element('span', 'loading-percent', '0%');
  loadingInner.append(element('div', 'loading-emblem', '◯'), element('div', 'loading-eyebrow', '天窗访谈馆 / OCULUS MUSEUM'), loadingTitle, loadingMessage, loadingTrack, loadingPercent);
  loading.append(loadingInner);
  root.append(header, location, footer, sliceToolbar, panel, loading, error);

  return {
    /** Progress is normalized from 0 to 1. */
    setLoading(progress: number, message?: string) {
      const percent = Math.round(Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0)) * 100);
      loadingFill.style.width = `${percent}%`;
      loadingPercent.textContent = `${percent}%`;
      loadingTrack.setAttribute('aria-valuenow', String(percent));
      if (message) loadingMessage.textContent = message;
    },
    finishLoading() { loading.hidden = true; },
    setLocation(name: string, description: string) {
      locationEyebrow.textContent = '天窗访谈馆 / 探索现场';
      locationTitle.textContent = name;
      locationDescription.textContent = description;
    },
    setActiveDestination,
    setHint(text: string) { hint.textContent = text; },
    setSliceControls(visible: boolean, title?: string) {
      sliceToolbar.hidden = !visible;
      root.classList.toggle('has-slice-controls', visible);
      if (title !== undefined) sliceTitle.textContent = title;
    },
    openChapter(index: number) {
      const chapter = options.chapters[index];
      if (!chapter) return;
      currentChapter = index;
      previousChapter.disabled = index === 0;
      nextChapter.disabled = index === options.chapters.length - 1;
      chapterStepper.hidden = false;
      panelLabel.textContent = 'CONVERSATION / 访谈原片';
      panelTitle.textContent = chapter.title;
      panelMeta.textContent = `片段 ${String(index + 1).padStart(2, '0')} · 约 ${time(chapter.start)}—${time(chapter.end)}`;
      panelBody.textContent = chapter.summary;
      videoFrame.hidden = false;
      playback.hidden = false;
      source.hidden = true;
      chapterLabel.hidden = false;
      chapterList.hidden = false;
      chapterButtons.forEach((node, i) => {
        node.classList.toggle('is-active', i === index);
        node.setAttribute('aria-pressed', String(i === index));
      });
      openPanel();
      panel.scrollTop = 0;
    },
    closePanel,
    showInsight(title: string, body: string, onSource: () => void) {
      options.video.pause();
      chapterStepper.hidden = true;
      panelLabel.textContent = 'FIELD NOTES / 观点';
      panelTitle.textContent = title;
      panelMeta.textContent = '来自这场对话的思考';
      panelBody.textContent = body;
      videoFrame.hidden = true;
      playback.hidden = true;
      chapterLabel.hidden = true;
      chapterList.hidden = true;
      source.hidden = false;
      sourceHandler = onSource;
      openPanel();
    },
    showPending(label: string) {
      options.video.pause();
      panelLabel.textContent = 'COMING NEXT / 待加入';
      panelTitle.textContent = label;
      panelMeta.textContent = '这间展厅，为下一场对话保留';
      panelBody.textContent = '目前已收录一场真实访谈。新内容加入后，这里将展示独立的嘉宾、观点和视频切片。';
      videoFrame.hidden = true; playback.hidden = true; chapterStepper.hidden = true;
      chapterLabel.hidden = true; chapterList.hidden = true; source.hidden = true;
      openPanel();
    },
    showError(message: string) { errorCopy.textContent = message; error.hidden = false; },
    dispose() {
      document.removeEventListener('keydown', escape);
      options.video.pause();
      root.remove();
    },
  };
}
