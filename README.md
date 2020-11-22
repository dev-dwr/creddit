# Creddit

Creddit is a simple clone of reddit.

## Prerequisites

* NodeJS version 12.0.0 +
* PostgreSQL
* Redis

## Built with
* React - A JavaScript library for building user interfaces
* TypeScript - a superset of JavaScript
* GraphQL- a query, schema language for APIs 
* URQL - a GraphQL client that exposes a set of helpers for several frameworks
* NodeJS - JavaScript runtime environment
* PostgreSQL - relational database
* TypeORM - an Object-Relational Mapping that run in NodeJS
* Redis - in-memory data structure store, used as a database, cache
* NextJS - React framework that enables server-side rendering and generating static websites for React based web applications

## Installation
### Backend
First of all go to server/ directory and install all dependencies
```bash
yarn install
```
Then create PostgreSQL database(default name of database is "creddit")
```bash
createdb creddit 
```
Optional: turning on nodemon tool
```bash
yarn watch
```
Now you can start using backend on the [localhost](http://localhost:4000/graphql) after executing this command:
```bash
yarn dev
```
### Frontend

First of all go to web/ directory and install all dependencies

```bash
yarn install
```
Then you can start using frontend on the [localhost](http://localhost:3000) after executing this command:
```bash
yarn dev
```


## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.



