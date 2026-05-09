const {MongoClient} = require("mongodb")

const mongoUrl = process.env.DB_URL;
const dbName = process.env.DB_NAME;

let client;
let db;

async function getDb(){
    if(db){
        return db;
    }
    client = new MongoClient(mongoUrl);
    await client.connect();
    db = client.db(dbName);
    return db;
}

module.exports = {getDb};
