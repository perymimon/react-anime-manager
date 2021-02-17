## ANIME

Finally, Solved the issue with animation in react. Basically the problem of managing exit and entry of components to the
page, List or solo, so that they can be animated.

The solution writes basis on hooks-only, ~240 lines in one file , so you can fork it out expand it and share it back.
The solution currently manages adding and removing css classes for the revolutionary `xyzAnime` library

No dependency at all beside `React` itself

`Anime` components remember the last childes components and compare it to new list of components Then split it to 3
lists , `added` `removed`, and `union` then add the corresponding class to each list:
`classIn`, `classOut` and for the other it calculates the diff `x` `y` and put it on css variables, so it will be easy
to use it on animation.
Right now`<Anime>` support a list of components with `key` or one child.
## Examples

```jsx
import '@animxyz/core'
import React, {useRef, useState, useEffect, useLayoutEffect} from "react";
import Anime from './Anime.js';

function App() {
    const [list, setList] = useState([1, 2, 3, 4, 5])
    const counter = useRef(list.length)

    function add() {
        let pos = ~~(Math.random() * list.length);
        list.splice(pos,0,++counter.current)
        setList(list);
    }

    function remove() {
        let pos = ~~(Math.random() * list.length);
        setList(list.filter( (c,i)=> i!== pos ));
    }

    return (
        <div className="App">
            <button onClick={add}>add in random</button>
            <button onClick={remove}>remove from random</button>
            <h1>list</h1>
            <ol className="list-1">
                <Anime xyz="appear-stagger-2 narrow-50%"
                       classIn="xyz-in"
                       classOut="xyz-out xyz-absolute">
                    {list.map((number) => (
                        <li key={'key' + number} className="item">{number}</li>
                    ))}
                </Anime>
            </ol>

        </div>
    );
}

export default App;
```


There are a couple of property (with there default) the Component can take :

`classIn = 'xyz-in'`  - class to put on each `new` element.       

`classOut = 'xyz-out'` - class to put on each `removed` element.     

`classAppear = 'xyz-appear'` - class to put on each element when the whole list is first time appear if it not set `classIn` is used.  

`classMove = 'xyz-in'` - class to put on all element that reposition;   

`xCssProperty = '--xyz-translate-x'` - CSS variable that set to X diff from current position to previous position    

`yCssProperty = '--xyz-translate-y'` - CSS variable that set to Y diff from current position to previous position  


All rest props will go to `<xyz-context style="display:content">` element that wrap the list and no effect on the layout
After `onAnimationEnd`  bubbled to `<xyz-context>` the element that trigger the event cleared from : 
    classes : `classOut` `classIn` `classAppear` `classMove`
    style: `xCssProperty` `yCssProperty` 