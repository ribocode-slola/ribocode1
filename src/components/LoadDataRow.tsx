/**
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import React from 'react';
import ChainSelectButton from './ChainSelectButton';
import { allowedRepresentationTypes, AllowedRepresentationType } from '../types/Representation';

/**
 * Props for LoadDataRow component.
 * @param viewerTitle The title of the viewer.
 * @param isLoaded Whether the data is loaded.
 * @param onFileInputClick Function to handle file input button click.
 * @param fileInputRef Ref for the hidden file input element.
 * @param onFileChange Function to handle file input change event.
 * @param fileInputDisabled Whether the file input button is disabled.
 * @param fileInputLabel Label for the file input button.
 * @param representationType Current representation type.
 * @param onRepresentationTypeChange Function to handle representation type change.
 * @param representationTypeDisabled Whether the representation type selector is disabled.
 * @param onAddColorsClick Function to handle add colors button click.
 * @param addColorsDisabled Whether the add colors button is disabled.
 * @param colorsInputRef Ref for the hidden colors file input element.
 * @param onColorsFileChange Function to handle colors file input change event.
 * @param chainIds Array of chain IDs.
 * @param selectedChainId Currently selected chain ID.
 * @param onSelectChainId Function to handle chain ID selection.
 * @param chainSelectDisabled Whether the chain select button is disabled.
 */
interface LoadDataRowProps {
    viewerTitle: string;
    isLoaded: boolean;
    onFileInputClick: () => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    fileInputDisabled: boolean;
    fileInputLabel: string;
    representationType: AllowedRepresentationType;
    onRepresentationTypeChange: (type: AllowedRepresentationType) => void;
    representationTypeDisabled: boolean;
    onAddColorsClick: () => void;
    addColorsDisabled: boolean;
    colorsInputRef: React.RefObject<HTMLInputElement | null>;
    onColorsFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    chainIds: string[];
    selectedChainId: string;
    onSelectChainId: (id: string) => void;
    chainSelectDisabled: boolean;
    representationTypeSelector?: React.ReactNode;
    onAddRepresentationClick: () => void;
    addRepresentationDisabled: boolean;
}

/**
 * A row component for loading data into a Mol* viewer, selecting representation type,
 * adding colors, and selecting chain IDs.
 * @param viewerTitle The title of the viewer.
 * @param isLoaded Whether the data is loaded.
 * @param onFileInputClick Function to handle file input button click.
 * @param fileInputRef Ref for the hidden file input element.
 * @param onFileChange Function to handle file input change event.
 * @param fileInputDisabled Whether the file input button is disabled.
 * @param fileInputLabel Label for the file input button.
 * @param representationType Current representation type.
 * @param onRepresentationTypeChange Function to handle representation type change.
 * @param representationTypeDisabled Whether the representation type selector is disabled.
 * @param onAddColorsClick Function to handle add colors button click.
 * @param addColorsDisabled Whether the add colors button is disabled.
 * @param colorsInputRef Ref for the hidden colors file input element.
 * @param onColorsFileChange Function to handle colors file input change event.
 * @param chainIds Array of chain IDs.
 * @param selectedChainId Currently selected chain ID.
 * @param onSelectChainId Function to handle chain ID selection.
 * @param chainSelectDisabled Whether the chain select button is disabled.
 * @returns The LoadDataRow component.
 */
const LoadDataRow: React.FC<LoadDataRowProps> = ({
    viewerTitle,
    isLoaded,
    onFileInputClick,
    fileInputRef,
    onFileChange,
    fileInputDisabled,
    fileInputLabel,
    representationType,
    onRepresentationTypeChange,
    representationTypeDisabled,
    onAddColorsClick,
    addColorsDisabled,
    colorsInputRef,
    onColorsFileChange,
    chainIds,
    selectedChainId,
    onSelectChainId,
    chainSelectDisabled,
    representationTypeSelector,
    onAddRepresentationClick = () => {},
    addRepresentationDisabled = false,
}) => (
    <div className="load-data-row">
        <div className="viewer-title">{viewerTitle}</div>
        {!isLoaded && (
            <>
                <button
                    onClick={onFileInputClick}
                    disabled={fileInputDisabled}
                >
                    {fileInputLabel}
                </button>
                <input
                    type="file"
                    accept=".cif,.mmcif"
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                    onChange={onFileChange}
                />
            </>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {representationTypeSelector ? (
                representationTypeSelector
            ) : (
                <>
                    <label htmlFor="representation-type" style={{ marginRight: 4 }}>
                        Representation:
                    </label>
                    <select
                        id="representation-type"
                        value={representationType}
                        onChange={e => onRepresentationTypeChange(e.target.value as AllowedRepresentationType)}
                        disabled={representationTypeDisabled}
                    >
                        {allowedRepresentationTypes.map(type => (
                            <option key={type} value={type}>{type.replace(/-/g, ' ')}</option>
                        ))}
                    </select>
                </>
            )}
            <button
                onClick={onAddColorsClick}
                disabled={addColorsDisabled}
            >
                Load Colours
            </button>
            <input
                type="file"
                accept=".csv,.tsv,.txt,.json"
                style={{ display: 'none' }}
                ref={colorsInputRef}
                onChange={onColorsFileChange}
            />
            <button
                onClick={onAddRepresentationClick}
                disabled={addRepresentationDisabled}
                style={{ marginLeft: 8 }}
            >
                Add Representation: {representationType}{selectedChainId ? ` for ${selectedChainId}` : ''}
            </button>
        </div>
        <ChainSelectButton
            disabled={chainSelectDisabled}
            chainIds={chainIds}
            selectedChainId={selectedChainId}
            onSelect={onSelectChainId}
        />
    </div>
);

export default LoadDataRow;
