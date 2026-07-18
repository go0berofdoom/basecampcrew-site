(() => {
  document.documentElement.classList.add('js-enabled');

  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);

  const splitWords = (element) => {
    if (!element || element.dataset.wordsSplit) return;
    element.dataset.wordsSplit = 'true';
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    textNodes.forEach((node) => {
      if (!node.textContent.trim()) return;
      const fragment = document.createDocumentFragment();
      node.textContent.match(/\s+|\S+/g)?.forEach((word) => {
        if (/^\s+$/.test(word)) {
          fragment.appendChild(document.createTextNode(word));
          return;
        }
        const span = document.createElement('span');
        span.className = 'motion-word';
        span.textContent = word;
        fragment.appendChild(span);
      });
      node.replaceWith(fragment);
    });
  };

  const splitCharacters = (element) => {
    if (!element || element.dataset.charactersSplit) return;
    element.dataset.charactersSplit = 'true';
    const fragment = document.createDocumentFragment();
    [...element.textContent].forEach((character) => {
      if (/\s/.test(character)) {
        fragment.appendChild(document.createTextNode(character));
        return;
      }
      const span = document.createElement('span');
      span.className = 'typed-char';
      span.textContent = character;
      fragment.appendChild(span);
    });
    element.replaceChildren(fragment);
  };

  document.querySelectorAll('h1, h2').forEach(splitWords);
  document.querySelectorAll('.call-transcript > *').forEach(splitCharacters);

  const animateHeading = (heading, mobile) => {
    const words = heading.querySelectorAll('.motion-word');
    gsap.from(words, {
      opacity: 0,
      y: mobile ? 16 : 28,
      '--word-blur': mobile ? '0px' : '7px',
      duration: mobile ? 0.62 : 0.86,
      stagger: mobile ? 0.035 : 0.055,
      ease: 'power3.out',
      scrollTrigger: { trigger: heading, start: 'top 88%', once: true }
    });
  };

  const setupEntrances = (mobile) => {
    const hero = gsap.timeline({ defaults: { ease: 'power3.out' } });
    hero
      .from('.hero-copy .eyebrow', { opacity: 0, y: 14, duration: 0.55 })
      .from('.hero-copy h1 .motion-word', {
        opacity: 0,
        y: mobile ? 18 : 34,
        '--word-blur': mobile ? '0px' : '8px',
        duration: mobile ? 0.65 : 0.9,
        stagger: 0.06
      }, '-=0.3')
      .from('.hero-copy .lede, .hero-actions', { opacity: 0, y: 18, duration: 0.65, stagger: 0.1 }, '-=0.48')
      .from('.hero-art', { opacity: 0, x: mobile ? 0 : 26, y: 16, duration: 0.9 }, '-=0.72')
      .from('.hero-scene .rv', {
        opacity: 0,
        y: -18,
        rotation: -1.5,
        transformOrigin: '50% 100%',
        duration: 0.75,
        stagger: 0.13,
        ease: 'power2.out'
      }, '-=0.56');

    document.querySelectorAll('.section-copy h2, .availability-heading h2, .ai-intro h2, .closing-copy h2')
      .forEach((heading) => animateHeading(heading, mobile));

    document.querySelectorAll('.section-copy, .availability-heading, .ai-intro').forEach((block) => {
      const supportingCopy = block.querySelectorAll(':scope > .kicker, :scope > p:not(.kicker), :scope > .micro-proof');
      gsap.from(supportingCopy, {
        opacity: 0,
        y: mobile ? 14 : 20,
        duration: 0.7,
        stagger: 0.09,
        ease: 'power2.out',
        scrollTrigger: { trigger: block, start: 'top 86%', once: true }
      });
    });

    document.querySelectorAll('.plan-art, .discover-art, .search-stage, .call-stage').forEach((vignette) => {
      gsap.from(vignette, {
        opacity: 0,
        y: mobile ? 24 : 48,
        scale: mobile ? 1 : 0.985,
        duration: mobile ? 0.72 : 0.95,
        ease: 'power3.out',
        scrollTrigger: { trigger: vignette, start: 'top 87%', once: true }
      });
    });

    gsap.from('.feature-list li', {
      opacity: 0,
      x: -18,
      duration: 0.58,
      stagger: 0.11,
      ease: 'power2.out',
      scrollTrigger: { trigger: '.feature-list', start: 'top 87%', once: true }
    });

    gsap.from('.poll-check', {
      opacity: 0,
      scale: 0.25,
      rotation: -18,
      transformOrigin: '50% 50%',
      duration: 0.38,
      stagger: 0.14,
      ease: 'back.out(2.4)',
      scrollTrigger: { trigger: '.poll-card', start: 'top 78%', once: true }
    });

    gsap.from('.availability-pill', {
      opacity: 0,
      scale: 0.9,
      duration: 0.52,
      stagger: 0.14,
      ease: 'back.out(1.9)',
      scrollTrigger: { trigger: '.search-results', start: 'top 82%', once: true }
    });

    gsap.from('.result-svg-row', {
      opacity: 0,
      y: 12,
      duration: 0.5,
      stagger: 0.1,
      ease: 'power2.out',
      scrollTrigger: { trigger: '.search-results', start: 'top 84%', once: true }
    });

    ScrollTrigger.batch('.ai-card', {
      start: 'top 86%',
      once: true,
      onEnter: (cards) => gsap.from(cards, {
        opacity: 0,
        y: mobile ? 18 : 34,
        duration: 0.72,
        stagger: 0.13,
        ease: 'power3.out'
      })
    });

    gsap.from('.ai-footnote', {
      opacity: 0,
      y: 10,
      duration: 0.55,
      scrollTrigger: { trigger: '.ai-footnote', start: 'top 92%', once: true }
    });

    gsap.from('.closing-copy > .kicker, .closing-lede, .closing-copy .app-badge', {
      opacity: 0,
      y: mobile ? 14 : 22,
      duration: 0.68,
      stagger: 0.1,
      ease: 'power2.out',
      scrollTrigger: { trigger: '.closing-copy', start: 'top 84%', once: true }
    });
  };

  const setupJourney = () => {
    const thread = document.querySelector('.journey-thread');
    const maskPath = document.querySelector('.journey-mask-path');
    const marker = document.querySelector('.journey-rv');
    if (!thread || !maskPath || !marker) return () => {};

    const pathLength = maskPath.getTotalLength();
    const routeState = { progress: 0 };
    marker.removeAttribute('transform');

    const placeMarker = () => {
      const distance = pathLength * routeState.progress;
      const point = maskPath.getPointAtLength(distance);
      const nextPoint = maskPath.getPointAtLength(Math.min(pathLength, distance + 2));
      const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * 180 / Math.PI;
      marker.setAttribute('transform', `translate(${point.x} ${point.y}) rotate(${angle})`);
    };

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: thread,
        start: 'top 88%',
        end: 'bottom 18%',
        scrub: 0.65
      }
    });
    timeline
      .fromTo(maskPath, { strokeDasharray: pathLength, strokeDashoffset: pathLength }, { strokeDasharray: pathLength, strokeDashoffset: 0, ease: 'none' }, 0)
      .fromTo(routeState, { progress: 0 }, { progress: 1, ease: 'none', onUpdate: placeMarker }, 0);
    placeMarker();
    return () => marker.setAttribute('transform', 'translate(374 4200)');
  };

  const setupDesktopMotion = () => {
    const playWhileVisible = (trigger, tweens) => ScrollTrigger.create({
      trigger,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: ({ isActive }) => tweens.forEach((tween) => isActive ? tween.play() : tween.pause())
    });
    const heroAmbient = [
      gsap.to('.cloud-one', { x: 34, duration: 24, repeat: -1, yoyo: true, ease: 'sine.inOut', paused: true }),
      gsap.to('.cloud-two', { x: -26, duration: 29, repeat: -1, yoyo: true, ease: 'sine.inOut', paused: true }),
      gsap.to('.cloud-three', { x: 18, duration: 21, repeat: -1, yoyo: true, ease: 'sine.inOut', paused: true }),
      gsap.to('.sun-halo', { scale: 1.14, opacity: 0.2, duration: 3.8, repeat: -1, yoyo: true, ease: 'sine.inOut', paused: true })
    ];
    playWhileVisible('.hero', heroAmbient);

    const resetJourney = setupJourney();

    gsap.to('.availability', {
      '--sky-mix': '100%',
      ease: 'none',
      scrollTrigger: { trigger: '.availability', start: '52% 74%', end: 'bottom 20%', scrub: true }
    });

    gsap.from('.stars', {
      opacity: 0,
      scale: 0.92,
      stagger: 0.2,
      ease: 'none',
      scrollTrigger: { trigger: '.ai-section', start: 'top 92%', end: 'top 28%', scrub: true }
    });

    const starTwinkle = gsap.fromTo('.stars circle', { opacity: 0.38 }, {
      opacity: 1,
      duration: 4.2,
      stagger: { each: 0.18, from: 'random' },
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      paused: true
    });
    playWhileVisible('.ai-section', [starTwinkle]);

    const cardParallax = gsap.timeline({
      scrollTrigger: { trigger: '.discover', start: 'top bottom', end: 'bottom top', scrub: 0.8 }
    });
    cardParallax
      .to('.resort-back', { yPercent: -14, ease: 'none' }, 0)
      .to('.resort-front', { yPercent: -6, ease: 'none' }, 0)
      .to('.catalog-seal', { yPercent: -18, ease: 'none' }, 0);

    const floatingAvatars = gsap.utils.toArray('.floating-avatar');
    gsap.to(floatingAvatars[0], {
      y: -20,
      scrollTrigger: { trigger: '.plan-art', start: 'top bottom', end: 'bottom top', scrub: 0.7 }
    });
    gsap.to(floatingAvatars[1], {
      y: 24,
      scrollTrigger: { trigger: '.plan-art', start: 'top bottom', end: 'bottom top', scrub: 0.7 }
    });

    const transcript = gsap.timeline({
      scrollTrigger: { trigger: '.call-card', start: 'top 70%', once: true }
    });
    transcript
      .from('.call-transcript > span .typed-char', { opacity: 0, y: 4, duration: 0.025, stagger: 0.022, ease: 'none' })
      .from('.call-transcript > strong .typed-char', { opacity: 0, y: 5, duration: 0.03, stagger: 0.024, ease: 'none' }, '+=0.18')
      .from('.call-success', { opacity: 0, y: 14, scale: 0.86, duration: 0.62, ease: 'back.out(1.9)' }, '+=0.12');

    const firePulse = gsap.to('.fire-glow', {
      scale: 1.12,
      opacity: 0.24,
      duration: 2.9,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      paused: true
    });
    ScrollTrigger.create({
      trigger: '.campfire',
      start: 'top bottom',
      end: 'bottom top',
      onEnter: () => firePulse.play(),
      onEnterBack: () => firePulse.play(),
      onLeave: () => firePulse.pause(),
      onLeaveBack: () => firePulse.pause()
    });

    const closingParallax = gsap.timeline({
      scrollTrigger: { trigger: '.closing', start: 'top bottom', end: 'bottom top', scrub: 0.75 }
    });
    closingParallax
      .to('.closing-sun', { yPercent: 20, ease: 'none' }, 0)
      .to('.closing-mountain.m1', { yPercent: -8, ease: 'none' }, 0)
      .to('.closing-mountain.m2', { yPercent: -14, ease: 'none' }, 0)
      .to('.closing-trees', { yPercent: -20, ease: 'none' }, 0);

    const emberTweens = gsap.utils.toArray('.ember').map((ember, index) => gsap.to(ember, {
      x: index % 2 ? 14 : -12,
      y: -(36 + index * 7),
      opacity: 0,
      duration: 3.6 + index * 0.45,
      delay: index * 0.34,
      repeat: -1,
      ease: 'sine.out',
      paused: true
    }));
    ScrollTrigger.create({
      trigger: '.closing',
      start: 'top bottom',
      end: 'bottom top',
      onEnter: () => emberTweens.forEach((tween) => tween.play()),
      onEnterBack: () => emberTweens.forEach((tween) => tween.play()),
      onLeave: () => emberTweens.forEach((tween) => tween.pause()),
      onLeaveBack: () => emberTweens.forEach((tween) => tween.pause())
    });
    return resetJourney;
  };

  gsap.matchMedia().add({
    desktop: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
    mobile: '(max-width: 767px) and (prefers-reduced-motion: no-preference)',
    reduced: '(prefers-reduced-motion: reduce)'
  }, ({ conditions }) => {
    if (conditions.reduced) return undefined;
    setupEntrances(conditions.mobile);
    if (conditions.desktop) return setupDesktopMotion();
    return undefined;
  });
})();
