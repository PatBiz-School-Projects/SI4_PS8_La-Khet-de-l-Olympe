const MongoClient = require("mongodb")

const mongoUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017';
const dbName = process.env.DB_NAME || 'ps8';

let client;
let db;

async function run(){
    if(db){
        return db;
    }
    client = new MongoClient(mongoUrl);
    await client.connect();
    db = client.db(dbName);
    return db;
}

module.exports = run;