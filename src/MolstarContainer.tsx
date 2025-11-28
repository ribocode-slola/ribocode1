import React, { memo, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import * as PluginUI from 'molstar/lib/mol-plugin-ui';
const createPluginUI = PluginUI.createPluginUI;
import MolstarViewer from './MolstarViewer';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { PluginStateObject } from 'molstar/lib/mol-plugin-state/objects';
import { State } from 'molstar/lib/mol-state';
import './MolstarContainer.css'; // Import the CSS file
import { throttle } from 'lodash';

type MolstarContainerProps = {
    moleculeId: string;
    moleculeUrl: string;
    viewerKey: 'A' | 'B';
    onSelectionChange: (selection: any) => void;
    externalSelection: any;
    setViewer: (plugin: PluginUIContext) => void;
    onMouseDown?: (viewerKey: 'A' | 'B') => void;
    onLoadMolecule?: (molecule: { id: string; url: string }) => void;
};

const MolstarContainer = memo(
    ({ moleculeId, moleculeUrl, viewerKey, onSelectionChange, externalSelection, 
        setViewer, onMouseDown, onLoadMolecule }: MolstarContainerProps) => {
        const containerRef = useRef<HTMLDivElement | null>(null);
        const pluginRef = useRef<PluginUIContext | null>(null);
        const [plugin, setPlugin] = useState<PluginUIContext | null>(null);
        const rootRef = useRef<ReactDOM.Root | null>(null);
        
        // Plugin lifecycle: initialization and cleanup
        useEffect(() => {
            const container = containerRef.current;
            console.log(`[MolstarViewer ${viewerKey}] Plugin init effect. containerRef.current:`, container);
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

                    pluginRef.current = pluginInstance;
                    setPlugin(pluginInstance);
                } catch (err) {
                    console.error(`[MolstarViewer ${viewerKey}] Plugin creation failed:`, err);
                }
            };

            initializePlugin();

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
        }, [viewerKey]);

        useEffect(() => {
            if (plugin && setViewer) {
                setViewer(plugin);
            }
        }, [plugin, setViewer]);

        return (
            <div
                ref={containerRef}
                className="molstar-container"
                onMouseDownCapture={() => {
                    console.log('MolstarContainer mouse down:', viewerKey);
                    onMouseDown?.(viewerKey);
                }}
            >
                <MolstarViewer
                    moleculeId={moleculeId}
                    moleculeUrl={moleculeUrl}
                    plugin={plugin}
                    viewerKey={viewerKey}
                    onSelectionChange={onSelectionChange}
                    externalSelection={externalSelection}
                />
            </div>
        );
    },
    (prevProps, nextProps) =>
        prevProps.moleculeId === nextProps.moleculeId &&
        prevProps.moleculeUrl === nextProps.moleculeUrl &&
        prevProps.viewerKey === nextProps.viewerKey
);

export default MolstarContainer;