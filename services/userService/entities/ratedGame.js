class RatedGame {
    constructor({_id,winnerId,loserId,oldEloW,oldEloL,newEloW,newEloL,createdAt}) {
        this.id = _id;
        this.winnerId = winnerId;
        this.loserId = loserId;
        this.oldEloW = oldEloW;
        this.oldEloL = oldEloL;
        this.newEloW = newEloW;
        this.newEloL = newEloL;
        this.createdAt = createdAt;
    }

    static builder(document){
        if(!document){
            return null;
        }
        return new RatedGame({
            _id: document.id,
            winnerId:document.winnerId,
            loserId:document.loserId,
            oldEloW:document.oldEloW,
            oldEloL:document.oldEloL,
            newEloW:document.newEloW,
            newEloL:document.newEloL,
            createdAt:document.createdAt,
        });
    }
}
