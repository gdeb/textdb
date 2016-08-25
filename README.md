# textdb
Simple text based db for node.js


This is a work VERY much in progress.  The goal is to have a small text based
database, which allows basic querying/updating.

My usecase is for small (local) node applications. I like to be able to edit/read my
personal data in plain text, and not having the hassle to setup a real database.

# Installation

With npm:
```
npm install textdb  --save
```

# How to require it

This package is written in Ecmascript 2015.  I personally use the following flags to run it:
- --harmony: to enable general harmony features
- --harmony-destructuring: destructuring objects
- --harmony_default_parameters: default arguments for function parameters

I will someday add a build, with a js file compiled in Ecmascript 5, to allow node users to simply require it without hassle.


# Current Status

- not production ready AT ALL
- most likely not performant for many cases (still very naive implementation)
- all the DB data is loaded in memory.  This is cool for small databases, but not a good idea for a large dataset.
- no way to update/remove/delete data
- no persistence so far: it can only read from a folder, but not write to it yet

# Short User Guide

To instantiate a new empty DB:

```
var TextDB = require('textdb)

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
    const account = db.select('accounts', {where: c => c.initialBalance > 2000})
```

## Reading from a folder

A db can be created with various options:
```
var db = new TextDB({path: '/path/to/my/data/folder'})
```

This will read all files from the folder, create the corresponding tables, and insert the records.  See the test/ folder for an example.
