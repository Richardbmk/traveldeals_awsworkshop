/**
 * 1. Pulls existing items from DynamoDB table.
 * 2. Pulls users from Cognito.
 * 3. Generate interaction output in format ready for Personalize import.
 * 
 * For usernames that start with vowels, interactions will be generated with items that have categories starting with vowels.
 * E.g. "johndoe" will interact with "Cities" category, but not with "Outdoors".
 */
 const AWS = require('aws-sdk');
 const args = require('minimist')(process.argv.slice(2))
 const fs = require('fs');
 const faker = require('faker');
 
 const INTERACTIONS_COUNT = args['number'] || 1000;
 
 async function scanDynamoDbItems(awsRegion, dealTableName) {
     if (!dealTableName || dealTableName.length === 0) {
         throw new Error('Missing "dealTableName" parameter.');
     }
 
     var awsConfig = new AWS.Config({region: awsRegion});
     const dynamodb = new AWS.DynamoDB(awsConfig);
     try {
         const items = await dynamodb.scan({
             TableName: dealTableName,
             AttributesToGet: [
                 'id',
                 'name',
                 'category',
             ],
         }).promise();
 
         return items.Items.map(item => { return { id: item.id.S, category: item.category.S, name: item.name.S } });
     } catch (e) {
         console.error(e);
     }
 }
 
 async function listCognitoUsers(awsRegion, userPoolId) {
     if (!userPoolId || userPoolId.length === 0) {
         throw new Error('Missing "userPoolId" parameter.');
     }
 
     var awsConfig = new AWS.Config({region: awsRegion});
     const cognito = new AWS.CognitoIdentityServiceProvider(awsConfig);
     try {
         const users = await cognito.listUsers({
             UserPoolId: userPoolId
         }).promise();
 
         return users.Users.map(user => ({ id: user.Attributes.find(el => el.Name == 'sub').Value, username: user.Username}));
     } catch (e) {
         console.error(e);
     }
 }
 
 const vowels = ['a', 'e', 'i', 'o', 'u', 'y'];
 function starstWithVowel(str) {
     return vowels.includes(str.toLowerCase().charAt(0));
 }
 
 function randomElement(arr) {
     return arr[Math.floor(Math.random() * arr.length)];
 }
 
 function randomInteraction(users, items) {
     const randomUser = randomElement(users);
     const vowelUsername = starstWithVowel(randomUser.username);
     const filteredItems = items.filter(item => {
         return vowelUsername === starstWithVowel(item.category);
     });
 
     const randomItem = randomElement(filteredItems.length > 0 ? filteredItems : items);    
     return `${randomUser.id},${randomItem.id},${faker.date.recent(14).getTime()}`;
 }
 
 function generateAllInteractions(users, items, n) {
     const interactions = []
     for (let i = 0; i < n; i++) {
         interactions.push(randomInteraction(users, items));
     }    
     return interactions;
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
 
 (async () => {
     const awsRegion = args['awsRegion'];
     if (!awsRegion || awsRegion.length === 0) {
         throw new Error('Missing "awsRegion" parameter.');
     }
 
     const items = (await scanDynamoDbItems(awsRegion, args['dealTableName']));
     writeToFile(
         './personalize-items.csv', 
         'ITEM_ID,CATEGORY,NAME', 
         items.map(item => `${item.id},${item.category},"${item.name}"`)
     );
 
     const users = await listCognitoUsers(awsRegion, args['userPoolId']);
     const interactions = generateAllInteractions(users, items, INTERACTIONS_COUNT);
     writeToFile(
         './personalize-interactions.csv', 
         'USER_ID,ITEM_ID,TIMESTAMP',
         interactions
     );
 })();
 