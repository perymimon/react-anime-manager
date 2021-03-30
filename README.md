**Inspiration from this [article](https://itnext.io/animating-list-reordering-with-react-hooks-aca5e7eeafba)**

![xyz-anime](https://animxyz.com/assets/static/animxyz-logo.b9532cc.39f3bde368e480505b70778acaa2ac74.png)
<span style="font-size=10em;">+</span>
![react logo](https://reactjs.org/icons/icon-96x96.png)

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

  - [REACT ANIME MANAGER](#react-anime-manager)
- [Install](#install)
- [How It Works](#how-it-works)
- [How To Use](#how-to-use)
  - [simple counter](#simple-counter)
  - [Hidden Element](#hidden-element)
  - [List of items](#list-of-items)
- [Hooks](#hooks)
  - [STATIC,ADD,REMOVE,MOVE](#staticaddremovemove)
  - [useChangeIntersection](#usechangeintersection)
  - [useAnimeEffect](#useanimeeffect)
  - [useAnimeManager](#useanimemanager)
  - [useAppear](#useappear)
- [Hook Options Arguments](#hook-options-arguments)
  - [tracking](#tracking)
  - [key](#key)
  - [oneAtATime](#oneatatime)
  - [useEffect](#useeffect)
  - [calculateDistanceMethod](#calculatedistancemethod)
- [`State` Properties](#state-properties)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## REACT ANIME MANAGER


FINALLY a solution to the annoying issue with animation in react. Basically the problem of animating exit [and entry] of components, before component leave the solution bring you extra loops to make your animation. It work on `array of objects` `array or primitve` one `object` or `primitive` that changes over time.
And brings consist items states that help to build components to render, Or choose triggering some animation function from a library. The solution try to be un-opinionated about which library or methods are used for the actual animation as long as it has some sort of method to tell when animation complete.

It writes basis only on originals react hooks, at ~140 lines in one file. No dependency other than `React`

# Install

`npm i @perymimon/react-anime-manager`

# How It Works

The first POC version used components that call `AnimeManager` and coupled with `@animxyz` css style revolution
animation library. After a lot of thinking about design, this version get rid of from the component style and bring a
generic solution in the form of simple `hooks`.

The main hook is `useAnimeManager(tracking,[key|option])` and it works by remember the previous tracking and compare it to future themselves in the next render. Then it returns an `state object` for each value in the tracking. 
State come with essential info, like `phase` and `dx` `dy`, to allows a developer stitch classes, change style or call method from some anime library. The main info is
the `phase`. it's has 4 values: `ADD` `MOVE` `REMOVE` `STATIC`. First 3 states used to make the animation, and the fourth helping to clean after.

Each Item's `states object` come with `done()` callback that should call when animation done to tell `AnimeManger` continue. If the current phase is `ADD` or `MOVE` `AnimeManger` change `phase` to `static`. if it `REMOVE` `AnimeManger` make the final step and remove it  from the stat's array.

Is important to note  that `AnimeManger` by default protect from adding item and then remove it before animation done. Means before calling `done` to  `ADD` `MOVE` and `REMOVE` phases. when it happens `AnimeManger` continue to send the current phase, waiting for `done` , then changed to `STATIC` made force render and _just then_ immediately updated the state to next state and made another render. this way you can sure that your animation will complete and clean after before it move to next phase and animation that come with it.

# How To Use

## simple counter

Let's create animation counter. Look how `states` from `useAnimeManager` used to create the returns elements list.
In this case `tracking` is just a simple primitive number, So it used also as a key

```jsx
import {useAnimeManager} from 'Anime-Manager';
import {useState} from "react";

function Counter(...props) {
    const [count, setCounter] = useState(1)
    const states = useAnimeManager(count)
    /**-> states = [{item:1, phase:'add', from:Infinity, to:0, done}] */

    useEffect(_ => {
        setTimeout(_ => {
            setCounter(count + 1);
          /**-> after setCounter
           states = [
           {item:1, phase:'remove', from:0, to:Infinity, done},
           {item:2, phase:'add', from:Infinity, to:0, done}
           ] */
        }, 2000)
        
    }, [count])

    return states.map(({item: number, key, phase, done}) => (
        <div key={key} className={"item " + state2class[phase]}
             onAnimationEnd={done}>{number}</div>
    ))
    /**-> after `done()` is called on item 2: `phase = STATIC`
     states = [
      {item:1, phase:'remove', from:0, to:Infinity, done},
      {item:2, phase:'static', from:Infinity, to:0, done}
     ]

     after `done()` is called on item 1 : it removed
     states = [
      {item:2, phase:'static', from:Infinity, to:0, done}
     ] */
}
```

## Hidden Element

`useAnimeManager` can used to animate a boolean flag . because `true` and `false` considers
as a different items each with it own state `useAnimeManager` return `stats array`  in length of 2. one state for `false` value, and another for `true`. but we not want to render array of component, we have one variable so, probeblay, we want deal with one component. to do so we use `{oneAtATime:true}` option to guide `useAnimeManager` return just the first state's item each time, and hold other changes until `done` everytime called .

```jsx
function ShowHide() {
    const [show, setShow] = useState(true);
    const {item: flag, phase, dx, dy, ref, done} = useAnimeManager(show, {oneAtATime: true});

    function toggle() {
        setShow(!show)
    }

    /**-> because there is no element when flag == false. we must call `done` expliclty
     to guide `useAnimeManager` continue with the states flow and show the `true` value when it arrive */
    if (!flag) done()

    return <div>
        <button onClick={toggle}>{show ? 'To hide' : 'To show'}</button>
        <ol className="list-2">{
            flag && <li
                className={["item", state2class[phase]].join(' ')}
                ref={ref}
                style={{[args.yCssProperty]: `${dy}px`}}
                onAnimationEnd={done}
            >One InOut value:{String(flag)}</li>
        }</ol>
    </div>

}
```

## List of items

here the example that show much of the power of `ReactAnimeManager`.
by pipping all items through `useAnimeEffect` it enrich the state of each item with actual root's `dom` of the component and with distance each dom's element moves relative to his previous render. to do that hook use another render phase to get the `dom` from `ref` 
of cource that we need to attach to the ref to created component as React explain [here](1)

[1]:https://reactjs.org/docs/forwarding-refs.html#gatsby-focus-wrapper

```jsx
function ComponentList({...props}) {
    const [internalList, setList] = useState([1, 2, 3, 4, 5])
    const counter = useRef(internalList.length)
    const items = useAnimeManager(internalList, {useEffect:true});

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

## STATIC,ADD,REMOVE,MOVE

Module provide some constant for `phase` . it not mandatory to use them, but it is helpful 

```jsx
import {STATIC, ADD, REMOVE, MOVE} from '@perymimon/react-anime-manager'

const phase2class = {
    [STATIC]: '',
    [Add]: 'spin-in',
    [REMOVE]: 'spin-out',
    [MOVE]: 'fade-out-in'
}

```

## useChangeIntersection

The core hook that build the `states`. It's getting `tracking` value and report how it changes overtime. `tracking` can be `array of objects` or just `array of primitive` or just `primitive`.If it arrays of object `key` must be provided too, as a string in the second argument or key in the option argument. every time `tracking` change `useChangeIntersection` checked the different between previous tracking and current
one and expose array of `state` (or one state if `{oneAtATime:true})`) to explain what just happen. The meaning for each property on the state explain at the bottom .

```jsx
import {useChangeIntersection} from '@perymimon/react-anime-manager'

const states = useChangeIntersection(tracking, key)
const states = useChangeIntersection(tracking, {key: undefined})

    [{item, key, phase, from, to}] = states; 
```  

## useAnimeEffect

```jsx
import {useAnimeEffect} from '@perymimon/react-anime-manager'

[{...state, ref, dom, dx, dy}] = useAnimeEffect(states, {
    calculateDistanceMethod: 'bySelfLocationChange'
})
```

`useAnimeEffect` is an enriched phase after `useChangeIntersection` it get the states that come from the hook and
bring `ref`, that should attach to return elements, and use loop of `useLayoutEffect` to add each state distance that
the real element dom moved from the previous iteration. explain of the meaning of each value on the state at the end.

## useAnimeManager

```jsx
import {useAnimeManager} from '@perymimon/react-anime-manager'

const states = useAnimeManager(tracking, key)
// OR
const states = useAnimeManager(tracking, {oneAtATime: false, useEffect: false, protectFastChanges: true, ...rest})

const [{...state, done}] = states
//If `{oneAtATime:true}` : 
const {...state, done} = state
```

this is the final hook that used the two other and bring states that should go to create the render. it provides a `done()` method that used to notify that the animation end and after phase effect should happen. for example: remove
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

## useAppear

```jsx
isAppear = useAppear()
```
A Boolean indicating that component first time render. you can use it to do nice entrance animation.

# Hook Options Arguments

## tracking
A primitive , like `true/false` `0/1/2/3` `"foo"/"bar"`, `object` or `Array of primitive` or `array of objects` to track the change after.  
If it `arrays of objects` the second argument must provide the key name on each object that can used to identify the object .

## key
A case-sensitive string representing the object's key name that used to identify items on the `tracking` argument. 
That value charged exclusively to tracking the item state: `ADD, MOVE, REMOVE, STATIC`.

If the tracking value is `primitive` or `array of primitives` that property can be skipped.
The value of each primitive used as an identify key.

It can be used in option object if you want to mark more options.

## oneAtATime
by default `AnimeManger` return array of item's state but for some cases it makes more sense to return just the first state and move to next one just after `done` called on REMOVE phase of the that state.

## useEffect
mark `useAnimeManger` to use internally `useAnimeEffect`

## deltaStyle
pasted to `useAnimeEffect` hook. it used to decide how to calculate `dx` and `dy`.

`byChangedPosition` : by the comparing the changes position of the same dom's item on each update.   

`byRelativeLocation` : or by comparing the distance between dom's items, each update, using `from` and `to` of the item. the position of dom's item in position `from` compare to position of dom's item in position `to`. 

`byLocalToTo` :  

# `State` Properties

## `item`  
Can be `primitive` or `object`,  Is the tracked item `state` reference to. 

## `key`  
is the key that used to identify the item, recommended pasting this key to new creation JSX element.

## `phase`  
A const string to represent the 4 Phases of tracking item.   
* `ADD` - indicating that item is just added now, after call `done` the phase change to `STATIC`
* `MOVE` - indicating that item positions changes in the array. it can be accrued also if previous item removed from the array. after calling `done` the phase change to `STATIC` 
* `REMOVE` - indicating that item is removed from the array. it not removed from the `state array` until `done` is called. after that it really removed
* `STATIC` - indicating that nothing change from the last time tracking change

## `from`   
A number, The index of previous position item on the tracking array. it will be Infinity on `ADD` `phase`  

## `to`  
A number, The index of new item's position on the tracking array. it will be Infinity on `REMOVED` `phase`

## `ref`   
Instance of `REACT.createRef`. You should attach it to generated component so `AnimeManger` will have access to the component's dom.

## `dom`  
Dom reference. should be the real root dom element of the component. probably equal to `ref.current`

## `dx` & `dy`
A Number, distance in `px` the dom element moved on an x-axis and y-axis. `AnimeManger` used  `calculateDistanceMethod` to decide moved relative to what. what calulation depend on ``


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
