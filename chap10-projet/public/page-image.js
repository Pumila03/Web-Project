let mainImage = document.querySelector(".mainpicture")
let styles = window.getComputedStyle(mainImage);
let largeur;

mainImage.addEventListener('click', () => {
    largeur = styles.getPropertyValue('width');
    mainImage.style.width = `${parseInt(largeur.split("px")[0]) + 10}px`})

mainImage.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    largeur = styles.getPropertyValue('width');
    mainImage.style.width = `${parseInt(largeur.split("px")[0]) - 10}px`})

let submitButton = document.querySelector("#commentbutton")

submitButton.disabled = true

document.body.addEventListener('keyup',()=>{
    if (commentaire.value == "") {
        submitButton.disabled = true
    } else {
        submitButton.disabled = false
    }
})


