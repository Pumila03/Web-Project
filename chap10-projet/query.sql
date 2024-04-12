SELECT * FROM images;

SELECT * FROM images ORDER BY date;

SELECT * FROM images ORDER BY date DESC LIMIT 3;
 
SELECT * FROM images WHERE date > '2022-01-01';

SELECT * FROM images WHERE likes > 10;

SELECT * FROM images 
JOIN orientations ON images.orientation = orientations.id
WHERE orientations.orientation = 'portrait';

SELECT * FROM images
JOIN auteurs ON images.id_auteur = auteurs.id
WHERE auteurs.nom = 'Duchamp'AND auteurs.prenom ='Marcel';

SELECT * FROM images
JOIN auteurs ON images.id_auteur = auteurs.id
JOIN orientations ON images.orientation = orientations.id
WHERE auteurs.nom = 'Duchamp'
AND auteurs.prenom ='Marcel'
AND orientations.orientation = 'portrait';

SELECT SUM(images.likes) FROM images
JOIN auteurs ON images.id_auteur = auteurs.id
WHERE auteurs.nom = 'Duchamp'AND auteurs.prenom ='Marcel';

SELECT commentaires.texte
FROM commentaires
JOIN images ON commentaires.id_image = images.id
WHERE images.id = 28;

SELECT *
FROM images
WHERE likes = (SELECT MAX(likes) FROM images);