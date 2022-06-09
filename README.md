## Welcome to React Animation Manager version 2.0
Rewrite from bottom up with abilities already by default to handle fast changes and calculate dom movement

# Getting Started
## What is React-Animation-Manger
React-Anime-Manager is a hook approach for React that stabilize fast-rate of data changes and bring metadata of the changes to developer, so he has a chance to made appropriate animation on each item on that data according to the phase of the change ( added, removed, swap ).

## Features
* ☔ Simple to use and understand
* ⚛ 100% React
* 🚀 Blazing fast builds and performance.
* 🚚 Data Agnostic.
* 🥇 React-centric developer experience.
* not using any other npm module

## Installing
```cli
npm i @perymimon/react-anime-manager
```
Then import it as hook into your component:

```jsx
import  {useAnimeManager} from "@perymimon/react-anime-manager";
```

## 💻 simple primitive counter

Let's create animated-counter.

`stateItems` store the metadata and used to create the returns JSX.     
`tracking` is a simple primitive number, it this case the number himself used as tracking key for each `stateItem`.

```js codesandbox=animeManager
import {useAnimeManager} from "@perymimon/react-anime-manager"

export default function Counter({state2class, args}) {
    const [count, setCounter] = useState(1)
    const states = useAnimeManager(count)

    useEffect(_ => {
        setTimeout(_ => {
            setCounter(count + 1);
        }, 2000)
    }, [count])

    return states.map(({item: number, key, phase, done}) => (
        <div key={key}
             className={"item " + state2class[phase]}
             onAnimationEnd={done}>{number}</div>
    ))

}
```
For more examples click [here]()

##  🖹 API of useAnimeManager

```jsx
import useAnimeManager from "@perymimon/react-anime-manager"

// tracking` can be Object, primitive, or array-like of objects.
states = useAnimeManager( tracking [,key|options])

options = {
    // case-sensitive string represented item's key that identify each item of the tracking array.
    // `key` can be set literal at the second parameter or inside option object.
    // it mandatory when tracking are object or array of objects. and optional when tracking are primitive
    //  or array of primitives, when it not provide the `item` imself used as key 
    // `useAnimeManager(tracking, 'id')`
    // `useAnimeManager(tracking, {key:'id'})`
    key:'id',
    // imediatly return last phase for each item acording to last tracking compare, without waiting finish
    // perviues phases animation
    instantChange : false,
}

```

### State in States
The result of whole calculation. array with metadata knowledge for each item on tracking array that not removed and done yes
```javascript
states[{
    //Original item that metadata refers to on the `tracking` parameter.
    item: user,
    // the Key actually used to identify the item. It can be the value of item[key] identifier or the item himself depending on the circumstances/
    // tip: key can used as `key` argument on the JSX array elements. 
    key: '10342',
    // A enum string, indicate the item's phases:
    // * `STATIC` - set when nothing changed from last time tracking update
    // * `ADDED` - set when is the first time item shown on the tracking parameters, after `done()` called the phase change to `STATIC`
    // * `SWAP` - set when `item` appear in different location on the array (e.g: moved from index 3 to index 4).  After calling `done()` the phase change to `STATIC`.
    // * `REMOVED` - `item` are no longer on the `tracking` parameter.  after `done()` it removed completely from metadata array    
    phase:ADD,
    // Callback that must call every time developer finish deal with current phase. so hook can be process to next phase.
    done(),
    // item's index in previous tracking array. when phase ADDED the value will be same as `.to`
    from:0,
    // item's index on current tracking array. when phases REMOVED the value will be same as `.from`
    to:1,
    // item's index in previous result of `useAnimeManager`, if phase are ADDED value will be the current index
    meta_from:1,
    // items's index on current result of `useAnimeManager
    meta_to:2,
    // Instance of `React.createRef`. should be used by the developer, and attached to jsx `.item`'s componenet genereted 
    // Without that, `dx,dy,meta_dx,meta_dy,trans_dx,trans_dy` will be `0` constantly.
    ref: [internal React.createRef],
    // A dom reference, equal to `.ref.current`. affter ADDED phase it should be exist contantyly 
    dom: [browser DOM] || null,
    
    // Next variables will be 0 unless dom == [browser DOM]
    
    // return the distance dom moved between previous render and current one. that variables updated after 
    // `useEffect` and developer can read them immediately on callback `oneffect(state)`
    trans_dx:0,
    trans_dy:-43,
    // same as above but calculate the distance between dom on `stats[from].dom` and `state[to].dom`
    // mean, the distance between elemets, without take in effect the real coordianation of current dom, unless it same as `to`
    dx:0,
    dy:-43,
    //same as dx,dy but used meta_to & meta_from to get the dom. meta_to is the current item index on the `useAnimeManager` result
    // so basicaly it the distance from start position and the current one of that item 
    meta_dx: 0,
    meta_dy: -43
    
    
}]
```
