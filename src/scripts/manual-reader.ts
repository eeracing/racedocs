import {
  applyLanguage,
  bindLanguageSwitch,
  preserveViewportAnchor,
  type SiteLanguage,
} from './language';

const root = document.documentElement;
const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-manual-section]'));
const tocLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-section-link]'));
const tocPanel = document.querySelector<HTMLElement>('[data-toc-panel]');
const openTocButton = document.querySelector<HTMLButtonElement>('[data-open-toc]');
const readerLayout = document.querySelector<HTMLElement>('.reader-layout');
const siteFooter = document.querySelector<HTMLElement>('.site-footer');

function setTocOpen(open: boolean, restoreFocus = true) {
  if (!tocPanel || !openTocButton) return;
  tocPanel.hidden = !open;
  if (readerLayout) readerLayout.inert = open;
  if (siteFooter) siteFooter.inert = open;
  openTocButton.setAttribute('aria-expanded', String(open));
  openTocButton.setAttribute(
    'aria-label',
    open ? '关闭目录 / Close contents' : '目录 / Table of contents',
  );
  root.classList.toggle('toc-panel-open', open);
  if (open) tocPanel.querySelector<HTMLAnchorElement>('a[href]')?.focus({ preventScroll: true });
  else if (restoreFocus) openTocButton.focus({ preventScroll: true });
}

let activeSectionId = window.location.hash.slice(1) || sections[0]?.id;
let navigationSequence = 0;
let navigationTargetId: string | undefined;
let navigationLockUntil = 0;
let scrollFrame = 0;

function keepActiveTocLinkVisible(link: HTMLAnchorElement) {
  const sidebar = link.closest<HTMLElement>('.reader-sidebar');
  if (!sidebar) return;

  const sidebarRect = sidebar.getBoundingClientRect();
  const linkRect = link.getBoundingClientRect();
  const contextMargin = Math.min(80, sidebarRect.height * 0.2);
  const visibleTop = sidebarRect.top + contextMargin;
  const visibleBottom = sidebarRect.bottom - contextMargin;

  if (linkRect.top >= visibleTop && linkRect.bottom <= visibleBottom) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const linkCenter = linkRect.top + linkRect.height / 2;
  const sidebarCenter = sidebarRect.top + sidebarRect.height / 2;
  sidebar.scrollTo({
    top: sidebar.scrollTop + linkCenter - sidebarCenter,
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
  });
}

function updateActiveSection(sectionId: string | undefined) {
  if (!sectionId) return;
  const sectionChanged = activeSectionId !== sectionId;
  activeSectionId = sectionId;

  for (const link of tocLinks) {
    const isActive = link.dataset.sectionLink === sectionId;
    link.classList.toggle('is-active', isActive);
    if (isActive) {
      link.setAttribute('aria-current', 'location');
      if (sectionChanged) keepActiveTocLinkVisible(link);
    }
    else link.removeAttribute('aria-current');
  }
}

function stickyOffset(): number {
  const chromeHeight =
    document.querySelector<HTMLElement>('.reader-chrome')?.getBoundingClientRect().height ?? 0;
  return chromeHeight + 24;
}

function sectionHeading(section: HTMLElement): HTMLElement {
  return section.querySelector<HTMLElement>('h2, h3') ?? section;
}

function sectionAtReadingLine(): HTMLElement | undefined {
  const readingLine = stickyOffset() + 2;
  let current = sections[0];

  for (const section of sections) {
    if (sectionHeading(section).getBoundingClientRect().top <= readingLine) current = section;
    else break;
  }

  return current;
}

function sectionClosestToReadingLine(): HTMLElement | undefined {
  const readingLine = stickyOffset();
  return sections.reduce<HTMLElement | undefined>((closest, section) => {
    if (!closest) return section;
    const sectionDistance = Math.abs(sectionHeading(section).getBoundingClientRect().top - readingLine);
    const closestDistance = Math.abs(sectionHeading(closest).getBoundingClientRect().top - readingLine);
    return sectionDistance < closestDistance ? section : closest;
  }, undefined);
}

function alignSection(section: HTMLElement, smooth: boolean) {
  const heading = sectionHeading(section);
  const documentTop = heading.getBoundingClientRect().top + window.scrollY;
  const top = documentTop - stickyOffset();
  if (smooth && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.scrollTo({ top, behavior: 'smooth' });
    return;
  }

  const previousScrollBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';
  window.scrollTo({ top, behavior: 'auto' });
  root.style.scrollBehavior = previousScrollBehavior;
}

function cancelNavigation() {
  if (!navigationTargetId && Date.now() >= navigationLockUntil) return;

  navigationSequence += 1;
  navigationTargetId = undefined;
  navigationLockUntil = 0;

  const previousScrollBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';
  window.scrollTo({ top: window.scrollY, behavior: 'auto' });
  root.style.scrollBehavior = previousScrollBehavior;
  syncActiveSectionFromScroll();
}

function syncActiveSectionFromScroll() {
  if (Date.now() < navigationLockUntil) return;
  updateActiveSection(sectionAtReadingLine()?.id);
}

function navigateToSection(
  sectionId: string,
  { smooth = true, updateHash = true, duration = 1600 } = {},
) {
  const section = document.getElementById(sectionId);
  if (!(section instanceof HTMLElement)) return;

  const sequence = ++navigationSequence;
  navigationTargetId = sectionId;
  navigationLockUntil = Date.now() + duration;
  updateActiveSection(sectionId);

  if (updateHash && window.location.hash !== `#${sectionId}`) {
    history.pushState(null, '', `#${sectionId}`);
  }

  alignSection(section, smooth);

  window.setTimeout(() => {
    if (sequence !== navigationSequence) return;
    navigationTargetId = undefined;
    navigationLockUntil = 0;
    syncActiveSectionFromScroll();
  }, duration);
}

function setLanguage(language: SiteLanguage, preservePosition = true) {
  if (language === 'en' && root.dataset.hasEnglish !== 'true') return;

  const currentSection =
    sectionClosestToReadingLine() ?? document.getElementById(activeSectionId);
  const currentHeading =
    currentSection instanceof HTMLElement ? sectionHeading(currentSection) : undefined;
  preserveViewportAnchor(preservePosition ? currentHeading : undefined, () => {
    applyLanguage(language, preservePosition);
    updateActiveSection(currentSection instanceof HTMLElement ? currentSection.id : undefined);
  });
}

bindLanguageSwitch(setLanguage);

setLanguage(root.dataset.language === 'en' ? 'en' : 'zh', false);

for (const link of tocLinks) {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const wasMenuOpen = tocPanel !== null && !tocPanel.hasAttribute('hidden');
    setTocOpen(false, false);
    const sectionId = link.dataset.sectionLink;
    if (sectionId) {
      navigateToSection(sectionId);
      const section = document.getElementById(sectionId);
      if (wasMenuOpen && section instanceof HTMLElement) {
        const heading = sectionHeading(section);
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
    }
  });
}

window.addEventListener(
  'scroll',
  () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      syncActiveSectionFromScroll();
    });
  },
  { passive: true },
);

window.addEventListener('wheel', cancelNavigation, { passive: true });
window.addEventListener('touchstart', cancelNavigation, { passive: true });
window.addEventListener('keydown', (event) => {
  if (
    ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)
  ) {
    cancelNavigation();
  }
});

window.addEventListener('hashchange', () => {
  const sectionId = window.location.hash.slice(1);
  if (sectionId) navigateToSection(sectionId, { smooth: false, updateHash: false });
});

const initialSectionId = window.location.hash.slice(1);
if (initialSectionId) {
  navigateToSection(initialSectionId, {
    smooth: false,
    updateHash: false,
    duration: 2400,
  });
} else {
  syncActiveSectionFromScroll();
}

openTocButton?.addEventListener('click', () => {
  const willOpen = tocPanel?.hasAttribute('hidden') ?? false;
  if (willOpen) cancelNavigation();
  setTocOpen(willOpen);
});

document.addEventListener('keydown', (event) => {
  if (!tocPanel || tocPanel.hasAttribute('hidden')) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    setTocOpen(false);
    return;
  }
  if (event.key !== 'Tab') return;

  const links = Array.from(tocPanel.querySelectorAll<HTMLAnchorElement>('a[href]'));
  const first = links[0];
  const last = links.at(-1);
  if (!first || !last) return;
  if (event.shiftKey && (document.activeElement === first || !tocPanel.contains(document.activeElement))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (document.activeElement === last || !tocPanel.contains(document.activeElement))) {
    event.preventDefault();
    first.focus();
  }
});

window.matchMedia('(max-width: 59.99rem)').addEventListener('change', (event) => {
  if (!event.matches && tocPanel && !tocPanel.hasAttribute('hidden')) {
    setTocOpen(false, false);
    const sidebarLink = document.querySelector<HTMLElement>('.reader-sidebar .manual-toc a.is-active')
      ?? document.querySelector<HTMLElement>('.reader-sidebar .manual-toc a');
    sidebarLink?.focus({ preventScroll: true });
  }
});
