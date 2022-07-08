import './list.scss'
import {useAnimeManager} from '../../../src/useAnimeManager.js'

export default function List(props) {
    const {children, data, component, sortedKeys, ...otherProps} = props;
    const [dataState, transitions] = useAnimeManager(data, 'id', {debug: false});

    const list = transitions(({item, phase, done}, {dy, isMove}) => {
        const style = {
            '--dy': `${dy}px`,
        }
        return <li phase={phase} style={style} data-after-layout={isMove}
                   onAnimationEnd={done}
                   className="list-member">
            {component({...otherProps, ...item})}
        </li>
    })

    return (
        <ul className="list">
            {list}
        </ul>
    )
}
