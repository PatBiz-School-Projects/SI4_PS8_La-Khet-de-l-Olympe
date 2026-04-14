const { Router } = require("./helpers/router");

const { HTTPHandler } = require('./handler.js');


const ROUTER = (new Router()
    .add("/api/auth/login", {
        POST: HTTPHandler.login,
    })
    .add("/api/auth/signup", {
        POST: HTTPHandler.signup,
    })
    .add("/api/auth/renew", {
        POST: HTTPHandler.renewToken,
    })
    .add("/api/auth/check", {
        POST: HTTPHandler.checkToken,
    })
    .add("/api/auth/forgot-password", {
        POST: HTTPHandler.resetPassword,
    })
    .add("/api/auth/forgot-password/question", {
        POST: HTTPHandler.getQuestion,
    })
    .add("/api/auth/logout", {
        POST: HTTPHandler.logout,
    })
);


async function manage(req, res){
    ROUTER.handle(req, res);
}


module.exports = { manage };
