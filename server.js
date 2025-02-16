const fs = require("fs");
const http = require("http");
const server = http.createServer();
const port = 8080;
const crypto = require("crypto");

const addPublicRoute = require("./routes/public_route.js");
const addCommentRoute = require("./routes/comment_route.js");

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

let hasCookieWithSessionId = false;
let sessionId = undefined;

server.on("request", async (request,response) => {
    
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
});


addPublicRoute(server,fs);

addCommentRoute(server,client);

server.on("request", async (request,response) => {
        if (request.url === "/images") {
            const sqlQueryFichier = 'SELECT fichier from images'; 
            const sqlResultFichier = await client.query(sqlQueryFichier); 
            const fichiersImage = sqlResultFichier.rows.map(row => row.fichier);
    
            let likedTab = [];
    
            if (sessions[sessionId].username !== undefined) {
                const sqlQueryId = `SELECT id FROM accounts WHERE username = '${sessions[sessionId].username}';`;
                const SqlResultId = await client.query(sqlQueryId);
                const user_id = SqlResultId.rows.map(row => row.id); 
    
                const sqlQueryLiked = `SELECT id_images FROM accounts_images_like WHERE id_accounts ='${user_id}'`;
                const sqlResultLiked = await client.query(sqlQueryLiked);
                const likedImages = sqlResultLiked.rows.map(row => row.id_images)
    
                for (let i = 0;i < fichiersImage.length;i++) {
                    likedTab[i] = false; 
                }
                for (let i = 0;i < likedImages.length;i++) {
                    likedTab[likedImages[i]-1] = true; 
                }
            }
    
            let pageHTML = `<!DOCTYPE html>
                            <html>
                                <head>
                                    <title>Les images</title>
                                    <meta charset="UTF-8">
                                    <link rel="stylesheet" href="/public/styles/style_images.css">
                                    <script type="text/javascript" src='/public/scripts/like-images.js' defer></script>
                                </head>
                                <body>
                                    <a href="index" class="back_to_menu">Retourner à la page d'accueil</a>
                                    <h1 id="wall_images_title">Mon mur d'images !</h1>
                                    <div id ="wall_all_images_container">`;
            for (let i = 0; i < fichiersImage.length; i++) {
                const fichierSmallImage = fichiersImage[i].split('.')[0] + '_small.jpg'
                if (sessions[sessionId].username !== undefined) {pageHTML+="<div>"}
                    pageHTML += `       <a href="/page-image/${fichiersImage[i].split('.')[0]}">
                                            <div class ="wall_image_container">
                                                <img src="public/images/${fichierSmallImage}" class ="wall_image">
                                                <div class="wall_image_text">Voir plus</div>
                                            </div>
                                        </a>`
                                        if (sessions[sessionId].username !== undefined) {
    
                                            const sqlQueryTotalLiked = `SELECT COUNT(*) AS nb FROM accounts_images_like WHERE id_images = ${i+1};`;
                                            const sqlResultTotalLiked = await client.query(sqlQueryTotalLiked);
                                            const totalLiked = sqlResultTotalLiked.rows.map(row => row.nb)
    
                                            if (likedTab[i] == false) {
                                                pageHTML+=`<div class = "background-like"><img src="/public/additional_images/like_heart.png" class="heart"><p class="like-text"> : ${totalLiked}</p></div>`
                                            } else {
                                                pageHTML+=`<div class = "background-like"><img src="/public/additional_images/liked_heart.png" class="heart"><p class="like-text"> : ${totalLiked}</p></div>`
                                            }
                                            pageHTML += "</div>"
                                        }
                                    }
            //l'utilisation de plusieurs balises div autours des images sert à créer l'effet de floue et l'affichage du texte
            pageHTML += `       </div>
                            </div>
                        </body>
                    </html>`
            response.end(pageHTML)
        }
    })


server.on("request", async (request,response) => {
    if (request.url.startsWith("/page-image/image")){

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

        let LikedOrNot = undefined;

        let number = undefined;

        if (sessions[sessionId].username != undefined) {
            const sqlQueryId = `SELECT id FROM accounts WHERE username = '${sessions[sessionId].username}';`;
            const SqlResultId = await client.query(sqlQueryId);
            const user_id = SqlResultId.rows.map(row => row.id);


            const sqlQueryLikedOrNot = `SELECT id_images FROM accounts_images_like WHERE id_accounts =${parseInt(user_id)} AND id_images=${parseInt(id+1)};`
            const sqlResultLikedOrNot = await client.query(sqlQueryLikedOrNot);
            LikedOrNot = sqlResultLikedOrNot.rows.map(row => row.id_images)

            const sqlQueryNumber = `SELECT COUNT(*) AS nb FROM accounts_images_like WHERE id_images = ${id+1};`
            const sqlResultNumber = await client.query(sqlQueryNumber);
            number = sqlResultNumber.rows.map(row => row.nb)

        }

        let pageHTML = `<!DOCTYPE html>
                            <html>
                                <head>
                                    <title>Les images</title>
                                    <meta charset="UTF-8">
                                    <link rel="stylesheet" href="/public/styles/style_page_image.css">
                                    <script type="text/javascript" src='/public/scripts/page-image.js' defer></script>
                                    <script type="text/javascript" src='/public/scripts/like-page-image.js' defer></script>
                                </head>
                                <body>
                                    <a href="/images" class="back_to_menu">
                                        <img src="/public/additional_images/camera.png" width=60px>
                                    </a>
                                    <div>
                                        <img src="/public/images/${fichiersImage[id]}" width=500px class="mainpicture">`
                                        if (sessions[sessionId].username != undefined) {
                                            if ( LikedOrNot.length !== 0) {
                                                pageHTML += `<img src='/public/additional_images/liked_heart.png' class='page_like'>`
                                            } else {
                                                pageHTML += `<img src='/public/additional_images/like_heart.png' class='page_like'>`
                                            }
                                            pageHTML += `<p id = "number_likes">${parseInt(number)}</p>`
                                        }
                                        
                                        pageHTML+= `<form action="/image-description${id+1}" method="post" class="usercomment">
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
    }
})


server.on("request", (request,response) => {
    if (request.url === "/signup" && request.method === 'GET') {
        let pageHTML = `<html>
                            <head><link rel="stylesheet" href="/public/styles/style_log.css"/><meta charset="UTF-8"></head>
                            <body>
                                <h1 class="titre_formulaire">S'inscrire</h1>
                                <form action='/signup' method="POST" class="formulaire">
                                    <input type="text" name="username" id="username" required placeholder="Nom d'utilisateur" class="widget">
                                    <input type="password" name="password" id="password" required placeholder="mot de passe" class="widget">
                                    <input type="submit" class ="login_button" value="Créer un compte">
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
                    response.end(`<html>
                                    <head><link rel="stylesheet" href="/public/styles/style_error.css"/><meta charset="UTF-8"></head>
                                    <body>
                                        <div class ="page_erreur">
                                            <h1 >Erreur</h1>
                                            <div>Nom d'utilisateur déjà pris</div>
                                            <a href="/signup">Réessayer</a>
                                        </div>
                                    </body>
                                </html>`)
                }
            } catch(e) {
                console.log(e)
                response.end(`<html>
                                <head><link rel="stylesheet" href="/public/styles/style_error.css"/><meta charset="UTF-8"></head>
                                <body>
                                    <div class ="page_erreur">
                                        <h1>Erreur</h1>
                                    </div>
                                </body>
                            </html>`)
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
                    if (trueHash === computedHash) { 
                        sessions[sessionId].username = username;
                        response.statusCode = 302;
                        response.setHeader('Location','/')
                        response.end();
                    } else {
                        response.end(`<html>
                                        <head><link rel="stylesheet" href="/public/styles/style_error.css"/><meta charset="UTF-8"></head>
                                        <body>
                                            <div class ="page_erreur">
                                                <h1>Erreur de connexion</h1>
                                                <p>Mauvais mot de passe</p>
                                                <a href="/signin">Réessayer</a>
                                            </div>
                                        </body>
                                    </html>`);
                    }
                }
                else {
                    response.end(`<html>
                                    <head><link rel="stylesheet" href="/public/styles/style_error.css"/><meta charset="UTF-8"></head>
                                    <body>
                                        <div class="page_erreur">
                                            <h1>Erreur de connexion</h1>
                                            Mauvais nom d'utilisateur 
                                            <a href="/signin">Réessayer</a>
                                            </div>
                                        </body>
                                    </html>`);
                }
            } catch(e) {
                console.log(e);
                res.end(`<html>
                            <head><link rel="stylesheet" href="/public/styles/style_error.css"/><meta charset="UTF-8"></head>
                            <body>
                                <div class="page_erreur">
                                    <h1>Quelques choses s'est mal passé</h1>
                                    <a href="/">Réessayer</a>
                                </div>
                            </body>
                        </html>`);     
            }
        })
    } else if (request.url === "/signin" && request.method === 'GET') {
        let pageHTML = `<html>
                            <head><link rel="stylesheet" href="/public/styles/style_log.css"/><meta charset="UTF-8"></head>
                            <body>
                                <h1 class="titre_formulaire">Se connecter</h1>
                                <form action='/signin' method="POST" class="formulaire">
                                <input type="text" name="username" id="username" required placeholder="Nom d'utilisateur" class="widget">
                                <input type="password" name="password" id="password" required placeholder="mot de passe" class="widget">
                                <input type="submit" class ="login_button" value="Connexion">
                                </form>
                            </body>
                        </html>`
        response.end(pageHTML);
    } else if (request.url == "/signout") {
        sessions[sessionId].username = undefined;
        response.statusCode = 302;
        response.setHeader('Location','/')
        response.end();
    } 
})

server.on("request", async (request,response) => {
    if (request.url.startsWith("/like/")) {
        const sqlQueryId = `SELECT id FROM accounts WHERE username = '${sessions[sessionId].username}';`
        const SqlResultId = await client.query(sqlQueryId)
        const user_id = SqlResultId.rows.map(row => row.id) 
        const sqlQueryLike = `INSERT INTO accounts_images_like (id_accounts,id_images) VALUES ('${user_id}','${request.url.split('/like/')[1]}')`
        await client.query(sqlQueryLike)
        response.statusCode = 302
        response.setHeader('Location','/images')
        response.end()

    } else if (request.url.startsWith("/unlike/")) {
        const sqlQueryId = `SELECT id FROM accounts WHERE username = '${sessions[sessionId].username}';`
        const SqlResultId = await client.query(sqlQueryId)
        const user_id = SqlResultId.rows.map(row => row.id) 
        const sqlQueryUnlike = `DELETE FROM accounts_images_like WHERE id_accounts = '${user_id}'AND id_images = '${request.url.split('/unlike/')[1]}'`
        await client.query(sqlQueryUnlike)
        response.statusCode = 302
        response.setHeader('Location','/images')
        response.end()

    } 
})

server.on("request", async (request,response) => {
    if (request.url =='/' || request.url == '/index') {

        const sqlQuery = 'SELECT fichier from images ORDER BY date DESC;'; 
        const sqlResult = await client.query(sqlQuery); 
        const fichiersImage = sqlResult.rows.map(row => row.fichier);

        let pageHTML =`<!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <title>La page principale</title>
                <link rel="stylesheet" href="/public/styles/style_index.css">
            </head>
            <body>`
                if (sessions[sessionId].username ==undefined) {
                    pageHTML += `
                <span id="menu_left">
                    <a href="signup" class="log">S'inscrire</a>
                    <a href="signin" class="log">Se connecter</a>
                </span>`
                }
                if (sessions[sessionId].username !== undefined) {
                    pageHTML += `
                    <span id ="menu_left"><a href="signout" class="log">Se déconnecter</a></span>
                    <span id ="menu_right"><p class="log">Bienvenue ${sessions[sessionId].username}</p></span>`
                }
                pageHTML += `<img id="logo" width = "170px" src="public/additional_images/ace.png">
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
})


server.on("request",async(req,res) => {
    if (req.url == "/stats") {
        sqlQuery = "SELECT COUNT(*) as nb FROM accounts";
        sqlResult = await client.query(sqlQuery);
        comptes = sqlResult.rows.map(row => row.nb)

        res.end(`compte utilisateur creer : ${comptes}`)
    }   
})


server.listen(port, () => {
    console.log("Running server...");
});
