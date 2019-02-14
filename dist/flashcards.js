"use strict";

// init vars
var enterKey = 13;
var spaceBar = 32;
var leftArrowKey = 37;
var upArrowKey = 38;
var rightArrowKey = 39;
var downArrowKey = 40;
var flashcardWrapper = document.getElementsByClassName('flashcards')[0];
var flashcards = document.getElementsByClassName('set');
var numCards = flashcards.length;
var curCard = 0; // helper - get previous card

var getPrevIndex = function getPrevIndex(current) {
  var prev;

  if (current == 0) {
    prev = numCards - 1; // last card (in zero based array)
  } else {
    prev = current - 1;
  }

  return prev;
}; // helper -  get previous card


var getNextIndex = function getNextIndex(current) {
  var next;

  if (current == numCards - 1) {
    next = 0; // first card  (in zero based array)
  } else {
    next = current + 1;
  }

  return next;
};

var showPrevCard = function showPrevCard(curCard, prevCard) {
  flashcards[curCard].classList.toggle('hide');
  flashcards[prevCard].classList.toggle('hide');
};

var showNextCard = function showNextCard(curCard, nextCard) {
  flashcards[curCard].classList.toggle('hide');
  flashcards[nextCard].classList.toggle('hide');
}; // flip card


var flipCard = function flipCard(set) {
  var question = set.querySelectorAll('.question')[0];
  var answer = set.querySelectorAll('.answer')[0];
  question.classList.toggle('hide');
  answer.classList.toggle('hide');
}; // SETUP FLASHCARDS
// hide all but first


flashcards[curCard].classList.remove('hide'); // add left/right arrows

var arrowRow = '<div class="arrowRow"><a class="arrow arrow-left" href="#">&larr;</a><a class="arrow arrow-right" href="#">&rarr;</a></div>';
flashcardWrapper.insertAdjacentHTML('beforeend', arrowRow);
var arrowPrev = document.getElementsByClassName('arrow-left')[0];
var arrowNext = document.getElementsByClassName('arrow-right')[0]; // add event listeners

var _iteratorNormalCompletion = true;
var _didIteratorError = false;
var _iteratorError = undefined;

try {
  var _loop = function _loop() {
    var set = _step.value;
    // on card click, flip card
    set.addEventListener('click', function () {
      flipCard(set);
    });
  };

  for (var _iterator = flashcards[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
    _loop();
  }
} catch (err) {
  _didIteratorError = true;
  _iteratorError = err;
} finally {
  try {
    if (!_iteratorNormalCompletion && _iterator.return != null) {
      _iterator.return();
    }
  } finally {
    if (_didIteratorError) {
      throw _iteratorError;
    }
  }
}

arrowPrev.addEventListener('click', function (e) {
  var prevCard = getPrevIndex(curCard);
  showPrevCard(curCard, prevCard);
  curCard = prevCard;
  e.preventDefault();
});
arrowNext.addEventListener('click', function (e) {
  var nextCard = getNextIndex(curCard);
  showNextCard(curCard, nextCard);
  curCard = nextCard;
  e.preventDefault();
});
document.addEventListener('keydown', function (e) {
  if (e.keyCode == upArrowKey || e.keyCode == downArrowKey || e.keyCode == spaceBar) {
    flipCard(flashcards[curCard]);
  }
}); // on back arrow click or left arrow press, show previous card

document.addEventListener('keydown', function (e) {
  if (e.keyCode == leftArrowKey) {
    var prevCard = getPrevIndex(curCard);
    showPrevCard(curCard, prevCard);
    curCard = prevCard;
  }
});
document.addEventListener('keydown', function (e) {
  if (e.keyCode == rightArrowKey || e.keyCode == enterKey) {
    var nextCard = getNextIndex(curCard);
    showNextCard(curCard, nextCard);
    curCard = nextCard;
  }
}); // end event listeners