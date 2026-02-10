const {getDb} = require('./mongo')
const hash = require("js-sha256")
const {readJsonBody,sendJson} = require('../helpers/parser');
let db;
async function register(req, res) {
    try {
        const {username, password} = await readJsonBody(req);
        if (!username || !password) {
            return sendJson(res, 401, {ok: false, error: 'MISSING_FIELDS'})
        }
        db = await getDb();
        console.log("Coucou")
        console.log(db);
        const users = db.collection("users");
        const existing = users.findOne({username: username});
        if (existing) {
            return sendJson(res, 401, {ok: false, error: 'ALREADY_EXISTS'});
        }
        const hashedPassword = await hash(password);
        const result = users.insertOne({username: username, password: hashedPassword});
        return sendJson(res, 200, result);
    }
    catch (error) {
        console.log(error)
        return sendJson(res, 401, {ok: false, error: error});
    }
    finally {
        await db.close();
    }
}

async function login(req, res) {

}

module.exports = {register,login}
