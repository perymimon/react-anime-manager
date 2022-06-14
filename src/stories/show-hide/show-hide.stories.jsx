import {useAnimeManager, SWAP, APPEAR, DISAPPEAR, STAY, PREREMOVE} from "../../anime-manager";
import React from "react";
import '@animxyz/core'
import '../stories-style.css'

const xyz = "appear-stagger-2 appear-narrow-50% appear-fade-100% out-right-100%";

export default {
    title: "Test",
    id: "test",
    args: {
        show: true,
    },
    parameters: {
        layout: 'padded',

    }
}

const state2class = {
    [APPEAR]: "xyz-appear",
    [DISAPPEAR]: "xyz-out xyz-absolute",
    [SWAP]: "xyz-in",
    [STAY]: ''
}

/*story: OneChild*/
export function ShowHide(args) {
    const {show} = args;
    const [{item: flag, phase, ref, done}] = useAnimeManager(show);

    /**
     * because there is no element when flag == false. `done` must call explicitly to
     * guide `useAnimeManager` continue with the states flow and show the `true` value when it arrive
     * */
    if (!flag) done()

    return (
        <div>
            <ol className="list-2" xyz={xyz}>{
                flag && <li
                    class={["item", state2class[phase]].join(' ')}
                    ref={ref}
                    onAnimationEnd={done}
                > {String(flag) ? 'in' : 'out'}</li>
            }</ol>
        </div>
    )
}

