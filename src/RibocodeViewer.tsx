import React, { useState, useEffect, useRef } from 'react';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import './MolstarContainer.css';
import { ViewerKey } from './App'

interface RibocodeViewerProps {
    plugin: PluginUIContext | null;
    key: ViewerKey;
    onReady?: (viewer: PluginUIContext | null) => void;
}

const RibocodeViewer: React.FC<RibocodeViewerProps> = ({
    plugin, key, onReady }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [viewerReady, setViewerReady] = useState(false);
    const viewerRef = useRef<PluginUIContext | null>(null);

    // Viewer setup effect: initializes viewer when plugin is available
    useEffect(() => {
        if (plugin && containerRef.current) {
            viewerRef.current = plugin;
            setViewerReady(true);
            console.log(`[RibocodeViewer ${key}] Viewer initialized.`);
            if (onReady) onReady(viewerRef.current); // <-- Notify parent
        }
        return () => {
            viewerRef.current = null;
            setViewerReady(false);
            if (onReady) onReady(null); // <-- Notify parent on cleanup
        };
    }, [plugin]);

    // Viewer initialization effect
    useEffect(() => {
        console.log(`[RibocodeViewer ${key}] Viewer initialization effect. viewer:`, viewerRef.current);
        if (viewerRef.current && !(viewerRef.current as any).disposed) {
            setViewerReady(true);
            console.log(`[RibocodeViewer ${key}] Viewer ready.`);
        }
    }, [viewerReady]);

    return (
        <div className="ribocode-viewer">
            <div ref={containerRef} className="molstar-container"></div>
        </div>
    );
};

export default RibocodeViewer;