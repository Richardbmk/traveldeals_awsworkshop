/**
 * 1. Generate users in a format ready for Cognito import.
 */
 const args = require('minimist')(process.argv.slice(2))
 const fs = require('fs');
 const faker = require('faker');
 
 const USER_COUNT = args['number'] || 30;
 
 const BASE_EMAIL = args['baseEmail'];
 if (!BASE_EMAIL || BASE_EMAIL.length === 0) {
     throw new Error('Missing "baseEmail" parameter.');
 }
 const emailSplit = BASE_EMAIL.split('@');
 const emailusername = emailSplit[0];
 const emaildomain = emailSplit[1];
 
 const csvHeader = "name,given_name,family_name,middle_name,nickname,preferred_username,profile,picture,website,email,email_verified,gender,birthdate,zoneinfo,locale,phone_number,phone_number_verified,address,updated_at,cognito:mfa_enabled,cognito:username";
 
 function generateCognitoUser() {
     let s = "";
     const name = faker.name;
     const firstName = name.firstName().replace(/\W/g, '');
     const lastName = name.lastName().replace(/\W/g, '');
     const username = `${firstName + lastName}`.toLowerCase();
     const email = `${emailusername}+${username}@${emaildomain}`;
 
     s += firstName + " " + lastName + ","; // name,
     s += "," // given_name,
     s += ","; // family_name,
     s += "," // middle_name,
     s += "," // nickname,
     s += "," // preferred_username,
     s += "," // profile,
     s += "," // picture,
     s += "," // website,
     s += email + ","; // email,
     s += "true," // email_verified,
     s += "," // gender,
     s += "," // birthdate,
     s += "," // zoneinfo,
     s += "," // locale,
     s += ","// phone_number,
     s += "false,"// phone_number_verified,
     s += "," // address,
     s += "," // updated_at,
     s += "false," // cognito:mfa_enabled,
     s += username // cognito:username
 
     return s;
 }
 
 function writeToFile(fileName, header, items) {
     let fd;
     try {
         fd = fs.openSync(fileName, 'w');
         fs.writeFileSync(fd, `${header}\n`);
         items.forEach(item => {
             fs.writeFileSync(fd, `${item}\n`);
         });
         console.log(`Data saved to: ${fileName}`);
     } catch (err) {
         console.log(err, err.stack);
     } finally {
         if (fd !== undefined) {
             fs.closeSync(fd);
         }
     }
 }
 
 const users = [];
 for (let i = 0; i < USER_COUNT; i++) {
     users.push(generateCognitoUser());
 }
 
 writeToFile(
     './cognito-users.csv', 
     csvHeader,
     users
 );
 