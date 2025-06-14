/*
 * Copyright (c) 2025 Danil Klimov.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import './base.css';
import './components/projectItem.css';
import './components/navButton.css';
import './components/languageSwitcher.css';

import { ProjectItemManager, type ProjectData } from './ProjectItemManager';
import { FormManager, type LocalizedFormTexts } from './FormManager';
import { MenuManager } from './MenuManager';
import { MobileNavigationManager } from './MobileNavigationManager';
import { LanguageSwitcherManager } from './LanguageSwitcherManager';

export async function initializeMobileApplication(
    rootElement: HTMLElement,
    currentLanguage: string,
    projectItemsData: ProjectData[],
    navButtonsData: { id: string; text: string; href: string }[],
    googleFormWebAppUrl: string,
    localizedFormTexts: LocalizedFormTexts
): Promise<void> {
    try {
        if (!rootElement) throw new Error('Root element is not provided');

        const mobileLayoutModule = await import(`./layouts/${currentLanguage}/mobile-layout.html?raw`);
        rootElement.innerHTML = mobileLayoutModule.default;

        const projectListContainer = rootElement.querySelector('[data-component="projects-list"]') as HTMLElement;
        const projectDescriptionElement = rootElement.querySelector('#project-description') as HTMLElement;
        const projectImageElement = rootElement.querySelector('#projects-image-wrapper img') as HTMLImageElement;

        if (projectListContainer && projectDescriptionElement && projectImageElement && projectItemsData.length) {
            new ProjectItemManager<ProjectData>(
                projectListContainer,
                projectDescriptionElement,
                projectImageElement,
                projectItemsData,
                projectItemsData[0].id
            );
        }

        const formManager = new FormManager('#contact-form', '#form-messages', googleFormWebAppUrl, localizedFormTexts);
        formManager.activate();

        const menuManager = new MenuManager();
        menuManager.initialize();

        const languageSwitcherManager = new LanguageSwitcherManager('[data-lang-switcher]');

        const navigationManager = new MobileNavigationManager('[data-menu-nav-list]', navButtonsData, 'main');
        navigationManager.setNavigationRequestCallback((targetPageId: string) => {
            const targetElement = document.getElementById(targetPageId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
            menuManager.closeMenu();
        });
    } catch (error) {
        console.error('Failed to initialize mobile application components:', error instanceof Error ? error.message : error);
        throw error;
    }
}