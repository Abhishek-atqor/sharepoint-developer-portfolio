import * as React from 'react';
import { PrimaryButton, TextField } from '@fluentui/react';
import { Table } from 'antd';
import { spfi, SPFx } from '@pnp/sp';
import "@pnp/sp/items";
import "@pnp/sp/lists";
import "@pnp/sp/webs";
import * as moment from 'moment';
import { ITimerWebPartProps } from './ITimerWebPartProps';

export interface ITimerWebPartState {
    name: string;
    startTime: Date | null;
    stopTime: Date | null;
    timerRunning: boolean;
    data: any[];
}

class TimerWebPart extends React.Component<ITimerWebPartProps, ITimerWebPartState> {
    private sp: any;

    constructor(props: ITimerWebPartProps) {
        super(props);

        this.sp = spfi().using(SPFx(this.props.context));

        this.state = {
            name: '',
            startTime: null,
            stopTime: null,
            timerRunning: false,
            data: []
        };
    }

    componentDidMount() {
        this.loadDataFromSharePoint();
    }

    loadDataFromSharePoint = async () => {
        try {
            const items = await this.sp.web.lists.getByTitle('TimerData').items.select('ID', 'Title', 'StartTime', 'StopTime', 'ElapsedTime')();
            this.setState({ data: items });
        } catch (error) {
            console.error('Error fetching data from SharePoint:', error);
        }
    };

    handleStart = () => {
        this.setState({
            startTime: new Date(),
            timerRunning: true
        });
    };

    handleStop = () => {
        this.setState({
            stopTime: new Date(),
            timerRunning: false
        });
    };

    handleSave = async () => {
        const { name, startTime, stopTime, data } = this.state;

        if (!name || !startTime || !stopTime) {
            alert("Please fill all fields and ensure the timer is stopped.");
            return;
        }

        const elapsedTime = (stopTime.getTime() - startTime.getTime()) / 1000; // seconds
        const listItem = {
            Title: name,
            StartTime: startTime.toISOString(),
            StopTime: stopTime.toISOString(),
            ElapsedTime: elapsedTime,
        };

        try {
            const addedItem = await this.sp.web.lists.getByTitle('TimerData').items.add(listItem);
            alert('Data saved successfully!');
            this.setState({
                data: [...data, { ...listItem, ID: addedItem.data.ID }],
                name: '',
                startTime: null,
                stopTime: null,
                timerRunning: false
            });
        } catch (error) {
            console.error('Error saving data to SharePoint:', error);
        }
    };

    render() {
        const { name, timerRunning, startTime, stopTime, data } = this.state;

        const columns = [
            { title: 'ID', dataIndex: 'ID', key: 'ID' },
            { title: 'Name', dataIndex: 'Title', key: 'Title' },
            {
                title: 'Start Time',
                dataIndex: 'StartTime',
                key: 'StartTime',
                render: (text: string) => moment(text).format('HH:mm:ss') // Format time
            },
            {
                title: 'Stop Time',
                dataIndex: 'StopTime',
                key: 'StopTime',
                render: (text: string) => moment(text).format('HH:mm:ss') // Format time
            },
            { title: 'Elapsed Time (s)', dataIndex: 'ElapsedTime', key: 'ElapsedTime' },
        ];

        return (
            <div style={{ padding: '10px' }}>
                <TextField
                    label="Name"
                    value={name}
                    onChange={(e, value) => this.setState({ name: value || '' })}
                    required
                    style={{ marginBottom: '10px' }}
                />
                <div>
                    <PrimaryButton
                        text="Start Time"
                        onClick={this.handleStart}
                        disabled={timerRunning}
                        style={{ marginRight: '10px' }}
                    />
                    <PrimaryButton
                        text="Stop Time"
                        onClick={this.handleStop}
                        disabled={!timerRunning}
                        style={{ marginRight: '10px' }}
                    />
                    <PrimaryButton
                        text="Save Data"
                        onClick={this.handleSave}
                        style={{ marginRight: '10px' }}
                    />
                </div>
                <div style={{ marginTop: '20px' }}>
                    {startTime && (
                        <p>
                            <strong>Start Time:</strong> {moment(startTime).format('HH:mm:ss')}
                        </p>
                    )}
                    {stopTime && (
                        <p>
                            <strong>Stop Time:</strong> {moment(stopTime).format('HH:mm:ss')}
                        </p>
                    )}
                </div>
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="ID"
                    pagination={false}
                />
            </div>
        );
    }
}

export default TimerWebPart;
