const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
const isValid = require("date-fns/isValid");
const app = express();
app.use(express.json());
let db = null;
const dbPath = path.join(__dirname, "todoApplication.db");
const initializeDbServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (Error) {
    console.log(`DB Error ${Error.Message}`);
    process.exit(1);
  }
};
initializeDbServer();

const hasRequestTodo = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};
const hasPriorityAndStatusAndCategoryValues = (requestQuery) => {
  return (
    requestQuery.priority !== undefined &&
    requestQuery.status !== undefined &&
    requestQuery.category !== undefined
  );
};
const hasPriorityAndValue = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusAndValue = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryAndValue = (requestQuery) => {
  return requestQuery.category !== undefined;
};

// API 1
app.get("/todos/", async (request, response) => {
  let data = null;
  let getSelectedTodo = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasPriorityAndStatusAndCategoryValues(request.query):
      if (priority == "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS " ||
          status === "DONE"
        ) {
          if (
            category === "LEARNING" ||
            category === "HOME" ||
            category === "WORK"
          ) {
            getSelectedTodo = `
            SELECT 
               *
            FROM 
               todo 
            WHERE 
               todo LIKE '%${search_q}%'
               AND priority = '${priority}'
               AND status = '${status}'
               AND category = '${category}'`;
            data = await db.all(getSelectedTodo);
            response.send(data.map((each) => hasRequestTodo(each)));
          } else {
            response.status(400);
            response.send("Invalid Todo Category");
          }
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.send(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasPriorityAndValue(request.query):
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        getSelectedTodo = `
        SELECT 
          *
        FROM 
           todo 
        WHERE 
           todo LIKE '%${search_q}%'
           AND priority = '${priority}';`;
        data = await db.all(getSelectedTodo);
        response.send(data.map((each) => hasRequestTodo(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasStatusAndValue(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getSelectedTodo = `
        SELECT 
           *
        FROM 
           todo 
        WHERE 
          todo LIKE '%${search_q}%'
          AND status = '${status}';`;
        data = await db.all(getSelectedTodo);
        response.send(data.map((each) => hasRequestTodo(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case hasCategoryAndValue(request.query):
      if (
        category === "HOME" ||
        category === "LEARNING" ||
        category === "WORK"
      ) {
        getSelectedTodo = `
        SELECT 
           * 
        FROM 
           todo 
        WHERE 
           todo  LIKE '%${search_q}%'
           AND category = '${category}';`;
        data = await db.all(getSelectedTodo);
        response.send(data.map((each) => hasRequestTodo(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    default:
      getSelectedTodo = `
        SELECT 
          * 
        FROM 
           todo 
        WHERE 
           todo LIKE '%${search_q}%';`;
      data = await db.all(getSelectedTodo);
      response.send(data.map((each) => hasRequestTodo(each)));
      break;
  }
});

//API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getSingleTodo = `
    SELECT 
       * 
    FROM 
      todo 
    WHERE 
       id = '${todoId}';`;
  const result = await db.get(getSingleTodo);
  response.send(hasRequestTodo(result));
});

//API 3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;

  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const requestQuery = `
        SELECT 
           * 
        FROM 
           todo 
        WHERE   
           due_date='${newDate}';`;
    const responseResult = await db.all(requestQuery);
    response.send(responseResult.map((eachItem) => hasRequestTodo(eachItem)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API 4
app.post("/todos/", async (request, response) => {
  const { id, todo, category, priority, status, dueDate } = request.body;
  if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const PreviousDate = format(new Date(dueDate), "yyyy-MM-dd");
          const getTodoList = `
    INSERT INTO 
        todo (id , todo , category  ,priority , status , due_date) 
     VALUES 
        (${id} , '${todo}' , '${category}' , '${priority}' , '${status}' , '${PreviousDate}');`;
          await db.run(getTodoList);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

//API 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const updateColumn = "";
  const requestBody = request.body;
  const listOfTodo = `
        SELECT 
           * 
        FROM 
           todo 
        WHERE 
           id = '${todoId}';`;
  const todosList = await db.get(listOfTodo);
  const {
    todo = todosList.todo,
    priority = todosList.priority,
    status = todosList.status,
    category = todosList.category,
    dueDate = todosList.category,
  } = request.body;

  let updateTodoList;

  switch (true) {
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoList = `
    UPDATE 
       todo 
    SET 
       todo='${todo}', 
       priority='${priority}', 
       status='${status}', 
       category='${category}',
       due_date='${dueDate}'
     WHERE 
        id = ${todoId};`;

        await db.run(updateTodoQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateTodoList = `
        UPDATE 
           todo 
        SET 
           todo = '${todo}'
           priority = '${priority}'
           status = '${status}'
           category = '${category}'
           due_date = '${dueDate}'
        WHERE 
           id = '${todoId}';`;
        await db.run(updateTodoList);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "LEARNING" ||
        category === "HOME"
      ) {
        updateTodoList = `
        UPDATE 
           todo 
        SET 
           todo = '${todo}'
           status = '${status}'
           priority = '${priority}'
           category = '${category}'
           due_date = '${dueDate}'
        WHERE 
           id = '${todoId}';`;
        await db.run(updateTodoList);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case requestBody.todo !== undefined:
      updateTodoList = `
        UPDATE  
           todo 
        SET 
          todo = '${todo}'
          priority = '${priority}'
          status = '${status}'
          category = '${category}'
          due_date = '${dueDate}'
        WHERE 
           id = '${todoId}';`;
      await db.run(updateTodoList);
      response.send("Todo Updated");
      break;
    case requestBody.dueDate !== undefined:
      if (isMatch(dateDate, "yyyy-MM-dd")) {
        const DateListQuery = format(new Date(dateDate), "yyyy-MM-dd");
        updateTodoList = `
            UPDATE 
               todo 
            SET 
              todo = '${todo}'
              priority = '${priority}'
              status = '${status}'
              category = '${category}'
              due_date = '${DataListQuery}';`;
        await db.run(updateTodoList);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
  }
});

//API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
    DELETE 
    FROM 
      todo
    WHERE 
       id = ${todoId};`;
  const dal = await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
