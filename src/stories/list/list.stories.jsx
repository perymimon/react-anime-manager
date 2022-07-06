import {
    useAnimeManager, SWAP,
    APPEAR, DISAPPEAR, STAY, PREREMOVE
} from "../../useAnimeManager.js"
// LoginForm.stories.js|jsx

import {within, userEvent} from '@storybook/testing-library';
import React, {useEffect, useRef, useState} from "react";
import '@animxyz/core'


export default {
    title: "Test",
    id: "test",
    argTypes: {
        add: {action: true},
    },
    args: {
        list: [1],
        add() {

        }

    },
}


const xyz = "appear-narrow-50% appear-fade-100% out-right-100%";


function ToolBar(props) {
    const {onAdd, onRemove} = props;

    function handleAdd(e) {
        onAdd(+document.forms.inputs.children.addInput.value);
        e.preventDefault()
    }

    function handleRemove(e) {
        onRemove(+document.forms.inputs.children.removeInput.value);
        e.preventDefault()
    }

    return <form name="inputs" style={{display: 'grid', gridTemplateColumns: '10em 10em'}}>
        <button onClick={handleRemove}>remove from</button>
        <input name="removeInput" defaultValue={1}/>
        <button onClick={handleAdd}>add in</button>
        <input name="addInput" defaultValue={0}/>
    </form>
}

function add(internalList, setList, counterRef, index) {
    internalList.splice(index, 0, ++counterRef.current);
    setList([...internalList]);
}

function remove(internalList, setList, counterRef, index) {
    let pos = Math.min(internalList.length - 1, +index);
    setList(internalList.filter((c, i) => i !== pos));
}

function onDone({dom}) {
    dom.classList.remove('xyz-appear')
    dom.classList.remove('xyz-in')
}

export function List({list}) {
    const [internalList, setList] = useState(list)
    const counterRef = useRef(list.length)
    const items = useAnimeManager(internalList, {onMotion, onDone});

    function onMotion({dom, phase, dx, dy}) {
        const state2class = {
            [APPEAR]: "xyz-appear",
            [DISAPPEAR]: "xyz-out xyz-absolute",
            [PREREMOVE]: "xyz-absolute",
            [DISAPPEAR]: "xyz-out xyz-absolute",
            [SWAP]: "xyz-in",
            [STAY]: 'static'
        }
        dom.style.setProperty("--xyz-translate-y", `${dy}px`)
        if (!dom.classList.contains(state2class[phase])) {
            dom.classList.add(...state2class[phase].split(' '))
        }
    }

    return <div>
        <ToolBar
            onAdd={add.bind(this, internalList, setList, counterRef)}
            onRemove={remove.bind(this, internalList, setList, counterRef)}
        />
        <ol className="list-1" xyz={xyz} style={{animationDuration: '3s'}}>
            {items.map((state) => {
                    const {item: number, phase, ref, done, dx, dy, from, to} = state;
                    return <li key={'key' + number}
                               className="item"
                               ref={ref}
                               onAnimationEnd={done}
                    >item:{number} from:{from} to:{to} dx:{~~dx} dy:{~~dy} {phase}</li>
                }
            )}
        </ol>

    </div>
}

List.play = async function ({canvasElement}) {
    const canvas = within(canvasElement)

    // // add to row 0
    // // userEvent.type(canvas.getByLabelText('add-from'), '0')
    // // add element
    // await userEvent.click(canvas.getByText('add in'))
    //
    // // remove element
    // await userEvent.click(canvas.getByText('remove from'))
}

export function List2AbsMove({list}) {
    const [internalList, setList] = useState(list)
    const counterRef = useRef(list.length)
    const items = useAnimeManager(internalList, {onMotion, onDone});

    function onMotion({dom, phase, trans_dx, trans_dy}) {
        const state2class = {
            [APPEAR]: "xyz-appear",
            [DISAPPEAR]: "xyz-out xyz-absolute",
            [SWAP]: "xyz-in",
            [STAY]: 'static'
        }
        dom.style.setProperty("--xyz-translate-y", `${trans_dy}px`)
        if (!dom.classList.contains(state2class[phase])) {
            dom.classList.add(...state2class[phase].split(' '))
        }
    }

    return <div>
        <ToolBar
            onAdd={add.bind(this, internalList, setList, counterRef)}
            onRemove={remove.bind(this, internalList, setList, counterRef)}
        />

        <ol className="list-1" xyz={xyz} style={{animationDuration: '3s'}}>
            {items.map((state) => {
                    const {item: number, phase, ref, done, trans_dx, trans_dy, from, to} = state;
                    return <li key={'key' + number}
                               className="item"
                               ref={ref}
                               onAnimationEnd={done}
                    >item:{number} from:{from} to:{to} trans_dx:{~~trans_dx} trans_dy:{~~trans_dy} {phase}</li>
                }
            )}
        </ol>

    </div>

}

export function ListMetaMove({list}) {
    const [internalList, setList] = useState(list)
    const counterRef = useRef(list.length)
    const items = useAnimeManager(internalList, {onMotion, onDone});

    function onMotion({dom, phase, meta_dx, meta_dy}) {
        const state2class = {
            [APPEAR]: "xyz-appear",
            [DISAPPEAR]: "xyz-out xyz-absolute",
            [SWAP]: "xyz-in",
            [STAY]: 'static'
        }
        if( phase in state2class) {
            const className = (state2class[phase]).split(' ')
            dom.style.setProperty("--xyz-translate-y", `${meta_dy}px`)
            dom.classList.add(...className)
        }
    }

    return <div>
        <ToolBar
            onAdd={add.bind(this, internalList, setList, counterRef)}
            onRemove={remove.bind(this, internalList, setList, counterRef)}
        />
        <ol className="list" xyz={xyz} style={{animationDuration: '3s'}}>
            {items.map((state) => {
                const {
                    key, item: number, phase, ref, done, meta_dx,
                    meta_dy, from, to, meta_from, meta_to,
                } = state;
                return (
                    <li key={key} className="item" ref={ref} onAnimationEnd={done}>
                        ITEM:{number} FROM:{meta_from}({from}) TO:{meta_to}({to})
                        META_DX:{~~meta_dx} META_DY:{~~meta_dy} {phase}
                    </li>
                )
            })}
        </ol>
    </div>
}
