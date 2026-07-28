/**
 * Advanced Mol* controls rendered outside the main viewport container.
 *
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 */
import React from 'react';
import { PluginContextContainer, ControlsWrapper, Log } from 'molstar/lib/mol-plugin-ui/plugin';
import { LeftPanelControls } from 'molstar/lib/mol-plugin-ui/left-panel';
import { SequenceView } from 'molstar/lib/mol-plugin-ui/sequence';
import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';

interface MolstarAdvancedControlsProps {
  plugin: PluginUIContext | null;
  visible: boolean;
  idPrefix: string;
}

const MolstarAdvancedControls: React.FC<MolstarAdvancedControlsProps> = ({ plugin, visible, idPrefix }) => {
  if (!visible) return null;

  return (
    <div
      id={`${idPrefix}-advanced-molstar-controls-panel`}
      data-testid={`${idPrefix}-advanced-molstar-controls-panel`}
      className="molstar-advanced-controls-panel"
    >
      {!plugin ? (
        <div className="molstar-advanced-controls-empty">Mol* controls are not ready yet.</div>
      ) : (
        <PluginContextContainer plugin={plugin}>
          <div className="molstar-advanced-controls-grid">
            <section className="molstar-advanced-controls-section">
              <h4 className="molstar-advanced-controls-title">Sequence</h4>
              <SequenceView />
            </section>
            <section className="molstar-advanced-controls-section">
              <h4 className="molstar-advanced-controls-title">Left Panel</h4>
              <LeftPanelControls />
            </section>
            <section className="molstar-advanced-controls-section">
              <h4 className="molstar-advanced-controls-title">Structure Tools</h4>
              <ControlsWrapper />
            </section>
            <section className="molstar-advanced-controls-section">
              <h4 className="molstar-advanced-controls-title">Log</h4>
              <div className="molstar-advanced-controls-log-wrap">
                <Log />
              </div>
            </section>
          </div>
        </PluginContextContainer>
      )}
    </div>
  );
};

export default MolstarAdvancedControls;
