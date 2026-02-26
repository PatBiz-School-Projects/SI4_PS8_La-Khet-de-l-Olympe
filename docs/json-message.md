## Types de donné définis

- `PlayerID`: alias de `string`
- `PieceDTO`:
    ```json
    {
        type: "Scarab" | "Sphinx" | "Pharaoh" | "Pyramid" | "Anubis",
        owner: string,
        orientation: "N" | "E" | "W" | "S"
    }
    ```
- `Coord`:
    ```json
    {
        x: number,
        y: number,
    }
    ```


## Appel de méthode du game-service

- Pour échanger un scarab à l'endpoint : '/api/game-service/action'
    ```json
    {
        method: "switch",
        args: {
            playerId: PlayerID,
            piece1: PieceDTO,
            pos1: Coord,
            piece2: PieceDTO,
            pos2: Coord,
        }
    }
    ```

- Pour déplacer une pièce qui peut bouger à l'endpoint : '/api/game-service/action'
    ```json
    {
        method: "move",
        args: {
            playerId: PlayerID,
            piece: PieceDTO,
            from: Coord,
            to: Coord,
        }
    }
    ```

- Pour faire tourner une pièce qui peut rotater à l'endpoint : '/api/game-service/action'
    ```json
    {
        method: "rotate",
        args: {
            playerId: PlayerID,
            piece: PieceDTO,
            pos: Coord,
            rotation : "left" | "right",
        }
    }
    ```

- Pour placer une pièce depuis la réserve : '/api/game-service/action'
    ```json
    {
        method: "place",
        args: {
            playerID: PlayerID,
            piece: PieceDTO,
            pos: Coord,
        }
    }
    ```
