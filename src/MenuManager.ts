/*
 * Copyright (c) 2025 Danil Klimov.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { gsap } from 'gsap';

// this manager only for mobile menu hamburger

export class MenuManager {
    private openButton: HTMLElement | null;
    private closeButton: HTMLElement | null;
    private menuContainer: HTMLElement | null;
    private openButtonBg: HTMLElement | null;
    private isMenuOpen: boolean = false;
    private scrollStartThreshold: number;
    private scrollEndThreshold: number;
    private onCloseCallback: (() => void) | null = null;

    constructor() {
        this.openButton = document.querySelector('[data-menu-open-button]');
        this.closeButton = document.querySelector('[data-menu-close-button]');
        this.menuContainer = document.querySelector('[data-menu-container]');
        this.openButtonBg = document.querySelector('[data-menu-open-button-bg]');
        this.scrollStartThreshold = window.innerHeight * 0.6;
        this.scrollEndThreshold = window.innerHeight;
        this.handleScroll = this.handleScroll.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.toggleMenu = this.toggleMenu.bind(this);
    }

    public initialize(): void {
        if (!this.openButton || !this.closeButton || !this.menuContainer || !this.openButtonBg) return;

        gsap.set(this.menuContainer, { display: 'none' });
        gsap.set(this.openButton, { display: 'flex' });

        this.openButton.addEventListener('click', this.toggleMenu);
        this.closeButton.addEventListener('click', this.toggleMenu);
        window.addEventListener('scroll', this.handleScroll);
        window.addEventListener('resize', this.handleResize);
        this.handleScroll();
    }

    public setOnCloseCallback(callback: () => void): void {
        this.onCloseCallback = callback;
    }

    private handleResize(): void {
        this.scrollStartThreshold = window.innerHeight * 0.6;
        this.scrollEndThreshold = window.innerHeight;
        this.handleScroll();
    }

    private handleScroll(): void {
        if (this.isMenuOpen || !this.openButtonBg) return;

        const scrollPosition = window.scrollY;
        const progress = Math.min(Math.max((scrollPosition - this.scrollStartThreshold) / (this.scrollEndThreshold - this.scrollStartThreshold), 0), 1);

        gsap.to(this.openButtonBg, {
            opacity: progress,
            duration: 0.3,
            ease: 'power2.out',
            onUpdate: () => this.openButtonBg?.style.setProperty('opacity', this.openButtonBg.style.opacity, 'important'),
        });
    }

    private toggleMenu(): void {
        this.isMenuOpen ? this.closeMenu() : this.openMenu();
    }

    public openMenu(): void {
        if (this.isMenuOpen || !this.menuContainer || !this.openButton || !this.closeButton) return;

        this.isMenuOpen = true;
        gsap.set(this.openButton, { display: 'none' });
        gsap.set(this.menuContainer, { display: 'flex', opacity: 0, scale: 0.95, pointerEvents: 'none' });

        gsap.to(this.menuContainer, {
            opacity: 1,
            scale: 1,
            duration: 0.3,
            ease: 'power2.out',
            onComplete: () => {
                this.menuContainer!.style.pointerEvents = 'auto';
                this.openButton!.setAttribute('aria-expanded', 'true');
                this.closeButton!.setAttribute('aria-expanded', 'true');
                this.openButton!.setAttribute('aria-label', 'Close menu');
                this.closeButton!.setAttribute('aria-label', 'Close menu');
            },
        });
    }

    public closeMenu(): void {
        if (!this.isMenuOpen || !this.menuContainer || !this.openButton || !this.closeButton) return;

        this.isMenuOpen = false;
        gsap.set(this.menuContainer, { pointerEvents: 'none' });

        gsap.to(this.menuContainer, {
            opacity: 0,
            scale: 0.95,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => {
                gsap.set(this.menuContainer!, { display: 'none' });
                gsap.set(this.openButton!, { display: 'flex', opacity: 0 });
                gsap.to(this.openButton!, { opacity: 1, duration: 0.2 });

                this.openButton!.setAttribute('aria-expanded', 'false');
                this.closeButton!.setAttribute('aria-expanded', 'false');
                this.openButton!.setAttribute('aria-label', 'Open menu');
                this.closeButton!.setAttribute('aria-label', 'Open menu');

                this.onCloseCallback?.();
            },
        });
    }

    public destroy(): void {
        window.removeEventListener('scroll', this.handleScroll);
        window.removeEventListener('resize', this.handleResize);
        this.openButton?.removeEventListener('click', this.toggleMenu);
        this.closeButton?.removeEventListener('click', this.toggleMenu);
        gsap.killTweensOf([this.openButtonBg, this.menuContainer, this.openButton]);
    }
}