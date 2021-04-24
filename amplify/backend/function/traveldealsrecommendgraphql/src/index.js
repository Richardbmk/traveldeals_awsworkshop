/* Amplify Params - DO NOT EDIT
	API_TRAVELDEALS_DEALTABLE_ARN
	API_TRAVELDEALS_DEALTABLE_NAME
	API_TRAVELDEALS_GRAPHQLAPIIDOUTPUT
	ENV
	REGION
Amplify Params - DO NOT EDIT */

const AWS = require('aws-sdk');
const awsConfig = new AWS.Config({region: process.env.REGION});

exports.handler = async (event) => {
  const personalizeParams = {
    campaignArn: process.env.PERSONALIZE_CAMPAIGN_ARN,
    numResults: '3',
    userId: event.arguments.userId,
  };
  
  const personalizeruntime = new AWS.PersonalizeRuntime(awsConfig);
  
  const data = await personalizeruntime.getRecommendations(personalizeParams).promise();
    const itemList = data.itemList;
  
  const recommendedItems = itemList.map(function(item) {
    const dynamodb = new AWS.DynamoDB(awsConfig);
    const dynamodbParams = {
        TableName: process.env.API_TRAVELDEALS_DEALTABLE_NAME,
        Key: { 'id' : { 'S': item.itemId } },
        AttributesToGet: [
          'id',
          'name',
          'category',
          'createdAt',
          'updatedAt'
        ],
    };
    return dynamodb.getItem(dynamodbParams).promise();    
  });

  const resolvedRecommendedItems = await Promise.all(recommendedItems);  
  const result = resolvedRecommendedItems.map((item) => {
    return { 
        id: item.Item.id.S, 
        name: item.Item.name.S,
        category: item.Item.category.S,
        createdAt: item.Item.createdAt.S,
        updatedAt: item.Item.updatedAt.S
    };
  });

  return result;
};
