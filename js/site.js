(() => {
  const motionContentSelector = [
    '.hero-copy .eyebrow',
    '.hero-copy h1 .motion-word',
    '.hero-copy .lede',
    '.hero-actions',
    '.hero-art',
    '.hero-scene .rv',
    '.section-copy h2 .motion-word',
    '.availability-heading h2 .motion-word',
    '.ai-intro h2 .motion-word',
    '.closing-copy h2 .motion-word',
    '.section-copy > .kicker',
    '.section-copy > p:not(.kicker)',
    '.section-copy > .micro-proof',
    '.availability-heading > .kicker',
    '.availability-heading > p:not(.kicker)',
    '.ai-intro > .kicker',
    '.ai-intro > p:not(.kicker)',
    '.plan-art',
    '.discover-art',
    '.search-stage',
    '.call-stage',
    '.feature-list li',
    '.poll-check',
    '.availability-pill',
    '.result-svg-row',
    '.ai-card',
    '.ai-footnote',
    '.call-success',
    '.closing-copy > .kicker',
    '.closing-lede',
    '.closing-copy .app-badge'
  ].join(', ');

  const clearMotionStyles = (elements) => {
    elements.forEach((element) => {
      if (!(element instanceof Element)) return;
      element.style.removeProperty('opacity');
      element.style.removeProperty('visibility');
      element.style.removeProperty('transform');
      element.style.removeProperty('filter');
      element.style.removeProperty('--word-blur');
    });
  };

  const restoreVisibleContent = () => {
    clearMotionStyles([...document.querySelectorAll(motionContentSelector)]);
    const transcript = document.querySelector('.call-transcript');
    if (transcript?.dataset.motionOriginalHtml) {
      transcript.innerHTML = transcript.dataset.motionOriginalHtml;
      delete transcript.dataset.motionOriginalHtml;
    }
  };

  const initSiteMotion = () => {
    let motionMedia;
    try {
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

      document.querySelectorAll('h1, h2').forEach(splitWords);

      const safelyAnimate = (elements, animation) => {
        try {
          animation();
        } catch (error) {
          clearMotionStyles(elements);
          console.error('BaseCamp motion enhancement skipped:', error);
        }
      };

      const batchFrom = (selector, vars) => {
        ScrollTrigger.batch(selector, {
          start: 'top 98%',
          once: true,
          onEnter: (elements) => safelyAnimate(elements, () => {
            gsap.from(elements, { ...vars, overwrite: 'auto' });
          })
        });
      };

      const setupHeroEntrance = (mobile) => {
        const hero = gsap.timeline({ defaults: { ease: 'power3.out' } });
        hero
          .from('.hero-copy .eyebrow', { opacity: 0, y: 12, duration: 0.32 }, 0)
          .from('.hero-copy h1 .motion-word', {
            opacity: 0,
            y: mobile ? 16 : 28,
            '--word-blur': mobile ? '0px' : '7px',
            duration: 0.55,
            stagger: 0.035
          }, 0.05)
          .from('.hero-copy .lede, .hero-actions', {
            opacity: 0,
            y: 14,
            duration: 0.36,
            stagger: 0.05
          }, 0.26)
          .from('.hero-art', {
            opacity: 0,
            x: mobile ? 0 : 20,
            y: 12,
            duration: 0.52
          }, 0.12)
          .from('.hero-scene .rv', {
            opacity: 0,
            y: -14,
            rotation: -1.2,
            transformOrigin: '50% 100%',
            duration: 0.42,
            stagger: 0.06,
            ease: 'power2.out'
          }, 0.28);
      };

      const setupEntrances = (mobile) => {
        ScrollTrigger.batch('.section-copy h2, .availability-heading h2, .ai-intro h2, .closing-copy h2', {
          start: 'top 98%',
          once: true,
          onEnter: (headings) => {
            const words = headings.flatMap((heading) => [...heading.querySelectorAll('.motion-word')]);
            safelyAnimate(words, () => {
              gsap.from(words, {
                opacity: 0,
                y: mobile ? 16 : 28,
                '--word-blur': mobile ? '0px' : '7px',
                duration: mobile ? 0.62 : 0.86,
                stagger: mobile ? 0.035 : 0.055,
                ease: 'power3.out',
                overwrite: 'auto'
              });
            });
          }
        });

        batchFrom([
          '.section-copy > .kicker',
          '.section-copy > p:not(.kicker)',
          '.section-copy > .micro-proof',
          '.availability-heading > .kicker',
          '.availability-heading > p:not(.kicker)',
          '.ai-intro > .kicker',
          '.ai-intro > p:not(.kicker)'
        ].join(', '), {
          opacity: 0,
          y: mobile ? 14 : 20,
          duration: 0.7,
          stagger: 0.09,
          ease: 'power2.out'
        });

        batchFrom('.plan-art, .discover-art, .search-stage, .call-stage', {
          opacity: 0,
          y: mobile ? 24 : 48,
          scale: mobile ? 1 : 0.985,
          duration: mobile ? 0.72 : 0.95,
          stagger: 0.08,
          ease: 'power3.out'
        });

        batchFrom('.feature-list li', {
          opacity: 0,
          x: -18,
          duration: 0.58,
          stagger: 0.11,
          ease: 'power2.out'
        });

        batchFrom('.poll-check', {
          opacity: 0,
          scale: 0.25,
          rotation: -18,
          transformOrigin: '50% 50%',
          duration: 0.38,
          stagger: 0.14,
          ease: 'back.out(2.4)'
        });

        batchFrom('.availability-pill', {
          opacity: 0,
          scale: 0.9,
          transformOrigin: '50% 50%',
          duration: 0.52,
          stagger: 0.14,
          ease: 'back.out(1.9)'
        });

        batchFrom('.result-svg-row', {
          opacity: 0,
          y: 12,
          duration: 0.5,
          stagger: 0.1,
          ease: 'power2.out'
        });

        batchFrom('.ai-card', {
          opacity: 0,
          y: mobile ? 18 : 34,
          duration: 0.72,
          stagger: 0.13,
          ease: 'power3.out'
        });

        batchFrom('.ai-footnote', {
          opacity: 0,
          y: 10,
          duration: 0.55,
          ease: 'power2.out'
        });

        batchFrom('.call-success', {
          opacity: 0,
          y: 14,
          scale: 0.86,
          duration: 0.62,
          ease: 'back.out(1.9)'
        });

        batchFrom('.closing-copy > .kicker, .closing-lede, .closing-copy .app-badge', {
          opacity: 0,
          y: mobile ? 14 : 22,
          duration: 0.68,
          stagger: 0.1,
          ease: 'power2.out'
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

        gsap.to('.stars', {
          opacity: 1,
          scale: 1.04,
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
        if (floatingAvatars[0]) {
          gsap.to(floatingAvatars[0], {
            y: -20,
            scrollTrigger: { trigger: '.plan-art', start: 'top bottom', end: 'bottom top', scrub: 0.7 }
          });
        }
        if (floatingAvatars[1]) {
          gsap.to(floatingAvatars[1], {
            y: 24,
            scrollTrigger: { trigger: '.plan-art', start: 'top bottom', end: 'bottom top', scrub: 0.7 }
          });
        }

        let restoreTranscript = () => {};
        ScrollTrigger.create({
          trigger: '.call-transcript',
          start: 'top 98%',
          once: true,
          onEnter: () => {
            const transcript = document.querySelector('.call-transcript');
            if (!transcript) return;
            const lines = [...transcript.children];
            const originalHtml = transcript.innerHTML;
            const originalTexts = lines.map((line) => line.textContent);
            restoreTranscript = () => {
              transcript.innerHTML = originalHtml;
              delete transcript.dataset.motionOriginalHtml;
            };

            try {
              transcript.dataset.motionOriginalHtml = originalHtml;
              lines.forEach((line) => { line.textContent = ''; });
              const typing = gsap.timeline({
                onComplete: restoreTranscript,
                onInterrupt: restoreTranscript
              });
              let position = 0;
              originalTexts.forEach((text, lineIndex) => {
                [...text].forEach((character) => {
                  typing.call(() => { lines[lineIndex].textContent += character; }, null, position);
                  position += lineIndex === 0 ? 0.022 : 0.024;
                });
                position += 0.18;
              });
              typing.call(restoreTranscript, null, position);
            } catch (error) {
              restoreTranscript();
              console.error('BaseCamp transcript enhancement skipped:', error);
            }
          }
        });

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

        return () => {
          restoreTranscript();
          resetJourney();
        };
      };

      motionMedia = gsap.matchMedia();
      motionMedia.add({
        desktop: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
        mobile: '(max-width: 767px) and (prefers-reduced-motion: no-preference)',
        reduced: '(prefers-reduced-motion: reduce)'
      }, ({ conditions }) => {
        if (conditions.reduced) return undefined;
        setupEntrances(conditions.mobile);
        const cleanupDesktop = conditions.desktop ? setupDesktopMotion() : undefined;
        setupHeroEntrance(conditions.mobile);
        return cleanupDesktop;
      });
    } catch (error) {
      motionMedia?.revert();
      restoreVisibleContent();
      console.error('BaseCamp motion initialization skipped:', error);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSiteMotion, { once: true });
  } else {
    initSiteMotion();
  }
})();
