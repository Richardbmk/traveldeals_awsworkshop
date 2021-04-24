const args = require('minimist')(process.argv.slice(2))
const fs = require('fs');
const faker = require('faker');

const name = faker.name;
const firstName = name.firstName().replace(/\W/g, '');


console.log(firstName)