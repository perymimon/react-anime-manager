useAnimeManager
-------------
`useAnimeManager` let you manage the animation of a list of items. it represents the list of items as a `tracking` array and each item is represented by a `state` object. `state` is result of comparing current tracking with previous tracking.

the primary key on the `state` are `phase` that represent the current phases of the item: APPEAR, DISAPPEAR, SWAP, and STAY. Also, important are `from` and `to` that say where item was in the previous tracking and where is it now. And derived from them are `meta_from` and `meta_to` that say where item was in the previous `stats` list and where is it now on the `stats` list. they are diffrent position because `states` is aggragate of all phases that were before and did not finish yet, as well as items that were removed from the tracking array few cycle before but there not done yet. so `meta_from` and `meta_to` are completely different place from `from` and `to`

 
This specification details the behavior of the `phase`, `from`,`to`,`meta_from` and `meta_to` attributes.,

Terminology
------------
`motion keys` are the keys on state: dx, dy, trans_dx, trans_dy, meta_dx, meta_dy
* `pipe` abstract place to store the phases of a state
* `react-render-cycle` cycle goes from after `useEffect` to after `useEffect`
* `active phases` APPEAR, DISAPPEAR, SWAP
* `delta keys`

0. `item` : is the item that is being tracked, one part of the `tracking` array.
1. `tracking`: is the array of data items that JSX component created from them will be animated.
2. `state`: is the result of comparing current tracking with previous tracking.
3. `phase`: is the current phase of the item, it can be: APPEAR, DISAPPEAR, SWAP, and STAY.
4. `from`: is the index of the item in the previous tracking array.
5. `to`: is the index of the item in the current tracking array.
6. `meta_from`: is the index of the item in the previous result of `useAnimeManager`.
7. `meta_to`: is the index of the item in the current result of `useAnimeManager`.
* 8. `done`: is a function that must be called every time developer finish deal with current phase. so it can be transitioned to next phase.
9. `key`: is the key actually used to identify the item when comparing. It can be the value of `item[key]` identifier or the item himself depending on the circumstances. 
10. `onMotion` : is callback function that will be called one for each item after all items' motion keys updated and  when tracking is updated or when one `state` on `states` are change phase.
11. `onDone` : is a callback function that will be called once for state after there done() are called and is state was not STAY

Specification  
--------------
each new item in the tracking array will be represented by a new `state` object.

same state must be provided on one react-render-cycle

state, phase
--------------
each new item will start with APPEAR.
each state must pointed to most recent item, all the time. 

when updated tracking array will arrive, new `phase` calculated for the item(*):
if item is on the same index on tracking array as in the previous tracking array, it will be 'STAY'.
if item was not in the previous tracking array, it will be 'APPEAR'.
if item index on tracking array is different from the previous tracking array, it will be 'SWAP'.
if item not in the tracking array anymore, it will be 'DISAPPEAR'.

if phase is not STAY it piped to the state.

`phase` current value will be the first phase on the state's pipe.

when done() called:
if current phase are APPEAR or SWAP 
* phase become STAY,
* current `phase` removed from the pipe,
* render cycle will be made, 
* when it finished, if pipe contain more phases `state.phase` will be the next `phase` that piped and another render cycle will be made.

if current phase is DISAPPEAR
* state will be removed from the `states` array 
* render cycle will be made.
* when it finished, if pipe contain more phases `state.phase` will be the next `phase` that piped and another render cycle will be made.


(*) Here, "same item" means immutable identity (i.e. ===) of the `state.key`, but does not imply deep immutability.

state, from and to
-----------------







a `state.phase` must be in one of the four following values: APPEAR, DISAPPEAR, SWAP, and STAY.
1. When item is first appear on the tracking array, it's phase is APPEAR.
   1. may transition to either STAY, SWAP or DISAPPEAR.
2. When item is removed from the tracking array, it's phase is DISAPPEAR.
   1. may transition to either APPEAR.
3. When item is moved from one index to another, it's phase is SWAP.
   1. may transition to either SWAP again STAY or DISAPPEAR. 
4. When item is not moved, it's phase is STAY.
   1. may transition to either SWAP or DISAPPEAR. 








How it work
---------------
### discover immediate change
if `tracking` changed ( changed mean diffrent ref)
- `useChangeIntersection` compare last `tracking` with the current `tracking` and return `intersection[]` array 
- each block of `intersection[]` contain `{ item, from , to , phase }` relative to the last two `tracking` array

if `instantChange` is active, that enough and, goto "useMotion()"

### rebuild intersection
protecting `fast-changed` by buffered the `states`:
- push each state into `memory`
  - memory.push(key, { key, item, pipe:[{phase,from, to], meta_from })
  - (experimental) if `dense` is active dense pipeline:
    - swap1 -> swap2 => (swap1.to = swap2.to)
    - add-> remove => none
    - remove->add => none

now, there is 2 strategies for rebuilding `intersection[]`:
option-1:
- replace each `state` in `intersection[]` with state from `memory.peek(state.key)`
- add the remainder `state` of `memory.peek(state.key)` as removed  
option-2:
- peak each item from memory and sort them by `state.to` and `phase REMOVE`

### calculate `meta_from` `meta_to` 
they should represent practical position and movement on `intersection` after adding back the old `removed` phases

- as long as state remember the `meta_from` just `meta_to` need to update when `intersection[]` reference's changed or item drop from it 
- `meta_from` should set in the first time item inserted to `intersection[]` and reset to `meta_to` when animation `done()` 
### useMotion


