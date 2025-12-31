/**
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import React from 'react';
import ChainSelectButton from './buttons/select/Chain';
import ResidueSelectButton from './buttons/select/Residue';
import SubunitSelectButton, { RibosomeSubunitType } from './buttons/select/Subunit';
import { allowedRepresentationTypes, AllowedRepresentationType } from './buttons/select/Representation';
import { ResidueLabelInfo } from 'src/utils/Residue';

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
 * @param selectedSubunit Currently selected subunit.
 * @param onSelectSubunit Function to handle subunit selection.
 * @param subunitSelectDisabled Whether the subunit select button is disabled.
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
    // // Subunit selection
    // selectedSubunit: RibosomeSubunitType;
    // onSelectSubunit: (subunit: RibosomeSubunitType) => void;
    // subunitSelectDisabled: boolean;
    // Chain selection
    chainIds: string[];
    selectedChainId: string;
    onSelectChainId: (id: string) => void;
    chainSelectDisabled: boolean;
    // Residue selection
    residueInfo: {
        residueIds: string[];
        residueToAtomIds: Record<string, string[]>;
        residueLabels: ResidueLabelInfo[];
    };
    selectedResidueId: string;
    onSelectResidueId: (id: string) => void;
    residueSelectDisabled: boolean;
    // Optional representation type selector
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
 * @param subunitOptions Array of subunit options.
 * @param selectedSubunit Currently selected subunit.
 * @param onSelectSubunit Function to handle subunit selection.
 * @param subunitSelectDisabled Whether the subunit select button is disabled.
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
    //selectedSubunit,
    //onSelectSubunit,
    //subunitSelectDisabled,
    chainIds,
    selectedChainId,
    onSelectChainId,
    chainSelectDisabled,
    residueInfo,
    selectedResidueId,
    onSelectResidueId,
    residueSelectDisabled,
    representationTypeSelector,
    onAddRepresentationClick = () => { },
    addRepresentationDisabled = false
}) => (
    <div className="load-data-row">
        <div className="viewer-title">{viewerTitle}</div>
        {!isLoaded && (
            <div>
                <button
                    type="button"
                    onClick={onFileInputClick}
                    disabled={fileInputDisabled}
                    className="msp-btn msp-form-control"
                    aria-label={fileInputLabel}
                >
                    {fileInputLabel}
                </button>
                <input
                    type="file"
                    accept=".cif,.mmcif"
                    ref={fileInputRef}
                    onChange={onFileChange}
                    style={{ display: 'none' }}
                    tabIndex={-1}
                />
            </div>
        )}
        <div className="load-data-controls">
            {/* <SubunitSelectButton
                disabled={subunitSelectDisabled}
                selectedSubunit={selectedSubunit}
                onSelect={onSelectSubunit}
            />
            <ChainSelectButton
                disabled={chainSelectDisabled || !selectedSubunit}
                chainIds={chainIds}
                selectedChainId={selectedChainId}
                onSelect={onSelectChainId}
            /> */}
            <ChainSelectButton
                disabled={chainSelectDisabled}
                chainIds={chainIds}
                selectedChainId={selectedChainId}
                onSelect={onSelectChainId}
            />
            <ResidueSelectButton
                disabled={residueSelectDisabled || !selectedChainId}
                residueIds={residueInfo.residueIds}
                selectedResidueId={selectedResidueId}
                onSelect={onSelectResidueId}
            />
            <div>
                <button
                    type="button"
                    onClick={onAddColorsClick}
                    disabled={addColorsDisabled}
                    aria-label="Load Colours"
                    className="msp-btn msp-form-control"
                >
                    Load Colours
                </button>
                <input
                    type="file"
                    accept=".csv,.tsv,.txt,.json"
                    ref={colorsInputRef}
                    onChange={onColorsFileChange}
                    style={{ display: 'none' }}
                    tabIndex={-1}
                />
            </div>
            {representationTypeSelector ? (
                <span className="rep-type-controls">
                    {representationTypeSelector}
                    <button
                        onClick={onAddRepresentationClick}
                        disabled={addRepresentationDisabled}
                        aria-label="Add Representation"
                        className="msp-btn msp-form-control"
                    >
                        +
                    </button>
                </span>
            ) : (
                <span className="rep-type-controls">
                    <label htmlFor="representation-type">
                        Representation:
                    </label>
                    <select
                        id="representation-type"
                        value={representationType}
                        onChange={e => onRepresentationTypeChange(e.target.value as AllowedRepresentationType)}
                        disabled={representationTypeDisabled}
                        className="msp-select msp-form-control"
                    >
                        {allowedRepresentationTypes.map(type => (
                            <option key={type} value={type}>{type.replace(/-/g, ' ')}</option>
                        ))}
                    </select>
                    <button
                        onClick={onAddRepresentationClick}
                        disabled={addRepresentationDisabled}
                        aria-label="Add Representation"
                        className="msp-btn msp-form-control"
                    >
                        +
                    </button>
                </span>
            )}
        </div>
    </div>
);

export default LoadDataRow;
