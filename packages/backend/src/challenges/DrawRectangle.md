**Challenge**

You are implementing a command-line version of the Paint app. Since the command line doesn't support colors, you are using different characters to represent pixels. Your current goal is to support rectangle `x1 y1 x2 y2` operation, which draws a rectangle that has an upper left corner at `(x1, y1)` and a lower right corner at `(x2, y2)`. Here the x-axis points from left to right, and the y-axis points from top to bottom.

Given the initial canvas state and the array that represents the coordinates of the two corners, return the canvas state after the operation is applied. For the details about how rectangles are painted, see the example.

**Example**

For

canvas = 
```
[
   ['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a'],
   ['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a'],
   ['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a'],
   ['b', 'b', 'b', 'b', 'b', 'b', 'b', 'b'],
   ['b', 'b', 'b', 'b', 'b', 'b', 'b', 'b']
]
```
and rectangle = [1, 1, 4, 3], the output should be

canvas = 
```
[
  ['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a'],
  ['a', '*', '-', '-', '*', 'a', 'a', 'a'],
  ['a', '|', 'a', 'a', '|', 'a', 'a', 'a'],
  ['b', '*', '-', '-', '*', 'b', 'b', 'b'],
  ['b', 'b', 'b', 'b', 'b', 'b', 'b', 'b']
]
```
Here is the rectangle, colored for illustration:

canvas = 
```
[
  ['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a'],
  ['a', '*', '-', '-', '*', 'a', 'a', 'a'],
  ['a', '|', 'a', 'a', '|', 'a', 'a', 'a'],
  ['b', '*', '-', '-', '*', 'b', 'b', 'b'],
  ['b', 'b', 'b', 'b', 'b', 'b', 'b', 'b']
]
```
Note that rectangle sides are depicted as `-`s and `|`s, asterisks (`*`) stand for its corners and all of the other "pixels" remain the same.