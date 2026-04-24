/**
 * Viewer column component.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import React from 'react';
import LoadDataRow from './LoadMolecule';
import MoleculeUI from './Molecule';
import RealignedMoleculeList from './RealignedMoleculeList';
import MolstarContainer from './MolstarContainer';
import RepresentationSelectButton, { AllowedRepresentationType } from './buttons/select/Representation';
import { ViewerKey } from './RibocodeViewer';

// Props for the ViewerColumn component
export interface LoadDataRowPropsInput {
	viewer: any;
	otherViewer: any;
	molstar: any;
	otherMolstar: any;
	realignedStructRefs: any;
	otherRealignedStructRefs: any;
	isMoleculeAlignedLoaded: boolean;
	isMoleculeAlignedToLoaded: boolean;
	viewerReady: boolean;
	otherViewerReady: boolean;
	representationType: any;
	setRepresentationType: (val: any) => void;
	colorsFile: any;
	isMoleculeColoursLoaded: boolean;
	structureRef: any;
	otherStructureRef: any;
	selectedSubunit: any;
	setSelectedSubunit: (val: any) => void;
	subunitToChainIds: any;
	chainInfo: any;
	selectedChainId: any;
	setSelectedChainId: (val: any) => void;
	residueInfo: any;
	selectedResidueId: any;
	setSelectedResidueId: (val: any) => void;
	fog: { enabled: boolean; near: number; far: number };
	setFog: {
		setEnabled: (val: boolean) => void;
		setNear: (val: number) => void;
		setFar: (val: number) => void;
	};
	camera: { near: number; far: number };
	setCamera: {
		setNear: (val: number) => void;
		setFar: (val: number) => void;
	};
	updateFog: (...args: any[]) => void;
	handleFileChange: (...args: any[]) => void;
	Aligned: string;
	allowedRepresentationTypes: readonly string[];
	syncEnabled: boolean;
	realignedRepRefs: any;
	setRealignedRepRefs: (val: any) => void;
	setRealignedStructRefs: (val: any) => void;
}

/**
 * Generates props for the LoadDataRow component.
 * @param props - The input props required to generate the LoadDataRow props.
 * @returns An object containing the props for the LoadDataRow component.
 */
export function getLoadDataRowProps({
	viewer,
	otherViewer,
	molstar,
	otherMolstar,
	realignedStructRefs,
	otherRealignedStructRefs,
	isMoleculeAlignedLoaded,
	isMoleculeAlignedToLoaded,
	viewerReady,
	otherViewerReady,
	representationType,
	setRepresentationType,
	colorsFile,
	isMoleculeColoursLoaded,
	structureRef,
	otherStructureRef,
	selectedSubunit,
	setSelectedSubunit,
	subunitToChainIds,
	chainInfo,
	selectedChainId,
	setSelectedChainId,
	residueInfo,
	selectedResidueId,
	setSelectedResidueId,
	fog,
	setFog,
	camera,
	setCamera,
	updateFog,
	handleFileChange,
	Aligned,
	allowedRepresentationTypes,
	syncEnabled,
	realignedRepRefs,
	setRealignedRepRefs,
	setRealignedStructRefs
}: LoadDataRowPropsInput) {
	return {
		viewerTitle: viewer.moleculeAligned ? Aligned + `: ${viewer.moleculeAligned.name || viewer.moleculeAligned.filename}` : "",
		isLoaded: isMoleculeAlignedLoaded,
		onFileInputClick: viewer.handleFileInputButtonClick,
		fileInputRef: viewer.fileInputRef,
		onFileChange: (e: any) => handleFileChange(e, Aligned),
		fileInputDisabled: !isMoleculeAlignedToLoaded || !viewerReady || !otherViewerReady,
		fileInputLabel: `Load ${Aligned}`,
		representationType,
		onRepresentationTypeChange: setRepresentationType,
		representationTypeDisabled: !isMoleculeAlignedLoaded,
		representationTypeSelector: (
			<RepresentationSelectButton
				label="Select Representation"
				options={[...allowedRepresentationTypes]}
				selected={representationType}
				onSelect={option => setRepresentationType(option as AllowedRepresentationType)}
				disabled={!isMoleculeAlignedLoaded}
			/>
		),
		onAddColorsClick: colorsFile.handleButtonClick,
		addColorsDisabled: !isMoleculeAlignedLoaded,
		onAddRepresentationClick: () => {
			let colorTheme;
			if (isMoleculeColoursLoaded) {
				colorTheme = { name: Aligned + '-custom-chain-colors', params: {} };
			} else {
				colorTheme = { name: 'default', params: {} };
			}
			const repId = (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
			if (viewer.moleculeAligned && structureRef) {
				molstar.addRepresentation(
					Aligned,
					structureRef,
					representationType,
					colorTheme,
					repId
				);
			}
			if (otherViewer.moleculeAligned && otherStructureRef) {
				otherMolstar.addRepresentation(
					Aligned,
					otherStructureRef,
					representationType,
					colorTheme,
					repId
				);
			}
			Object.entries(realignedStructRefs).forEach(([id, structRef]) => {
				if (structRef) {
					molstar.addRepresentation(
						id,
						structRef,
						representationType,
						colorTheme,
						repId
					);
				}
			});
			Object.entries(otherRealignedStructRefs).forEach(([id, structRef]) => {
				if (structRef) {
					otherMolstar.addRepresentation(
						id,
						structRef,
						representationType,
						colorTheme,
						repId
					);
				}
			});
		},
		addRepresentationDisabled: !isMoleculeAlignedLoaded || !structureRef,
		colorsInputRef: colorsFile.inputRef,
		onColorsFileChange: colorsFile.handleFileChange,
		selectedSubunit,
		onSelectSubunit: setSelectedSubunit,
		subunitSelectDisabled: !isMoleculeAlignedLoaded,
		chainInfo,
		selectedChainId,
		onSelectChainId: setSelectedChainId,
		chainSelectDisabled: !isMoleculeAlignedToLoaded,
		residueInfo,
		selectedResidueId,
		onSelectResidueId: setSelectedResidueId,
		residueSelectDisabled: !isMoleculeAlignedLoaded,
		fogEnabled: fog.enabled,
		fogNear: fog.near,
		fogFar: fog.far,
		onFogEnabledChange: (val: boolean) => {
			setFog.setEnabled(val);
			updateFog(viewer.ref.current, otherViewer.ref.current, val, fog.near, fog.far, camera.near, camera.far);
		},
		onFogNearChange: (val: number) => {
			setFog.setNear(val);
			updateFog(viewer.ref.current, otherViewer.ref.current, fog.enabled, val, fog.far, camera.near, camera.far);
		},
		onFogFarChange: (val: number) => {
			setFog.setFar(val);
			updateFog(viewer.ref.current, otherViewer.ref.current, fog.enabled, fog.near, val, camera.near, camera.far);
		},
		cameraNear: camera.near,
		cameraFar: camera.far,
		onCameraNearChange: (val: number) => {
			setCamera.setNear(val);
			updateFog(viewer.ref.current, otherViewer.ref.current, fog.enabled, fog.near, fog.far, val, camera.far);
		},
		onCameraFarChange: (val: number) => {
			setCamera.setFar(val);
			updateFog(viewer.ref.current, otherViewer.ref.current, fog.enabled, fog.near, fog.far, camera.near, val);
		},
		subunitToChainIds
	};
}

/**
 * Generates props for the MoleculeUI component for the aligned-to molecule.
 * @param props - The input props required to generate the MoleculeUIAlignedTo props.
 * @returns An object containing the props for the MoleculeUI component for the aligned-to molecule.
 */
export function getMoleculeUIAlignedToProps({
	molstar,
	otherMolstar,
	viewer,
	isVisible,
	onToggleVisibility,
	chainZoomLabel,
	onChainZoom,
	chainZoomDisabled,
	residueZoomLabel,
	onResidueZoom,
	residueZoomDisabled,
	isLoaded,
	forceUpdate,
	representationRefs,
	syncEnabled,
	deleteRepresentation,
	repIdMap,
	AlignedTo
}: {
	molstar: any,
	otherMolstar: any,
	viewer: any,
	isVisible: boolean,
	onToggleVisibility: () => void,
	chainZoomLabel: string,
	onChainZoom: () => void,
	chainZoomDisabled: boolean,
	residueZoomLabel: string,
	onResidueZoom: () => void,
	residueZoomDisabled: boolean,
	isLoaded: boolean,
	forceUpdate: () => void,
	representationRefs: any[],
	syncEnabled: boolean,
	deleteRepresentation: any,
	repIdMap: any,
	AlignedTo: string
}) {
	return {
		key: representationRefs?.join('-') || viewer.viewerKey + `-` + AlignedTo,
		label: viewer.moleculeAlignedTo?.label ?? AlignedTo,
		plugin: viewer.ref.current,
		isVisible,
		onToggleVisibility,
		chainZoomLabel,
		onChainZoom,
		chainZoomDisabled,
		residueZoomLabel,
		onResidueZoom,
		residueZoomDisabled,
		isLoaded,
		forceUpdate,
		representationRefs: representationRefs || [],
		onDeleteRepresentation: (ref: string) => {
			const repId = Object.entries(repIdMap[AlignedTo]).find(([id, r]) => r === ref)?.[0];
			if (syncEnabled && repId) {
				Promise.all([
					deleteRepresentation(molstar.repIdMap[AlignedTo][repId], AlignedTo, molstar, false),
					deleteRepresentation(otherMolstar.repIdMap[AlignedTo][repId], AlignedTo, otherMolstar, false)
				]).then(forceUpdate);
			} else if (repId) {
				deleteRepresentation(molstar.repIdMap[AlignedTo][repId], AlignedTo, molstar);
			} else {
				if (syncEnabled) {
					Promise.all([
						deleteRepresentation(ref, AlignedTo, molstar, false),
						deleteRepresentation(ref, AlignedTo, otherMolstar, false)
					]).then(forceUpdate);
				} else {
					deleteRepresentation(ref, AlignedTo, molstar);
				}
			}
		},
		onToggleRepVisibility: (ref: string) => {
			[molstar, otherMolstar].forEach(molstarInstance => {
				const plugin = molstarInstance.pluginRef.current;
				if (!plugin) return;
				const cell = plugin.state?.data?.cells?.get(ref);
				if (cell) {
					import('molstar/lib/mol-plugin/commands').then(({ PluginCommands }) => {
						PluginCommands.State.ToggleVisibility.apply(plugin, [plugin, { state: plugin.state.data, ref }]);
						plugin.canvas3d?.requestDraw?.();
						forceUpdate();
					});
				}
			});
		},
	};
}

/**
 * Generates props for the MoleculeUI component for the aligned molecule.
 * @param props - The input props required to generate the MoleculeUIAligned props.
 * @returns An object containing the props for the MoleculeUI component for the aligned molecule.
 */
export function getMoleculeUIAlignedProps({
	molstar,
	otherMolstar,
	viewer,
	isVisible,
	onToggleVisibility,
	chainZoomLabel,
	onChainZoom,
	chainZoomDisabled,
	residueZoomLabel,
	onResidueZoom,
	residueZoomDisabled,
	isLoaded,
	forceUpdate,
	representationRefs,
	syncEnabled,
	deleteRepresentation,
	repIdMap,
	Aligned,
	chainInfoAligned,
	selectedChainIdAligned,
	residueInfoAligned,
	selectedResidueIdAligned
}: {
	molstar: any,
	otherMolstar: any,
	viewer: any,
	isVisible: boolean,
	onToggleVisibility: () => void,
	chainZoomLabel: string,
	onChainZoom: () => void,
	chainZoomDisabled: boolean,
	residueZoomLabel: string,
	onResidueZoom: () => void,
	residueZoomDisabled: boolean,
	isLoaded: boolean,
	forceUpdate: () => void,
	representationRefs: any[],
	syncEnabled: boolean,
	deleteRepresentation: any,
	repIdMap: any,
	Aligned: string,
	chainInfoAligned: any,
	selectedChainIdAligned: any,
	residueInfoAligned: any,
	selectedResidueIdAligned: any
}) {
	return {
		key: representationRefs?.join('-') || viewer.viewerKey + `-` + Aligned,
		label: viewer.moleculeAligned?.label ?? Aligned,
		plugin: viewer.ref.current,
		isVisible,
		onToggleVisibility,
		chainZoomLabel,
		onChainZoom,
		chainZoomDisabled,
		residueZoomLabel,
		onResidueZoom,
		residueZoomDisabled,
		isLoaded,
		forceUpdate,
		representationRefs: representationRefs || [],
		onDeleteRepresentation: (ref: string) => {
			const repId = Object.entries(repIdMap[Aligned]).find(([id, r]) => r === ref)?.[0];
			if (syncEnabled && repId) {
				Promise.all([
					deleteRepresentation(molstar.repIdMap[Aligned][repId], Aligned, molstar, false),
					deleteRepresentation(otherMolstar.repIdMap[Aligned][repId], Aligned, otherMolstar, false)
				]).then(forceUpdate);
			} else if (repId) {
				deleteRepresentation(molstar.repIdMap[Aligned][repId], Aligned, molstar);
			} else {
				if (syncEnabled) {
					Promise.all([
						deleteRepresentation(ref, Aligned, molstar, false),
						deleteRepresentation(ref, Aligned, otherMolstar, false)
					]).then(forceUpdate);
				} else {
					deleteRepresentation(ref, Aligned, molstar);
				}
			}
		},
		onToggleRepVisibility: (ref: string) => {
			[molstar, otherMolstar].forEach(molstarInstance => {
				const plugin = molstarInstance.pluginRef.current;
				if (!plugin) return;
				const cell = plugin.state?.data?.cells?.get(ref);
				if (cell) {
					import('molstar/lib/mol-plugin/commands').then(({ PluginCommands }) => {
						PluginCommands.State.ToggleVisibility.apply(plugin, [plugin, { state: plugin.state.data, ref }]);
						plugin.canvas3d?.requestDraw?.();
						forceUpdate();
					});
				}
			});
		},
	};
}

/**
 * Generates props for the RealignedMoleculeList component.
 * @param props - The input props required to generate the RealignedMoleculeList props.
 * @returns An object containing the props for the RealignedMoleculeList component.
 */
export function getRealignedMoleculeListProps({
	molecules,
	molstar,
	chainInfo,
	residueInfo,
	selectedResidueId,
	realignedStructRefs,
	setRealignedMolecules,
	setRealignedRepRefs,
	setRealignedStructRefs,
	forceUpdate,
	viewerKey,
	otherMolstar,
	otherRealignedStructRefs,
	setOtherRealignedMolecules,
	setOtherRealignedRepRefs,
	setOtherRealignedStructRefs
}: {
	molecules: any,
	molstar: any,
	chainInfo: any,
	residueInfo: any,
	selectedResidueId: any,
	realignedStructRefs: any,
	setRealignedMolecules: any,
	setRealignedRepRefs: any,
	setRealignedStructRefs: any,
	forceUpdate: () => void,
	viewerKey: string,
	otherMolstar: any,
	otherRealignedStructRefs: any,
	setOtherRealignedMolecules: any,
	setOtherRealignedRepRefs: any,
	setOtherRealignedStructRefs: any
}) {
	return {
		molecules,
		molstar,
		chainInfo,
		residueInfo,
		selectedResidueId,
		realignedStructRefs,
		setRealignedMolecules,
		setRealignedRepRefs,
		setRealignedStructRefs,
		forceUpdate,
		viewerKey,
		otherMolstar,
		otherRealignedStructRefs,
		setOtherRealignedMolecules,
		setOtherRealignedRepRefs,
		setOtherRealignedStructRefs,
	};
}

/**
 * Generates props for the MolstarContainer component.
 * @param props - The input props required to generate the MolstarContainer props.
 * @returns An object containing the props for the MolstarContainer component.
 */
export function getMolstarContainerProps({
	viewer,
	pluginRef,
	setViewerWrapper,
	setViewerReady
}: {
	viewer: any,
	pluginRef: any,
	setViewerWrapper: (viewer: any) => void,
	setViewerReady: (ready: boolean) => void
}) {
	return {
		ref: pluginRef,
		viewerKey: viewer.viewerKey,
		setViewer: setViewerWrapper,
		onMouseDown: () => setViewerWrapper(viewer.viewerKey),
		onReady: () => setViewerReady(true),
	};
}

/**
 * Define the props for the ViewerColumn component
 * @typedef {Object} ViewerColumnProps
 * @property {ViewerKey} viewerKey - Unique key for the viewer column (e.g., 'A' or 'B').
 * @property {Object} loadDataRowProps - Props to pass to the LoadDataRow component.
 * @property {Object} moleculeUIAlignedToProps - Props to pass to the MoleculeUI component for the aligned-to molecule.
 * @property {Object} moleculeUIAlignedProps - Props to pass to the MoleculeUI component for the aligned molecule.
 * @property {Object} realignedMoleculeListProps - Props to pass to the RealignedMoleculeList component.
 * @property {Object} molstarContainerProps - Props to pass to the MolstarContainer component.
 */
interface ViewerColumnProps {
  viewerKey: ViewerKey;
  loadDataRowProps: any;
  moleculeUIAlignedToProps: any;
  moleculeUIAlignedProps: any;
  realignedMoleculeListProps: any;
  molstarContainerProps: any;
}

/**
 * A column in the viewer that contains the LoadDataRow, MoleculeUI, RealignedMoleculeList, and MolstarContainer components.
 * @param {ViewerColumnProps} props - The props for the ViewerColumn component.
 * @returns {JSX.Element} The ViewerColumn component. 
 */
const ViewerColumn: React.FC<ViewerColumnProps> = ({
  viewerKey,
  loadDataRowProps,
  moleculeUIAlignedToProps,
  moleculeUIAlignedProps,
  realignedMoleculeListProps,
  molstarContainerProps,
}) => {
  return (
    <div className="Column">
      <LoadDataRow {...loadDataRowProps} />
      <MoleculeUI {...moleculeUIAlignedToProps} />
      <MoleculeUI {...moleculeUIAlignedProps} />
      <RealignedMoleculeList {...realignedMoleculeListProps} />
      <MolstarContainer {...molstarContainerProps} />
    </div>
  );
};

export default ViewerColumn;
