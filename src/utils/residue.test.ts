import { getResidueInfo } from './residue';

describe('getResidueInfo', () => {
    let originalWarn: any;
    let originalInfo: any;
    beforeAll(() => {
        originalWarn = console.warn;
        originalInfo = console.info;
        console.warn = jest.fn();
        console.info = jest.fn();
    });
    afterAll(() => {
        console.warn = originalWarn;
        console.info = originalInfo;
    });

    it('returns empty maps and warns if no units', () => {
        const structure = { units: [] };
        const result = getResidueInfo(structure, 'A');
        expect(result.residueLabels.size).toBe(0);
        expect(Object.keys(result.residueToAtomIds).length).toBe(0);
        expect(console.warn).toHaveBeenCalledWith('No units found in structure.');
    });

    it('returns empty maps and warns if no atomic unit with model', () => {
        const structure = { units: [{ kind: 1 }] };
        const result = getResidueInfo(structure, 'A');
        expect(result.residueLabels.size).toBe(0);
        expect(Object.keys(result.residueToAtomIds).length).toBe(0);
        expect(console.warn).toHaveBeenCalledWith('No atomic unit with model found in molecule.units.');
    });

    it('returns empty maps and warns if chainId not found', () => {
        const structure = {
            units: [{ kind: 0, model: { atomicHierarchy: { chains: { auth_asym_id: { value: (i: number) => 'B' }, _rowCount: 1 }, residues: {} } } }]
        };
        const result = getResidueInfo(structure, 'A');
        expect(result.residueLabels.size).toBe(0);
        expect(Object.keys(result.residueToAtomIds).length).toBe(0);
        expect(console.warn).toHaveBeenCalledWith('Chain ID not found in model.atomicHierarchy.chains:', 'A');
    });

    it('extracts residue info for valid structure', () => {
        // The chainIndex for atomIdx 5 must match the chainIdx found for chainId 'A' (which is 0)
        const structure = {
            units: [
                {
                    kind: 0,
                    model: {
                        atomicHierarchy: {
                            chains: {
                                auth_asym_id: { value: (i: number) => ['A'][i] },
                                _rowCount: 1
                            },
                            residues: {
                                auth_seq_id: { value: (i: number) => [10][i] },
                                label_comp_id: { value: (i: number) => ['GLY'][i] },
                                label_seq_id: { value: (i: number) => [10][i] },
                                auth_comp_id: { value: (i: number) => ['GLY'][i] },
                                group_PDB: { value: (i: number) => ['GLY'][i] },
                                pdbx_PDB_ins_code: { value: (i: number) => [''][i] }
                            }
                        }
                    },
                    chainIndex: { 5: 0 }, // atomIdx 5 belongs to chainIdx 0
                    residueIndex: { 5: 0 },
                    elements: [5]
                }
            ]
        };
        const result = getResidueInfo(structure, 'A');
        expect(result.residueLabels.size).toBe(1);
        const labelInfo = result.residueLabels.get('10');
        expect(labelInfo).toEqual({
            id: '10',
            name: 'GLY 10',
            compId: 'GLY',
            seqNumber: 10,
            insCode: ''
        });
        expect(result.residueToAtomIds['10']).toEqual(['5']);
        expect(console.info).toHaveBeenCalledWith('[getResidueInfo] residueLabels:', expect.any(Map));
        expect(console.info).toHaveBeenCalledWith('[getResidueInfo] residueToAtomIds:', expect.any(Object));
    });
});
