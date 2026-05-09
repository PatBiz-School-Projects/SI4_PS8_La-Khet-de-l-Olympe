const hash = require("js-sha256");

const { getDb } = require("./mongo");

async function ensureDefaultUser(db = null) {
    const enabled = (process.env.DEFAULT_USER_ENABLED ?? "true").toLowerCase() === "true";
    if (!enabled) {
        return;
    }

    const username = process.env.DEFAULT_USER_USERNAME || "demo";
    const password = process.env.DEFAULT_USER_PASSWORD || "demo";
    const question = process.env.DEFAULT_USER_QUESTION || "What is your favorite color?";
    const answer = process.env.DEFAULT_USER_ANSWER || "blue";

    const targetDb = db || await getDb();
    const users = targetDb.collection("users");
    const questions = targetDb.collection("questions");

    const hashedPassword = hash(password);

    const existingUser = await users.findOne({ username });
    if (!existingUser) {
        const result = await users.insertOne({ username, password: hashedPassword });
        await questions.updateOne(
            { userId: result.insertedId },
            { $set: { question, answer } },
            { upsert: true },
        );

        console.log(`[auth bootstrap] Created default user '${username}'.`);
        return;
    }

    await users.updateOne(
        { _id: existingUser._id },
        { $set: { password: hashedPassword } },
    );
    await questions.updateOne(
        { userId: existingUser._id },
        { $set: { question, answer } },
        { upsert: true },
    );

    console.log(`[auth bootstrap] Updated default user '${username}'.`);
}

module.exports = { ensureDefaultUser };
