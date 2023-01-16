let navigationButton = document.querySelector('.header__menu-button');
let navigationList = document.querySelector('.header__menu-list');

document.querySelector(".header--no-js").classList.remove("header--no-js");

navigationButton.addEventListener('click', (e) => {
  e.preventDefault();

  navigationButton.classList.toggle('header__menu-button--close');
  navigationList.classList.toggle('header__menu-list--opened');
});
