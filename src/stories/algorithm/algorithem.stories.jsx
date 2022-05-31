import {useAnimeManager, useAnimeEffect, SWAP, useAppear, ADD, REMOVE, STATIC} from "../../anime-manager";
import React, {useEffect, useRef, useState} from "react";
import '@animxyz/core'
import {useChangeIntersection, usePrevious} from "../../anime-manager";
import "./algorithem.stories.scss"
import PropTypes from 'prop-types';


export default {
    title: "test/algorithm",
    id: "tests",
    args: {
        samples: [
            'abcde'.split(''),
            'acRe'.split(''),
            'ec'.split(''),
        ]
    },
    parameters: {
        previewTabs: {
            canvas: {hidden: true},
        },
    }
}


export function IntersectionTest(args) {
    const {samples} = args;
    const {current: iterations} = useRef([])
    const [collection, setCollection] = useState( _=> samples.shift())
    const before = usePrevious(collection, [])
    const state = useChangeIntersection(collection);

    useEffect(() => {
        iterations.push({
            before,
            after: collection,
            state
        })
        // if (samples.length) {
            setCollection(samples.shift())
        // }

    }, [state])
    return <>
        <h2>Sort Approach</h2>
        {iterations.map((result,i) => {
            return <div class="stage" key={i}>
                <ColumnItem items={result.before} title="before"/>
                <ColumnItem items={result.after} title="after"/>
                <ColumnStateItem items={result.state} title="changed"/>
            </div>
        })}
    </>

    function ColumnItem(props) {
        const {items, title} = props;
        return <div className="column">
            <h4>{title}</h4>
            {items.map((item, i) => {
                return <div key={i} className="item">{i}: {item}</div>
            })}
        </div>
    }

    function ColumnStateItem(props) {
        let {items, title} = props;

        return <div className="column">
            <h4>{title}</h4>
            {items.map((state, i) => {
                const {item: name, key, from, to, phase} = state;
                return <div key={key} class={"item " + phase}>
                    {i}: {name} ({phase}) {from}→{to} {props?.custom && props?.custom(state)} </div>
            })}
        </div>

    }
}

IntersectionTest.args = {}
IntersectionTest.id = "intersectionAlgorithm"




