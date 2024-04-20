module.exports = function addPublicRoute(server,fs) {
    server.on("request", (request,response) => {
        if (request.url.startsWith("/public/"))  {
            try {
                response.end(fs.readFileSync("." + request.url));
            } catch (e) {
                console.log(e);
                response.statusCode = 404;
                response.end('error');
            }      
        }
    }) 
}