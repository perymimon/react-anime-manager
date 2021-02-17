import './App.css';
import '@animxyz/core'
import React, {useRef, useState, useEffect, useLayoutEffect} from "react";
import Anime from './Anime.js';
// import reportWebVitals from "./reportWebVitals";
// reportWebVitals(console.log);

function App() {
    const [list, setList] = useState([1, 2, 3, 4, 5])
    const counter = useRef(list.length)

    function add() {
        let pos = ~~(Math.random() * list.length);
        list.splice(pos,0,++counter.current)
        setList([...list]);
    }

    function remove() {
        let pos = ~~(Math.random() * list.length);
        setList(list.filter( (c,i)=> i!== pos ));
    }

    const [inout, setit] = useState(true);

    function handleInout() {
        setit(!inout);
    }

    return (
        <div className="App">
            <button onClick={add.bind(0)}>add in random</button>
            <button onClick={remove.bind(0)}>remove from random</button>
            <h1>list 1</h1>
            <ol className="list-1">
                <Anime xyz="appear-stagger-2 narrow-50% fade-100%"
                       classIn="xyz-in"
                       classOut="xyz-out xyz-absolute">
                    {list.map((number) => (
                        <li key={'key' + number} className="item">{number}</li>
                    ))}
                </Anime>
            </ol>

            <h1>list 2 - one element</h1>
            <button onClick={handleInout}>{inout ? 'OUT' : 'IN'}</button>
            <ol className="list-2">
                <Anime xyz="appear-stagger-2 narrow-50%">
                    {inout && <li className="item">0000</li>}
                </Anime>
            </ol>

            <h1>list 3 - one element</h1>
            <ol className="list-3">
                <Anime xyz="appear-stagger-2 fade-25% perspective origin-top flip-up-25%"
                       classOut="xyz-out" classMove="my-xyz-move"
                       yCssProperty={false}>
                    {list.map((number, index) => (
                        <li key={'key' + number} className="item-3">{number}</li>
                    ))}
                </Anime>
            </ol>
        </div>
    );
}

export default App;
