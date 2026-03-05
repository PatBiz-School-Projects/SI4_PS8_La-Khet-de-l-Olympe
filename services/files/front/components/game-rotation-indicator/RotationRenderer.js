export class RotationRenderer {
    constructor(rotationDiv) {
        this.canvas = rotationDiv.querySelector("#piece-canvas");
        this.imageCache = {};
    }

    async drawPiece(piece){
        const ctx = this.canvas.getContext("2d");
        const size = this.canvas.clientHeight;
        this.canvas.width = size;
        this.canvas.height = size;

        ctx.clearRect(0, 0, size, size);

        const angleMap = {
            N:  0,
            W: -Math.PI / 2,
            E:  Math.PI / 2,
            S:  Math.PI,
        };

        const img = await this.getImage(piece.image);

        ctx.save();
        ctx.translate(size / 2, size / 2);
        ctx.rotate(angleMap[piece.orientation] || 0);

        const drawSize = size * 0.65;
        ctx.drawImage(img, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
        ctx.restore();
    }

    async getImage(src) {
        let img = this.imageCache[src];
        if (img !== undefined) return img;

        img = new Image();
        this.imageCache[src] = img;

        return new Promise((resolve, reject) => {
            img.onload  = () => resolve(img);
            img.onerror = () => {
                delete this.imageCache[src];
                reject(new Error(`Failed to load image: ${src}`));
            };
            img.src = src;
        });
    }

    async drawRotationIndicator(piece) {
        await this.clearPiecesCanvas();
        await this.drawPiece(piece);
    }

    async clearPiecesCanvas() {
        const ctx = this.canvas.getContext("2d");
        ctx.clearRect(0, 0, ctx.width, ctx.height);
    }
}