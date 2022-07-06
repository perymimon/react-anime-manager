import {renderHook, act} from '@testing-library/react-hooks'

import {STAY, APPEAR, useDataIntersectionWithFuture, DISAPPEAR, SWAP} from './useDataIntersectionWithFuture.js';
import useRenderCount from "@perymimon/react-hooks/src/debuging/useRenderCount.js";

describe('testing useStateWithBuffer', () => {

    let rerender, result, array, count, done;
    beforeEach(() => {
        ({rerender, result} = renderHook(
            ([tracking, options]) => {
                // console.log('rendering', tracking, options)
                return [useDataIntersectionWithFuture(tracking, options), useRenderCount()]
            },
            {initialProps: [void 0, void 0]}
        ));
        [[array, done], count] = result.current
    });

    async function rendering(...args) {
        return rerender(args)
    }

    async function acting(fn) {
        let wait = act(fn);
        [[array, done], count] = result.current;
        await wait;
        [[array, done], count] = result.current;
    }

    it('should return empty array when stat with "undefined"', () => {

        result.current
        expect(array).toBeDefined()
        expect(done).toStrictEqual(expect.any(Function))
        expect(count.loops).toBe(1)
        expect(array).toMatchObject([])

    })

    it('should return APPEAR for new items, and STAY after done', async () => {

        await acting(() => rendering([1, 2]));
        expect(array).toMatchObject([{
            key: 1, item: 1, from: 0, to: 0, phase: APPEAR
        }, {
            key: 2, item: 2, from: 1, to: 1, phase: APPEAR
        }])
        await acting(() => done(1));
        await acting(() => done(2));
        expect(array).toMatchObject([{
            key: 1, item: 1, from: 0, to: 0, phase: STAY
        }, {
            key: 2, item: 2, from: 1, to: 1, phase: STAY
        }])
    })
    it('should return SWAP for changed position items, and STAY after done', async () => {
        await acting(() => rendering([1, 2]));
        await acting(() => done(1));
        await acting(() => done(2));
        await acting(() => rendering([2, 1]));
        expect(array).toMatchObject([{
            key: 2, item: 2, from: 1, to: 0, phase: SWAP
        }, {
            key: 1, item: 1, from: 0, to: 1, phase: SWAP
        }])
        await acting(() => done(1));
        await acting(() => done(2));
        expect(array).toMatchObject([{
            key: 2, item: 2, from: 0, to: 0, phase: STAY
        }, {
            key: 1, item: 1, from: 1, to: 1, phase: STAY
        }])
    })
    it('should hold State until done is called', async () => {
        await acting(() => rendering([1]));
        await acting(() => rendering([]));
        expect(count.fullRender).toBeGreaterThanOrEqual(2)

        expect(array).toMatchObject([{
            key: 1, item: 1, from: 0, to: 0, phase: APPEAR
        }])

        let wait = acting(() => done(1));
        expect(array).toMatchObject([{
            key: 1, item: 1, from: 0, to: 0, phase: STAY
        }])

        await wait;
        expect(array).toMatchObject([{
            key: 1, from: 0, to: 0, phase: DISAPPEAR
        }])

    })
    it('should rerender STAY between phase changing, but not after DISAPPEAR', async () => {
        // console.log('loop track', 'after init \t\t', count)
        await acting(() => rendering([1, 2]));
        // console.log('loop track', 'after rerender with [1,2]\t', count)
        await acting(() => rendering([]));
        // console.log('loop track', 'after rerender with []\t\t', count)
        let wait = acting(() => done(1));
        // console.log('loop track', 'after called done(1)\t\t', count)
        expect(array).toMatchObject([{
            key: 1, item: 1, from: 0, to: 0, phase: STAY
        }, {
            key: 2, item: 2, from: 1, to: 1, phase: APPEAR
        }])
        expect(count.fullRender).toBeGreaterThanOrEqual(5)
        await wait;
        // console.log('loop track', 'after called await done(1)\t\t', count)
        expect(count.fullRender).toBeGreaterThanOrEqual(6)
        expect(array).toMatchObject([{
            key: 1, item: 1, from: 0, to: 0, phase: DISAPPEAR
        }, {
            key: 2, item: 2, from: 1, to: 1, phase: APPEAR
        }])
        wait = acting(() => done(1));
        expect(array).toMatchObject([{
            key: 2, item: 2, from: 1, to: 1, phase: APPEAR
        }])
        return wait;

    })


    it('should respect skip option with APPEAR', async () => {
        await acting(() => rendering([1, 2], [APPEAR]));
        expect(array).toMatchObject([{
            key: 1, item: 1, from: 0, to: 0, phase: STAY
        }, {
            key: 2, item: 2, from: 1, to: 1, phase: STAY
        }])
    })
    it('should respect skip option with APPEAR & DISAPPEAR ', async () => {
        await acting(() => rendering([1, 2], [APPEAR, DISAPPEAR]));
        await acting(() => rendering([], [APPEAR, DISAPPEAR]));
        expect(array).toMatchObject([])
    })
    it('should respect skip option with SWAP', async () => {
        await acting(() => rendering([1, 2], []));
        await acting(() => rendering([2, 1], [SWAP]));
        expect(array).toMatchObject([{
            key: 1, item: 1, from: 0, to: 0, phase: APPEAR
        }, {
            key: 2, item: 2, from: 1, to: 1, phase: APPEAR
        }])
        await acting(() => done(1));
        await acting(() => done(2));
        expect(array).toMatchObject([{
            key: 2, item: 2, from: 0, to: 0, phase: STAY
        }, {
            key: 1, item: 1, from: 1, to: 1, phase: STAY
        }])


    })
    it.todo('should hold DISAPPEAR items on there previous position')
    it.todo('should remove DISAPPEAR items from list they done and not let them came')
    it.todo('should track SWAP Items')
    it.todo('should ignore done on item with empty buffer phases')
    it.todo('should handle multiple states buffers for each item and shift state per item on each done')


})