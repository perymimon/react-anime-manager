import {APPEAR, DISAPPEAR, STAY, useAnimeManager} from '../anime-manager.js'
import {renderHook, act} from '@testing-library/react'

function doneAll(current) {
    return function () {
        //Slice because "REMOVE-done" make the array shorter
        let dones = current.slice().map(state => state.done())
        return Promise.all(dones)
    }
}

// dont support this feature anymore
test.skip('test one object phases  ', async () => {
    const {rerender, result} = renderHook((items, options) => useAnimeManager(items, options))
    // render without items
    expect(result.current).toMatchObject([])

    rerender(10)

    // first run should mark all items with [phase=add]
    expect(result.current).toMatchObject(
        {item: 10, phase: APPEAR}
    )

    await act(async () => {
        await result.current.done()
    })
    // after done element should move to phase == static
    expect(result.current).toMatchObject({item: 10, phase: STAY})

    rerender(void 0) //<- REMOVE EVERYTHING
    // after empty item phase STATIC should update to REMOVE
    expect(result.current).toMatchObject({item: 20, phase: DISAPPEAR})

    let untilDone = act(doneAll(result.current))
    // after done() REMOVE should remove from the list
    expect(result.current).toMatchObject([])

    // after all async operation end it still empty
    await untilDone
    expect(result.current).toMatchObject([])


    rerender(20) //<-ADD ITEM
    expect(result.current).toMatchObject({item: 20, phase: APPEAR})

    rerender(30) //<--CHANGE ITEM IN middle operation
    //Nothing should change
    expect(result.current).toMatchObject({item: 20, phase: APPEAR})


    untilDone = act(() => result.current.done())
    // Add should move to STATIC when done
    expect(result.current).toMatchObject({item: 20, phase: STAY})

    await untilDone
    expect(result.current).toMatchObject({item: 30, phase: APPEAR})

    untilDone = act(() => result.current.done())
    expect(result.current).toMatchObject({item: 30, phase: STAY})

    await untilDone
    expect(result.current).toMatchObject({item: 30, phase: STAY})

}, 5000)

// import { render, screen } from '@testing-library/react';
// import App from './App';
//
// test('renders learn react link', () => {
//     render(<App />);
//     const linkElement = screen.getByText(/learn react/i);
//     expect(linkElement).toBeInTheDocument();
// });
