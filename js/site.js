(() => {
  document.documentElement.classList.add('js');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reveals = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.13, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach((item) => observer.observe(item));
  } else {
    reveals.forEach((item) => item.classList.add('is-visible'));
  }

  const parallaxItems = [...document.querySelectorAll('[data-parallax]')];
  let ticking = false;

  const updateParallax = () => {
    const viewport = window.innerHeight;
    parallaxItems.forEach((item) => {
      const rect = item.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < viewport) {
        const centerOffset = rect.top + rect.height / 2 - viewport / 2;
        const rate = Number(item.dataset.parallax || 0);
        item.style.setProperty('--parallax-y', `${centerOffset * -rate}px`);
      }
    });
    ticking = false;
  };

  const requestParallax = () => {
    if (!ticking && !reducedMotion.matches) {
      window.requestAnimationFrame(updateParallax);
      ticking = true;
    }
  };

  if (parallaxItems.length) {
    updateParallax();
    window.addEventListener('scroll', requestParallax, { passive: true });
    window.addEventListener('resize', requestParallax, { passive: true });
  }
})();
