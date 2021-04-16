import React from 'react';
import './App.css';
import Amplify, { Auth } from 'aws-amplify';
import { AmplifyAuthenticator, AmplifySignUp } from '@aws-amplify/ui-react';
import { AuthState, onAuthUIStateChange } from '@aws-amplify/ui-components';

import { Icon, Menu, Dropdown } from 'semantic-ui-react';

import awsconfig from './aws-exports';

Amplify.configure(awsconfig);

function AuthStateApp() {

  const [authState, setAuthState] = React.useState();
  const [user, setUser] = React.useState();

  React.useEffect(() => {
    onAuthUIStateChange((nextAuthState, authData) => {
      setAuthState(nextAuthState);
      setUser(authData);
    });
  }, []);

  document.title = 'Travel Deals';
  return authState === AuthState.SignedIn && user ? (
    <div className='App'>
      <Menu fixed='top' color='teal' inverted>
        <Menu.Menu>
          <Menu.Item header href='/'><Icon name='globe'/>Travel Deals</Menu.Item>
        </Menu.Menu>
        <Menu.Menu position='right'>
        <Dropdown item simple text={user.username}>
          <Dropdown.Menu>
            <Dropdown.Item onClick={() => Auth.signOut()}><Icon name='power off' />Log Out</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
        </Menu.Menu>
      </Menu>
    </div>
  ) : (
    <AmplifyAuthenticator>
      <AmplifySignUp slot='sign-up' formFields={[
          { type: 'username' },
          { type: 'password' },
          { type: 'email' },
      ]} />
    </AmplifyAuthenticator>
  );
};

export default AuthStateApp;