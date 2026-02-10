class LaserImpact {
    static reflect(outDir) { return { type: "reflect", outDir }; }
    static absorb() { return { type: "absorb" }; }
    static destroy() { return { type: "destroy" }; }
}

module.exports = LaserImpact;
