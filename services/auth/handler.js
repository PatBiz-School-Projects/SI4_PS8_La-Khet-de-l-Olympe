const getDb = require('./mongo')
const hash = require('./sha256')
const {readJsonBody,sendJson} = require('./parser')

async function register(req, res) {
    try {
        const {username, password} = readJsonBody(req);

        if (!username || !password) {
            return sendJson(res, 401, {ok: false, error: 'MISSING_FIELDS'})
        }
        const db = await getDb();
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
        return sendJson(res, 401, {ok: false, error: error});
    }
    finally {
        db.close();
    }
}

async function login(req, res) {

}

module.exports = {register,login}
