/*
 * Copyright (c) 2025 Danil Klimov.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import '../src/components/NavButton.css';

interface NavButtonData {
    id: string;
    text: string;
    href: string;
}

type NavigationRequestCallback = (targetPageId: string) => void;

//DESKTOP MANAGER! NOT STABLE ON MOBILES

export class NavigationManager {
    private navElement: HTMLElement;
    private navButtonsData: NavButtonData[];
    private currentActiveButtonId: string;
    private isHeroSectionActive: boolean;

    private navHoverTimeout: ReturnType<typeof setTimeout> | null = null;
    private currentHoveredButton: HTMLElement | null = null;
    private readonly NAV_HOVER_TIMEOUT_MS = 100;

    private readonly NAV_CONTAINER_HOVER_CLASS = 'nav-container-is-hovered';
    private readonly NAV_CONTAINER_HERO_CLASS = 'nav-container-is-hero';
    private readonly NAV_BUTTON_CLASS = 'nav-button';
    private readonly NAV_BUTTON_STICK_CLASS = 'nav-button__stick';
    private readonly NAV_BUTTON_TEXT_CLASS = 'nav-button__text';
    private readonly IS_ACTIVE_CLASS = 'is-active';
    private readonly TEXT_SUBACCENT_CLASS = 'text-subaccent';
    private readonly TEXT_SHADOW_LARGEGLOW_CLASS = 'text-shadow-largeglow';
    private readonly TEXT_SHADOW_SMALLGLOW_CLASS = 'text-shadow-smallglow';
    private readonly TEXT_SHADOW_THINGLOW_CLASS = 'text-shadow-thinglow';
    
    private navigationRequestCallback: NavigationRequestCallback | null = null;

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
        this.navButtonsData = buttonsData;
        this.currentActiveButtonId = initialActiveButtonId;
        this.isHeroSectionActive = initialActiveButtonId === 'main';
        this.init();
    }

    public setNavigationRequestCallback(callback: NavigationRequestCallback): void {
        this.navigationRequestCallback = callback;
    }

    private init(): void {
        this.renderNavButtons();
        this.addGlobalListeners();
        this.updateNavButtonStates();
    }

    private createElement<K extends keyof HTMLElementTagNameMap>(
        tagName: K,
        initialClasses: string[] = []
    ): HTMLElementTagNameMap[K] {
        const element = document.createElement(tagName);
        if (initialClasses.length > 0) {
            element.classList.add(...initialClasses);
        }
        return element;
    }

    private setButtonVisualState(
        anchor: HTMLAnchorElement,
        stickSpan: HTMLSpanElement,
        isButtonActive: boolean,
        isHeroContext: boolean,
        isButtonHovered: boolean
    ): void {
        anchor.classList.remove(
            this.IS_ACTIVE_CLASS,
            this.TEXT_SUBACCENT_CLASS,
            this.TEXT_SHADOW_LARGEGLOW_CLASS,
            this.TEXT_SHADOW_SMALLGLOW_CLASS,
            this.TEXT_SHADOW_THINGLOW_CLASS
        );
        stickSpan.classList.remove(
            this.TEXT_SHADOW_LARGEGLOW_CLASS,
            this.TEXT_SHADOW_SMALLGLOW_CLASS,
            this.TEXT_SHADOW_THINGLOW_CLASS
        );
        stickSpan.style.backgroundColor = '';

        const navIsHoveredOverall = this.navElement.classList.contains(this.NAV_CONTAINER_HOVER_CLASS);
        
        const shouldDisplayAsActive = isButtonActive && (!navIsHoveredOverall || (navIsHoveredOverall && isButtonHovered));
        
        let shouldBeSubaccent = false;
        if (!isButtonActive) {
            shouldBeSubaccent = true;
            if (navIsHoveredOverall && isButtonHovered) {
                 shouldBeSubaccent = false;
            }
        } else {
            if (navIsHoveredOverall && !isButtonHovered) {
                shouldBeSubaccent = true;
            }
        }


        if (shouldBeSubaccent) {
            anchor.classList.add(this.TEXT_SUBACCENT_CLASS);
            if (isHeroContext) {
                anchor.classList.add(this.TEXT_SHADOW_SMALLGLOW_CLASS);
                stickSpan.classList.add(this.TEXT_SHADOW_THINGLOW_CLASS);
            }
        }

        if (shouldDisplayAsActive) {
            anchor.classList.add(this.IS_ACTIVE_CLASS);
            anchor.classList.remove(this.TEXT_SUBACCENT_CLASS);
            if (isHeroContext) {
                anchor.classList.add(this.TEXT_SHADOW_LARGEGLOW_CLASS);
                stickSpan.classList.add(this.TEXT_SHADOW_LARGEGLOW_CLASS);
                anchor.classList.remove(this.TEXT_SHADOW_SMALLGLOW_CLASS);
                stickSpan.classList.remove(this.TEXT_SHADOW_THINGLOW_CLASS);
            }
        }
    }


    private renderNavButtons(): void {
        if (this.navElement.children.length > 0) {
            // TODO: Smarter validation or cleanup before rendering???
            return;
        }
        this.navButtonsData.forEach(buttonData => {
            const anchor = this.createElement('a', [
                this.NAV_BUTTON_CLASS,
                'leading-none', 'flex', 'flex-row', 'items-center', 'font-normal',
                'relative', 'overflow-hidden',
                'transition-all', 'duration-300', 'ease-in-out', 'cursor-pointer'
            ]);
            anchor.dataset.buttonId = buttonData.id;
            anchor.setAttribute('role', 'button');
            anchor.setAttribute('aria-label', `Go to ${buttonData.text} page`);


            const stickSpan = this.createElement('span', [
                this.NAV_BUTTON_STICK_CLASS,
                'absolute', 'left-0', 'w-0.5', 'h-3', 'rounded-full',
                'transition-all', 'duration-300', 'ease-in-out',
                'opacity-0', 
            ]);

            const textSpan = this.createElement('span', [
                this.NAV_BUTTON_TEXT_CLASS,
                'relative', 'z-10', 'transition-margin', 'duration-300', 'ease-in-out',
            ]);
            textSpan.textContent = buttonData.text;

            anchor.append(stickSpan, textSpan);

            anchor.addEventListener('click', this.handleButtonClick.bind(this));
            anchor.addEventListener('mouseenter', this.handleButtonMouseEnter.bind(this));
            anchor.addEventListener('mouseleave', this.handleButtonMouseLeave.bind(this));

            this.navElement.appendChild(anchor);
        });
    }

    private handleButtonClick(event: Event): void {
        event.preventDefault();
        const clickedButton = event.currentTarget as HTMLElement;
        const clickedId = clickedButton.dataset.buttonId;

        if (clickedId && this.currentActiveButtonId !== clickedId) {
            this.currentHoveredButton = null;
            this.navElement.classList.remove(this.NAV_CONTAINER_HOVER_CLASS);

            if (this.navigationRequestCallback) {
                this.navigationRequestCallback(clickedId);
            } else {
                console.warn('NavigationRequestCallback is not set in NavigationManager.');
            }
        }
    }

    private handleButtonMouseEnter(event: Event): void {
        if (this.navHoverTimeout) {
            clearTimeout(this.navHoverTimeout);
            this.navHoverTimeout = null;
        }
        this.navElement.classList.add(this.NAV_CONTAINER_HOVER_CLASS);
        this.currentHoveredButton = event.currentTarget as HTMLElement;
        this.updateNavButtonStates();
    }

    private handleButtonMouseLeave(): void {
        // this.currentHoveredButton = null;  ???
    }

    private addGlobalListeners(): void {
        this.navElement.addEventListener('mouseleave', () => {
            this.navHoverTimeout = setTimeout(() => {
                this.navElement.classList.remove(this.NAV_CONTAINER_HOVER_CLASS);
                this.currentHoveredButton = null;
                this.updateNavButtonStates();
            }, this.NAV_HOVER_TIMEOUT_MS);
        });

        this.navElement.addEventListener('mouseenter', () => {
            if (this.navHoverTimeout) {
                clearTimeout(this.navHoverTimeout);
                this.navHoverTimeout = null;
            }
            if (!this.navElement.classList.contains(this.NAV_CONTAINER_HOVER_CLASS)) {
                 this.navElement.classList.add(this.NAV_CONTAINER_HOVER_CLASS);
                 this.updateNavButtonStates();
            }
        });
    }

    public updateNavButtonStates(): void {
        this.navElement.classList.toggle(this.NAV_CONTAINER_HERO_CLASS, this.isHeroSectionActive);

        this.navElement.querySelectorAll<HTMLAnchorElement>(`.${this.NAV_BUTTON_CLASS}`).forEach(anchor => {
            const buttonId = anchor.dataset.buttonId;
            const stickSpan = anchor.querySelector<HTMLSpanElement>(`.${this.NAV_BUTTON_STICK_CLASS}`);
            
            if (buttonId && stickSpan) {
                const isButtonActive = buttonId === this.currentActiveButtonId;
                const isButtonHovered = anchor === this.currentHoveredButton;
                this.setButtonVisualState(anchor, stickSpan, isButtonActive, this.isHeroSectionActive, isButtonHovered);
            }
        });
    }

    public setHeroSectionActive(isActive: boolean): void {
        if (this.isHeroSectionActive !== isActive) {
            this.isHeroSectionActive = isActive;
            this.updateNavButtonStates();
        }
    }

    public setActiveButton(buttonId: string): void {
        if (this.currentActiveButtonId !== buttonId) {
            this.currentActiveButtonId = buttonId;
            this.updateNavButtonStates();
        }
    }

    public get currentActiveButtonIdGetter(): string {
        // QUESTION: DO WE REALLY NEED THIS?
        // This getter is used to access the current active button ID from outside the class.
        // but what for?
        return this.currentActiveButtonId;
    }
}