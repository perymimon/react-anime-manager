import {
    useAnimeManager, MOVE,
    ADD, REMOVE, STATIC, PREREMOVE
} from "../../Anime-Manager"

import React, {useEffect, useRef, useState} from "react";
import '@animxyz/core'


const xyz = "appear-stagger-2 appear-narrow-50% appear-fade-100% out-right-100%";

export default {
    title: "Test",
    id: "test",
    argTypes: {
        add: { action: true },
    },
    args: {
        list: [1, 2, 3],
        add(){

        }

    },
}

const state2class = {
    [ADD]: "xyz-appear",
    [REMOVE]: "xyz-out xyz-absolute",
    [PREREMOVE]: "xyz-absolute",
    [REMOVE]: "xyz-out xyz-absolute",
    [MOVE]: "xyz-in",
    [STATIC]: ''
}

export function List({list}) {
    const [internalList, setList] = useState(list)
    const counter = useRef(list.length)
    const items = useAnimeManager(internalList, {useEffect: true});

    return <div>
        <ol className="list-1" xyz={xyz} style={{animationDuration: '3s'}}>
            {items.map((state) => {
                    const {item: number, phase, ref, done, dx, dy, from, to, nextPhases} = state;
                    return <li key={'key' + number}
                               className={["item", state2class[phase]].join(' ')}
                               ref={ref}
                               style={{"--xyz-translate-y": `${dy}px`}}
                               onAnimationEnd={done}
                    >{number} from:{from} to:{to} dx:{~~dx} dy:{~~dy} {phase} }]</li>
                }
            )}
        </ol>

        <div style={{display: 'grid', gridTemplateColumns: '10em 10em'}}>
            <button onClick={remove}>remove from</button>
            <input type="text" id="remove-from" defaultValue={10}/>
            <button onClick={add}>add in</button>
            <input type="text" id="add-from" defaultValue={0}/>
        </div>
    </div>

    function add() {
        let index = document.getElementById('add-from').value;
        internalList.splice(+index, 0, ++counter.current)
        setList([...internalList]);
    }

    function remove() {
        let index = document.getElementById('remove-from').value;
        let pos = Math.min(internalList.length - 1, +index);
        setList(internalList.filter((c, i) => i !== pos));
    }
}
