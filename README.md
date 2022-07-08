## Welcome to React Animation Manager version 3.0-alpha

Rewrite bottom-up with using clean separate reusable hooks to handle fast changes and calculate dom movement

-------- 

[If you like it👍 star 🌟 it](https://github.com/perymimon/react-anime-manager/stargazers)

----------


## What is React-Animation-Manger, and why should I use it?

React-Anime-Manager is a hook approach for React that stabilizes fast-rate of data changes and bring metadata of the
changes to developer. Now with that metadata you have the chance to made appropriate animation to each JSX object
created from data's
item.

## Features

* ☔ Simple to use and understand
* ⚛ 100% React
* 🚀 Blazing fast builds and performance.
* 🚚 Data Agnostic.
* 🥇 React-centric developer experience.
* 💪 Not using any other npm module beside mine.

# Getting Started

## Installing

```cli
npm i @perymimon/react-anime-manager@alpha.
```

Then import it as hook into your component:

## 💻 How it looks like

Simple list components with animation

```jsx codesandbox: true
// ./examples/example-2/components/list.jsx
import {useAnimeManager} from '@perymimon/useAnimeManager'

export default function List({data, component, ...forwardProps}) {
    const [records, transitions] = useAnimeManager(data, 'id');
    return (
        <ul>
            {transitions(({item, phase, done}, {dx, dy, isMove}) => {
                const style = {
                    '--dy': `${dy}px`,
                    '--dx': `${dx}px`,
                }
                return (
                    <li phase={phase} style={style}
                        data-after-layout={isMove}
                        onAnimationEnd={done}
                    >
                        {component({...forwardProps, ...item})}
                    </li>
                )
            })}
        </ul>
    )
}
```

```css
/* ./examples/example-2/components/list.scss */
li[phase="APPEAR"] {
    animation: list-appear 0.5s cubic-bezier(0.39, 0.58, 0.57, 1) forwards;
}

li[phase="DISAPPEAR"] {
    animation: list-disappear 0.5s ease-in-out forwards;
}

li[phase="SWAP"][data-after-layout="true"] {
    animation: list-swap 0.5s ease-in-out forwards;
}

@keyframes list-swap {
    from {
        transform: translateY(var(--dy));
    }
}
/*...*/

```

If you read it carefully you will see that `data` change comes from outside the component, that it.   
It means `data` can be changed by a user action or by server's response and the animation will occur nicely.

Array of [`records`](#1.record) are provides to describe each phase of corresponding item
and `transitions()` generator provides to traverse them and let you bring JSX elements to the screen.

In above case `li[phase]` used to tell css the `phase` of the item.
In response to this the right css-animation can invoke.  
`dy,dx` used to fine tune the `SWAP` animation and recalculate every time the dom move after cycle of renders occur.

For more examples click [here](./examples/).

## 🖹 module exports

The module contains the following exports:

```jsx 
// Following conatat can imported from `useAnimeManager`,`useDataIntersection`, `useDataIntersectionWithFuture` 
import {STAY, APPEAR, DISAPPEAR, SWAP} from '*'

import {useAnimeManager} from '@perymimon/react-anime-manager'
import {useAnimeManager} from '@perymimon/react-anime-manager/useAnimeManager'
import {useDataIntersection} from '@perymimon/react-anime-manager/useDataIntersection'
import {useTraceMovment} from '@perymimon/react-anime-manager/useTraceMovment'
import {useDataIntersectionWithFuture} from '@perymimon/react-anime-manager/useDataIntersectionWithFuture'

// or, if you intall `@perymimon/react-hooks` collection
import {useAnimeManager} from '@perymimon/react-hooks/useAnimeManager'
import {useDataIntersection} from '@perymimon/react-hooks/useDataIntersection'
import {useTraceMovment} from '@perymimon/react-hooks/useTraceMovment'
import {useDataIntersectionWithFuture} from '@perymimon/react-hooks/useDataIntersectionWithFuture'
```

## 🖹 Entities

All Hooks rely on three types of entities: `records` , `motion` and the basic `state`

#### 1. `record`

Entity `record` is a object that describes tracking item's state. with ability holding the current state and move to
next one when `done` is called.

* `item` (any): the actual tracked item, piped throw record even if state not changed. It never cache.
* `key` (string): key of identify the item, result of resolve `key` argument.
* `from` (number): index of where item was on `tracking` array before that state saved.
* `to` (number): index of where item was on `tracking` array when that state saved.
* `dom` (DOM element): DOM element of the item. It is provided by `transitions()` generator. but it not set until the
  item is rendered and `moveState` require in the  `transitions()` generator or `onMove` are set as function.
* `phase` (enum string): indicate the phase of the change. it can be one of the following:
    * `STAY`: the item is not changed, is still in the same position on `tracking` array, that also the phase after
      calling `done()` on `APPEAR` & `SWAP` phases.
    * `APPEAR`: the item is new, it is just added to `tracking` array.
    * `DISAPPEAR`: the item is just removed from `tracking` array.
    * `SWAP`: the item is swapped with another item or change position on `tracking` array.
* `lastPhase` (enum string): store the last phase before `done()` is called.
* `done` (callback): function to call without arguments when the animation is done. can be safely
  destructed from record it remember it's `this` (`{done}=record` syntax).
* `meta_from` (number): index of where item was in previous `records` array (the one that return from the hook) after
  last done
* `meta_to` (number): index of item in the `records` array now ( note, option for future update : reduce from the value
  removed items )
* `ver` (number):  version of the record, indicate from which `intersection` array it comes from

```jsx
// record example
record = {
    item: user, key: 'some string', from: 0, to: 0, phase: 'APPEAR', done: () => _internal_,
    meta_from: 0, meta_to: 0
}
```

#### 2. `motion`

Extra entity that provide to `transitions()` generator and `onMove` function to describe the movement of the item.

* `dom` (dom element): the dom element that created from return JSX. the same as on `record.dom`
* `dx` (number): the distance moved on the x-axis relative to parent element. (using `offsetLeft` to measure )
* `dy` (number): the distance moved on the y-axis relative to parent element. (using `offsetTop` to measure )
* `isMove` (boolean): if the item is moving or not `(dx !== 0 || dy !== 0)`.

> note: I'm using `offsetLeft` and `offsetTop` instead of `getBoundingClientRect` because the last one changed if the
> element is transform so it not safe to measurement with it in middle of animation because it can bring surprising
> results.

```jsx
// motion example 1
motion = {dom: <div>, dx: 0, dy: 0, isMove: false }
```

```jsx
// motion example 2
motion = {dom: <div>, dx: 10, dy: 0, isMove: true }
```

#### 3. `state`

Ancient version of the record entity. the basic object that used to create a record entity.

* `item`,
* `key`,
* `phase`,
* `from`,
* `to`,

--------------

## 🖹 Hooks

There is a couple of exports from the module but for the goal of anime-manager just one should most used:

### useAnimeManager

```jsx 
[records, transition] = useAnimeManager(tracking, key, options);
```

The main solution of that work. that hook used to trace the data changes. It provides array of `record` one `record` for
each item that `in` or `was` in the tracking argument.
And `transitions function` to trave the component.

That transition function behave like `records.map` but take care to rerender the callback again with delta movement if
the dom are moved after phase changed

That hook are basically lay on  `useDataIntersectionWithFuture` and `useTraceMovment` and forward the heavy lift to
them.
it collected there returns and provide clean synchronized API.

#### arguments

* `tracking`: data to track, can be array of objects or array of primitives or just a single object or primitive (in
  this case it considers as array with single item).
  in a case undefined or null, the return value wil be empty array `[]`.
* `key`: the key name to use to identify each item in the tracking data. if the data is array of objects, the key
  expected to by sting key name. if the data is array of primitives, the key can be omitted. and the value of the
  primitive will be used as key.
  the key can be a string with special value `"index"` in that case the index of the item in the tracking data will be
  used as key.
  the key can be a function that will be invoked on each item `(item,index) => key` and the return value will be used as
  key.
  if key is omitted, the item itself will be used as key.
  in short:
  ```js
    const getKey = (_ => {
        if (typeof key === 'function') return key // called as  key(item,i);
        if (key === 'index') return (item, i) => i;
        if (typeof key === 'string') return (item, i) => item[key]
        return (item, i) => item;
    })();
  ```   
* `options` `{`
    * `onDone` ( callback(record) ): function to callback when the animation is done after the record updated but before
      component rerender(*).
      The function will be called with the following arguments:
        * `record`: the [record](#record) that done.
        > note, maybe the timing of invoke `onDone` will change in the future.

    * `skipPhases` (strings): array of `phases` constant to skip on. if `record` going to be set as phase in the array,
      it auto call done for
      himself, including call to `onDone`, and continue to the next phase if there is one. it helps to avoid phases that
      are not wanted to handle.

    * `maxAnimationTime` (number): default 1000ms, maximum expected animation's time in milliseconds. After that time
      debug
      warning will be shown. It should help find `phases` that not handled, the cause of freezing records.

    * `onMove` (callback): optional, function to call when the item is moved. When that callback exists there will no another rerender after
      the dom move, unless explicit return `true`. the expectation is that `oneMove` will take care of the dom changed.
      The function will be called after motion are calculated but before jsx rerender, with the following arguments:
        * `record`: the record that related to the moved dom. 
        * `motion` (object): as described [above](#motion).

`}`

#### returns

* `records` ([records](#record)): array of `record` one for each item that `in` or `was` in the tracking argument that
  are still handled.
* `transition` (function(jsxGeneratorCallback): use this function to traverse the `records` and return JSX to render. it
  takes
  the following arguments:
    * `record`: the current [record](#record) to render
    * `motion`: the current [motion](#motion) to render

```jsx
function onMove(record, motion) {
    if (motion.isMove) {
        // do something
    }
    // force another rerender
    return true; 
}

function onDone(record) {
    // do something
}

[records, transition] = useAnimeManager(tracking, key, {
    onMove,
    onDone,
    skipPhases: ['APPEAR'],
    maxAnimationTime: 2000,
});

for (record of records) {
    // do something
}

transition(function (recors, motion) {
    return <Users users={records} motion={motion}/>
})
``` 

### useDataIntersection

```jsx
// if you not need the hasemap, you can use the simpler version
options.exportHash = false
intersection = useDataIntersection(tracking, key, options, postProcessing);
```

```jsx
// or if you want to use the hash
options.exportHash = true
    [intersection, hashMap] = useDataIntersection(tracking, key, options, postProcessing);
```

The core hook of `useAnimeManager`. It provides the atomic information that describing the changes that each item in
tracking array has gone through, relative to previous array.

Each atom's intersection called **state**, and it has basically same properties as [record](#record) but without
the `done` callback, `meta_from` and `meta_to` properties.

> note, previous in that term mean "after previous `effect` occur", i.e. after committed `render` phase.

#### arguments

* `tracking` and  `key` : are the same as in `useAnimeManager`
* `options`: can be set with the following properties:
    * `withRemoved` (boolean): default true, if false, removed items will be ignored and not return.
    * `exportHash` (boolean): default false, if true, hook also return the hashmap of the intersection. easy access each
      item but no order
* `postProcessing` (function([`intersection`](#state), `hashMap`)): optional, function to call after the intersection is calculated.
 
```jsx    
 function postProcessing (intersection, hashMap) {
    // do something with the intersection, optionaly return a new/manipulated intersection
    return intersection;
}
```

#### returns

* `intersection` ([states](#state)): array of states, also the array contain `Symbol(ver)` to track if new version of the intersection was created.
* `hashMap` (Map object): hashmap of [states](#state). the key is the key of the tracked item and the value is the [state](#state)
  object. If `exportHash` is false, this will be undefined.

### useDataIntersectionWithFuture

```jsx  
[records, next] = useDataIntersectionWithFuture(tracking, key, options);
```

Lets took the last hook and add buffered memory on it for each `state` to collect the future states but continue return
the current one.
until when ? until callback `next(key)` will called with `key` of a state.
The meaning of the hook is to bring stability of the last change while avoid future changes to be lost.

> `state` with memory will call `record`.

> note, after next(key) called, `record.phase` is seted to be STAY`, forced render, so
> clean up can be made, now `record.phase` will set up to next phase and another render cycle to go.

#### arguments

* `tracking` and  `key` : are the same as described in `useAnimeManager`
* `options`: can be set with the following properties:
    * `skipPhases`: as described in `useAnimeManager`
    * `onDone` : as described in `useAnimeManager`
    * `....` : the other options moved to insider `useDataIntersection`

#### returns

* `records` (object[]): as described in `useAnimeManager`
* `next` (function(key)): as described `done()` in `useAnimeManager`

### useTraceMovement

```jsx
transitions = useTraceMovement(objects, keyName, options);
```

Kind of independent hook, lets say we have a list of objects, call them `records`, and we want to move them on the
screen between render. but do that with animation.
we can use this hook to provide the movement knowledge for the animation.
that hook provides `transitions` function that basically behave like `records.map` but with the addition of
the `motion` object
and ability to rerender the jsx-generator-callback again for each `record` that is change position (on the render
phase _`layoutEffect`_).

> note, rerender not occur if:  
1. `options.onMove` is a function, and it not returns explicit true.  
2. transition called with callback with one or fewer arguments.

#### arguments

* `objects` (object[]): any kind of objects with some identification key.
* `keyName` (string) :the identification key name, used to track the objects.
* `options` (object)
    * `onMove` : as in `useAnimeManager`

#### returns

* `transition`:  as described in `useAnimeManager`
