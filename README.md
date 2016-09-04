# textdb
*Simple text based db for node.js*

#### Project goals are:

- in memory database, for nodejs
- can persist data (read/write) in a simple text based format
- support for relational data
- completely in javascript (actually, typescript)
- support for localstorage and use in browser (someday)


My usecase is for small (local) node applications. I want to be able to edit/read my
personal data in plain text, and not having the hassle to setup a real database.  

Also, if/when localStorage and browser is supported, this project may have an interest for some so-called isomorphic applications.

#### Status

This is a work VERY much in progress.  Please don't use this in production for anything important.

- not production ready AT ALL
- most likely not performant for many cases (still very naive implementation)
- all the DB data is loaded in memory.
- no persistence so far: it can only read from a folder, but not write to it yet
- basic implementation for update/delete operations.  These operations are probably not safe (for example, no check is done to make sure the new data is valid)

# Installation

With npm:
```
npm install textdb  --save
```

This package is written in typescript, and compiled for es2015.  I personally use the following flags to run it:
- --harmony: to enable general harmony features
- --harmony-destructuring: destructuring objects
- --harmony_default_parameters: default arguments for function parameters

In a node project, to import the main TextDB class:
```
var TextDB = require('textdb').default
```

Still not totally sure on the best way to proceed, but the 'default' part is still
necessary.  Someday, I will test and improve the build process.


# Short User Guide

To instantiate a new empty (in memory) DB:

```
var TextDB = require('textdb).default

var db = new TextDB()
```

To add a table to the DB:

```
  db.createTable('accounts', {
    id: {type: 'word'},
    initialBalance: {type: 'amount'},
    description: {type: 'string'}
  })

```

To insert a record:
```
  db.insert('accounts', {id: 'current', initialBalance: 1000, description: 'main account'})
  db.insert('accounts', {id: 'savings', initialBalance: 50000, description: 'savings account'})
```

To query the db:
```
    const account = db.query('accounts', {where: c => c.initialBalance > 2000})
```

To update a record:
```
    db.update('accounts', 'current', {initialBalance: 42})
```

To delete a record:
```
    db.delete('accounts', 'current')
```
Note that deleting a record will fail if the record is reachable by a 'many2one' field.



# Reading from a folder

A db can be created with a valid path
```
var db = new TextDB({path: '/path/to/my/data/folder'})
```

This will read all files from the folder, create the corresponding tables, and insert the records.  See the test/ folder for an example.

A valid textdb folder is a folder with:
- a  `__schema__.json` file, which contains a description of all the tables in the database
- a file for each of those tables, with one record per line

# Fields

## Basic fields

Here are the various type of fields currently supported:
- string
- integer
- word
- selection
- date
- amount

## Relational fields

In addition to those fields, textdb currently supports:

- many2one

Support for one2many will be added at some point.


