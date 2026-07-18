(() => {
  'use strict';

  const animatedContentSelector = [
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
    '.chat-message',
    '.poll-vignette',
    '.poll-check',
    '.crew-portrait-card',
    '.result-svg-row',
    '.availability-pill',
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
      [
        'opacity', 'visibility', 'transform', 'filter', '--word-blur',
        '--tilt-x', '--tilt-y', '--mag-x', '--mag-y', '--badge-bob',
        '--success-shadow'
      ].forEach((property) => element.style.removeProperty(property));
    });
  };

  const restoreVisibleContent = () => {
    clearMotionStyles([...document.querySelectorAll(animatedContentSelector)]);
    document.body.classList.remove('motion-enabled');

    [
      ['.search-query strong', 'motionOriginalText'],
      ['.poll-label', 'motionOriginalText']
    ].forEach(([selector, dataKey]) => {
      const element = document.querySelector(selector);
      if (element?.dataset[dataKey]) {
        element.textContent = element.dataset[dataKey];
        delete element.dataset[dataKey];
      }
    });

    const transcript = document.querySelector('.call-transcript');
    if (transcript?.dataset.motionOriginalHtml) {
      transcript.innerHTML = transcript.dataset.motionOriginalHtml;
      delete transcript.dataset.motionOriginalHtml;
    }
  };

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

  const createSeededRandom = (seed = 1729) => () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const initSiteMotion = () => {
    let motionMedia;
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const { gsap, ScrollTrigger, MotionPathPlugin } = window;
      if (!gsap || !ScrollTrigger || !MotionPathPlugin) return;
      gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);
      document.body.classList.add('motion-enabled');
      document.querySelectorAll('h1, h2').forEach(splitWords);

      const safelyAnimate = (elements, animation) => {
        try {
          return animation();
        } catch (error) {
          clearMotionStyles(elements);
          console.error('BaseCamp motion enhancement skipped:', error);
          return undefined;
        }
      };

      const batchFrom = (selector, vars) => {
        ScrollTrigger.batch(selector, {
          start: 'top 96%',
          once: true,
          onEnter: (elements) => safelyAnimate(elements, () => {
            gsap.from(elements, { ...vars, overwrite: 'auto' });
          })
        });
      };

      const playWhileVisible = (trigger, animations, range = {}) => ScrollTrigger.create({
        trigger,
        start: range.start || 'top bottom',
        end: range.end || 'bottom top',
        onToggle: ({ isActive }) => animations.forEach((animation) => {
          if (isActive) animation.play();
          else animation.pause();
        })
      });

      const setupHeroEntrance = (mobile) => {
        const hero = gsap.timeline({ defaults: { ease: 'power3.out' } });
        hero
          .from('.hero-copy .eyebrow', { opacity: 0, y: 12, duration: 0.32 }, 0)
          .from('.hero-copy h1 .motion-word', {
            opacity: 0,
            y: mobile ? 16 : 28,
            '--word-blur': mobile ? '0px' : '7px',
            duration: 0.58,
            stagger: 0.035
          }, 0.05)
          .from('.hero-copy .lede, .hero-actions', {
            opacity: 0,
            y: 14,
            duration: 0.4,
            stagger: 0.06
          }, 0.28)
          .from('.hero-art', {
            opacity: 0,
            y: 12,
            duration: 0.58
          }, 0.12)
          .from('.sun, .sun-halo', {
            y: 34,
            scale: 0.88,
            transformOrigin: '50% 50%',
            duration: 1.15,
            ease: 'power2.out'
          }, 0.12)
          .from('.hero-scene', {
            '--sun-brightness': 0.78,
            '--sun-saturation': 0.72,
            '--sun-hue': '-8deg',
            duration: 1.35,
            ease: 'sine.out'
          }, 0.12);

        if (mobile) {
          hero.from('.hero-scene .rv', {
            opacity: 0,
            y: -12,
            rotation: -1.2,
            transformOrigin: '50% 100%',
            duration: 0.5,
            stagger: 0.07
          }, 0.34);
          return;
        }

        const rvs = gsap.utils.toArray('.hero-scene .rv');
        const wheels = gsap.utils.toArray('.hero-scene .wheel-spoke');
        hero
          .from(rvs, {
            x: (index) => -620 - index * 190,
            duration: 1.4,
            stagger: 0.13,
            ease: 'power2.out'
          }, 0.16)
          .from(rvs, {
            y: 8,
            rotation: -2.2,
            transformOrigin: '50% 100%',
            duration: 0.24,
            repeat: 4,
            yoyo: true,
            stagger: 0.13,
            ease: 'sine.inOut'
          }, 0.18)
          .from(wheels, {
            rotation: -600,
            duration: 1.38,
            stagger: { each: 0.015, from: 'end' },
            ease: 'power2.out'
          }, 0.17);
      };

      const setupEntrances = (mobile) => {
        ScrollTrigger.batch('.together h2, .discover h2, .availability-heading h2, .ai-intro h2', {
          start: 'top 96%',
          once: true,
          onEnter: (headings) => {
            const words = headings.flatMap((heading) => [...heading.querySelectorAll('.motion-word')]);
            safelyAnimate(words, () => gsap.from(words, {
              opacity: 0,
              y: mobile ? 16 : 28,
              '--word-blur': mobile ? '0px' : '7px',
              duration: mobile ? 0.62 : 0.86,
              stagger: mobile ? 0.035 : 0.055,
              ease: 'power3.out',
              overwrite: 'auto'
            }));
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
          y: mobile ? 24 : 44,
          scale: mobile ? 1 : 0.985,
          duration: mobile ? 0.72 : 0.95,
          stagger: 0.08,
          ease: 'power3.out',
          clearProps: 'transform'
        });

        batchFrom('.feature-list li', {
          opacity: 0,
          x: -18,
          duration: 0.58,
          stagger: 0.11,
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

        batchFrom('.closing-copy > .kicker, .closing-lede', {
          opacity: 0,
          y: mobile ? 14 : 22,
          duration: 0.68,
          stagger: 0.1,
          ease: 'power2.out'
        });
      };

      const setupCommonAmbience = () => {
        const heroAmbient = [
          gsap.to('.cloud-one', { x: 38, duration: 24, repeat: -1, yoyo: true, ease: 'sine.inOut', paused: true }),
          gsap.to('.cloud-two', { x: -27, duration: 31, repeat: -1, yoyo: true, ease: 'sine.inOut', paused: true }),
          gsap.to('.cloud-three', { x: 20, duration: 21, repeat: -1, yoyo: true, ease: 'sine.inOut', paused: true }),
          gsap.to('.sun-halo', { scale: 1.13, opacity: 0.21, duration: 3.8, repeat: -1, yoyo: true, ease: 'sine.inOut', paused: true })
        ];
        playWhileVisible('.hero', heroAmbient);

        const badgeBob = gsap.to('.closing-copy .app-badge', {
          '--badge-bob': '-4px',
          duration: 2.8,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          paused: true
        });
        playWhileVisible('.closing', [badgeBob]);
      };

      const setupChatSequence = () => {
        ScrollTrigger.create({
          trigger: '.plan-art',
          start: 'top 82%',
          once: true,
          onEnter: () => {
            const label = document.querySelector('.poll-label');
            const original = label?.textContent || '';
            if (label) label.dataset.motionOriginalText = original;
            try {
              const timeline = gsap.timeline({
                defaults: { ease: 'power2.out' },
                onComplete: () => {
                  if (label) {
                    label.textContent = original;
                    delete label.dataset.motionOriginalText;
                  }
                }
              });
              timeline
                .set('.typing-one', { opacity: 1 }, 0)
                .fromTo('.typing-one circle', { y: 2 }, {
                  y: -5,
                  duration: 0.16,
                  repeat: 3,
                  yoyo: true,
                  stagger: 0.07,
                  ease: 'sine.inOut'
                }, 0)
                .set('.typing-one', { opacity: 0 }, 0.52)
                .from('.chat-message-one', {
                  opacity: 0,
                  scale: 0.85,
                  duration: 0.34,
                  ease: 'back.out(1.9)'
                }, 0.5)
                .set('.typing-two', { opacity: 1 }, 0.76)
                .fromTo('.typing-two circle', { y: 2 }, {
                  y: -5,
                  duration: 0.15,
                  repeat: 3,
                  yoyo: true,
                  stagger: 0.07,
                  ease: 'sine.inOut'
                }, 0.76)
                .set('.typing-two', { opacity: 0 }, 1.25)
                .from('.chat-message-two', {
                  opacity: 0,
                  scale: 0.85,
                  duration: 0.34,
                  ease: 'back.out(1.9)'
                }, 1.22)
                .from('.poll-vignette', {
                  opacity: 0,
                  y: 25,
                  duration: 0.44,
                  ease: 'back.out(1.45)'
                }, 1.48)
                .call(() => { if (label) label.textContent = 'DATE POLL · 3 VOTES'; }, null, 1.54)
                .from('.poll-check', {
                  opacity: 0,
                  scale: 0.2,
                  rotation: -18,
                  duration: 0.28,
                  stagger: 0.18,
                  ease: 'back.out(2.5)'
                }, 1.66)
                .call(() => { if (label) label.textContent = 'DATE POLL · 4 VOTES'; }, null, 1.86)
                .call(() => { if (label) label.textContent = 'DATE POLL · 5 VOTES'; }, null, 2.12)
                .to('.poll-fill', { scaleX: 1.035, transformOrigin: '0% 50%', duration: 0.25, yoyo: true, repeat: 1 }, 2.08);
            } catch (error) {
              if (label) {
                label.textContent = original;
                delete label.dataset.motionOriginalText;
              }
              clearMotionStyles([...document.querySelectorAll('.chat-message, .poll-vignette, .poll-check')]);
              console.error('BaseCamp chat sequence skipped:', error);
            }
          }
        });
      };

      const setupCrewFeatureEntrance = (mobile) => {
        const feature = document.querySelector('.crew-feature');
        if (!feature) return;

        ScrollTrigger.create({
          trigger: feature,
          start: 'top 88%',
          once: true,
          onEnter: () => {
            const cards = [...feature.querySelectorAll('.crew-portrait-card')];
            safelyAnimate(cards, () => gsap.from(cards, {
              opacity: 0,
              x: (index) => index ? 18 : -18,
              y: mobile ? 18 : 28,
              scale: mobile ? 0.9 : 0.84,
              rotation: (index) => index ? 13 : -12,
              duration: mobile ? 0.62 : 0.78,
              stagger: 0.14,
              transformOrigin: '50% 85%',
              ease: 'back.out(1.45)',
              clearProps: 'opacity,transform'
            }));
          }
        });
      };

      const setupAvailabilitySequence = () => {
        ScrollTrigger.create({
          trigger: '.search-stage',
          start: 'top 82%',
          once: true,
          onEnter: () => {
            const query = document.querySelector('.search-query strong');
            if (!query) return;
            const original = query.textContent;
            query.dataset.motionOriginalText = original;
            try {
              query.textContent = '';
              const timeline = gsap.timeline({
                onComplete: () => {
                  query.textContent = original;
                  delete query.dataset.motionOriginalText;
                }
              });
              [...original].forEach((character, index) => {
                timeline.call(() => { query.textContent += character; }, null, index * 0.027);
              });
              timeline
                .fromTo('.result-shimmer', { opacity: 0, x: 0 }, {
                  opacity: 0.82,
                  x: 850,
                  duration: 0.78,
                  ease: 'power2.inOut'
                }, 0.62)
                .to('.result-shimmer', { opacity: 0, duration: 0.16 }, 1.28)
                .from('.result-svg-row', {
                  opacity: 0,
                  y: 14,
                  duration: 0.42,
                  stagger: 0.12,
                  ease: 'power2.out'
                }, 0.82)
                .from('.availability-pill', {
                  scale: 0.76,
                  duration: 0.42,
                  stagger: 0.12,
                  transformOrigin: '50% 50%',
                  ease: 'back.out(2.1)'
                }, 1.02)
                .to('.result-svg-row:first-of-type .availability-pill', {
                  scale: 1.1,
                  duration: 0.24,
                  repeat: 1,
                  yoyo: true,
                  ease: 'sine.inOut'
                }, 1.54);
            } catch (error) {
              query.textContent = original;
              delete query.dataset.motionOriginalText;
              clearMotionStyles([...document.querySelectorAll('.result-svg-row, .availability-pill')]);
              console.error('BaseCamp availability sequence skipped:', error);
            }
          }
        });
      };

      const setupJourney = () => {
        const thread = document.querySelector('.journey-thread');
        const path = document.querySelector('.journey-mask-path');
        const marker = document.querySelector('.journey-rv');
        if (!thread || !path || !marker) return () => {};

        const restore = () => {
          path.style.removeProperty('--trail-length');
          path.style.removeProperty('--trail-offset');
          marker.setAttribute('transform', 'translate(720 4000)');
          marker.style.removeProperty('transform');
          document.querySelector('.journey-headlight')?.style.removeProperty('opacity');
        };

        try {
          const pathLength = path.getTotalLength();
          marker.removeAttribute('transform');
          gsap.set(path, { '--trail-length': pathLength, '--trail-offset': pathLength });
          gsap.set('.journey-headlight', { opacity: 0 });

          const journey = gsap.timeline({
            scrollTrigger: {
              trigger: thread,
              start: 'top 88%',
              end: 'bottom 18%',
              scrub: 0.65,
              invalidateOnRefresh: true
            }
          });
          journey
            .to(path, { '--trail-offset': 0, duration: 0.88, ease: 'none' }, 0)
            .to(marker, {
              duration: 1,
              ease: 'none',
              motionPath: {
                path,
                align: path,
                alignOrigin: [0.5, 0.5],
                autoRotate: true
              }
            }, 0);

          gsap.to('.journey-headlight', {
            opacity: 0.72,
            scrollTrigger: {
              trigger: '.ai-section',
              start: 'top 94%',
              end: 'top 35%',
              scrub: true
            }
          });
          return restore;
        } catch (error) {
          restore();
          throw error;
        }
      };

      const setupSectionSkies = () => {
        const rootStyles = getComputedStyle(document.documentElement);
        const sky = (name) => rootStyles.getPropertyValue(name).trim();
        [
          ['.hero', sky('--sky-noon'), 'top 80%', 'bottom 22%'],
          ['.together', sky('--sky-noon'), 'top 80%', 'bottom 22%'],
          ['.discover', sky('--sky-dusk'), 'top 80%', 'bottom 22%'],
          ['.availability', sky('--sky-night'), 'top 80%', 'bottom 22%'],
          ['.ai-section', sky('--sky-fire'), '72% 82%', 'bottom 20%']
        ].forEach(([selector, color, start, end]) => {
          gsap.to(selector, {
            '--section-sky': color,
            ease: 'none',
            scrollTrigger: {
              trigger: selector,
              start,
              end,
              scrub: 0.8
            }
          });
        });
      };

      const setupHeroCinema = () => {
        const birdTimeline = gsap.timeline({ repeat: -1, repeatDelay: 10.2, paused: true });
        birdTimeline
          .set('.bird-flock', { opacity: 0 })
          .to('.bird-flock', { opacity: 0.72, duration: 0.24 })
          .to('.bird-flock', {
            duration: 3.35,
            ease: 'sine.inOut',
            motionPath: {
              path: '.bird-flight-path',
              align: '.bird-flight-path',
              alignOrigin: [0.5, 0.5],
              autoRotate: true
            }
          }, 0)
          .to('.bird-flock', { opacity: 0, duration: 0.38 }, 2.92);
        playWhileVisible('.hero', [birdTimeline]);

        const marquee = gsap.to('.marquee div', {
          xPercent: -50,
          duration: 48,
          repeat: -1,
          ease: 'none',
          paused: true
        });
        playWhileVisible('.marquee', [marquee]);
        ScrollTrigger.create({
          trigger: document.documentElement,
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: (self) => {
            const boost = Math.min(4.2, 1 + Math.abs(self.getVelocity()) / 900);
            marquee.timeScale(boost);
            gsap.to(marquee, { timeScale: 1, duration: 1.25, ease: 'power2.out', overwrite: true });
          }
        });
      };

      const setupLiveCall = () => {
        const seeded = createSeededRandom(90421);
        const pulseTweens = gsap.utils.toArray('.beacon-pulse').map((pulse, index) => gsap.fromTo(pulse, {
          opacity: 0.52,
          scale: 0.94
        }, {
          opacity: 0,
          scale: 1.52,
          duration: 2.4,
          delay: index * 1.2,
          repeat: -1,
          ease: 'power2.out',
          paused: true
        }));

        const waveform = gsap.timeline({ repeat: -1, paused: true });
        for (let step = 0; step < 7; step += 1) {
          gsap.utils.toArray('.waveform i').forEach((bar, index) => {
            waveform.to(bar, {
              scaleY: 0.18 + seeded() * 0.9,
              opacity: 0.62 + seeded() * 0.38,
              duration: 0.14,
              ease: 'sine.inOut'
            }, step * 0.14 + index * 0.002);
          });
        }
        playWhileVisible('.call-stage', [...pulseTweens, waveform]);

        const twinkles = gsap.utils.toArray('.stars circle').map((star) => gsap.fromTo(star, {
          opacity: 0.28 + seeded() * 0.3
        }, {
          opacity: 0.75 + seeded() * 0.25,
          duration: 1.4 + seeded() * 3.2,
          delay: seeded() * 3.8,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          paused: true
        }));

        const shootingStar = gsap.timeline({ repeat: -1, repeatDelay: 17.8, delay: 6, paused: true });
        shootingStar.fromTo('.shooting-star', {
          x: 210,
          y: 430,
          opacity: 0
        }, {
          x: 760,
          y: 155,
          opacity: 0.9,
          duration: 1.7,
          ease: 'power1.inOut'
        }).to('.shooting-star', { opacity: 0, duration: 0.35 }, 1.35);
        playWhileVisible('.ai-section', [...twinkles, shootingStar]);

        const fireAnimations = [
          gsap.to('.fire-glow', { scale: 1.14, opacity: 0.28, duration: 2.4, repeat: -1, yoyo: true, ease: 'sine.inOut', paused: true }),
          gsap.to('.flame-outer', { scaleY: 1.08, scaleX: 0.94, skewX: -2, duration: 0.48, repeat: -1, yoyo: true, ease: 'sine.inOut', paused: true }),
          gsap.to('.flame-middle', { scaleY: 0.9, scaleX: 1.07, skewX: 3, duration: 0.37, repeat: -1, yoyo: true, ease: 'sine.inOut', paused: true }),
          gsap.to('.flame-inner', { scaleY: 1.12, scaleX: 0.91, skewX: -4, duration: 0.31, repeat: -1, yoyo: true, ease: 'sine.inOut', paused: true })
        ];
        playWhileVisible('.campfire', fireAnimations);

        ScrollTrigger.create({
          trigger: '.call-stage',
          start: 'top 78%',
          once: true,
          onEnter: () => {
            const transcript = document.querySelector('.call-transcript');
            if (!transcript) return;
            const originalHtml = transcript.innerHTML;
            const lines = [...transcript.children];
            const texts = lines.map((line) => line.textContent);
            transcript.dataset.motionOriginalHtml = originalHtml;

            try {
              lines.forEach((line) => { line.textContent = ''; });
              const cursor = document.createElement('i');
              cursor.className = 'typing-cursor';
              cursor.setAttribute('aria-hidden', 'true');
              lines[0]?.appendChild(cursor);
              const cursorBlink = gsap.to(cursor, { opacity: 0, duration: 0.36, repeat: -1, yoyo: true, ease: 'steps(1)', paused: true });
              const cursorViewport = playWhileVisible('.call-stage', [cursorBlink]);

              const restore = () => {
                cursorViewport.kill();
                cursorBlink.kill();
                transcript.innerHTML = originalHtml;
                delete transcript.dataset.motionOriginalHtml;
              };

              const typing = gsap.timeline({ onComplete: restore, onInterrupt: restore });
              let position = 0;
              texts.forEach((text, lineIndex) => {
                typing.call(() => lines[lineIndex]?.appendChild(cursor), null, position);
                [...text].forEach((character) => {
                  typing.call(() => cursor.before(character), null, position);
                  position += lineIndex === 0 ? 0.021 : 0.024;
                });
                position += 0.18;
              });
              typing
                .from('.call-success', {
                  opacity: 0,
                  y: 20,
                  scale: 0.82,
                  duration: 0.62,
                  ease: 'back.out(2.2)'
                }, Math.max(0.55, position - 0.12))
                .to('.call-success', {
                  '--success-shadow': '0 12px 18px rgba(0,0,0,.28)',
                  duration: 0.22
                }, Math.max(0.55, position - 0.04))
                .to('.call-success', {
                  '--success-shadow': '0 6px 10px rgba(0,0,0,.18)',
                  duration: 0.36,
                  ease: 'power2.out'
                }, position + 0.18);
            } catch (error) {
              transcript.innerHTML = originalHtml;
              delete transcript.dataset.motionOriginalHtml;
              clearMotionStyles([...document.querySelectorAll('.call-success')]);
              console.error('BaseCamp call transcript skipped:', error);
            }
          }
        });
      };

      const setupClosingFinale = () => {
        ScrollTrigger.create({
          trigger: '.closing-copy h2',
          start: 'top 88%',
          once: true,
          onEnter: () => {
            const words = gsap.utils.toArray('.closing-copy h2 .motion-word');
            safelyAnimate(words, () => gsap.from(words, {
              opacity: 0,
              y: 38,
              duration: 0.82,
              stagger: 0.075,
              ease: 'power3.out'
            }));
          }
        });

        const closingParallax = gsap.timeline({
          scrollTrigger: { trigger: '.closing', start: 'top bottom', end: 'bottom top', scrub: 0.75 }
        });
        closingParallax
          .to('.closing-sun', { yPercent: 18, ease: 'none' }, 0)
          .to('.closing-mountain.m1', { yPercent: -8, ease: 'none' }, 0)
          .to('.closing-mountain.m2', { yPercent: -14, ease: 'none' }, 0)
          .to('.closing-trees', { yPercent: -20, ease: 'none' }, 0);

        const breathing = [
          gsap.to('.closing-sun', { scale: 1.035, duration: 5.2, repeat: -1, yoyo: true, ease: 'sine.inOut', paused: true }),
          gsap.to('.closing-mountain.m1', { scaleX: 1.018, duration: 6.8, repeat: -1, yoyo: true, ease: 'sine.inOut', paused: true }),
          gsap.to('.closing-mountain.m2', { scaleX: 1.026, duration: 5.6, repeat: -1, yoyo: true, ease: 'sine.inOut', paused: true }),
          gsap.to('.closing-trees', { scaleX: 1.012, duration: 4.7, repeat: -1, yoyo: true, ease: 'sine.inOut', paused: true })
        ];
        playWhileVisible('.closing', breathing);

        const art = document.querySelector('.closing-art');
        const seeded = createSeededRandom(7182);
        if (art) {
          for (let index = art.querySelectorAll('.ember').length; index < 12; index += 1) {
            const ember = document.createElement('i');
            ember.className = 'ember ember-dynamic';
            ember.style.setProperty('--ember-left', `${10 + seeded() * 80}%`);
            ember.style.setProperty('--ember-top', `${43 + seeded() * 28}%`);
            art.appendChild(ember);
          }
        }

        const emberTweens = gsap.utils.toArray('.ember').map((ember, index) => gsap.fromTo(ember, {
          x: 0,
          y: 0,
          opacity: 0.75,
          scale: 0.6 + seeded() * 0.7
        }, {
          x: -18 + seeded() * 36,
          y: -(48 + seeded() * 92),
          opacity: 0,
          scale: 0.2,
          duration: 2.8 + seeded() * 2.5,
          delay: index * 0.28,
          repeat: -1,
          ease: 'sine.out',
          paused: true
        }));
        playWhileVisible('.closing', emberTweens);
      };

      const setupPointerLife = () => {
        const cleanup = [];
        const tiltSurfaces = gsap.utils.toArray('.plan-art, .discover-art, .call-stage');
        tiltSurfaces.forEach((surface) => {
          let bounds;
          const tiltX = gsap.quickTo(surface, '--tilt-x', { duration: 0.38, ease: 'power2.out' });
          const tiltY = gsap.quickTo(surface, '--tilt-y', { duration: 0.38, ease: 'power2.out' });
          const enter = () => { bounds = surface.getBoundingClientRect(); };
          const move = (event) => {
            if (!bounds) return;
            const x = (event.clientX - bounds.left) / bounds.width - 0.5;
            const y = (event.clientY - bounds.top) / bounds.height - 0.5;
            tiltX(`${-y * 7.5}deg`);
            tiltY(`${x * 7.5}deg`);
          };
          const leave = () => {
            bounds = undefined;
            tiltX('0deg');
            tiltY('0deg');
          };
          surface.addEventListener('pointerenter', enter, { passive: true });
          surface.addEventListener('pointermove', move, { passive: true });
          surface.addEventListener('pointerleave', leave, { passive: true });
          cleanup.push(() => {
            surface.removeEventListener('pointerenter', enter);
            surface.removeEventListener('pointermove', move);
            surface.removeEventListener('pointerleave', leave);
          });
        });

        gsap.utils.toArray('.hero-actions .app-badge, .closing-copy .app-badge').forEach((button) => {
          let bounds;
          const moveX = gsap.quickTo(button, '--mag-x', { duration: 0.28, ease: 'power2.out' });
          const moveY = gsap.quickTo(button, '--mag-y', { duration: 0.28, ease: 'power2.out' });
          const enter = () => { bounds = button.getBoundingClientRect(); };
          const move = (event) => {
            if (!bounds) return;
            const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 12;
            const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 12;
            moveX(`${x}px`);
            moveY(`${y}px`);
          };
          const leave = () => {
            bounds = undefined;
            gsap.to(button, {
              '--mag-x': '0px',
              '--mag-y': '0px',
              duration: 0.62,
              ease: 'elastic.out(1, .38)',
              overwrite: 'auto'
            });
          };
          button.addEventListener('pointerenter', enter, { passive: true });
          button.addEventListener('pointermove', move, { passive: true });
          button.addEventListener('pointerleave', leave, { passive: true });
          cleanup.push(() => {
            button.removeEventListener('pointerenter', enter);
            button.removeEventListener('pointermove', move);
            button.removeEventListener('pointerleave', leave);
          });
        });

        const clearCachedBounds = () => tiltSurfaces.forEach((surface) => {
          surface.dispatchEvent(new Event('pointerleave'));
        });
        ScrollTrigger.addEventListener('refreshInit', clearCachedBounds);
        cleanup.push(() => ScrollTrigger.removeEventListener('refreshInit', clearCachedBounds));
        return () => cleanup.forEach((remove) => remove());
      };

      const setupSmoothScroll = () => {
        const LenisClass = window.Lenis;
        if (!LenisClass) return () => {};
        const lenis = new LenisClass({
          duration: 1.05,
          smoothWheel: true,
          wheelMultiplier: 0.9,
          touchMultiplier: 1
        });
        const tick = (time) => lenis.raf(time * 1000);
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);

        const anchorHandler = (event) => {
          const anchor = event.target.closest('a[href^="#"]');
          if (!anchor || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          const target = document.querySelector(anchor.getAttribute('href'));
          if (!target) return;
          event.preventDefault();
          lenis.scrollTo(target, {
            duration: 1.05,
            onComplete: () => {
              if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
              target.focus({ preventScroll: true });
            }
          });
          history.pushState(null, '', anchor.getAttribute('href'));
        };
        document.addEventListener('click', anchorHandler);

        return () => {
          document.removeEventListener('click', anchorHandler);
          lenis.off?.('scroll', ScrollTrigger.update);
          gsap.ticker.remove(tick);
          lenis.destroy();
        };
      };

      const setupDesktopMotion = () => {
        const cleanup = [];
        try {
          cleanup.push(setupJourney());
          setupSectionSkies();
          setupHeroCinema();
          setupLiveCall();
          setupClosingFinale();
          cleanup.push(setupPointerLife());

          const resortParallax = gsap.timeline({
            scrollTrigger: { trigger: '.discover', start: 'top bottom', end: 'bottom top', scrub: 0.8 }
          });
          resortParallax
            .to('.resort-back', { yPercent: -14, ease: 'none' }, 0)
            .to('.resort-front', { yPercent: -6, ease: 'none' }, 0)
            .to('.catalog-seal', { yPercent: -18, ease: 'none' }, 0);

          cleanup.push(setupSmoothScroll());
          return () => cleanup.reverse().forEach((teardown) => teardown());
        } catch (error) {
          cleanup.reverse().forEach((teardown) => teardown());
          throw error;
        }
      };

      motionMedia = gsap.matchMedia();
      motionMedia.add({
        desktop: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
        mobile: '(max-width: 767px) and (prefers-reduced-motion: no-preference)'
      }, ({ conditions }) => {
        setupEntrances(conditions.mobile);
        setupHeroEntrance(conditions.mobile);
        setupCommonAmbience();
        setupChatSequence();
        setupCrewFeatureEntrance(conditions.mobile);
        setupAvailabilitySequence();
        const cleanupDesktop = conditions.desktop ? setupDesktopMotion() : undefined;
        requestAnimationFrame(() => ScrollTrigger.refresh());
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
