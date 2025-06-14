/*
 * Copyright (c) 2025 Danil Klimov.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { gsap } from 'gsap';

interface FormData {
    name: string;
    email: string;
    text: string;
}

export interface LocalizedFormTexts {
    sendButton: string;
    sendingButton: string;
    cooldownMessage: (timeLeft: number) => string;
    requiredFields: string;
    invalidEmail: string;
    successMessage: string;
    errorMessage: string;
    submittingMessage: string;
}

export class FormManager {
    private formElement: HTMLFormElement | null = null;
    private submitButton: HTMLButtonElement | null = null;
    private submitButtonTextSpan: HTMLSpanElement | null = null;
    private submitButtonArrowSpan: HTMLSpanElement | null = null;
    private messagesElement: HTMLElement | null = null;
    private readonly formSelector: string;
    private readonly messagesSelector: string;
    private readonly webAppUrl: string;
    private readonly texts: LocalizedFormTexts;
    private isSubmitting: boolean = false;
    private lastSubmitTime: number = 0;
    private readonly COOLDOWN_PERIOD_MS = 5000;
    private readonly BASE_MESSAGE_CLASSES = ['mt-8', 'text-center', 'text-sm', 'font-light', 'leading-none', 'opacity-90'];
    private readonly BUTTON_DEFAULT_CLASSES = ['bg-black', 'outline-white'];
    private readonly BUTTON_ACTIVE_CLASSES = ['bg-subaccent', 'outline-subaccent'];
    private readonly TEXT_DEFAULT_CLASSES = ['font-normal', 'text-subaccent'];
    private readonly TEXT_ACTIVE_CLASSES = ['font-semibold', 'text-black'];
    private readonly ARROW_HIDDEN_CLASS = 'hidden';

    constructor(formSelector: string, messagesSelector: string, webAppUrl: string, texts: LocalizedFormTexts) {
        this.formSelector = formSelector;
        this.messagesSelector = messagesSelector;
        this.webAppUrl = webAppUrl;
        this.texts = texts;
    }

    public activate(): void {
        this.formElement = document.querySelector<HTMLFormElement>(this.formSelector);
        this.messagesElement = document.querySelector<HTMLElement>(this.messagesSelector);

        if (!this.formElement || !this.messagesElement) {
            console.error('FormManager activation failed: form or messages element not found.');
            return;
        }

        this.submitButton = this.formElement.querySelector('button[type="submit"]');
        this.submitButtonTextSpan = (this.submitButton?.querySelector('span:first-child') as HTMLSpanElement) ?? null;
        this.submitButtonArrowSpan = this.submitButton?.querySelector('span:last-child') ?? null;

        if (!this.submitButton || !this.submitButtonTextSpan || !this.submitButtonArrowSpan) {
            console.error('FormManager activation failed: submit button or its spans not found.');
            return;
        }

        this.formElement.addEventListener('submit', this.handleSubmit);
        this.resetFormState();
    }

    public deactivate(): void {
        if (!this.formElement) return;

        this.formElement.removeEventListener('submit', this.handleSubmit);
        this.resetFormState();
        gsap.killTweensOf([this.submitButton, this.submitButtonTextSpan, this.messagesElement]);
        this.formElement = null;
        this.submitButton = null;
        this.submitButtonTextSpan = null;
        this.submitButtonArrowSpan = null;
        this.messagesElement = null;
    }

    private resetFormState(): void {
        if (!this.submitButton || !this.submitButtonTextSpan || !this.submitButtonArrowSpan || !this.messagesElement) return;

        this.isSubmitting = false;
        this.submitButton.disabled = false;
        this.messagesElement.textContent = '';
        this.messagesElement.className = this.BASE_MESSAGE_CLASSES.join(' ');
        this.submitButton.classList.remove(...this.BUTTON_ACTIVE_CLASSES);
        this.submitButton.classList.add(...this.BUTTON_DEFAULT_CLASSES);
        this.submitButtonTextSpan.classList.remove(...this.TEXT_ACTIVE_CLASSES);
        this.submitButtonTextSpan.classList.add(...this.TEXT_DEFAULT_CLASSES);
        this.submitButtonTextSpan.textContent = this.texts.sendButton;
        this.submitButtonArrowSpan.classList.remove(this.ARROW_HIDDEN_CLASS);
        this.submitButtonArrowSpan.style.pointerEvents = 'auto';
    }

    private validateEmail(email: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    private validateRequiredFields(data: FormData): boolean {
        return ['name', 'email', 'text'].every(field => data[field as keyof FormData]?.trim());
    }

    private showMessage(message: string, type: 'success' | 'error' | 'info'): void {
        if (!this.messagesElement) return;
        this.messagesElement.textContent = message;
        this.messagesElement.className = this.BASE_MESSAGE_CLASSES.join(' ');
        this.messagesElement.classList.add(type === 'error' ? 'text-red-200' : 'text-subaccent');
    }

    private animateButton(isLoading: boolean): void {
        if (!this.submitButton || !this.submitButtonTextSpan || !this.submitButtonArrowSpan) return;

        this.submitButton.disabled = isLoading;
        const buttonProps = isLoading
            ? { backgroundColor: 'var(--color-subaccent)', classesToAdd: this.BUTTON_ACTIVE_CLASSES, classesToRemove: this.BUTTON_DEFAULT_CLASSES }
            : { backgroundColor: 'var(--color-black, #000000)', classesToAdd: this.BUTTON_DEFAULT_CLASSES, classesToRemove: this.BUTTON_ACTIVE_CLASSES };
        const textProps = isLoading
            ? { color: 'var(--color-black, #000000)', fontWeight: 600, classesToAdd: this.TEXT_ACTIVE_CLASSES, classesToRemove: this.TEXT_DEFAULT_CLASSES, text: this.texts.sendingButton }
            : { color: 'var(--color-subaccent)', fontWeight: 400, classesToAdd: this.TEXT_DEFAULT_CLASSES, classesToRemove: this.TEXT_ACTIVE_CLASSES, text: this.texts.sendButton };

        gsap.to(this.submitButton, {
            duration: 0.3,
            backgroundColor: buttonProps.backgroundColor,
            ease: 'power2.out',
            onStart: () => {
                this.submitButton?.classList.remove(...buttonProps.classesToRemove);
                this.submitButton?.classList.add(...buttonProps.classesToAdd);
            },
        });
        gsap.to(this.submitButtonTextSpan, {
            duration: 0.3,
            color: textProps.color,
            fontWeight: textProps.fontWeight,
            ease: 'power2.out',
            onStart: () => {
                this.submitButtonTextSpan?.classList.remove(...textProps.classesToRemove);
                this.submitButtonTextSpan?.classList.add(...textProps.classesToAdd);
                this.submitButtonTextSpan!.textContent = textProps.text;
            },
        });
        this.submitButtonArrowSpan.classList.toggle(this.ARROW_HIDDEN_CLASS, isLoading);
        this.submitButtonArrowSpan.style.pointerEvents = isLoading ? 'none' : 'auto';
    }

    private handleSubmit = async (event: Event): Promise<void> => {
        event.preventDefault();
        if (!this.formElement || !this.messagesElement) return;

        if (this.isSubmitting) {
            this.showMessage(this.texts.submittingMessage, 'info');
            return;
        }

        const now = Date.now();
        if (this.lastSubmitTime && now - this.lastSubmitTime < this.COOLDOWN_PERIOD_MS) {
            this.showMessage(this.texts.cooldownMessage(Math.ceil((this.COOLDOWN_PERIOD_MS - (now - this.lastSubmitTime)) / 1000)), 'info');
            return;
        }

        const formData = new FormData(this.formElement);
        const data: FormData = {
            name: String(formData.get('name') || ''),
            email: String(formData.get('email') || ''),
            text: String(formData.get('text') || ''),
        };

        if (!this.validateRequiredFields(data)) {
            this.showMessage(this.texts.requiredFields, 'error');
            return;
        }

        if (!this.validateEmail(data.email)) {
            this.showMessage(this.texts.invalidEmail, 'error');
            return;
        }

        this.isSubmitting = true;
        this.animateButton(true);

        try {
            await fetch(this.webAppUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(Object.entries(data)).toString(),
            });
            this.showMessage(this.texts.successMessage, 'success');
            this.formElement.reset();
            this.lastSubmitTime = now;
        } catch (error) {
            console.error('Error when sending form:', error);
            this.showMessage(this.texts.errorMessage, 'error');
        } finally {
            this.animateButton(false);
            this.isSubmitting = false;
        }
    };
}