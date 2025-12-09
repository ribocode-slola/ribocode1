import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { Asset } from 'molstar/lib/mol-util/assets';
//import { Viewer } from 'molstar/lib/apps/viewer/app';

export async function loadMoleculeToViewer(viewer: PluginUIContext, molecule: { id: string; url: string }) {
    const data = await viewer.builders.data.download(
        { url: molecule.url },
        { state: { isGhost: true } }
    );
    if (!data) return;
    const trajectory = await viewer.builders.structure.parseTrajectory(data, 'mmcif');
    const model = await viewer.builders.structure.createModel(trajectory);
    const structure = await viewer.builders.structure.createStructure(model);
    await viewer.builders.structure.hierarchy.applyPreset(trajectory, 'default');
    return structure;
}

export async function loadMoleculeFileToViewer(viewer: PluginUIContext, file: Asset.File) {
    const data = await viewer.builders.data.readFile(
        { file, label: file.name },
        { state: { isGhost: true } }
    );
    if (!data) return;
    const trajectory = await viewer.builders.structure.parseTrajectory(data.data, 'mmcif');
    const model = await viewer.builders.structure.createModel(trajectory);
    const structure = await viewer.builders.structure.createStructure(model);
    await viewer.builders.structure.hierarchy.applyPreset(trajectory, 'default');
    return structure;
}