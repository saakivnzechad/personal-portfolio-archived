/*
 * Copyright (c) 2025 Danil Klimov.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import './desktop.css';
import './components/navButton.css';
import './components/languageSwitcher.css';
import './components/fogEffect.css';
import './components/projectItem.css';

import { NavigationManager } from './NavigationManager';
import { LanguageSwitcherManager } from './LanguageSwitcherManager';
import { ParallaxManager } from './ParallaxManager';
import { PageManager } from './PageManager';
import { HeroManager } from './HeroManager';
import { ProjectItemManager, type ProjectData } from './ProjectItemManager';
import { FormManager, type LocalizedFormTexts } from './FormManager';
// linter is a wonderful thing. But at this stage i’m already afraid to cut something

const parallaxConfigs = {
    heroTitle: { selector: '#hero-title', power: 1.5, freeze: true },
    heroButtons: { selector: '#hero-buttons', power: 1.5, freeze: false },
    heroBackground: { selector: '#hero-background', power: 4, freeze: false },
    heroFog: { selector: '#hero-fog', power: 6, freeze: false },
    skillsImage: { selector: '#skills-image-wrapper', power: 2, freeze: true },
    projectsImage: { selector: '#projects-image-wrapper', power: 2, freeze: true },
    formWrapper: { selector: '#form-wrapper', power: 2, freeze: true },
};

const initializeParallaxManagers = (configs: typeof parallaxConfigs): { [key: string]: ParallaxManager } => {
    return Object.entries(configs).reduce((managers, [key, config]) => {
        managers[key] = new ParallaxManager(config.selector, config.power, config.freeze);
        return managers;
    }, {} as { [key: string]: ParallaxManager });
};

const parallaxManagers = initializeParallaxManagers(parallaxConfigs);

interface FormConfig {
    formSelector: string;
    messagesSelector: string;
    webAppUrl: string;
    texts: LocalizedFormTexts;
}

interface PageConfig {
    id: string;
    content: () => Promise<string>;
    parallaxManagers: ParallaxManager[];
    arrowDownTarget?: string;
    projectData?: ProjectData[];
    initialActiveProjectId?: string;
    formConfig?: FormConfig;
}

export async function initializeDesktopApplication(
    rootElement: HTMLElement,
    currentLanguage: string,
    projectItemsData: ProjectData[],
    navButtonsData: { id: string; text: string; href: string }[],
    googleFormWebAppUrl: string,
    localizedFormTexts: LocalizedFormTexts
): Promise<void> {
    try {
        if (!rootElement) throw new Error('Root element is not provided');

        const desktopLayoutModule = await import(`./layouts/${currentLanguage}/desktop-layout.html?raw`);
        rootElement.innerHTML = desktopLayoutModule.default;

        const pagesConfig: PageConfig[] = [
            {
                id: 'main',
                content: async () => (await import(`./pages/${currentLanguage}/main.html?raw`)).default,
                parallaxManagers: [
                    parallaxManagers.heroTitle,
                    parallaxManagers.heroButtons,
                    parallaxManagers.heroBackground,
                    parallaxManagers.heroFog,
                ],
                arrowDownTarget: 'skills',
            },
            {
                id: 'skills',
                content: async () => (await import(`./pages/${currentLanguage}/skills.html?raw`)).default,
                parallaxManagers: [parallaxManagers.skillsImage],
                arrowDownTarget: 'projects',
            },
            {
                id: 'projects',
                content: async () => (await import(`./pages/${currentLanguage}/projects.html?raw`)).default,
                parallaxManagers: [parallaxManagers.projectsImage],
                projectData: projectItemsData,
                initialActiveProjectId: projectItemsData[0]?.id,
                arrowDownTarget: 'contacts',
            },
            {
                id: 'contacts',
                content: async () => (await import(`./pages/${currentLanguage}/contacts.html?raw`)).default,
                parallaxManagers: [parallaxManagers.formWrapper],
                formConfig: {
                    formSelector: '#contact-form',
                    messagesSelector: '#form-messages',
                    webAppUrl: googleFormWebAppUrl,
                    texts: localizedFormTexts,
                },
            },
        ];

        const navManager = new NavigationManager('[data-component="ts-nav"]', navButtonsData, 'main');
        const heroManager = new HeroManager();
        const pageManager = new PageManager<FormConfig, ProjectData>('#app-pages-container', pagesConfig, navManager, heroManager);
        new LanguageSwitcherManager('[data-lang-switcher]');

        const handleNavigationRequest = async (newActiveId: string): Promise<void> => {
            const currentPageId = pageManager.getCurrentPageId();
            if (!currentPageId || currentPageId === newActiveId) return;

            const currentPageConfig = pagesConfig.find(p => p.id === currentPageId);
            const newPageConfig = pagesConfig.find(p => p.id === newActiveId);

            if (!currentPageConfig || !newPageConfig) {
                console.error(`Page configuration not found for current (${currentPageId}) or new (${newActiveId}) page.`);
                return;
            }

            const currentPageIndex = pagesConfig.indexOf(currentPageConfig);
            const newPageIndex = pagesConfig.indexOf(newPageConfig);
            const direction = newPageIndex > currentPageIndex ? 'next' : 'prev';

            await pageManager.loadPage(newActiveId, direction);
        };

        navManager.setNavigationRequestCallback(handleNavigationRequest);
        await pageManager.init('main');
    } catch (error) {
        console.error('Failed to initialize desktop application components:', error instanceof Error ? error.message : error);
        throw error;
    }
}