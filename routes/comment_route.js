module.exports = function addCommentRoute(server,client) {
    server.on("request", (request,response) => {
        if (request.method ==="POST" && request.url.startsWith("/image-description")) {
            let decodedData;
            request.on("data",(dataChunk) => {
                decodedData = decodeURIComponent(dataChunk.toString())
            })
            request.on("end",async ()=>{
                let commentaire = decodedData.split("=")[1]
                commentaire = commentaire.replace(/\+/g," ")
                commentaire = commentaire.replace(/\'/g, "''");
    
                sqlQueryPostComment =`INSERT INTO commentaire (texte,id_image) VALUES ('${commentaire}',${request.url.split("description")[1]});`
                await client.query(sqlQueryPostComment);
                
                response.statusCode = 302;
                response.setHeader('Location', '/page-image/image' + request.url.split("description")[1]);
                response.end();
    
            })
        }
    })
}