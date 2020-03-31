import React from 'react';
import { useProvide } from '@impress/react';

class User {
  store = 'John';
}

const UserNameEditor = () => {
  const user = useProvide(User);
  return (
    <>
      <input
        onChange={(e: any) => user.store = e.target.value}
        value={user.store}
      />
      <p>Hello {user.store}!</p>
    </>
  )
};

export const App = () => <UserNameEditor/>;
