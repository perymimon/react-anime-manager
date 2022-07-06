import {
    useAnimeManager, SWAP,
    APPEAR, DISAPPEAR, STAY, PREREMOVE
} from "../../useAnimeManager.js";
import React, {useEffect, useState} from "react";
import '@animxyz/core'
import './counter.css'

let xyz = "appear-stagger-2 appear-narrow-50% appear-fade-100% out-right-100%"
export default {
    title: "test",
    id: "test",
    args: {},
    argTypes: {
        xyz: String,
    },
    parameters: {
        layout: 'padded',
        previewTabs: {
            canvas: {hidden: true},
        },
    }
}

const state2class = {
    [APPEAR]: "xyz-appear",
    [DISAPPEAR]: "xyz-out xyz-absolute",
    [SWAP]: "xyz-in",
    [STAY]: ''
}

export const Counter1 = function ({...args}) {
    const [count, setCounter] = useState(1)
    const states = useAnimeManager(count)

    useEffect(_ => {
        useEffect(() => {
            const id = setInterval(() => {
                setCounter(c => c + 1); // ✅ This doesn't depend on `count` variable outside
            }, 1000);
            return () => clearInterval(id);
        }, []); // ✅ Our effect doesn't use any variables in the component scope
    }, [count])

    return (
        <div class="stage">
            {states.map(({item: number, key, phase, done}) => (
                <div xyz={xyz} key={key} class={"item " + state2class[phase]}
                     onAnimationEnd={done}>{number}</div>
            ))}
        </div>
    )
}
Counter1.args = {}
Counter1.id = "counter-1"

export const CounterOneAtTime = function ({...args}) {
    const [count, setCounter] = useState(1)
    const [{item: number, key, phase, done}] = useAnimeManager(count)
    const state2class2 = {...state2class, [DISAPPEAR]: 'xyz-out'}
    useEffect(_ => {
        setTimeout(_ => setCounter(1 + count), 1000)
    }, [count])

    return (
        <div class="stage">
            <div xyz={xyz} key={key}
                 className={"item " + state2class2[phase]}
                 onAnimationEnd={done}>{number}</div>
        </div>
    )


}
CounterOneAtTime.args = {}
CounterOneAtTime.id = "counter-2"

