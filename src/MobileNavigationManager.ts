/*
 * Copyright (c) 2025 Danil Klimov.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { gsap } from 'gsap';

export interface NavButtonData {
    id: string;
    text: string;
    href: string;
}

//MOBILE MANAGER! USELESS FOR DESKTOP

export class MobileNavigationManager {
    private navElement: HTMLElement;
    private menuContainer: HTMLElement | null; 
    private navButtonsData: NavButtonData[];
    private currentActiveButtonId: string;
    private navigationRequestCallback: ((targetPageId: string) => void) | null = null;

    private observer: IntersectionObserver | null = null;
    private sections: HTMLElement[] = [];
    private readonly ACTIVE_CLASS = 'is-active';

    constructor(
        selector: string,
        buttonsData: NavButtonData[],
        initialActiveButtonId: string = 'main'
    ) {
        const element = document.querySelector(selector);
        if (!element) {
            throw new Error(`Navigation container not found with selector: ${selector}`);
        }
        this.navElement = element as HTMLElement;
        this.menuContainer = document.querySelector('#main-menu-hover-wrapper');

        this.navButtonsData = buttonsData;
        this.currentActiveButtonId = initialActiveButtonId;
        this.init();
    }

    private init(): void {
        this.renderNavButtons();
        this.setupContainerHoverEvents();
        this.setupIntersectionObserver();
        this.setActiveButton(this.currentActiveButtonId);
    }

    private renderNavButtons(): void {
        while (this.navElement.firstChild) {
            this.navElement.removeChild(this.navElement.firstChild);
        }

        this.navButtonsData.forEach(buttonData => {
            const listItem = this.createElement('li', ['flex', 'flex-row']); 
            const anchor = this.createElement('a', [
                'text-base', 'leading-none', 'text-white', 'font-normal', 
                'relative', 'overflow-hidden', 'flex', 'flex-row', 'items-center', 
                'cursor-pointer',
                'nav-button' 
            ]);
            anchor.href = buttonData.href;
            anchor.dataset.buttonId = buttonData.id;
            anchor.setAttribute('role', 'link'); 
            anchor.setAttribute('aria-label', `Go to ${buttonData.text} section`);

            const stickSpan = this.createElement('span', [
                'nav-button__stick',
                'absolute', 'left-0', 'w-0.5', 'h-3', 'rounded-full',
                'bg-subaccent',
            ]);

            const textSpan = this.createElement('span', [
                'nav-button__text',
                'relative', 'z-10', 
            ]);
            textSpan.textContent = buttonData.text;

            anchor.append(stickSpan, textSpan);
            anchor.addEventListener('click', this.handleButtonClick.bind(this));
            
            listItem.appendChild(anchor);
            this.navElement.appendChild(listItem);
        });
    }

    private createElement<K extends keyof HTMLElementTagNameMap>(
        tagName: K,
        classNames: string[] = []
    ): HTMLElementTagNameMap[K] {
        const element = document.createElement(tagName);
        if (classNames.length) {
            element.classList.add(...classNames);
        }
        return element;
    }

    private setupContainerHoverEvents(): void {
        if (this.menuContainer) {
            this.menuContainer.addEventListener('mouseenter', () => {
                this.menuContainer?.classList.add('nav-container-is-hovered');
            });
            this.menuContainer.addEventListener('mouseleave', () => {
                this.menuContainer?.classList.remove('nav-container-is-hovered');
            });
        }
    }

    private handleButtonClick(event: Event): void {
        event.preventDefault();
        const target = event.currentTarget as HTMLAnchorElement;
        const targetPageId = target.dataset.buttonId;

        if (targetPageId && this.navigationRequestCallback) {
            this.navigationRequestCallback(targetPageId);
        }
    }

    public setActiveButton(buttonId: string): void {
        const currentActiveLink = this.navElement.querySelector(`[data-button-id="${this.currentActiveButtonId}"]`);
        if (currentActiveLink) {
            currentActiveLink.classList.remove(this.ACTIVE_CLASS);
        }

        const newActiveLink = this.navElement.querySelector(`[data-button-id="${buttonId}"]`);
        if (newActiveLink) {
            newActiveLink.classList.add(this.ACTIVE_CLASS);
            this.currentActiveButtonId = buttonId;
        }
    }

    public setNavigationRequestCallback(callback: (targetPageId: string) => void): void {
        this.navigationRequestCallback = callback;
    }

    private setupIntersectionObserver(): void {
        this.sections = Array.from(document.querySelectorAll('section[id]'));
        
        const options = {
            root: null, 
            rootMargin: '0px 0px -50% 0px', 
            threshold: 0 
        };

        this.observer = new IntersectionObserver(this.handleIntersection.bind(this), options);

        this.sections.forEach(section => {
            this.observer?.observe(section);
        });
    }

    private handleIntersection(entries: IntersectionObserverEntry[]): void {
        let activeSectionId: string | null = null;
        
        const intersectingEntries = entries.filter(entry => entry.isIntersecting);

        intersectingEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (intersectingEntries.length > 0) {
            const topMostIntersectingEntry = intersectingEntries[0];
            const sectionId = topMostIntersectingEntry.target.id;
            const correspondingButton = this.navButtonsData.find(btn => btn.id === sectionId);
            if (correspondingButton) {
                activeSectionId = sectionId;
            }
        }
        
        if (activeSectionId && activeSectionId !== this.currentActiveButtonId) {
            this.setActiveButton(activeSectionId);
        } else if (!activeSectionId && this.sections.length > 0 && window.scrollY < this.sections[0].offsetTop) {
            if (this.currentActiveButtonId !== this.navButtonsData[0].id) {
                this.setActiveButton(this.navButtonsData[0].id);
            }
        }
    }

    public destroy(): void {
        this.navElement.querySelectorAll('a').forEach(anchor => {
            anchor.removeEventListener('click', this.handleButtonClick);
        });
        if (this.menuContainer) {
            this.menuContainer.removeEventListener('mouseenter', this.setupContainerHoverEvents);
            this.menuContainer.removeEventListener('mouseleave', this.setupContainerHoverEvents); 
        }
        this.observer?.disconnect(); 
        this.sections = [];
    }
}