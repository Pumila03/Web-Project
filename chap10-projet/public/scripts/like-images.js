let likes = document.querySelectorAll('.heart');
let numbers = document.querySelectorAll('.like-text')

console.log(likes)

for (let i = 0; i < likes.length; i++) {
    if (likes[i].src) {
        likes[i].addEventListener('click',(e) => {
            number = parseInt(numbers[i].textContent.split(": ")[1]);
            if (likes[i].src == `http://localhost:8080/static/additional_images/liked_heart.png`) {
                fetch(`/unlike/${i+1}`).then((result) => {
                    likes[i].src= `http://localhost:8080/static/additional_images/like_heart.png`
                    numbers[i].textContent = ` : ${number-1}`
                      })    
            }
            else {
                fetch(`/like/${i+1}`).then((result) => {
                    likes[i].src= `http://localhost:8080/static/additional_images/liked_heart.png`
                    numbers[i].textContent = ` : ${number+1}`
                })
            }
        })
    }
}