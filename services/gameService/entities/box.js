import {Pyramid} from "./piece";

class Box{
    constructor(owner){
        this.owner = owner;
        this.pieces = [];
        for(let i=0; i<7; i++){
            pieces.push(new Pyramid(owner,null,null,null,true))
        }
    }

    addPyramid(pyramid){
        this.pieces.push(pyramid);
    }
    removePyramid(pyramid){
        //maybe we should add an id for the pieces
    }
}