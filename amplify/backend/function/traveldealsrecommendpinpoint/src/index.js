/* Amplify Params - DO NOT EDIT
	API_TRAVELDEALS_DEALTABLE_ARN
	API_TRAVELDEALS_DEALTABLE_NAME
	API_TRAVELDEALS_GRAPHQLAPIIDOUTPUT
	ENV
	REGION
Amplify Params - DO NOT EDIT */

exports.handler = async (event) => {
    const AWS = require('aws-sdk');
    const awsConfig = new AWS.Config({region: process.env.REGION});
    const dynamodb = new AWS.DynamoDB(awsConfig);

    const endpoints = event.Endpoints;
    for (const idx in endpoints) {
        const el = endpoints[idx];

        const recommendedItemsPromises = el.RecommendationItems.map(function(id) {
            const dynamodbParams = {
                TableName: process.env.API_TRAVELDEALS_DEALTABLE_NAME,
                Key: { 'id' : { 'S': id } },
                AttributesToGet: [
                    'id',
                    'name'
                ],
            };
            return dynamodb.getItem(dynamodbParams).promise();    
        });
    
        const recommendedItems = await Promise.all(recommendedItemsPromises);

        const ids = [];
        const names = [];

        recommendedItems.forEach(item => {
            ids.push(item.Item.id.S);
            names.push(item.Item.name.S);
        })

        el.Recommendations = {
            'Id': ids,
            'Name': names
        };
    }
    
    return endpoints;
};
