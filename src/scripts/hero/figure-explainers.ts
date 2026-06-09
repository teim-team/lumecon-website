/**
 * Per-figure metric explanations.
 *
 * Each figure (Direct / Indirect / Induced / Total / Jobs) gets an
 * info button. Activating it expands a tiny info block with a
 * one-sentence definition plus a qualifier derived from the current
 * run's activity (read off the stage's data attributes, which
 * runStudy() keeps up to date).
 */

const FIG_DEFS: Record<string, string> = {
  direct:
    'First-round spending that lands in the analysis region. Capital expenditure (construction, equipment), operating payroll, and contracts paid to local vendors all count. Taxes paid out to federal or non-local governments do not (they leak out of the region; fiscal impact is a separate analysis).',
  indirect:
    'Supplier spending. Money the direct recipients spend with vendors, contractors, and suppliers inside the region.',
  induced:
    'Household spending. Wages earned by direct and indirect workers, spent locally on rent, groceries, services.',
  total: 'Direct + Indirect + Induced. The full economic impact across the region.',
  jobs: "Estimated jobs supported across direct, indirect, and induced activity, derived from a per-million-dollars factor for the scenario's activity type.",
};

// Level-specific assumption notes. Hint at how the model adapts
// for smaller regions without giving away the full methodology.
const LEVEL_NOTES: Record<string, Record<string, string>> = {
  direct: {
    county:
      'County scope: only spending inside the county counts. Inter-county transfers in the same metro are treated as leakage.',
    reservation:
      'On-reservation only. Federal contracts assigned to a tribal entity count even when executed off-reservation.',
  },
  indirect: {
    county:
      'Multipliers are FLQ-adjusted downward for the thinner local supplier base. Out-of-county supplier spend is leakage.',
    reservation:
      'Reservation supply chains are typically shallow, so indirect effects leak heavily to the containing county and across state lines. Adjusted accordingly.',
  },
  induced: {
    county:
      "Workers' household spending inside the county only. Commuter spend in adjacent counties is leakage.",
    reservation:
      'Split between on-reservation households and commuters from off-reservation, weighted by employment patterns for the industry.',
  },
};

export const initFigureExplainers = (stage: HTMLElement) => {
  const figureButtons = document.querySelectorAll<HTMLElement>('.hero-fig');
  figureButtons.forEach((cell) => {
    const key = cell.dataset.k;
    if (!key || !FIG_DEFS[key]) return;
    const dt = cell.querySelector('dt');
    if (!dt) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hero-fig__info';
    btn.setAttribute('aria-label', `What is ${dt.textContent}?`);
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = 'i';
    dt.appendChild(btn);

    const panel = document.createElement('div');
    panel.className = 'hero-fig__expl';
    panel.setAttribute('role', 'region');
    panel.hidden = true;
    cell.appendChild(panel);

    const renderPanel = () => {
      const def = FIG_DEFS[key];
      // Activity-specific qualifier without the raw multiplier — the
      // marketing surface should describe the methodology in words,
      // not hand out the calibration numbers. The real product
      // exposes them; this is the public hero.
      let mult = '';
      const al = stage.dataset.actLabel;
      if (key === 'indirect' && al)
        mult = `Calibrated to the supplier mix of a typical <strong>${al}</strong>.`;
      else if (key === 'induced' && al)
        mult = `Calibrated to the worker-spending pattern of a typical <strong>${al}</strong>.`;
      else if (key === 'jobs' && al)
        mult = `Employment per dollar of activity is sector-specific; this run uses the <strong>${al}</strong> profile.`;
      else if (key === 'total' && al)
        mult = `Sum of the three rounds for this <strong>${al}</strong>.`;
      // Level-specific note: shows when the current study is at
      // county or reservation level and the figure has a note for
      // that level. State-level studies don't get an addendum
      // (the base text is already state-default).
      const lvl = stage.dataset.studyLevel || 'state';
      const lvlNote = LEVEL_NOTES[key]?.[lvl] ?? '';
      panel.innerHTML =
        `<p>${def}</p>` +
        (lvlNote ? `<p class="hero-fig__note">${lvlNote}</p>` : '') +
        (mult ? `<p class="hero-fig__mult">${mult}</p>` : '');
    };

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = panel.hidden;
      // Close any other open panels.
      figureButtons.forEach((other) => {
        if (other === cell) return;
        const p = other.querySelector<HTMLElement>('.hero-fig__expl');
        const b = other.querySelector<HTMLButtonElement>('.hero-fig__info');
        if (p) p.hidden = true;
        if (b) b.setAttribute('aria-expanded', 'false');
      });
      if (open) renderPanel();
      panel.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
    });
  });
  document.addEventListener('click', (e) => {
    // Close all panels when clicking outside.
    const t = e.target as Element | null;
    if (t && t.closest('.hero-fig')) return;
    figureButtons.forEach((cell) => {
      const p = cell.querySelector<HTMLElement>('.hero-fig__expl');
      const b = cell.querySelector<HTMLButtonElement>('.hero-fig__info');
      if (p) p.hidden = true;
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  });
};
