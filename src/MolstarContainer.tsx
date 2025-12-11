import React, { forwardRef, memo, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import * as PluginUI from 'molstar/lib/mol-plugin-ui';
const createPluginUI = PluginUI.createPluginUI;
import RibocodeViewer from './RibocodeViewer';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import './MolstarContainer.css';
import { ViewerKey } from './App'

type MolstarContainerProps = {
    key: ViewerKey;
    setViewer: (plugin: PluginUIContext) => void;
    onMouseDown?: (key: ViewerKey) => void;
    onReady?: () => void;
};

const MolstarContainer = forwardRef<any, MolstarContainerProps>(
    ({  key: key, setViewer, onMouseDown, onReady }: MolstarContainerProps) => {
            const containerRef = useRef<HTMLDivElement | null>(null);
            const pluginRef = useRef<PluginUIContext | null>(null);
            const [plugin, setPlugin] = useState<PluginUIContext | null>(null);
            const rootRef = useRef<ReactDOM.Root | null>(null);
            
            // Plugin lifecycle: initialization and cleanup
            useEffect(() => {
                const container = containerRef.current;
                console.log(`[MolstarContainer ${key}] Plugin init effect. containerRef.current:`, container);
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
                        setViewer(pluginInstance);
                        if (onReady) onReady();
                    } catch (err) {
                        console.error(`[MolstarContainer ${key}] Plugin creation failed:`, err);
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
            }, [key, onReady]);

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
                        console.log('MolstarContainer mouse down:', key);
                        onMouseDown?.(key);
                    }}
                >
                    <RibocodeViewer
                        plugin={plugin}
                        key={key}
                        onReady={onReady}
                    />
                </div>
            );
    },
);

export default memo( MolstarContainer, 
    (prevProps: MolstarContainerProps, nextProps: MolstarContainerProps) =>
    prevProps.key === nextProps.key
);