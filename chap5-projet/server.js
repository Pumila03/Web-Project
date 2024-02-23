const { log } = require("console");
const fs = require("fs");
const http = require("http");
const server = http.createServer();
const port = 8080;
let tab = [];


server.on("request", (request,response) => {
    if (request.url === "/style.css") {
        response.end(fs.readFileSync("./public/style.css","utf-8"));
    } else if (request.url === "/images"){
        const images = fs.readdirSync("./public/images/images_small/")
        let pageHTML = `<!DOCTYPE html>
                        <html>
                            <head>
                                <title>Les images</title>
                                <meta charset="UTF-8">
                                <link rel="stylesheet" href="style.css">
                            </head>
                            <body>
                                <a href="index.html" class="backhome">Retourner à la page d'accueil</a>
                                <h1 id="mainwall">Mon mur d'images !</h1>
                                <div id ="mesimages">`;
        for (let i = 0; i < images.length; i++) {
            pageHTML += `       <a href="page-image/${images[i].slice(0,-10)}">
                                    <div class ="image-container">
                                        <img src="./public/images/images_small/${images[i]}" class ="imgc1">
                                        <div class="hey">Voir plus</div>
                                    </div>
                                </a>`
        }
        pageHTML += `       </div>
                        </div>
                    </body>
                </html>`
        response.end(pageHTML)
    } else if (request.url.startsWith("/page-image/image")){
        console.log(tab[request.url.slice(17)])
        let pageHTML = `<!DOCTYPE html>
                            <html>
                                <head>
                                    <title>Les images</title>
                                    <meta charset="UTF-8">
                                    <link rel="stylesheet" href="/style.css">
                                </head>
                                <body>
                                    <a href="/images" class="backhome">
                                        <img src="/public/images/images_normal/camera.png" width=60px>
                                    </a>
                                    <div>
                                        <img src="/public/images/images_normal/${request.url.slice(12)}.jpg" width=500px class="mainpicture">
                                        <form action="/image-description${parseInt(request.url.slice(17))}" method="post" class="usercomment">
                                            <input type="text" name="description" placeholder="Votre commentaire...">
                                            <button type="submit">Partager</button>
                                        </form>`
        if (tab[request.url.slice(17)] != undefined) {                              
            pageHTML +=                           `<div class="espace_commentaires"><div class="interieur">${tab[parseInt(request.url.slice(17))]}</div></div>`}
        pageHTML +=                        `</div>
                                                <p class="textedescriptif">Le régime paléo nous encourage à manger comme nos ancêtres chasseurs-cueilleurs le faisaient à l’âge de pierre ; il comprend la consommation de poisson, de légumes, de fruits, de viande maigre, d’œufs et de noix, et exclut les produits laitiers, les céréales, les aliments transformés, le café, l’alcool, le sucre et le sel.</p><div class="containerNP">`
        if (parseInt(request.url.slice(17)) -1 > 0) {
            pageHTML += `<a href="/page-image/image${String(parseInt(request.url.slice(17)) -1)}" class ="previous">
                        <p class="p">Image précedente</p>"
                        <img src="/public/images/images_small/image${String(parseInt(request.url.slice(17)) -1)}_small.jpg" alt ="Previous Picture" class="change_image">
                        </a>`
        } if (parseInt(request.url.slice(17)) +1 < 54 ) {
            pageHTML += `<a href="/page-image/image${String(parseInt(request.url.slice(17)) +1)}" class ="next">"
                        <img src="/public/images/images_small/image${String(parseInt(request.url.slice(17)) +1)}_small.jpg" alt ="Next Picture" class="change_image"><p class="n">Image suivante</p></a>`
        }
        pageHTML += `</div>
                        </body>
                            </html>`
        response.end(pageHTML)
    } else if (request.method ==="POST" && request.url.startsWith("/image-description")) {
        let donnees
        request.on("data",(dataChunk) => {
            donnees += dataChunk.toString()
            console.log(donnees)
        })
        request.on("end",()=>{
            const paramValeur = donnees.split("&")
            const number = parseInt(request.url.slice(18))
            const description = (paramValeur[0].split("=")[1]).replace(/\+/g," ")
            if (tab[number] != undefined) {
                let temp = tab[number]
                temp += "<p class =\"commentaire\">Commentaire : " + description +"</p>"
                tab[number] = temp
            } else {
                tab[number] = "<p class =\"commentaire\">Commentaire : " + description +"</p>";
            }
            console.log(tab)
            response.statusCode = 302;
            response.setHeader('Location', '/page-image/image' + request.url.slice(18));
            response.end();

        })
    }else if (request.url.startsWith("/public/")) {
        try {
            response.end(fs.readFileSync("." + request.url));
        } catch (e) {
            console.log(e);
            response.statusCode = 404;
            response.end('error');
        }      
    } else {
        response.end(fs.readFileSync("./public/index.html","utf-8"));
    }
});

server.listen(port, () => {
    console.log("Running server...");
}); 