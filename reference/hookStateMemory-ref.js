import LetMap from "../../let-map/src/let-map-basic.js";
import {DISAPPEAR, STAY, SWAP} from "../src/useAnimeManager.js";
import {useRef} from "react";
import {debounce} from "../src/helpers.js";
import {WARNS} from "../src/warns.js";

export function useStateMemory(time, skip) {
    // todo: why useref can't take init function
    const {current: memory} = useRef(new StateMemory(time))

    //todo: clear memory after unbound
    // useEffect(_ => {
    //     return (_) => memory.clear()
    // },[])

    return memory;
}

class StateMemory extends LetMap {
    constructor(time, ...args) {
        super(...args);
        this.hasCHange = false;
        this.initStruct(key => ({
            item: null,
            pipe: [],
            key: key,
            resetOverTimeWarning: debounce(function () {
                const record = this
                WARNS(record.phase !== STAY, 'overtime', record.phase, time, record)
            },)
        }))
    }

    delete(key) {
        this.needFlush = true;
        super.delete(key);
    }

    shift(key) {
        let record = this.get(key);
        record.pipe.shift()
        this.needFlush = record.pipe.length > 0;
        return Object.assign(record, record.pipe[0])
    }

    push(state) {
        this.needFlush = !this.has(state.key);
        let record = this.let(state.key)
        this.needFlush ||= record.pipe.length === 0;

        let {item, key, ...rest} = state
        record.item = item;

        // if two state with same version, pop the oldest one
        if (record.pipe.at(-1)?.ver === state.ver) {
            record.pipe.pop()
        }

        record.pipe.push(rest)
        if (record.pipe.length === 1) {
            record.resetOverTimeWarning()
        }
        return Object.assign(record, record.pipe[0])
    }


}
