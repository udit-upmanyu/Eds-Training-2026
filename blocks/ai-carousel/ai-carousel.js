/* carousel.js */

export default function decorate(block) {
  /*
    EDS structure:

    .carousel
      > div (hero row)
      > div (card row)
  */

  const rows = [...block.querySelectorAll(':scope > div')];

  /* =========================
     HERO CONTENT
  ========================= */
  const heroRow = rows[0];
  const heroCell = heroRow?.querySelector(':scope > div');

  const heroParagraphs = heroCell
    ? [...heroCell.querySelectorAll('p')]
    : [];

  const heroTitle = heroParagraphs[0]?.textContent.trim() || '';
  const heroDesc = heroParagraphs[1]?.innerHTML || '';

  /* =========================
     EXTRACT ALL CARDS
  ========================= */
  const cards = [];

  rows.slice(1).forEach((row) => {
    [...row.querySelectorAll(':scope > div')].forEach((cell) => {
      if (!cell.textContent.trim()) return;

      const title = cell.querySelector('strong')?.textContent.trim() || '';
      const paragraphs = [...cell.querySelectorAll('p')];

      const descElement = paragraphs.find(
        (p) => !p.querySelector('strong') && !p.querySelector('a'),
      );

      const desc = descElement?.innerHTML || '';
      const link = cell.querySelector('a');

      const linkHTML = link
        ? `
          <a
            href="${link.href}"
            target="_blank"
            rel="noopener"
            class="dell-ai-carousel-card-link"
          >
            ${link.textContent.trim()}
          </a>
        `
        : '';

      if (title || desc) {
        cards.push({
          title,
          desc,
          linkHTML,
        });
      }
    });
  });

  /* =========================
     HELPERS
  ========================= */

  function getCardsPerView() {
    const width = window.innerWidth;
    if (width >= 1500) return 3;
    if (width >= 1024) return 2;
    if (width >= 768) return 2;
    return 1;
  }

  function chunkArray(arr, size) {
    const result = [];

    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }

    return result;
  }

  function cardTemplate(card) {
    return `
      <article class="dell-ai-carousel-card">
        <h3 class="dell-ai-carousel-card-title">
          ${card.title}
        </h3>

        <div class="dell-ai-carousel-card-desc">
          ${card.desc}
        </div>

        ${card.linkHTML}
      </article>
    `;
  }

  function buildSlides(cardsPerView) {
    const grouped = chunkArray(cards, cardsPerView);

    return grouped
      .map(
        (group) => `
          <div class="dell-ai-carousel-slide">
            ${group.map(cardTemplate).join('')}
          </div>
        `,
      )
      .join('');
  }

  function buildDots(total, activeIndex) {
    return Array.from({ length: total }, (_, i) => `
      <button
        class="dell-ai-carousel-dot ${i === activeIndex ? 'dell-ai-carousel-dot-active' : ''}"
        aria-label="Go to slide ${i + 1}"
        data-index="${i}"
      ></button>
    `).join('');
  }

  /* =========================
     ROOT CLASS
  ========================= */

  block.classList.add('dell-ai-carousel');

  /* =========================
     INITIAL MARKUP
  ========================= */

  block.innerHTML = `
    <div class="dell-ai-carousel-hero">
      <h2 class="dell-ai-carousel-hero-title">
        ${heroTitle}
      </h2>

      <div class="dell-ai-carousel-hero-desc">
        ${heroDesc}
      </div>
    </div>

    <div class="dell-ai-carousel-shell">

      <button
        class="dell-ai-carousel-arrow dell-ai-carousel-arrow-prev"
        aria-label="Previous slide"
      >
        &#8592;
      </button>

      <div class="dell-ai-carousel-track-wrapper">
        <div class="dell-ai-carousel-track"></div>
      </div>

      <button
        class="dell-ai-carousel-arrow dell-ai-carousel-arrow-next"
        aria-label="Next slide"
      >
        &#8594;
      </button>

    </div>

    <div class="dell-ai-carousel-dots"></div>
  `;

  /* =========================
     ELEMENT REFERENCES
  ========================= */

  const track = block.querySelector('.dell-ai-carousel-track');
  const dotsContainer = block.querySelector('.dell-ai-carousel-dots');
  const prevButton = block.querySelector('.dell-ai-carousel-arrow-prev');
  const nextButton = block.querySelector('.dell-ai-carousel-arrow-next');

  /* =========================
     STATE
  ========================= */

  let currentSlide = 0;
  let cardsPerView = getCardsPerView();
  let totalSlides = 0;

  /* =========================
     NAVIGATION
  ========================= */

  function updateUI() {
    track.style.transform = `translateX(-${currentSlide * 100}%)`;

    dotsContainer
      .querySelectorAll('.dell-ai-carousel-dot')
      .forEach((dot, index) => {
        dot.classList.toggle(
          'dell-ai-carousel-dot-active',
          index === currentSlide,
        );
      });

    prevButton.disabled = currentSlide === 0;
    nextButton.disabled = currentSlide === totalSlides - 1;
  }

  function goToSlide(index) {
    currentSlide = Math.max(0, Math.min(index, totalSlides - 1));
    updateUI();
  }

  /* =========================
     BUILD CAROUSEL
  ========================= */

  function buildCarousel() {
    cardsPerView = getCardsPerView();

    const groupedSlides = chunkArray(cards, cardsPerView);

    totalSlides = groupedSlides.length;

    track.innerHTML = buildSlides(cardsPerView);

    dotsContainer.innerHTML = buildDots(totalSlides, currentSlide);

    dotsContainer
      .querySelectorAll('.dell-ai-carousel-dot')
      .forEach((dot) => {
        dot.addEventListener('click', () => {
          goToSlide(Number(dot.dataset.index));
        });
      });

    if (currentSlide >= totalSlides) {
      currentSlide = totalSlides - 1;
    }

    updateUI();
  }

  /* =========================
     ARROWS
  ========================= */

  prevButton.addEventListener('click', () => {
    goToSlide(currentSlide - 1);
  });

  nextButton.addEventListener('click', () => {
    goToSlide(currentSlide + 1);
  });

  /* =========================
     TOUCH SWIPE
  ========================= */

  let touchStartX = 0;

  track.addEventListener(
    'touchstart',
    (e) => {
      touchStartX = e.touches[0].clientX;
    },
    { passive: true },
  );

  track.addEventListener(
    'touchend',
    (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX - touchEndX;

      if (Math.abs(diff) < 50) return;

      if (diff > 0) {
        goToSlide(currentSlide + 1);
      } else {
        goToSlide(currentSlide - 1);
      }
    },
    { passive: true },
  );

  /* =========================
     RESPONSIVE REBUILD
  ========================= */

  let resizeTimer;

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(() => {
      const updatedCPV = getCardsPerView();

      if (updatedCPV !== cardsPerView) {
        currentSlide = 0;
        buildCarousel();
      }
    }, 150);
  });

  /* =========================
     INITIALIZE
  ========================= */

  buildCarousel();
}
