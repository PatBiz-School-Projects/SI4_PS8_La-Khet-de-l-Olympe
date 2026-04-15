const { Router } = require("./helpers/router");
const { public, authenticated } = require("./helpers/middlewares");

const { HTTPHandler } = require('./handler.js');


const ROUTER = (new Router()
    .add("/api/auth/login", {
        POST: public(HTTPHandler.login),
    })
    .add("/api/auth/signup", {
        POST: public(HTTPHandler.signup),
    })
    .add("/api/auth/renew", {
        POST: public(HTTPHandler.renewToken),
    })
    .add("/api/auth/check", {
        POST: public(HTTPHandler.checkToken),
    })
    .add("/api/auth/forgot-password", {
        POST: public(HTTPHandler.resetPassword),
    })
    .add("/api/auth/forgot-password/question", {
        POST: public(HTTPHandler.getQuestion),
    })
    .add("/api/auth/logout", {
        POST: authenticated(HTTPHandler.logout),
    })
);


async function manage(req, res){
    ROUTER.handle(req, res);
}


module.exports = { manage };
