## Welcome to React Animation Manager version 2.0
Rewrite from bottom up with abilities already by default to handle fast changes and calculate dom movement

# Getting Started
## What is React-Animation-Manger
React-Anime-Manager is a hook approach for React that stabilize fast-rate of data changes and bring metadata of the changes to developer, so he has a chance to made appropriate animation on each item according to the phase of the change.

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

metadata = useAnimeManager( tracking [,key|options])

options = {
    key:undefined,
    oneAtATime:  !Array.isArray(tracking),
    instantChange : false,
}
```
● `tracking`: Can be Object, primitive, or array-like of objects.  
`Primitive: true/false 0/1/2/3 "foo" | "bar"`  
`Array of objects:[{name:'foo',id:1},{name:'bar',id:2}]`

● `key`: case-sensitive string represented object's key-name that can identify each item of the tracking array. `key` can be set literal at the second parameter or,if object is provide, inside the object options. `key` used when tracking is object or array of objects. If tracking is primitive that parameter is not mandatory and the actual value of the primitive can be used as the key.

`useAnimeManager(tracking, 'id')`  
`useAnimeManager(tracking, {key:'id'})`

● `metadata`: the result of whole calculation. return array with metadata knowledge for each item on tracking array as describe [here](/#ItemState instance)

### Options object config
● `options.key`: as `key` above

**depraced**
● `options.oneAtATime:boolean` default depend on the first tracking that go into the hook. if it array default is false, if not value is true;
that control if retunts metadata will be arrayed or object of the first (oldest) tracking item.

### key of each item in metadata array

● `state.item` Original item that metadata refers to on the `tracking` parameter.

● `state.key` Key actually used to identify the item. It can be the value of `key` identifier or the item himself depending on the circumstances/
it can used as `key` argument on the JSX element. so will be correlation between item key to React component key.

● `state.phase`, A enum string, indicate the item's phases:
* `STATIC` - set when nothing changed from last time tracking update
* `ADDED` - set when it is the first time item shown on the tracking parameters, after `done()` called the phase change to `STATIC`
* `SWAP` - set when `item` appear in diffrent location on the array (e.g: moved from index 3 to index 4).  After calling `done()` the phase change to `STATIC`.
* `REMOVED` - `item` are no longer on the `tracking` parameter.  after `done()` it removed completely from metadata array

●  `state.done()`: Callback function that must call every time developer finish deal with current phase. so it can be jumped to next phase.

●  `state.from`: where item was in previous tracking array. if phase is ADDED the value will be same as `metadata.to`

● `state.to`: where item on current tracking array. If phases is REMOVED the value will be same as `metadata.from`

● `state.meta_from`: where item was in previous metadata array

● `metadata.meta_to`: where item on current metadata array

● `metadata.ref`: Instance of `React.createRef`.`useAnimeManger` hold it to have a reference to Real Dom element the tracking item create. Developer should attach it to React generated component, Without that, `dx` & `dy` will be `0` constantly.

● `metadata.dom`: A dom reference, equal to `metadata.ref.current`.

For next variables if ref == dom they calculated otherwise they equal to :0
● `metadata.{trans_dx:number,trans_dy:number}`: `trans_dx`&`trans_dy` hold the distance that relevant dom moved between previous render and current one. that variables updated after `React.useEffect` and developer can read them immediately after that on callback `oneffect(state)`

● `metadata.{dx:number,dy:number}`: same as above but calculate the distance between dom on
tracking array as position `metadata.from` and `metadata.to`
