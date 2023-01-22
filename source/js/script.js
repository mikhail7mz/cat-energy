// Menu for the mobile version

const navigationButton = document.querySelector('.header__menu-button');
const navigationList = document.querySelector('.header__menu-list');

document.querySelector(".header--no-js").classList.remove("header--no-js");

navigationButton.addEventListener('click', (e) => {
  e.preventDefault();

  navigationButton.classList.toggle('header__menu-button--close');
  navigationList.classList.toggle('header__menu-list--opened');
});


// Slider

const exampleContent = document.querySelector('.example__content');
const examplePictures = document.querySelector('.example__pictures');
const exampleImageBefore = document.querySelector('.example__image--before');
const exampleImageAfter = document.querySelector('.example__image--after');
const exampleToggle = document.querySelector('.example__images-toggle');
let exampleIsInUse = false;

const exampleStartUsing = (e) => {
  e.preventDefault();
  exampleIsInUse = true;
}

const exampleFinishUsing = () => {
  exampleIsInUse = false;
}

const resizeExamplePhotos = (touch) => {
  let coordinateX = touch.pageX - exampleContent.offsetLeft - examplePictures.offsetLeft;

  if (exampleIsInUse && (coordinateX > 0) && (coordinateX < exampleImageAfter.offsetWidth)) {
    exampleToggle.style.left = coordinateX + 'px';
    exampleImageBefore.style.clipPath = `polygon(0 0, ${coordinateX}px 0, ${coordinateX}px 100%, 0 100%)`;
    exampleImageAfter.style.clipPath = `polygon(100% 0, ${coordinateX}px 0, ${coordinateX}px 100%, 100% 100%)`;
  }
}

exampleImageBefore.addEventListener('mousemove', (e) => {e.preventDefault()}, false);
exampleImageAfter.addEventListener('mousemove', (e) => {e.preventDefault()}, false);

exampleToggle.addEventListener('mousedown', (e) => exampleStartUsing(e), false);
exampleToggle.addEventListener('touchstart', (e) => exampleStartUsing(e), false);

document.addEventListener('mouseup', () => exampleFinishUsing(), false);
document.addEventListener('touchend', () => exampleFinishUsing(), false);

examplePictures.addEventListener('mousemove', (e) => resizeExamplePhotos(e), false);
examplePictures.addEventListener('touchmove', (e) => resizeExamplePhotos(e.changedTouches[0]), false);
