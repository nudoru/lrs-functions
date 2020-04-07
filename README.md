# LRS Functions

Various things for messing around with statements in a Learning Locker LRS. These may work with others, but I'm testing against a SaaS hosted instance of Learning Locker.

Runs on Node.js.

Functional JS practices are followed throughout as I learn them. This does make the code look "funky" :P

## Secrets.json

Put the LRS endpoint and token in here. In Learning Locker, you'd create the store then make a client pointing towards it. Creating the client will generate the token.

Don't put any paths on the end point. The code will append the correct path for standard LRS and aggregate queries.

## Current Dev Focus

Aggregate queries using the MongoDB pipeline api.
