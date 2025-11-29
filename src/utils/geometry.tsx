import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { Vec3 } from 'molstar/lib/mol-math/linear-algebra/3d/vec3';
//import * as Mat4Module from 'molstar/lib/mol-math/linear-algebra/3d/mat4';
//const Mat4 = Mat4Module.Mat4;
//import type { Mat4 as Mat4Type } from 'molstar/lib/mol-math/linear-algebra/3d/mat4';
import { Mat4 } from 'molstar/lib/mol-math/linear-algebra';
import { StructureElement } from 'molstar/lib/mol-model/structure';
//import * as OrderedSetModule from 'molstar/lib/mol-data/int/ordered-set';
//const OrderedSet = OrderedSetModule.OrderedSet; // Use this instead of 'mol-data/int'
import { OrderedSet } from 'molstar/lib/mol-data/int';

function computeKabschMatrix(positionsA: Vec3[], positionsB: Vec3[]): Mat4 {
    const n = positionsA.length;

    // Step 1: Compute centroids
    const centroidA = Vec3.zero();
    const centroidB = Vec3.zero();
    for (let i = 0; i < n; i++) {
        Vec3.add(centroidA, centroidA, positionsA[i]);
        Vec3.add(centroidB, centroidB, positionsB[i]);
    }
    Vec3.scale(centroidA, centroidA, 1 / n);
    Vec3.scale(centroidB, centroidB, 1 / n);

    // Step 2: Center the points
    const centeredA = positionsA.map(pos => Vec3.sub(Vec3.zero(), pos, centroidA));
    const centeredB = positionsB.map(pos => Vec3.sub(Vec3.zero(), pos, centroidB));

    // Step 3: Compute covariance matrix
    const covariance = Mat4.zero();
    for (let i = 0; i < n; i++) {
        const a = centeredA[i];
        const b = centeredB[i];
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                covariance[row * 4 + col] += a[row] * b[col];
            }
        }
    }

    // Step 4: Perform SVD (use an external library or implement manually)
    const { U, S, V } = performSVD(covariance); // Replace with actual SVD implementation

    // Step 5: Compute rotation matrix
    const rotation = Mat4.zero();
    Mat4.mul(rotation, V, Mat4.transpose(Mat4.zero(), U));

    // Ensure positive determinant
    if (Mat4.determinant(rotation) < 0) {
        for (let i = 0; i < 3; i++) {
            V[i * 4 + 2] *= -1;
        }
        Mat4.mul(rotation, V, Mat4.transpose(Mat4.zero(), U));
    }

    // Step 6: Construct transformation matrix
    const transformation = Mat4.identity();
    Mat4.setTranslation(transformation, Vec3.sub(Vec3.zero(), centroidB, Vec3.transformMat4(Vec3.zero(), centroidA, rotation)));
    Mat4.mul(transformation, transformation, rotation);

    return transformation;
}

// Placeholder for SVD function
function performSVD(matrix: Mat4): { U: Mat4; S: number[]; V: Mat4 } {
    // Implement or use an external library for SVD
    throw new Error('SVD implementation required');
}

const alignMolecules = async (plugin: PluginContext, structureA: StructureElement.Loci, structureB: StructureElement.Loci) => {
    // Extract atomic positions from the structures
    const positionsA: Vec3[] = [];
    const positionsB: Vec3[] = [];

    // Iterate over elements in structureA
    for (const elementA of structureA.elements) {
        const unitA = elementA.unit;
        OrderedSet.forEach(elementA.indices, (unitIndex) => {
            const elementIndex = unitA.elements[unitIndex]; // Convert UnitIndex to ElementIndex
            const positionA = Vec3.zero(); // Create an output vector
            unitA.conformation.position(elementIndex, positionA); // Pass the ElementIndex and output vector
            positionsA.push(positionA);
        });
    }

    // Iterate over elements in structureB
    for (const elementB of structureB.elements) {
        const unitB = elementB.unit;
        OrderedSet.forEach(elementB.indices, (unitIndex) => {
            const elementIndex = unitB.elements[unitIndex]; // Convert UnitIndex to ElementIndex
            const positionB = Vec3.zero(); // Create an output vector
            unitB.conformation.position(elementIndex, positionB); // Pass the ElementIndex and output vector
            positionsB.push(positionB);
        });
    }

    if (positionsA.length !== positionsB.length) {
        console.error('Structures must have the same number of atoms for alignment.');
        return;
    }

    // Compute the alignment matrix using Kabsch algorithm
    const alignmentMatrix = computeKabschMatrix(positionsA, positionsB);

    // Apply the transformation to structureB
    const transformedPositionsB = positionsB.map(pos => Vec3.transformMat4(Vec3.zero(), pos, alignmentMatrix));

    // Update viewerB
    console.log(plugin.managers.structure.hierarchy);

    
    console.log('Molecules aligned successfully.');
};