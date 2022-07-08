import "./styles.css";
import useArray from '@perymimon/react-hooks/useArray'

export default function App() {
    let {array, push, pop} = useArray([1,2,3,4])

    return (
        <div className="App">
            <ul>
                {array.map(item=>(<li>{item}</li>))}
            </ul>
        </div>
    );
}
