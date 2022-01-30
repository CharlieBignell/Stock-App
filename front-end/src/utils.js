export function formatNav(target) {
    let items = document.querySelectorAll('.item')
    items.forEach(function (i) {
        i.classList.remove('active')
    });

    document.getElementById(target).classList.add('active')
}