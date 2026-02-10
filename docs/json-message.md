## Appel de méthode de game-service


- Pour échanger un scarab à l'endpoint : '/api/game-service/action'
    ```json
    {
        method: "switch", 
        args: {
            "fromX" : number,
            "fromY" : number,
            "toX" : number,
            "toY" : number
        }
    }
    ```

- Pour déplacer une pièce qui peut bouger à l'endpoint : '/api/game-service/action'
    ```json
    {
        method: "move", 
        args: {
            "fromX" : number,
            "fromY" : number,
            "toX" : number,
            "toY" : number
        }
    }
    ```

- Pour faire tourner une pièce qui peut rotater à l'endpoint : '/api/game-service/action'
    ```json
    {
        method: "rotate", 
        args: {
            "x" : number,
            "y" : number,
            "orientation" : "N" | "E" | "S" | "W"
        }
    }
    ```

- Pour placer une pièce depuis la réserve : '/api/game-service/action'
    ```json
    {
        method: "place", 
        args: {
            "type" : "Scarab" | "Sphinx" | "Pharaoh" | "Pyramid" | "Anubis",
            "owner" : 1 | 2,
            "orientation" : "N" | "E" | "S" | "W"
        }
    }
    ```

