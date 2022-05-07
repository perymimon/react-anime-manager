import {useAnimeManager, useAnimeEffect, MOVE, useAppear, ADD, REMOVE, STATIC, PREREMOVE} from "../../Anime-Manager";
import React, {useEffect, useRef, useState} from "react";
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
    [ADD]: "xyz-appear",
    [REMOVE]: "xyz-out xyz-absolute",
    [PREREMOVE]: "xyz-absolute",
    [REMOVE]: "xyz-out xyz-absolute",
    [MOVE]: "xyz-in",
    [STATIC]: ''
}

/*story: OneChild*/
export function ShowHide(args) {
    const {show} = args;
    const {item: flag, phase, ref, done} = useAnimeManager(show, {
        oneAtATime: true,
    });

    /**
     * because there is no element when flag == false. `done` must call explicitly to
     * guide `useAnimeManager` continue with the states flow and show the `true` value when it arrive
     * */
    if (!flag) done()

    return <div>
        <ol className="list-2" xyz={xyz}>{
            flag && <li
                class={["item", state2class[phase]].join(' ')}
                ref={ref}
                onAnimationEnd={done}
            >one InOut value:{String(flag)}</li>
        }</ol>
    </div>
}

