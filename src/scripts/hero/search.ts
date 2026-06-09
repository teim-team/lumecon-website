/**
 * Workspace search.
 *
 * Autocomplete over the union of 50 states + counties + AIANNH tribal
 * lands. Filters as the user types, ranks by start-of-name first then
 * substring; ↑↓/Enter/Esc keyboard nav; on select, fires the same
 * runStudy a click on that geography would.
 */
import { searchIndex, states, tribalLookup } from './data';
import type { RunOpts, SearchEntry } from './types';

export type SearchDeps = {
  stage: HTMLElement;
  runStudy: (stateId: string, opts?: RunOpts) => Promise<void>;
  /** Back the auto-cycle off so the user-fired study isn't overwritten. */
  suspendAutoCycle: () => void;
  loadAiannh: () => Promise<void>;
  clearReservationHighlight: () => void;
  highlightCountiesOverlappingAiannh: (el: SVGGraphicsElement) => void;
};

export const initSearch = (deps: SearchDeps) => {
  const searchEl = document.getElementById('workspaceSearch') as HTMLElement | null;
  const searchInput = document.getElementById('workspaceSearchInput') as HTMLInputElement | null;
  const searchPanel = document.getElementById('workspaceSearchPanel') as HTMLUListElement | null;
  const searchClear = document.getElementById('workspaceSearchClear') as HTMLButtonElement | null;
  if (!searchEl || !searchInput || !searchPanel || !searchClear || !searchIndex.length) return;

  let matches: SearchEntry[] = [];
  let activeIdx = -1;

  const escapeHtml = (s: string) =>
    s.replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
    );
  const highlight = (text: string, q: string) => {
    if (!q) return escapeHtml(text);
    const i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return escapeHtml(text);
    return (
      escapeHtml(text.slice(0, i)) +
      '<mark>' +
      escapeHtml(text.slice(i, i + q.length)) +
      '</mark>' +
      escapeHtml(text.slice(i + q.length))
    );
  };

  const rank = (q: string): SearchEntry[] => {
    const ql = q.trim().toLowerCase();
    if (!ql) return [];
    const scored: Array<{ s: number; e: SearchEntry }> = [];
    for (const e of searchIndex) {
      const nl = e.name.toLowerCase();
      let s = 0;
      if (nl === ql) s = 100;
      else if (nl.startsWith(ql)) s = 60;
      else if (nl.split(/\s+/).some((w) => w.startsWith(ql))) s = 40;
      else if (nl.includes(ql)) s = 20;
      else if (e.sub.toLowerCase().includes(ql)) s = 8;
      if (s > 0) {
        // States rank slightly above tribal at the same score for
        // partial matches, since a search for "wa" should surface
        // Washington before all the AIANNH lands containing "wa".
        if (e.type === 'state') s += 4;
        scored.push({ s, e });
      }
    }
    scored.sort((a, b) => b.s - a.s || a.e.name.length - b.e.name.length);
    return scored.slice(0, 8).map((x) => x.e);
  };

  const closePanel = () => {
    searchPanel.hidden = true;
    searchInput.setAttribute('aria-expanded', 'false');
    activeIdx = -1;
  };
  const openPanel = () => {
    searchPanel.hidden = false;
    searchInput.setAttribute('aria-expanded', 'true');
  };
  const renderPanel = (q: string) => {
    if (!matches.length) {
      closePanel();
      return;
    }
    const html = matches
      .map(
        (m, i) => `
      <li class="workspace-search__item ${i === activeIdx ? 'is-active' : ''}"
          role="option"
          aria-selected="${i === activeIdx}"
          data-idx="${i}">
        <span class="workspace-search__kind workspace-search__kind--${m.type}" aria-hidden="true">
          ${
            m.type === 'state'
              ? '<svg viewBox="0 0 16 16"><path d="M2 4 L7 2 L12 4 L14 7 L13 12 L8 14 L3 12 L1 8 Z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>'
              : m.type === 'county'
                ? '<svg viewBox="0 0 16 16"><rect x="2.5" y="2.5" width="11" height="11" rx="1" fill="none" stroke="currentColor" stroke-width="1.3"/><line x1="2.5" y1="8" x2="13.5" y2="8" stroke="currentColor" stroke-width="1"/><line x1="8" y1="2.5" x2="8" y2="13.5" stroke="currentColor" stroke-width="1"/></svg>'
                : '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" stroke-width="1.3"/><circle cx="8" cy="8" r="2" fill="currentColor"/></svg>'
          }
        </span>
        <span class="workspace-search__meta">
          <span class="workspace-search__name">${highlight(m.name, q)}</span>
          <span class="workspace-search__sub">${escapeHtml(m.sub)}</span>
        </span>
      </li>`,
      )
      .join('');
    searchPanel.innerHTML = html;
    openPanel();
  };

  const fireMatch = (m: SearchEntry) => {
    searchInput.value = m.name;
    closePanel();
    deps.suspendAutoCycle();
    if (m.type === 'state') {
      void deps.runStudy(m.id, { level: 'state' });
    } else if (m.type === 'county') {
      // County selection: fire at county level with the county
      // centroid as the source point, and pass containingCountyFips
      // (the same FIPS) so retention applies the county-tier logic.
      // Custom chip text so the header reads "Travis County, TX"
      // instead of falling back to the parent state's name.
      const stateCode = states[m.stateFips]?.code || '';
      const label = stateCode ? `${m.name}, ${stateCode}` : m.name;
      void deps.runStudy(m.stateFips, {
        level: 'county',
        sourcePoint: { cx: m.cx, cy: m.cy },
        containingCountyFips: m.id,
        chip: label,
        framing: `A study in ${label}.`,
      });
    } else {
      // Tribal selection: resolve the containing county FIPS via
      // the tribalLookup if we have it; otherwise the leakage just
      // distributes through the state pool without sub-state hint.
      let containingCountyFips: string | undefined;
      for (const t of Object.values(tribalLookup)) {
        if (Math.hypot(t.cx - m.cx, t.cy - m.cy) < 5) {
          containingCountyFips = t.countyFips;
          break;
        }
      }
      // Light the searched reservation + every county it overlaps.
      // We have to wait until AIANNH polygons are in the DOM, which
      // happens lazily, so kick off the load and apply once ready.
      deps.clearReservationHighlight();
      void deps.loadAiannh().then(() => {
        const el = deps.stage.querySelector<SVGGraphicsElement>(
          `.hero-aiannh[data-fips="${m.fips}"]`,
        );
        if (el) {
          el.setAttribute('data-active', '1');
          deps.highlightCountiesOverlappingAiannh(el);
        }
      });
      void deps.runStudy(m.fips, {
        level: 'reservation',
        sourcePoint: { cx: m.cx, cy: m.cy },
        chip: m.name,
        framing: `A study on ${m.name}.`,
        ...(containingCountyFips ? { containingCountyFips } : {}),
      });
    }
  };

  searchInput.addEventListener('input', () => {
    const q = searchInput.value;
    searchClear.hidden = q.length === 0;
    matches = rank(q);
    activeIdx = matches.length ? 0 : -1;
    renderPanel(q);
  });

  searchInput.addEventListener('keydown', (e) => {
    if (searchPanel.hidden && (e.key === 'ArrowDown' || e.key === 'ArrowUp') && searchInput.value) {
      matches = rank(searchInput.value);
      if (matches.length) {
        activeIdx = 0;
        renderPanel(searchInput.value);
        e.preventDefault();
        return;
      }
    }
    if (!matches.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIdx = (activeIdx + 1) % matches.length;
      renderPanel(searchInput.value);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIdx = (activeIdx - 1 + matches.length) % matches.length;
      renderPanel(searchInput.value);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0 && matches[activeIdx]) fireMatch(matches[activeIdx]);
    } else if (e.key === 'Escape') {
      closePanel();
      searchInput.blur();
    }
  });

  searchPanel.addEventListener('mousedown', (e) => {
    // mousedown not click so we beat the input's blur handler
    const li = (e.target as Element | null)?.closest(
      '.workspace-search__item',
    ) as HTMLElement | null;
    if (!li) return;
    const idx = Number(li.dataset.idx);
    if (Number.isFinite(idx) && matches[idx]) fireMatch(matches[idx]);
  });
  searchPanel.addEventListener('mousemove', (e) => {
    const li = (e.target as Element | null)?.closest(
      '.workspace-search__item',
    ) as HTMLElement | null;
    if (!li) return;
    const idx = Number(li.dataset.idx);
    if (Number.isFinite(idx) && idx !== activeIdx) {
      activeIdx = idx;
      renderPanel(searchInput.value);
    }
  });

  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchClear.hidden = true;
    closePanel();
    searchInput.focus();
  });

  document.addEventListener('click', (e) => {
    if (!searchEl.contains(e.target as Node)) closePanel();
  });

  searchInput.addEventListener('focus', () => {
    if (searchInput.value && matches.length) openPanel();
  });
};
