import React, {useEffect} from "react";
import clsx from "clsx";
import Box from "@material-ui/core/Box";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import {makeStyles} from "@material-ui/core/styles";

import {Record} from "PersonalKanban/types";
import IconButton from "PersonalKanban/components/IconButton";
import {TextField} from "@material-ui/core";
import {RecordContext} from "../../containers/KanbanBoard";

const useStyles = makeStyles(() => ({
    paper: {
        height: 200,
    },
    description: {
        minHeight: "5rem",
        display: "-webkit-box",
        "-webkit-line-clamp": 4,
        "-webkit-box-orient": "vertical",
        overflow: "hidden",
        whiteSpace: "pre-line",
    },
}));

type CardProps = {
    record: Record;
    className?: string;
    style?: any;
    innerRef?: any;
    showEditAction?: boolean;
    showDeleteAction?: boolean;
    onDelete?: any;
    onEdit?: any;
};

const Card: React.FC<CardProps> = (props) => {
    const {handleRecordHours} = React.useContext(RecordContext)
    const {
        record,
        className,
        innerRef,
        style,
        showEditAction,
        showDeleteAction,
        onDelete,
        onEdit,
        ...rest
    } = props;
    const {title, description, createdAt} = record;

    const classes = useStyles();

    const handleEdit = React.useCallback(() => {
        onEdit(record)
    }, [record, onEdit]);

    const handleDelete = React.useCallback(() => onDelete(record), [
        record,
        onDelete,
    ]);

    const [hoursState, setHoursState] = React.useState<number>(record.hours || 0)

    const handleHoursState = React.useCallback((e) => {
        if(e.target.value >= 0){
            setHoursState(e.target.value)
        }
        handleRecordHours(record.id, Number(e.target.value))

    }, [hoursState])
    useEffect(() => {
        //console.log('render_card', record)
    }, [])
    return (
        <Paper
            className={clsx(classes.paper, className)}
            style={{...style, ...{display: "flex", flexDirection: "column", justifyContent: "spaceBetween"}}}
            ref={innerRef}
            {...rest}
        >
            <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography title={title} gutterBottom noWrap>
                    <b>{title}</b>
                </Typography>
                <Box display="flex" alignItems="center">
                    {showEditAction && <IconButton icon="edit" onClick={handleEdit}/>}
                    {showDeleteAction && (
                        <IconButton icon="deleteForever" onClick={handleDelete}/>
                    )}

                </Box>

            </Box>
            <Typography
                title={description}
                className={classes.description}
                style={{flex: 1}}
                variant="body2"
                gutterBottom
            >
                <Box display="flex" flexDirection="column" justifyContent="spaceBetween">
                    <Box display="flex" flexDirection="column">
                        {description}
                        <TextField
                            id="outlined-name"
                            label="Время"
                            type={"number"}
                            value={hoursState}
                            style={{width: "50%"}}
                            onChange={handleHoursState}
                        />

                    </Box>

                </Box>

                <Box display="flex" flexDirection="column" gridRowGap={5}>

                    <Box display="flex" flex={1} gridColumnGap={4}>
                        {
                            record.estimated_time ?
                                <>
                                    <Typography style={{fontSize: 12}}>Предполагаемое время</Typography>
                                    <Typography
                                        style={{fontWeight: 600, color: "gray", fontSize: 12}}>{record.estimated_time} ч</Typography>
                                </> : null
                        }
                    </Box>
                    {
                        record.start_date || record.end_date ?
                            <Typography component="p" style={{fontSize: 12}}>
                                Дата {<span style={{fontWeight: 600, color: "gray"}}>{record.start_date || ""} — <span
                                style={{color: "red"}}>{record.end_date || ""}</span></span>}
                            </Typography> :
                            null

                    }
                </Box>

            </Typography>
            <Typography component="p" variant="caption" noWrap>
                {createdAt}
            </Typography>
            <Typography component="p" style={{fontSize: 12}}>
                Изменено {record.changedDate}
            </Typography>
        </Paper>
    );
};

Card.defaultProps = {
    showDeleteAction: false,
    showEditAction: false,
};

export default Card;
