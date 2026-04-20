import * as dataUtils from './data';

describe('data.ts utility functions', () => {
    let originalLog: any;
    beforeAll(() => {
        originalLog = console.log;
        console.log = jest.fn();
    });
    afterAll(() => {
        console.log = originalLog;
    });

    describe('getAtomDataFromStructureUnits', () => {
        it('returns empty arrays for undefined structure', () => {
            const result = dataUtils.getAtomDataFromStructureUnits(undefined);
            expect(result).toEqual({ symbolTypes: [], chainIds: [], xs: [], ys: [], zs: [] });
        });

        it('extracts atom data from mock structure', () => {
            const mockStructure = {
                data: {
                    units: [
                        {
                            kind: 0,
                            model: {
                                atomicHierarchy: {
                                    atoms: {
                                        type_symbol: { value: (i: number) => ['C', 'N'][i] }
                                    },
                                    chains: {
                                        auth_asym_id: { value: (i: number) => ['A', 'B'][i] },
                                        _rowCount: 2
                                    }
                                },
                                atomicConformation: {
                                    x: [1, 2],
                                    y: [3, 4],
                                    z: [5, 6]
                                }
                            },
                            elements: [0, 1],
                            chainIndex: [0, 1]
                        }
                    ]
                }
            };
            const result = dataUtils.getAtomDataFromStructureUnits(mockStructure);
            expect(result.symbolTypes).toEqual(['C', 'N']);
            expect(result.chainIds).toEqual(['A', 'B']);
            expect(result.xs).toEqual([1, 2]);
            expect(result.ys).toEqual([3, 4]);
            expect(result.zs).toEqual([5, 6]);
        });
    });

    describe('updateAndLogAtomCoordinates', () => {
        it('recenters and rotates atom coordinates and logs output', () => {
            const model = {
                atomicConformation: {
                    x: [1, 2, 3],
                    y: [4, 5, 6],
                    z: [7, 8, 9]
                }
            };
            const centroid = [1, 4, 7];
            const rotmat = [1,0,0, 0,1,0, 0,0,1]; // Identity
            dataUtils.updateAndLogAtomCoordinates(model, centroid, rotmat);
            expect(model.atomicConformation.x).toEqual([0, 1, 2]);
            expect(model.atomicConformation.y).toEqual([0, 1, 2]);
            expect(model.atomicConformation.z).toEqual([0, 1, 2]);
            expect(console.log).toHaveBeenCalledWith('Atom coordinates updated.');
        });
    });
});
