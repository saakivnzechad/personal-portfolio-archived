/*
 * Copyright (c) 2025 Danil Klimov.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { getCurrentLanguage } from './utils/languageDetector';

export class LanguageSwitcherManager {
    private readonly switcherButton: HTMLButtonElement;
    private readonly ruSpan: HTMLSpanElement;
    private readonly enSpan: HTMLSpanElement;
    private readonly separatorSpan: HTMLSpanElement;
    private currentLanguage: 'ru' | 'en';
    private static readonly ACTIVE_CLASSES = ['text-white', 'font-semibold', 'is-active'];
    private static readonly INACTIVE_CLASSES = ['text-subaccent', 'font-normal'];

    constructor(selector: string) {
        const button = document.querySelector<HTMLButtonElement>(selector);
        if (!button) throw new Error(`Language switcher button not found with selector: ${selector}`);

        this.switcherButton = button;
        const ruSpan = button.querySelector<HTMLSpanElement>('[data-lang="ru"]');
        const enSpan = button.querySelector<HTMLSpanElement>('[data-lang="en"]');
        const separatorSpan = button.querySelector<HTMLSpanElement>('.lang-switcher__separator');

        if (!ruSpan || !enSpan || !separatorSpan) throw new Error('Language spans or separator not found within the switcher button.');

        this.ruSpan = ruSpan;
        this.enSpan = enSpan;
        this.separatorSpan = separatorSpan;
        this.currentLanguage = getCurrentLanguage() as 'ru' | 'en';
        this.init();
    }

    private init(): void {
        this.switcherButton.addEventListener('click', this.handleButtonClick);
        this.updateVisualState();
    }

    private handleButtonClick = (): void => {
        const nextLanguage = this.currentLanguage === 'ru' ? 'en' : 'ru';
        if (typeof (window as any).changeLanguage === 'function') {
            (window as any).changeLanguage(nextLanguage);
        } else {
            console.error('window.changeLanguage is not defined.');
        }
    };

    private updateVisualState(): void {
        const [activeSpan, inactiveSpan] = this.currentLanguage === 'ru' ? [this.ruSpan, this.enSpan] : [this.enSpan, this.ruSpan];
        activeSpan.classList.remove(...LanguageSwitcherManager.INACTIVE_CLASSES, ...LanguageSwitcherManager.ACTIVE_CLASSES);
        inactiveSpan.classList.remove(...LanguageSwitcherManager.INACTIVE_CLASSES, ...LanguageSwitcherManager.ACTIVE_CLASSES);
        activeSpan.classList.add(...LanguageSwitcherManager.ACTIVE_CLASSES);
        inactiveSpan.classList.add(...LanguageSwitcherManager.INACTIVE_CLASSES);
    }
}