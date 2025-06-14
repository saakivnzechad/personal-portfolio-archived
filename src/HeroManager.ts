/*
 * Copyright (c) 2025 Danil Klimov.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { gsap } from 'gsap';

//That's specific manager only for desktop. Obviously, it's not the most reliable and stable method, but it allowed me make this ui component more beautiful without global change of architecture or application behaviour

export class HeroManager {
    private static readonly HERO_ANIMATION_DURATION = 0.8;
    private static readonly HERO_ANIMATION_EASE = 'power2.out';

    private heroElements: HTMLElement[] = [];
    private readonly bodyElement: HTMLBodyElement;

    constructor() {
        this.bodyElement = document.body as HTMLBodyElement;
    }

    public prepareHeroElements(pageContainer: HTMLElement): void {
        if (this.heroElements.length > 0) {
            this.cleanupHeroElements();
        }
        
        const foundInPageContainer = pageContainer.querySelectorAll('.hero-inpage-elem');
        const elementsArray = Array.from(foundInPageContainer) as HTMLElement[];

        this.heroElements = elementsArray;

        this.heroElements.forEach(el => {
            if (el.parentElement !== this.bodyElement) {
                this.bodyElement.appendChild(el);
            }
            gsap.set(el, { opacity: 0 });
        });
    }

    public getAppearTimeline(delay: number = 0.2): gsap.core.Timeline {
        const tl = gsap.timeline();
        if (this.heroElements.length > 0) {
            tl.to(this.heroElements, {
                opacity: (i, el: HTMLElement) => (el.id === 'hero-background' ? 1 : 0.3),
                duration: HeroManager.HERO_ANIMATION_DURATION,
                ease: HeroManager.HERO_ANIMATION_EASE,
                delay: delay,
            });
        }
        return tl;
    }

    public getDisappearTimeline(): gsap.core.Timeline {
        const tl = gsap.timeline();
        if (this.heroElements.length > 0) {
            tl.to(this.heroElements, {
                opacity: 0,
                duration: HeroManager.HERO_ANIMATION_DURATION / 2,
                ease: HeroManager.HERO_ANIMATION_EASE,
            });
        }
        return tl;
    }

    public cleanupHeroElements(): void {
        this.heroElements.forEach(el => {
            if (el.parentNode === this.bodyElement) {
                this.bodyElement.removeChild(el);
            }
        });
        this.heroElements = [];
    }

    public hasActiveHeroElements(): boolean {
        return this.heroElements.length > 0;
    }

    public getManagedElementById(id: string): HTMLElement | undefined {
        const foundElement = this.heroElements.find(el => el.id === id);
        return foundElement;
    }
}