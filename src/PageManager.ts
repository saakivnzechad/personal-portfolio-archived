/*
 * Copyright (c) 2025 Danil Klimov.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { gsap } from 'gsap';
import { ParallaxManager } from './ParallaxManager';
import { NavigationManager } from './NavigationManager';
import { ProjectItemManager } from './ProjectItemManager';
import { HeroManager } from './HeroManager';
import { FormManager, type LocalizedFormTexts } from './FormManager';

interface GenericFormConfig {
    formSelector: string;
    messagesSelector: string;
    webAppUrl: string;
}

interface GenericProjectData {
    id: string;
    title: string;
    description: string;
    detailsDescription: string;
    imageSrc: string;
}

interface FormConfig {
    formSelector: string;
    messagesSelector: string;
    webAppUrl: string;
    texts: LocalizedFormTexts;
}

interface PageConfig<TFormConfig extends GenericFormConfig, TProjectData extends GenericProjectData> {
    id: string;
    content: () => Promise<string>;
    parallaxManagers: ParallaxManager[];
    arrowDownTarget?: string;
    projectData?: TProjectData[];
    initialActiveProjectId?: string;
    formConfig?: TFormConfig;
}

//major Manager for behaviour in desktop layout (presentation effect with page injecting).

export class PageManager<TFormConfig extends GenericFormConfig, TProjectData extends GenericProjectData> {
    private static readonly SCROLL_COOLDOWN_MS = 800;
    private static readonly PAGE_TRANSITION_DURATION = 0.6;
    private readonly mainContentElement: HTMLElement;
    private currentPageContainer: HTMLElement | null = null;
    private nextPageContainer: HTMLElement | null = null;
    private readonly pages: PageConfig<TFormConfig, TProjectData>[];
    private currentPageId: string | null = null;
    private currentFormManager: FormManager | null = null;
    private activeParallaxManagers: ParallaxManager[] = [];
    private isAnimatingPageChange = false;
    private readonly navigationManager: NavigationManager;
    private readonly heroManager: HeroManager;
    private currentProjectItemManager: ProjectItemManager<TProjectData> | null = null;
    private scrollTimeout: ReturnType<typeof setTimeout> | null = null;

    constructor(
        mainContentSelector: string,
        pages: PageConfig<TFormConfig, TProjectData>[],
        navigationManager: NavigationManager,
        heroManager: HeroManager
    ) {
        const element = document.querySelector(mainContentSelector) as HTMLElement | null;
        if (!element) {
            throw new Error(`Main content container not found with selector: ${mainContentSelector}`);
        }
        this.mainContentElement = element;
        this.pages = pages;
        this.navigationManager = navigationManager;
        this.heroManager = heroManager;

        const contactPage = pages.find(p => p.id === 'contacts');
        if (contactPage?.formConfig && (contactPage.formConfig as unknown as FormConfig).texts) {
            const formConfig = contactPage.formConfig as unknown as FormConfig;
            try {
                this.currentFormManager = new FormManager(
                    formConfig.formSelector,
                    formConfig.messagesSelector,
                    formConfig.webAppUrl,
                    formConfig.texts
                );
            } catch (error) {
                console.error('Error initializing FormManager:', error);
                this.currentFormManager = null;
            }
        }
    }

    public async init(initialPageId: string): Promise<void> {
        await this.loadPageInternal(initialPageId, true, 'next', true);
        this.attachScrollListener();
    }

    public async loadPage(pageId: string, direction: 'next' | 'prev'): Promise<void> {
        if (this.isAnimatingPageChange || this.currentPageId === pageId) return;
        await this.loadPageInternal(pageId, false, direction);
    }

    private async loadPageInternal(pageId: string, isInitialLoad: boolean, direction: 'next' | 'prev', skipOldPageAnimation: boolean = false): Promise<void> {
        if (this.isAnimatingPageChange && !isInitialLoad) return;

        const pageConfig = this.pages.find(p => p.id === pageId);
        if (!pageConfig) {
            console.error(`Page config not found for ID: ${pageId}`);
            return;
        }

        this.isAnimatingPageChange = true;
        this.deactivateParallaxManagers();
        this.deactivateFormManager();

        const pageContent = await pageConfig.content();
        const newContainer = this.createPageContainer(pageContent);
        this.nextPageContainer = newContainer;

        const masterTransition = gsap.timeline({
            onComplete: () => {
                if (this.currentPageContainer && this.mainContentElement.contains(this.currentPageContainer)) {
                    this.mainContentElement.removeChild(this.currentPageContainer);
                }
                if (this.currentPageId === 'main' && this.heroManager.hasActiveHeroElements()) {
                    this.heroManager.cleanupHeroElements();
                }
                this.currentPageContainer = this.nextPageContainer;
                this.nextPageContainer = null;
                this.currentPageId = pageId;
                this.setupNewPage(pageConfig);
                this.isAnimatingPageChange = false;
            },
        });

        if (this.currentPageId === 'main' && this.heroManager.hasActiveHeroElements() && !skipOldPageAnimation) {
            masterTransition.add(this.heroManager.getDisappearTimeline(), 0);
        }

        if (isInitialLoad) {
            this.mainContentElement.innerHTML = '';
            this.mainContentElement.appendChild(newContainer);
            gsap.set(newContainer, { y: '0%' });
        } else {
            this.mainContentElement.appendChild(newContainer);
            const startY = direction === 'next' ? '100%' : '-100%';
            gsap.set(newContainer, { y: startY });

            if (this.currentPageContainer && !skipOldPageAnimation) {
                masterTransition.to(this.currentPageContainer, {
                    y: direction === 'next' ? '-100%' : '100%',
                    duration: PageManager.PAGE_TRANSITION_DURATION,
                    ease: 'power2.inOut',
                }, 0);
            }
            masterTransition.to(newContainer, {
                y: '0%',
                duration: PageManager.PAGE_TRANSITION_DURATION,
                ease: 'power2.inOut',
            }, 0);
        }

        if (pageId === 'main') {
            this.heroManager.prepareHeroElements(newContainer);
            const heroAppearDelay = isInitialLoad ? 0.2 : 0.3;
            masterTransition.add(this.heroManager.getAppearTimeline(0), heroAppearDelay);
        }

        this.navigationManager.setActiveButton(pageId);
    }

    private createPageContainer(content: string): HTMLElement {
        const container = document.createElement('div');
        container.classList.add('page-container', 'absolute', 'inset-0', 'w-full', 'h-full');
        container.innerHTML = content;
        return container;
    }

    private setupNewPage(pageConfig: PageConfig<TFormConfig, TProjectData>): void {
        this.attachArrowNavListeners();
        this.activateParallaxManagers(pageConfig);
        this.setupProjectsPage(pageConfig);
        this.setupFormPage(pageConfig);
        this.navigationManager.setHeroSectionActive(pageConfig.id === 'main');
    }

    private activateParallaxManagers(pageConfig: PageConfig<TFormConfig, TProjectData>): void {
        pageConfig.parallaxManagers.forEach(manager => {
            const selector = manager.targetElementSelector;
            const isHeroElement = selector === '#hero-background' || selector === '#hero-fog';
            if (isHeroElement) {
                const managedHeroElement = this.heroManager.getManagedElementById(selector.substring(1));
                manager.activate(managedHeroElement ?? undefined);
            } else {
                manager.activate();
            }
        });
        this.activeParallaxManagers = pageConfig.parallaxManagers;
    }

    private deactivateParallaxManagers(): void {
        this.activeParallaxManagers.forEach(manager => manager.deactivate());
        this.activeParallaxManagers = [];
    }

    private setupProjectsPage(pageConfig: PageConfig<TFormConfig, TProjectData>): void {
        if (this.currentProjectItemManager) {
            this.currentProjectItemManager.deactivate();
            this.currentProjectItemManager = null;
        }

        if (pageConfig.id !== 'projects' || !pageConfig.projectData || !pageConfig.initialActiveProjectId || !this.currentPageContainer) return;

        const listContainer = this.currentPageContainer.querySelector('[data-component="projects-list"]');
        const descriptionEl = this.currentPageContainer.querySelector('#project-description');
        const imageEl = this.currentPageContainer.querySelector('#projects-image-wrapper img');

        if (listContainer && descriptionEl && imageEl) {
            try {
                this.currentProjectItemManager = new ProjectItemManager<TProjectData>(
                    listContainer as HTMLElement,
                    descriptionEl as HTMLElement,
                    imageEl as HTMLImageElement,
                    pageConfig.projectData,
                    pageConfig.initialActiveProjectId
                );
            } catch (error) {
                console.error('Error initializing ProjectItemManager:', error);
            }
        }
    }

    private setupFormPage(pageConfig: PageConfig<TFormConfig, TProjectData>): void {
        if (pageConfig.id === 'contacts' && this.currentFormManager) {
            this.currentFormManager.activate();
        }
    }

    private deactivateFormManager(): void {
        if (this.currentFormManager) {
            this.currentFormManager.deactivate();
        }
    }

    public getCurrentPageId(): string | null {
        return this.currentPageId;
    }

    public async navigateSequential(direction: 'next' | 'prev'): Promise<void> {
        if (this.isAnimatingPageChange || !this.currentPageId) return;

        const currentPageConfig = this.pages.find(p => p.id === this.currentPageId);
        if (!currentPageConfig) return;

        let targetPageId: string | undefined;
        if (direction === 'next') {
            targetPageId = currentPageConfig.arrowDownTarget;
        } else {
            const currentIndex = this.pages.findIndex(p => p.id === this.currentPageId);
            if (currentIndex > 0) {
                targetPageId = this.pages.find(p => p.arrowDownTarget === this.currentPageId)?.id ?? this.pages[currentIndex - 1].id;
            }
        }

        if (targetPageId && targetPageId !== this.currentPageId) {
            await this.loadPage(targetPageId, direction);
        }
    }

    private attachArrowNavListeners(): void {
        const oldArrowDown = document.querySelector('#arrow-down--internal');
        if (oldArrowDown) oldArrowDown.removeEventListener('click', this.handleArrowDownClick);

        if (this.currentPageContainer) {
            const newArrowDown = this.currentPageContainer.querySelector('#arrow-down--internal');
            if (newArrowDown) {
                newArrowDown.addEventListener('click', this.handleArrowDownClick);
            }
        }
    }

    private handleArrowDownClick = (): void => {
        this.navigateSequential('next');
    };

    private attachScrollListener(): void {
        window.removeEventListener('wheel', this.handleWheelScroll);
        window.addEventListener('wheel', this.handleWheelScroll, { passive: false });
    }

    private handleWheelScroll = (event: WheelEvent): void => {
        event.preventDefault();
        if (this.isAnimatingPageChange || this.scrollTimeout) return;

        this.scrollTimeout = setTimeout(() => {
            this.scrollTimeout = null;
        }, PageManager.SCROLL_COOLDOWN_MS);

        const direction = event.deltaY > 0 ? 'next' : 'prev';
        this.navigateSequential(direction);
    };
}