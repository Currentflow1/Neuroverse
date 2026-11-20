
document.addEventListener("DOMContentLoaded", () => {
    // =================================================
    // DOM ELEMENTS
    // =================================================

    const partsList = document.getElementById("brain-parts-list");
    const detailsPanel = document.getElementById("brain-part-details");
    const searchInput = document.getElementById("search-input");
    const structureCount = document.getElementById("structure-count");
    const clearButton = document.getElementById("clear-selection");

    const transparencySlider = document.getElementById(
        "brain-transparency"
    );

    const transparencyValue = document.getElementById(
        "transparency-value"
    );

    const resetViewButton = document.getElementById(
        "reset-brain-view"
    );

    if (!partsList || !detailsPanel || !searchInput) {
        console.error("Neuroverse: Required explorer elements are missing.");
        return;
    }

    // =================================================
    // APPLICATION STATE
    // =================================================

    let djangoParts = [];
    let manifestParts = [];
    let allStructures = [];

    let selectedStructure = null;
    let activeCategory = "all";
    let viewerReady = false;
    let currentTransparency = 0;

    // =================================================
    // UTILITIES
    // =================================================

    function normalize(value) {
        return String(value ?? "")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");
    }

    function cleanAnatomicalName(value) {
        return String(value ?? "")
            .trim()
            .replace(/\.(l|r)$/i, "");
    }

    function categoryForManifest(entry) {
        const category = normalize(entry.category);

        if (category === "cortex") return "cortex";
        if (category === "lobe") return "lobe";

        const internalCategories = [
            "cerebellum",
            "brainstem",
            "diencephalon",
            "deepgrey",
            "whitematter",
            "tracts",
            "ventricles",
            "cranialnerves",
            "arteries",
            "veinssinuses",
            "meningesdura"
        ];

        return internalCategories.includes(category)
            ? "structure"
            : "region";
    }

    function categoryColor(category) {
        const colors = {
            lobe: "#38bdf8",
            cortex: "#a78bfa",
            structure: "#34d399",
            region: "#fbbf24"
        };

        return colors[category] || "#94a3b8";
    }

    function categoryLabel(category) {
        const labels = {
            lobe: "Lobe",
            cortex: "Cortex",
            structure: "Internal Structure",
            region: "Functional Region"
        };

        return labels[category] || "Anatomical Structure";
    }

    function structureKey(structure) {
        return structure.type === "manifest"
            ? `manifest-${structure.id}`
            : `django-${structure.id}`;
    }

    function searchableText(structure) {
        return [
            structure.name,
            structure.label,
            structure.category,
            structure.side,
            structure.region,
            structure.location,
            structure.function,
            structure.damage_effects,
            structure.fact
        ].join(" ").toLowerCase();
    }

    // =================================================
    // DJANGO RECORD MATCHING
    // =================================================

    function findRelatedDjangoPart(entry) {
        const entryNames = [
            normalize(entry.name),
            normalize(cleanAnatomicalName(entry.name)),
            normalize(entry.label)
        ].filter(Boolean);

        return djangoParts.find(part => {
            const partNames = [
                normalize(part.name),
                normalize(part.mesh_name),
                normalize(part.slug)
            ].filter(Boolean);

            return entryNames.some(name =>
                partNames.includes(name)
            );
        }) || null;
    }

    // =================================================
    // BUILD STRUCTURE COLLECTION
    // =================================================

    function buildStructureCollection() {
        const databaseStructures = djangoParts.map(part => ({
            ...part,
            type: "django",
            label: part.name,
            displayCategory: part.category || "region",
            side: null,
            region: "",
            relatedPart: part
        }));

        const atlasStructures = manifestParts.map(entry => ({
            ...entry,
            type: "manifest",
            label: entry.label || entry.name,
            displayCategory: categoryForManifest(entry),
            relatedPart: findRelatedDjangoPart(entry)
        }));

        allStructures = [
            ...databaseStructures,
            ...atlasStructures
        ];

        console.log(
            `NEUROVERSE: ${databaseStructures.length} database structures, ` +
            `${atlasStructures.length} atlas structures.`
        );

        renderStructures();
    }

    // =================================================
    // SEARCH FILTERING
    // =================================================

    function getFilteredStructures() {
        const query = searchInput.value.trim().toLowerCase();

        return allStructures.filter(structure => {
            const matchesSearch =
                !query || searchableText(structure).includes(query);

            const matchesCategory =
                activeCategory === "all" ||
                structure.displayCategory === activeCategory;

            return matchesSearch && matchesCategory;
        });
    }

    // =================================================
    // RENDER STRUCTURE LIST
    // =================================================

    function renderStructures() {
        const filtered = getFilteredStructures();

        partsList.replaceChildren();

        if (structureCount) {
            structureCount.textContent = filtered.length;
        }

        if (!filtered.length) {
            const empty = document.createElement("div");

            empty.className =
                "px-4 py-8 text-center text-sm text-slate-400";

            empty.textContent =
                "No matching anatomical structures found.";

            partsList.appendChild(empty);
            return;
        }

        const fragment = document.createDocumentFragment();

        filtered.forEach(structure => {
            const button = document.createElement("button");

            const isSelected = selectedStructure &&
                structureKey(selectedStructure) === structureKey(structure);

            button.type = "button";
            button.dataset.structureKey = structureKey(structure);

            button.className = [
                "w-full flex items-start gap-3 rounded-xl px-3 py-3",
                "text-left transition-colors duration-150 border",
                isSelected
                    ? "bg-cyan-500/10 border-cyan-400/50"
                    : "bg-transparent border-transparent hover:bg-slate-800/80"
            ].join(" ");

            const dot = document.createElement("span");

            dot.className =
                "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full";

            dot.style.backgroundColor =
                categoryColor(structure.displayCategory);

            const content = document.createElement("span");
            content.className = "min-w-0 flex-1";

            const name = document.createElement("span");

            name.className =
                "block text-sm font-medium text-slate-100";

            name.textContent = structure.label || structure.name;

            const metadata = document.createElement("span");

            metadata.className =
                "mt-1 block text-xs text-slate-400";

            const metadataItems = [
                categoryLabel(structure.displayCategory)
            ];

            if (structure.side) {
                metadataItems.push(structure.side);
            }

            if (structure.region) {
                metadataItems.push(structure.region);
            }

            metadata.textContent = metadataItems.join(" · ");

            content.append(name, metadata);
            button.append(dot, content);

            button.addEventListener("click", () => {
                selectStructure(structure, {
                    updateSearch: true,
                    highlight: true
                });
            });

            button.addEventListener("dblclick", event => {
                event.preventDefault();

                selectStructure(structure, {
                    updateSearch: true,
                    highlight: true
                });

                if (viewerReady && window.brainViewer) {
                    const focused =
                        window.brainViewer.focusPart(structure);

                    if (!focused) {
                        console.warn(
                            "This structure has no mapped 3D meshes:",
                            structure.name
                        );
                    }
                }
            });

            fragment.appendChild(button);
        });

        partsList.appendChild(fragment);
    }

    // =================================================
    // DETAILS PANEL
    // =================================================

    function addDetailSection(parent, heading, value) {
        if (!value) return;

        const section = document.createElement("section");
        section.className = "space-y-1";

        const title = document.createElement("h4");

        title.className =
            "text-xs font-semibold uppercase tracking-wider text-cyan-400";

        title.textContent = heading;

        const paragraph = document.createElement("p");

        paragraph.className =
            "text-sm leading-relaxed text-slate-300 whitespace-pre-line";

        paragraph.textContent = String(value);

        section.append(title, paragraph);
        parent.appendChild(section);
    }

    function renderDetails(structure) {
        detailsPanel.replaceChildren();

        if (!structure) {
            const placeholder = document.createElement("div");

            placeholder.className =
                "flex h-full min-h-48 flex-col items-center justify-center " +
                "text-center text-slate-500";

            const title = document.createElement("p");

            title.className = "font-medium text-slate-300";
            title.textContent = "No structure selected";

            const description = document.createElement("p");

            description.className = "mt-2 text-sm";
            description.textContent =
                "Select a structure from the list or click directly " +
                "on the 3D brain.";

            placeholder.append(title, description);
            detailsPanel.appendChild(placeholder);

            return;
        }

        const related = structure.type === "manifest"
            ? structure.relatedPart
            : structure;

        const heading = document.createElement("div");
        heading.className = "space-y-2";

        const name = document.createElement("h3");

        name.className = "text-xl font-bold text-white";
        name.textContent = structure.label || structure.name;

        const badges = document.createElement("div");
        badges.className = "flex flex-wrap gap-2";

        const categoryBadge = document.createElement("span");

        categoryBadge.className =
            "rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-300";

        categoryBadge.textContent =
            categoryLabel(structure.displayCategory);

        badges.appendChild(categoryBadge);

        if (structure.side) {
            const sideBadge = document.createElement("span");

            sideBadge.className =
                "rounded-full bg-slate-700 px-3 py-1 text-xs text-slate-300";

            sideBadge.textContent =
                structure.side.charAt(0).toUpperCase() +
                structure.side.slice(1) + " hemisphere";

            badges.appendChild(sideBadge);
        }

        heading.append(name, badges);
        detailsPanel.appendChild(heading);

        const divider = document.createElement("div");

        divider.className = "my-4 border-t border-slate-700";
        detailsPanel.appendChild(divider);

        if (structure.type === "manifest") {
            addDetailSection(
                detailsPanel,
                "Anatomical region",
                structure.region
            );

            addDetailSection(
                detailsPanel,
                "Atlas category",
                structure.category
            );

            addDetailSection(
                detailsPanel,
                "Anatomical data source",
                structure.source
            );
        }

        if (related) {
            addDetailSection(
                detailsPanel,
                "Location",
                related.location
            );

            addDetailSection(
                detailsPanel,
                "Function",
                related.function
            );

            addDetailSection(
                detailsPanel,
                "Effects of damage",
                related.damage_effects
            );

            addDetailSection(
                detailsPanel,
                "Interesting fact",
                related.fact
            );
        } else {
            addDetailSection(
                detailsPanel,
                "Anatomical information",
                "This structure is identified in the 3D anatomical atlas. " +
                "Detailed functional information has not yet been added " +
                "to the anatomy database."
            );
        }
    }

    // =================================================
    // SELECT STRUCTURE
    // =================================================

    function selectStructure(structure, options = {}) {
        if (!structure) return;

        const {
            updateSearch = false,
            highlight = true
        } = options;

        selectedStructure = structure;

        if (updateSearch) {
            searchInput.value = structure.label || structure.name;
        }

        renderStructures();
        renderDetails(structure);

        if (highlight && viewerReady && window.brainViewer) {
            const success =
                window.brainViewer.highlightPart(structure);

            if (!success) {
                console.warn(
                    "Structure has no matching GLB mesh:",
                    structure.name
                );
            }
        }
    }

    // =================================================
    // SEARCH INPUT
    // =================================================

    searchInput.addEventListener("input", renderStructures);

    // =================================================
    // CATEGORY FILTERS
    // =================================================

    document.querySelectorAll(".category-filter").forEach(button => {
        button.addEventListener("click", () => {
            activeCategory = button.dataset.category || "all";

            document.querySelectorAll(".category-filter").forEach(item => {
                item.classList.remove(
                    "bg-cyan-400/15",
                    "text-cyan-300",
                    "border-cyan-400/30"
                );

                item.classList.add(
                    "bg-slate-800",
                    "text-slate-400",
                    "border-slate-700"
                );
            });

            button.classList.remove(
                "bg-slate-800",
                "text-slate-400",
                "border-slate-700"
            );

            button.classList.add(
                "bg-cyan-400/15",
                "text-cyan-300",
                "border-cyan-400/30"
            );

            renderStructures();
        });
    });

    // =================================================
    // BRAIN TRANSPARENCY
    // =================================================

    function updateTransparencyDisplay(value) {
        if (transparencyValue) {
            transparencyValue.textContent = `${value}%`;
        }
    }

    transparencySlider?.addEventListener("input", event => {
        currentTransparency = Number(event.target.value);

        updateTransparencyDisplay(currentTransparency);

        if (viewerReady && window.brainViewer) {
            window.brainViewer.setTransparency(currentTransparency);
        }
    });

    updateTransparencyDisplay(currentTransparency);

    // =================================================
    // RESET VIEW BUTTON
    // =================================================

    resetViewButton?.addEventListener("click", () => {
        if (!viewerReady || !window.brainViewer) return;

        window.brainViewer.resetView();
    });

    // =================================================
    // CLEAR SELECTION
    // =================================================

    function clearSelection() {
        selectedStructure = null;
        searchInput.value = "";

        if (window.brainViewer) {
            window.brainViewer.clearSelection();
        }

        renderStructures();
        renderDetails(null);
    }

    clearButton?.addEventListener("click", clearSelection);

    // =================================================
    // 3D BRAIN -> AUTOMATIC SELECTION
    // =================================================

    window.addEventListener(
        "brainviewer:structure-selected",
        event => {
            const entry = event.detail;

            if (!entry) return;

            const structure = {
                ...entry,
                type: "manifest",
                label: entry.label || entry.name,
                displayCategory: categoryForManifest(entry),
                relatedPart: findRelatedDjangoPart(entry)
            };

            selectStructure(structure, {
                updateSearch: true,
                highlight: false
            });

            console.log(
                "Selected from 3D brain:",
                structure.label
            );
        }
    );

    // =================================================
    // VIEWER READY
    // =================================================

    window.addEventListener("brainviewer:ready", () => {
        viewerReady = true;

        if (!window.brainViewer) return;

        manifestParts = [
            ...window.brainViewer.getMapping().values()
        ];

        window.brainViewer.setTransparency(currentTransparency);

        buildStructureCollection();

        if (selectedStructure) {
            window.brainViewer.highlightPart(selectedStructure);
        }
    });

    // =================================================
    // LOAD DJANGO ANATOMY
    // =================================================

    async function loadBrainParts() {
        try {
            const response = await fetch("/api/parts/");

            if (!response.ok) {
                throw new Error(
                    `Anatomy API returned ${response.status}`
                );
            }

            const data = await response.json();

            djangoParts = Array.isArray(data.parts)
                ? data.parts
                : [];

            console.log(
                `Neuroverse: Loaded ${djangoParts.length} Django structures.`
            );

            buildStructureCollection();
            renderDetails(null);

        } catch (error) {
            console.error(
                "Could not load Django anatomy:",
                error
            );

            partsList.textContent =
                "Could not load anatomy data. Please refresh the page.";
        }
    }

    loadBrainParts();
});
