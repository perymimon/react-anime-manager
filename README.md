

## Welcome to React Anime Manager
React-Anime-Manager is a hook approach npm module for React that tries to give developers an easy way to add animation to JSX that is directly reflected by data changed.

For example, when a datum disappears from an array-like.   
If you did not save the previous array you do not have any clue that there is item that dispear for make animation on it.   
If so you have saved the previous array you still need to effectively compare it to the current array to find what out changed.     

That is what the module tries to solve. give you, the developer, metadata about what happened to `array of objects` or `one object` over updates

The solution is agnostic about which methods actually used for the animation as long as it has some sort of way to tell when animation is complete.

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
    - [Hidden Element](#simple-primitive-counter)
    - [List of items](#list-of-items)
- [API](#api)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Install & Use

Add the package to your project

`npm i @perymimon/react-anime-manager`

Then import it as hook into your component

```jsx
import  {useAnimeManager} from "@perymimon/react-anime-manager";
// function useAnimeManager(tracking, [key | option]) return array

export function Users(users){
  const stateItems = useAnimeManager(users, 'id')
  return stateItems.map( ({item:user, phase})=> <User {...user} className={phase}/>)
}

```

# How It Works
`react-anime-manager` module exposes several hooks that can be used separately but actually work together through the `useAnimeManager` hook.

`useAnimeManager` tracks after the entry, movement and exit of items on a collection. It brings all the metadata info needed to activate animation based on that changed on the JSX level or directly on the DOM's element that was created from that JSX. Also, it allows items that have been removed from the collection to be recreated so you have the chance to made some remove-animation on them.

The `useAnimeManager` must be placed between the data that creates the JSX and the JSX result to create a new array that contains the original data as well as the data's metadata. Including metadata on removed datums 

The imported keys each datum's metadata exposed are: `phase`, `dx`, `dy`, `done()` and also  `to` and `from`

`done()` callback need to be call when some animation's phase are done. It's mandatory to call it to let the manager know that the element is done with its current state and now it's phase should update to static state or should be removed completely.

`phase` have the following values: `ADD` `MOVE` `REMOVE` `STATIC`.The first three are intended to indicate that some animation should be made.
 `STATIC` phase assists with cleaning-after or creating clean JSX. ex. developer need to remove class before add it again on the next phase.

`to` and `form` refers to the position on the tracking array. And every time phase are changed `dx` `dy` tells how many pixels the rendered DOM moved from the last updated. The hook takes care to keep The phase stable, which means it will not change until the developer explicitly calls the `done()`.
After `done()` are called `phase` will switched to `STATIC`. If more changes were made to the tracking's data the next phase was applied (in the next animation frame).
When phase marked as `REMOVE` and `done()` called. The datums's metadata were removed completely from the array's metadata

# Examples

## 💻 simple primitive counter

Let's create animated counter.

`stateItems` store the metadata's tracking data and used to create the returns JSX.     
`tracking` is just a simple primitive number, So the number himself used as a key for each `stateItem`.

```js codesandbox=animeManager
import {useAnimeManager} from "@perymimon/react-anime-manager"

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
import {useAnimeManager} from "perymimon/react-anime-manager"

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
import {useAnimeManager, STATIC, ADD, REMOVE, MOVE} from "@perymimon/react-anime-manager"

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
## List of items

The following example illustrates the `useReactAnime` main proposal: handling array of items.

When `{useEffect: true}` is set then `useAnimeManager` brings back a `ref` key that should be attached to the result JSX. These *ref* give access to the element's dom of the JSX so that some calculations can be made and that metadata can be added: 

*dom* - The actual DOM element.
*dx* & *dy* - Distance between each DOM element and its previous update
The *phase* calculation now includes pre phases that accrued before the main phases.
That include: *PREADD*, *PRMOVE*, and *PRENEW* that assigned before recalculate the *dx* and *dy*

The *ref* key is required to follow React's documentation about [ref] (https://reactjs.org/docs/forwarding-refs.html#gatsby-focus-wrapper).

# API
##  🖹 `useAnimeManager` 
### ( exposed by "@perymimon/react-anime-manager" )

```jsx
import {useAnimeManager} from "@perymimon/react-anime-manager"
//or
import useAnimeManager from "@perymimon/react-anime-manager"

itemStates = useAnimeManager( tracking [, key|{
    oneAtATime: false,
    useEffect: false,
    protectFastChanges: true,
    key:undefined,
    deltaStyle: 'bySelfLocationChange'
})
```

● `tracking:array<object>|object`: Can be object, primitive, or array-like of objects.

example of primitive: `true/false` `0/1/2/3`  `"foo" | "bar"`
example of objects` : `[{name:'foo',id:1},{name:'bar',id:2}]`

● `key:string`: case-sensitive string represented object's key's name that used to identify each item on the tracking array-like. `key` can be set litral at the second argument of the hook or inside the options object. If tracking is object or array-like of objects that argument are mandatory . but if tracking is primitive the accual value of that primitive will used as the key. 

example:
`useAnimeManager(tracking, 'id')` 
`useAnimeManager(tracking, {key:'id'})`

●  `options:object`: optional object with the following optional [settings](/#Options)   

● `itemStates`: metadata return for each tracking items with the follwing key as describe [here](/#ItemState instance)

## Options:object setting

● `options.key:string`: As describe above

● `options.oneAtATime:boolean` default `false`.
control if retunts metadata will be array or object of the first (oldest) tracking item.

In some cases it more sense to stick to older tracking item until it animation-remove will complete before dealing with the next one. like if the original tracking is not array-like of items.here are exmaple of the different between `{oneAtATime:true}` and `{oneAtATime:false}`

when `{oneAtATime:false}`
```jsx
stateItems = useAnimeManager(true,{oneAtATime:false})
// stateItems = [{item:true, phase:ADD, done(), ...}]
// after some time... 
stateItems = useAnimeManager(false,{oneAtATime:false})
//stateItems = [{item:true, phase:REMOVE, done(), ...}, {item:false, phase:ADD, done(), ...}]
```

when `{oneAtATime:true}`
```jsx
stateItem = useAnimeManager(true,{oneAtATime:true}) 
//stateItem = {item:true, phase:ADD, done(), ...}
// after some time...
stateItem = useAnimeManager(false,{oneAtATime:true})
//stateItem = {item:true, phase:REMOVE, done(), ...}
```

● `options.useEffect:boolean` default is `false`:
if active another render loop will use to bring knowledge about the dom that created by the JSX.
To do that a `ref` key exposed on each metadata. that `ref` should be attached to return JSX ( according to Reacd doc about using ref hook ). with it, in the next render,  that `ref` will hold the real dom element created. and with that, change distance will calculated and attach to item's metadata as `dx` and `dy` .

● `options.deltaStyle:string`:a case-sensitive string used to guide how to calculate `dx` and `dy`.

There is two accepted values:

<table>
    <tr>
        <td>
            "byPosition"
        </td>
        <td>
            each dom's item comparing his positions between his current position and himself in the past.
        </td>
    </tr>    <tr>
        <td>
            "byLocation"
        </td>
        <td>
            each dom's item comparing his positions between his current position and the dom's element that related to the item in index of his `from` property.
        </td>
    </tr>
</table>

*example: [story](?path=/story/examples--position-vs-location)*


● `options.protectFastChanges:boolean`,default is `true`: 
Normal behavior of the Hook is to take care on the situation when `tracking` changed faster than the animations . It does that by hold up the `phase` until `done()` call on the current animation. If more changes will come it aggregate the changes and resolve them one by one after each `done()`. Resolve mean: `phase` will update to `STATIC` ( so some clean will render or made ) and then it update to next phase. 

when `{protectFast:false}` is set `phase` will jump to the new phase as soon as the `tracking` update .

#### metadata instance
--------------------------------------

● `metadata.item:any` The original item that metadata refers to on the `tracking` parameter.

● `metadata.key:string` The key that actually used to identify the item. It can be the value of `key` identifier or the item himself depending on the circumstances/
it is easy and Recommended to paste this value to the `key` argument on the JSX element so it will be a correlation between item key to React component key.

● `metadata.phase:string`, A enum string, indicate the item's phases can be:
 * `ADD` - set when it is the first time item shown on the tracking parameters, after `done()` call the phase change to `STATIC`
 * `MOVE` - `item` location changed on the array (e.g: moved from index 3 to index 4).  After calling `done()` the phase change to `STATIC`.
 * `STATIC` - Indicating nothing changed from last time tracking update
 * `REMOVE` - `item` are no longer on the `tracking` parameter.  after `done()` called it removed from returns hook cache 

As mentioned, when `useEffect = true` is set the item's metadata will calculate twice. first when the change detected with some metadata. next after DOM holded and `dx`  and `dy` are calculated. To distinguish between the two situations and to allow for proper preparation, another set of `phases` was created: `PREADD` `PREMOVE` `PRESTATIC` `PREREREMOVE`. that phases set on the first update and the clasic phases set on the seconed update.
 
●  `metadata.done()`: A callback function that must called every time it's safe to indicate the current phase is completed to handle . like when animation done or skiped. 

●  `metadata.from:number`: index of tracking item's in the previous array . If item is `new` from-value will be `Infinity`. if tracking is not array-like value will be 0

● `metadata.to:number`: index of tracking items on current `tracking`. If the item is just `REMOVED` the value will be Infinity. if tracking is not array-like value will be 0

● `metadata.justUpdate:boolean`: Indicate phase changed just now in this cycle 
in next loop in will be `false`. It can be used to trigger something one-time 

**The next property will be added just when `option.useEffect` is `true`**

●  `metadata.ref:REF`: Instance of `React.createRef`.`useAnimeManger` hold it to have a reference to Real Dom element the tracking item create. Developer should attach it to React generated component, Without that, `dx` & `dy` will be `0` constantly.

● `metadata.dom:DOM`: A dom reference, equal to `metadata.ref.current`.

● `metadata.dx:number` & `metadata.dy:number`: the distance DOM moved on x-axis and y-axis. `options.deltaStyle` used to decide the way calculate should made.

● `metadata.nextPhases:array`: next phases that hold up until current animation done stored here
