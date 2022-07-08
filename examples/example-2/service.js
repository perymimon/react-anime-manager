import useArray from "@perymimon/react-hooks/useArray";

export const data = [{
    id: 1,
    name: 'John',
    age: 30,
    avatar: 'https://randomuser.me/api/portraits/men/14.jpg',
    role: 'cooker',
    email: "p.mormon@example.com",
    dealMode: 'full time',
    salary: '12k NIS',
    status: 'test period',
    statusPeriod: '2 months'
}, {
    id: 2,
    name: 'Peter',
    age: 25,
    avatar: 'https://randomuser.me/api/portraits/men/11.jpg',
    role: 'chef',
    email: "tony.gauthier@example.com",
    dealMode: 'hours',
    salary: '12k NIS',
    status: 'test period',
    statusPeriod: '2 months',
}, {
    id: 3,
    name: 'Tony',
    age: 25,
    avatar: 'https://randomuser.me/api/portraits/men/13.jpg',
    role: 'cooker',
    email: "tony.gauthier@example.com",
    dealMode: 'hours',
    salary: '12k NIS',
    status: 'test period',
    statusPeriod: '2 months',
}]

export function useEmployees() {
    const {array, push, filter, update} = useArray(data);

    function deleteEmployee({id}) {
        filter(employee => employee.id !== id);
    }

    function saveEmployee(employee) {
        let index = array.findIndex(e => e.id === employee?.id)
        if (index === -1) {
            employee.id = `temp-` + array.length + 1;
            push(employee);
            return true
        }
        update(index, employee);
        return true
    }

    return [array, deleteEmployee, saveEmployee];
}