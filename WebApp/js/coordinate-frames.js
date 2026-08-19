// ══════════════════════════════════════════════════════════════════════════════
// QiblaAstro — Coordinate Frames
// Pure vector and rotation-matrix mathematics for the astronomical solver.
// © 2026 Mohamed SG Behairy — All Rights Reserved.
// ══════════════════════════════════════════════════════════════════════════════

(function (root, factory) {
    'use strict';

    var api = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.QiblaCoordinateFrames = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    var EPSILON = 1e-10;

    function isFiniteNumber(value) {
        return typeof value === 'number' && Number.isFinite(value);
    }

    function assertVector(vector, name) {
        var label = name || 'vector';
        if (!vector ||
            !isFiniteNumber(vector.x) ||
            !isFiniteNumber(vector.y) ||
            !isFiniteNumber(vector.z)) {
            throw new TypeError(label + ' must contain finite x, y and z values.');
        }
    }

    function assertMatrix(matrix, name) {
        var label = name || 'matrix';
        if (!Array.isArray(matrix) || matrix.length !== 3) {
            throw new TypeError(label + ' must be a 3x3 matrix.');
        }

        for (var row = 0; row < 3; row++) {
            if (!Array.isArray(matrix[row]) || matrix[row].length !== 3) {
                throw new TypeError(label + ' must be a 3x3 matrix.');
            }
            for (var column = 0; column < 3; column++) {
                if (!isFiniteNumber(matrix[row][column])) {
                    throw new TypeError(label + ' must contain finite numbers.');
                }
            }
        }
    }

    function vector(x, y, z) {
        if (!isFiniteNumber(x) || !isFiniteNumber(y) || !isFiniteNumber(z)) {
            throw new TypeError('Vector components must be finite numbers.');
        }
        return { x: x, y: y, z: z };
    }

    function clone(input) {
        assertVector(input, 'input');
        return vector(input.x, input.y, input.z);
    }

    function add(a, b) {
        assertVector(a, 'a');
        assertVector(b, 'b');
        return vector(a.x + b.x, a.y + b.y, a.z + b.z);
    }

    function subtract(a, b) {
        assertVector(a, 'a');
        assertVector(b, 'b');
        return vector(a.x - b.x, a.y - b.y, a.z - b.z);
    }

    function scale(input, scalar) {
        assertVector(input, 'input');
        if (!isFiniteNumber(scalar)) {
            throw new TypeError('scalar must be a finite number.');
        }
        return vector(input.x * scalar, input.y * scalar, input.z * scalar);
    }

    function dot(a, b) {
        assertVector(a, 'a');
        assertVector(b, 'b');
        return a.x * b.x + a.y * b.y + a.z * b.z;
    }

    function cross(a, b) {
        assertVector(a, 'a');
        assertVector(b, 'b');
        return vector(
            a.y * b.z - a.z * b.y,
            a.z * b.x - a.x * b.z,
            a.x * b.y - a.y * b.x
        );
    }

    function magnitudeSquared(input) {
        assertVector(input, 'input');
        return dot(input, input);
    }

    function magnitude(input) {
        return Math.sqrt(magnitudeSquared(input));
    }

    function normalize(input, epsilon) {
        assertVector(input, 'input');
        var tolerance = isFiniteNumber(epsilon) ? Math.abs(epsilon) : EPSILON;
        var length = magnitude(input);
        if (length <= tolerance) {
            throw new RangeError('Cannot normalize a zero-length or near-zero vector.');
        }
        return scale(input, 1 / length);
    }

    function negate(input) {
        return scale(input, -1);
    }

    function angleBetween(a, b) {
        var unitA = normalize(a);
        var unitB = normalize(b);
        var cosine = Math.max(-1, Math.min(1, dot(unitA, unitB)));
        return Math.acos(cosine);
    }

    function projectOnto(input, axis) {
        assertVector(input, 'input');
        var unitAxis = normalize(axis);
        return scale(unitAxis, dot(input, unitAxis));
    }

    function rejectFrom(input, axis) {
        return subtract(input, projectOnto(input, axis));
    }

    function nearlyEqual(a, b, tolerance) {
        var limit = isFiniteNumber(tolerance) ? Math.abs(tolerance) : 1e-8;
        return Math.abs(a - b) <= limit;
    }

    function vectorsNearlyEqual(a, b, tolerance) {
        assertVector(a, 'a');
        assertVector(b, 'b');
        return nearlyEqual(a.x, b.x, tolerance) &&
            nearlyEqual(a.y, b.y, tolerance) &&
            nearlyEqual(a.z, b.z, tolerance);
    }

    function identityMatrix() {
        return [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
        ];
    }

    function matrixFromColumns(columnX, columnY, columnZ) {
        assertVector(columnX, 'columnX');
        assertVector(columnY, 'columnY');
        assertVector(columnZ, 'columnZ');
        return [
            [columnX.x, columnY.x, columnZ.x],
            [columnX.y, columnY.y, columnZ.y],
            [columnX.z, columnY.z, columnZ.z]
        ];
    }

    function transpose(matrix) {
        assertMatrix(matrix, 'matrix');
        return [
            [matrix[0][0], matrix[1][0], matrix[2][0]],
            [matrix[0][1], matrix[1][1], matrix[2][1]],
            [matrix[0][2], matrix[1][2], matrix[2][2]]
        ];
    }

    function multiplyMatrices(a, b) {
        assertMatrix(a, 'a');
        assertMatrix(b, 'b');
        var result = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];

        for (var row = 0; row < 3; row++) {
            for (var column = 0; column < 3; column++) {
                result[row][column] =
                    a[row][0] * b[0][column] +
                    a[row][1] * b[1][column] +
                    a[row][2] * b[2][column];
            }
        }
        return result;
    }

    function multiplyMatrixVector(matrix, input) {
        assertMatrix(matrix, 'matrix');
        assertVector(input, 'input');
        return vector(
            matrix[0][0] * input.x + matrix[0][1] * input.y + matrix[0][2] * input.z,
            matrix[1][0] * input.x + matrix[1][1] * input.y + matrix[1][2] * input.z,
            matrix[2][0] * input.x + matrix[2][1] * input.y + matrix[2][2] * input.z
        );
    }

    function determinant(matrix) {
        assertMatrix(matrix, 'matrix');
        return matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) -
            matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) +
            matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0]);
    }

    function buildOrthonormalFrame(primary, reference, options) {
        var opts = options || {};
        var epsilon = isFiniteNumber(opts.epsilon) ? Math.abs(opts.epsilon) : EPSILON;
        var primaryAxis = normalize(primary, epsilon);
        var referenceRejection = rejectFrom(reference, primaryAxis);

        if (magnitude(referenceRejection) <= epsilon) {
            throw new RangeError('primary and reference vectors are parallel or nearly parallel.');
        }

        var secondaryAxis = normalize(referenceRejection, epsilon);
        var tertiaryAxis = normalize(cross(primaryAxis, secondaryAxis), epsilon);

        secondaryAxis = normalize(cross(tertiaryAxis, primaryAxis), epsilon);

        return {
            primary: primaryAxis,
            secondary: secondaryAxis,
            tertiary: tertiaryAxis,
            matrix: matrixFromColumns(primaryAxis, secondaryAxis, tertiaryAxis)
        };
    }

    function rotationBetweenFrames(sourceFrame, targetFrame) {
        if (!sourceFrame || !targetFrame) {
            throw new TypeError('sourceFrame and targetFrame are required.');
        }
        assertMatrix(sourceFrame.matrix, 'sourceFrame.matrix');
        assertMatrix(targetFrame.matrix, 'targetFrame.matrix');
        return multiplyMatrices(targetFrame.matrix, transpose(sourceFrame.matrix));
    }

    function isOrthonormalMatrix(matrix, tolerance) {
        assertMatrix(matrix, 'matrix');
        var limit = isFiniteNumber(tolerance) ? Math.abs(tolerance) : 1e-8;
        var product = multiplyMatrices(transpose(matrix), matrix);
        var identity = identityMatrix();

        for (var row = 0; row < 3; row++) {
            for (var column = 0; column < 3; column++) {
                if (!nearlyEqual(product[row][column], identity[row][column], limit)) {
                    return false;
                }
            }
        }
        return nearlyEqual(determinant(matrix), 1, limit * 10);
    }

    function runSelfTests(logger) {
        var output = logger || (typeof console !== 'undefined' ? console : null);
        var passed = 0;
        var failed = 0;
        var failures = [];

        function assert(name, condition) {
            if (condition) {
                passed++;
                if (output && output.log) output.log('PASS:', name);
            } else {
                failed++;
                failures.push(name);
                if (output && output.error) output.error('FAIL:', name);
            }
        }

        var xAxis = vector(1, 0, 0);
        var yAxis = vector(0, 1, 0);
        var zAxis = vector(0, 0, 1);

        assert('dot of perpendicular vectors is zero', nearlyEqual(dot(xAxis, yAxis), 0));
        assert('cross x by y gives z', vectorsNearlyEqual(cross(xAxis, yAxis), zAxis));
        assert('normalization produces unit length', nearlyEqual(magnitude(normalize(vector(3, 4, 0))), 1));
        assert('projection onto x axis', vectorsNearlyEqual(projectOnto(vector(2, 3, 4), xAxis), vector(2, 0, 0)));
        assert('rejection from x axis', vectorsNearlyEqual(rejectFrom(vector(2, 3, 4), xAxis), vector(0, 3, 4)));
        assert('angle between x and y is 90 degrees', nearlyEqual(angleBetween(xAxis, yAxis), Math.PI / 2));

        var source = buildOrthonormalFrame(xAxis, yAxis);
        var target = buildOrthonormalFrame(yAxis, negate(xAxis));
        var rotation = rotationBetweenFrames(source, target);

        assert('source frame is orthonormal', isOrthonormalMatrix(source.matrix));
        assert('target frame is orthonormal', isOrthonormalMatrix(target.matrix));
        assert('rotation matrix is orthonormal', isOrthonormalMatrix(rotation));
        assert('rotation maps source primary to target primary',
            vectorsNearlyEqual(multiplyMatrixVector(rotation, source.primary), target.primary));
        assert('rotation maps source secondary to target secondary',
            vectorsNearlyEqual(multiplyMatrixVector(rotation, source.secondary), target.secondary));

        var parallelRejected = false;
        try {
            buildOrthonormalFrame(xAxis, vector(2, 0, 0));
        } catch (error) {
            parallelRejected = error instanceof RangeError;
        }
        assert('parallel reference vectors are rejected', parallelRejected);

        return {
            passed: passed,
            failed: failed,
            success: failed === 0,
            failures: failures
        };
    }

    return Object.freeze({
        EPSILON: EPSILON,
        vector: vector,
        clone: clone,
        add: add,
        subtract: subtract,
        scale: scale,
        negate: negate,
        dot: dot,
        cross: cross,
        magnitude: magnitude,
        magnitudeSquared: magnitudeSquared,
        normalize: normalize,
        angleBetween: angleBetween,
        projectOnto: projectOnto,
        rejectFrom: rejectFrom,
        nearlyEqual: nearlyEqual,
        vectorsNearlyEqual: vectorsNearlyEqual,
        identityMatrix: identityMatrix,
        matrixFromColumns: matrixFromColumns,
        transpose: transpose,
        multiplyMatrices: multiplyMatrices,
        multiplyMatrixVector: multiplyMatrixVector,
        determinant: determinant,
        buildOrthonormalFrame: buildOrthonormalFrame,
        rotationBetweenFrames: rotationBetweenFrames,
        isOrthonormalMatrix: isOrthonormalMatrix,
        runSelfTests: runSelfTests
    });
});
