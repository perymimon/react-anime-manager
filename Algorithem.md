How it work
---------------
### discover immediate change
if `tracking` changed ( diffrent ref)
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


