
// src/index.ts
// TODO: Add express-validator functions to routes with input of any kind
import * as express from 'express'
import { Task } from './shared/Task';
import { TaskList } from './shared/TaskList';
import {DataStore} from './db/datalayer';
import { isIntString, isv4UUID} from './shared/util';
import validator = require('express-validator');

const app = express();
var port = 401;
let ds: DataStore = new DataStore();
ds.connectDb().then(message => {
    console.log(message);
}).catch(err => {
    console.log(err);
});

app.use(express.json());
app.use(validator());

app.get('/', (request, response, next) => {
    let resp: string = 'TaskList server is running';
    response.status(200);
    response.send(resp);
});


app.get('/api/lists/', (request, response) => {
    let skip: number;
    let limit: number;
    let queryString: string = request.query.q;

    let badInput = false;
    let errorMessage: string;

    if(request.query.skip && isIntString.test(request.query.skip)) {
        skip = Number(request.query.skip);
    } else {
        if(request.query.skip) {    // not an integer number
            errorMessage = 'skip parameter must be a whole number';
            badInput = true;
        }
    }

    if(request.query.limit && isIntString.test(request.query.limit)) {
        limit = Number(request.query.limit);
    } else {
        if(request.query.limit) {    // not an integer number
            errorMessage = 'limit parameter must be a whole number';
            badInput = true;
        }
    }

    if(badInput) {
        response.status(400);
        response.send('Bad parameter(s): '+ errorMessage);
    } else {
        let ds: DataStore  = new DataStore();
        ds.getTaskLists(queryString,skip,limit)
            .then(tlists => {
                response.status(200);
                response.json(tlists);
                response.send();
            })
            .catch(err => {
                response.status(400);
                response.json(err);
                response.send();
            });
    }
});

app.post('/api/lists/', (request, response) => {
    let taskList: TaskList = request.body;
    if((!taskList) || (!TaskList.validate(taskList))) {
        response.status(400);
        response.json('invalid JSON object');
        response.send;
    } else {
        let ds: DataStore = new DataStore();
        ds.createTaskList(taskList).then( () => {
            response.status(201);
            response.json('item created');
            response.send();
        })
        .catch(err => {
            response.status(409);
            response.json(err);
            response.send();
        });
    }
});

app.get('/api/list/:listId', (request, response) => {
    let listId: string = request.param('listId');
    if(!isv4UUID.test(listId)) {
        response.json('id must be a valid uuid');
        response.status(400);
        response.send();
    }
    // let ds: DataStore = new DataStore();
    ds.getTaskListById(listId)
        .then(tlists => {
            if(tlists.length == 0) {
                response.json('item not found');
                response.status(404);
                response.send();
            }
            response.json(tlists[0]);   // there can be only one
            response.status(200);
            response.send();
        })
        .catch(message => {
            response.json(message);
            response.status(400);
            response.send();
        })
});

app.post('/api/list/:listId/tasks', (request, response) => {
    let listId: string = request.param('listId');
    if(!isv4UUID.test(listId)) {
        response.json('id must be a valid uuid');
        response.status(400);
        response.send();
    }
    let ds: DataStore = new DataStore();

    let task: Task = request.body;
    if(!Task.validate(task)) {
        response.json('invalid JSON object');
        response.status(400);
        response.send();
    } else {
        ds.createTask(listId, task).then( () => {
            response.status(201);
            response.json('item created');
            response.send();
        })
        .catch(message => {
            response.status(409);
            response.json(message);
            response.send();
        });
    }

});

app.post('/api/list/:listId/task/:taskId/complete', (request, response) => {
    let listId: string = request.param('listId');
    if(!isv4UUID.test(listId)) {
        response.json('list id must be a valid uuid ' + listId);
        response.status(400);
        response.send();
        return;
    }

    let taskId: string = request.param('taskId');
    if(!isv4UUID.test(taskId)) {
        response.json('task id must be a valid uuid: ' + taskId);
        response.status(400);
        response.send();
        return;
    }
    let ds: DataStore = new DataStore();
    ds.markTaskCompleted(listId, taskId)
        .then(() => {
            response.status(201);
            response.json('task updated to complete');
            response.send();
    })
    .catch(message => {
        response.status(400);
        response.json(message);
        response.send();
    });
});

app.get('/api/createtasks/', (request, response) => {
    let ds: DataStore = new DataStore();
    const resp: string = ds.createTaskLists(40, 5);
    response.json(resp);
});

app.listen(port, () => {
    console.log(`App is listening on port ${port}`)
})