import {useAnimeManager, useAnimeEffect, MOVE, useAppear, ADD, REMOVE, STATIC} from "../Anime-Manager";
import React, {useEffect, useRef, useState} from "react";
import '@animxyz/core'
import './anime-manager.stories.css'
import PropTypes from 'prop-types';

const state2class = {
    [ADD]: "xyz-appear",
    [REMOVE]: "xyz-out xyz-absolute",
    [MOVE]: "xyz-in",
    [STATIC]: ''
}

export default {
    title: "Test/sort",
    id: "Tests",
    args: {
        before: 'abcde'.split(''),
        after: 'acRe'.split(''),
    },
    parameters: {
        previewTabs: {
            canvas: {hidden: true},
        },
    }
}

const key = (item) => item;


function controlAlgorithm(before, after) {
    let whatWeHave = new Map(after.map((item, i) => {
        const k = key(item);
        return [k, {item, key: k, phase: ADD, from: Infinity, to: i}]
    }))

    // let union = after.map(item => whatWeHave.get(key(item)));
    let union = [...whatWeHave.values()]

    for (const [index, item] of before.entries()) {
        const k = key(item);
        const afterState = whatWeHave.get(k);

        if (afterState) {
            afterState.from = index;
            afterState.phase = (index == afterState.to ? STATIC : MOVE)
            continue
        }
        const beforeState = {item, key: k, phase: REMOVE, from: index, to: Infinity};
        union.splice(index, 0, beforeState)

    }

    return union;

}

function mergeLists(before, after) {
    let unionMap = new Map(before.map((item, i) => {
        const k = key(item);
        return [k, {item, key: k, phase: REMOVE, from: i, to: Infinity}]
    }))

    for (let [i, item] of after.entries()) {
        let k = key(item);
        let state = unionMap.get(k);
        let phase = state ? (i === state.from) ? STATIC : MOVE : ADD;
        unionMap.set(k, Object.assign(state || {}, {
                key: k, from: Infinity, ...state, item, phase, to: i
            }
        ))
    }

    return [...unionMap.values()];
}


const rank = (a, b) => {
    let r = a.phase == REMOVE ? a.from - 0.1 : a.to;
    return r + ((b.phase == ADD && a.phase == REMOVE) ? 0.5 : 0);
}

function sortAlgorithm(before, after) {
    const items = mergeLists(before, after)

    return items.sort(function itemsSortAlgorithm(a, b) {
            console.log(`${a.item} VS ${b.item}`)
            var aa = rank(a, b);
            var bb = rank(b, a);

            return aa - bb
        }
    )
}

export const ItemsSort = function (args) {
    const {before, after} = args;
    const items = mergeLists(before, after)
    const expected = controlAlgorithm(before, after)
    const sorted = sortAlgorithm(before, after)

    const style1 = {
        display: 'flex',
        flexDirection: 'row',
        gap: '2em'
    };
    const phase2Style = {
        [REMOVE]: {
            textDecoration: 'underline',
            justifyContent: 'start',
        },
        [ADD]: {
            color: 'blue'
        }

    }

    return <>
        <div className="stage" style={style1}>
            <ColumnItem items={before} title="before"/>
            <ColumnItem items={after} title="after"/>
        </div>
        <h2>Sort Approach</h2>
        <div className="stage" style={style1}>
            <ColumnStateItem items={items} title="merge" phase2Style={phase2Style}/>
            <ColumnStateItem items={sorted} title="sorted" phase2Style={phase2Style}/>
            <ColumnStateItem items={expected} title="control" phase2Style={phase2Style}/>
        </div>

    </>
}

function ColumnItem(props) {
    const {items, title, phase2Style} = props;
    return <div className="column">
        <h4>{title}</h4>
        {items.map((item, i) => {
            return <div key={i} className={"item"}>{i}: {item}</div>
        })}
    </div>
}

function ColumnStateItem(props) {
    let {items, title, phase2Style} = props;
    const queue = [];
    const handleClick = (event) => {

    }
    return <div className="column">
        <h4>{title}</h4>
        {items.map((state, i) => {
            const {item: name, key, from, to, phase} = state;
            return <div key={key} style={phase2Style[phase]} className={"item"}>
                {i}: {name} {from}→{to} {props?.custom && props?.custom(state)}</div>
        })}
    </div>

}

ItemsSort.args = {}
ItemsSort.id = "sortAlgorithm"

