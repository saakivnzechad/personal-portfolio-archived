/*
 * Copyright (c) 2025 Danil Klimov.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const LANGUAGE_STORAGE_KEY = 'appLanguage';
const DEFAULT_LANGUAGE = 'ru';
const SUPPORTED_LANGUAGES = ['en', 'ru'];

let currentLanguage: string;
const subscribers: ((newLanguage: string) => void)[] = [];

function getPreferredLanguage(): string {
    const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (storedLanguage && SUPPORTED_LANGUAGES.includes(storedLanguage)) return storedLanguage;

    const browserLanguage = navigator.language.split('-')[0];
    return SUPPORTED_LANGUAGES.includes(browserLanguage) ? browserLanguage : DEFAULT_LANGUAGE;
}

export function setLanguage(newLang: string): void {
    if (!SUPPORTED_LANGUAGES.includes(newLang) || currentLanguage === newLang) return;
    currentLanguage = newLang;
    localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
    subscribers.forEach(callback => callback(currentLanguage));
}

export function getCurrentLanguage(): string {
    if (!currentLanguage) {
        const preferred = getPreferredLanguage();
        setLanguage(preferred);
    }
    return currentLanguage;
}

export function subscribeToLanguageChanges(callback: (newLanguage: string) => void): () => void {
    subscribers.push(callback);
    return () => {
        const index = subscribers.indexOf(callback);
        if (index !== -1) subscribers.splice(index, 1);
    };
}