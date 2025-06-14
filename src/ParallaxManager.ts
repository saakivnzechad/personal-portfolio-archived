/*
 * Copyright (c) 2025 Danil Klimov.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { gsap } from 'gsap';

export class ParallaxManager {
    public readonly targetElementSelector: string; 
    private parallaxPower: number;
    private isActive: boolean = false;
    private mouseX: number = 0;
    private mouseY: number = 0;
    private targetElement: HTMLElement | null = null;
    private isMouseOverTarget: boolean = false;
    private freezeOnHover: boolean;

    private static readonly ANIMATION_DURATION = 0.8;
    private static readonly RESET_DURATION = 0.5;
    private static readonly ANIMATION_EASE = 'power2.out';
    private static readonly Z_INDEX_BOOST = 0.01;

    constructor(targetElementSelector: string, parallaxPower: number = 30, freezeOnHover: boolean = false) {
        this.targetElementSelector = targetElementSelector;
        this.parallaxPower = parallaxPower;
        this.freezeOnHover = freezeOnHover;
    }

    public activate(knownElement?: HTMLElement): void {
        if (this.isActive) return;

        if (knownElement) {
            this.targetElement = knownElement;
        } else {
            this.targetElement = document.querySelector(this.targetElementSelector) as HTMLElement | null;
        }

        if (!this.targetElement) {
            console.warn(`Parallax target element not found: ${this.targetElementSelector}. Parallax will not be activated.`);
            return;
        }

        this.isActive = true;
        document.addEventListener('mousemove', this.handleMouseMove);

        if (this.freezeOnHover) {
            this.targetElement.addEventListener('mouseenter', this.handleMouseEnterTarget);
            this.targetElement.addEventListener('mouseleave', this.handleMouseLeaveTarget);
        }
    }

    public deactivate(): void {
        if (!this.isActive) return;
        this.isActive = false;

        document.removeEventListener('mousemove', this.handleMouseMove);

        if (this.targetElement) {
            if (this.freezeOnHover) {
                this.targetElement.removeEventListener('mouseenter', this.handleMouseEnterTarget);
                this.targetElement.removeEventListener('mouseleave', this.handleMouseLeaveTarget);
            }

            gsap.to(this.targetElement, {
                x: 0,
                y: 0,
                duration: ParallaxManager.RESET_DURATION,
                ease: ParallaxManager.ANIMATION_EASE,
                overwrite: 'auto',
            });
        }
        this.targetElement = null;
    }

    private handleMouseMove = (e: MouseEvent): void => {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;

        if (!this.isActive || !this.targetElement) return;

        let targetX = 0;
        let targetY = 0;

        if (this.freezeOnHover && this.isMouseOverTarget) {
        } else {
            targetX = (this.mouseX / window.innerWidth - 0.5) * this.parallaxPower;
            targetY = (this.mouseY / window.innerHeight - 0.5) * this.parallaxPower;
        }

        gsap.to(this.targetElement, {
            x: targetX,
            y: targetY,
            z: ParallaxManager.Z_INDEX_BOOST,
            duration: ParallaxManager.ANIMATION_DURATION,
            ease: ParallaxManager.ANIMATION_EASE,
            overwrite: 'auto',
        });
    };

    private handleMouseEnterTarget = (): void => {
        this.isMouseOverTarget = true;
        this.handleMouseMove({ clientX: this.mouseX, clientY: this.mouseY } as MouseEvent); 
    };

    private handleMouseLeaveTarget = (): void => {
        this.isMouseOverTarget = false;
        this.handleMouseMove({ clientX: this.mouseX, clientY: this.mouseY } as MouseEvent);
    };
}