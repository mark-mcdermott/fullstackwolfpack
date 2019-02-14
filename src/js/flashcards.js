// init vars
const enterKey = 13;
const spaceBar = 32;
const leftArrowKey = 37;
const upArrowKey = 38;
const rightArrowKey = 39;
const downArrowKey = 40;

let flashcardWrapper = document.getElementsByClassName('flashcards')[0];
let flashcards = document.getElementsByClassName('set');
let numCards = flashcards.length;
let curCard = 0;


// helper - get previous card
let getPrevIndex = function (current) {
  let prev;
  if (current == 0) {
    prev = numCards - 1; // last card (in zero based array)
  } else {
    prev = current - 1;
  }
  return prev;
};

// helper -  get previous card
let getNextIndex = function (current) {
  let next;
  if (current == numCards - 1) {
    next = 0; // first card  (in zero based array)
  } else {
    next = current + 1;
  }
  return next;
};

let showPrevCard = function(curCard, prevCard) {
  flashcards[curCard].classList.toggle('hide');
  flashcards[prevCard].classList.toggle('hide');
};

let showNextCard = function(curCard, nextCard) {
  flashcards[curCard].classList.toggle('hide');
  flashcards[nextCard].classList.toggle('hide');
};






// flip card
let flipCard = function(set) {
  let question = set.querySelectorAll('.question')[0];
  let answer = set.querySelectorAll('.answer')[0];
  question.classList.toggle('hide');
  answer.classList.toggle('hide');
}



// SETUP FLASHCARDS
// hide all but first
flashcards[curCard].classList.remove('hide');
// add left/right arrows
let arrowRow = '<div class="arrowRow"><a class="arrow arrow-left" href="#">&larr;</a><a class="arrow arrow-right" href="#">&rarr;</a></div>';
flashcardWrapper.insertAdjacentHTML('beforeend', arrowRow);
let arrowPrev = document.getElementsByClassName('arrow-left')[0];
let arrowNext = document.getElementsByClassName('arrow-right')[0];


// add event listeners
for (let set of flashcards) {
  // on card click, flip card
  set.addEventListener('click', function() {
    flipCard(set);
  });
}

arrowPrev.addEventListener('click', function(e) {
  let prevCard = getPrevIndex(curCard);
  showPrevCard(curCard, prevCard);
  curCard = prevCard;
  e.preventDefault();
});

arrowNext.addEventListener('click', function(e) {
  let nextCard = getNextIndex(curCard);
  showNextCard(curCard, nextCard);
  curCard = nextCard;
  e.preventDefault();
});

document.addEventListener('keydown', function(e) {
  if (e.keyCode == upArrowKey || e.keyCode == downArrowKey || e.keyCode == spaceBar) {
    flipCard(flashcards[curCard]);
  }
});

// on back arrow click or left arrow press, show previous card
document.addEventListener('keydown', function(e) {
  if (e.keyCode == leftArrowKey) {
    let prevCard = getPrevIndex(curCard);
    showPrevCard(curCard, prevCard);
    curCard = prevCard;
  }
});

document.addEventListener('keydown', function(e) {
  if (e.keyCode == rightArrowKey || e.keyCode == enterKey) {
    let nextCard = getNextIndex(curCard);
    showNextCard(curCard, nextCard);
    curCard = nextCard;
  }
});




// end event listeners
