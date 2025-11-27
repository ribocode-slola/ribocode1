import React, { memo, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { PluginContext } from 'molstar/lib/mol-plugin/context';
//import { createPluginUI } from 'molstar/lib/mol-plugin-ui';
import * as PluginUI from 'molstar/lib/mol-plugin-ui';
const createPluginUI = PluginUI.createPluginUI;
//import { DefaultPluginSpec } from 'molstar/lib/mol-plugin/spec';
//import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import './MolstarContainer.css'; // Import the CSS file
import { useSync } from './SyncContext';
//import { CustomPropertyDescriptor } from 'molstar/lib/mol-model/custom-property';
//import { CifCategory } from 'molstar/lib/mol-io/reader/cif';
//import { CifWriter } from 'molstar/lib/mol-io/writer/cif';
import { throttle } from 'lodash';

type MolstarContainerProps = {
    moleculeId: string;
    viewerKey: 'A' | 'B';
};

const MolstarContainer = memo(
    ({ moleculeId, viewerKey }: MolstarContainerProps) => {
        // A React component MolstarContainer that integrates the Mol* library for molecular visualization.
        // Wraps the Mol* plugin in a React component for easy integration using memo.
        // viewerRef: A reference to the <div> element where the Mol* plugin will render the visualization.
        const viewerRef = useRef<HTMLDivElement | null>(null); // Unique ref for each container
        // pluginRef: A reference to the Mol* plugin instance.
        const pluginRef = useRef<any>(null);
        // rootRef: A reference to the ReactDOM root instance for rendering React components inside the Mol* plugin.
        const rootRef = useRef<ReactDOM.Root | null>(null); // Store the ReactDOM root instance

        const {
            viewerA,
            setViewerA,
            viewerB,
            setViewerB,
            syncEnabled,
            activeViewer,
            setActiveViewer
        } = useSync();

        // Initialize Mol* plugin
        useEffect(() => {
            if (!viewerRef.current) return;
            if (!pluginRef.current) {
                pluginRef.current = createPluginUI(viewerRef.current, {});
                if (viewerKey === 'A') setViewerA(pluginRef.current.context);
                else setViewerB(pluginRef.current.context);
            }
            // Load molecule logic here...
        }, [moleculeId, viewerKey, setViewerA, setViewerB]);

        // Listen for selection changes and sync
        useEffect(() => {
            const plugin = pluginRef.current;
            if (!plugin) return;

            const handleSelectionChange = throttle(() => {
                console.log(`[MolstarContainer] handleSelectionChange called for viewer ${viewerKey}`);
                if (!syncEnabled || activeViewer !== viewerKey) {
                    console.log(`[MolstarContainer] Sync not triggered: syncEnabled=${syncEnabled}, activeViewer=${activeViewer}, viewerKey=${viewerKey}`);
                    return;
                }
                const selection = plugin.context.managers.structure.selection.getSelection();
                console.log(`[MolstarContainer] Selection changed in viewer ${viewerKey}. Syncing selection:`, selection);
            
                // Sync selection to the other viewer
                if (viewerKey === 'A' && viewerB) {
                    console.log('[MolstarContainer] Syncing selection to viewer B');
                    viewerB.managers.structure.selection.fromSelections(selection);
                } else if (viewerKey === 'B' && viewerA) {
                    console.log('[MolstarContainer] Syncing selection to viewer A');
                    viewerA.managers.structure.selection.fromSelections(selection);
                }
            }, 100);

            plugin.context.managers.structure.selection.events.changed.add(handleSelectionChange);

            return () => {
                plugin.context.managers.structure.selection.events.changed.remove(handleSelectionChange);
            };
        }, [syncEnabled, activeViewer, viewerKey, viewerA, viewerB]);

        // Set active viewer on click
        const handleClick = () => setActiveViewer(viewerKey);

        return (
            <div ref={viewerRef} className="msp-container" onClick={handleClick}>
                {/* Mol* plugin renders here */}
            </div>
        );
    },
    (prevProps, nextProps) => prevProps.moleculeId === nextProps.moleculeId && prevProps.viewerKey === nextProps.viewerKey

);

export default MolstarContainer;