**Inspiration from this [article](https://itnext.io/animating-list-reordering-with-react-hooks-aca5e7eeafba)**

## REACT ANIME MANAGER

Finally, Solved the issue with animation in React. Basically the problem of managing exit and entry of components to the
page, List or solo, so that they can be animated.

The solution writes basis on hooks-only,  ~140 lines in one file. No dependency other than `React`, so you can fork it
out expand it and share it back.

In v1.0 it works for `array` of `objects` or `primitives` or `object` or `primitive` that changes overtime.

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

The first POC version used components that call `AnimeManager` and coupled with `@animxyz` css style revolution
animation library. After a lot of thinking about design, this version get rid of the component style and bring a generic
solution in the form of simple `hooks`.

The main, and only you probably need, hook is `stateItems = useAnimeManager(tracking,[key|option])` and it works by
remember the previous tracking and compare it to future themselves in the next render.

Then it returns an `state object` for each item in the tracking.

`StateItem` come with essential info, like `phase` and `dx` `dy`, to allows you stitch classes, change style or call
method from some anime library. The main info is the `phase`. it's has 4 values: `ADD` `MOVE` `REMOVE` `STATIC`. First 3
states used to make the animation, and the fourth helping to clean after.

Each `stateItem` come with `done()` callback that should be called when animation done to tell `useAnimeManger` that it
allow to continue e.g. after phase `ADD` or `MOVE` `useAnimeManger` change it to `static`. if phase
is `REMOVE` `useAnimeManger` remove the `stateItem` from the `stateItems` array.

Note, `useAnimeManger` by default try to protect `stateItems` from changes faster than the animation. e.g. update
counter value fast or add item and then remove it before animation call `done`. It do that by blocking send the next
phase unless `done()` called on the previous one.

[comment]: <> (This way you can sure that your animation will complete and clean after. before it move to next phase and animation that come with it.)

# Examples

## simple counter

Let's create animation counter. Look how `states` from `useAnimeManager` used to create the returns elements list. In
this case `tracking` is just a simple primitive number, So it used also as a key per number.

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

1. First 
```js
states = [{item:1, phase:'add', from:Infinity, to:0, done}]
```  
2. After `done()` called 
 ```js
states = [{item:1, phase:'static', from:0, to:0, done}]
 ```
   
3. When `setTimeout` called

```js
states = [
{item:1, phase:'remove', from:0, to:0, done},
{item:2, phase:'add', from:Infinity, to:0, done}
]
```

4. After `done()` called on `item:1`
```js
states = [{item:2, phase:'static', from:Infinity, to:0, done}]
```
5. Setra and setra

## Hidden Element

`useAnimeManager` can used to animate a boolean flag . Because `true` and `false` considers as a different items each with it own state `useAnimeManager` return `array` in length of 2.

But there is a chance that because we have one variable we prefer to deal with one component. to do so we use `{oneAtATime:true}` option. It guides `useAnimeManager` return just the first state's item each
time, and hold other changes until `done` called  on `remove` phase.

```jsx
import {useAnimeManager} from '@perymimon/react-anime-manager'
import {useState} from "react";

function ShowHide() {
    const [show, setShow] = useState(true);
    const {item: flag, phase, done} = useAnimeManager(show, {oneAtATime: true});

    function toggle() {
        setShow(!show)
    }

    /**-> because there is no element when flag == false. we must call `done` expliclty to guide `useAnimeManager` continue with the states flow and show the `true` value when it arrive */
    if (!flag) done()

    return <div>
        <button onClick={toggle}>{show ? 'To hide' : 'To show'}</button>
        <ol className="list-2">{
            flag && <li
                className={["item", state2class[phase]].join(' ')}
                onAnimationEnd={done}
            >One InOut value:{String(flag)}</li>
        }</ol>
    </div>

}
```

## List of items

Here example that show much of the power of `useReactAnime`. by pipping all items through `useAnimeEffect` hook `useReactAnime` enriches the state of each item with actual root's `dom` and with `dx` & `dy` the distance each dom's element moves relative to his previous update. to do that `useAnimeEffect` freeze the current state, use another render loop to get the `dom` from `ref` make the calculation and then force render again. 

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
const states = useChangeIntersection(tracking, {key: string|undefined})

[{item, key, phase, from, to}] = states; 
```  

The core hook that build the `stateItems`. It's getting `tracking` value and report for each item if it ADD, REMOVE, MOVE or not change at all:STATIC.

`tracking` can be `array of objects`, `array of primitive` , `primitive` or `objecct` .If it arrays of `object` or `object` `key` must be provided
too, as a string in the second argument or key in the option argument. every time `tracking` change `useChangeIntersection` checked the different between previous tracking and current one and expose array of `stateItems` (or one `stateItem` if `{oneAtATime:true})`) to explain what just happen. 

The details about option and each property on the state explain at the bottom .

## Hook, useAnimeEffect

```jsx
import {useAnimeEffect} from '@perymimon/react-anime-manager'

[{...state, ref, dom, dx, dy}] = useAnimeEffect(states, {
    deltaStyle: 'bySelfLocationChange'
})
```

`useAnimeEffect` is an enriched phase after `useChangeIntersection` it get the `stateItems` that come from the hook and attach to the object `ref`. That `ref` should attach to generated return elements.

After `useEffect` react attach to this ref the actual dom ( or this is what the hook expect of )
and use loop of `useLayoutEffect` to add each state distance that

the real element dom moved from the previous iteration. explain of the meaning of each value on the state at the end.

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

this is the final hook that used the two other and bring states that should go to create the render. it provides
a `done()` method that used to notify that the animation end and after phase effect should happen. for example: remove
the state item from the list if phase is `REMOVE`.

if useEffect flag is `true`  `useAnimeManager` used `useAnimeEffect` internally, in the cost of extra render. so it up
to you if you need the extra information or not.

it bring the options to also orgenize state result.. if it about bringing just the first element until it gone, useful
if tracking is not array, just a one primitive that change over time, and it make more sense to bring one state to
render one element each time.

also there is the situation that the tracking change go fast, before animation complete to describe what happen in the
previous state, result is jumping between two animation in the middle , or worse it not makes the animation at all
because there is no `STATIC` phase that guide to clean up after the animation.

`...rest` options go to internal  `useChangeIntersection` and `useAnimeEffect`

## Hook, useAppear

Helper hook, return boolean. If it true that is the first time component render .
`false` otherwise
```jsx
isAppear = useAppear()
```

A Boolean indicating that component first time render. you can use it to do nice entrance animation.

# Hook Options Arguments

## `tracking`

A primitive , like `true/false` `0/1/2/3` `"foo"/"bar"`, `object` or `Array of primitive` or `array of objects` to track
the change after.  
If it `arrays of objects` the second argument must provide the key name on each object that can used to identify the
object .

## `key`

A case-sensitive string representing the object's key name that used to identify items on the `tracking` argument. That
value charged exclusively to tracking the item state: `ADD, MOVE, REMOVE, STATIC`.

If the tracking value is `primitive` or `array of primitives` that property can be skipped. The value of each primitive
used as an identify key.

It can be used in option object if you want to mark more options.

## `oneAtATime`

by default `AnimeManger` return array of item's state but for some cases it makes more sense to return just the first
state and move to next one just after `done` called on REMOVE phase of the that state.

## `useEffect`

mark `useAnimeManger` to use internally `useAnimeEffect`

## `deltaStyle`

string value that pasted to `useAnimeEffect` hook. it used to decide how to calculate `dx` and `dy`.

There are two values options:
`byPosition`: by the comparing the position of the same dom's item on each `tracking` update.

`byLocation`: by calculating the distance between `from` and `to` for each item in the same list of items.

# Item State Properties

## `item`

Can be `primitive` or `object`, Is the tracked item `state` reference to.

## `key`

is the key that used to identify the item, recommended pasting this key to new creation JSX element.

## `phase`

A const string to represent the 4 Phases of tracking item.

* `ADD` - indicating that item is just added now, after call `done` the phase change to `STATIC`
* `MOVE` - indicating that item positions changes in the array. it can be accrued also if previous item removed from the
  array. after calling `done` the phase change to `STATIC`
* `REMOVE` - indicating that item is removed from the array. it not removed from the `state array` until `done` is
  called. after that it really removed
* `STATIC` - indicating that nothing change from the last time tracking change

## `from`

A number, The index of previous position item on the tracking array. it will be Infinity on `ADD` `phase`

## `to`

A number, The index of new item's position on the tracking array. it will be Infinity on `REMOVED` `phase`

## `ref`

Instance of `REACT.createRef`. You should attach it to generated component so `AnimeManger` will have access to the
component's dom.

## `dom`

Dom reference. should be the real root dom element of the component. probably equal to `ref.current`

## `dx` & `dy`

A Number, distance in `px` the dom element moved on an x-axis and y-axis. `AnimeManger` used  `deltaStyle` to decide
moved relative to what. what calulation depend on ``


[comment]: <> (```jsx)

[comment]: <> (    // exmaple)

[comment]: <> (import {useAnimeEffect, useAnimeManager, STATIC, ADD, REMOVE, MOVE} from "./Anime-Manager";)

[comment]: <> (function Users&#40;users&#41; {)

[comment]: <> (    const userStates = useAnimeManager&#40;users, 'id'&#41;)

[comment]: <> (    const phase2clases = {)

[comment]: <> (        [STATIC]: '',)

[comment]: <> (        [ADD]: 'fade-in',)

[comment]: <> (        [REMOVE]: 'fade-out',)

[comment]: <> (        [MOVE]: 'disapear-and-pop')

[comment]: <> (    })

[comment]: <> (    usersList =)

[comment]: <> (        userStates.map&#40;&#40;{item: user, key, phase, done}&#41; => <User user={user} className={phase2clases[phase]}/>&#41;)

[comment]: <> (    return {usersList})

[comment]: <> (})

[comment]: <> (```)
