/*
 * Copyright (c) 2025 Danil Klimov.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { getIsMobile, subscribeToDeviceChanges } from './utils/deviceDetector';
import { getCurrentLanguage, setLanguage, subscribeToLanguageChanges } from './utils/languageDetector';

const LAST_KNOWN_DEVICE_TYPE_KEY = 'lastKnownDeviceType';
type SupportedLanguage = 'en' | 'ru';

const earlyTranslations = {
    common: {
        loadingOverlay: {
            text: {
                en: 'just a moment,<br/>magic happens✨',
                ru: 'один момент,<br/>магия происходит✨',
            },
            spinnerAlt: {
                en: 'Loading spinner',
                ru: 'Колесико загрузки',
            },
        },
    },
};

type ProjectData = {
    id: string;
    title: string;
    description: string;
    detailsDescription: string;
    imageSrc: string;
};

const allLocalizedFormTexts: Record<SupportedLanguage, {
    sendButton: string;
    sendingButton: string;
    cooldownMessage: (timeLeft: number) => string;
    requiredFields: string;
    invalidEmail: string;
    successMessage: string;
    errorMessage: string;
    submittingMessage: string;
}> = {
    en: {
        sendButton: 'Send message',
        sendingButton: 'Sending...',
        cooldownMessage: (timeLeft) => `Please, no rush. Kindly wait ${timeLeft} seconds before sending another message.`,
        requiredFields: 'Looks like something is missing? Please fill in all fields.',
        invalidEmail: 'Could you please check if the email address is correct?',
        successMessage: 'Message sent! Thank you!',
        errorMessage: 'Sending failed. The internet seems a bit tired. Please try again.',
        submittingMessage: 'Your message is currently being sent...',
    },
    ru: {
        sendButton: 'Отправить сообщение',
        sendingButton: 'Отправка...',
        cooldownMessage: (timeLeft) => `Пожалуйста, не спешите. Подождите ${timeLeft} секунд перед отправкой нового сообщения.`,
        requiredFields: 'Кажется, что-то забыли? Пожалуйста, заполните все поля.',
        invalidEmail: 'Гляньте пожалуйста, с почтовым адресом все в порядке?',
        successMessage: 'Сообщение отправлено! Спасибо!',
        errorMessage: 'Ошибка отправки. Кажется, у сервера лапки.. Пожалуйста, попробуйте вновь.',
        submittingMessage: 'Ваше сообщение уже отправляется...',
    },
};

const allLocalizedProjectItemsData: Record<SupportedLanguage, ProjectData[]> = {
    en: [
        {
            id: 'project-placeholder-1',
            title: 'There\'s project title. Where is it? →',
            description: 'Short project description for element in projects list. You can write any lenght text for it, but my advice - not much than 200 symbols',
            detailsDescription: 'Full project description under the picture. Feel free to write War and Peace here, but you really shouldn\'t.',
            imageSrc: '/images/%image_name%.webp',
        },
        {
            id: 'project-placeholder-2',
            title: 'There\'s project title. Where is it? →',
            description: 'Short project description for element in projects list. You can write any lenght text for it, but my advice - not much than 200 symbols',
            detailsDescription: 'Full project description under the picture. Feel free to write War and Peace here, but you really shouldn\'t.',
            imageSrc: '/images/%image_name%.webp',
        },
        {
            id: 'project-placeholder-3',
            title: 'There\'s project title. Where is it? →',
            description: 'Short project description for element in projects list. You can write any lenght text for it, but my advice - not much than 200 symbols',
            detailsDescription: 'Full project description under the picture. Feel free to write War and Peace here, but you really shouldn\'t.',
            imageSrc: '/images/%image_name%.webp',
        },
        //any more projects. But 3 - is recommend.
    ],
    ru: [
        {
            id: 'project-placeholder-1',
            title: 'There\'s project title. Where is it? →',
            description: 'Short project description for element in projects list. You can write any lenght text for it, but my advice - not much than 200 symbols',
            detailsDescription: 'Full project description under the picture. Feel free to write War and Peace here, but you really shouldn\'t.',
            imageSrc: '/images/%image_name%.webp',
        },
        {
            id: 'project-placeholder-2',
            title: 'There\'s project title. Where is it? →',
            description: 'Short project description for element in projects list. You can write any lenght text for it, but my advice - not much than 200 symbols',
            detailsDescription: 'Full project description under the picture. Feel free to write War and Peace here, but you really shouldn\'t.',
            imageSrc: '/images/%image_name%.webp',
        },
        {
            id: 'project-placeholder-3',
            title: 'There\'s project title. Where is it? →',
            description: 'Short project description for element in projects list. You can write any lenght text for it, but my advice - not much than 200 symbols',
            detailsDescription: 'Full project description under the picture. Feel free to write War and Peace here, but you really shouldn\'t.',
            imageSrc: '/images/%image_name%.webp',
        },
        //any more projects. But 3 - is recommend.
    ],
};

type NavButtonData = { id: string; text: string; href: string };

const allLocalizedNavButtonsData: Record<SupportedLanguage, NavButtonData[]> = {
    en: [
        { id: 'main', text: 'Home', href: '#main' },
        { id: 'skills', text: 'Skills', href: '#skills' },
        { id: 'projects', text: 'Projects', href: '#projects' },
        { id: 'contacts', text: 'Contact', href: '#contacts' },
    ],
    ru: [
        { id: 'main', text: 'Главная', href: '#main' },
        { id: 'skills', text: 'Навыки', href: '#skills' },
        { id: 'projects', text: 'Проекты', href: '#projects' },
        { id: 'contacts', text: 'Контакты', href: '#contacts' },
    ],
};

const GOOGLE_FORM_WEB_APP_URL = 'huh, it seems we need a url here. Isn\'t it?';
const localizedDataCache: Partial<Record<SupportedLanguage, {
    projectItems: ProjectData[];
    navButtons: NavButtonData[];
    formTexts: {
        sendButton: string;
        sendingButton: string;
        cooldownMessage: (timeLeft: number) => string;
        requiredFields: string;
        invalidEmail: string;
        successMessage: string;
        errorMessage: string;
        submittingMessage: string;
    };
}>> = {};

function getLocalizedData(language: SupportedLanguage) {
    if (localizedDataCache[language]) return localizedDataCache[language]!;
    const data = {
        projectItems: allLocalizedProjectItemsData[language] ?? allLocalizedProjectItemsData.en,
        navButtons: allLocalizedNavButtonsData[language] ?? allLocalizedNavButtonsData.en,
        formTexts: allLocalizedFormTexts[language] ?? allLocalizedFormTexts.en,
    };
    localizedDataCache[language] = data;
    return data;
}

document.addEventListener('DOMContentLoaded', async () => {
    const appRoot = document.getElementById('app-root');
    const loadingOverlay = document.getElementById('loading-overlay');

    if (!appRoot || !loadingOverlay) {
        console.error('App root or loading overlay element not found!');
        return;
    }

    loadingOverlay.classList.remove('hidden');

    const language = getCurrentLanguage() as SupportedLanguage;
    const textTranslations = earlyTranslations.common.loadingOverlay.text;
    const spinnerAltTranslations = earlyTranslations.common.loadingOverlay.spinnerAlt;
    const loadingOverlayText = loadingOverlay.querySelector('p');
    const loadingSpinnerAlt = loadingOverlay.querySelector('svg');

    if (loadingOverlayText && loadingSpinnerAlt) {
        loadingOverlayText.innerHTML = textTranslations[language] ?? textTranslations.en;
        loadingSpinnerAlt.setAttribute('aria-label', spinnerAltTranslations[language] ?? spinnerAltTranslations.en);
    }

    const { projectItems, navButtons, formTexts } = getLocalizedData(language);

    const isMobile = getIsMobile();
    const lastKnownDeviceType = localStorage.getItem(LAST_KNOWN_DEVICE_TYPE_KEY);
    const shouldReload = (lastKnownDeviceType === 'mobile' && !isMobile) || (lastKnownDeviceType === 'desktop' && isMobile);

    if (shouldReload) {
        localStorage.setItem(LAST_KNOWN_DEVICE_TYPE_KEY, isMobile ? 'mobile' : 'desktop');
        window.location.reload();
        return;
    }

    localStorage.setItem(LAST_KNOWN_DEVICE_TYPE_KEY, isMobile ? 'mobile' : 'desktop');

    try {
        const styles = document.createElement('link');
        styles.rel = 'stylesheet';
        styles.href = isMobile ? '/src/mobile.css' : '/src/desktop.css';
        document.head.appendChild(styles);

        if (isMobile) {
            const { initializeMobileApplication } = await import('./mobile-app-bootstrap');
            await initializeMobileApplication(appRoot, language, projectItems, navButtons, GOOGLE_FORM_WEB_APP_URL, formTexts);
        } else {
            const { initializeDesktopApplication } = await import('./desktop-app-bootstrap');
            await initializeDesktopApplication(appRoot, language, projectItems, navButtons, GOOGLE_FORM_WEB_APP_URL, formTexts);
        }
    } catch (error) {
        console.error('Failed to initialize application components:', error instanceof Error ? error.message : error);
    } finally {
        setTimeout(() => loadingOverlay.classList.add('hidden'), 300);
    }

    subscribeToDeviceChanges((newIsMobile) => {
        const currentDeviceType = localStorage.getItem(LAST_KNOWN_DEVICE_TYPE_KEY);
        const newDeviceType = newIsMobile ? 'mobile' : 'desktop';

        if (currentDeviceType !== newDeviceType) {
            localStorage.setItem(LAST_KNOWN_DEVICE_TYPE_KEY, newDeviceType);
            window.location.reload();
        }
    });

    (window as any).changeLanguage = (lang: string) => {
        const languageToSet = ['en', 'ru'].includes(lang) ? lang as SupportedLanguage : 'en';
        if (getCurrentLanguage() !== languageToSet) {
            setLanguage(languageToSet);
            window.location.reload();
        }
    };
});