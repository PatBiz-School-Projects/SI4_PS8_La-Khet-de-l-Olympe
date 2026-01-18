const Board = require('./entities/board');
const BoardManager = require('./manager/boardManager')

const boardManager = new BoardManager();

const routes = {
    '/api/init-board': (req, res) => {boardManager.initBoard(req, res)}
};

function manage(request,response){
    const url = request.url;
    if(routes[url]){
        routes[url](request, response);
    }
    else{
        response.writeHead(404, {'Content-Type': 'text/plain'});
        response.end(JSON.stringify({error: 'Not Found'}));
    }
}

module.exports = {manage};