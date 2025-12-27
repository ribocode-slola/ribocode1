/**
 * MolstarContainer component that integrates the Mol* plugin within a React application.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import React, { memo, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import * as PluginUI from 'molstar/lib/mol-plugin-ui';
const createPluginUI = PluginUI.createPluginUI;
import RibocodeViewer, { ViewerKey } from './RibocodeViewer';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import '../css/MolstarContainer.css';

/**
 * Props for MolstarContainer component.
 * @param viewerKey Unique key for the viewer instance.
 * @param setViewer Function to set the PluginUIContext instance.
 * @param onMouseDown Optional callback for mouse down events.
 * @param onReady Optional callback when the viewer is ready.
 */
type MolstarContainerProps = {
    viewerKey: ViewerKey;
    setViewer: (plugin: PluginUIContext) => void;
    onMouseDown?: (viewerKey: ViewerKey) => void;
    onReady?: () => void;
};

/**
 * MolstarContainer component manages the lifecycle of the Mol* plugin instance.
 * @param viewerKey Unique key for the viewer instance.
 * @param setViewer Function to set the PluginUIContext instance.
 * @param onMouseDown Optional callback for mouse down events.
 * @param onReady Optional callback when the viewer is ready.
 * @param ref Forwarded ref to expose methods to parent components.
 * @returns The MolstarContainer component.
 */
const MolstarContainer = React.forwardRef(({viewerKey, setViewer, onMouseDown, onReady }: MolstarContainerProps, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const pluginRef = useRef<PluginUIContext | null>(null);
    const [plugin, setPlugin] = useState<PluginUIContext | null>(null);
    const rootRef = useRef<ReactDOM.Root | null>(null);
    // Plugin lifecycle: initialization and cleanup
    useEffect(() => {
        const container = containerRef.current;
        console.log(`[MolstarContainer ${viewerKey}] Plugin init effect. containerRef.current:`, container);
        if (!container) return;
        // Cleanup previous plugin/root
        if (pluginRef.current) {
            pluginRef.current.dispose();
            pluginRef.current = null;
        }
        if (rootRef.current) {
            rootRef.current.unmount();
            rootRef.current = null;
        }
        // Async plugin initialization
        const initializePlugin = async () => {
            try {
                const pluginInstance = await createPluginUI({
                    target: container,
                    render: (component: React.ReactNode, container: HTMLElement) => {
                        if (!rootRef.current) {
                            rootRef.current = ReactDOM.createRoot(container);
                        }
                        rootRef.current.render(component);
                    },
                });
                // WebGL context loss handling
                const gl = pluginInstance.canvas3d?.webgl?.gl;
                if (gl) {
                    gl.canvas.addEventListener('webglcontextlost', (event: WebGLContextEvent) => {
                        event.preventDefault();
                        console.error('WebGL context lost.');
                    });
                    gl.canvas.addEventListener('webglcontextrestored', () => {
                        (async () => {
                            if (pluginRef.current) {
                                pluginRef.current.dispose();
                                pluginRef.current = null;
                            }
                            await initializePlugin();
                        })();
                    });
                }
                // Set the plugin instance on the ref.
                pluginRef.current = pluginInstance;
                // Also set the plugin instance on the forwarded ref, if present
                if (ref && typeof ref === 'object' && 'current' in ref) {
                    ref.current = pluginInstance;
                }
                setPlugin(pluginInstance);
                setViewer(pluginInstance);
                if (onReady) onReady();
            } catch (err) {
                console.error(`[MolstarContainer ${viewerKey}] Plugin creation failed:`, err);
            }
        };
        // Start.
        initializePlugin();
        // Cleanup on unmount.
        return () => {
            if (pluginRef.current) {
                pluginRef.current.dispose();
                pluginRef.current = null;
            }
            if (rootRef.current) {
                rootRef.current.unmount();
                rootRef.current = null;
            }
        };
    }, [viewerKey, onReady]);
    // Update setViewer when plugin changes.
    useEffect(() => {
        if (plugin && setViewer) {
            setViewer(plugin);
        }
    }, [plugin, setViewer]);
    // Expose forceMolstarUIRefresh via ref (triggers a React re-render of the Molstar UI only)
    React.useImperativeHandle(ref, () => ({
        forceMolstarUIRefresh: () => {
            setPlugin(p => p); // Triggers a re-render of the Molstar UI without breaking prototype
        }
    }), []);
    // Return the container and RibocodeViewer
    return (
        <div
            ref={containerRef}
            className="molstar-container"
            onMouseDownCapture={() => {
                console.log('MolstarContainer mouse down:', viewerKey);
                onMouseDown?.(viewerKey);
            }}
        >
            <RibocodeViewer
                plugin={plugin}
                viewerKey={viewerKey}
                onReady={onReady}
            />
        </div>
    );
});

/**
 * Memoized MolstarContainer to prevent unnecessary re-renders.
 * @param prevProps Previous props.
 * @param nextProps Next props.
 * @returns Whether the props are equal.
 */
export default memo(
    MolstarContainer, 
    (prevProps: MolstarContainerProps, nextProps: MolstarContainerProps) =>
        prevProps.viewerKey === nextProps.viewerKey
);