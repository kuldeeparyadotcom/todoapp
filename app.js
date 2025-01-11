const express = require('express');
const cors = require('cors');

// required for redis session store
const session = require('express-session');
const redis = require('redis');
const {RedisStore} = require("connect-redis")
const redisClient = redis.createClient( {host: 'localhost', port: 6379} );
redisClient.connect().catch(console.error)

// cassandra as database for the todos
const cassandra = require('cassandra-driver');
const client = new cassandra.Client({ contactPoints: ['localhost'], localDataCenter: 'datacenter1' });

// routes
const loginRouter = require('./routes/auth');

const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;

// open ai related imports
const { OpenAI } = require('openai');
const { sleep } = require('openai/core.mjs');
const { todo } = require('node:test');
const openai = new OpenAI(process.env.OPENAI_API_KEY);

// Enable CORS for all requests
app.use(cors());

app.use(bodyParser.json());
app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: "my-secret-key",
    resave: false,
    saveUninitialized: false
}));



// Initial set up
const keyspace_name = "todos";
keyspace_creation_query = `CREATE KEYSPACE IF NOT EXISTS ${keyspace_name} WITH REPLICATION = {'class': 'SimpleStrategy', 'replication_factor': 1}`;
client.execute(
    keyspace_creation_query, (err, result) => { 
        if (err) throw err
        console.log(`Keyspace ${keyspace_name} created`);
});

const todos_table_name = "todos";
const todos_table_creation_query = `CREATE TABLE IF NOT EXISTS ${keyspace_name}.${todos_table_name}  (
    id uuid PRIMARY KEY, 
    priority text, 
    username text, 
    task text, 
    status text, 
    insightsId uuid,
    eta timestamp, 
    last_update_timestamp timestamp
    );`;
    client.execute(todos_table_creation_query, (err, result) => {
    if (err) throw err
    console.log(`Table ${todos_table_name} created`);
});

// Create insights table for storing insights
const insights_table_name = "insights";
const insights_table_creation_query = `CREATE TABLE IF NOT EXISTS ${keyspace_name}.${insights_table_name}  (
    insightId uuid PRIMARY KEY, 
    todoId uuid, 
    insights text
    );`;

    client.execute(insights_table_creation_query, (err, result) => {
        if (err) throw err
        console.log(`Table ${insights_table_name} created`);
});

client.execute('CREATE INDEX IF NOT EXISTS ON todos.todos (priority);', (err, result) => {
    if (err) throw err
    console.log('priority index created');
});

client.execute('CREATE INDEX IF NOT EXISTS ON todos.todos (status);', (err, result) => {
    if (err) throw err
    console.log('status index created');
});

client.execute('CREATE INDEX IF NOT EXISTS ON todos.todos (username);', (err, result) => {
    if (err) throw err
    console.log('username index created');
});

app.use('/login', loginRouter);

// Get the todos by priority
app.get('/todos/priority/:priority', (req, res) => {
    const priority = req.params.priority;
    const query = "SELECT * FROM todos.todos WHERE priority = '" + priority + "'";
    client.execute(query, (err, result) => {
        if (err) throw err
        res.json(result.rows); 
    });
});

// Get the todos by status
app.get('/todos/status/:status', (req, res) => {
    const status = req.params.status;
    const query = "SELECT * FROM todos.todos WHERE status = '" + status + "'";
    client.execute(query, (err, result) => {
        if (err) throw err
        res.json(result.rows); 
    });
});

// Get the todo by id
app.get('/todos/:id', (req, res) => {
    const todoId = req.params.id;
    const query = "SELECT * FROM todos.todos WHERE id =" + todoId;
    client.execute(query, (err, result) => {
        if (err) throw err
        res.json(result.rows); 
    });
});

// Home page
app.get('/', (req, res) => {
    if (!req.session.views) {
        req.session.views = 1;        
    } else {
        req.session.views += 1;
    }   
    res.send(`You visited this page ${req.session.views} times`);
});


// Get all todos
app.get('/todos', (req, res) => {
    client.execute('select * from todos.todos', (err, result) => {
        if (err) throw err
        res.json(result.rows); 
    });
});

app.post('/todos', (req, res) => {
    const { eta, priority, task } = req.body;
    const id = uuidv4();
    const current_timestamp = new Date().toISOString();
    const username = req.session.username || "unknown";
    const status = "NotStarted";
    
    const query = "INSERT INTO todos.todos (id, eta, last_update_timestamp, priority, status, task, username) VALUES (" + id + ", '" + eta + "', '" + current_timestamp + "', '" + priority + "', '" + status + "', '" + task + "', '" + username + "'" + ")";
    console.log(query);
    client.execute(query, (err, result) => {
        if (err) throw err
        res.json({ id: id, eta: eta, last_update_timestamp: current_timestamp, priority: priority, status: status, task: task, username: username }); 
    });
});

app.delete('/todos/:id', (req, res) => {
    const todoId = req.params.id;
    const query = "DELETE FROM todos.todos WHERE id = " + todoId;
    client.execute(query, (err, result) => {
        if (err) throw err
        res.send("Success!"); 
    });
});

app.put('/todos/markdone/:id', (req, res) => {
    const todoId = req.params.id;
    const current_timestamp = new Date().toISOString();
    const username = req.session.username || "unknown";
    const query = "UPDATE todos.todos SET last_update_timestamp = '" + current_timestamp + "', status = 'Done'" + "WHERE id = " + todoId;
    console.log(query);
    client.execute(query, (err, result) => {
        if (err) throw err
        res.json({ id: todoId}); 
    });
});

app.put('/todos/status/:id', (req, res) => {
    const todoId = req.params.id;

    const { status } = req.body;
    console.log(status);
    if (status == 'Done' || status == 'NotStarted') {
        // update status
        const current_timestamp = new Date().toISOString();
        const query = "UPDATE todos.todos SET last_update_timestamp = '" + current_timestamp + "', status = '" + status + "' WHERE id = " + todoId;
        console.log(query);
        client.execute(query, (err, result) => {
            if (err) throw err
            res.json({ id: todoId, status: status });
        });
    } else {
        res.status(400).send('Invalid status');
    }
});

app.get('/todos/insights/:id', async (req, res) => {
    const todoId = req.params.id;

    // check if insightid is not null; if null, fetch insights from openai api and return response
    const result = await client.execute(`SELECT insightsid, task, eta FROM todos.todos WHERE id = ${todoId}`);
    const { insightsid, task, eta } = result.rows[0];
    console.log(`Just before fetching insights - todoId: ${todoId}, insightsid: ${insightsid}, task: ${task}, eta: ${eta}`);
    if (!insightsid && task && eta) {
        console.log("Going to fetch insights from Open AI API");
        // fetch insights from openai api
        const prompt = `Generate insights about a todo task that is due on ${eta} - '${task}'`;
        console.log(`Generated prompt - ${prompt}`);
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: `You are a very helpful assistant.
                    Don't ask the followup questions. Response as best as you can and call out the explicit assumptions made.
                    You read the given prompt, understand the importance of provided eta in order to come up with a very efficient plan to achieve it.
                    If eta is not provided, assume it to be 1 month from now.
                    For example - if user wants to learn AI to advance their career - you provide very specific list of items to achieve it within given eta;
                    that includes but not limited to - books, online courses, blogs to follow, people to follow, etc.
                    Similarly, Another example - if user plans to travel - you check the eta and provides all the insights such as
                    geographical and political conditions that may impact travel; any news or update in current affairs that may impact
                    the intended travel, in fact you provide even list of flights, trains, etc.
                    Overall you are one of the best personal secretaries in order to help the customer achieve the task` },
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });
        // Store this response in the insights table as well
        const id = uuidv4();
        // put this newly generated insights into the todos table as well
        client.execute(`UPDATE todos.todos SET insightsid = ${id} WHERE id = ${todoId}`, (err, result) => {
            if (err) throw err
            console.log(`Updated insightsid ${id} in todos table for todoId: ${todoId}`);
        });
        const insights = completion.choices[0].message.content;
        const query = "INSERT INTO todos.insights (insightId, todoId, insights) VALUES (?, ?, ?)";
        const params = [id, todoId, insights];
        console.log(query);
        client.execute(query, params, { prepare: true }, (err, result) => {
            if (err) throw err
            console.log(`Inserted insights in Insights table for todoId: ${todoId}`);
        }
        );

        console.log(`Just before returning insights - todoId: ${todoId}, insightsId: ${id}, insights: ${completion.choices[0].message.content}`);
        res.json({ insights: completion.choices[0].message.content });
    } else if (insightsid) {
        console.log(`Going to fetch insights from Insights table because inisight id is : ${insightsid}`);
        // fetch insights from insights table
        const query_fetch_insights = `SELECT insights FROM todos.insights WHERE insightid = ${insightsid}`;
        client.execute(query_fetch_insights, (err, result) => {
            if (err) throw err
            res.json(result.rows[0]);
        });

        console.log(`just fulfilled request to get the insights for todoId: ${todoId}`);
    } else {
        res.json({insights: "\n**Insights being generated for this newly added task shortly.*"});
    }
});

app.post('/insights/', async (req, res) => {
    const id = uuidv4();
    const { todoId, insights } = req.body;
    const current_timestamp = new Date().toISOString();
    const query = "INSERT INTO todos.insights (insightId, todoId, insights) VALUES (" + id + ", " + todoId + ", '" + insights + "')";
    console.log(query);
    client.execute(query, (err, result) => {
        if (err) throw err
        res.json({ insightId: id, todoId: todoId, insights: insights });
    });
});

app.get('/insights/:todoId', async (req, res) => {
    const todoId = req.params.todoId;
    const query = "SELECT * FROM todos.insights WHERE todoId = " + todoId;
    client.execute(query, (err, result) => {
        if (err) throw err
        res.json(result.rows); 
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
