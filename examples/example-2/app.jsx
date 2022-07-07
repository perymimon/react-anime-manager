import './app.scss';
import List from './components/list.jsx';
import Employee from './components/employee.jsx';
import { useEmployees } from './service.js';
import Dialog from './components/dialog.jsx';
import React, {useRef, useState} from "react";
import ReactDOM from 'react-dom/client';

const rootElement = document.getElementById('app');
const root = ReactDOM.createRoot(rootElement);
root.render(
    <App />
);

function App() {
    const [employees, del, save] = useEmployees();
    const dialog = useRef();
    const form = useRef();

    const [employee, setCurrentEmployee] = useState(null);

    function handleEdit(employee) {
        setCurrentEmployee({...employee});
        dialog.current.showModal();
    }

    function handleSave() {
        let employeeEntries = Object.fromEntries(new FormData(form.current).entries())
        return save({id:employee.id, ...employeeEntries});
    }

    async function handleClickAddEmployee() {
        // demo purpose only
        dialog.current.showModal();
        const employee = await fetch('https://randomuser.me/api?inc=name,picture,dob,email,login')
            .then(res => res.json()).then(res => res.results[0]);

        setCurrentEmployee({
            name: employee.name.first,
            avatar: employee.picture.large,
            email: employee.email,
            age:employee.dob.age,
            role: 'chef', dealMode: 'full time', salary: '12k NIS',
            status: 'test period', statusPeriod: '2 months'
        });
    }

    return (
        <div className="app">
            <my-toolbar >
                <button className="fancy-button" onClick={handleClickAddEmployee}>add employee</button>
            </my-toolbar>
            <List data={employees} component={Employee} sortedKeys=""
                  onClickEdit={handleEdit}
                  onClickDelete={del}
            />

            <Dialog ref={dialog} onClickSave={handleSave}>
                <form ref={form} name="employee-edit">
                    <label htmlFor="name">name</label>
                    <input name="name" id="name" defaultValue={employee?.name} />
                    <label htmlFor="avatar">avatar</label>
                    <input name="avatar" id="avatar" defaultValue={employee?.avatar}/>
                    <label htmlFor="role">role</label>
                    <input name="role" id="role" defaultValue={employee?.role}/>
                    <label htmlFor="dealMode">deal mode</label>
                    <input name="dealMode" id="dealMode" defaultValue={employee?.dealMode}/>
                    <label htmlFor="salary">salary</label>
                    <input name="salary" id="salary" defaultValue={employee?.salary}/>
                    <label htmlFor="status">status</label>
                    <input name="status" id="status" defaultValue={employee?.status}/>
                    <label htmlFor="statusPeriod">status period</label>
                    <input name="statusPeriod" id="statusPeriod" defaultValue={employee?.statusPeriod}/>
                </form>
            </Dialog>
        </div>
    );
}
