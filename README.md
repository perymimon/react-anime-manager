

## Welcome to React Anime Manager
React-Anime-Manager is a hook approaches npm module for React that try to give developer easy way to add animation to JSX that directly reflected by data changed.

Like, for example, when a datum disappears from a array like.   
If you not saved the previous array you not have any clue that some datum  are dispear to create the missing JSX from.   
So you can't attach a animation "disapear" on anything.  

If you have saved the previous array you still need to effectively compare it to the current array to find what out...     
That what the module try to solve. give you, the developer, meta data about what happened to `array of objects` or `one object` over updates

The solution is un-opinionated about which methods actually used for the animation as long as it has
some sort of way to tell when animation complete.

The module writed in one file with no dependency other than React, for security and prformance.
about ~250 lines of code so it should be pretty easy to fork, expand and share it back.

show me the code!  
 [![Storybook](https://cdn.jsdelivr.net/gh/storybookjs/brand@master/badge/badge-storybook.svg)](https://perymimon.github.io/React-Anime-Manager) Exmaples


Add a star ⭐ to Github project if you like it. 


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

export function Users(users){
 //                 useAnimeManager(tracking, [key | option])
 const stateItems = useAnimeManager(users, 'id')
 return stateItems.map( ({item:user, phase})=> <User {...user} className={phase}/>)

}

```

# How It Works
The module `react-anime-manager` expose several hooks that can use separate but design work together through`useAnimeManager` hook.

The hook `useAnimeManager` design to place between the data that create the JSX and the JSX result.
It got the tracking data in one side and provide buffer array that contain the same date plus data from the past + essential info that tells
if for each datum if it ADD,REMOVE, or MOVE compare to previous *data*.

The info provide for each datum have among other things: `phase`, `dx`, `dy`, `done()`, `to`,`from`

`phase` has 4 values: `ADD|MOVE|REMOVE|STATIC`. `ADD|MOVE|REMOVE` intend to give a clue that some animation should be attached,
and `STATIC` phase help to clean after or create clean JSX.

After new phase are determine it become stable, mean it not change until developer explicitly tell it's animation `done`
( by calling `done()` method). just then `phase` moved to STATIC, or move to the next phase if in current animation more changes accrued.
so there more `phases` waiting to report. if phase is `REMOVE` it called `done()` remove it completely from the buffer array

e.g. If some datum added but removed quickly `phase` still has `ADD` value.
After `done()` called `phase` will change to `STATIC` and in next animation frame it update to `REMOVE`
and aligned with the data that tracking. Called `done()` again will remove the datum from buffer array

# Examples

## simple counter

Let's create animated counter.

`stateItems` used to create the returns JSX.
`tracking` is just a simple primitive number, So the number himself used as a key for each `stateItem`.

```js codesandbox=animeManager
import {useAnimeManager} from '@perymimon/react-anime-manager'

export default function Counter({state2class, args}) {
    //1. first: stateItems = [{item: 1, phase: ADD, from: Infinity, to: 0, done}]
    //2. <div> created with animation for ADD phase.
    //3.  when `onAnimationEnd` accrued `done()` called. and then
    //       -  `stateItem.phase == STATIC`
    //4. after 2 `setTimeout` called  with `setCounter(2)`
    //5. component reRender again and now 2 go inside `useAnimeManger` and it output:
    // stateItems = [
    //     {item: 1, phase: REMOVE, from: 0, to: 0, done},
    //     {item: 2, phase: ADD, from: Infinity, to: 0, done}
    // ]
    // and two div render one with removed animation and the other with add animation
    // 6. when `item:1.done()` called `item:1` removed from the list. and reRender occurs. so
    //      stateItems = [{item: 2, phase: 'static', from: Infinity, to: 0, done}]
    // 7. when `item:2.done()` called his phase update from `ADD` to `STATIC` and reRender occurs.
    // ...
    // Setra and Setra
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
```


## Hidden Element

`useAnimeManager` also used to animate a boolean flag .

Usual because `true` and `false` considers as a different items each with its own state `useAnimeManager` return `array.length == 2` one item for tracking `false` and other item for tracking `true`.
But because `{oneAtATime:true}` option add to `useAnimeManager` it return just the first state's item each time and hold  other changes until`done` called on `remove` phase.

This approch save from dealing with `array.map` when It is not necessary.

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
```
Note: because there is no element when `flag == false` `done()` must called expliclty to
guide `useAnimeManager` continue with the states flow and show the `true` value when it arrives.


## List of items

Here example that show much of `useReactAnime` main propose: handling array or items.

when `{useEffect: true}` `useAnimeManager` bring a `ref` key that should attach to result JSX
in return it enriches state of each item with:

* `dom` - Actual dom's root .
* `dx` & `dy` - Distance each dom's element moves relative to his previous update
* new PRE states `PREADD|PREMOVE|PREREMOVE` that accrued before `dx` and `dy` calculated

Of course `ref` key needed to follow React explains about [ref](https://reactjs.org/docs/forwarding-refs.html#gatsby-focus-wrapper)

```jsx codesandbox=animeManager
import {useAnimeManager, STATIC, ADD, REMOVE, MOVE} from '@perymimon/react-anime-manager'

export default function ComponentList({state2class, args}) {
    const [list, setList] = useState([1, 2, 3, 4, 5])
    const counter = useRef(list.length)
    const statesItems = useAnimeManager(list, {useEffect: true});

    function handleAdd() {
        let pos = Math.floor(Math.random() * list.length);
        let newItem = ++counter.current;
        list.splice(pos, 0, newItem);
        setList([...list]);
    }

    function handleRemove() {
        let pos = Math.floor(Math.random() * list.length);
        setList(list.splice(pos,1).slice());
    }

    return <div xyz={args.xyz}>
        <button onClick={handleAdd}>add in random</button>
        <button onClick={handleRemove}>remove from random</button>
        <ol className="list">
            {statesItems.map(({item: number, phase, dx, dy, ref, done}) => (
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

## API `useAnimeManager` exposed by `@perymimon/react-anime-manager`

help track after entering, moving and exiting items from collection.
It brings all the info that need to start the animation attached to the original item,
so developer can render even items that already remove from the original data add some nice removing animation
and then after the animation done, tell hook to not bring it again.

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

