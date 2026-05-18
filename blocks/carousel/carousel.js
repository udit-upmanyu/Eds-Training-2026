/* carousel.js */

export default function decorate(block) {
  /*
    Expected table structure in the document:
    ┌─────────────────────────────────────────────────────┐
    │  Hero Heading (colspan 2 or single cell)            │
    ├─────────────────────────────────────────────────────┤
    │  Hero Paragraph (colspan 2 or single cell)          │
    ├──────────────────────┬──────────────────────────────┤
    │  Card Title          │  Card Title                  │
    ├──────────────────────┼──────────────────────────────┤
    │  Card Description    │  Card Description            │
    ├──────────────────────┼──────────────────────────────┤
    │  Card Link           │  Card Link                   │
    └──────────────────────┴──────────────────────────────┘

    Rows are grouped as:
      - Rows where the first cell spans all columns → hero content
      - Remaining rows in groups of 3 (title, desc, link) → one card each column
  */

  const rows = [...block.querySelectorAll(':scope > div')];

  /* ── 1. Separate hero rows from card-data rows ── */
  const heroRows = [];
  const cardRows = [];

  rows.forEach((row) => {
    const cells = [...row.querySelectorAll(':scope > div')];
    /* A hero row has only one cell (the author set colspan, EDS renders it as single div) */
    if (cells.length === 1) {
      heroRows.push(cells[0]);
    } else {
      cardRows.push(cells);
    }
  });

  /* ── 2. Build hero HTML ── */
  let heroHTML = '';
  heroRows.forEach((cell) => {
    const el = cell.firstElementChild;
    if (el && el.tagName.match(/^H[1-6]$/)) {
      heroHTML += `<h2>${el.innerHTML}</h2>`;
    } else {
      heroHTML += `<p>${cell.innerHTML}</p>`;
    }
  });

  /* ── 3. Derive cards from column data ──
     cardRows is an array of arrays: each inner array is one table row,
     each item in the inner array is a cell (one per card column).

     We transpose: columns become cards.
     cardRows[0] = [titleCell_card1, titleCell_card2, ...]
     cardRows[1] = [descCell_card1,  descCell_card2,  ...]
     cardRows[2] = [linkCell_card1,  linkCell_card2,  ...]
  */
  const numCols = cardRows[0] ? cardRows[0].length : 0;
  const cards = [];

  for (let col = 0; col < numCols; col++) {
    const titleCell = cardRows[0]?.[col];
    const descCell  = cardRows[1]?.[col];
    const linkCell  = cardRows[2]?.[col];

    const title = titleCell ? titleCell.textContent.trim() : '';
    const desc  = descCell  ? descCell.innerHTML.trim()  : '';

    let linkHTML = '';
    if (linkCell) {
      const anchor = linkCell.querySelector('a');
      if (anchor) {
        linkHTML = `<a href="${anchor.href}" target="_blank" rel="noopener">${anchor.textContent.trim()}</a>`;
      }
    }

    cards.push({ title, desc, linkHTML });
  }

  /* ── 4. Build carousel DOM ── */
  const cardsPerView = 2; /* show 2 cards at a time on desktop */
  const totalSlides  = Math.ceil(cards.length / cardsPerView);

  const trackHTML = cards.map(({ title, desc, linkHTML }) => `
    <div class="carousel-card">
      <h3>${title}</h3>
      <p>${desc}</p>
      ${linkHTML}
    </div>
  `).join('');

  const dotsHTML = Array.from({ length: totalSlides }, (_, i) =>
    `<button class="carousel-dot${i === 0 ? ' active' : ''}" aria-label="Go to slide ${i + 1}" data-index="${i}"></button>`
  ).join('');

  block.innerHTML = `
    <div class="carousel-hero">${heroHTML}</div>
    <div class="carousel-track-wrapper">
      <button class="carousel-nav prev" aria-label="Previous">&#8592;</button>
      <div class="carousel-track">${trackHTML}</div>
      <button class="carousel-nav next" aria-label="Next">&#8594;</button>
    </div>
    <div class="carousel-dots">${dotsHTML}</div>
  `;

  /* ── 5. Wire up interactivity ── */
  const track  = block.querySelector('.carousel-track');
  const dots   = [...block.querySelectorAll('.carousel-dot')];
  const btnPrev = block.querySelector('.carousel-nav.prev');
  const btnNext = block.querySelector('.carousel-nav.next');

  let currentSlide = 0;

  function getSlideWidth() {
    /* Width of cardsPerView cards + their gap, used as one slide's scroll distance */
    const card = track.querySelector('.carousel-card');
    if (!card) return 0;
    const gap = 24; /* must match CSS gap */
    return (card.offsetWidth + gap) * cardsPerView;
  }

  function goTo(index) {
    const maxSlide = totalSlides - 1;
    currentSlide = Math.max(0, Math.min(index, maxSlide));
    track.style.transform = `translateX(-${currentSlide * getSlideWidth()}px)`;
    dots.forEach((dot, i) => dot.classList.toggle('active', i === currentSlide));
  }

  btnPrev.addEventListener('click', () => goTo(currentSlide - 1));
  btnNext.addEventListener('click', () => goTo(currentSlide + 1));
  dots.forEach((dot) => {
    dot.addEventListener('click', () => goTo(Number(dot.dataset.index)));
  });

  /* Recalculate on resize so translate values stay correct */
  window.addEventListener('resize', () => goTo(currentSlide));
}