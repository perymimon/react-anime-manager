import './employee.scss'

export default function Employee(props) {
    const {onClickDelete, onClickEdit} = props;

    return (
        <div className="employee" name="employee">
            <div className="info" name="employee-basic-info">
                <img name="employee-avatar" src={props.avatar} alt="avatar"/>
                <p name="employee-name">{props.name}</p>
                <p name="employee-role">{props.role}</p>
            </div>

            <div className="info" name="employee-info">
                <p name="employee-salary">{props.salary}</p>
                <p name="employee-deal-mode">{props.dealMode}</p>

                <p name="employee-status">{props.status}</p>
                <p name="employee-status-period">{props.statusPeriod}</p>


            </div>
            <my-toolbar name="employee-toolbar">
                <button name="employee-edit" onClick={(e)=>onClickEdit?.(props,e)}>
                    <i className="las la-pen"></i>
                </button>
                <span className="pipe"/>
                <button name="employee-la" onClick={(e)=>onClickDelete?.(props,e)}>
                    <i className="las la-trash"></i>
                </button>
            </my-toolbar>
        </div>
    )

}
