
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

const MODEL_URL = "/static/neuroverse/models/brain.glb";
const MANIFEST_URL = "/static/neuroverse/models/manifest.json";

const container = document.getElementById("brain-viewer");

if (!container) {
    throw new Error("Could not find #brain-viewer.");
}

// =====================================================
// SCENE
// =====================================================

const scene = new THREE.Scene();
scene.background = new THREE.Color("#020617");

const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 2000);

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

renderer.domElement.style.cssText = `
    display: block;
    width: 100%;
    height: 100%;
    touch-action: none;
    outline: none;
`;

container.appendChild(renderer.domElement);

// =====================================================
// LIGHTING
// =====================================================

scene.add(new THREE.HemisphereLight(0xffffff, 0x777080, 2));

const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
keyLight.position.set(5, 8, 10);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffd6bd, 1.5);
fillLight.position.set(-8, 3, 5);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xc7d9ff, 1.3);
rimLight.position.set(0, 5, -8);
scene.add(rimLight);

// =====================================================
// ORBIT CONTROLS
// =====================================================

const controls = new OrbitControls(camera, renderer.domElement);

controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enableRotate = true;
controls.enableZoom = true;
controls.enablePan = true;

controls.zoomSpeed = 0.8;
controls.zoomToCursor = true;
controls.rotateSpeed = 0.7;
controls.panSpeed = 0.7;
controls.screenSpacePanning = true;

controls.minDistance = 0.1;
controls.maxDistance = 1000;

controls.minPolarAngle = 0.1;
controls.maxPolarAngle = Math.PI - 0.1;

controls.touches = {
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_PAN
};

// =====================================================
// LOADERS
// =====================================================

const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();

dracoLoader.setDecoderPath(
    "https://www.gstatic.com/draco/versioned/decoders/1.5.7/"
);

loader.setDRACOLoader(dracoLoader);

// =====================================================
// STATE
// =====================================================

let brainRoot = null;
let manifest = null;

let modelRadius = 1;
let selectedMeshes = new Set();

let brainTransparency = 0;
let focusAnimation = null;
let pointerStart = null;

const meshMap = new Map();
const originalMaterials = new Map();
const visualMaterialCache = new Map();
const corticalMeshes = new Set();

const meshNameIndex = new Map();
const groupIndex = new Map();

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

// =====================================================
// NAME UTILITIES
// =====================================================

function normalizeName(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

function baseName(value) {
    return String(value ?? "")
        .trim()
        .replace(/\.(l|r)$/i, "");
}

function normalizeCandidateName(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/_1$/i, "")
        .replace(/001$/i, "")
        .replace(/[^a-z0-9]/g, "");
}

function getMaterials(material) {
    return Array.isArray(material) ? material : [material];
}

function getSideCode(side) {
    if (side === "left") return "l";
    if (side === "right") return "r";
    return null;
}

// =====================================================
// MATERIAL INITIALIZATION
// =====================================================

function prepareOriginalMaterials(root) {
    originalMaterials.clear();

    root.traverse(object => {
        if (!object.isMesh) return;

        originalMaterials.set(object.uuid, object.material);

        for (const material of getMaterials(object.material)) {
            if (!material) continue;

            material.side = THREE.DoubleSide;

            if (material.color) {
                const color = material.color;

                if (
                    color.r > 0.82 &&
                    color.g > 0.82 &&
                    color.b > 0.82
                ) {
                    color.set("#d1b9a8");
                }
            }

            if ("roughness" in material) {
                material.roughness = 0.88;
            }

            if (material.emissive) {
                material.emissive.set("#000000");
            }

            material.needsUpdate = true;
        }
    });
}

// =====================================================
// SCENE INDEXES
// =====================================================

function buildSceneIndexes(root) {
    meshNameIndex.clear();
    groupIndex.clear();

    const meshes = [];

    root.traverse(object => {
        if (!object.name) {
            if (object.isMesh) meshes.push(object);
            return;
        }

        const key = normalizeCandidateName(object.name);

        if (object.isMesh) {
            meshes.push(object);

            if (!meshNameIndex.has(key)) {
                meshNameIndex.set(key, []);
            }

            meshNameIndex.get(key).push(object);
        } else {
            if (!groupIndex.has(key)) {
                groupIndex.set(key, []);
            }

            groupIndex.get(key).push(object);
        }
    });

    return meshes;
}

function getParentNames(object, root) {
    const names = [];
    let current = object.parent;

    while (current) {
        if (current.name) names.push(current.name);
        if (current === root) break;
        current = current.parent;
    }

    return names.reverse();
}

function belongsToExpectedSide(mesh, node, root) {
    const side = getSideCode(node.side);

    if (!side) return true;

    const expected =
        normalizeCandidateName(baseName(node.name)) + side;

    return getParentNames(mesh, root).some(parentName =>
        normalizeCandidateName(parentName) === expected
    );
}

// =====================================================
// MANIFEST MAPPING
// =====================================================

function buildAnatomicalMapping(root, data) {
    meshMap.clear();
    corticalMeshes.clear();

    const meshes = buildSceneIndexes(root);
    const exactIndex = new Map();

    for (const mesh of meshes) {
        const key = normalizeName(mesh.name);

        if (!exactIndex.has(key)) {
            exactIndex.set(key, []);
        }

        exactIndex.get(key).push(mesh);
    }

    let exactMatches = 0;
    let hierarchyMatches = 0;
    let missingStructures = 0;

    for (const node of data.nodes) {
        const exact =
            exactIndex.get(normalizeName(node.name)) || [];

        let matches = [];

        if (exact.length) {
            matches = [...exact];
            exactMatches++;
        } else {
            const key = normalizeCandidateName(baseName(node.name));
            const candidates = meshNameIndex.get(key) || [];

            matches = node.side
                ? candidates.filter(mesh =>
                    belongsToExpectedSide(mesh, node, root)
                )
                : [...candidates];

            if (matches.length) {
                hierarchyMatches++;
            }
        }

        if (!matches.length) {
            missingStructures++;
        }

        const entry = {
            id: node.id,
            name: String(node.name ?? "").trim(),
            label: node.label || String(node.name ?? "").trim(),
            category: node.category || "other",
            side: node.side || null,
            region: node.region || "",
            source: node.source || "",
            meshes: matches
        };

        meshMap.set(String(node.id), entry);

        if (entry.category === "cortex") {
            matches.forEach(mesh => corticalMeshes.add(mesh));
        }
    }

    const report = {
        manifestNodes: data.nodes.length,
        glbMeshes: meshes.length,
        exactMatches,
        hierarchyMatches,
        missingStructures,
        mappedCorticalMeshes: corticalMeshes.size
    };

    console.log("NEUROVERSE ANATOMICAL MAPPING");
    console.table([report]);
    console.log("Full mapping report:", JSON.stringify(report, null, 2));

    window.brainMeshMap = meshMap;

    return report;
}

// =====================================================
// STRUCTURE RESOLUTION
// =====================================================

function getPartNames(part) {
    if (typeof part === "string" || typeof part === "number") {
        return [String(part)];
    }

    if (!part || typeof part !== "object") return [];

    return [
        part.mesh_name,
        part.name,
        part.label,
        part.slug
    ].filter(Boolean);
}

function resolvePartMeshes(part) {
    const names = getPartNames(part);

    if (!names.length) return [];

    const keys = names.map(normalizeCandidateName);
    const resolved = new Set();

    for (const entry of meshMap.values()) {
        const entryNames = [
            entry.name,
            baseName(entry.name),
            entry.label
        ].map(normalizeCandidateName);

        if (keys.some(key => key && entryNames.includes(key))) {
            entry.meshes.forEach(mesh => resolved.add(mesh));
        }
    }

    if (resolved.size) {
        return [...resolved];
    }

    for (const key of keys) {
        (meshNameIndex.get(key) || []).forEach(mesh => {
            resolved.add(mesh);
        });
    }

    if (resolved.size) {
        return [...resolved];
    }

    for (const key of keys) {
        for (const group of groupIndex.get(key) || []) {
            group.traverse(object => {
                if (object.isMesh) resolved.add(object);
            });
        }
    }

    return [...resolved];
}

// =====================================================
// TRANSPARENCY MATERIAL CACHE
// =====================================================

function createMaterialVariants(original) {
    const transparent = original.clone();

    transparent.side = THREE.DoubleSide;
    transparent.transparent = true;
    transparent.depthWrite = false;

    const highlight = original.clone();

    if (highlight.color) {
        highlight.color.set("#00e5ff");
    }

    if (highlight.emissive) {
        highlight.emissive.set("#00a8cc");
        highlight.emissiveIntensity = 1.5;
    }

    highlight.transparent = false;
    highlight.opacity = 1;
    highlight.depthWrite = true;

    return {
        transparent,
        highlight
    };
}

function getVisualMaterials(mesh) {
    if (visualMaterialCache.has(mesh.uuid)) {
        return visualMaterialCache.get(mesh.uuid);
    }

    const original = originalMaterials.get(mesh.uuid);

    if (!original) return null;

    const variants = Array.isArray(original)
        ? original.map(createMaterialVariants)
        : createMaterialVariants(original);

    visualMaterialCache.set(mesh.uuid, variants);

    return variants;
}

// =====================================================
// APPLY VISUAL APPEARANCE
// =====================================================

function applyVisualAppearance() {
    if (!brainRoot) return;

    brainRoot.traverse(mesh => {
        if (!mesh.isMesh) return;

        const original = originalMaterials.get(mesh.uuid);

        if (!original) return;

        // Selected structures always remain highlighted.
        if (selectedMeshes.has(mesh)) {
            const variants = getVisualMaterials(mesh);

            if (!variants) return;

            mesh.material = Array.isArray(variants)
                ? variants.map(item => item.highlight)
                : variants.highlight;

            return;
        }

        // Transparency affects mapped cortical meshes only.
        if (
            corticalMeshes.has(mesh) &&
            brainTransparency > 0
        ) {
            const variants = getVisualMaterials(mesh);

            if (!variants) return;

            const opacity = Math.max(
                0.03,
                1 - (brainTransparency / 100) * 0.97
            );

            const transparentMaterials = Array.isArray(variants)
                ? variants.map(item => item.transparent)
                : [variants.transparent];

            transparentMaterials.forEach(material => {
                material.opacity = opacity;
                material.needsUpdate = true;
            });

            mesh.material = Array.isArray(variants)
                ? transparentMaterials
                : transparentMaterials[0];

            return;
        }

        // Restore original material when not selected or faded.
        mesh.material = original;
    });
}

// =====================================================
// TRANSPARENCY API
// =====================================================

function setTransparency(value) {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
        return brainTransparency;
    }

    brainTransparency = THREE.MathUtils.clamp(
        numericValue,
        0,
        100
    );

    applyVisualAppearance();

    window.dispatchEvent(
        new CustomEvent("brainviewer:transparency-changed", {
            detail: {
                value: brainTransparency
            }
        })
    );

    return brainTransparency;
}

function getTransparency() {
    return brainTransparency;
}

// =====================================================
// SELECTION AND HIGHLIGHTING
// =====================================================

function highlightMeshes(meshes) {
    selectedMeshes = new Set(meshes || []);
    applyVisualAppearance();

    return selectedMeshes.size > 0;
}

function highlightPart(part) {
    if (!brainRoot) return false;

    const meshes = resolvePartMeshes(part);

    if (!meshes.length) {
        console.warn("No GLB mapping found for:", part);
        return false;
    }

    return highlightMeshes(meshes);
}

function clearSelection() {
    selectedMeshes.clear();
    applyVisualAppearance();
}

// =====================================================
// CAMERA FOCUS
// =====================================================

function focusPart(part) {
    if (!brainRoot) {
        console.warn("Brain model is not ready.");
        return false;
    }

    const meshes = resolvePartMeshes(part);

    if (!meshes.length) {
        console.warn("Cannot focus: no mapped meshes.", part);
        return false;
    }

    highlightMeshes(meshes);

    const bounds = new THREE.Box3();

    for (const mesh of meshes) {
        mesh.updateWorldMatrix(true, false);
        bounds.expandByObject(mesh);
    }

    if (bounds.isEmpty()) return false;

    const center = bounds.getCenter(new THREE.Vector3());
    const sphere = bounds.getBoundingSphere(new THREE.Sphere());

    const radius = Math.max(
        sphere.radius,
        modelRadius * 0.015
    );

    const direction = camera.position
        .clone()
        .sub(controls.target)
        .normalize();

    if (direction.lengthSq() < 0.001) {
        direction.set(0, 0, 1);
    }

    const verticalFov = THREE.MathUtils.degToRad(camera.fov);

    const horizontalFov = 2 * Math.atan(
        Math.tan(verticalFov / 2) * camera.aspect
    );

    const effectiveFov = Math.min(verticalFov, horizontalFov);

    const distance = THREE.MathUtils.clamp(
        (radius / Math.sin(effectiveFov / 2)) * 2.2,
        modelRadius * 0.12,
        modelRadius * 12
    );

    const destination = center.clone().add(
        direction.multiplyScalar(distance)
    );

    focusAnimation = {
        startCamera: camera.position.clone(),
        startTarget: controls.target.clone(),
        endCamera: destination,
        endTarget: center.clone(),
        elapsed: 0,
        duration: 1.2
    };

    console.log("Focusing on:", part.name || part.label);

    return true;
}

function updateFocusAnimation(deltaTime) {
    if (!focusAnimation) return;

    const animation = focusAnimation;

    animation.elapsed += deltaTime;

    const progress = Math.min(
        animation.elapsed / animation.duration,
        1
    );

    const eased = progress * progress * (3 - 2 * progress);

    camera.position.lerpVectors(
        animation.startCamera,
        animation.endCamera,
        eased
    );

    controls.target.lerpVectors(
        animation.startTarget,
        animation.endTarget,
        eased
    );

    if (progress >= 1) {
        camera.position.copy(animation.endCamera);
        controls.target.copy(animation.endTarget);
        focusAnimation = null;
    }
}

// =====================================================
// CAMERA RESET AND MODEL FITTING
// =====================================================

function fitCameraToBrain(root) {
    root.updateMatrixWorld(true);

    const bounds = new THREE.Box3().setFromObject(root);

    if (bounds.isEmpty()) {
        throw new Error("Brain model has no geometry.");
    }

    const center = bounds.getCenter(new THREE.Vector3());
    const sphere = bounds.getBoundingSphere(new THREE.Sphere());

    modelRadius = Math.max(sphere.radius, 0.01);

    const verticalFov = THREE.MathUtils.degToRad(camera.fov);

    const horizontalFov = 2 * Math.atan(
        Math.tan(verticalFov / 2) * camera.aspect
    );

    const distance =
        (modelRadius / Math.sin(Math.min(verticalFov, horizontalFov) / 2))
        * 1.35;

    const target = center.clone();
    target.y += modelRadius * 0.16;

    camera.position.set(
        target.x,
        target.y,
        target.z + distance
    );

    camera.near = Math.max(distance / 1000, 0.001);
    camera.far = distance * 100;
    camera.updateProjectionMatrix();

    controls.target.copy(target);

    controls.minDistance = modelRadius * 0.2;
    controls.maxDistance = modelRadius * 15;

    controls.update();
}

function resetView() {
    focusAnimation = null;

    if (brainRoot) {
        fitCameraToBrain(brainRoot);
    }
}

// =====================================================
// LOAD MANIFEST
// =====================================================

async function loadManifest() {
    const response = await fetch(MANIFEST_URL);

    if (!response.ok) {
        throw new Error(
            `Manifest request failed: ${response.status}`
        );
    }

    const data = await response.json();

    if (!Array.isArray(data.nodes)) {
        throw new Error("Manifest nodes array is missing.");
    }

    return data;
}

// =====================================================
// LOAD BRAIN MODEL
// =====================================================

loader.load(
    MODEL_URL,

    async gltf => {
        try {
            console.log("Brain GLB loaded.");

            const model = gltf.scene;
            let meshCount = 0;

            model.traverse(object => {
                if (object.isMesh) meshCount++;
            });

            if (!meshCount) {
                throw new Error("GLB contains no meshes.");
            }

            brainRoot = new THREE.Group();
            brainRoot.add(model);

            const initialBounds = new THREE.Box3().setFromObject(brainRoot);
            const size = initialBounds.getSize(new THREE.Vector3());

            const maxDimension = Math.max(
                size.x,
                size.y,
                size.z
            );

            if (!Number.isFinite(maxDimension) || maxDimension <= 0) {
                throw new Error("Invalid model dimensions.");
            }

            brainRoot.scale.setScalar(5 / maxDimension);
            brainRoot.updateMatrixWorld(true);

            const scaledBounds = new THREE.Box3().setFromObject(brainRoot);

            brainRoot.position.sub(
                scaledBounds.getCenter(new THREE.Vector3())
            );

            scene.add(brainRoot);
            brainRoot.updateMatrixWorld(true);

            prepareOriginalMaterials(brainRoot);
            fitCameraToBrain(brainRoot);

            manifest = await loadManifest();

            const report = buildAnatomicalMapping(
                brainRoot,
                manifest
            );

            applyVisualAppearance();

            console.log("Brain viewer ready.");

            window.dispatchEvent(
                new CustomEvent("brainviewer:ready", {
                    detail: report
                })
            );

        } catch (error) {
            console.error("Brain initialization error:", error);
        }
    },

    progress => {
        if (progress.total > 0) {
            const percent = (
                progress.loaded / progress.total * 100
            ).toFixed(1);

            console.log(`Loading brain: ${percent}%`);
        }
    },

    error => {
        console.error("Could not load brain GLB:", error);
    }
);

// =====================================================
// PUBLIC API
// =====================================================

window.brainViewer = {
    highlightPart,
    focusPart,

    clearSelection() {
        focusAnimation = null;
        clearSelection();
    },

    setTransparency,
    getTransparency,

    getPartMeshes: resolvePartMeshes,
    getMapping: () => meshMap,
    getManifest: () => manifest,

    isLoaded: () => Boolean(brainRoot && manifest),

    inspectPart(part) {
        return resolvePartMeshes(part).map(mesh => {
            mesh.updateWorldMatrix(true, false);

            const worldPosition = new THREE.Vector3();
            mesh.getWorldPosition(worldPosition);

            const worldScale = new THREE.Vector3();
            mesh.getWorldScale(worldScale);

            const geometry = mesh.geometry;

            if (!geometry.boundingBox) {
                geometry.computeBoundingBox();
            }

            return {
                name: mesh.name,
                localPosition: mesh.position.toArray(),
                worldPosition: worldPosition.toArray(),
                worldScale: worldScale.toArray(),
                localBounds: {
                    min: geometry.boundingBox.min.toArray(),
                    max: geometry.boundingBox.max.toArray()
                },
                parent: mesh.parent?.name
            };
        });
    },

    getWorldBounds(part) {
        return resolvePartMeshes(part).map(mesh => {
            mesh.updateWorldMatrix(true, false);

            const box = new THREE.Box3().setFromObject(mesh);

            return {
                name: mesh.name,
                min: box.min.toArray(),
                max: box.max.toArray(),
                center: box.getCenter(new THREE.Vector3()).toArray(),
                size: box.getSize(new THREE.Vector3()).toArray()
            };
        });
    },

    resetView,

    zoomIn() {
        camera.position.sub(controls.target)
            .multiplyScalar(0.85)
            .add(controls.target);

        controls.update();
    },

    zoomOut() {
        camera.position.sub(controls.target)
            .multiplyScalar(1.18)
            .add(controls.target);

        controls.update();
    }
};

// =====================================================
// CLICK 3D BRAIN TO SELECT STRUCTURE
// =====================================================

renderer.domElement.addEventListener("pointerdown", event => {
    pointerStart = {
        x: event.clientX,
        y: event.clientY
    };
});

renderer.domElement.addEventListener("pointerup", event => {
    if (!pointerStart || !brainRoot || !manifest) {
        pointerStart = null;
        return;
    }

    const movement = Math.hypot(
        event.clientX - pointerStart.x,
        event.clientY - pointerStart.y
    );

    pointerStart = null;

    if (movement > 5 || event.button !== 0) return;

    const rect = renderer.domElement.getBoundingClientRect();

    pointer.x = (
        (event.clientX - rect.left) / rect.width
    ) * 2 - 1;

    pointer.y = -(
        (event.clientY - rect.top) / rect.height
    ) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);

    const hits = raycaster.intersectObject(brainRoot, true);

    if (!hits.length) return;

    const clickedMesh = hits[0].object;

    const entry = [...meshMap.values()].find(item =>
        item.meshes.includes(clickedMesh)
    );

    if (!entry) {
        console.warn(
            "Clicked mesh has no manifest mapping:",
            clickedMesh.name
        );
        return;
    }

    highlightMeshes(entry.meshes);

    window.dispatchEvent(
        new CustomEvent("brainviewer:structure-selected", {
            detail: entry
        })
    );
});

// =====================================================
// RESPONSIVE RESIZE
// =====================================================

function resizeViewer() {
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (!width || !height) return;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
}

const resizeObserver = new ResizeObserver(resizeViewer);
resizeObserver.observe(container);

resizeViewer();

// =====================================================
// CLEANUP
// =====================================================

window.addEventListener("beforeunload", () => {
    resizeObserver.disconnect();
    controls.dispose();
    dracoLoader.dispose();

    for (const variants of visualMaterialCache.values()) {
        const materials = Array.isArray(variants)
            ? variants.flatMap(item => [
                item.transparent,
                item.highlight
            ])
            : [
                variants.transparent,
                variants.highlight
            ];

        materials.forEach(material => material.dispose());
    }

    visualMaterialCache.clear();
    renderer.dispose();
});

// =====================================================
// ANIMATION LOOP
// =====================================================

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const deltaTime = Math.min(clock.getDelta(), 0.05);

    updateFocusAnimation(deltaTime);
    controls.update();

    renderer.render(scene, camera);
}

animate();
