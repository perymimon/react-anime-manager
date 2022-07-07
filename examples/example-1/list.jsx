import React from 'react'
import ReactDOM from 'react-dom/client'
import './list.scss'

import useArray from '@perymimon/react-hooks/useArray'
import useAnimeManager from "../../src/useAnimeManager.js";

let counter = 50;
export function List() {
    let {array, push, pop, shift, unshift} = useArray([10, 20, 30, 40])
    let [numbersRecord, traverse] = useAnimeManager(array)
    return (
        <div className="app">
            <p>
                Just print the trace's record from useAnimeManager after simple
                array tracing operation.
            </p>
            <p>
                the toolbar allow you to add/remove/shift/unshift items in the array.
                that array simulate the data from the server.
                you can see how the trace's records update after each operation
                but freeze on current one until <code>done()</code> are called then it continue to show the next operation.
                that give you the time to finish current animation as you can see in the next example.
            </p>

            <section className="dl-blurbs">
                <input type="text" value={array}/>
                <ul className="toolbar cf">
                    <li onClick={pop}>Pop</li>
                    <li onClick={shift}>Shift</li>
                    <li onClick={_=>push(counter+=10)}>Push({counter+10})</li>
                    <li onClick={_=>unshift(counter+=10)}>Unshift({counter+10})</li>
                </ul>
                <table className="rwd-table">
                    <tr>
                        <th>item</th>
                        <th>phase</th>
                        <th>from</th>
                        <th>to</th>
                        <th>done</th>
                    </tr>
                    {traverse((record) => (
                        <tr>
                            <td>{record.item}</td>
                            <td>{record.phase}</td>
                            <td>{record.from}</td>
                            <td>{record.to}</td>
                            <td><button onClick={record.done}>done</button></td>
                        </tr>
                    ))}
                </table>
            </section>
        </div>
    );
}

const rootElement = document.getElementById('app');
ReactDOM.createRoot(rootElement).render(<List/>);


