let mainImage = document.querySelector(".mainpicture")
let largeur;

mainImage.addEventListener('click', () => {
    largeur = mainImage.clientWidth
    mainImage.style.width = `${largeur + 10}px`})

mainImage.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    largeur = mainImage.clientWidth
    mainImage.style.width = `${largeur- 10}px`})

let submitButton = document.querySelector("#commentbutton")

submitButton.disabled = true
submitButton.style.backgroundColor = 'red';


document.body.addEventListener('keyup',()=>{
    if (commentaire.value == "") {
        submitButton.disabled = true
        submitButton.style.backgroundColor = 'red';
    } else {
        submitButton.disabled = false
        submitButton.style.backgroundColor = '#c001d1';
    }
})


