/**
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import MoleculeRow from './components/MoleculeRow';
import LoadDataRow from './components/LoadDataRow';
import { SyncProvider } from './SyncContext';
import SyncButton from './components/SyncButton';
import MolstarContainer from './components/MolstarContainer';
import { parseColorFileContent, getColourTheme, createChainColorTheme } from './utils/Colors';
import { parseDictionaryFileContent } from './utils/Dictionary';
import { toggleVisibility, ViewerKey, ViewerState } from './components/RibocodeViewer';
//import { loadMoleculeToViewer } from './utils/data';
import './App.css';
import { loadMoleculeFileToViewer, Molecule, PresetResult } from 'molstar/lib/extensions/ribocode/structure';
import { Asset } from 'molstar/lib/mol-util/assets';
import { Color } from 'molstar/lib/mol-util/color';
import { PluginCommands } from 'molstar/lib/mol-plugin/commands';
import { StateTransforms } from 'molstar/lib/mol-plugin-state/transforms';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
//import { StructureRepresentation3D } from 'molstar/lib/mol-plugin-state/transforms/representation';
//import { PluginStateObject } from 'molstar/lib/mol-plugin-state/objects';
//import { ObjectListControl } from 'molstar/lib/mol-plugin-ui/controls/parameters';
//import { Overpaint } from 'molstar/lib/mol-theme/overpaint';
import { Unit, Structure, StructureElement, StructureQuery, StructureSelection } from 'molstar/lib/mol-model/structure';
//import { StructureSelectionQuery } from 'packages/molstar/src/mol-plugin-state/helpers/structure-selection-query';
import { QueryContext } from 'molstar/lib/mol-model/structure/query/context';
//import { ElementIndex } from 'molstar/lib/mol-model/structure';
import { MolScriptBuilder } from 'molstar/lib/mol-script/language/builder';
import { compile } from 'molstar/lib/mol-script/runtime/query/base';
import { VisibilityOutlinedSvg, VisibilityOffOutlinedSvg } from 'molstar/lib/mol-plugin-ui/controls/icons';
import ChainSelectButton from './components/ChainSelectButton';
import { getChainIdsFromStructure } from './utils/Chain';
//import { Data } from 'molstar/lib/extensions/ribocode/colors';
//import { set } from 'lodash';
//import { AtomicHierarchy } from 'molstar/lib/mol-model/structure/model/properties/atomic';
//import { RepresentationType } from 'molstar/lib/mol-repr/representation';
import { allowedRepresentationTypes, AllowedRepresentationType } from './types/Representation';

/**
 * The main App component.
 * @returns The main App component.
 */
const App: React.FC = () => {
        // State to track all representation refs for each molecule
        const [representationRefsAAlignedTo, setRepresentationRefsAAlignedTo] = useState<string[]>([]);
        const [representationRefsAAligned, setRepresentationRefsAAligned] = useState<string[]>([]);
        const [representationRefsBAlignedTo, setRepresentationRefsBAlignedTo] = useState<string[]>([]);
        const [representationRefsBAligned, setRepresentationRefsBAligned] = useState<string[]>([]);
    console.log('App rendered');

    // Diagnostic: Deep logging function for Mol* state and representation refs
    function logMolstarStateDiagnostics(plugin: any, label: string = '') {
        if (!plugin || !plugin.managers || !plugin.managers.structure) {
            console.warn('Mol* plugin or structure manager missing');
            return;
        }
        const hierarchy = plugin.managers.structure.hierarchy.current;
        console.log(`==== MOLSTAR DIAGNOSTICS ${label} ====`);
        console.log('plugin.managers.structure.hierarchy.current:', hierarchy);
        if (hierarchy && hierarchy.structures) {
            hierarchy.structures.forEach((s: any, i: number) => {
                console.log(`Structure[${i}] ref:`, s.cell.transform.ref);
                if (s.components && s.components.length > 0) {
                    s.components.forEach((comp: any, j: number) => {
                        console.log(`  Component[${j}]:`, comp);
                        if (comp.representations && comp.representations.length > 0) {
                            comp.representations.forEach((rep: any, k: number) => {
                                console.log(`    Representation[${k}]:`, rep);
                            });
                        }
                    });
                }
            });
        }
        // Also log the plugin.state.data.cells map for completeness
        if (plugin.state && plugin.state.data && plugin.state.data.cells) {
            console.log('plugin.state.data.cells:', plugin.state.data.cells);
        }
        console.log('==== END MOLSTAR DIAGNOSTICS ====');
    }

    // Viewer state management
    // -----------------------
    const [activeViewer, setActiveViewer] = useState<ViewerKey>('A');
    // Custom hook to manage viewer state.
    function useViewerState(viewerKey: ViewerKey): ViewerState {
        const [moleculeAlignedTo, setMoleculeAlignedTo] = useState<Molecule>();
        const [moleculeAligned, setMoleculeAligned] = useState<Molecule>();
        const [isMoleculeAlignedToLoaded, setIsMoleculeAlignedToLoaded] = useState(false);
        const [isMoleculeAlignedLoaded, setIsMoleculeAlignedLoaded] = useState(false);
        const [isMoleculeAlignedToVisible, setIsMoleculeAlignedToVisible] = useState(false);
        const [isMoleculeAlignedVisible, setIsMoleculeAlignedVisible] = useState(false);
        const ref = useRef<PluginUIContext | null>(null);
        const fileInputRef = useRef<HTMLInputElement | null>(null);
        const handleFileInputButtonClick = useCallback(() => {
            fileInputRef.current?.click();
        }, []);
        const setViewerRef = useCallback((viewer: PluginUIContext) => {
            ref.current = viewer;
        }, []);
        return {
            moleculeAlignedTo: moleculeAlignedTo,
            setMoleculeAlignedTo: setMoleculeAlignedTo,
            moleculeAligned: moleculeAligned,
            setMoleculeAligned: setMoleculeAligned,
            isMoleculeAlignedToLoaded: isMoleculeAlignedToLoaded,
            setIsMoleculeAlignedToLoaded: setIsMoleculeAlignedToLoaded,
            isMoleculeAlignedLoaded: isMoleculeAlignedLoaded,
            setIsMoleculeAlignedLoaded: setIsMoleculeAlignedLoaded,
            isMoleculeAlignedToVisible: isMoleculeAlignedToVisible,
            setIsMoleculeAlignedToVisible: setIsMoleculeAlignedToVisible,
            isMoleculeAlignedVisible: isMoleculeAlignedVisible,
            setIsMoleculeAlignedVisible: setIsMoleculeAlignedVisible,
            ref: ref,
            fileInputRef: fileInputRef,
            handleFileInputButtonClick: handleFileInputButtonClick,
            setViewerRef: setViewerRef,
            viewerKey: viewerKey
        };
    }

    // Initialize viewer states.
    const viewerA: ViewerState = useViewerState('A');
    const viewerB: ViewerState = useViewerState('B');
    const setViewerAWrapper = useCallback((viewer: PluginUIContext) => {
        viewerA.ref.current = viewer;
    }, [viewerA]);
    const setViewerBWrapper = useCallback((viewer: PluginUIContext) => {
        viewerB.ref.current = viewer;
    }, [viewerB]);
    const [viewerAReady, setViewerAReady] = useState(false);
    const [viewerBReady, setViewerBReady] = useState(false);
    const [syncEnabled, setSyncEnabled] = useState(false);

    // Generic file input hook.
    function useFileInput<T>(
        parseFn: (text: string, file: File) => Promise<T>,
        initialValue: T
    ) {
        // State and refs for file input handling.
        const [data, setData] = useState<T>(initialValue);
        const inputRef = useRef<HTMLInputElement>(null);
        // Handlers for button click and file change.
        const handleButtonClick = () => {
            inputRef.current?.click();
        };
        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async () => {
                    const text = reader.result as string;
                    const parsed = await parseFn(text, file); // Pass both text and file
                    setData(parsed);
                    console.log('data:', parsed);
                };
                reader.readAsText(file);
            }
        };
        return { data, setData, inputRef, handleButtonClick, handleFileChange };
    }

    // File inputs for dictionary and colors.
    const dictionaryFile = useFileInput<Array<Record<string, string>>>(parseDictionaryFileContent, []);
    const alignmentFile = useFileInput<Array<Record<string, string>>>(parseDictionaryFileContent, []);
    const [isMoleculeAlignedToColoursLoaded, setIsMoleculeAlignedToColoursLoaded] = useState(false);
    const [isMoleculeAlignedColoursLoaded, setIsMoleculeAlignedColoursLoaded] = useState(false);
    const colorsAlignedToFile = useFileInput<Array<Record<string, string>>>(parseColorFileContent, []);
    const colorsAlignedFile = useFileInput<Array<Record<string, string>>>(parseColorFileContent, []);
    // Chain color map state.
    const [chainColorMaps] = useState<Map<string, Map<string, Color>>>(new Map());
    // Chain ID selection state.
    const [chainIdsAlignedTo, setChainIdsAlignedTo] = useState<string[]>([]);
    const [selectedChainIdAlignedTo, setSelectedChainIdAlignedTo] = useState<string>('');
    const [chainIdsAligned, setChainIdsAligned] = useState<string[]>([]);
    const [selectedChainIdAligned, setSelectedChainIdAligned] = useState<string>('');
    
    // Handle file changes for molecule loading.
    type FileChangeMode = 'alignedTo' | 'aligned';

    const handleFileChange = useCallback(
        async (
            e: React.ChangeEvent<HTMLInputElement>,
            mode: FileChangeMode
        ) => {
            const pluginA = viewerA.ref.current;
            const pluginB = viewerB.ref.current;
            if (!pluginA || !pluginB) {
                console.error('One or both viewers are not initialized.');
                return;
            }
            try {
                const file = e.target.files?.[0];
                if (!file) return;
                const assetFile = Asset.File(new File([file], file.name));
                if (mode === 'alignedTo') {
                    // Load alignedTo molecule into both viewers:
                    // Viewer A
                    const viewerAMoleculeAlignedTo = await loadMoleculeFileToViewer(
                        pluginA, assetFile, true, true
                    );
                    if (!viewerAMoleculeAlignedTo) {
                        console.error('Failed to load molecule into viewer A.');
                        return;
                    }
                    viewerA.setMoleculeAlignedTo(prev => ({
                        label: viewerAMoleculeAlignedTo.label,
                        name: viewerAMoleculeAlignedTo.name,
                        filename: viewerAMoleculeAlignedTo.filename ?? prev?.filename ?? "",
                        presetResult: viewerAMoleculeAlignedTo.presetResult ?? "Unknown",
                        alignmentData: viewerAMoleculeAlignedTo.alignmentData
                    }));
                    // Set structureRef for robust lookup
                    if (pluginA.managers.structure.hierarchy.current.structures[0]) {
                        setStructureRefAAlignedTo(pluginA.managers.structure.hierarchy.current.structures[0].cell.transform.ref);
                        // Track all current representation refs for this structure (all components)
                        const comps = pluginA.managers.structure.hierarchy.current.structures[0].components;
                        if (comps && comps.length > 0) {
                            const allRefs: string[] = [];
                            for (const comp of comps) {
                                for (const rep of comp.representations) {
                                    if (rep.cell?.transform?.ref) allRefs.push(rep.cell.transform.ref);
                                }
                            }
                            setRepresentationRefsAAlignedTo(allRefs);
                        } else {
                            setRepresentationRefsAAlignedTo([]);
                        }
                    }
                    viewerA.setIsMoleculeAlignedToLoaded(true);
                    viewerA.setIsMoleculeAlignedToVisible(true);
                    // Viewer B
                    const viewerBMoleculeAlignedTo = await loadMoleculeFileToViewer(
                        pluginB, assetFile, false, true
                    );
                    if (!viewerBMoleculeAlignedTo) {
                        console.error('Failed to load molecule into viewer B.');
                        return;
                    }
                    viewerB.setMoleculeAlignedTo(prev => ({
                        label: viewerBMoleculeAlignedTo.label,
                        name: viewerBMoleculeAlignedTo.name,
                        filename: viewerBMoleculeAlignedTo.filename ?? prev?.filename ?? "",
                        presetResult: viewerBMoleculeAlignedTo.presetResult ?? "Unknown",
                    }));
                    if (pluginB.managers.structure.hierarchy.current.structures[0]) {
                        setStructureRefBAlignedTo(pluginB.managers.structure.hierarchy.current.structures[0].cell.transform.ref);
                        // Track all current representation refs for this structure (all components)
                        const comps = pluginB.managers.structure.hierarchy.current.structures[0].components;
                        if (comps && comps.length > 0) {
                            const allRefs: string[] = [];
                            for (const comp of comps) {
                                for (const rep of comp.representations) {
                                    if (rep.cell?.transform?.ref) allRefs.push(rep.cell.transform.ref);
                                }
                            }
                            setRepresentationRefsBAlignedTo(allRefs);
                        } else {
                            setRepresentationRefsBAlignedTo([]);
                        }
                    }
                    viewerB.setIsMoleculeAlignedToLoaded(true);
                    viewerB.setIsMoleculeAlignedToVisible(true);
                } else if (mode === 'aligned') {
                    // Require alignedTo data to be loaded
                    if (!viewerA.moleculeAlignedTo?.alignmentData) {
                        console.error('AlignedTo molecule must be loaded before loading aligned molecule.');
                        return;
                    }
                    // Load aligned molecule into both viewers using alignment data
                    const alignmentData = viewerA.moleculeAlignedTo.alignmentData;
                    const viewerAMoleculeAligned = await loadMoleculeFileToViewer(
                        pluginA, assetFile, false, true, alignmentData
                    );
                    if (!viewerAMoleculeAligned) {
                        console.error('Failed to load molecule into viewer A.');
                        return;
                    }
                    viewerA.setMoleculeAligned(prev => ({
                        label: viewerAMoleculeAligned.label,
                        name: viewerAMoleculeAligned.name,
                        filename: viewerAMoleculeAligned.filename ?? prev?.filename ?? "",
                        presetResult: viewerAMoleculeAligned.presetResult ?? "Unknown",
                    }));
                    if (pluginA.managers.structure.hierarchy.current.structures[1]) {
                        setStructureRefAAligned(pluginA.managers.structure.hierarchy.current.structures[1].cell.transform.ref);
                        // Track all current representation refs for this structure (all components)
                        const comps = pluginA.managers.structure.hierarchy.current.structures[1].components;
                        if (comps && comps.length > 0) {
                            const allRefs: string[] = [];
                            for (const comp of comps) {
                                for (const rep of comp.representations) {
                                    if (rep.cell?.transform?.ref) allRefs.push(rep.cell.transform.ref);
                                }
                            }
                            setRepresentationRefsAAligned(allRefs);
                        } else {
                            setRepresentationRefsAAligned([]);
                        }
                    }
                    viewerA.setIsMoleculeAlignedLoaded(true);
                    viewerA.setIsMoleculeAlignedVisible(true);

                    const viewerBMoleculeAligned = await loadMoleculeFileToViewer(
                        pluginB, assetFile, false, true, alignmentData
                    );
                    if (!viewerBMoleculeAligned) {
                        console.error('Failed to load molecule into viewer B.');
                        return;
                    }
                    viewerB.setMoleculeAligned(prev => ({
                        label: viewerBMoleculeAligned.label,
                        name: viewerBMoleculeAligned.name,
                        filename: viewerBMoleculeAligned.filename ?? prev?.filename ?? "",
                        presetResult: viewerBMoleculeAligned.presetResult ?? "Unknown",
                    }));
                    if (pluginB.managers.structure.hierarchy.current.structures[1]) {
                        setStructureRefBAligned(pluginB.managers.structure.hierarchy.current.structures[1].cell.transform.ref);
                        // Track all current representation refs for this structure (all components)
                        const comps = pluginB.managers.structure.hierarchy.current.structures[1].components;
                        if (comps && comps.length > 0) {
                            const allRefs: string[] = [];
                            for (const comp of comps) {
                                for (const rep of comp.representations) {
                                    if (rep.cell?.transform?.ref) allRefs.push(rep.cell.transform.ref);
                                }
                            }
                            setRepresentationRefsBAligned(allRefs);
                        } else {
                            setRepresentationRefsBAligned([]);
                        }
                    }
                    viewerB.setIsMoleculeAlignedLoaded(true);
                    viewerB.setIsMoleculeAlignedVisible(true);
                }
            } catch (err) {
                console.error('Error loading molecule:', err);
            }
        },
        [viewerA, viewerB]
    );

    /**
     * Handle toggling visibility of a molecule.
     * @param viewer The viewer state.
     * @param moleculeKey The key of the molecule to toggle.
     * @param setVisible The setter function for visibility state.
     * @param isVisible The current visibility state.
     */
    async function handleToggle(viewer: any, moleculeKey: string, setVisible: (v: boolean) => void, isVisible: boolean) {
        const molecule = viewer[moleculeKey];
        const model = molecule?.presetResult && (molecule.presetResult as any).model;
        if (model) {
            await toggleVisibility(viewer, model);
            setVisible(!isVisible);
        }
    }

    // Toggle visibility for moleculeAlignedTo in viewer A.
    const toggleViewerAAlignedTo = {
        handleButtonClick: () =>
            handleToggle(
                viewerA,
                'moleculeAlignedTo',
                viewerA.setIsMoleculeAlignedToVisible,
                viewerA.isMoleculeAlignedToVisible
            ),
    };

    // Toggle visibility for moleculeAligned in viewer A.
    const toggleViewerAAligned = {
        handleButtonClick: () =>
            handleToggle(
                viewerA,
                'moleculeAligned',
                viewerA.setIsMoleculeAlignedVisible,
                viewerA.isMoleculeAlignedVisible
            ),
    };

    // Toggle visibility for moleculeAlignedTo in viewer B.
    const toggleViewerBAlignedTo = {
        handleButtonClick: () =>
            handleToggle(
                viewerB,
                'moleculeAlignedTo',
                viewerB.setIsMoleculeAlignedToVisible,
                viewerB.isMoleculeAlignedToVisible
            ),
    };

    // Toggle visibility for moleculeAligned in viewer B.
    const toggleViewerBAligned = {
        handleButtonClick: () =>
            handleToggle(
                viewerB,
                'moleculeAligned',
                viewerB.setIsMoleculeAlignedVisible,
                viewerB.isMoleculeAlignedVisible
            ),
    };

    // Dummy state to force re-render after toggling representation visibility
    const [, setForceUpdate] = useState(0);
    const forceUpdate = () => setForceUpdate(f => f + 1);
    // Track the most recently added representation ref for each viewer
    // Track the most recently added representation ref for each viewer
    const [lastAddedRepresentationRefA, setLastAddedRepresentationRefA] = useState<string | null>(null);
    const [lastAddedRepresentationRefB, setLastAddedRepresentationRefB] = useState<string | null>(null);
    // Track the structureRef for each molecule for robust lookup (avoid index issues)
    const [structureRefAAlignedTo, setStructureRefAAlignedTo] = useState<string | null>(null);
    const [structureRefAAligned, setStructureRefAAligned] = useState<string | null>(null);
    const [structureRefBAlignedTo, setStructureRefBAlignedTo] = useState<string | null>(null);
    const [structureRefBAligned, setStructureRefBAligned] = useState<string | null>(null);

    /**
     * Update colorTheme for a molecule.
     * @param viewer The viewer state.
     * @param molecule The molecule to update.
     * @param colorTheme The color theme to apply.
     * @param type The representation type.
     * @param structureIndex The index of the structure to be updated in the 
     * viewer hierarchy. This is hardcoded to 0 or 1 depending on whether the
     * molecule is alignedTo or aligned. If the user reorders the structures,
     * this could cause problems. There may be a better way to ascertain the 
     * structure index for the molecule in each viewer which may change.
     */
    /**
     * Update colorTheme for a molecule.
     * @param viewer The viewer state.
     * @param molecule The molecule to update.
     * @param colorTheme The color theme to apply.
     * @param type The representation type.
     * @param structureRef The structure ref string for robust lookup.
     * @param setLastAddedRepresentationRef Callback to track last added rep.
     */
    async function updateMoleculeColors(
        viewer: ViewerState,
        molecule: Molecule,
        colorTheme: any,
        type: AllowedRepresentationType,
        structureRef: string | null,
        setLastAddedRepresentationRef: (ref: string | null) => void
    ) {
        const plugin = viewer.ref.current;
        if (!plugin) return;
        const pr: PresetResult = molecule.presetResult;
        if (!pr) {
            console.warn('No presetResult found in moleculeAlignedTo.');
            return;
        }
        console.log('presetResult:', pr);
        // Object { model: {…}, modelProperties: {…}, unitcell: undefined, structure: {…}, structureProperties: {…}, representation: {…} }
        const model = (pr as { model: any }).model;
        if (!model) {
            console.warn('No model found in presetResult.');
            return;
        }
        console.log('model:', model);
        const modelProperties = (pr as { modelProperties: any }).modelProperties;
        if (!modelProperties) {
            console.warn('No modelProperties found in presetResult.');
            return;
        }
        console.log('modelProperties:', modelProperties);
        const structure = (pr as { structure: any }).structure;
        if (!structure) {
            console.warn('No structure found in presetResult.');
            return;
        }
        console.log('structure:', structure);
        const structureProperties = (pr as { structureProperties: any }).structureProperties;
        if (!structureProperties) {
            console.warn('No structureProperties found in presetResult.');
            return;
        }
        console.log('structureProperties:', structureProperties);
        // Get the representation.
        const representation = (pr as { representation: any }).representation;
        if (!representation) {
            console.warn('No representation found in presetResult.');
            return;
        }
        // console.log('representation:', representation);
        // const components = representation.components;
        // console.log('components:', components);
        const representations = representation.representations;
        console.log('representations:', representations);
        // Update the representation using the plugin state API
        const builders = plugin.builders;
        if (!builders) {
            console.warn('No builders found in plugin.');
            return;
        }
        console.log('builders:', builders); 
        const structureBuilder = builders.structure;
        if (!structureBuilder) {
            console.warn('No structure found in builders.');
            return;
        }
        console.log('builders.structure:', structureBuilder);
        const representationBuilder = structureBuilder.representation;
        if (!representationBuilder) {
            console.warn('No representation found in structure builders.');
            return;
        }
        console.log('builders.structure.representation:', representationBuilder);
        // Get the plugin state root
        const psd = plugin.state.data;
        console.log('plugin.state.data:', psd);
        const root = psd.root;
        if (!root) {
            console.warn('No root found in plugin.state.data.');
            return;
        }
        console.log('plugin.state.data.root:', root);
        const structures = plugin.managers.structure.hierarchy.current.structures;
        if (!structures || structures.length === 0) {
            console.warn('No structures found in hierarchy.');
            return;
        }
        // Find the structure by ref for robust lookup (avoid index issues)
        const structureCell = structures.find(s => s.cell.transform.ref === structureRef)?.cell;
        if (!structureCell) {
            console.warn('No structure cell found in hierarchy for ref:', structureRef);
            return;
        }
        console.log('structureCell:', structureCell);
        // const structureRefObj = { ref: structureCell.transform.ref }; // Wrap the ref string
        // console.log('structureRefObj:', structureRefObj);
        // Build the current state to get the structure.
        const builder = psd.build();
        // Build new representation with updated color theme.
        // Pass the actual StateObjectRef (structureCell.transform) instead of string ref
        // Find the correct component ref (e.g., polymer component) to attach the new representation
        // Always get the component ref from the Mol* hierarchy for reliability
        let componentRef: string | null = null;
        const struct = plugin.managers.structure.hierarchy.current.structures.find((s: any) => s.cell.transform.ref === structureCell.transform.ref);
        if (struct && struct.components && struct.components.length > 0) {
            const polymerComp = struct.components.find((c: any) => c.key && c.key.includes('polymer'));
            componentRef = (polymerComp ? polymerComp.cell.transform.ref : struct.components[0].cell.transform.ref);
        }
        if (!componentRef) {
            console.warn('[Mol*] Could not find a valid component ref to add representation.');
            return;
        }
        // Use addRepresentation (with commit) to ensure state is updated and attached to the right component
        const newrep = await representationBuilder.addRepresentation(
            componentRef,
            {
                type: type,
                colorTheme: colorTheme
            }
        );
        console.log('Added new representation (committed) to componentRef', componentRef, ':', newrep);
        // Add to representations object.
        const repKey = type; // or use newrep.ref for uniqueness
        representations[repKey] = newrep;
        console.log('representations:', representations);
        // Track the last added representation ref for UI toggle
        if (newrep && typeof newrep.ref === 'string') {
            setLastAddedRepresentationRef(newrep.ref);
            // After Mol* state updates, update all representationRefs for this molecule (with retry logic)
            const maxRetries = 10;
            let retryCount = 0;
            const updateRefs = (structureRefToCheck: string | null, setFn: (refs: string[]) => void, prevRefs: string[]) => {
                if (!structureRefToCheck) return;
                // Deep diagnostic logging on every retry
                logMolstarStateDiagnostics(plugin, `updateRefs retry ${retryCount} for ${structureRefToCheck}`);
                // Find all representation refs for this structure
                const allStructs = plugin.managers.structure.hierarchy.current.structures;
                const struct = allStructs.find((s: any) => s.cell.transform.ref === structureRefToCheck);
                let allRefs: string[] = [];
                if (struct && struct.components && struct.components.length > 0) {
                    for (const comp of struct.components) {
                        for (const rep of comp.representations) {
                            if (rep.cell?.transform?.ref) allRefs.push(rep.cell.transform.ref);
                        }
                    }
                }
                // Log all representation refs for this structure
                console.log(`[Mol*] All representation refs for ${structureRefToCheck}:`, allRefs);
                // Only update if a new ref is present
                if (allRefs.length > prevRefs.length) {
                    console.log(`[Mol*] Setting representationRefs state for ${structureRefToCheck}:`, allRefs);
                    setFn(allRefs);
                } else if (retryCount < maxRetries) {
                    retryCount++;
                    setTimeout(() => updateRefs(structureRefToCheck, setFn, prevRefs), 150);
                } else {
                    console.warn(`[Mol*] Gave up waiting for new representation refs for ${structureRefToCheck}:`, allRefs);
                }
            };
            if (structureRef === structureRefAAlignedTo) {
                updateRefs(structureRefAAlignedTo, setRepresentationRefsAAlignedTo, representationRefsAAlignedTo);
            } else if (structureRef === structureRefAAligned) {
                updateRefs(structureRefAAligned, setRepresentationRefsAAligned, representationRefsAAligned);
            } else if (structureRef === structureRefBAlignedTo) {
                updateRefs(structureRefBAlignedTo, setRepresentationRefsBAlignedTo, representationRefsBAlignedTo);
            } else if (structureRef === structureRefBAligned) {
                updateRefs(structureRefBAligned, setRepresentationRefsBAligned, representationRefsBAligned);
            }
        }
        // Get plugin managers.
        const managers = plugin.managers;
        if (!managers) {
            console.warn('No managers found in plugin.');
            return;
        }
        console.log('managers:', managers);
        // Get the structure component.
        const structureComponent = managers.structure.hierarchy.current.structures[0]?.components[0];
        if (!structureComponent) {
            console.warn('No structure component found to update representation.');
            return;
        }
        console.log('structureComponent:', structureComponent);
        // Get existing representations.
        const reprs = structureComponent.representations;
        if (!reprs || reprs.length === 0) {
            console.warn('No representations found in structure component.');
            return;
        }
        console.log('Representations:', reprs);
        // Set all other representations to invisible before adding new one
        for (const rep of reprs) {
            if (rep.cell?.params?.values?.type?.name !== type) {
                try {
                    const cell = plugin.state.data.cells.get(rep.cell.transform.ref);
                    const isVisible = cell?.state?.isHidden === false;
                    if (isVisible) {
                        await PluginCommands.State.ToggleVisibility.apply(plugin, [plugin, { state: plugin.state.data, ref: rep.cell.transform.ref }]);
                    }
                } catch (e) {
                    console.warn('Failed to set representation invisible:', e);
                }
            }
        }
        // Add the new representation to the state.
        await psd.build()
            .to(structureCell.transform.ref)
            .apply(
                StateTransforms.Representation.StructureRepresentation3D, // Transformer for structure representations
                {
                    type: { name: type, params: {} },
                    colorTheme: { name: colorTheme.name, params: {} }
                }
            )
            .commit();
        console.log('New representation added to state.');
        // Request redraw with new colors.
        if (plugin.canvas3d) {
            plugin.canvas3d.requestDraw?.();
        }
        // Wait for Mol* to update its internal arrays, then force React to re-render
        // Mol* mutates its internal arrays in place, so React does not detect changes.
        // We use a dummy state and forceUpdate to trigger a re-render after Mol* state changes.
        // The setTimeout ensures Mol* has finished updating before React re-renders.
        setTimeout(() => {
            forceUpdate();
        }, 100);
    }

    const themeNameAlignedTo = 'alignedTo-custom-chain-colors';
    const themeNameAligned = 'aligned-custom-chain-colors';

    /**
     * Registers a custom chain color theme if it is not already registered.
     * @param plugin The Mol* plugin instance.
     * @param themeName The name of the theme to register.
     * @returns A promise that resolves when the theme is registered.
     */
    function registerThemeIfNeeded(
        plugin: PluginUIContext,
        themeName: string,
        //chainAlignedToColorMap: Map<string, Color>,
        //chainAlignedColorMap: Map<string, Color>
    ) {
        if (!plugin) return;
        // Get color theme registry.
        const colorThemeRegistry = plugin.representation.structure.themes.colorThemeRegistry;
        if (!colorThemeRegistry) {
            console.warn('No colorThemeRegistry found in representation structure themes.');
            return;
        }
        console.log('ColorThemeRegistry:', colorThemeRegistry);
        // Remove the old theme if it exists.
        const existingTheme = colorThemeRegistry.get(themeName);
        if (existingTheme) {
            colorThemeRegistry.remove(existingTheme);
            console.log(`Removed old ${themeName} theme.`);
        }
        // Add the new theme.
        colorThemeRegistry.add(
            createChainColorTheme(themeName, chainColorMaps.get(themeName)!) as any
        );
        console.log(`Registered ${themeName} theme.`);
    }

    /**
     * Updates theme used to style a molecule.
     * @param molA The molecule in viewer A.
     * @param molB The molecule in viewer B.
     * @param themeName The name of the theme.
     * @param type The representation type. This can be 'spacefill', 'cartoon',
     * or 'ball-and-stick'.
     * @param colors The array of color mapping objects.
     * @param structureIndex The index of the structure to be updated in the 
     * viewer hierarchy. This is hardcoded to 0 or 1 depending on whether the
     * molecule is alignedTo or aligned. If the user reorders the structures,
     * this could cause problems. There may be a better way to ascertain the 
     * structure index for the molecule in each viewer which may change.
     */
    function updateColorsForViewers(
        molA: Molecule | undefined,
        molB: Molecule | undefined,
        themeName: string,
        type: AllowedRepresentationType,
        colors: Array<Record<string, string>>,
        structureIndex: number,
    ) {
        const ct = getColourTheme(themeName, colors);
        // Build chain color map:
        const themeChainColorMap = new Map<string, Color>();
        colors.forEach(row => {
            if (row.pdb_chain && row.color) {
                try {
                    themeChainColorMap.set(row.pdb_chain, Color.fromHexStyle(row.color));
                } catch {
                    console.warn(`Invalid color: ${row.color}`);
                }
            }
        });
        console.log('themeChainColorMap:', themeChainColorMap);
        chainColorMaps.set(themeName, themeChainColorMap);
        // // Update appropriate chain color map state:
        // if (themeName === themeNameAlignedTo) {
        //     setChainAlignedToColorMap(themeChainColorMap);
        //     setChainIdsAlignedTo(new Set(themeChainColorMap.keys()));
        // } else if (themeName === themeNameAligned) {
        //     setChainAlignedColorMap(themeChainColorMap);
        //     setChainIdsAligned(new Set(themeChainColorMap.keys()));
        // } else {
        //     console.warn(`Unknown theme name: ${themeName}`);
        //     return;
        // }
        // Register custom theme if needed:
        registerThemeIfNeeded(
            viewerA.ref.current!,
            themeName,
            //chainAlignedToColorMap,
            //chainAlignedColorMap
        );
        registerThemeIfNeeded(
            viewerB.ref.current!,
            themeName,
            //chainAlignedToColorMap,
            //chainAlignedColorMap
        );
        console.log('Registered theme:', themeName);
        // Update molecule colors in both viewers:
        // Only update if molecule and structureRef are present for each viewer
        if (molA && structureIndex === 0 && structureRefAAlignedTo && colors.length) {
            updateMoleculeColors(viewerA, molA, ct, type, structureRefAAlignedTo, setLastAddedRepresentationRefA);
        }
        if (molA && structureIndex === 1 && structureRefAAligned && colors.length) {
            updateMoleculeColors(viewerA, molA, ct, type, structureRefAAligned, setLastAddedRepresentationRefA);
        }
        if (molB && structureIndex === 0 && structureRefBAlignedTo && colors.length) {
            updateMoleculeColors(viewerB, molB, ct, type, structureRefBAlignedTo, setLastAddedRepresentationRefB);
        }
        if (molB && structureIndex === 1 && structureRefBAligned && colors.length) {
            updateMoleculeColors(viewerB, molB, ct, type, structureRefBAligned, setLastAddedRepresentationRefB);
        }

    // End of updateColorsForViewers
    }

    // Helper to render the last-added representation toggle button for a viewer
    function renderLastAddedVisibilityButton(plugin: PluginUIContext | null, lastAddedRepresentationRef: string | null) {
        if (!plugin || !lastAddedRepresentationRef) return null;
        const cell = plugin.state.data.cells.get(lastAddedRepresentationRef);
        if (!cell) return null;
        const isVisible = cell.state?.isHidden === false;
        return (
            <button
                key={lastAddedRepresentationRef}
                onClick={async () => {
                    await PluginCommands.State.ToggleVisibility.apply(plugin, [plugin, { state: plugin.state.data, ref: lastAddedRepresentationRef }]);
                    plugin.canvas3d?.requestDraw?.();
                }}
                style={{ marginLeft: 4, background: '#eef', border: '1px solid #99f' }}
            >
                {isVisible ? <VisibilityOutlinedSvg /> : <VisibilityOffOutlinedSvg />} Last Added Representation
            </button>
        );
    }
    
    const [representationTypeAlignedTo, setRepresentationTypeAlignedTo] = useState<AllowedRepresentationType>('spacefill');
    const [representationTypeAligned, setRepresentationTypeAligned] = useState<AllowedRepresentationType>('spacefill');

    // Effects to update colors when files are loaded.
    // AlignedTo:
    useEffect(() => {
        if (colorsAlignedToFile.data && colorsAlignedToFile.data.length > 0) {
            setIsMoleculeAlignedToColoursLoaded(true);
            // Build and set the chain color map before registering the theme
            const themeChainColorMap = new Map<string, Color>();
            colorsAlignedToFile.data.forEach(row => {
                if (row.pdb_chain && row.color) {
                    try {
                        themeChainColorMap.set(row.pdb_chain, Color.fromHexStyle(row.color));
                    } catch {
                        console.warn(`Invalid color: ${row.color}`);
                    }
                }
            });
            chainColorMaps.set(themeNameAlignedTo, themeChainColorMap);
            // Register the custom theme on both plugins before updating representations
            if (viewerA.ref.current) {
                registerThemeIfNeeded(viewerA.ref.current, themeNameAlignedTo);
            }
            if (viewerB.ref.current) {
                registerThemeIfNeeded(viewerB.ref.current, themeNameAlignedTo);
            }
            // Update only the alignedTo molecules for both viewers using their refs
            if (viewerA.moleculeAlignedTo && structureRefAAlignedTo) {
                updateMoleculeColors(
                    viewerA,
                    viewerA.moleculeAlignedTo,
                    { name: themeNameAlignedTo, params: {} },
                    representationTypeAlignedTo,
                    structureRefAAlignedTo,
                    setLastAddedRepresentationRefA
                );
            }
            if (viewerB.moleculeAlignedTo && structureRefBAlignedTo) {
                updateMoleculeColors(
                    viewerB,
                    viewerB.moleculeAlignedTo,
                    { name: themeNameAlignedTo, params: {} },
                    representationTypeAlignedTo,
                    structureRefBAlignedTo,
                    setLastAddedRepresentationRefB
                );
            }
        }
    }, [colorsAlignedToFile.data, viewerA.moleculeAlignedTo, viewerB.moleculeAlignedTo, representationTypeAlignedTo, structureRefAAlignedTo, structureRefBAlignedTo]);
    // Aligned:
    useEffect(() => {
        if (colorsAlignedFile.data && colorsAlignedFile.data.length > 0) {
            setIsMoleculeAlignedColoursLoaded(true);
            // Build and set the chain color map before registering the theme
            const themeChainColorMap = new Map<string, Color>();
            colorsAlignedFile.data.forEach(row => {
                if (row.pdb_chain && row.color) {
                    try {
                        themeChainColorMap.set(row.pdb_chain, Color.fromHexStyle(row.color));
                    } catch {
                        console.warn(`Invalid color: ${row.color}`);
                    }
                }
            });
            chainColorMaps.set(themeNameAligned, themeChainColorMap);
            // Register the custom theme on both plugins before updating representations
            if (viewerA.ref.current) {
                registerThemeIfNeeded(viewerA.ref.current, themeNameAligned);
            }
            if (viewerB.ref.current) {
                registerThemeIfNeeded(viewerB.ref.current, themeNameAligned);
            }
            // Update only the aligned molecules for both viewers using their refs
            if (viewerA.moleculeAligned && structureRefAAligned) {
                updateMoleculeColors(
                    viewerA,
                    viewerA.moleculeAligned,
                    { name: themeNameAligned, params: {} },
                    representationTypeAligned,
                    structureRefAAligned,
                    setLastAddedRepresentationRefA
                );
            }
            if (viewerB.moleculeAligned && structureRefBAligned) {
                updateMoleculeColors(
                    viewerB,
                    viewerB.moleculeAligned,
                    { name: themeNameAligned, params: {} },
                    representationTypeAligned,
                    structureRefBAligned,
                    setLastAddedRepresentationRefB
                );
            }
        }
    }, [colorsAlignedFile.data, viewerA.moleculeAligned, viewerB.moleculeAligned, representationTypeAligned, structureRefAAligned, structureRefBAligned]);

    // Effect for moleculeAlignedTo Chain ID selection.
    useEffect(() => {
        console.log('Updating chain IDs for moleculeAlignedTo');
        const pluginA = viewerA.ref.current;
        if (!pluginA || !structureRefAAlignedTo) return;
        const structureObj = pluginA.managers.structure.hierarchy.current.structures.find(s => s.cell.transform.ref === structureRefAAlignedTo)?.cell.obj?.data;
        if (!structureObj) return;
        setChainIdsAlignedTo(
            getChainIdsFromStructure(structureObj)
        );
    }, [viewerA.moleculeAlignedTo, structureRefAAlignedTo]);

    // Effect for moleculeAligned Chain ID selection.
    useEffect(() => {
        console.log('Updating chain IDs for moleculeAligned');
        const pluginB = viewerB.ref.current;
        if (!pluginB || !structureRefBAligned) return;
        const structureObj = pluginB.managers.structure.hierarchy.current.structures.find(s => s.cell.transform.ref === structureRefBAligned)?.cell.obj?.data;
        if (!structureObj) return;
        setChainIdsAligned(
            getChainIdsFromStructure(structureObj)
        );
    }, [viewerB.moleculeAligned, structureRefBAligned]);

    /**
     * Creates a handler to zoom to a chain.
     * @param structureIndex The index of the structure in the viewer hierarchy to zoom to.
     * @return An object with a handleButtonClick method.
     */
    function createZoomA(structureIndex: number, chain: string) {
        return {
            handleButtonClick: async () => {
                const pluginA = viewerA.ref.current;
                let structureRef = null;
                if (structureIndex === 0) structureRef = structureRefAAlignedTo;
                else if (structureIndex === 1) structureRef = structureRefAAligned;
                if (!pluginA || !structureRef) return;
                const structureObj = pluginA.managers.structure.hierarchy.current.structures.find(s => s.cell.transform.ref === structureRef)?.cell.obj?.data;
                if (!structureObj) {
                    console.warn('No structure data found for alignedTo/aligned.');
                    return;
                }
                const qb = MolScriptBuilder.struct.generator.atomGroups({
                    'chain-test': MolScriptBuilder.core.rel.eq([
                        MolScriptBuilder.struct.atomProperty.macromolecular.auth_asym_id(),
                        chain
                    ])
                });
                const compiled = compile(qb);
                const ctx = new QueryContext(structureObj);
                const selection = compiled(ctx);
                const loci = StructureSelection.toLociWithSourceUnits(selection);
                // Zoom
                pluginA.managers.camera.focusLoci(loci);
                if (syncEnabled){
                    const pluginB = viewerB.ref.current;
                    if (!pluginB) return;
                    pluginB.managers.camera.focusLoci(loci);
                }
            }
        };
    }

    // Create zoomA handlers.
    const zoomAAlignedTo = createZoomA(0, selectedChainIdAlignedTo);
    const zoomAAligned = createZoomA(1, selectedChainIdAligned);

    /**
     * Creates a handler to zoom to a chain.
     * @return An object with a handleButtonClick method.
     * 
     * @param structureIndex The index of the structure in the viewer hierarchy to zoom to.
     * @return An object with a handleButtonClick method.
     */
    function createZoomB(structureIndex: number, chain: string) {
        return {
            handleButtonClick: async () => {
                const pluginB = viewerB.ref.current;
                let structureRef = null;
                if (structureIndex === 0) structureRef = structureRefBAlignedTo;
                else if (structureIndex === 1) structureRef = structureRefBAligned;
                if (!pluginB || !structureRef) return;
                const structureObj = pluginB.managers.structure.hierarchy.current.structures.find(s => s.cell.transform.ref === structureRef)?.cell.obj?.data;
                if (!structureObj) {
                    console.warn('No structure data found for alignedTo/aligned.');
                    return;
                }
                const qb = MolScriptBuilder.struct.generator.atomGroups({
                    'chain-test': MolScriptBuilder.core.rel.eq([
                        MolScriptBuilder.struct.atomProperty.macromolecular.auth_asym_id(),
                        chain
                    ])
                });
                const compiled = compile(qb);
                const ctx = new QueryContext(structureObj);
                const selection = compiled(ctx);
                const loci = StructureSelection.toLociWithSourceUnits(selection);

                pluginB.managers.camera.focusLoci(loci);
                if (syncEnabled){
                    const pluginA = viewerA.ref.current;
                    if (!pluginA) return;
                    pluginA.managers.camera.focusLoci(loci);
                }
            }
        };
    }

    // Create zoomB handlers.
    const zoomBAlignedTo = createZoomB(0, selectedChainIdAlignedTo);
    const zoomBAligned = createZoomB(1, selectedChainIdAligned);
    
    // Return the main app component.
    return (
        <SyncProvider>
            <div className="App">
                <h1 className="app-title">RiboCode Mol* Viewer 0.5.0 (please see <a href="https://github.com/ribocode-slola/ribocode1/?tab=readme-ov-file#ribocode" target="_blank">README</a> for information).</h1>
                <LoadDataRow
                    viewerTitle={viewerA.moleculeAlignedTo
                        ? `Molecule aligned to: ${viewerA.moleculeAlignedTo.name || viewerA.moleculeAlignedTo.filename}`
                        : ""}
                    isLoaded={viewerA.isMoleculeAlignedToLoaded}
                    onFileInputClick={viewerA.handleFileInputButtonClick}
                    fileInputRef={viewerA.fileInputRef}
                    onFileChange={e => handleFileChange(e, 'alignedTo')}
                    fileInputDisabled={!viewerAReady || !viewerBReady}
                    fileInputLabel="Load Molecule To Align To"
                    representationType={representationTypeAlignedTo}
                    onRepresentationTypeChange={setRepresentationTypeAlignedTo}
                    representationTypeDisabled={!viewerA.isMoleculeAlignedToLoaded}
                    onAddColorsClick={colorsAlignedToFile.handleButtonClick}
                    addColorsDisabled={!viewerA.isMoleculeAlignedToLoaded}
                    colorsInputRef={colorsAlignedToFile.inputRef}
                    onColorsFileChange={colorsAlignedToFile.handleFileChange}
                    chainIds={chainIdsAlignedTo}
                    selectedChainId={selectedChainIdAlignedTo}
                    onSelectChainId={setSelectedChainIdAlignedTo}
                    chainSelectDisabled={!viewerA.isMoleculeAlignedToLoaded}
                />
                <LoadDataRow
                    viewerTitle={viewerB.moleculeAligned
                        ? `Molecule aligned: ${viewerB.moleculeAligned.name || viewerB.moleculeAligned.filename}`
                        : ""}
                    isLoaded={viewerB.isMoleculeAlignedLoaded}
                    onFileInputClick={viewerB.handleFileInputButtonClick}
                    fileInputRef={viewerB.fileInputRef}
                    onFileChange={e => handleFileChange(e, 'aligned')}
                    fileInputDisabled={!viewerA.isMoleculeAlignedToLoaded || !viewerAReady || !viewerBReady}
                    fileInputLabel="Load Molecule To Align"
                    representationType={representationTypeAligned}
                    onRepresentationTypeChange={setRepresentationTypeAligned}
                    representationTypeDisabled={!viewerB.isMoleculeAlignedLoaded}
                    onAddColorsClick={colorsAlignedFile.handleButtonClick}
                    addColorsDisabled={!viewerB.isMoleculeAlignedLoaded}
                    colorsInputRef={colorsAlignedFile.inputRef}
                    onColorsFileChange={colorsAlignedFile.handleFileChange}
                    chainIds={chainIdsAligned}
                    selectedChainId={selectedChainIdAligned}
                    onSelectChainId={setSelectedChainIdAligned}
                    chainSelectDisabled={!viewerB.isMoleculeAlignedLoaded}
                />
                <div>
                    <SyncButton
                        viewerA={viewerA.ref.current}
                        viewerB={viewerB.ref.current}
                        activeViewer={activeViewer}
                        disabled={!viewerB.isMoleculeAlignedToLoaded}
                        syncEnabled={syncEnabled}
                        setSyncEnabled={setSyncEnabled}
                    />
                    <button
                        onClick={dictionaryFile.handleButtonClick}
                        disabled={!viewerB.isMoleculeAlignedLoaded}
                    >
                        Load Dictionary
                    </button>
                    <input
                        type="file"
                        accept=".csv,.txt"
                        style={{ display: 'none' }}
                        ref={dictionaryFile.inputRef}
                        onChange={dictionaryFile.handleFileChange}
                    />
                    <button
                        onClick={alignmentFile.handleButtonClick}
                        disabled={!viewerB.isMoleculeAlignedLoaded}
                    >
                        Load Alignment
                    </button>
                    <input
                        type="file"
                        accept=".csv,.txt"
                        style={{ display: 'none' }}
                        ref={alignmentFile.inputRef}
                        onChange={alignmentFile.handleFileChange}
                    />
                </div>
                <div className="grid-container">
                    <div className="viewer-wrapper">
                        <MoleculeRow
                            label={viewerA.moleculeAlignedTo?.label ?? 'Molecule Aligned To'}
                            plugin={viewerA.ref.current}
                            //structureRef={structureRefAAlignedTo}
                            isVisible={viewerA.isMoleculeAlignedToVisible}
                            onToggleVisibility={toggleViewerAAlignedTo.handleButtonClick}
                            zoomLabel={selectedChainIdAlignedTo}
                            onZoom={zoomAAlignedTo.handleButtonClick}
                            zoomDisabled={!selectedChainIdAlignedTo}
                            forceUpdate={forceUpdate}
                            representationRefs={representationRefsAAlignedTo}
                        />
                        <MoleculeRow
                            label={viewerA.moleculeAligned?.label ?? 'Molecule Aligned'}
                            plugin={viewerA.ref.current}
                            //structureRef={structureRefAAligned}
                            isVisible={viewerA.isMoleculeAlignedVisible}
                            onToggleVisibility={toggleViewerAAligned.handleButtonClick}
                            zoomLabel={selectedChainIdAligned}
                            onZoom={zoomAAligned.handleButtonClick}
                            zoomDisabled={!selectedChainIdAligned}
                            forceUpdate={forceUpdate}
                            representationRefs={representationRefsAAligned}
                        />
                        <MolstarContainer
                            viewerKey={viewerA.viewerKey}
                            setViewer={setViewerAWrapper}
                            onMouseDown={() => setActiveViewer(viewerA.viewerKey)}
                            onReady={() => setViewerAReady(true)}
                        />
                    </div>
                    <div className="viewer-wrapper">
                        <MoleculeRow
                            label={viewerB.moleculeAlignedTo?.label ?? 'Molecule Aligned To'}
                            plugin={viewerB.ref.current}
                            //structureRef={structureRefBAlignedTo}
                            isVisible={viewerB.isMoleculeAlignedToVisible}
                            onToggleVisibility={toggleViewerBAlignedTo.handleButtonClick}
                            zoomLabel={selectedChainIdAlignedTo}
                            onZoom={zoomBAlignedTo.handleButtonClick}
                            zoomDisabled={!selectedChainIdAlignedTo}
                            forceUpdate={forceUpdate}
                            representationRefs={representationRefsBAlignedTo}
                        />
                        <MoleculeRow
                            label={viewerB.moleculeAligned?.label ?? 'Molecule Aligned'}
                            plugin={viewerB.ref.current}
                            //structureRef={structureRefBAligned}
                            isVisible={viewerB.isMoleculeAlignedVisible}
                            onToggleVisibility={toggleViewerBAligned.handleButtonClick}
                            zoomLabel={selectedChainIdAligned}
                            onZoom={zoomBAligned.handleButtonClick}
                            zoomDisabled={!selectedChainIdAligned}
                            forceUpdate={forceUpdate}
                            representationRefs={representationRefsBAligned}
                        />
                        <MolstarContainer
                            viewerKey={viewerB.viewerKey}
                            setViewer={setViewerBWrapper}
                            onMouseDown={() => setActiveViewer(viewerB.viewerKey)}
                            onReady={() => setViewerBReady(true)}
                        />
                    </div>
                </div>
            </div>
        </SyncProvider>
    );
};

export default App;