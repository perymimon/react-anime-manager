import {APPEAR, SWAP, DISAPPEAR, STAY, useAnimeManager} from '../../src/useAnimeManager.js'
import {renderHook, act} from '@testing-library/react'

function doneAll(current) {
    return function () {
        //Slice because "REMOVE-done" make the array shorter
        let dones = current.slice().map(state => state.done())
        return Promise.all(dones)
    }
}

test('return array for array and object for object', async () => {
    const {result, rerender} = renderHook((args = []) => useAnimeManager(...args))

    rerender([[], {}])
    expect(result.current).toBeInstanceOf(Array)

    rerender([{id: 0}, 'id'])
    expect(result.current).toBeInstanceOf(Object)

})
test('test array items phases [ADD,DELETE]', async () => {
    const {rerender, result} = renderHook((items, options) => useAnimeManager(items, options))
    // render without items
    expect(result.current).toMatchObject([])

    rerender([10, 20, 30])

    // first run should mark all items with [phase=add]
    expect(result.current).toMatchObject([
        {item: 10, phase: APPEAR},
        {item: 20, phase: APPEAR},
        {item: 30, phase: APPEAR}
    ])

    await act(async () => {
        await result.current[1].done()
    })

    // // after done element should move to phase == static
    // expect(result.current).toMatchObject([
    //     {item: 10, phase: ADD},
    //     {item: 20, phase: STATIC},
    //     {item: 30, phase: ADD}
    // ])
    //
    // rerender([]) //<- REMOVE EVERYTHING
    // // just STATIC phase items should updated to phase=Remove
    // expect(result.current).toMatchObject([
    //     {item: 10, phase: ADD},
    //     {item: 20, phase: REMOVE},
    //     {item: 30, phase: ADD}
    // ])
    //
    // let untilDone = act(doneAll(result.current))
    // // after done immediately ADD should be STATIC and REMOVE should remove from the list
    // expect(result.current).toMatchObject([
    //     {item: 10, phase: STATIC},
    //     {item: 30, phase: STATIC}
    // ])
    //
    // // after 'onAnimationEnd' and 'forceRender' all state should move to next one
    // await untilDone
    // expect(result.current).toMatchObject([
    //     {item: 10, phase: REMOVE},
    //     {item: 30, phase: REMOVE}
    // ])
    //
    // // add REMOVED items before they're done should make them still in REMOVE phase
    // rerender([10, 30])
    // expect(result.current).toMatchObject([
    //     {item: 10, phase: REMOVE},
    //     {item: 30, phase: REMOVE}
    // ])
    //
    // // after done they should be removed
    // untilDone = act(doneAll(result.current))
    // expect(result.current).toMatchObject([])
    //
    // // after another render they should appere again as phase ADD
    // await untilDone
    // expect(result.current).toMatchObject([
    //     {item: 10, phase: ADD},
    //     {item: 30, phase: ADD}
    // ])

}, 500000)

test('test array items phases [MOVE]', async function (){
    const {rerender, result} = renderHook((items, options) => useAnimeManager(items, options))
    let untilDone = null;

    rerender([10,20,30])
    expect(result.current).toMatchObject([
        {item: 10, phase: APPEAR, from:Infinity, to:0},
        {item: 20, phase: APPEAR, from:Infinity, to:1},
        {item: 30, phase: APPEAR, from:Infinity, to:2}
    ])

    // change order before previous operation end still should be stable
    rerender([30,20,10])
    expect(result.current).toMatchObject([
        {item: 10, phase: APPEAR, from:Infinity, to:0},
        {item: 20, phase: APPEAR, from:Infinity, to:1},
        {item: 30, phase: APPEAR, from:Infinity, to:2}
    ])

    untilDone = act(doneAll(result.current))
    expect(result.current).toMatchObject([
        {item: 10, phase: STAY, from:0, to:0},
        {item: 20, phase: STAY, from:1, to:1},
        {item: 30, phase: STAY, from:2, to:2}
    ])

    await untilDone
    expect(result.current).toMatchObject([
        {item: 30, phase: SWAP, from:2, to:0},
        {item: 20, phase: SWAP, from:1, to:1},
        {item: 10, phase: SWAP, from:0, to:2}
    ])





})



// import { render, screen } from '@testing-library/react';
// import App from './App';
//
// test('renders learn react link', () => {
//     render(<App />);
//     const linkElement = screen.getByText(/learn react/i);
//     expect(linkElement).toBeInTheDocument();
// });
