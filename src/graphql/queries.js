/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getRecommendations = /* GraphQL */ `
  query GetRecommendations($userId: String) {
    getRecommendations(userId: $userId) {
      id
      name
      category
      createdAt
      updatedAt
      owner
    }
  }
`;
export const getDeal = /* GraphQL */ `
  query GetDeal($id: ID!) {
    getDeal(id: $id) {
      id
      name
      category
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listDeals = /* GraphQL */ `
  query ListDeals(
    $filter: ModelDealFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listDeals(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        name
        category
        createdAt
        updatedAt
        owner
      }
      nextToken
    }
  }
`;
