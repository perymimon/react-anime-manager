//# inspiration from https://codesandbox.io/s/reorder-elements-with-slide-transition-and-react-hooks-flip-211f2?file=/src/AnimateBubbles.js
import React, {createRef, useRef, useState, useEffect, useLayoutEffect, useMemo} from "react";
import LetMap from './let-map-basic'

export const STATIC = 'static', ADD = 'added', REMOVE = 'removed', MOVE = 'move';
export const PREREMOVE = 'preremoved', PREMOVE = 'premove';
const wmKeys = new WeakMap();

function keyGenerator(item, i) {
    let key = wmKeys.get(item)
    if (key) return key;
    // todo: make it work like a counter instead of random
    const str = 'abcdefghijklmnop1234567890'
    const {random, floor} = Math;
    key = Array.from({length: 4}, (i) => str[floor(random() * str.length)]).join('');
    return key;
}

export function usePrevious(value, initialValue, changedTracker) {
    const ref = useRef(initialValue);
    useEffect(() => {
        ref.current = value;
    }, [changedTracker ?? value]);
    return ref.current;
}

export function useAppear() {
    const flag = useRef(true);
    useEffect(_ => {
        flag.current = false;
        return _ => flag.current = true;
    }, []);
    return flag.current;
}

function useDebounceRender() {
    const {current: resolvers} = useRef([]);
    const [_, forceRender] = useState([]);

    function render() {
        return new Promise((res, rej) => {
            resolvers.push(res)
            if (resolvers.length > 1) return;
            window.requestAnimationFrame(_ => {
                forceRender([]);
                for (let res of resolvers)
                    res()
                resolvers.length = 0;
            })
        })
    }

    return render;
}

function useLongTimeMemory() {
    const {current: memory} = useRef(new LetMap(key =>
        new Proxy({key, item: null, pipe: [], done: null, ref: null, dom: null, dx: 0, dy: 0}, proxyHandler)
    ))

    const proxyHandler = {
        get(record, prop, receiver) {
            let exporter = (_ => {
                if(!record) debugger
                if (prop in record) return record[prop]
                let state = record.pipe[0]
                if (prop in state) return state[prop]
            })()

            return typeof exporter == 'function' ?
                exporter.bind(receiver) :
                exporter
        },
        set(record, prop, value) {
            if(!record) debugger
            if (prop in record) {
                record[prop] = value
                return true
            }
            record.pipe[0][prop] = value;
            return true
        }
    }
    return memory
}

export function useAnimeManager(tracking, options = {}) {
    let {oneAtATime = !Array.isArray(tracking), postEffect, onAnimationEnd, instantChange = false} = options;

    /** long time memory */

    const memory = useLongTimeMemory()

    const [current,currentHash] = useChangeIntersection(tracking, options, true);
    const forceRender = useDebounceRender();

     useMemo((_) => {
        /**
         * after Intersection
         * 1) add done callback
         * 2) add dom ref for each record
         * 3) hold on prev state if it is not done (it ADD or MOVE or REMOVE)
         * 4) return convert state to record ( same just with ability to pipe states )
         */

        /** Create records from states */
        for (let [key, state] of currentHash) {
            /** Build record and add state to record pipe*/
            let {item, key} = state;
            // clean item from state
            delete state.item // protect from memory leak
            delete state.key  // just clean it
            // create new entry in the long-time-memory
            let record = memory.let(key)

            record.item = item // update item to the most updated one
            record.ref ??= createRef()
            record.done ??= doneFactory(forceRender, memory, onAnimationEnd)
            if (state.phase === STATIC) continue
            if (record.pipe[0]?.phase == STATIC)
                record.pipe.shift()
            record.pipe.push(state)

            // check edge cases:
            // 1) merge two MOVE
            /// lastState.phase === state.phase are just if the phase === MOVE
            // if (lastState?.phase === state.phase) {
            //     record.pipe.pop()
            //     lastState.to = state.to
            // }
        }

        /** warn from slow removed animations */
        WARNS(memory.size > 0 && (memory.size % 10) == 0 && oneAtATime, 'overflow', memory.size)
    }, [current])

    const records =useMemo(_=>{
        let records = []
        for (let state of current) {
            records.push(record)
        }
        if (oneAtATime) {
            for (let [key, record] of memory)
                return [record]
        }
        /**
         * 3) retrieve old not finish REMOVE items
         */
        for(let [key, record] of memory){
            if ( currentHash.has(key) ) continue
            // assuming record still in the memory but not in current
            // mean it in  REMOVE State
            records.splice(record.from, 0, record)
        }
        return records
    },[current])


    /** calculate the move and bring the DOM */
    useLayoutEffect(_ => {
        for (let [key,record] of memory) {
            let {ref: {current: dom}, from} = record
            if (!dom) continue
            if (!(from == Infinity)) {
                let boxFrom = records[from].ref.current?.getBoundingClientRect()
                let boxCurrent = dom.getBoundingClientRect()
                record.dx = boxFrom.x - boxCurrent.x
                record.dy = boxFrom.y - boxCurrent.y
                // record.phase = record.phase.replace('pre', '')
            }
            record.dom = dom
        }
        // do it after calculation so callback triggered animation not disruption calculation
        for (let record of records) {
            postEffect?.(record)
        }

    }, [records])

    return oneAtATime? records[0]: records
}

function doneFactory(forceRender, memory, onAnimationEnd) {
    return async function done() {
        let record = this;
        const {key, phase} = record;
        if (phase == STATIC) return;

        if (phase === ADD || phase === MOVE) {
            record.phase = STATIC;
            record.from = record.to;
            record.dx = record.dy = 0;
            await forceRender();
            onAnimationEnd?.(record)
            if (record.pipe.length > 1) {
                record.pipe.shift();
                forceRender()
            }
            return null;
        }
        if (phase === REMOVE) {
            record.pipe.shift()
            if (record.pipe.length == 0) {
                memory.delete(key)
            }
            return forceRender(record)
        }
    }
}

/** just use the key on two runs of the running component ( with different array reference )
 to find which item added or removed */
export function useChangeIntersection(tracking, options = {}, exportHash) {
    let {key} = options;
    key = key ?? options /*options consider as string*/;
    const current = [tracking].flat(1) // convert tracking to array
    const before = usePrevious(current, [], tracking);

    // if key not provided, use the keyValue at that position as key
    const getKey = (_ => {
        if (typeof key === 'function') return key // key(item,i);
        if (key === 'index') return (item, i) => i;
        if (key === 'generate') return keyGenerator // (item,i);
        if (typeof key === 'string') return (item, i) => item[key]
        return (item, i) => item;
    })();

    return useMemo(_ => {
        const hashMap = new Map()
        const exportOrder = []
        // register current items and assume they ADD
        for (let [i, item] of current.entries()) {
            let k = getKey(item, i);
            let state = {item, key: k, phase: ADD, from: Infinity, to: i}
            hashMap.set(k, state)
            exportOrder.push(state)
        }
        // register previous items,compare location to understand if they Removed,Static, Move
        for (let [i, item] of before.entries()) {
            let k = getKey(item, i);
            let state = hashMap.get(k);
            let phase = state ? (i === state.to) ? STATIC : MOVE : REMOVE;

            if (phase === REMOVE) {
                state = {key: k, from: i, to: Infinity, item, phase}
                exportOrder.splice(i, 0, state)
                hashMap.set(k, state)
            } else Object.assign(state, {from: i, phase})
        }
        if (exportHash) return [exportOrder, hashMap]
        return exportOrder;

    }, [tracking])
}

function WARNS(test, code, arg0) {
    const codes = {
        'overflow':
            `above then ${arg0} items pending to draw. consider faster your animation`,
        'deltaStyle':
            `delta style can be: "byPosition" or "byLocation", current:${arg0}`
    }

    test && console.warn(codes[code])
}

export default useAnimeManager