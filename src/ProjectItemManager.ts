/*
 * Copyright (c) 2025 Danil Klimov.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { gsap } from 'gsap';

export interface ProjectData {
    id: string;
    title: string;
    description: string;
    detailsDescription: string;
    imageSrc: string;
}

export class ProjectItemManager<TProjectData extends ProjectData> {
    private readonly projectListContainer: HTMLElement;
    private projectItems: HTMLElement[] = [];
    private readonly projectDescriptionElement: HTMLElement;
    private readonly projectImageElement: HTMLImageElement;
    private readonly projectData: TProjectData[];
    private currentActiveProjectId: string | null = null;
    private currentHoveredItem: HTMLElement | null = null;
    private hoverTimeout: ReturnType<typeof setTimeout> | null = null;

    private readonly HOVER_TIMEOUT_MS = 100;

    private readonly CSS_CLASSES = {
        ITEM: 'project-item',
        ITEM_STICK: 'project-item__stick',
        ITEM_TITLE: 'project-item__title',
        ITEM_DESCRIPTION: 'project-item__description',
        IS_ACTIVE: 'is-active',
        IS_HOVER: 'is-hover',
        IS_LIST_HOVERED: 'is-list-hovered',
    };
    //list of css classes for ui/ux part of element behaviour. Search them in components/projectsItem.css

    private readonly TAILWIND_STRUCTURAL_CLASSES = {
        FLEX_ROW_ALIGN_CENTER_STICK_LEFT: ['flex', 'flex-row', 'items-center', 'justify-start', 'gap-3'],
        FLEX_COL_ALIGN_START_TEXT_RIGHT: ['flex', 'flex-col', 'items-start', 'justify-start', 'gap-3'],
    };

    constructor(
        listContainerElement: HTMLElement,
        descriptionElement: HTMLElement,
        imageElement: HTMLImageElement,
        projectData: TProjectData[],
        initialActiveProjectId: string
    ) {
        this.projectListContainer = listContainerElement;
        this.projectDescriptionElement = descriptionElement;
        this.projectImageElement = imageElement;
        this.projectData = projectData;
        this.currentActiveProjectId = initialActiveProjectId;

        this.init();
    }

    private init(): void {
        this.renderProjectItems();
        gsap.set(this.projectItems, { opacity: 0, y: 10 });
        this.addListeners();
        this.setActiveProject(this.currentActiveProjectId!, true);
        this.animateProjectItemsIn();
    }

    private createElement<K extends keyof HTMLElementTagNameMap>(
        tagName: K,
        initialClasses: string[] = []
    ): HTMLElementTagNameMap[K] {
        const element = document.createElement(tagName);
        if (initialClasses.length > 0) {
            element.classList.add(...initialClasses);
        }
        return element;
    }

    private renderProjectItems(): void {
        const h3Element = this.projectListContainer.querySelector('h3');

        const itemsParent = this.projectListContainer.querySelector('ul') || this.projectListContainer;
        if (itemsParent !== this.projectListContainer) {
            itemsParent.innerHTML = '';
        } else if (h3Element) {
            this.projectListContainer.innerHTML = '';
            this.projectListContainer.appendChild(h3Element);
        } else {
            this.projectListContainer.innerHTML = '';
        }


        this.projectData.forEach(project => {
            const listItem = this.createElement('li', [
                this.CSS_CLASSES.ITEM,
                'cursor-pointer',
                'will-change-auto',
            ]);
            listItem.dataset.projectId = project.id;

            const stickSpan = this.createElement('span', [this.CSS_CLASSES.ITEM_STICK]);
            const title = this.createElement('h4', [this.CSS_CLASSES.ITEM_TITLE]);
            title.textContent = project.title;

            const shortDescription = this.createElement('p', [this.CSS_CLASSES.ITEM_DESCRIPTION]);
            shortDescription.textContent = project.description;

            const titleWrapper = this.createElement('div');

            titleWrapper.appendChild(stickSpan);
            titleWrapper.appendChild(title);

            listItem.appendChild(titleWrapper);
            listItem.appendChild(shortDescription);

            if (itemsParent !== this.projectListContainer && itemsParent.tagName === 'UL') {
                itemsParent.appendChild(listItem);
            } else {
                this.projectListContainer.appendChild(listItem);
            }
        });

        this.projectItems = Array.from(
            itemsParent.querySelectorAll<HTMLElement>(`.${this.CSS_CLASSES.ITEM}`)
        );

        this.updateProjectItemStates(true);
    }

    private animateProjectItemsIn(): void {
        gsap.to(this.projectItems, {
            opacity: 1,
            y: 0,
            duration: 0.3,
            ease: 'power2.out',
            stagger: 0.07,
        });
    }

    private addListeners(): void {
        this.projectItems.forEach(item => {
            item.addEventListener('click', this.handleItemClick);
            item.addEventListener('mouseenter', this.handleItemMouseEnter);
        });
        this.projectListContainer.addEventListener('mouseenter', this.handleListMouseEnter);
        this.projectListContainer.addEventListener('mouseleave', this.handleListMouseLeave);
    }

    private removeListeners(): void {
        this.projectItems.forEach(item => {
            item.removeEventListener('click', this.handleItemClick);
            item.removeEventListener('mouseenter', this.handleItemMouseEnter);
        });
        this.projectListContainer.removeEventListener('mouseenter', this.handleListMouseEnter);
        this.projectListContainer.removeEventListener('mouseleave', this.handleListMouseLeave);
    }

    private handleListMouseEnter = (): void => {
        if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
            this.hoverTimeout = null;
        }
        this.projectListContainer.classList.add(this.CSS_CLASSES.IS_LIST_HOVERED);
        this.updateProjectItemStates();
    }


    private handleItemClick = (event: Event): void => {
        const clickedItem = (event.currentTarget as HTMLElement);
        const clickedId = clickedItem?.dataset.projectId;

        if (clickedId && this.currentActiveProjectId !== clickedId) {
            this.setActiveProject(clickedId, true);
        }
        this.currentHoveredItem = null;
        this.projectListContainer.classList.remove(this.CSS_CLASSES.IS_LIST_HOVERED);
        this.updateProjectItemStates();
    };

    private handleItemMouseEnter = (event: Event): void => {
        this.currentHoveredItem = event.currentTarget as HTMLElement;
        if (!this.projectListContainer.classList.contains(this.CSS_CLASSES.IS_LIST_HOVERED)) {
            this.projectListContainer.classList.add(this.CSS_CLASSES.IS_LIST_HOVERED);
        }
        this.updateProjectItemStates();
    };


    private handleListMouseLeave = (): void => {
        if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
        }
        this.hoverTimeout = setTimeout(() => {
            this.currentHoveredItem = null;
            this.projectListContainer.classList.remove(this.CSS_CLASSES.IS_LIST_HOVERED);
            this.updateProjectItemStates();
        }, this.HOVER_TIMEOUT_MS);
    };

    public deactivate(): void {
        console.log('[ProjectItemManager] Deactivating...');
        this.removeListeners();

        this.projectItems.forEach(item => {
            item.classList.remove(this.CSS_CLASSES.IS_ACTIVE, this.CSS_CLASSES.IS_HOVER);
            item.classList.remove(...this.TAILWIND_STRUCTURAL_CLASSES.FLEX_COL_ALIGN_START_TEXT_RIGHT, ...this.TAILWIND_STRUCTURAL_CLASSES.FLEX_ROW_ALIGN_CENTER_STICK_LEFT);


            const stick = item.querySelector<HTMLSpanElement>(`.${this.CSS_CLASSES.ITEM_STICK}`);
            const title = item.querySelector<HTMLElement>(`.${this.CSS_CLASSES.ITEM_TITLE}`);
            const description = item.querySelector<HTMLElement>(`.${this.CSS_CLASSES.ITEM_DESCRIPTION}`);

            gsap.set(item, { clearProps: 'all' });
            if (stick) gsap.set(stick, { clearProps: 'all' });
            if (title) gsap.set(title, { clearProps: 'all' });
            if (description) gsap.set(description, { clearProps: 'all' });
        });

        if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
            this.hoverTimeout = null;
        }
        this.currentHoveredItem = null;
        this.projectListContainer.classList.remove(this.CSS_CLASSES.IS_LIST_HOVERED);
        this.projectItems = [];
        console.log('[ProjectItemManager] Deactivated.');
    }

    public setActiveProject(projectId: string, updateContent: boolean = true): void {
        this.currentActiveProjectId = projectId;
        if (updateContent) {
            this.updateProjectContent(projectId);
        }
        this.updateProjectItemStates();
    }

    private updateProjectContent(projectId: string): void {
        const project = this.projectData.find(p => p.id === projectId);
        if (!project) return;

        const duration = 0.2;
        gsap.to(this.projectDescriptionElement, {
            opacity: 0,
            duration: duration / 2,
            onComplete: () => {
                this.projectDescriptionElement.textContent = project.detailsDescription;
                gsap.to(this.projectDescriptionElement, { opacity: 1, duration: duration / 2 });
            },
        });

        gsap.to(this.projectImageElement, {
            opacity: 0,
            duration: duration / 2,
            onComplete: () => {
                this.projectImageElement.src = project.imageSrc;
                this.projectImageElement.onload = () => {
                    gsap.to(this.projectImageElement, { opacity: 1, duration: duration / 2 });
                    this.projectImageElement.onload = null;
                }
                if (this.projectImageElement.complete && this.projectImageElement.naturalHeight > 0) {
                    gsap.to(this.projectImageElement, { opacity: 1, duration: duration / 2 });
                }
            },
        });
    }

    private resetItemToDefaultStructure(
        item: HTMLElement,
        stick: HTMLSpanElement,
        title: HTMLElement,
        description: HTMLElement
    ): void {
        item.classList.remove(...Object.values(this.TAILWIND_STRUCTURAL_CLASSES).flat());
        item.classList.add(...this.TAILWIND_STRUCTURAL_CLASSES.FLEX_COL_ALIGN_START_TEXT_RIGHT);

        const titleWrapperCurrent = title.parentElement;
        const descriptionCurrent = description.parentElement;

        let titleWrapper = item.querySelector<HTMLElement>(':scope > div:first-child');
        if (!titleWrapper || !titleWrapper.contains(stick) || !titleWrapper.contains(title)) {
            while (item.firstChild) { item.removeChild(item.firstChild); }

            titleWrapper = this.createElement('div');
            titleWrapper.appendChild(stick);
            titleWrapper.appendChild(title);

            item.appendChild(titleWrapper);
            item.appendChild(description);
        }
        titleWrapper.className = '';
        titleWrapper.classList.add(...['flex', 'flex-row', 'items-center', 'gap-2']);
    }

    private setupItemForActiveState(
        item: HTMLElement,
        stick: HTMLSpanElement,
        title: HTMLElement,
        description: HTMLElement
    ): void {
        item.classList.remove(...Object.values(this.TAILWIND_STRUCTURAL_CLASSES).flat());
        item.classList.add(...this.TAILWIND_STRUCTURAL_CLASSES.FLEX_ROW_ALIGN_CENTER_STICK_LEFT);

        if (item.firstChild !== stick) {
            while (item.firstChild) { item.removeChild(item.firstChild); }

            const contentWrapper = this.createElement('div');
            contentWrapper.classList.add(...this.TAILWIND_STRUCTURAL_CLASSES.FLEX_COL_ALIGN_START_TEXT_RIGHT);
            contentWrapper.classList.remove('gap-1');
            contentWrapper.classList.add('gap-3');


            contentWrapper.appendChild(title);
            contentWrapper.appendChild(description);

            item.appendChild(stick);
            item.appendChild(contentWrapper);
        }
    }

    public updateProjectItemStates(skipAnimations: boolean = false): void {
        const isListOverallHovered = this.projectListContainer.classList.contains(this.CSS_CLASSES.IS_LIST_HOVERED);
        const animDuration = skipAnimations ? 0 : 0.15;
        const animEase = 'power2.out';

        this.projectItems.forEach(item => {
            const itemId = item.dataset.projectId;
            if (!itemId) return;

            const isActive = itemId === this.currentActiveProjectId;
            const isHoveredOnListItem = item === this.currentHoveredItem;

            const stick = item.querySelector<HTMLSpanElement>(`.${this.CSS_CLASSES.ITEM_STICK}`);
            const title = item.querySelector<HTMLElement>(`.${this.CSS_CLASSES.ITEM_TITLE}`);
            const description = item.querySelector<HTMLElement>(`.${this.CSS_CLASSES.ITEM_DESCRIPTION}`);

            if (!stick || !title || !description) {
                console.warn(`[ProjectItemManager] Missing essential elements for project item ID: ${itemId}`);
                return;
            }

            item.classList.remove(this.CSS_CLASSES.IS_ACTIVE, this.CSS_CLASSES.IS_HOVER);

            let targetStickHeight: number | string = 12;
            if (isActive && !isListOverallHovered) {
                this.setupItemForActiveState(item, stick, title, description);
                item.classList.add(this.CSS_CLASSES.IS_ACTIVE);

                const contentWrapper = stick.nextElementSibling as HTMLElement;
                if (contentWrapper) {
                    targetStickHeight = contentWrapper.offsetHeight > 0 ? contentWrapper.offsetHeight : 'auto';
                }
            } else {
                this.resetItemToDefaultStructure(item, stick, title, description);
                targetStickHeight = 12;
            }

            gsap.set(stick, { height: targetStickHeight });

            if (isActive && !isListOverallHovered) {
                gsap.to(stick, { backgroundColor: '#FFFFFF', opacity: 1, duration: animDuration, ease: animEase });
                gsap.to(title, { color: '#FFFFFF', fontWeight: 600, duration: animDuration, ease: animEase });
                gsap.to(description, { color: '#D3DFE6', opacity: 0.9, duration: animDuration, ease: animEase });
            } else if (isListOverallHovered && isHoveredOnListItem) {
                item.classList.add(this.CSS_CLASSES.IS_HOVER);
                gsap.to(stick, { backgroundColor: '#FFFFFF', opacity: 0.9, duration: animDuration, ease: animEase });
                gsap.to(title, { color: '#FFFFFF', fontWeight: 400, duration: animDuration, ease: animEase });
                gsap.to(description, { color: '#D3DFE6', opacity: 0.9, duration: animDuration, ease: animEase });
            } else {
                gsap.to(stick, { backgroundColor: '#D3DFE6', opacity: 0.9, duration: animDuration, ease: animEase });
                gsap.to(title, { color: '#D3DFE6', fontWeight: 400, duration: animDuration, ease: animEase });
                gsap.to(description, { color: '#D3DFE6', opacity: 0.9, duration: animDuration, ease: animEase });
            }
            //i know, it might scare. But it's work. Trust me.
        });
    }
}