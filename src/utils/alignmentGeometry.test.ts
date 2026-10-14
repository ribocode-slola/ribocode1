import { alignDataset, alignDatasetsGeneral } from 'molstar/lib/extensions/ribocode/utils/geometry';

describe('alignment geometry centroid mapping', () => {
    it('returns moving centroid as centroid and reference centroid as centroidReference for equal selected counts', () => {
        const moving = [
            { type: 'P', x: 10, y: 0, z: 0 },
            { type: 'P', x: 12, y: 2, z: 0 },
            { type: 'P', x: 11, y: 1, z: 2 },
        ];
        const reference = [
            { type: 'P', x: 0, y: 0, z: 0 },
            { type: 'P', x: 2, y: 2, z: 0 },
            { type: 'P', x: 1, y: 1, z: 2 },
        ];

        const result = alignDatasetsGeneral(moving, reference, (atom) => atom.type === 'P');

        expect(result.centroid[0]).toBeCloseTo(11, 7);
        expect(result.centroid[1]).toBeCloseTo(1, 7);
        expect(result.centroid[2]).toBeCloseTo(2 / 3, 7);

        expect(result.centroidReference[0]).toBeCloseTo(1, 7);
        expect(result.centroidReference[1]).toBeCloseTo(1, 7);
        expect(result.centroidReference[2]).toBeCloseTo(2 / 3, 7);
    });

    it('falls back to a shared atom type when selected atom type is missing', () => {
        const movingTypes = ['CA', 'CA', 'CA', 'CA'];
        const movingX = [11, 12, 11, 11];
        const movingY = [20, 20, 21, 20];
        const movingZ = [30, 30, 30, 31];

        const referenceTypes = ['CA', 'CA', 'CA', 'CA'];
        const referenceX = [1, 2, 1, 1];
        const referenceY = [0, 0, 1, 0];
        const referenceZ = [0, 0, 0, 1];

        // alignDataset defaults to selectedAtomTypes { P: true }, which previously threw
        // if no phosphorus atoms were present. Fallback should now select shared CA atoms.
        const result = alignDataset(
            movingTypes,
            movingX,
            movingY,
            movingZ,
            referenceTypes,
            referenceX,
            referenceY,
            referenceZ
        );

        expect(result.alignedX[0]).toBeCloseTo(referenceX[0], 5);
        expect(result.alignedY[0]).toBeCloseTo(referenceY[0], 5);
        expect(result.alignedZ[0]).toBeCloseTo(referenceZ[0], 5);
    });
});
