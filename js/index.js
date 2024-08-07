import data from './data.json';

const formEl = document.getElementById("form");

formEl.addEventListener('submit', (e) => {
    e.preventDefault();

    const username = e.target[0].value;
    const password = e.target[1].value;

    if (username === data.users[0].username && password === data.users[0].password) {
        console.log("amch")
        window.location.href = "http://localhost:5173/home.html";
    }
})