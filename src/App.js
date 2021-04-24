import React from 'react';
import './App.css';

import PropTypes from 'prop-types';
import { BrowserRouter as Router, Route, NavLink, Link } from 'react-router-dom';
import { Divider, Form, Icon, Input, Modal, Button, Card, Menu, Dropdown, 
  Container, Header, Segment, Placeholder, Grid } from 'semantic-ui-react';

import Amplify, { Auth } from 'aws-amplify';
import { Analytics, AmazonPersonalizeProvider, AWSKinesisProvider } from '@aws-amplify/analytics';
import API, { graphqlOperation } from '@aws-amplify/api';
import { AuthState, onAuthUIStateChange } from '@aws-amplify/ui-components';
import { AmplifyAuthenticator, AmplifySignUp } from '@aws-amplify/ui-react';

import * as queries from './graphql/queries';
import * as mutations from './graphql/mutations';
import * as subscriptions from './graphql/subscriptions';

import faker from 'faker';

import awsconfig from './aws-exports';
Amplify.configure(awsconfig);

Analytics.autoTrack('pageView', {
  enable: true,
  type: 'SPA'
});

Analytics.autoTrack('event', {
  enable: true
});

Analytics.addPluggable(new AmazonPersonalizeProvider());
Analytics.addPluggable(new AWSKinesisProvider());

Analytics.configure({
  AmazonPersonalize: {
    trackingId: '', // TODO: Set to Personalize Tracking ID, e.g.: 'efd7edf5-7ddc-4732-b4b3-0374c6b721e9
    region: awsconfig.aws_project_region
  },
  AWSKinesis: {
    region: awsconfig.aws_project_region
  }
});

const CATEGORIES = ['Outdoors', 'Cities'];
const COLORS = ['orange', 'yellow', 'green', 'blue', 'violet', 'purple', 'pink'];

function DealCardImage({dealName, minHeight, fontSize}) {
  function dealColor(name) {
    if (!name) name = '';
    return COLORS[Math.floor(name.length % COLORS.length)];
  }

  return (
    <Segment style={{minHeight, display: 'flex'}} inverted color={dealColor(dealName)} vertical>
      <Header style={{margin: 'auto auto', fontSize}}>{dealName}</Header>
    </Segment>
  );
}

DealCardImage.propTypes = {
  dealName: PropTypes.string,
  minHeight: PropTypes.number,
  fontSize: PropTypes.number
};

function DealCreation() {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [name, setName] = React.useState();
  const [category, setCategory] = React.useState();
  
  function handleOpen() {
    handleReset();
    setModalOpen(true);
    Analytics.record({ name: 'createDeal-start'});
  };

  function handleReset() {
    setName(faker.address.city())
    setCategory(CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]);
  }

  function handleClose() {
    setModalOpen(false);
  };

  async function handleSave(event) {
    event.preventDefault();
    await API.graphql(graphqlOperation(mutations.createDeal, { input: { name, category }}));
    handleClose();
  };

  const options = CATEGORIES.map(c => ({ key: c, value: c, text: c}));

  return (
    <Modal
      closeIcon
      size='small'
      open={modalOpen}
      onOpen={handleOpen}
      onClose={handleClose}
      trigger={<p><Icon name='plus'/>Create new Deal</p>}>
      <Modal.Header>Create new Deal</Modal.Header>
      <Modal.Content>
        <Form>
            <Form.Field>
              <label>Deal Name</label>
              <Input fluid type='text' placeholder='Set Name' name='name' value={name || ''}
                onChange={(e) => { setName(e.target.value); } }/>
            </Form.Field>
            <Form.Field>
              <label>Category</label>
              <Dropdown fluid placeholder='Select Category' selection options={options} value={category}
                onChange={(e, data) => { setCategory(data.value); } }/>
            </Form.Field>
            {name ? (
              <DealCardImage dealName={name} minHeight={320} fontSize={48}/>
            ) : (
              <Segment style={{minHeight: 320}} secondary/>
            )}
        </Form>
      </Modal.Content>
      <Modal.Actions>
        <Button content='Cancel' onClick={handleClose}/>
        <Button primary labelPosition='right' content='Reset' icon='refresh' onClick={handleReset}/>
        <Button positive labelPosition='right' icon='checkmark' content='Save' href='/'
          disabled = {!(name && category)} 
          onClick={handleSave}
          data-amplify-analytics-on='click'
          data-amplify-analytics-name='createDeal-complete'
          data-amplify-analytics-attrs={`category:${category}`}/>
      </Modal.Actions>
    </Modal>
  );
};

function DealsListCardGroup({ items, pageViewOrigin, cardStyle }) {
  function dealCards() {
    return items
      .map(deal =>
        <Card
          key={deal.id}
          as={Link} to={{ pathname: `/deals/${deal.id}`, state: { pageViewOrigin } }}
          style={cardStyle}>

          <DealCardImage dealName={deal.name} minHeight={140} fontSize={24}/>
          <Card.Content>
            <Card.Header>{deal.name}</Card.Header>
            <Card.Meta><Icon name='tag'/> {deal.category}</Card.Meta>
          </Card.Content>
        </Card>
      );
  };

  return (
    <Card.Group centered>
      {dealCards()}
    </Card.Group>
  );
};

DealsListCardGroup.propTypes = {
  items: PropTypes.array,
  pageViewOrigin: PropTypes.string,
  cardStyle: PropTypes.object
};

function DealsList() {
  const [deals, setDeals] = React.useState([]);

  React.useEffect(() => {
    async function fetchData () {
      const result = await API.graphql(graphqlOperation(queries.listDeals, { limit: 1000 }));
      const deals = result.data.listDeals.items;
      setDeals(deals);
    }
    fetchData();
  }, []);

  React.useEffect(() => {
    let dealSubscription;
    async function fetchData() {
      dealSubscription = await API.graphql(graphqlOperation(subscriptions.onCreateDeal)).subscribe({
        next: (dealData) => {
          const newDeal = dealData.value.data.onCreateDeal;
          setDeals([...deals, newDeal]);
        }
      });
    }
    fetchData();

    return () => {
      if (dealSubscription) {
        dealSubscription.unsubscribe();
      }
    };
  });

  document.title = 'Travel Deals';
  return (
    <Container style={{ marginTop: 70 }}>
      <DealsListCardGroup items={deals} pageViewOrigin='Browse'/>
    </Container>
  );
};

function RecommendedDealsList({ recommendedDeals }) {
  return (
    <Segment style={{ margin: 'auto', width: '100%', maxWidth: 720 }}>
      <Header as='h2'>Recommended items for you:</Header>
      { recommendedDeals.length > 0 ? (
        <DealsListCardGroup
          items={recommendedDeals}
          pageViewOrigin='Recommendations'
          cardStyle={{ width: '100%', maxWidth: 220 }}/>
      ) : (
        <Grid columns={3}>
          <Grid.Column>
            <Placeholder>
              <Placeholder.Image rectangular/>
              <Placeholder.Line length='long'/>
              <Placeholder.Line/>
            </Placeholder>
          </Grid.Column>
          <Grid.Column>
            <Placeholder>
              <Placeholder.Image rectangular/>
              <Placeholder.Line length='long'/>
              <Placeholder.Line/>
            </Placeholder>
          </Grid.Column>
          <Grid.Column>
            <Placeholder>
              <Placeholder.Image rectangular/>
              <Placeholder.Line length='long'/>
              <Placeholder.Line/>
            </Placeholder>
          </Grid.Column>
        </Grid>
      ) }
    </Segment>
  );
};

RecommendedDealsList.propTypes = {
  recommendedDeals: PropTypes.array
};

function DealDetails({ id, locationState }) {
  const [deal, setDeal] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [recommendedDeals, setRecommendedDeals] = React.useState([]);

  React.useEffect(() => {
    async function loadDealInfo() {
      const dealResult = await API.graphql(graphqlOperation(queries.getDeal, { id }));
      const deal = dealResult.data.getDeal;
      setDeal(deal);
      setLoading(false);
      document.title = `${deal.name} - Travel Deals`;

      const user = await Auth.currentAuthenticatedUser();

      Analytics.record({
          eventType: 'PageView',
          userId: user.attributes.sub,
          properties: {
              itemId: deal.id
          }
      }, 'AmazonPersonalize');

      const recommendedDealsResult = await API.graphql(graphqlOperation(
        queries.getRecommendations, 
        { userId: user.attributes.sub }
      ));
      const recommendedDeals = recommendedDealsResult.data.getRecommendations;
      setRecommendedDeals(recommendedDeals);

      let pageViewOrigin = 'URL';
      if (locationState && locationState.pageViewOrigin) {
        pageViewOrigin = locationState.pageViewOrigin;
      }

      Analytics.record({
        data: {
          eventType: 'PageView',
          pageViewOrigin,
          userId: user.attributes.sub,
          itemId: deal.id,
          itemName: deal.name,
          itemCategory: deal.category,
          timestamp: new Date()
        },
        streamName: '' // TODO: Set to Kinesis Stream Name, and it has to include environment name too, e.g.: 'traveldealsKinesis-dev'
      }, 'AWSKinesis');
    };
    loadDealInfo();

    return () => {
      setDeal({});
      setLoading(true);
      setRecommendedDeals([]);
    };
  }, [id, locationState]);

  return (
    <Container>
      <NavLink to='/'><Icon name='arrow left'/>Back to Deals list</NavLink>
      <Divider hidden/>
      <Card key={deal.id} style={{ width: '100%', maxWidth: 720, margin: 'auto' }}>
        {loading ? (
          <Placeholder fluid style={{minHeight: 320}}>
            <Placeholder.Image/>
          </Placeholder>
        ) : (
          <DealCardImage dealName={deal.name} minHeight={320} fontSize={48}/>
        )}
        {loading ? (
          <Placeholder>
            <Placeholder.Line/>
            <Placeholder.Line/>          
          </Placeholder>
        ) : (
          <Card.Content>
            <Card.Header>{deal.name}</Card.Header>
            <Card.Meta><Icon name='tag'/> {deal.category}</Card.Meta>
          </Card.Content>
        )}

      </Card>
      <Divider hidden/>
      <RecommendedDealsList recommendedDeals={recommendedDeals}/>
    </Container>
  );
};

DealDetails.propTypes = {
  id: PropTypes.string,
  locationState: PropTypes.object
};

function AuthStateApp() {  
  const [authState, setAuthState] = React.useState();
  const [user, setUser] = React.useState();

  React.useEffect(() => {
    onAuthUIStateChange((nextAuthState, authData) => {
      setAuthState(nextAuthState);
      setUser(authData);
  
      if (authData) {
        const { email, sub } = authData.attributes;
        Analytics.updateEndpoint({
          address: email,
          channelType: 'EMAIL',
          optOut: 'NONE',
          userId: sub,
          userAttributes: {
            username: [authData.username]
          }
        });
      }
    });
  }, []);
  
  document.title = 'Travel Deals';
  return authState === AuthState.SignedIn && user ? (
      <div className='App'>
        <Router>
          <Menu fixed='top' color='teal' inverted>
            <Menu.Menu>
              <Menu.Item header href='/'><Icon name='globe'/>Travel Deals</Menu.Item>
            </Menu.Menu>
            <Menu.Menu position='right'>
              <Menu.Item link><DealCreation/></Menu.Item>
              <Dropdown item simple text={user.username}>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => Auth.signOut()}><Icon name='power off'/>Log Out</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Menu.Menu>
          </Menu>
          <Container style={{ marginTop: 70 }}>
            <Route path='/' exact component={() => 
              <DealsList/>
            }/>
            <Route path='/deals/:dealId' render={props => 
              <DealDetails id={props.match.params.dealId} locationState={props.location.state}/>
            }/>
          </Container>
        </Router>
      </div>
  ) : (
      <AmplifyAuthenticator>
        <AmplifySignUp slot='sign-up' formFields={[
            { type: 'username' },
            { type: 'password' },
            { type: 'email' }
          ]}/>
      </AmplifyAuthenticator>
  );
};

export default AuthStateApp;
