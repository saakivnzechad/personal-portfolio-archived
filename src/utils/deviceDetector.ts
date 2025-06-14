/*
 * Copyright (c) 2025 Danil Klimov.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const subscribers: ((isMobile: boolean) => void)[] = [];
let isMobile = window.matchMedia('(hover: none) and (pointer: coarse)').matches || window.innerWidth <= 1023;

function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: number | undefined;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

function updateAndNotify(): void {
    const newIsMobile = window.matchMedia('(hover: none) and (pointer: coarse)').matches || window.innerWidth <= 1023;
    if (newIsMobile !== isMobile) {
        isMobile = newIsMobile;
        subscribers.forEach(callback => callback(isMobile));
    }
}

const debouncedUpdateAndNotify = debounce(updateAndNotify, 200);

window.addEventListener('resize', debouncedUpdateAndNotify);
window.matchMedia('(hover: none) and (pointer: coarse)').addEventListener('change', debouncedUpdateAndNotify);

export function getIsMobile(): boolean {
    return isMobile;
}

export function subscribeToDeviceChanges(callback: (isMobile: boolean) => void): () => void {
    subscribers.push(callback);
    return () => {
        const index = subscribers.indexOf(callback);
        if (index !== -1) subscribers.splice(index, 1);
    };
}