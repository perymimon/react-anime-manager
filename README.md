

## Welcome to React Anime Manager
React-Anime-Manager is a hook approach npm module for React that tries to give developers an easy way to add animation to JSX that is directly reflected by data changed.

For example, when a datum disappears from an array-like.   
If you did not save the previous array you do not have any clue that some data are missing to create the missing JSX.   
So you can't attach an animation "disappear" on anything.  

If you have saved the previous array you still need to effectively compare it to the current array to find what out...     
That is what the module tries to solve. give you, the developer, metadata about what happened to `array of objects` or `one object` over updates

The solution is un-opinionated about which methods actually used for the animation as long as it has some sort of way to tell when animation is complete.

The module is written in one file with no dependency other than React, for security and performance.
About ~250 lines of code. so it should be pretty easy to fork, expand and share it back.

Show me the code!  
 [![Storybook](https://cdn.jsdelivr.net/gh/storybookjs/brand@master/badge/badge-storybook.svg)](https://perymimon.github.io/React-Anime-Manager) Tests Exmaples


Add a star ⭐ to the Github project if you like it. 


# Features
* ☔️Simple to use and understand
* ⚛️100% React
* 🚀 Blazing fast builds and performance.
* 🚚 Data Agnostic.
* 🥇 React-centric developer experience.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

**Table of Contents**
- [How It Works](#how-it-works)
- [Install & use](#install--use)
- [Examples](#examples)
    - [simple counter](#simple-counter)
    - [Hidden Element](#hidden-element)
    - [List of items](#list-of-items)
- [API](#api)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Install & Use

Add the package to your project

`npm i @perymimon/react-anime-manager`

Then import it as hook into your component

```jsx
import  {useAnimeManager} from `@perymimon/react-anime-manager`;
// function useAnimeManager(tracking, [key | option]) return array

export function Users(users){
  const stateItems = useAnimeManager(users, 'id')
  return stateItems.map( ({item:user, phase})=> <User {...user} className={phase}/>)
}

```

# How It Works
`react-anime-manager` module exposes several hooks that can be used separately but actually work together through the `useAnimeManager` hook.

The *react-anime-manager* must be placed between the data that creates the JSX and the JSX result to create a new array that contains the original data as well as the data's metadata. Including metadata on removed datums 

The imported keys of each datum's metadata are: `phase`, `dx`, `dy`, `done()`, `to`,`from`

 *phase* have the following values: `ADD` `MOVE` `REMOVE` `STATIC`.
the first three are intended to indicate that some animation should be made. `STATIC` phase assists with cleaning after or creating JSX that is clean.

When phase is `MOVE` keys `to` and `form` refers to the location on the original tracking array.     
When phase are changed `dx` `dy` tells how many pixels the rendered DOM moved from the last updated

The phase becomes stable when it is marked on *phase*, which means it will not change until a developer explicitly calls the `done()` callback.
Then `phase` switched to `STATIC` and in the next animation frame if more changes were made to the tracking's data the next phase was applied.

When phase marked as `REMOVE` and `done()` called. The metadata's datums were removed from the metadata's array

# Examples

## 💻 simple primitive counter

Let's create animated counter.

`stateItems` store the metadata's tracking data and used to create the returns JSX.     
`tracking` is just a simple primitive number, So the number himself used as a key for each `stateItem`.

```js codesandbox=animeManager
import {useAnimeManager} from '@perymimon/react-anime-manager'

export default function Counter({state2class, args}) {
    
  const [count, setCounter] = useState(1)
  const stateItems = useAnimeManager(count)

  useEffect(_ => {
      setTimeout(_ => {
          setCounter(count + 1);
      }, 2000)
  }, [count])

  return stateItems.map(({item: number, key, phase, done}) => (
      <div key={key} xyz={args.xyz} className={"item " + state2class[phase]}
           onAnimationEnd={done}>{number}</div>
  ))

}

/* how it works, in steps:
 steps 1:
  stateItems = [{item: 1, phase: ADD, from: Infinity, to: 0, done}]
  one <div class="item ADD">1<div> to make a ADD animation.
 steps 2: 
   `done()` called when `onAnimationEnd` accure useAnimeManager update stateItem[0].phase to `STATIC` and the componenet forced to rerender.
   <div class="item STATIC> recreated 
 step 3:   
  setTimeout called and do `setCounter(2)` the component rerender again and now 2 go inside useAnimeManger.
  the result  is:
    stateItems = [
      {item: 1, phase: REMOVE, from: 0, to: 0, done},
      {item: 2, phase: ADD, from: Infinity, to: 0, done}
   ]
  so two div renders:
   <div class="item REMOVE">1<div> 
   <div class="item ADD">2<div> 
   one with removed animation and the other with add animation
 step 4:
  when `done()` called after the remove animation complate on <div>1</div> 
  the component rerender again. `2` is still going inside `useAnimeManger`.
  but now  :
    stateItems = [
      {item: 2, phase: ADD, from: Infinity, to: 0, done}
   ]
 step 5: 
  when `done()` called add animation complete on <div>2</div> 
  the component rerender again. `2` still go inside `useAnimeManger`.
  but now: 
    stateItems = [
      {item: 2, phase: STATIC, from: Infinity, to: 0, done}
    ]
 ... Setra and Setra
 */
```
## 💻Hidden Element

`useAnimeManager` also can used to animate a boolean flag .

Since *true* and *false* treat each as a separate item with a separate state, *useAnimeManager* should return array.length == 2, however because the *{oneAtATime:true}* option was added, it returns every time only the first state's item and holds other items until the REMOVE phase removes them.

This approach saves to dealing with `array.map` when it is not necessary.

```jsx codesandbox=animeManager
import {useAnimeManager} from '@perymimon/react-anime-manager'

export default function ShowHide({state2class, args}) {
    const [show, setShow] = useState(true);
    const {item: flag, phase, done} = useAnimeManager(show, {oneAtATime: true});

    function toggle() {
        setShow(!show)
    }

    if (!flag) done() // see note

    return <div xyz={args.xyz}>
        <button style={{float:"left"}} onClick={toggle}>{show ? 'To hide' : 'To show'}</button>
        {
            flag && <div
                className={["item", state2class[phase]].join(' ')}
                onAnimationEnd={done}
            >value:{String(flag)}</div>
        }
    </div>

}
/*
 note: In this implementation there is no element when the flag equals false, so to keep the flow going it is necessary to call *done()* on all phases of {item:false} to show the `true` when it arrives.
*/
```

## 💻List of items

Here is an example that shows much of the `useReactAnime` main proposal: handling array of items.

When `{useEffect: true}` `useAnimeManager` brings a `ref` key that should attach to the result JSX. These *ref* give access to the element's dom of the JSX so that some calculations can be made and metadata can be added: 

*dom* - Actual element of the DOM.     
*dx* & *dy* - Distance between each DOM element and its previous update      
The *phase* calculation now includes prephases that accrued before the main phases.     
That include: *PREADD*, *PREAMINW*, and *PRENEW* that are assigned before *dx* and *dy*     

For *ref* key it's required to follow React's documentation about how attach ref works
[ref](https://reactjs.org/docs/forwarding-refs.html#gatsby-focus-wrapper).

```jsx codesandbox=animeManager
import {useAnimeManager, STATIC, ADD, REMOVE, MOVE} from '@perymimon/react-anime-manager'

var globalCounter = 5;
export default function ComponentList({state2class, args}) {
    const [externalList, setExternalList] = useState([1, 2, 3, 4, 5])
    const statesItems = useAnimeManager(externalList, {useEffect: true});

    function handleAdd() {
        let pos = Math.floor(Math.random() * list.length);
        let newItem = ++globalCounter;
        setList([... list.splice(pos, 0, newItem)]);
    }

    function handleRemove() {
        let pos = Math.floor(Math.random() * list.length);
        setList(list.splice(pos,1).slice());
    }

    return <div xyz={args.xyz}>
        <button onClick={handleAdd}>add in random position</button>
        <button onClick={handleRemove}>remove from random postion</button>
        <ol className="list">
            {statesItems.map(({item: number, phase, dx, dy, ref, done}) => (
                <li key={'key' + number}
                    className=`item ${state2class[phase]}`
                    ref={ref}
                    style={{'--xyz-translate-y': `${dy}px`}}
                    onAnimationEnd={done}
                >{number}</li>
            ))}
        </ol>
    </div>
}
```
# API
##  🖹 `useAnimeManager` ( exposed by `@perymimon/react-anime-manager` ) 

It's a hook that tracks the entry, movement and exit of items from collection.
It brings all the metadata info needed to activate animation from the JSX step or from the DOM's element that was created from that JSX. Also, it allows items that have been removed from the collection to be recreated so that you can make remove-animation on them.

You should note that it's mandatory to call `done()` callback, exposed by the hook, to let the manager know that the element is done with its current state and now it has a static state or should be removed completely from the tracking state.

- [Options](#hook-options-arguments)
- [ItemState Properties](#item-state-properties)


### Syntax

```jsx
import {useAnimeManager} from '@perymimon/react-anime-manager'

itemStates = useAnimeManager( tracking [, key|options])

// Options Default
{
    oneAtATime: false,
    useEffect: false,
    protectFastChanges: true,
    key:undefined,
    deltaStyle: 'bySelfLocationChange'
}

const  {item, key, from, to, justUpdate, phase, nextPhases, done } = itemStates

// if useEffect = true
const  {item, key, from, to, justUpdate, phase, nextPhases, done, ref, dom, dx, dy  } = itemStates
```

● `tracking` is the value or values that we want to track and know there state compare to previous tracking to just coming fresh.

location in the order of the tracking list ;
It can be from the types: primitive, object, array of primitives or objects.

If it `object` or `objects[]` the second argument must provide `key` parameter to identify each
object. `key` can be omitted if tracking values are primitives or array of primitives, in those cases value of each primitive
used as an identifier key.

```jsx
/*primitive:*/ `true/false` `0/1/2/3`  `"foo" | "bar"`
/* objects :*/ `[{name:'foo',id:1},{name:'bar',id:2}]`
```

● `key` is a case-sensitive string represented object's key name that used to identify items on the `tracking` argument.
`key` can be put as the second argument or as a key inside the options object

```jsx
useAnimeManager(tracking, 'id')
useAnimeManager(tracking, {key:'id'})
```
#### Options

● `options.key`
exactly as `key`

● `options.oneAtATime` is flag, default is `false`. by default `useAnimeManager` returns array. If we want to got just the oldest `stateItem` object
we can mark it as `true`. In some cases it makes more sense returns just the older `itemState` object, like when tracking are just primitive.
And got the next one after `done()` called on `REMOVE` phase.

```jsx
//oneAtATime:true
stateItem = useAnimeManager(true,{oneAtATime:true})
// expected output {item:true, phase:ADD, done(), ...}
stateItem = useAnimeManager(false,{oneAtATime:true})
// expected output  {item:true, phase:REMOVE, done(), ...}
```

```jsx
// oneAtATime:false
stateItems = useAnimeManager(true,{oneAtATime:false})
// expected output [{item:true, phase:ADD, done(), ...}]
stateItems = useAnimeManager(false,{oneAtATime:false})
// expected output  [{item:true, phase:REMOVE, done(), ...}, {item:false, phase:ADD, done(), ...}]
```

● `options.useEffect` is flag, default is `false`.
when it `true` another render loop used to bring knowledge about the dom that created by the tracking datum.

How it work? straightforward: `ref` key added to each `itemState`.  that `ref` should be attached to return JSX.
so in the next render `ref` will point to the real dom element that created by the JSX.
after have the dom, moving distance calculated and attach to itemsState as `dx` and `dy`.

● `options.deltaStyle`,a case-sensitive string used to guide how to calculate `dx` and `dy`.

There is two accepted values:

<table>
    <tr>
        <td>
            "byPosition"
        </td>
        <td>
            each dom's item comparing his positions between himself in the past and current `tracking` update.
        </td>
    </tr>    <tr>
        <td>
            "byLocation"
        </td>
        <td>
            each dom's item comparing his positions between his current position and the element that in the index of his `from` property.
        </td>
    </tr>
</table>

*example: [story](?path=/story/examples--position-vs-location)*


● `options.protectFast Changes`,is flag, default is `true`.  Hook try to take care on the situation when `tracking` changed faster than the animation of `ADD` `REMOVE` `MOVE` phases.
It does that by hold up the `phase` until `done()` call on the current animation.
Aggregate the changes and resolve them after `done()` called, one by one, on the previous `phase`
just then `phase` changes to `STATIC` ( so the code will render some clean JSX ) and then in next render animation-frame-loop
`phase` changes to next one.
Without that protection state `phase` will jump to new value as the tracking `update` .

#### ItemState instance
--------------------------------------

● `itemeState.item` The original item `itemeState` reference to on the `tracking` parameters.

● `itemeState.key` Used identify the item. It has taken from object if there is `key` identifier options or use the item himself as key if not.
Recommended to pasting this value to new creation JSX element so will be correlation between item key to React component key.


● `itemState.phase`, A const enum string, indicate the Phases tracking item can be:

* `ADD` - It is the first time `item` show on the tracking parameters, after `done()` call the phase change to `STATIC`
* `MOVE` - `item` location changes on the array (e.g: moved from index 3 to index 4).  After calling `done()` the phase change to `STATIC`
* `REMOVE` - `item` are no longer on the `tracking` parameter.  after `done()` called it removed from returns `itemsState`
* `STATIC` - Indicating nothing changed from last time tracking update

When `options.useEffect = true` another 4 "PRE" phases will trigger at the same time `itemState.justUpdate` is `true`
in the render loop. just before the main phase. the time `dx` and `dy` are updates.
So the whole phase list will be:
- `PREADD` - `ADD` - `PREMOVE` - `MOVE` - `PRESTATIC` - `STATIC` - `PREREMOVE` - `REMOVE`

●  `itemState.done()`, A function, should be called every time animation for any `phase` complete.

●  `itemState.from`, A number, index of original item's in previous `tracking` . If item is new value will be `Infinity`

● `itemState.to`, A number, index of item's on current `tracking`. If item is just `REMOVED` value will be Infinity

● `itemState.justUpdate`, A boolean, indicate `itemState.from` or `itemState.to` just changed first-time this render cycle
in next loop in will be `false`. It can be used to trigger somthing one-time on `phase` changed

**The next property will be added to `itemState` just when `option.useEffect` are `true`**

●  `itemState.ref`, Instance of `React.createRef` that `useAnimeManger` hold to have a reference to Real Dom element the tracking item create.
Developer should attach it to React generated component, Without that, `dx` & `dy` will be `0` constantly

It used by `useAnimeEffect` to know the position box of the compoent each render and generated `dx` and `dy`.

● `itemState.dom`, A dom reference, equal to `ref.current`.

● `itemState.dx` & `itemState.dy`, A Numbers, distance in `px` dom moved on an x-axis and y-axis. `useAnimeEffect` used `deltaStyle` to decide
the way calculate this values.

● `itemState.nextPhases`, A array, when next phases will hold up until current animation done they store here

