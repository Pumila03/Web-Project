const fs = require("fs");
const http = require("http");
const server = http.createServer();
const port = 8080;
let tab = [];
const images = fs.readdirSync("./public/images/images_small/")



server.on("request", (request,response) => {
    if (request.url === "/images"){
        let pageHTML = `<!DOCTYPE html>
                        <html>
                            <head>
                                <title>Les images</title>
                                <meta charset="UTF-8">
                                <link rel="stylesheet" href="/public/style.css">
                            </head>
                            <body>
                                <a href="index.html" class="back_to_menu">Retourner à la page d'accueil</a>
                                <h1 id="wall_images_title">Mon mur d'images !</h1>
                                <div id ="wall_all_images_container">`;
        for (let i = 0; i < images.length; i++) {
            console.log(images[i])
            pageHTML += `       <a href="/page-image/${images[i].split("_")[0]}">
                                    <div class ="wall_image_container">
                                        <img src="./public/images/images_small/${images[i]}" class ="wall_image">
                                        <div class="wall_image_text">Voir plus</div>
                                    </div>
                                </a>`
        }
        //l'utilisation de plusieurs balises div autours des images sert à créer l'effet de floue et l'affichage du texte
        pageHTML += `       </div>
                        </div>
                    </body>
                </html>`
        response.end(pageHTML)
    } else if (request.url.startsWith("/page-image/image")){
        const id = parseInt(request.url.split("/image")[1]);
        let pageHTML = `<!DOCTYPE html>
                            <html>
                                <head>
                                    <title>Les images</title>
                                    <meta charset="UTF-8">
                                    <link rel="stylesheet" href="/public/style.css">
                                </head>
                                <body>
                                    <a href="/images" class="back_to_menu">
                                        <img src="/public/images/images_normal/camera.png" width=60px>
                                    </a>
                                    <div>
                                        <img src="/public/images/images_normal/${request.url.split("image/")[1]}.jpg" width=500px class="mainpicture">
                                        <form action="/image-description${id}" method="post" class="usercomment">
                                            <input type="text" name="description" placeholder="Votre commentaire...">
                                            <button type="submit">Partager</button>
                                        </form>`
        if (tab[id] != undefined) {                              
            pageHTML +=                           `<div class="espace_commentaires"><div class="interieur">${tab[id]}</div></div>`}
        pageHTML +=                        `</div>
                                                <p class="textedescriptif">Le régime paléo nous encourage à manger comme nos ancêtres chasseurs-cueilleurs le faisaient à l’âge de pierre ; il comprend la consommation de poisson, de légumes, de fruits, de viande maigre, d’œufs et de noix, et exclut les produits laitiers, les céréales, les aliments transformés, le café, l’alcool, le sucre et le sel.</p><div class="containerNP">`
                                                if ( id - 1 > 0) {
                                                    pageHTML += `<a href="/page-image/image${String((id - 1 + images.length ) % images.length )}" class ="previous">
                                                        <p class="p">Image précedente</p>
                                                        <img src="/public/images/images_small/image${String((id - 1  + images.length ) % images.length)}_small.jpg" alt ="Previous Picture" class="change_image">
                                                    </a>`
                                                }
                                                pageHTML += `<a href="/page-image/image${String((id + images.length +1 ) % images.length  )}" class ="next">
                                                    <p class="n">Image suivante</p>
                                                    <img src="/public/images/images_small/image${String((id + 1 + images.length) % images.length  )}_small.jpg" alt ="Next Picture" class="change_image">
                                                </a>
                                            </div>
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
            console.log(request.url)
            const paramValeur = donnees.split("&")
            const number = parseInt(request.url.split("description")[1])
            const description = (paramValeur[0].split("=")[1]).replace(/\+/g," ")
            if (tab[number] != undefined) {
                let temp = tab[number]
                temp += "<p class =\"commentaire\">Commentaire : " + description +"</p>"
                tab[number] = temp
            } else {
                tab[number] = "<p class =\"commentaire\">Commentaire : " + description +"</p>";
            }
            response.statusCode = 302;
            response.setHeader('Location', '/page-image/image' + request.url.split("description")[1]);
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