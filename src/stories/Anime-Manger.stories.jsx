import {useAnimeManager, useAnimeEffect, MOVE, useAppear, ADD, REMOVE, STATIC,PREREMOVE} from "../Anime-Manager";
import React, {useEffect, useRef, useState} from "react";
import '@animxyz/core'
import './Anime-Manger.stories.css'
import PropTypes from 'prop-types';

const state2class = {
    [ADD]: "xyz-appear",
    [REMOVE]: "xyz-out xyz-absolute",
    [PREREMOVE]: "xyz-absolute",
    [REMOVE]: "xyz-out xyz-absolute",
    [MOVE]: "xyz-in",
    [STATIC]: ''
}

export default {
    title: "Examples/AnimeManager",
    id: "Examples",
    args: {
        xyz: "appear-stagger-2 appear-narrow-50% appear-fade-100% out-right-100%",
    },
    argTypes: {
        xyz: String,
    },
    parameters: {
        layout:'padded',
        previewTabs: {
            canvas: {hidden: true},
        },
    }
}

export const CounterDemo1 = function ({...args}) {
    const [count, setCounter] = useState(1)
    const states = useAnimeManager(count)

    useEffect(_ => {
        setTimeout(_ => {
            setCounter(count + 1);
        }, 1500)
    }, [count])

    return states.map(({item: number, key, phase, done}) => (
        <div xyz={args.xyz} key={key} className={"item " + state2class[phase]}
             onAnimationEnd={done}>{number}</div>
    ))
}
CounterDemo1.args = {}
CounterDemo1.id = "counter-1"

export const CounterDemo2 = function ({...args}) {
    const [count, setCounter] = useState(1)
    const {item: number, key, phase, done} = useAnimeManager(count, {oneAtATime: true})
    const state2class2 = {...state2class, [REMOVE]: 'xyz-out'}
    useEffect(_ => {
        setTimeout(_ => setCounter(1 + count), 1000)
    }, [count])

    return <div xyz={args.xyz} key={key}
                className={"item " + state2class2[phase]}
                onAnimationEnd={done}>{number}</div>

}
CounterDemo2.args = {}
CounterDemo2.id = "counter-2"


/*story: OneChild*/
export const ShowHide = ({...args}) => {
    const [show, setShow] = useState(true);
    const {item: flag, phase, dx, dy, ref, done} = useAnimeManager(show, {
        oneAtATime: true,

    });

    function toggle() {
        setShow(!show)
    }

    /**
     * because there is no element when flag == false. `done` must called explicitly to
     * guide `useAnimeManager` continue with the states flow and show the `true` value when it arrive
     * */
    if (!flag) done()

    return <div>
        <button onClick={toggle}>{show ? 'To hide' : 'To show'}</button>
        <ol className="list-2" xyz={args.xyz}>{
            flag && <li
                className={["item", state2class[phase]].join(' ')}
                ref={ref}
                onAnimationEnd={done}
            >one InOut value:{String(flag)}</li>
        }</ol>
    </div>
}

ShowHide.args = {
    showHide: true,
}


export function ComponentList({list, classAppear, classIn, classOut, ...args}) {
    const [internalList, setList] = useState(list)
    const counter = useRef(list.length)
    const items = useAnimeManager(internalList, {useEffect: true});

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


    return <div>
        <div style={{display: 'grid', gridTemplateColumns: '10em 10em'}}>
            <button onClick={remove}>remove from</button>
            <input type="text" id="remove-from" defaultValue={10}/>
            <button onClick={add}>add in</button>
            <input type="text" id="add-from" defaultValue={0}/>
        </div>
        <ol className="list-1" xyz={args.xyz} style={{animationDuration: '3s'}}>
            {items.map(({item: number, phase, ref, done, dx, dy, from, to, nextPhases}) => {

                return <li key={'key' + number}
                               className={["item", state2class[phase]].join(' ')}
                               ref={ref}
                               style={{"--xyz-translate-y": `${dy}px`}}
                               onAnimationEnd={done}
                    >{number} from:{from} to:{to} dx:{dx} dy:{dy} {nextPhases.join(',')}</li>
                }
            )}
        </ol>
    </div>
}

ComponentList.args = {
    list: [1, 2]
}

function AnimeLatter() {

    const marks = ['✗', '○'];

    const [board, setBoard] = useState([]);
    const Board = Array.from({length: 9}).map((_, i) => {
        return board[i]
    })

    function handleBoard(mark) {
        return function () {
            const i = Math.floor(Math.random() * 9)
            const mark = marks[Math.floor(Math.random() * 2)];
            board[i] = mark;
            setBoard([...board]);
        }
    }

    return <div>
        <button onClick={handleBoard('✗')}>add ✗</button>
        <button onClick={handleBoard('○')}>add ○</button>
        <div className="board">
            {Board}
        </div>

    </div>
}

export function PositionVsLocation({deltaStyle, trackingItems}) {
    const [_, forceRender] = useState();

    const itemsState = useAnimeManager(trackingItems, {
        key: 'id',
        useEffect: true,
        deltaStyle,
        protectFastChanges: false
    });

    const abc =  itemsState.map(({item, key, phase, ref, dx, dy,  dom, nextPhases}, index) => {
        const style = {
            width: '25em',
            '--dx': dx,
            '--dy': dy,
            transform: [PREREMOVE, REMOVE].includes(phase) ? `translate(100%)` : ''
        }
        const className = {
            [REMOVE]: 'animation'
        }
        return <div key={key} style={style}
                    className={['item', className[phase]].join(' ')}
                    ref={ref}>{key}: {item.name} dx:{dx} dy:{dy} phase:{phase} next:{nextPhases.join(',')}</div>
    })

    return abc;
}

PositionVsLocation.args = {
    trackingItems: [{name: 'foo', id: 1}, {name: 'bar', id: 2}, {name: 'goo', id: 3}],
    deltaStyle: 'byPosition',
}
PositionVsLocation.argTypes = {
    deltaStyle: {
        control: {
            type: 'radio',
            options: ['byPosition', 'byLocation']
        }
    }
}
PositionVsLocation.id = "position-vs-location"