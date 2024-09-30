import React, { useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
    const [token, setToken] = useState(null);

    if (!token) {
        return <Login setToken={setToken} />;
    }

    return <Dashboard token={token} />;
}

export default App;
