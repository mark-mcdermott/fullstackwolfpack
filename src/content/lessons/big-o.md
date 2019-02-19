{
  "title": "Big O",
  "date": "2/9/19",
  "image": "image1"
}

"Big O" notation is a measurement of how complex an algorithm is. The more times a loop executes in code, the higher the big O will be. Big O notation is written in terms of n.  N here represents the number of times a section of code will execute. Big O is way to speak about how fast an algorithm will run relative to another.

### Counting loops

A simple loop in big O notation is just O(n), which is considered linear.  If the loop is run more times, the code is run only that number of times. This code is O(n) or "O of n".  Here we say "O" as in the letter O, pronounced like "oh".

A nested loop in big O notation is considered O(n<sup>2</sup>). If the loop is run more times, the entire inner loop is executed for each increase of 1 in the outer loop.

Some commonly seen big O notation figures are (from slowest to fastest)[1]:

<table>
<tr><td>O(1)</td><td>bounded time</td></tr>
<tr><td>O(log n)</td><td>logarithmic time</td></tr>
<tr><td>O(n)</td><td>linear time</td></tr>
<tr><td>O(n log n)</td><td>n log n time</td></tr>
<tr><td>O(n<sup>2</sup>)</td><td>quadratic time</td></tr>
<tr><td>O(n<sup>3</sup>)</td><td>cubic time</td></tr>
<tr><td>O(2<sup>n</sup>)</td><td>exponential time</td></tr>
</table>

### Sums and products

There are two simple rules that help determine big O:

- In sums of terms, keep the one with the largest factor of x drop the rest
- In products of terms, drop constants

By the first rule, 6x<sup>4</sup> − 2x<sup>3</sup> + 5 can be simplified to 6x<sup>4</sup> and by the second rule we can drop the 6 in 6x<sup>4</sup> and just keep x<sup>4</sup>, so we have O(x<sup>4</sup>).

In computer science, O(x<sup>4</sup>) means, "the algorithm grows asymptotically no faster than x<sup>4</sup>"

### Upper bound vs lower bound vs tight bound

Big O Notation is occasionally accompanied by two other, similar notations&mdash; big Ω and big θ. Big Ω is known as "big omega" and big θ is known as "big theta".  Just as Big O the upper bound for an algorithm (that is, it will grow at that rate or slower), big Ω is the lower bound. So Big Ω means the algorithm will grow at that rate or faster.  Big θ is a comibination of big O and big Ω, so big θ gives both the upper and lower bound. So big θ gives a tight range in which the algorithm won't grow faster than upper bound and also won't grow slower than the lower bound.

[1] Wikipedia.org, 'Big O notation', 2019. [Online]. Available: https://en.wikipedia.org/wiki/Big_O_notation. [Accessed: 17-Feb-2019].
