

document.addEventListener("DOMContentLoaded", function () {

    const header = document.querySelector(".h2");
    const nav = document.querySelector(".nav2");


    const btn = document.createElement("button");
    btn.className = "hamburger";
    btn.setAttribute("aria-label", "Toggle navigation");
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
    `;

    const logo = header.querySelector(".logo");
    logo.insertAdjacentElement("afterend", btn);


    btn.addEventListener("click", function () {
        const isOpen = nav.classList.toggle("open");
        btn.classList.toggle("open", isOpen);
        btn.setAttribute("aria-expanded", isOpen);
    });

    nav.querySelectorAll("li > a").forEach(function (link) {
        link.addEventListener("click", function () {
            nav.classList.remove("open");
            btn.classList.remove("open");
            btn.setAttribute("aria-expanded", "false");
        });
    });

    document.addEventListener("click", function (e) {
        if (!header.contains(e.target)) {
            nav.classList.remove("open");
            btn.classList.remove("open");
            btn.setAttribute("aria-expanded", "false");
        }
    });

});
