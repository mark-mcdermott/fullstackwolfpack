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
var curCard = 0;
var arrowPrev;
var arrowNext; // helper - get previous card

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
}; // helper functions


function hideAllButFirst() {
  for (var i = 0; i < flashcards.length; i++) {
    var question = flashcards[i].querySelectorAll('.question')[0];
    var answer = flashcards[i].querySelectorAll('.answer')[0];

    if (i == 0) {
      question.classList.remove('hide');
    } else {
      flashcards[i].classList.add('hide');
    }

    answer.classList.add('hide');
  }
}

function addArrows() {
  var arrowRow = '<div class="arrowRow"><a class="arrow arrow-left" href="#">&larr;</a><a class="arrow arrow-right" href="#">&rarr;</a></div>';
  flashcardWrapper.insertAdjacentHTML('beforeend', arrowRow);
  arrowPrev = document.getElementsByClassName('arrow-left')[0];
  arrowNext = document.getElementsByClassName('arrow-right')[0];
}
/*
TODO:
this currently makes the front/back of a card the same width/height
because it's jarring if the card changes size when its flipped.
but it would be nice to make the whole set the same size as the largest
card, with the exception of oversized cards.
*/


function setCardDimensions() {
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = flashcards[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var set = _step.value;
      set.classList.remove('hide');
      var question = set.querySelectorAll('.question')[0];
      var answer = set.querySelectorAll('.answer')[0];
      question.classList.remove('hide');
      answer.classList.remove('hide');
      var questionWidth = question.clientWidth;
      var questionHeight = question.clientHeight;
      var answerWidth = answer.clientWidth;
      var answerHeight = answer.clientHieght;
      var largerWidth = questionWidth > answerWidth ? questionWidth : answerWidth;
      var largerHeight = questionHeight > answerHeight ? questionHeight : answerHeight;
      question.style.width = largerWidth + 'px';
      question.style.height = largerHeight + 'px';
      answer.style.width = largerWidth + 'px';
      answer.style.height = largerHeight + 'px';
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
} // flip card


var flipCard = function flipCard(set) {
  var question = set.querySelectorAll('.question')[0];
  var answer = set.querySelectorAll('.answer')[0];
  question.classList.toggle('hide');
  answer.classList.toggle('hide');
}; // SETUP FLASHCARDS


setCardDimensions();
hideAllButFirst();
addArrows(); // add event listeners

var _iteratorNormalCompletion2 = true;
var _didIteratorError2 = false;
var _iteratorError2 = undefined;

try {
  var _loop = function _loop() {
    var set = _step2.value;
    // on card click, flip card
    set.addEventListener('click', function () {
      flipCard(set);
    });
  };

  for (var _iterator2 = flashcards[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
    _loop();
  }
} catch (err) {
  _didIteratorError2 = true;
  _iteratorError2 = err;
} finally {
  try {
    if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
      _iterator2.return();
    }
  } finally {
    if (_didIteratorError2) {
      throw _iteratorError2;
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