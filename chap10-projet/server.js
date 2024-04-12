const fs = require("fs");
const http = require("http");
const server = http.createServer();
const port = 8080;
const crypto = require("crypto")

let tab = [];

let lastSessionId = 0;
let sessions = [];

const { Client } = require('pg');

const client = new Client({
    user: 'postgres', 
    password: 'hey', 
    database: 'application_image',
    port : 5432 
});

client.connect()
.then(() => {
    console.log('Connected to database');
})
.catch((e) => {
    console.log('Error connecting to database');
    console.log(e);
}); 


server.on("request", async (request,response) => {
    let hasCookieWithSessionId = false;
    let sessionId = undefined;
    if (request.headers['cookie'] !== undefined) {
        let sessionIdInCookie = request.headers['cookie'].split(';').find(item => item.startsWith('session-id'))
        if (sessionIdInCookie !== undefined) {
            let sessionIdInt = parseInt(sessionIdInCookie.split('=')[1]);
            if (sessions[sessionIdInt]) {
                hasCookieWithSessionId = true;
                sessionId = sessionIdInt;
                sessions[sessionId].nbRequest++;
            }
        }
    }
    if (!hasCookieWithSessionId) {
        lastSessionId++;
        response.setHeader('Set-Cookie', `session-id=${lastSessionId}`);
        sessionId = lastSessionId;
        sessions[lastSessionId] = {
            'nbRequest': 0
        }
    }
    if (request.url === "/images") {
        const sqlQuery = 'SELECT fichier from images'; 
        const sqlResult = await client.query(sqlQuery); 
        const fichiersImage = sqlResult.rows.map(row => row.fichier);
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
        for (let i = 0; i < fichiersImage.length; i++) {
            const fichierSmallImage = fichiersImage[i].split('.')[0] + '_small.jpg'
                pageHTML += `       <a href="/page-image/${fichiersImage[i].split('.')[0]}">
                                        <div class ="wall_image_container">
                                            <img src="./public/images/${fichierSmallImage}" class ="wall_image">
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

        const sqlQuery = 'SELECT * from images;'; 
        const sqlResult = await client.query(sqlQuery); 
        const fichiersImage = sqlResult.rows.map(row => row.fichier);
        const description =  sqlResult.rows.map(row => row.nom)

        const id = parseInt(request.url.split("/image")[1]) -1 ;
        const id_prev = parseInt(((id -1)+ fichiersImage.length)%fichiersImage.length)
        const id_next = parseInt(((id +1)+ fichiersImage.length )%fichiersImage.length)

        const sqlQueryComment = `SELECT * from commentaire WHERE id_image=${parseInt(id +1)};`;
        const sqlResultComment = await client.query(sqlQueryComment);
        const commentaires = sqlResultComment.rows.map(row => row.texte);

        let pageHTML = `<!DOCTYPE html>
                            <html>
                                <head>
                                    <title>Les images</title>
                                    <meta charset="UTF-8">
                                    <link rel="stylesheet" href="/public/style.css">
                                    <script type="text/javascript" src='/public/page-image.js' defer></script>
                                </head>
                                <body>
                                    <a href="/images" class="back_to_menu">
                                        <img src="/public/camera.png" width=60px>
                                    </a>
                                    <div>
                                        <img src="/public/images/${fichiersImage[id]}" width=500px class="mainpicture">
                                        <form action="/image-description${id+1}" method="post" class="usercomment">
                                            <input type="text" name="description" id="commentaire" placeholder="Votre commentaire...">
                                            <button type="submit" id="commentbutton">Partager</button>
                                        </form>
                                        <div class="espace_commentaires">
                                            <div class="interieur">`
        for (let i = 0;i < commentaires.length;i++) {
            pageHTML+= `                        <p class ="commentaires">Commentaire : ${commentaires[i]}</p>`
        }
        pageHTML +=                    `    </div>
                                        </div>
                                            </div>
                                                <p class="textedescriptif">${description[id]}</p><div class="containerNP">
                                                    <a href="/page-image/${fichiersImage[id_prev].split(".")[0]}" class ="previous">
                                                        <p class="p">Image précedente</p>
                                                        <img src="/public/images/${fichiersImage[id_prev].split(".")[0]}_small.jpg" alt ="Previous Picture" class="change_image">
                                                    </a>
                                                    <a href="/page-image/${fichiersImage[id_next].split(".")[0]}" class ="next">
                                                        <p class="n">Image suivante</p>
                                                        <img src="/public/images/${fichiersImage[id_next].split(".")[0]}_small.jpg" alt ="Next Picture" class="change_image">
                                                    </a>
                                            </div>
                                        </body>
                                    </html>`
        response.end(pageHTML)
    } else if (request.method ==="POST" && request.url.startsWith("/image-description")) {
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
    } else if (request.url === "/signup" && request.method === 'GET') {
        let pageHTML = `<html>
                            <head><link rel="stylesheet" href="public/style.css"/></head>
                            <body>
                                <h1>S'inscrire</h1>
                                <form action='/signup' method="POST">
                                    <label for="username">Nom d'utilisateur : </label>
                                    <input type="text" name="username" id="username" required>
                                    <label for="username">Mot de passe : </label>
                                    <input type="password" name="password" id="password" required>
                                    <input type="submit">
                                </form>
                            </body>
                        </html>`
        response.end(pageHTML);
    } else if (request.url === "/signin" && request.method === 'GET') {
        let pageHTML = `<html>
                            <head><link rel="stylesheet" href="public/style.css"/></head>
                            <body>
                                <h1>Se connecter</h1>
                                <form action='/signin' method="POST">
                                    <label for="username">Nom d'utilisateur : </label>
                                    <input type="text" name="username" id="username" required>
                                    <label for="username">Mot de passe : </label>
                                    <input type="password" name="password" id="password" required>
                                    <input type="submit">
                                </form>
                            </body>
                        </html>`
        response.end(pageHTML);
    } else if (request.url === "/signup" && request.method === 'POST') {
        let data;
        request.on("data", (dataChunk) => {
            data += dataChunk.toString();
        });
        request.on("end",async () => {
            try {
                const params = data.split("&");
                const username = params[0].split("=")[1];
                const password = params[1].split("=")[1];
                const findQuery = `SELECT COUNT(username) FROM accounts WHERE username='${username}'`; 
                const findResult = await client.query(findQuery);
                const USERNAME_IS_UNKNOWN = 0;
                if (parseInt(findResult.rows[0].count) === USERNAME_IS_UNKNOWN) {
                    const salt = crypto.randomBytes(16).toString('hex');
                    const hash = crypto.createHash("sha256").update(password).update(salt).digest("hex")
                    const insertQuery = `INSERT INTO accounts (username, salt, hash) VALUES ('${username}', decode('${salt}','hex') , decode('${hash}','hex'));`;
                    await client.query(insertQuery);
                    response.statusCode = 302;
                    response.setHeader('Location','/signin')
                    response.end();
                } else {
                    response.end(`<html><body><h1>Erreur</h1><div>Nom d'utilisateur déjà pris</div><a href="/signup">Retry</a></body></html>`)
                }
            } catch(e) {
                console.log(e)
                response.end(`<html><body><h1>Erreur</h1></body></html>`)
            }
        })
    } else if (request.url === "/signin" && request.method === 'POST') {
        let data;
        request.on("data", (dataChunk) => {
            data += dataChunk.toString();
        });
        request.on("end", async () => {
            try {
                const params = data.split("&");
                const username = params[0].split("=")[1];
                const password = params[1].split("=")[1];
                const findQuery = `SELECT username, encode(salt,'hex') as salt, encode(hash,'hex') as hash from accounts where username='${username}'`; 
                const findResult = await client.query(findQuery);
                const USERNAME_IS_UNKNOWN = 0;
                if (parseInt(findResult.rows.length) !== USERNAME_IS_UNKNOWN) {
                    const salt = findResult.rows[0].salt;
                    const trueHash = findResult.rows[0].hash;
                    const computedHash = crypto.createHash("sha256").update(password).update(salt).digest("hex");
                    if (trueHash === computedHash) { //AUTHENTICATED
                        sessions[sessionId].username = username;
                        response.statusCode = 302;
                        response.setHeader('Location','/')
                        response.end();
                    } else {
                        response.end(`<html><body><h1>Sign IN Failure</h1> Wrong Password ! <a href="/signin">Retry</a></body></html>`);
                    }
            }
            else {
                response.end(`<html><body><h1>Sign IN Failure</h1> Wrong Username ! <a href="/signin">Retry</a></body></html>`);
            }
        } catch(e) {
            console.log(e);
            res.end(`<html><body><h1>Something goes wrong</h1> <a href="/">Retry</a></body></html>`);     
        }
    })
    } else if (request.url.startsWith("/public/"))  {
        try {
            response.end(fs.readFileSync("." + request.url));
        } catch (e) {
            console.log(e);
            response.statusCode = 404;
            response.end('error');
        }      
    } else {

        const sqlQuery = 'SELECT fichier from images ORDER BY date DESC;'; 
        const sqlResult = await client.query(sqlQuery); 
        const fichiersImage = sqlResult.rows.map(row => row.fichier);


        let pageHTML =`<!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <title>La page principale</title>
                <link rel="stylesheet" href="public/style.css"/>
            </head>
            <body>
                <span id="menu_left">
                    <a href="signup" class="log">S'inscrire</a>
                    <a href="signin" class="log">Se connecter</a>
                </span>`
                if (sessions[sessionId].username !== undefined) {
                    pageHTML += `<span id ="menu_right"><p class="log">Bienvenue ${sessions[sessionId].username}</p></span>`
                }
                pageHTML += `<img id="logo" width = "170px" src="public/ace.png">
                <p id="menutext">Voici Ma page ou je vous présente mon mur d'images !</p>
                <div id="menu_image_container">
                    <a href="page-image/${fichiersImage[0].split(".")[0]}">
                        <img src ="public/images/${fichiersImage[0].split(".")[0]}_small.jpg" class="menu_image">
                    </a>
                    <a href="page-image/${fichiersImage[1].split(".")[0]}">
                        <img src ="public/images/${fichiersImage[1].split(".")[0]}_small.jpg" class="menu_image">
                    </a>
                    <a href="page-image/${fichiersImage[2].split(".")[0]}">
                        <img src ="public/images/${fichiersImage[2].split(".")[0]}_small.jpg" class="menu_image">
                    </a>
                </div>
                <a href="/images"><button id="menu_button">Voir plus d'images</button></a>
            </body>
        </html>`
        response.end(pageHTML)
    }
});

server.listen(port, () => {
    console.log("Running server...");
}); 