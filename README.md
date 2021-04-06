**Inspiration from this [article](https://itnext.io/animating-list-reordering-with-react-hooks-aca5e7eeafba)**

If you liked It added a star ⭐ to github project will give me back. Thanks.

## REACT ANIME MANAGER

Finally, Solved the issue with animation in React. Basically the problem of managing exit and entry of components to the
page, List or solo, so that they can be animated.

The solution writes basis on hooks-only,  ~140 lines in one file. No dependency other than `React`, so you can fork it
out expand it and share it back.

In v1.0 it works for `array` of `objects|primitives` or just one `object|primitive` that changes overtime.

The first POC version used components that call `AnimeManager` and coupled with `@animxyz` css style revolution
animation library. After a lot of thinking about design, this version get rid of the component style and bring a generic
solution in the form of simple `hooks`.

The solution expose consist items states that help you add the right class or trigger the right animation before the
component gone. It tries to be un-opinionated about which methods are actual used for the animation as long as it has
some sort of way to tell when animation complete.

# Install

`npm i @perymimon/react-anime-manager`

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [How It Works](#how-it-works)
- [Examples](#examples)
    - [simple counter](#simple-counter)
    - [Hidden Element](#hidden-element)
    - [List of items](#list-of-items)
- [Hooks API](#hooks-api)
    - [Helpers const STATIC,ADD,REMOVE,MOVE](#helpers-const-staticaddremovemove)
    - [useChangeIntersection](#usechangeintersection)
    - [useAnimeEffect](#useanimeeffect)
    - [useAnimeManager](#useanimemanager)
    - [useAppear](#useappear)
- [Hook Options Arguments](#hook-options-arguments)
- [Item State Properties](#item-state-properties)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# How It Works

The main hook, and only one you probably need, is

```jsx
stateItems = useAnimeManager(tracking, [key | option])
``` 

and it works by remember the previous tracking and compare it to future themselves in the next render.

Then it returns an `state object` for each item in the tracking.

`StateItem` come with essential info, like `phase`, `dx` and `dy`, The main info is the `phase`. it's has 4
values: `ADD` `MOVE` `REMOVE` `STATIC`. First 3 states intend using to decide when make the animation, and the fourth
helping to clean after.

Each `stateItem` come with `done()` callback that should be called when animation done to tell `useAnimeManger`  it
allow continuing e.g. After `ADD` or `MOVE` change `phase` to `static`. If phase is `REMOVE`, remove `stateItem` from
the `stateItems` array.

Note, `useAnimeManger` by default try to protect `stateItem.phase` from change faster than the animation. It does that
by blocking next phase unless `done()` called on the previous one. e.g. If update primitive counter value faster, It
add, number, tracking item and then remove it before `add animation` call `done`.

[comment]: <> (This way you can sure that your animation will complete and clean after. before it move to next phase and animation that come with it.)

# Examples

## simple counter

Let's create animation counter. Look how `states` from `useAnimeManager` used to create the returns elements list. In
this case `tracking` is just a simple primitive number, So the number used also as a key for each `stateItem`.

```jsx
import {useAnimeManager} from '@perymimon/react-anime-manager'
import {useState} from "react";

function Counter(...props) {
    const [count, setCounter] = useState(1)
    const states = useAnimeManager(count)

    useEffect(_ => {
        setTimeout(_ => {
            setCounter(count + 1);
        }, 2000)
    }, [count])

    return states.map(({item: number, key, phase, done}) => (
        <div key={key} className={"item " + state2class[phase]}
             onAnimationEnd={done}>{number}</div>
    ))

}
```

**What happen:**

1. First

```js
states = [{item: 1, phase: 'add', from: Infinity, to: 0, done}]
```  

2. After `done()` called, when `onAnimationEnd` fired

 ```js
states = [{item: 1, phase: 'static', from: 0, to: 0, done}]
 ```

3. Then, When `setTimeout` called, `2` replace `1` so

```js
states = [
    {item: 1, phase: 'remove', from: 0, to: 0, done},
    {item: 2, phase: 'add', from: Infinity, to: 0, done}
]
```

4. Then, After `done()` called on `item:1` it removed from `stateItems` list. and after `done()` called on `item:2` it
   phase move from `add` to `static`

```js
states = [{item: 2, phase: 'static', from: Infinity, to: 0, done}]
```

5. Setra and Setra

## Hidden Element

`useAnimeManager` can used to animate a boolean flag . Because `true` and `false` considers as a different items each
with it own state `useAnimeManager` return `array` in length of 2.

There is a chance that we prefer not deal with an array, because `flag` is just varibale and we not want to make to much
change to code when we add the animation by dealing with array now. so using `{oneAtATime:true}` option
guides `useAnimeManager` to return just the first state's item each time, and hold other changes until `done` called
on `remove` phase for the first one.

```jsx
import {useAnimeManager} from '@perymimon/react-anime-manager'
import {useState} from "react";

function ShowHide() {
    const [show, setShow] = useState(true);
    const {item: flag, phase, done} = useAnimeManager(show, {oneAtATime: true});

    function toggle() {
        setShow(!show)
    }

    /**-> because there is no element when flag == false. `done` must called expliclty to
     * guide `useAnimeManager` continue with the states flow and show the `true` value when it arrive */
    if (!flag) done()

    return <div>
        <button onClick={toggle}>{show ? 'To hide' : 'To show'}</button>
        {
            flag && <div
                className={["item", state2class[phase]].join(' ')}
                onAnimationEnd={done}
            >One InOut value:{String(flag)}</div>
        }
    </div>

}
```

## List of items

Here example that show much of `useReactAnime` power for `array` or items.
By pipping all items through internal
hook: `useAnimeEffect`,  `useReactAnime` enriches the state of each item with:

* `dom` - Actual dom's root .
* `dx` & `dy` - Distance each dom's element moves relative to his previous update

Of course It needed to follow React explains about `ref` [here](1)

[1]:https://reactjs.org/docs/forwarding-refs.html#gatsby-focus-wrapper

```jsx
import {useAnimeManager, STATIC, ADD, REMOVE, MOVE} from '@perymimon/react-anime-manager'
import {useState, useRef} from "react";

const phase2class = {
    [STATIC]: '',
    [Add]: 'spin-in',
    [REMOVE]: 'spin-out',
    [MOVE]: 'fade-out-in'
}

function ComponentList({...props}) {
    const [internalList, setList] = useState([1, 2, 3, 4, 5])
    const counter = useRef(internalList.length)
    const items = useAnimeManager(internalList, {useEffect: true});

    function add() {
        let pos = ~~(Math.random() * internalList.length);
        internalList.splice(pos, 0, ++counter.current)
        setList([...internalList]);
    }

    function remove() {
        let pos = ~~(Math.random() * internalList.length);
        setList(internalList.filter((c, i) => i !== pos));
    }


    return <div>
        <button onClick={add}>add in random</button>
        <button onClick={remove}>remove from random</button>
        <ol className="list">
            {items.map(({tiem: number, phase, dx, dy, ref, done}) => (
                <li key={'key' + number}
                    className={["item", state2class[phase]].join(' ')}
                    ref={ref}
                    style={{'--xyz-translate-y': `${dy}px`}}
                    onAnimationEnd={done}
                >{number}</li>
            ))}
        </ol>
    </div>
}
```

# Hooks API

There is a couple of hooks that exposed by the module. each hook enriches the state's item with its things and together
they build `useAnimeManager`.

## Helpers, const STATIC,ADD,REMOVE,MOVE

Some constants represent the values of `phase`, Not mandatory to use them, but it helpful

```jsx
import {STATIC, ADD, REMOVE, MOVE} from '@perymimon/react-anime-manager'

const phase2class = {
    [STATIC]: '',
    [Add]: 'spin-in',
    [REMOVE]: 'spin-out',
    [MOVE]: 'fade-out-in'
}
```

## Hook, useChangeIntersection

```jsx
import {useChangeIntersection} from '@perymimon/react-anime-manager'

const states = useChangeIntersection(tracking, key)
const states = useChangeIntersection(tracking, {key: string | undefined})

    [{item, key, phase, from, to}] = states; 
```  

The core hook that build the `stateItems`. It's getting `tracking` value and report for each item if it ADD, REMOVE,
MOVE or not change at all:STATIC.

`tracking` can be `array of objects`, `array of primitive` , `primitive` or `objecct` .If it arrays of `object`
or `object` `key` must be provided too, as a string in the second argument or key in the option argument. every
time `tracking` change `useChangeIntersection` checked the different between previous tracking and current one and
expose array of `stateItems` (or one `stateItem` if `{oneAtATime:true})`) to explain what just happen.

The details about option and each property on the state explain at the bottom .

## Hook, useAnimeEffect

```jsx
import {useAnimeEffect} from '@perymimon/react-anime-manager'

[{...state, ref, dom, dx, dy}] = useAnimeEffect(states, {
    deltaStyle: 'bySelfLocationChange'
})
```

The `useAnimeEffect` is an enriched phase. It got `stateItems` from `useChangeIntersection` and attach each `stateItem`
a `ref` key. That `ref` should attached to generated component that return to react virtual dom tree.

Then, the `dom element` that put there by React, after `useEffect` phase, used to calculate `dx` and `dy` for
each `itemState`. `dx` & `dy` are the actual distance in pixels, dom moved from the previous update

Technically `useAnimeEffect` let all items with `phase != MOVE` go through and freeze all items with `phase==MOVE` to
there previous `phase`. So items that just `ADD` or `REMOVE` can be update and do there things. After items change there
positions but before they render `useAnimeEffect` compare each dom box that move. with it corresponding dom box and
calculated the `dx` and `dy`. The actual dom box compared to decided by `deltaStyle` option as describe at the bottom of
this document.

## Hook, useAnimeManager

```jsx
import {useAnimeManager} from '@perymimon/react-anime-manager'

const states = useAnimeManager(tracking, key)
// OR
const states = useAnimeManager(tracking, {oneAtATime: false, useEffect: false, protectFastChanges: true, ...rest})

const [{...state, done}] = states
//If `{oneAtATime:true}` : 
const {...state, done} = state
```

The final hook that used the two other and bring states that should used to create the render result. It added
a `done()` method that used to notify animation end and _after-phase_ effect should happened. for example: remove
the state item from the list if phase is `REMOVE` and animation was done.

If useEffect flag is `true`  `useAnimeManager` used `useAnimeEffect` internally, in the cost of extra render to add extra info, as describe above, so it up to developer if that extra information are needed or not.

Also hook has the options to bringing just the first element until it gone, useful
if tracking is primitive changed over time, not array, so maybe it makes sense to work with one object instead of array to return one component .

Also hook take care on the situation `tracking` changed directly and faster between `ADD` `REMOVE` `MOVE` before done call on the previous animation so there is not clean up for the animation.
without the protection animation can jumping in the middle , or worse it not makes the animation at all.
but if developer want to cancel that protection add `{protectFastChanges:false}` to options

any `...rest` options go through to internal  `useChangeIntersection` and `useAnimeEffect` 

## Hook, useAppear

```jsx
isAppear = useAppear()
```
Helper hook that return boolean, `true` If is first time component render and `false` otherwise. 
Use it to do nice entrance animation.

# Hook Options Arguments

## `tracking`

A primitive , like `true/false` `0/1/2/3` `"foo"/"bar"`, `object` or `Array of primitive` or `array of objects` to track
the change after.  
If it `arrays of objects` or `object` the second argument must provide the id key name to identify the
object for tracing 

## `key`

A case-sensitive string representing the object's key name that used to identify items on the `tracking` argument. That
value charged exclusively to give item state: `ADD, MOVE, REMOVE, STATIC`.

If the tracking value is `primitive` or `array of primitives` that property can be skipped because the value of each primitive
will use as an identify key.

It can be used also as part of the option object if you want to mark more options with it.

## `oneAtATime`

By default `useAnimeManger` return array of `itemStates` but for some cases it makes more sense to return just the older `itemState`  
and move to next one just after `done` called on REMOVE phase of that itemState.
for example , when `tracking` is primitive that before using `useAnimeManger` directly build the component
and is easier continue not convert the entire code's component to use array.  

## `useEffect`

mark `useAnimeEffect` to use internally 

## `deltaStyle`

string option pasted to `useAnimeEffect` to guide how calculate `dx` and `dy`.

There are two values here:
- `byPosition`: by the comparing the positions of the same dom's item before and after each `tracking` update.
- `byLocation`: by calculating the distance between `from` and `to` in the same list of items every update.

# Item State Properties

## `item`

Is original item `itemeState` reference to.

## `key`

Is the key that used to identify the item. It taken from item object if there is `key` identifier on option or use the item imself, if it primitive, to return this.
It recommended pasting this key to new creation JSX element so will be correlation between item key to React component key.

## `phase`

A const string, represent the 4 Phases tracking item can be.

* `ADD` - Indicating `item` is just added now, after call `done()` the phase change to `STATIC`
* `MOVE` - Indicating `item` location changes in the array (e.c: moved from 3 to 4, or from 1 to 0).  After calling `done()` the phase change to `STATIC`
* `REMOVE` - indicating that item is removed from the array. it not removed from the `stateItems` array until `done()` is
  called. after that it really removed
* `STATIC` - Indicating nothing changed from last time tracking update

## `from`

A number, The index of item's previous location on the `tracking`. If item is just `ADD` value will be Infinity 

## `to`

A number, The index of new item's position on the tracking array. If item is just `REMOVED` value will be Infinity

## `ref`
Instance of `React.createRef` that `useAnimeManger` hold to have a reference to Real Dom element the tracking item create.
It used by `useAnimeEffect` to know the position box of the compoent each render.
Developer should attach it to React generated component, Without that `dx` & `dy` will be `0` constantly

## `dom`

Key Helper Equal to `ref.current`

## `dx` & `dy`

A Number, distance in `px` the dom element moved on an x-axis and y-axis. `useAnimeEffect` used `deltaStyle` to decide
the way calculate this values. 
