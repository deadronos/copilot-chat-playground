Key Terminology Glossary: Express.js & GitHub Copilot SDK

This glossary is designed for new developers to quickly understand the core vocabulary of Express.js, a popular server-side web framework, and the GitHub Copilot SDK, which allows for the integration of AI agents into applications. Grasping these fundamental terms will make it easier to read official documentation, follow tutorials, and ultimately build more powerful and intelligent software.


--------------------------------------------------------------------------------


2. Express.js Core Concepts

This section covers the fundamental building blocks of the Express.js web application framework.

2.1. app

The app object is the main object that represents the Express application. It is created by calling the top-level express() function exported by the Express module.

Primary Uses

* Routing HTTP requests: The app object has methods for defining how the application responds to client requests with specific HTTP verbs (e.g., app.get(), app.post()).
* Configuring middleware: You use methods like app.use() to apply middleware to all routes or app.route() to apply middleware to a specific route.
* Rendering HTML views: The app object can be configured to use a template engine for rendering dynamic web pages (e.g., app.render()).

2.2. Error Handling

Error handling refers to how Express catches and processes errors that occur both synchronously and asynchronously during the request-response cycle. Express includes a built-in default error handler.

Key Concepts for New Developers

* Synchronous vs. Asynchronous: Express will automatically catch errors that occur in synchronous code. For errors in asynchronous functions, you must pass the error to the next() function (e.g., next(err)). Passing any argument other than the string 'route' to next() signals to Express that an error has occurred, causing it to skip all subsequent non-error-handling middleware.
* Middleware Signature: Error-handling middleware functions are unique because they have a special signature with four arguments instead of three: (err, req, res, next).

2.3. Middleware

Middleware functions are functions that have access to the request object (req), the response object (res), and the next function in the application's request-response cycle.

Think of middleware as a series of checkpoints. At each checkpoint, you can perform one of these four fundamental actions:

Task	What It Means for a Developer
Execute any code	You can run any JavaScript logic, such as logging request details or connecting to a database.
Make changes to req/res	You can add new properties to the request or response objects (e.g., req.requestTime = Date.now()) for later middleware to use.
End the request-response cycle	You can send a response back to the client immediately (e.g., using res.send()), which prevents any further middleware from running.
Call the next middleware	You can pass control to the next function in the middleware stack by calling next().

2.4. next()

The next() function is the third argument passed to a middleware function. When invoked, it executes the next middleware succeeding the current middleware in the stack.

Key takeaway for beginners: If your middleware doesn't end the request-response cycle by sending a response, you must call next(). Forgetting to do so is a common source of bugs where the browser request times out, because the request is left "hanging" with no resolution.

2.5. req (Request)

The req object represents the incoming HTTP request and has properties for the request's query string, parameters, body, HTTP headers, and more.

Common Properties

* req.params: An object containing properties mapped to named route "parameters." For a route like /users/:userId, the userId value would be available at req.params.userId.
* req.query: An object containing a property for each query string parameter in the route. For a URL like /search?q=express, the value would be at req.query.q.
* req.body: Contains key-value pairs of data submitted in the request body. req.body is empty by default. To access incoming request data (like from an HTML form or a JSON payload), you must first use a body-parsing middleware, such as express.json() or express.urlencoded(), which will populate this object for you.

2.6. res (Response)

The res object represents the HTTP response that an Express application sends when it gets an HTTP request.

Common Methods

* res.send(): Sends the HTTP response. The body can be a Buffer, a string (which sets the Content-Type to text/html), an object, or an array (which are sent as JSON).
* res.json(): Sends a JSON response. This method automatically sets the Content-Type header to application/json.
* res.render(): Renders a view template (like a Pug or EJS file) and sends the rendered HTML string to the client.

2.7. Router

An Express Router is an instance of middleware and routes that can be thought of as a "mini-application," created by calling the express.Router() function.

Its primary benefit is to create modular and mountable route handlers, which helps organize an application's code by grouping related routes into separate files.

2.8. Routing

Routing refers to how an application’s endpoints (URIs) respond to client requests.

It is defined using methods on the app or router object that correspond to HTTP methods, such as app.get() for GET requests and app.post() for POST requests.

Now that we have covered the core server-side concepts in Express, we will shift to the key terminology for integrating AI-powered development with the GitHub Copilot SDK.


--------------------------------------------------------------------------------


3. GitHub Copilot SDK Core Concepts

This section covers the key terms for integrating GitHub Copilot's agentic capabilities into custom applications.

3.1. Agentic Execution Loop

The Agentic Execution Loop is the core process that powers the GitHub Copilot agent. It is a multi-turn loop where the agent maintains state, creates plans, invokes tools, and executes commands, repeating these steps until it achieves a specified goal.

This matters because the SDK provides this production-tested loop as a runtime, so you don't have to build this complex orchestration logic from scratch. This allows you to focus on defining your application's unique logic and tools, while relying on a battle-hardened runtime for the complex task of AI orchestration.

3.2. Copilot CLI

The SDK is a programmable layer that exposes the agentic core of the GitHub Copilot CLI. It allows your application to control the CLI's production-tested execution loop—including its planning and tool-use capabilities—by communicating with it over a local JSON-RPC connection.

3.3. GitHub Copilot SDK

The GitHub Copilot SDK is a multi-platform Software Development Kit that allows developers to embed the agentic core of GitHub Copilot directly into any application or service.

* Node.js (@github/copilot-sdk)
* Python (copilot)
* Go (github.com/github/copilot-cli-sdk-go)
* .NET (GitHub.Copilot.SDK)

3.4. JSON-RPC

JSON-RPC is the communication protocol used for the interaction between the SDK Client, which runs in the developer's application, and the GitHub Copilot CLI, which runs in server mode.

3.5. MCP (Model Context Protocol)

MCP is a protocol that gives AI agents a standardized way to discover and use external tools and APIs. Instead of relying on imprecise natural language, MCP allows an agent to understand a tool's capabilities structurally, leading to more reliable and predictable integrations with systems like internal databases or operations tools.

3.6. Session

A session is an object that represents a multi-turn conversation with the Copilot agent, typically created using client.createSession(). It is used to send prompts and maintains the history and state for a specific task.

By maintaining state, the agent can understand follow-up questions and handle multi-step tasks, making the interaction feel like a coherent conversation rather than a series of isolated commands.

3.7. Tools

Tools are custom functions and capabilities that a developer can define and register with the SDK. The Copilot agent's planner can then intelligently decide when and how to call these custom tools as part of its multi-step plan to complete a given task.

As a developer, this allows you to extend the agent's core abilities with your own domain-specific logic, such as calling internal APIs or interacting with a proprietary database.
