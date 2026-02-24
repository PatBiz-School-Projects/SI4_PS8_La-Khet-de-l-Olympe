/**
 * @enum {typeof LaserDirection[keyof typeof LaserDirection]}
 */
const LaserDirection = Object.freeze({
    N: "N",
    E: "E",
    S: "S",
    W: "W",
});


class LaserImpact {
    static reflect(outDir) { return { type: "reflect", outDir }; }
    static absorb() { return { type: "absorb" }; }
    static destroy() { return { type: "destroy" }; }
}

module.exports = {
    LaserDirection,
    LaserImpact,
};
