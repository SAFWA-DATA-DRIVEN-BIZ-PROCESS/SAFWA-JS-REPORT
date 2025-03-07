# @jsreport/jsreport-express
[![NPM Version](http://img.shields.io/npm/v/@jsreport/jsreport-express.svg?style=flat-square)](https://npmjs.com/package/@jsreport/jsreport-express)

**jsreport extension adding http API**

See the documentation for API https://jsreport.net/learn/api and the node.js developers can visit also integration guide https://jsreport.net/learn/adapting-jsreport

## Changelog

### 3.7.1

- postpone setting http response timeout until the `req.options.timeout` is parsed

### 3.7.0

- add support for odata `ne` operator

### 3.6.0

- update deps to fix npm audit

### 3.5.0

- wait for jsreport initialization globally in middleware (this means that http routes will wait until jsreport is initialized before going to the route logic)

### 3.4.2

- update multer to fix npm audit

### 3.4.1

- filter out nested properties with visible false from odata outputs
- fix extensions not being able to modify meta.headers in afterRender

### 3.4.0

- add option `extensions.express.cors.enabled` to enable/disable cors handling in jsreport
- fix applying req.options.timeout when enableRequestReportTimeout is true

### 3.3.1

update multer to fix npm audit warning

### 3.3.0

use req.socket to listen on canceled request because req.connection was deprecated

### 3.1.0

- add `/api/schema/:entitySet` route to fetch json schema for entitySet
- don't crash when host header missing

### 3.0.1

fix for passing express app into options

### 3.0.0

Adaptations for the v3 APIs
