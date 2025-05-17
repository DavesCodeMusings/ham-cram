# ham-cram
Ham radio exam study guides pairing question pools with text to speech and keyword highlighting.

**Note: Highlighting of question pools is only partially complete at this time.**

Find a working demos here on GitHub Pages:

* https://davescodemusings.github.io/ham-cram/?technician-pool
* https://davescodemusings.github.io/ham-cram/?general-pool
* https://davescodemusings.github.io/ham-cram/?extra-pool

## Brief Instructions for User Interface
* To answer, click the selection (or press the letter on your keyboard.)
* The magnifying glass button will also reveal the correct answer.
* The highlight marker button (or H on the keyboard) will highlight keywords in the question and answer.
* Clicking the die (or R on the keyboard) will choose a random question next.
* The right-arrow button (of the right arrow key) will go to the next question in order.

## Additional Resources
Use this test cram tool together with the [ARRL License Manual](https://home.arrl.org/action/Store/ARRL-Ham-Radio-License-Manual-5th-Edition/ProductDetail/2003373064) and practice tests from [ARRL](https://arrlexamreview.appspot.com/) or [hamstudy.org](https://hamstudy.org).

## What's It Good For?
There are many study aids out there. This is only one of them. Though I do believe it's the only one that reads aloud. It can be used to cram before taking an exam. It could also be used as a teaching tool: posing the questions, giving time for discussion, and then triggering an answer reveal. Highlighting can be used to reinforce key concepts and further discussion.

## How It Works (for the Curious)
In a nutshell, it's an HTML / Javascript / CSS single page web app that parses a text file of questions and their answer choices in the [VEC question pool](https://www.ncvec.org/index.php/amateur-question-pools) format with minimal modifications to the text required. It then presents a single question and set of answer choices along with any relevant figures as graphics. The question is read aloud using Javascript speech synthesis in whatever voice is configured as the browser default. The next question can be sequential or random.

* Button click (highlight marker) or keypress (H) triggers reveal of highlighted passages.
* Button click (magnifying glass) or keypress (A, B, C, or D) triggers bolding of correct answer and strikethrough of incorrect choices. The answer is read using voice synthesis.
* No scoring is kept. Previously viewed questions are not tracked during random selection, except for blocking immediate repeat of the same question.
* Question pool defaults to _technician-pool.txt_ but can be changed using an HTML query parameter in the URL (e.g. the bit after the question mark in http://localhost:8000/?general-pool.txt)
* File names for figures must match the figure referenced in VEC question pool questions and be in PNG format. For example: _What is component 1 in figure T-1?_ would result in using _figure%20T-1.png_ as the image.
