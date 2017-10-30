# The Grid

Crispus relies on a 12 column grid. The grid is built using `flexbox` with a fallback to floats for IE9. Every set of columns should be wrapped in an element with the `g` class. This wrapper should also include any necessary vertical margin classes. 

Reverse Grid example use case: You want a right-aligned button and left-aligned text. When shrinking down to mobile, though, you want the button above the text.
