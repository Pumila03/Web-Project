let like = document.querySelector('.page_like');
let mainPicture = document.querySelector('.mainpicture')
let number_like = document.querySelector('#number_likes')
let i = parseInt(mainPicture.src.slice(41,-4))

console.log(like)

if (like.src) {
    like.addEventListener('click',(e) => {
        let number = parseInt(number_like.textContent)
        if (like.src == `http://localhost:8080/static/additional_images/liked_heart.png`) {
            fetch(`/unlike/${i}`).then((result) => {
                like.src= `http://localhost:8080/static/additional_images/like_heart.png`
                number_like.textContent = `${number - 1}`
            })    
        }
        else {
            fetch(`/like/${i}`).then((result) => {
                like.src= `http://localhost:8080/static/additional_images/liked_heart.png`
                number_like.textContent = `${number + 1}`
            })
        }
    }) 
    number_like.addEventListener('click',(e) => {
        let number = parseInt(number_like.textContent)
        if (like.src == `http://localhost:8080/static/additional_images/liked_heart.png`) {
            fetch(`/unlike/${i}`).then((result) => {
                like.src= `http://localhost:8080/static/additional_images/like_heart.png`
                number_like.textContent = `${number - 1}`
            })    
        }
        else {
            fetch(`/like/${i}`).then((result) => {
                like.src= `http://localhost:8080/static/additional_images/liked_heart.png`
                number_like.textContent = `${number + 1}`
            })
        }
    })  
}
